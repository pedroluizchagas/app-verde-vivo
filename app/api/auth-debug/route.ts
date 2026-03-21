import { NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/supabase/api-route-auth"
import { createClientWithToken, createServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const bearer = getAccessTokenFromRequest(request)

  const result: Record<string, unknown> = {
    receivedBearer: !!bearer,
    bearerLength: bearer?.length ?? 0,
    bearerPrefix: bearer ? bearer.substring(0, 20) + "..." : null,
    timestamp: new Date().toISOString(),
  }

  if (!bearer) {
    // Check which headers were actually received
    const headers: Record<string, string | null> = {
      authorization: request.headers.get("authorization"),
      "x-supabase-access-token": request.headers.get("x-supabase-access-token"),
      "content-type": request.headers.get("content-type"),
    }
    result.headers = headers
    result.error = "no_bearer_token"
    result.message = "Nenhum token encontrado nos headers da requisicao."
    return NextResponse.json(result, { status: 401 })
  }

  // Try validating with anon key client (same as api-route-auth.ts)
  try {
    const supabase = createClientWithToken(bearer)
    const { data, error } = await supabase.auth.getUser(bearer)
    if (error) {
      result.anonClientResult = "error_returned"
      result.anonClientError = error.message
    } else if (data?.user) {
      result.anonClientResult = "success"
      result.userId = data.user.id
      result.userEmail = data.user.email
    } else {
      result.anonClientResult = "no_user"
    }
  } catch (err) {
    result.anonClientResult = "threw"
    result.anonClientError = err instanceof Error ? err.message : String(err)
  }

  // Also try with service role client (original approach)
  try {
    const admin = createServiceRoleClient()
    const { data, error } = await admin.auth.getUser(bearer)
    if (error) {
      result.serviceRoleResult = "error_returned"
      result.serviceRoleError = error.message
    } else if (data?.user) {
      result.serviceRoleResult = "success"
    } else {
      result.serviceRoleResult = "no_user"
    }
  } catch (err) {
    result.serviceRoleResult = "threw"
    result.serviceRoleError = err instanceof Error ? err.message : String(err)
  }

  const ok = result.anonClientResult === "success" || result.serviceRoleResult === "success"
  return NextResponse.json(result, { status: ok ? 200 : 401 })
}
