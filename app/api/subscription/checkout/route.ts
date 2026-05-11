import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { authErrorResponse, requireUser } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  getOrCreateStripeCustomer,
  createStripeCheckoutSession,
  cancelStripeSubscription,
} from "@/lib/stripe/client";

export const runtime = "nodejs";

const PLAN_CONFIG = {
  basic: { label: "Plano Basico", priceId: () => process.env.STRIPE_PRICE_BASIC ?? "" },
  plus: { label: "Plano Plus", priceId: () => process.env.STRIPE_PRICE_PLUS ?? "" },
} as const;

const checkoutBodySchema = z.object({
  plan: z.enum(["basic", "plus"]),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request);

    const limited = await enforceRateLimit("checkout", user.id);
    if (limited) return limited;

    if (!user.email) {
      return NextResponse.json(
        {
          error: "email_required",
          message:
            "E-mail obrigatorio para cobranca. Use uma conta com e-mail ou atualize no provedor de login.",
        },
        { status: 422 },
      );
    }

    const parsed = checkoutBodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_plan", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const plan = parsed.data.plan;

    const priceId = PLAN_CONFIG[plan].priceId();
    if (!priceId) {
      return NextResponse.json(
        {
          error: "price_not_configured",
          message:
            "Preco do plano nao configurado. Verifique STRIPE_PRICE_BASIC / STRIPE_PRICE_PLUS nas variaveis de ambiente.",
        },
        { status: 500 },
      );
    }

    // RLS garante isolamento: o usuário só lê/edita o próprio profile e suas próprias subscriptions.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
    }

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, plan, status")
      .eq("user_id", user.id)
      .in("status", ["active", "pending", "overdue"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub) {
      if (existingSub.stripe_subscription_id) {
        try {
          await cancelStripeSubscription(existingSub.stripe_subscription_id);
        } catch {
          // Pode ja estar cancelada no Stripe
        }
      }
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", existingSub.id);

      if (existingSub.plan !== plan) {
        await supabase.from("profiles").update({ plan: null }).eq("id", user.id);
      }
    }

    let stripeCustomerId = (profile as { stripe_customer_id?: string | null }).stripe_customer_id;
    if (!stripeCustomerId) {
      stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email, profile.full_name);
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const subscriptionDbId = randomUUID();

    const { error: insertError } = await supabase.from("subscriptions").insert({
      id: subscriptionDbId,
      user_id: user.id,
      plan,
      status: "pending",
    });
    if (insertError) {
      console.error("[checkout] erro ao inserir subscription pendente:", insertError.message);
      return NextResponse.json(
        { error: "subscription_insert_failed", message: insertError.message },
        { status: 500 },
      );
    }

    const { url: checkoutUrl } = await createStripeCheckoutSession({
      stripeCustomerId,
      priceId,
      userId: user.id,
      subscriptionDbId,
      successUrl: `${appUrl}/?checkout=success`,
      cancelUrl: `${appUrl}/`,
    });

    return NextResponse.json({ paymentUrl: checkoutUrl });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    const message = err instanceof Error ? err.message : "Erro ao processar assinatura";
    console.error("[checkout] erro:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
