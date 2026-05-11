import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, AlertTriangle, Calendar } from "lucide-react";
import { DeletePlanButton } from "@/components/maintenance/delete-plan-button";
import { MaintenanceServiceNoteRich } from "@/components/maintenance/service-note-rich";
import { MaintenancePlanHeaderCard } from "@/components/maintenance/plan-header-card";
import { MaintenanceTimeline } from "@/components/maintenance/timeline";
import { MaintenanceSimpleControl } from "@/components/maintenance/simple-control";
import { GenerateMaintenanceCertificateButton } from "@/components/maintenance/generate-certificate-button";
import type { MaintenancePlan, PlanExecution, ClienteResumo } from "@/lib/domain/types";

type PlanoDetalhado = MaintenancePlan & {
  service?: { name?: string | null } | null;
};

const NOW_MS = Date.now();

const statusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: planRaw } = await supabase
    .from("maintenance_plans")
    .select("*, client:clients(id, name, phone), service:services(name)")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle();

  if (!planRaw) {
    notFound();
  }

  const plan = planRaw as PlanoDetalhado;

  const { data: executions } = await supabase
    .from("plan_executions")
    .select(
      "id, cycle, status, task_id, appointment_id, transaction_id, final_amount, notes, details, created_at",
    )
    .eq("plan_id", id)
    .order("created_at", { ascending: false });

  const visibleExecutions = ((executions ?? []) as PlanExecution[]).filter(
    (e) => String(e.cycle) !== "template",
  );

  const lastDone = visibleExecutions.filter((e) => String(e.status) === "done")[0];
  const lastDate = lastDone?.created_at ? new Date(lastDone.created_at) : null;
  const daysSince = lastDate
    ? Math.floor((NOW_MS - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const showAlert = typeof daysSince === "number" ? daysSince > 25 : true;

  const planClient: ClienteResumo | null = Array.isArray(plan.client)
    ? ((plan.client[0] as ClienteResumo | undefined) ?? null)
    : ((plan.client as ClienteResumo | null) ?? null);

  const statusLabel = statusLabels[plan.status] ?? plan.status;
  const statusColor = statusColors[plan.status] ?? "bg-muted text-muted-foreground";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/maintenance">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {plan.title}
            </h1>
            <p className="text-[13px] text-muted-foreground">Plano de manutenção</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/maintenance/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeletePlanButton planId={id} />
        </div>
      </div>

      {/* Alerta de manutenção atrasada */}
      {showAlert && (
        <Card className="py-0 border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                  Manutenção atrasada
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {daysSince !== null
                    ? `Sem execução registrada há ${daysSince} dias`
                    : "Nenhuma manutenção registrada ainda"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de cabeçalho do plano */}
      <MaintenancePlanHeaderCard plan={plan} client={planClient} />

      {/* Timeline */}
      <MaintenanceTimeline executions={visibleExecutions} months={6} />

      {/* Controles rápidos */}
      <MaintenanceSimpleControl planId={id} type="fertilization" />
      <MaintenanceSimpleControl planId={id} type="pests" />

      {/* Última manutenção */}
      {lastDone && (
        <Card className="py-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-3 w-3 text-muted-foreground" />
              </div>
              <h2 className="text-[14px] font-semibold">Última manutenção</h2>
            </div>
            {lastDone.details ? (
              <MaintenanceServiceNoteRich
                planTitle={String(plan.title)}
                client={planClient}
                execution={lastDone as Parameters<typeof MaintenanceServiceNoteRich>[0]["execution"]}
              />
            ) : lastDone.notes ? (
              <div className="rounded-lg bg-muted p-3 text-[13px] whitespace-pre-wrap">
                {String(lastDone.notes)}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Histórico de execuções */}
      <Card className="py-0">
        <CardContent className="p-5">
          <h2 className="text-[14px] font-semibold mb-4">Histórico de manutenções</h2>
          {visibleExecutions.filter((e) => String(e.status) === "done").length > 0 ? (
            <div className="flex flex-col divide-y divide-border/40">
              {visibleExecutions
                .filter((e) => String(e.status) === "done")
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-[13px] font-medium capitalize">
                        {new Date(e.created_at!).toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Realizada em {new Date(e.created_at!).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-[12px]"
                    >
                      <Link href={`#exec-${e.id}`}>Ver comprovante</Link>
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">Nenhuma execução registrada.</p>
          )}
        </CardContent>
      </Card>

      <GenerateMaintenanceCertificateButton planId={id} />
    </div>
  );
}
