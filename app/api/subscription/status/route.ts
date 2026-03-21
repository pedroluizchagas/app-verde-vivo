import { NextResponse } from "next/server"
import { getSupabaseAndUserFromApiRequest } from "@/lib/supabase/api-route-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const auth = await getSupabaseAndUserFromApiRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const { supabase, user } = auth

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle()

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan, status, current_period_start, current_period_end, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const trialEndsAt = profile?.trial_ends_at ?? null
  const trialDaysLeft =
    !profile?.plan && trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0

  return NextResponse.json({
    plan: profile?.plan ?? null,
    trial_ends_at: trialEndsAt,
    trial_days_left: trialDaysLeft,
    subscription: subscription ?? null,
  })
}
