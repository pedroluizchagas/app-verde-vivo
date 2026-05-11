import { NextResponse } from "next/server";
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
  idempotencyKey: z.string().trim().min(8).max(255).optional(),
});

/**
 * Valida que a URL gerada para success/cancel comeca pelo NEXT_PUBLIC_APP_URL.
 * Defesa em profundidade contra alteracoes futuras que aceitem URLs vindas do client.
 */
function validarUrlChecagem(url: string, base: string): boolean {
  try {
    const target = new URL(url);
    const expected = new URL(base);
    return (
      target.origin === expected.origin &&
      target.pathname.startsWith(expected.pathname.replace(/\/$/, "") || "/")
    );
  } catch {
    return false;
  }
}

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
    const { plan, idempotencyKey } = parsed.data;

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

    // Se ja existe uma subscription "viva" (active/pending/overdue), cancelamos a
    // anterior no Stripe para evitar cobranca duplicada. O webhook (customer.subscription.deleted)
    // ira atualizar o status no DB — nao precisamos manipular o registro local aqui.
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, plan, status")
      .eq("user_id", user.id)
      .in("status", ["active", "pending", "overdue"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub?.stripe_subscription_id) {
      try {
        await cancelStripeSubscription(existingSub.stripe_subscription_id);
      } catch {
        // Pode ja estar cancelada no Stripe; o webhook reconcilia.
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
    const successUrl = `${appUrl}/?checkout=success`;
    const cancelUrl = `${appUrl}/`;

    if (!validarUrlChecagem(successUrl, appUrl) || !validarUrlChecagem(cancelUrl, appUrl)) {
      return NextResponse.json(
        { error: "invalid_redirect", message: "URLs de redirecionamento invalidas." },
        { status: 500 },
      );
    }

    // Subscription pending orfã eliminada: o registro local so e criado pelo
    // webhook (`lib/stripe/sync.ts`) quando o Stripe confirma o pagamento.
    const { url: checkoutUrl } = await createStripeCheckoutSession({
      stripeCustomerId,
      priceId,
      userId: user.id,
      successUrl,
      cancelUrl,
      idempotencyKey,
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
