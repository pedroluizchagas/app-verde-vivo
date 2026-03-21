import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import {
  getAsaasPaymentLinkById,
  getAsaasSubscription,
  resolvePublicPaymentUrlFromSubscription,
} from "@/lib/asaas/client"

export const runtime = "nodejs"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, plan, status, asaas_subscription_id, payment_link")
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

  // Stored full HTTPS URL (correct format)
  const stored = sub.payment_link as string | null
  if (stored && /^https?:\/\//i.test(stored)) {
    return NextResponse.json({ paymentUrl: stored })
  }

  // Legacy: we mistakenly stored the payments link ID instead of the URL
  if (stored && !/^https?:\/\//i.test(stored)) {
    try {
      const pl = await getAsaasPaymentLinkById(stored)
      if (pl.url) {
        await admin
          .from("subscriptions")
          .update({ payment_link: pl.url, updated_at: new Date().toISOString() })
          .eq("id", sub.id)
        return NextResponse.json({ paymentUrl: pl.url })
      }
    } catch (e) {
      console.error("[reopen-payment] getAsaasPaymentLinkById (legacy id) failed:", e)
    }
  }

  if (!sub.asaas_subscription_id) {
    return NextResponse.json(
      { error: "payment_link_unavailable", message: "Assinatura sem ID no Asaas. Inicie uma nova assinatura." },
      { status: 404 }
    )
  }

  try {
    const asaasSub = await getAsaasSubscription(sub.asaas_subscription_id)
    const publicUrl = await resolvePublicPaymentUrlFromSubscription(asaasSub)

    if (!publicUrl) {
      return NextResponse.json(
        { error: "payment_link_unavailable", message: "Link de pagamento nao disponivel. Inicie uma nova assinatura." },
        { status: 404 }
      )
    }

    await admin
      .from("subscriptions")
      .update({ payment_link: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", sub.id)

    return NextResponse.json({ paymentUrl: publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao recuperar link de pagamento"
    console.error("[reopen-payment] Asaas error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
