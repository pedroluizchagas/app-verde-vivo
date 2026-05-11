import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { obterPeriodoSubscription } from "@/lib/types/stripe";
import { retrieveStripeSubscription } from "@/lib/stripe/client";

/**
 * Status canonico interno da assinatura, derivado de subscription.status do Stripe.
 * Mapeia os 8 estados oficiais para os 4 estados que a tabela aceita
 * (constraint `subscriptions.status` em scripts/legacy-migrations/023_subscriptions.sql):
 * 'pending' | 'active' | 'overdue' | 'cancelled' | 'inactive'.
 */
type StatusLocal = "active" | "overdue" | "cancelled" | "pending";

function mapearStatus(stripeStatus: Stripe.Subscription.Status): StatusLocal {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "overdue";
    case "canceled":
      return "cancelled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "pending";
    default:
      return "pending";
  }
}

/**
 * Identifica o plano local (basic/plus) a partir do price.id do item ativo.
 */
function inferirPlanoDePrice(priceId: string | undefined): "basic" | "plus" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_BASIC) return "basic";
  if (priceId === process.env.STRIPE_PRICE_PLUS) return "plus";
  return null;
}

interface ResultadoSync {
  subscriptionId: string;
  userId: string;
  plan: "basic" | "plus" | null;
  statusLocal: StatusLocal;
  drift: boolean;
}

/**
 * Sincroniza o estado de uma assinatura Stripe com as tabelas locais
 * `subscriptions` e `profiles`. E a fonte canonica de gravacao:
 * todos os handlers de webhook e o cron de reconciliacao delegam aqui.
 *
 * Le `current_period_end`/`current_period_start` direto do Stripe via
 * `obterPeriodoSubscription` da Fase 02. Nunca calcula periodos em JS.
 *
 * Exige um SupabaseClient com privilegios de gravacao em `subscriptions` e
 * `profiles` (service-role no webhook/cron).
 */
export async function sincronizarAssinaturaDoStripe(
  admin: SupabaseClient,
  subscriptionId: string,
  opts?: { stripeSubscription?: Stripe.Subscription },
): Promise<ResultadoSync | null> {
  const stripeSub: Stripe.Subscription =
    opts?.stripeSubscription ?? (await retrieveStripeSubscription(subscriptionId));

  const periodo = obterPeriodoSubscription(stripeSub);
  const periodStart = periodo.start ? new Date(periodo.start * 1000).toISOString() : null;
  const periodEnd = periodo.end ? new Date(periodo.end * 1000).toISOString() : null;
  const statusLocal = mapearStatus(stripeSub.status);
  const priceId = stripeSub.items.data[0]?.price?.id;
  const planoStripe = inferirPlanoDePrice(priceId);
  const cancelAtPeriodEnd = stripeSub.cancel_at_period_end === true;

  const userId =
    (typeof stripeSub.metadata?.user_id === "string" && stripeSub.metadata.user_id) || null;
  const subscriptionDbIdMeta =
    (typeof stripeSub.metadata?.subscription_db_id === "string" &&
      stripeSub.metadata.subscription_db_id) ||
    null;

  // Tenta localizar o registro local de tres formas, em ordem:
  // 1) stripe_subscription_id (caminho normal apos primeiro evento)
  // 2) id (metadata.subscription_db_id, ainda existente apenas em registros legados)
  // 3) user_id mais recente, criando o vinculo se necessario
  let dbRow: { id: string; user_id: string; plan: string | null } | null = null;

  {
    const { data } = await admin
      .from("subscriptions")
      .select("id, user_id, plan")
      .eq("stripe_subscription_id", stripeSub.id)
      .maybeSingle();
    if (data) dbRow = data;
  }

  if (!dbRow && subscriptionDbIdMeta) {
    const { data } = await admin
      .from("subscriptions")
      .select("id, user_id, plan")
      .eq("id", subscriptionDbIdMeta)
      .maybeSingle();
    if (data) dbRow = data;
  }

  if (!dbRow && userId) {
    const { data } = await admin
      .from("subscriptions")
      .select("id, user_id, plan")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) dbRow = data;
  }

  let drift = false;
  const plan = planoStripe ?? (dbRow?.plan as "basic" | "plus" | null) ?? null;

  if (!dbRow) {
    // Cria o registro a partir do Stripe (caminho do checkout sem pending orfa).
    if (!userId) {
      console.error(
        "[stripe-sync] subscription sem user_id no metadata e sem registro local:",
        stripeSub.id,
      );
      return null;
    }
    if (!plan) {
      console.error(
        "[stripe-sync] nao foi possivel inferir plano da subscription:",
        stripeSub.id,
        priceId,
      );
      return null;
    }
    const { data: inserted, error: insertErr } = await admin
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan,
        status: statusLocal,
        stripe_subscription_id: stripeSub.id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .select("id, user_id, plan")
      .single();
    if (insertErr || !inserted) {
      console.error("[stripe-sync] erro ao inserir subscription:", insertErr?.message);
      return null;
    }
    dbRow = inserted;
    drift = true;
  } else {
    const update: Record<string, unknown> = {
      stripe_subscription_id: stripeSub.id,
      status: statusLocal,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    };
    if (plan) update.plan = plan;
    const { error: updateErr } = await admin
      .from("subscriptions")
      .update(update)
      .eq("id", dbRow.id);
    if (updateErr) {
      console.error("[stripe-sync] erro ao atualizar subscription:", updateErr.message);
      return null;
    }
    drift = true;
  }

  // Atualiza profiles.plan coerentemente com o estado da assinatura.
  // `active` mantem o plano vigente; demais estados removem o plano para
  // bloquear o acesso pago (middleware/gating).
  const profilePlanUpdate: { plan: "basic" | "plus" | null } = {
    plan: statusLocal === "active" && plan ? plan : null,
  };
  // Se cancel_at_period_end e a assinatura ainda esta active, manter o plano
  // ate o fim do periodo (Stripe so emite customer.subscription.deleted
  // quando o periodo realmente expira).
  if (statusLocal === "active" && cancelAtPeriodEnd) {
    profilePlanUpdate.plan = plan;
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update(profilePlanUpdate)
    .eq("id", dbRow.user_id);
  if (profileErr) {
    console.error("[stripe-sync] erro ao atualizar profile.plan:", profileErr.message);
  }

  return {
    subscriptionId: dbRow.id,
    userId: dbRow.user_id,
    plan,
    statusLocal,
    drift,
  };
}
