import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import type { AsaasWebhookPayload } from "@/lib/asaas/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN
  if (webhookToken) {
    const received = request.headers.get("asaas-access-token") ?? ""
    if (received !== webhookToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  let payload: AsaasWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const admin = createServiceRoleClient()
  const { event } = payload

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    const payment = payload.payment
    if (!payment?.subscription) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, user_id, plan")
      .eq("asaas_subscription_id", payment.subscription)
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

  if (event === "PAYMENT_OVERDUE") {
    const payment = payload.payment
    if (!payment?.subscription) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, user_id")
      .eq("asaas_subscription_id", payment.subscription)
      .maybeSingle()

    if (!sub) return NextResponse.json({ ok: true })

    await admin
      .from("subscriptions")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("id", sub.id)
  }

  if (event === "SUBSCRIPTION_DELETED") {
    const subData = payload.subscription
    if (!subData) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, user_id")
      .eq("asaas_subscription_id", subData.id)
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
