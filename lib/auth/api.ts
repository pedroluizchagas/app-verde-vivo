import type { SupabaseClient, User } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { createClient, createClientWithToken } from "@/lib/supabase/server"

export type Plan = "basic" | "plus"

export interface AuthContext {
  supabase: SupabaseClient
  user: User
  token: string | null
}

class UnauthorizedError extends Error {
  response: NextResponse
  constructor(response: NextResponse) {
    super("unauthorized")
    this.response = response
  }
}

export function extractBearerToken(request: Request | NextRequest): string | null {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization") || ""
  const match = authHeader.match(/^\s*Bearer\s+(.+?)\s*$/i)
  if (!match) return null
  const token = match[1]?.trim()
  return token ? token : null
}

async function resolveFromBearer(token: string): Promise<AuthContext | null> {
  try {
    const supabase = createClientWithToken(token)
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      if (error) console.error("[auth] bearer rejeitado:", error.message)
      return null
    }
    return { supabase, user: data.user, token }
  } catch (err) {
    console.error("[auth] erro validando bearer:", err)
    return null
  }
}

async function resolveFromCookies(): Promise<AuthContext | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    return { supabase, user, token: null }
  } catch {
    return null
  }
}

export async function getSupabaseFromRequest(
  request: Request | NextRequest
): Promise<AuthContext | null> {
  const token = extractBearerToken(request)
  if (token) {
    const fromBearer = await resolveFromBearer(token)
    if (fromBearer) return fromBearer
  }
  return resolveFromCookies()
}

export async function getOptionalUser(
  request: Request | NextRequest
): Promise<AuthContext | null> {
  return getSupabaseFromRequest(request)
}

export async function requireUser(
  request: Request | NextRequest
): Promise<AuthContext> {
  const auth = await getSupabaseFromRequest(request)
  if (!auth) {
    throw new UnauthorizedError(
      NextResponse.json(
        {
          error: "not_authenticated",
          message: "Requisição sem credencial válida. Faça login novamente.",
        },
        { status: 401 }
      )
    )
  }
  return auth
}

export async function requireUserWithPlan(
  request: Request | NextRequest,
  plan: Plan
): Promise<AuthContext> {
  const auth = await requireUser(request)
  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("plan")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (error) {
    throw new UnauthorizedError(
      NextResponse.json(
        { error: "plan_check_failed", message: "Erro ao validar plano da assinatura." },
        { status: 500 }
      )
    )
  }

  if (profile?.plan !== plan) {
    throw new UnauthorizedError(
      NextResponse.json(
        {
          error: "plan_required",
          message:
            plan === "plus"
              ? "Este recurso exige o Plano Plus."
              : "Este recurso exige um plano ativo.",
        },
        { status: 403 }
      )
    )
  }

  return auth
}

export function isAuthError(err: unknown): err is UnauthorizedError {
  return err instanceof UnauthorizedError
}

export function authErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof UnauthorizedError) return err.response
  return null
}
