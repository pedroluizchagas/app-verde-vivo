import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth/api";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listActiveStripeSubscriptions } from "@/lib/stripe/client";
import { sincronizarAssinaturaDoStripe } from "@/lib/stripe/sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request);

    // RLS protege: SELECT só atinge linhas onde auth.uid() = id.
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.plan) {
      return NextResponse.json({ activated: true, plan: profile.plan, alreadyActive: true });
    }

    const stripeCustomerId = (profile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id;
    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error: "stripe_customer_not_found",
          message: "Nenhum registro de pagamento encontrado. Inicie uma nova assinatura.",
        },
        { status: 404 },
      );
    }

    let activeStripeSubs: Awaited<ReturnType<typeof listActiveStripeSubscriptions>>;
    try {
      activeStripeSubs = await listActiveStripeSubscriptions(stripeCustomerId);
    } catch (err) {
      console.error("[verify-payment] Erro ao consultar Stripe:", err);
      return NextResponse.json(
        {
          error: "stripe_error",
          message: "Erro ao consultar pagamento. Tente novamente em alguns instantes.",
        },
        { status: 500 },
      );
    }

    if (activeStripeSubs.length === 0) {
      return NextResponse.json({
        activated: false,
        message:
          "Nenhuma assinatura ativa encontrada no Stripe. O pagamento pode ainda estar sendo processado — aguarde alguns minutos e tente novamente.",
      });
    }

    // service-role justificado: sincronizar uma assinatura ativa do Stripe quando o webhook
    // ainda nao processou. A funcao de sync precisa escrever em `profiles.plan` (protegido
    // pelo trigger de hardening contra updates do usuario comum) e em `subscriptions`.
    const admin = createServiceRoleClient();
    const stripeSub = activeStripeSubs[0];
    const resultado = await sincronizarAssinaturaDoStripe(admin, stripeSub.id, {
      stripeSubscription: stripeSub,
    });

    if (!resultado || !resultado.plan) {
      return NextResponse.json(
        {
          error: "subscription_sync_failed",
          message: "Falha ao sincronizar assinatura. Entre em contato com o suporte.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ activated: true, plan: resultado.plan });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    throw err;
  }
}
