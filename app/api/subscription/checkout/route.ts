import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import {
  createAsaasCustomer,
  updateAsaasCustomer,
  createAsaasSubscription,
  cancelAsaasSubscription,
  findAsaasCustomerByExternalReference,
} from "@/lib/asaas/client"

export const runtime = "nodejs"

const PLAN_CONFIG = {
  basic: { label: "Plano Basico", value: 47.9 },
  plus: { label: "Plano Plus", value: 77.9 },
} as const

type Plan = keyof typeof PLAN_CONFIG

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const plan = body.plan as Plan
  if (plan !== "basic" && plan !== "plus") {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 })
  }

  const admin = createServiceRoleClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, asaas_customer_id, cpf_cnpj")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 })
  }

  const cpfCnpj = (profile as any).cpf_cnpj as string | null | undefined
  if (!cpfCnpj) {
    return NextResponse.json(
      { error: "cpf_cnpj_required", message: "Preencha seu CPF ou CNPJ no perfil antes de assinar." },
      { status: 422 }
    )
  }

  // Cancel any existing pending/active/overdue subscription before creating a new one
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id, asaas_subscription_id, plan, status")
    .eq("user_id", user.id)
    .in("status", ["active", "pending", "overdue"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingSub) {
    if (existingSub.asaas_subscription_id) {
      try {
        await cancelAsaasSubscription(existingSub.asaas_subscription_id)
      } catch {
        // Subscription may already be cancelled on Asaas side
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
    // Get or create Asaas customer
    let asaasCustomerId: string = profile.asaas_customer_id ?? ""
    if (!asaasCustomerId) {
      const found = await findAsaasCustomerByExternalReference(user.id)
      if (found) {
        asaasCustomerId = found.id
        // Update CPF/CNPJ in case customer was created before it was required
        if (!found.cpfCnpj) {
          await updateAsaasCustomer(asaasCustomerId, { cpfCnpj })
        }
      } else {
        const customer = await createAsaasCustomer({
          name: profile.full_name,
          email: user.email!,
          cpfCnpj,
          externalReference: user.id,
          notificationDisabled: false,
        })
        asaasCustomerId = customer.id
      }
      await admin
        .from("profiles")
        .update({ asaas_customer_id: asaasCustomerId })
        .eq("id", user.id)
    } else {
      // Customer ID already saved — ensure CPF/CNPJ is set in Asaas
      await updateAsaasCustomer(asaasCustomerId, { cpfCnpj })
    }

    // nextDueDate = tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDueDate = tomorrow.toISOString().split("T")[0]

    const config = PLAN_CONFIG[plan]
    const asaasSub = await createAsaasSubscription({
      customer: asaasCustomerId,
      billingType: "UNDEFINED",
      value: config.value,
      nextDueDate,
      cycle: "MONTHLY",
      description: `${config.label} - Verde Vivo / Iris`,
      externalReference: user.id,
    })

    const paymentLink = asaasSub.paymentLink ?? null

    await admin.from("subscriptions").insert({
      user_id: user.id,
      plan,
      status: "pending",
      asaas_subscription_id: asaasSub.id,
      asaas_customer_id: asaasCustomerId,
      payment_link: paymentLink,
    })

    if (!paymentLink) {
      console.error("[checkout] Asaas did not return a paymentLink for subscription", asaasSub.id)
      return NextResponse.json(
        { error: "payment_link_unavailable", message: "Link de pagamento nao disponivel. Tente novamente em instantes." },
        { status: 502 }
      )
    }

    return NextResponse.json({ paymentUrl: paymentLink })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar assinatura"
    console.error("[checkout] Asaas error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
