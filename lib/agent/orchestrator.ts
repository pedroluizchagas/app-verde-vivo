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

  // Ajuste de data natural para schedule_visit: interpreta "segunda-feira", "amanhã" etc. como datas futuras
  if (parsed.intent === "schedule_visit") {
    const resolved = resolveNaturalDate(input)
    const provided = parsed.params?.scheduled_date as string | undefined
    const providedDate = provided ? new Date(provided) : null
    const now = new Date()

    // Se não veio data ou veio uma data passada e há uma data natural no texto, usa a resolvida
    if ((!provided || (providedDate && providedDate < now)) && resolved) {
      parsed.params = { ...(parsed.params || {}), scheduled_date: resolved }
    }
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

function resolveNaturalDate(text: string): string | undefined {
  const t = text.toLowerCase()
  const now = new Date()

  // Extrai horário "às 15h", "às 15:30", "15:00", "15h" e ajusta período
  let hour = 9
  let minute = 0
  const timePatterns = [
    /\b(?:às|as)\s*(\d{1,2})(?::(\d{2}))?\s*h?\b/i,
    /\b(\d{1,2}):(\d{2})\b/,
    /\b(\d{1,2})\s*h\b/,
  ]
  for (const rx of timePatterns) {
    const m = rx.exec(text)
    if (m) {
      hour = Math.max(0, Math.min(23, parseInt(m[1], 10)))
      minute = Math.max(0, Math.min(59, m[2] ? parseInt(m[2], 10) : 0))
      break
    }
  }
  const isAfternoon = /\bda tarde\b/.test(t)
  const isNight = /\bda noite\b/.test(t)
  const isMorning = /\bda manh[ãa]\b/.test(t)
  if ((isAfternoon || isNight) && hour < 12) hour += 12
  if (isMorning && hour === 12) hour = 8 // evita 12h como manhã

  const addDays = (d: number) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + d)
    dt.setHours(hour, minute, 0, 0)
    return dt.toISOString()
  }

  // Modificadores: próxima / que vem / semana que vem | esta / nesta
  const hasNext = /\b(próxima|proxima|que vem|semana que vem)\b/.test(t)
  const hasThis = /\b(esta|nesta)\b/.test(t) || /\besta semana\b/.test(t) || /\bnesta semana\b/.test(t)

  // amanhã / hoje / depois de amanhã
  if (/\bamanh[ãa]\b/.test(t)) return addDays(1)
  if (/\bhoje\b/.test(t)) return addDays(0)
  if (/\bdepois de amanh[ãa]\b/.test(t)) return addDays(2)

  // dias da semana (pt-BR)
  const weekdays: Record<string, number> = {
    domingo: 0,
    segunda: 1,
    'segunda-feira': 1,
    terca: 2,
    terça: 2,
    'terça-feira': 2,
    quarta: 3,
    'quarta-feira': 3,
    quinta: 4,
    'quinta-feira': 4,
    sexta: 5,
    'sexta-feira': 5,
    sabado: 6,
    sábado: 6,
    'sábado-feira': 6,
  }

  // encontra o primeiro dia da semana citado
  let targetDow: number | undefined
  for (const key of Object.keys(weekdays)) {
    if (t.includes(key)) {
      targetDow = weekdays[key]
      break
    }
  }
  if (typeof targetDow === 'number') {
    const currentDow = now.getDay() // 0..6 (domingo..sábado)

    if (hasThis) {
      // Este/nesta semana: somente hoje ou dias adiante nesta semana
      const deltaWithinWeek = targetDow - currentDow
      if (deltaWithinWeek < 0) return undefined // já passou nesta semana; peça confirmação
      return addDays(deltaWithinWeek)
    }

    let delta = (targetDow - currentDow + 7) % 7
    if (hasNext && delta === 0) delta = 7 // força próxima semana se pedida "próxima"
    if (!hasNext && delta === 0) delta = 7 // por padrão, "segunda" significa próxima segunda, não hoje
    // "semana que vem" sem dia específico não é resolvido aqui; precisa do dia
    if (hasNext) {
      // já está tratando próxima semana quando delta==0; se delta>0 mantém
    }
    return addDays(delta)
  }

  return undefined
}