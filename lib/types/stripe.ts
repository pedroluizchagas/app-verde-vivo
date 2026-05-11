import type Stripe from "stripe";

/**
 * Helpers para campos do Stripe que existem na resposta da API em runtime,
 * mas foram movidos/removidos das tipagens TS oficiais nas versões mais
 * recentes do SDK (Subscription.current_period_*, Invoice.subscription).
 *
 * Em vez de usar `as any` espalhado, expomos aqui acessos tipados com
 * narrow seguro via leitura via index signature.
 */

type ComCamposLegado<T> = T & Record<string, unknown>;

export function obterPeriodoSubscription(sub: Stripe.Subscription): {
  start?: number;
  end?: number;
} {
  const compat = sub as ComCamposLegado<Stripe.Subscription>;
  const start =
    typeof compat.current_period_start === "number" ? compat.current_period_start : undefined;
  const end = typeof compat.current_period_end === "number" ? compat.current_period_end : undefined;
  return { start, end };
}

export function obterSubscriptionIdDeInvoice(invoice: Stripe.Invoice): string | undefined {
  const compat = invoice as ComCamposLegado<Stripe.Invoice>;
  const direct = compat.subscription;
  if (typeof direct === "string") return direct;
  if (direct && typeof direct === "object" && "id" in direct && typeof direct.id === "string") {
    return direct.id;
  }
  const parent = compat.parent as unknown;
  if (parent && typeof parent === "object") {
    const detalhes = (parent as Record<string, unknown>).subscription_details;
    if (detalhes && typeof detalhes === "object") {
      const sub = (detalhes as Record<string, unknown>).subscription;
      if (typeof sub === "string") return sub;
      if (sub && typeof sub === "object" && "id" in sub && typeof sub.id === "string") {
        return sub.id;
      }
    }
  }
  return undefined;
}
