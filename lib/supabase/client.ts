import { createBrowserClient } from "@supabase/ssr"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  return unwrapped || undefined
}

export function createClient() {
  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check your integration setup.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
