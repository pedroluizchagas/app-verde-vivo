import { NextResponse } from "next/server"
import { authErrorResponse, requireUser } from "@/lib/auth/api"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser(request)

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
  } catch (err) {
    const authResponse = authErrorResponse(err)
    if (authResponse) return authResponse
    throw err
  }
}
