import Groq from "groq-sdk"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  return unwrapped || undefined
}

export function createGroqClient() {
  const apiKey = normalizeEnvValue(process.env.GROQ_API_KEY)
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY env var")
  }
  return new Groq({ apiKey })
}
