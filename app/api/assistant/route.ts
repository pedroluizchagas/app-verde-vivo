import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runAssistant, transcribeAudio } from "@/lib/agent/orchestrator"
import { validateIntent, executeIntent } from "@/lib/agent/registry"

export const runtime = "nodejs"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  return unwrapped || undefined
}

export async function POST(request: Request) {
  // Try to authenticate via Authorization header (mobile) first
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || ""
  const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : null

  let user: { id: string } | null = null
  if (bearer) {
    const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const supabaseAnonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "missing_supabase_env" }, { status: 500 })
    }
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${bearer}`, apikey: supabaseAnonKey },
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.id) user = { id: String(data.id) }
      }
    } catch {}
  }

  // Fallback to cookie-based session (web)
  if (!user) {
    const supabase = await createClient()
    const { data: { user: cookieUser } } = await supabase.auth.getUser()
    if (cookieUser?.id) {
      user = { id: String(cookieUser.id) }
    }
  }
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "missing_groq_api_key" }, { status: 500 })
  }

  const contentType = request.headers.get("content-type") || ""
  try {
    let text: string | undefined
    let mode: "dry" | "execute" = "execute"

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const f: any = form as any
      const file = f.get ? (f.get("audio") as File | null) : null
      const prompt = f.get ? ((f.get("text") as string) || "") : ""
      const m = f.get ? (f.get("mode") as string | null) : null
      if (m === "dry" || m === "execute") mode = m
      if (file) {
        const transcript = await transcribeAudio(file)
        text = [prompt, transcript].filter(Boolean).join("\n")
      } else {
        text = prompt
      }
    } else {
      const body = await request.json()
      // Execução direta (pós-confirmação): intent + params
      if (body.intent && body.params) {
        const validation = validateIntent(body.intent, body.params)
        if (!validation.ok) {
          return NextResponse.json({ error: "invalid_params", need: validation.need }, { status: 400 })
        }
        try {
          const exec = await executeIntent(user.id, body.intent, validation.value)
          return NextResponse.json({ reply: "Ação executada", intent: body.intent, result: exec })
        } catch (err: any) {
          return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
        }
      }
      text = body.text as string
      if (body.mode === "dry" || body.mode === "execute") mode = body.mode
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "missing_text" }, { status: 400 })
    }

    const result = await runAssistant(user.id, text, mode)
    // Nota: o modo 'dry' pode ser usado futuramente para não executar ações.
    // Aqui, apenas retornamos a resposta; execução já ocorre no orquestrador.
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("/api/assistant error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
