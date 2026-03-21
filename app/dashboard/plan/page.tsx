import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PlanCards } from "@/components/dashboard/plan-cards"
import { CreditCard } from "lucide-react"

export default async function PlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Gerenciar plano
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Escolha o plano ideal para o seu negocio de jardinagem.
        </p>
      </div>

      <PlanCards
        currentPlan={profile?.plan ?? null}
        subscription={subscription ?? null}
        trialDaysLeft={trialDaysLeft}
        trialEndsAt={trialEndsAt}
      />
    </div>
  )
}
