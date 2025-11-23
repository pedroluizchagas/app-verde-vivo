import { createClient } from "@supabase/supabase-js"

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined
const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined

if (!url || !key) {
  console.warn("Supabase env missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient(url || "https://invalid.supabase.co", key || "invalid")