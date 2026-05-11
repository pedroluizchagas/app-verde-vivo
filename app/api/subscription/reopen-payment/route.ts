import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authErrorResponse, requireUser } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  cancelStripeSubscription,
  createStripeCheckoutSession,
  createStripePortalSession,
} from "@/lib/stripe/client";

export const runtime = "nodejs";

const PLAN_PRICE_IDS: Record<string, () => string> = {
  basic: () => process.env.STRIPE_PRICE_BASIC ?? "",
  plus: () => process.env.STRIPE_PRICE_PLUS ?? "",
};

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request);

    const limited = await enforceRateLimit("checkout", user.id);
    if (limited) return limited;

    // RLS garante isolamento por user_id / id.
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, plan, status, stripe_subscription_id")
      .eq("user_id", user.id)
      .in("status", ["pending", "overdue"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: "no_pending_subscription", message: "Nenhuma assinatura pendente encontrada." },
        { status: 404 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (sub.status === "overdue" && sub.stripe_subscription_id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("stripe_customer_id")
          .eq("id", user.id)
          .maybeSingle();

        const stripeCustomerId = (profile as { stripe_customer_id?: string | null } | null)
          ?.stripe_customer_id;

        if (stripeCustomerId) {
          const portalUrl = await createStripePortalSession(stripeCustomerId, `${appUrl}/`);
          return NextResponse.json({ paymentUrl: portalUrl });
        }
      } catch (err: unknown) {
        console.error("[reopen-payment] Customer Portal error:", err);
        // Fallback: cria nova sessao de checkout abaixo
      }
    }

    const priceId = PLAN_PRICE_IDS[sub.plan]?.();
    if (!priceId) {
      return NextResponse.json(
        {
          error: "price_not_configured",
          message: "Preco do plano nao configurado. Verifique as variaveis de ambiente Stripe.",
        },
        { status: 500 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripeCustomerId = (profile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id;
    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error: "customer_not_found",
          message: "Cliente Stripe nao encontrado. Inicie uma nova assinatura.",
        },
        { status: 404 },
      );
    }

    if (sub.stripe_subscription_id) {
      try {
        await cancelStripeSubscription(sub.stripe_subscription_id);
      } catch {
        // Pode ja estar cancelada
      }
    }

    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    const newSubscriptionDbId = randomUUID();
    const { error: insertError } = await supabase.from("subscriptions").insert({
      id: newSubscriptionDbId,
      user_id: user.id,
      plan: sub.plan,
      status: "pending",
    });
    if (insertError) {
      console.error("[reopen-payment] erro ao inserir nova subscription:", insertError.message);
      return NextResponse.json(
        { error: "subscription_insert_failed", message: insertError.message },
        { status: 500 },
      );
    }

    const { url: checkoutUrl } = await createStripeCheckoutSession({
      stripeCustomerId,
      priceId,
      userId: user.id,
      subscriptionDbId: newSubscriptionDbId,
      successUrl: `${appUrl}/?checkout=success`,
      cancelUrl: `${appUrl}/`,
    });

    return NextResponse.json({ paymentUrl: checkoutUrl });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    const message = err instanceof Error ? err.message : "Erro ao recuperar link de pagamento";
    console.error("[reopen-payment] erro:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
