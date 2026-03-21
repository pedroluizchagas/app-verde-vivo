import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createClient, createClientWithToken } from "@/lib/supabase/server"

function extractBearerToken(value: string): string | null {
  const m = String(value || "").match(/^\s*bearer\s+(.+?)\s*$/i)
  if (!m) return null
  const token = m[1]?.trim()
  return token ? token : null
}

export function getAccessTokenFromRequest(request: Request): string | null {
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

export async function getSupabaseAndUserFromApiRequest(
  request: Request
): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const bearer = getAccessTokenFromRequest(request)

  if (bearer) {
    try {
      // Validate the user JWT using the token client (anon key + bearer as Authorization header).
      // This does NOT require SUPABASE_SERVICE_ROLE_KEY — any valid user JWT is accepted by /auth/v1/user.
      const supabase = createClientWithToken(bearer)
      const { data, error } = await supabase.auth.getUser(bearer)
      if (!error && data?.user) {
        return { supabase, user: data.user }
      }
      console.error("[api-auth] bearer token rejected:", error?.message ?? "unknown error")
    } catch (err) {
      console.error("[api-auth] bearer token validation threw:", err)
    }
  } else {
    const pathname = new URL(request.url).pathname
    if (!pathname.startsWith("/api/subscription/webhook")) {
      console.warn("[api-auth] no bearer token found in request to", pathname)
    }
  }

  // Fallback: cookie-based session (web requests)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    return { supabase, user }
  } catch {
    return null
  }
}

export async function getAuthUserFromApiRequest(request: Request): Promise<User | null> {
  const auth = await getSupabaseAndUserFromApiRequest(request)
  return auth?.user ?? null
}
