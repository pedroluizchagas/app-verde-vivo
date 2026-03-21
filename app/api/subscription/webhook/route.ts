import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { constructStripeWebhookEvent } from "@/lib/stripe/client"
import type Stripe from "stripe"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET nao configurado")
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature") ?? ""
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = constructStripeWebhookEvent(rawBody, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Assinatura invalida"
    console.error("[webhook] Validacao falhou:", message)
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 })
  }

  const admin = createServiceRoleClient()

  // checkout.session.completed
  // - Associa o stripe_subscription_id ao registro pendente no banco
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const subscriptionDbId = session.metadata?.subscription_db_id
    const stripeSubscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id

    if (subscriptionDbId && stripeSubscriptionId) {
      await admin
        .from("subscriptions")
        .update({
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionDbId)
    }
  }

  // invoice.payment_succeeded
  // - Ativa a assinatura e atualiza o periodo vigente
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice
    const stripeSubscriptionId =
      typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id

    if (!stripeSubscriptionId) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, user_id, plan")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle()

    if (!sub) return NextResponse.json({ ok: true })

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await admin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", sub.id)

    await admin.from("profiles").update({ plan: sub.plan }).eq("id", sub.user_id)
  }

  // invoice.payment_failed
  // - Marca assinatura como inadimplente
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice
    const stripeSubscriptionId =
      typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id

    if (!stripeSubscriptionId) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle()

    if (!sub) return NextResponse.json({ ok: true })

    await admin
      .from("subscriptions")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("id", sub.id)
  }

  // customer.subscription.deleted
  // - Cancela a assinatura e remove o plano do perfil
  if (event.type === "customer.subscription.deleted") {
    const stripeSub = event.data.object as Stripe.Subscription

    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, user_id")
      .eq("stripe_subscription_id", stripeSub.id)
      .maybeSingle()

    if (!sub) return NextResponse.json({ ok: true })

    await admin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", sub.id)

    await admin.from("profiles").update({ plan: null }).eq("id", sub.user_id)
  }

  return NextResponse.json({ ok: true })
}
