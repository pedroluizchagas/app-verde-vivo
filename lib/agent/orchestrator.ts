import { createGroqClient } from "@/lib/groq/client"
import { agentSystemPrompt, type AgentResponse } from "./schema"
import { validateIntent, executeIntent } from "./registry"
import { createClient as createSupabaseServer } from "@/lib/supabase/server"

export async function runAssistant(userId: string, input: string, mode: "dry" | "execute" = "execute"): Promise<{ reply: string; intent: string; result?: any; params?: any; critical?: boolean }> {
  const groq = createGroqClient()
  const context = await buildContext(userId)
  const model = process.env.GROQ_MODEL || process.env.NEXT_PUBLIC_ASSISTANT_MODEL || "llama-3.1-8b-instant"

  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: agentSystemPrompt + "\n\nContexto:\n" + context },
      { role: "user", content: input },
    ],
  })
  const text = completion.choices[0]?.message?.content ?? "{}"
  let parsed: AgentResponse
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { intent: "none", params: {}, reply: text }
  }

  const validation = validateIntent(parsed.intent, parsed.params)
  if (!validation.ok) {
    const needList = validation.need?.length ? `Campos faltantes: ${validation.need.join(", ")}.` : "Dados insuficientes."
    return { reply: `${parsed.reply || "Preciso de mais detalhes."} ${needList}`, intent: parsed.intent, result: { ok: false, need: validation.need }, params: parsed.params, critical: validation.critical }
  }

  if (mode === "dry") {
    // Não executar; retorna parâmetros validados e flag de ação crítica
    return { reply: parsed.reply ?? "Ok", intent: parsed.intent, result: { ok: false, dry: true }, params: validation.value, critical: validation.critical }
  }

  try {
    const exec = await executeIntent(userId, parsed.intent, validation.value)
    return { reply: parsed.reply ?? "Ok", intent: parsed.intent, result: exec, params: validation.value, critical: validation.critical }
  } catch (err: any) {
    return { reply: `Falha ao executar ação: ${err?.message ?? String(err)}`, intent: parsed.intent, result: { ok: false }, params: validation.value, critical: validation.critical }
  }
}

export async function transcribeAudio(file: File): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY!
  const model = process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3"
  const responseFormat = process.env.GROQ_TRANSCRIBE_FORMAT || "text"
  const form = new FormData()
  form.append("file", file)
  form.append("model", model)
  form.append("response_format", responseFormat)

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Erro na transcrição: ${res.status}`)
  return responseFormat === "json" ? JSON.stringify(await res.json()) : await res.text()
}

async function buildContext(userId: string): Promise<string> {
  const supabase = await createSupabaseServer()
  const clients = await supabase.from("clients").select("id, name").eq("gardener_id", userId).limit(20)
  const services = await supabase.from("services").select("id, name").eq("gardener_id", userId).limit(20)
  const products = await supabase.from("products").select("id, name").eq("gardener_id", userId).limit(20)

  const serialize = (label: string, arr?: any[]) => `${label}: ` + (arr || []).map((x) => `${x.name} (${x.id})`).join(", ")
  return [serialize("Clientes", clients.data), serialize("Serviços", services.data), serialize("Produtos", products.data)].join("\n")
}