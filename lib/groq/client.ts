import Groq from "groq-sdk"

export function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY env var")
  }
  return new Groq({ apiKey })
}