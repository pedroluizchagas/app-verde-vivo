import { NextResponse } from "next/server"

export const runtime = "nodejs"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  return unwrapped || undefined
}

export async function GET() {
  const envUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (!envUrl) {
    return NextResponse.json({ ok: false, error: "missing_supabase_url" }, { status: 500 })
  }
  const url = envUrl.replace(/\/+$/, "") + "/auth/v1/health"
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store", redirect: "manual" })
    const ok = res.ok
    const status = res.status
    return NextResponse.json({ ok, status }, { status: ok ? 200 : 503 })
  } catch (e: any) {
    const msg = String(e?.message || "")
    return NextResponse.json({ ok: false, error: msg }, { status: 503 })
  }
}
