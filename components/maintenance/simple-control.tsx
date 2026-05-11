"use client";

import { extrairMensagemErro } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Leaf, Bug } from "lucide-react";

interface PlanoPreferencias {
  preferred_weekday?: number | null;
  preferred_week_of_month?: number | null;
}

function computePreferredDate(plan: PlanoPreferencias | null | undefined): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const weekday = typeof plan?.preferred_weekday === "number" ? plan.preferred_weekday : 1;
  const weekOfMonth =
    typeof plan?.preferred_week_of_month === "number" ? plan.preferred_week_of_month : 1;
  const firstOfMonth = new Date(year, month, 1);
  const firstDow = firstOfMonth.getDay();
  const offsetToWeekday = (weekday - firstDow + 7) % 7;
  const day = 1 + offsetToWeekday + (weekOfMonth - 1) * 7;
  return new Date(year, month, day);
}

const typeConfig = {
  fertilization: {
    label: "Controle de adubação",
    icon: Leaf,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    borderColor: "border-l-emerald-500",
  },
  pests: {
    label: "Controle de pragas",
    icon: Bug,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    borderColor: "border-l-amber-500",
  },
  weeds: {
    label: "Controle de ervas daninhas",
    icon: Leaf,
    iconColor: "text-red-500 dark:text-red-400",
    iconBg: "bg-red-500/10",
    borderColor: "border-l-red-400",
  },
};

export function MaintenanceSimpleControl({
  planId,
  type,
}: {
  planId: string;
  type: "fertilization" | "pests" | "weeds";
}) {
  const supabase = createClient();
  const [nextDate, setNextDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    void (async () => {
      try {
        const { data: plan } = await supabase
          .from("maintenance_plans")
          .select("preferred_weekday, preferred_week_of_month")
          .eq("id", planId)
          .maybeSingle();

        let targetMonth: number | null = null;
        try {
          const { data: tmpl } = await supabase
            .from("plan_executions")
            .select("details, cycle")
            .eq("plan_id", planId)
            .eq("cycle", "template")
            .maybeSingle();
          const detalhesTmpl = (
            tmpl as { details?: { schedule?: Record<string, unknown> | null } | null } | null
          )?.details;
          const schedule = (detalhesTmpl?.schedule ?? null) as {
            fertilization_months?: number[];
            pests_months?: number[];
            weeds_months?: number[];
          } | null;
          const months =
            type === "fertilization"
              ? schedule?.fertilization_months || []
              : type === "pests"
                ? schedule?.pests_months || []
                : schedule?.weeds_months || [];
          if (Array.isArray(months) && months.length > 0) {
            const now = new Date();
            const cur = now.getMonth() + 1;
            const next = months.find((m: number) => m >= cur) ?? months[0];
            targetMonth = next;
          }
        } catch {}

        let d: Date;
        if (plan) {
          if (targetMonth) {
            const base = computePreferredDate({
              preferred_weekday: plan.preferred_weekday,
              preferred_week_of_month: plan.preferred_week_of_month,
            });
            d = new Date(base.getFullYear(), targetMonth - 1, base.getDate());
          } else {
            d = computePreferredDate(plan);
          }
        } else {
          d = new Date();
        }
        setNextDate(d.toLocaleDateString("pt-BR"));
      } catch {}
    })();
    // supabase é singleton; `type` é prop estável dentro do mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const markDone = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const now = new Date();
      const cyc = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data: exec } = await supabase
        .from("plan_executions")
        .select("id, details")
        .eq("plan_id", planId)
        .eq("cycle", cyc)
        .maybeSingle();
      const details = ((exec as { details?: Record<string, unknown> | null } | null)?.details ??
        {}) as Record<string, unknown>;
      const list = Array.isArray(details[type]) ? (details[type] as unknown[]) : [];
      const entry: Record<string, string> =
        type === "fertilization"
          ? {
              product: "Adubo",
              dose: "",
              area: "",
              date: now.toISOString().slice(0, 10),
            }
          : {
              type: "Praga",
              severity: "",
              treatment: "",
              date: now.toISOString().slice(0, 10),
            };
      const patch = { ...details, [type]: [...list, entry] };
      if (exec?.id) {
        const { error: uerr } = await supabase
          .from("plan_executions")
          .update({ details: patch })
          .eq("id", exec.id);
        if (uerr) throw uerr;
      } else {
        const { error: ierr } = await supabase
          .from("plan_executions")
          .insert([{ plan_id: planId, cycle: cyc, status: "open", details: patch }]);
        if (ierr) throw ierr;
      }
      setMsg("Marcado como realizado");
    } catch (err: unknown) {
      setMsg(extrairMensagemErro(err, "Falha ao registrar"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`py-0 border-l-4 ${config.borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}
            >
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{config.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {nextDate ? `Próxima: ${nextDate}` : "Calculando..."}
              </p>
              {msg && (
                <p
                  className={`text-[11px] font-medium mt-0.5 ${msg.includes("Falha") || msg.includes("Não") ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
                >
                  {msg}
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl text-[12px] gap-1.5 shrink-0"
            disabled={loading}
            onClick={markDone}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {loading ? "Registrando..." : "Marcar feito"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
