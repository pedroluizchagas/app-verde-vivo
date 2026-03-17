import { createBrowserClient } from "@supabase/ssr"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  return unwrapped || undefined
}

export function createClient() {
  const primaryUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const primaryKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const expoUrl = normalizeEnvValue((process as any).env?.EXPO_PUBLIC_SUPABASE_URL)
  const expoKey = normalizeEnvValue((process as any).env?.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  let supabaseUrl = primaryUrl || expoUrl
  let supabaseAnonKey = primaryKey || expoKey

  if (supabaseUrl) {
    const isDev =
      typeof window !== "undefined" &&
      /^(localhost|127\.0\.0\.1)/i.test(window.location.hostname)
    if (!isDev && /^http:\/\//i.test(supabaseUrl) && !/localhost|127\.0\.0\.1/i.test(supabaseUrl)) {
      supabaseUrl = supabaseUrl.replace(/^http:\/\//i, "https://")
    }
    supabaseUrl = supabaseUrl.replace(/\/+$/, "")
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check your integration setup.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
