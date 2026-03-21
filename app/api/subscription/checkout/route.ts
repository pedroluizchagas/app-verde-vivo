import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getAuthUserFromApiRequest } from "@/lib/supabase/api-route-auth"
import {
  getOrCreateStripeCustomer,
  createStripeCheckoutSession,
  cancelStripeSubscription,
} from "@/lib/stripe/client"

export const runtime = "nodejs"

const PLAN_CONFIG = {
  basic: { label: "Plano Basico", priceId: () => process.env.STRIPE_PRICE_BASIC ?? "" },
  plus: { label: "Plano Plus", priceId: () => process.env.STRIPE_PRICE_PLUS ?? "" },
} as const

type Plan = keyof typeof PLAN_CONFIG

export async function POST(request: Request) {
  const user = await getAuthUserFromApiRequest(request)
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  if (!user.email) {
    return NextResponse.json(
      {
        error: "email_required",
        message: "E-mail obrigatorio para cobranca. Use uma conta com e-mail ou atualize no provedor de login.",
      },
      { status: 422 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const plan = body.plan as Plan
  if (plan !== "basic" && plan !== "plus") {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 })
  }

  const priceId = PLAN_CONFIG[plan].priceId()
  if (!priceId) {
    return NextResponse.json(
      {
        error: "price_not_configured",
        message: "Preco do plano nao configurado. Verifique STRIPE_PRICE_BASIC / STRIPE_PRICE_PLUS nas variaveis de ambiente.",
      },
      { status: 500 }
    )
  }

  const admin = createServiceRoleClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 })
  }

  // Cancela assinatura existente (pending/active/overdue) antes de criar nova
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id, stripe_subscription_id, plan, status")
    .eq("user_id", user.id)
    .in("status", ["active", "pending", "overdue"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingSub) {
    if (existingSub.stripe_subscription_id) {
      try {
        await cancelStripeSubscription(existingSub.stripe_subscription_id)
      } catch {
        // Pode ja estar cancelada no Stripe
      }
    }
    await admin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", existingSub.id)

    if (existingSub.plan !== plan) {
      await admin.from("profiles").update({ plan: null }).eq("id", user.id)
    }
  }

  try {
    // Busca ou cria cliente no Stripe
    let stripeCustomerId = (profile as any).stripe_customer_id as string | null | undefined
    if (!stripeCustomerId) {
      stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email!, profile.full_name)
      await admin
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://verdevivo.vercel.app"

    // Pre-gera o ID da assinatura no banco para referenciar nos metadados do Stripe
    const subscriptionDbId = randomUUID()

    // Insere registro de assinatura pendente antes da sessao de checkout
    await admin.from("subscriptions").insert({
      id: subscriptionDbId,
      user_id: user.id,
      plan,
      status: "pending",
    })

    const { url: checkoutUrl } = await createStripeCheckoutSession({
      stripeCustomerId,
      priceId,
      userId: user.id,
      subscriptionDbId,
      successUrl: `${appUrl}/?checkout=success`,
      cancelUrl: `${appUrl}/`,
    })

    return NextResponse.json({ paymentUrl: checkoutUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar assinatura"
    console.error("[checkout] Stripe error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
