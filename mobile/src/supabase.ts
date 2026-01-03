import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "").trim()
  if (!raw) return undefined
  const unwrapped = raw.replace(/^["'`]+/, "").replace(/["'`]+$/, "").trim()
  return unwrapped || undefined
}

const url = normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
const key = normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

if (!url || !key) {
  console.warn("Supabase env missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient(url || "https://invalid.supabase.co", key || "invalid", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
