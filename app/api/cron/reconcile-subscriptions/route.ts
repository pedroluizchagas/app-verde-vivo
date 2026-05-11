import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { retrieveStripeSubscription } from "@/lib/stripe/client";
import { sincronizarAssinaturaDoStripe } from "@/lib/stripe/sync";

export const runtime = "nodejs";

/**
 * Verifica se a requisicao tem permissao de cron:
 * - header `Authorization: Bearer ${CRON_SECRET}` (chamada manual / job externo); ou
 * - header `x-vercel-cron` (assinatura do agendador da Vercel).
 *
 * Aceitamos ambos para evitar travar quando o secret nao estiver setado em
 * preview/staging — mas em producao o CRON_SECRET deve estar definido.
 */
function autorizado(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;

  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;

  const auth = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const match = auth.match(/^\s*Bearer\s+(.+?)\s*$/i);
  return match?.[1]?.trim() === expected;
}

interface StripeApiError {
  code?: string;
  statusCode?: number;
}

function isResourceMissing(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as StripeApiError;
  return e.code === "resource_missing" || e.statusCode === 404;
}

export async function GET(request: Request) {
  const inicio = Date.now();

  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // service-role justificado: job interno, sem usuario autenticado no contexto.
  // Precisa ler/gravar em subscriptions e profiles globalmente.
  const admin = createServiceRoleClient();

  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("id, stripe_subscription_id, user_id, status")
    .in("status", ["active", "overdue"])
    .not("stripe_subscription_id", "is", null);

  if (error) {
    console.error("[cron] erro listando subscriptions:", error.message);
    return NextResponse.json({ error: "list_failed", message: error.message }, { status: 500 });
  }

  let scanned = 0;
  let driftCorrected = 0;
  let errors = 0;

  for (const sub of subs ?? []) {
    scanned += 1;
    const stripeId = sub.stripe_subscription_id as string | null;
    if (!stripeId) continue;

    try {
      const stripeSub = await retrieveStripeSubscription(stripeId);
      const resultado = await sincronizarAssinaturaDoStripe(admin, stripeId, {
        stripeSubscription: stripeSub,
      });
      if (resultado?.drift) driftCorrected += 1;
    } catch (err) {
      if (isResourceMissing(err)) {
        // Subscription nao existe mais no Stripe — marca como cancelada localmente.
        await admin
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", sub.id);
        await admin.from("profiles").update({ plan: null }).eq("id", sub.user_id);
        driftCorrected += 1;
      } else {
        errors += 1;
        console.error("[cron] erro reconciliando", stripeId, err);
      }
    }
  }

  const durationMs = Date.now() - inicio;
  return NextResponse.json({ scanned, drift_corrected: driftCorrected, errors, durationMs });
}
