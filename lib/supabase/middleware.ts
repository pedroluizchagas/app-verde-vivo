import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  return unwrapped || undefined
}

export async function updateSession(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables in middleware")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isPublicRoute =
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/auth") ||
      request.nextUrl.pathname.startsWith("/api") ||
      request.nextUrl.pathname.startsWith("/_vercel") ||
      request.nextUrl.pathname.startsWith("/_next")

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (user && request.nextUrl.pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    const code = (error as any)?.code
    if (code === "refresh_token_not_found") {
      const toClear = request.cookies.getAll().filter((c) => c.name.startsWith("sb-"))
      if (toClear.length) {
        toClear.forEach(({ name }) => request.cookies.delete(name))
        supabaseResponse = NextResponse.next({ request })
        toClear.forEach(({ name }) => supabaseResponse.cookies.set(name, "", { maxAge: 0, path: "/" }))
      }
    } else {
      console.error("[v0] Error in middleware:", error)
    }
  }

  return supabaseResponse
}
