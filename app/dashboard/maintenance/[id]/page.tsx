import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { DeletePlanButton } from "@/components/maintenance/delete-plan-button"
import { MaintenanceServiceNoteRich } from "@/components/maintenance/service-note-rich"
import { MaintenancePlanHeaderCard } from "@/components/maintenance/plan-header-card"
import { MaintenanceTimeline } from "@/components/maintenance/timeline"
import { MaintenanceSimpleControl } from "@/components/maintenance/simple-control"
import { GenerateMaintenanceCertificateButton } from "@/components/maintenance/generate-certificate-button"

const NOW_MS = Date.now()

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plan } = await supabase
    .from("maintenance_plans")
    .select("*, client:clients(id, name, phone), service:services(name)")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()

  if (!plan) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/dashboard/maintenance"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-2xl font-bold">Plano não encontrado</h1>
        </div>
      </div>
    )
  }

  const { data: executions } = await supabase
    .from("plan_executions")
    .select("id, cycle, status, task_id, appointment_id, transaction_id, final_amount, notes, details, created_at")
    .eq("plan_id", id)
    .order("created_at", { ascending: false })

  const weekdayLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
  const visibleExecutions = (executions || []).filter((e: any) => String(e.cycle) !== "template")

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/dashboard/maintenance"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-2xl font-bold">Detalhes do plano</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={plan.status === "active" ? "border-green-500 text-green-600" : "border-muted-foreground text-muted-foreground"}>{plan.status}</Badge>
          <Button asChild size="sm" variant="outline" className="bg-transparent"><Link href={`/dashboard/maintenance/${id}/edit`}>Editar</Link></Button>
          <DeletePlanButton planId={id} />
        </div>
      </div>

      <MaintenancePlanHeaderCard plan={plan} client={Array.isArray((plan as any).client) ? ((plan as any).client[0] ?? null) : (plan as any).client} />

      {(() => {
        const lastDone = (visibleExecutions || []).filter((e: any) => String(e.status) === "done")[0]
        const lastDate = lastDone ? new Date(String(lastDone.created_at)) : null
        const daysSince = lastDate ? Math.floor((NOW_MS - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : null
        const showAlert = typeof daysSince === "number" ? daysSince > 25 : true
        return showAlert ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alerta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">{daysSince ? `Sem execução há ${daysSince} dias` : "Nunca executado"}</p>
            </CardContent>
          </Card>
        ) : null
      })()}

      <MaintenanceTimeline executions={visibleExecutions || []} months={6} />

      <MaintenanceSimpleControl planId={id} type="fertilization" />
      <MaintenanceSimpleControl planId={id} type="pests" />

      {(() => {
        const lastDone = (visibleExecutions || []).filter((e: any) => String(e.status) === "done")[0]
        if (!lastDone) return null
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Última manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              {lastDone.details ? (
                <MaintenanceServiceNoteRich planTitle={String((plan as any).title)} client={Array.isArray((plan as any).client) ? ((plan as any).client[0] ?? null) : (plan as any).client} execution={lastDone} />
              ) : (
                lastDone.notes ? (
                  <div className="grid gap-2">
                    <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{String(lastDone.notes)}</div>
                  </div>
                ) : null
              )}
            </CardContent>
          </Card>
        )
      })()}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manutenções Passadas</CardTitle>
        </CardHeader>
        <CardContent>
          {visibleExecutions && visibleExecutions.length > 0 ? (
            <div className="grid gap-3">
              {(visibleExecutions || []).filter((e: any) => String(e.status) === "done").map((e: any) => (
                <div key={e.id} className="rounded-md border p-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{new Date(e.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
                    <p className="text-xs text-muted-foreground">Realizada em {new Date(e.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <Button asChild size="sm" variant="outline" className="bg-transparent">
                      <Link href={`#exec-${e.id}`}>Ver comprovante</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p>
          )}
        </CardContent>
      </Card>

      <GenerateMaintenanceCertificateButton planId={id} />
    </div>
  )
}
