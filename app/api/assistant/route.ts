import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { runAssistant, transcribeAudio } from "@/lib/agent/orchestrator"
import { validateIntent, executeIntent } from "@/lib/agent/registry"

export const runtime = "nodejs"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  const lowered = unwrapped.toLowerCase()
  if (lowered === "undefined" || lowered === "null") return undefined
  return unwrapped || undefined
}

function extractBearerToken(value: string): string | null {
  const m = String(value || "").match(/^\s*bearer\s+(.+?)\s*$/i)
  if (!m) return null
  const token = m[1]?.trim()
  return token ? token : null
}

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || ""
  const fromAuth = extractBearerToken(authHeader)
  if (fromAuth) return fromAuth

  const altHeader =
    request.headers.get("x-supabase-access-token") ||
    request.headers.get("x-access-token") ||
    request.headers.get("x-authorization") ||
    ""
  if (!altHeader) return null

  return extractBearerToken(altHeader) || altHeader.trim() || null
}

export async function POST(request: Request) {
  // Try to authenticate via Authorization header (mobile) first
  const bearer = getAccessToken(request)

  let user: { id: string } | null = null
  let authError: string | null = null
  if (bearer) {
    const headerSupabaseUrl = normalizeEnvValue(request.headers.get("x-supabase-url"))
    const headerSupabaseAnonKey = normalizeEnvValue(request.headers.get("x-supabase-anon-key"))
    const supabaseUrl = headerSupabaseUrl || normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const supabaseAnonKey = headerSupabaseAnonKey || normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "missing_supabase_env" }, { status: 500 })
    }
    try {
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
      const { data, error } = await supabase.auth.getUser(bearer)
      if (error || !data?.user?.id) {
        authError = "invalid_access_token"
      } else {
        user = { id: String(data.user.id) }
      }
    } catch {
      authError = "supabase_auth_failed"
    }
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
    return NextResponse.json({ error: authError || (bearer ? "not_authenticated" : "missing_access_token") }, { status: 401 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "missing_groq_api_key" }, { status: 500 })
  }

  // Require Plus plan for Iris
  try {
    const admin = createServiceRoleClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle()
    if (profile?.plan !== "plus") {
      return NextResponse.json(
        { error: "plan_required", message: "A Iris requer o Plano Plus." },
        { status: 403 }
      )
    }
  } catch {
    return NextResponse.json({ error: "plan_check_failed" }, { status: 500 })
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
          const exec = await executeIntent(user.id, body.intent, validation.value, bearer || undefined)
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

    const result = await runAssistant(user.id, text, mode, bearer || undefined)
    // Nota: o modo 'dry' pode ser usado futuramente para não executar ações.
    // Aqui, apenas retornamos a resposta; execução já ocorre no orquestrador.
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("/api/assistant error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
