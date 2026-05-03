import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getAuthUserFromApiRequest } from "@/lib/supabase/api-route-auth"
import { listActiveStripeSubscriptions } from "@/lib/stripe/client"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const user = await getAuthUserFromApiRequest(request)
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, plan")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.plan) {
    return NextResponse.json({ activated: true, plan: profile.plan, alreadyActive: true })
  }

  const stripeCustomerId = (profile as any)?.stripe_customer_id as string | null | undefined
  if (!stripeCustomerId) {
    return NextResponse.json(
      {
        error: "stripe_customer_not_found",
        message: "Nenhum registro de pagamento encontrado. Inicie uma nova assinatura.",
      },
      { status: 404 }
    )
  }

  let activeStripeSubs: Awaited<ReturnType<typeof listActiveStripeSubscriptions>>
  try {
    activeStripeSubs = await listActiveStripeSubscriptions(stripeCustomerId)
  } catch (err) {
    console.error("[verify-payment] Erro ao consultar Stripe:", err)
    return NextResponse.json(
      { error: "stripe_error", message: "Erro ao consultar pagamento. Tente novamente em alguns instantes." },
      { status: 500 }
    )
  }

  if (activeStripeSubs.length === 0) {
    return NextResponse.json({
      activated: false,
      message:
        "Nenhuma assinatura ativa encontrada no Stripe. O pagamento pode ainda estar sendo processado — aguarde alguns minutos e tente novamente.",
    })
  }

  const stripeSub = activeStripeSubs[0]

  // Tenta encontrar o registro no banco pelo stripe_subscription_id
  let targetSubId: string | undefined
  let plan: string | undefined

  const { data: subByStripeId } = await admin
    .from("subscriptions")
    .select("id, plan")
    .eq("user_id", user.id)
    .eq("stripe_subscription_id", stripeSub.id)
    .maybeSingle()

  if (subByStripeId) {
    targetSubId = subByStripeId.id
    plan = subByStripeId.plan
  } else {
    // Fallback: assinatura pendente ainda nao associada ao Stripe
    const { data: pendingSub } = await admin
      .from("subscriptions")
      .select("id, plan")
      .eq("user_id", user.id)
      .in("status", ["pending", "overdue"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pendingSub) {
      targetSubId = pendingSub.id
      plan = pendingSub.plan
    }
  }

  if (!targetSubId || !plan) {
    return NextResponse.json(
      {
        error: "subscription_not_found",
        message: "Assinatura nao encontrada no banco de dados. Entre em contato com o suporte.",
      },
      { status: 404 }
    )
  }

  const now = new Date()
  const periodStart = stripeSub.current_period_start
    ? new Date(stripeSub.current_period_start * 1000)
    : now
  const periodEnd = stripeSub.current_period_end
    ? new Date(stripeSub.current_period_end * 1000)
    : (() => { const d = new Date(now); d.setMonth(d.getMonth() + 1); return d })()

  await admin
    .from("subscriptions")
    .update({
      stripe_subscription_id: stripeSub.id,
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", targetSubId)

  await admin.from("profiles").update({ plan }).eq("id", user.id)

  return NextResponse.json({ activated: true, plan })
}
