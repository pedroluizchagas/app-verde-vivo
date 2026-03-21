import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createClient, createClientWithToken, createServiceRoleClient } from "@/lib/supabase/server"

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
      // Use the service role admin client to reliably validate any JWT
      const admin = createServiceRoleClient()
      const { data, error } = await admin.auth.getUser(bearer)
      if (!error && data?.user) {
        return { supabase: createClientWithToken(bearer), user: data.user }
      }
    } catch {
      // fall through to cookie session
    }
  }

  // Fallback: cookie-based session (web requests)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

export async function getAuthUserFromApiRequest(request: Request): Promise<User | null> {
  const auth = await getSupabaseAndUserFromApiRequest(request)
  return auth?.user ?? null
}
