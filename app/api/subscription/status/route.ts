import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle()

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan, status, current_period_start, current_period_end, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    plan: profile?.plan ?? null,
    subscription: subscription ?? null,
  })
}
