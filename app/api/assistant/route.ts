import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runAssistant, transcribeAudio } from "@/lib/agent/orchestrator"
import { validateIntent, executeIntent } from "@/lib/agent/registry"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
      const file = form.get("audio") as File | null
      const prompt = (form.get("text") as string) || ""
      const m = form.get("mode") as string | null
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