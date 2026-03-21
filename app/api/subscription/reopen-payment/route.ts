import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getAuthUserFromApiRequest } from "@/lib/supabase/api-route-auth"
import {
  cancelStripeSubscription,
  createStripeCheckoutSession,
  createStripePortalSession,
} from "@/lib/stripe/client"
import { randomUUID } from "crypto"

export const runtime = "nodejs"

const PLAN_PRICE_IDS: Record<string, () => string> = {
  basic: () => process.env.STRIPE_PRICE_BASIC ?? "",
  plus: () => process.env.STRIPE_PRICE_PLUS ?? "",
}

export async function POST(request: Request) {
  const user = await getAuthUserFromApiRequest(request)
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, plan, status, stripe_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["pending", "overdue"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json(
      { error: "no_pending_subscription", message: "Nenhuma assinatura pendente encontrada." },
      { status: 404 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://verdevivo.vercel.app"

  // Para assinatura inadimplente (pagamento falhou no Stripe): Customer Portal
  // O usuario pode atualizar o metodo de pagamento diretamente la.
  if (sub.status === "overdue" && sub.stripe_subscription_id) {
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle()

      const stripeCustomerId = (profile as any)?.stripe_customer_id as string | null | undefined

      if (stripeCustomerId) {
        const portalUrl = await createStripePortalSession(stripeCustomerId, `${appUrl}/`)
        return NextResponse.json({ paymentUrl: portalUrl })
      }
    } catch (err: unknown) {
      console.error("[reopen-payment] Customer Portal error:", err)
      // Fallback: cria nova sessao de checkout abaixo
    }
  }

  // Para assinatura pendente (checkout nao foi concluido) ou fallback do overdue:
  // Cria nova sessao de Checkout e substitui o registro pendente.
  const priceId = PLAN_PRICE_IDS[sub.plan]?.()
  if (!priceId) {
    return NextResponse.json(
      {
        error: "price_not_configured",
        message: "Preco do plano nao configurado. Verifique as variaveis de ambiente Stripe.",
      },
      { status: 500 }
    )
  }

  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle()

    const stripeCustomerId = (profile as any)?.stripe_customer_id as string | null | undefined
    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error: "customer_not_found",
          message: "Cliente Stripe nao encontrado. Inicie uma nova assinatura.",
        },
        { status: 404 }
      )
    }

    // Cancela assinatura pendente no Stripe se houver
    if (sub.stripe_subscription_id) {
      try {
        await cancelStripeSubscription(sub.stripe_subscription_id)
      } catch {
        // Pode ja estar cancelada
      }
    }

    // Atualiza registro atual como cancelado e cria novo pendente
    await admin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", sub.id)

    const newSubscriptionDbId = randomUUID()
    await admin.from("subscriptions").insert({
      id: newSubscriptionDbId,
      user_id: user.id,
      plan: sub.plan,
      status: "pending",
    })

    const { url: checkoutUrl } = await createStripeCheckoutSession({
      stripeCustomerId,
      priceId,
      userId: user.id,
      subscriptionDbId: newSubscriptionDbId,
      successUrl: `${appUrl}/?checkout=success`,
      cancelUrl: `${appUrl}/`,
    })

    return NextResponse.json({ paymentUrl: checkoutUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao recuperar link de pagamento"
    console.error("[reopen-payment] Stripe error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
