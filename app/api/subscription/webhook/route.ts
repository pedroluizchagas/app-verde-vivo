import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { constructStripeWebhookEvent } from "@/lib/stripe/client";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { obterSubscriptionIdDeInvoice } from "@/lib/types/stripe";
import { sincronizarAssinaturaDoStripe } from "@/lib/stripe/sync";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Eventos que delegam a sincronizacao para `lib/stripe/sync.ts`.
// Demais tipos sao registrados em stripe_events para auditoria mas nao executam logica.
const EVENTOS_TRATADOS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

function extrairSubscriptionId(event: Stripe.Event): string | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription === "string") return session.subscription;
      return session.subscription?.id ?? null;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      return sub.id;
    }
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      return obterSubscriptionIdDeInvoice(invoice) ?? null;
    }
    default:
      return null;
  }
}

export async function POST(request: Request) {
  // Proteção mínima de webhook: rate limit por IP antes da validação de assinatura,
  // para evitar consumo desnecessário do verifier do Stripe em caso de flood.
  const limited = await enforceRateLimit("webhook", getClientIp(request));
  if (limited) return limited;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET nao configurado");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature") ?? "";
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Assinatura invalida";
    console.error("[webhook] Validacao falhou:", message);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // service-role justificado: webhook administrativo do Stripe. Sem usuário autenticado
  // no contexto da requisição (chamada server-to-server), RLS não se aplica.
  const admin = createServiceRoleClient();

  // Idempotencia: tenta inserir o evento. Se ja existe e foi processado,
  // retorna 200 imediatamente; se existe mas falhou antes, tenta novamente.
  const { error: insertErr } = await admin
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type, payload: event as unknown as object });

  if (insertErr?.code === "23505") {
    const { data: existing } = await admin
      .from("stripe_events")
      .select("processed_at")
      .eq("event_id", event.id)
      .maybeSingle();
    if (existing?.processed_at) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }
    // Existe mas nao foi processado: prosseguir com a tentativa.
  } else if (insertErr) {
    console.error("[webhook] erro ao registrar evento Stripe:", insertErr.message);
    return NextResponse.json({ error: "event_store_failed" }, { status: 500 });
  }

  try {
    if (EVENTOS_TRATADOS.has(event.type)) {
      const subscriptionId = extrairSubscriptionId(event);
      if (subscriptionId) {
        // `customer.subscription.deleted` carrega o objeto Subscription completo no payload;
        // demais eventos podem trazer apenas o id. A sync busca via Stripe quando necessario.
        const stripeSubscription =
          event.type === "customer.subscription.deleted" ||
          event.type === "customer.subscription.updated" ||
          event.type === "customer.subscription.created"
            ? (event.data.object as Stripe.Subscription)
            : undefined;

        await sincronizarAssinaturaDoStripe(admin, subscriptionId, { stripeSubscription });
      }
    }

    await admin
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString(), error: null })
      .eq("event_id", event.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido";
    console.error(`[webhook] Erro processando ${event.type}:`, message);
    await admin.from("stripe_events").update({ error: message }).eq("event_id", event.id);
    // Retorna 500 para que o Stripe re-tente; o INSERT inicial nao ira recriar a linha,
    // mas como processed_at continua null, o re-tentativa entra pelo caminho normal.
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
