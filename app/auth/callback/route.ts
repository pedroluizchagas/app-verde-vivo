import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

const TRIAL_DAYS = 7

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard/plan"

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && sessionData.user) {
      const admin = createServiceRoleClient()

      const { data: profile } = await admin
        .from("profiles")
        .select("trial_ends_at, plan")
        .eq("id", sessionData.user.id)
        .maybeSingle()

      if (profile && !profile.trial_ends_at) {
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)
        await admin
          .from("profiles")
          .update({ trial_ends_at: trialEndsAt.toISOString() })
          .eq("id", sessionData.user.id)
      }

      const destination = profile?.plan ? next : "/dashboard/plan"
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=link_invalido`)
}
