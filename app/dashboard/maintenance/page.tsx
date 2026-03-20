import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  User,
  Droplets,
  Sun,
  Calendar,
} from "lucide-react"

const NOW_MS = Date.now()

const statusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  cancelled: "Cancelado",
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cancelled: "bg-muted text-muted-foreground",
}

const statusBorderColors: Record<string, string> = {
  active: "border-l-emerald-500",
  paused: "border-l-amber-500",
  cancelled: "border-l-border",
}

export default async function MaintenancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: plans } = await supabase
    .from("maintenance_plans")
    .select(
      "id, title, status, default_description, preferred_weekday, preferred_week_of_month, client:clients(name)"
    )
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  let latestExecs: any[] = []
  let templates: Record<string, any> = {}

  if (plans && plans.length > 0) {
    const ids = plans.map((p: any) => p.id)

    const { data: execs } = await supabase
      .from("plan_executions")
      .select("id, plan_id, status, created_at")
      .in("plan_id", ids)
      .eq("status", "done")
      .order("created_at", { ascending: false })
    latestExecs = execs || []

    const { data: tmpls } = await supabase
      .from("plan_executions")
      .select("plan_id, details, cycle")
      .in("plan_id", ids)
      .eq("cycle", "template")
    for (const t of tmpls || []) {
      templates[String((t as any).plan_id)] = t
    }
  }

  const allPlans = plans || []
  const activePlans = allPlans.filter((p: any) => p.status === "active")

  // Conta planos com alerta (mais de 25 dias sem manutenção)
  const alertCount = allPlans.filter((p: any) => {
    const last = latestExecs.find((e: any) => e.plan_id === p.id)
    const lastDate = last ? new Date(String(last.created_at)) : null
    const daysSince = lastDate
      ? Math.floor((NOW_MS - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      : null
    return typeof daysSince === "number" ? daysSince > 25 : true
  }).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manutenções</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {allPlans.length} plano{allPlans.length !== 1 ? "s" : ""} cadastrado
            {allPlans.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/maintenance/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Novo plano</span>
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {allPlans.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              plano{allPlans.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Ativos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight text-emerald-600 dark:text-emerald-400">
              {activePlans.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Atrasados
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p
              className={`text-[22px] font-bold leading-tight ${alertCount > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}
            >
              {alertCount}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              sem manutenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de planos */}
      {allPlans.length > 0 ? (
        <div className="flex flex-col gap-2">
          {allPlans.map((p: any) => {
            const last = latestExecs.find((e: any) => e.plan_id === p.id)
            const lastDate = last ? new Date(String(last.created_at)) : null
            const daysSince = lastDate
              ? Math.floor(
                  (NOW_MS - lastDate.getTime()) / (1000 * 60 * 60 * 24)
                )
              : null
            const showAlert =
              typeof daysSince === "number" ? daysSince > 25 : true

            const desc = String(p.default_description || "")
            const hasSunFull = /sol\s*pleno/i.test(desc)
            const hasSunPartial = /meia\s*sombra/i.test(desc)
            const waterMatch = desc.match(/rega\s*(\d+)x/i)
            const waterFreq = waterMatch ? waterMatch[1] : null

            const tmpl = templates[p.id]
            const schedule = (tmpl as any)?.details?.schedule || null
            const months: number[] = Array.isArray(
              schedule?.fertilization_months
            )
              ? schedule.fertilization_months
              : []
            const now = new Date()
            const cur = now.getMonth() + 1
            const prefWeekday =
              typeof p.preferred_weekday === "number" ? p.preferred_weekday : 1
            const prefWeek =
              typeof p.preferred_week_of_month === "number"
                ? p.preferred_week_of_month
                : 1

            const baseDate = (() => {
              const first = new Date(now.getFullYear(), now.getMonth(), 1)
              const firstDow = first.getDay()
              const offset = (prefWeekday - firstDow + 7) % 7
              const day = 1 + offset + (prefWeek - 1) * 7
              return new Date(now.getFullYear(), now.getMonth(), day)
            })()

            const nextFertMonth =
              months.length > 0
                ? months.find((m: number) => m >= cur) ?? months[0]
                : null
            const nextDate = (() => {
              if (!nextFertMonth) return null
              const y =
                nextFertMonth < cur
                  ? now.getFullYear() + 1
                  : now.getFullYear()
              return new Date(y, nextFertMonth - 1, baseDate.getDate())
            })()

            const borderColor =
              statusBorderColors[p.status] ?? "border-l-border"
            const statusColor =
              statusColors[p.status] ?? "bg-muted text-muted-foreground"
            const statusLabel = statusLabels[p.status] ?? p.status

            return (
              <Link
                key={p.id}
                href={`/dashboard/maintenance/${p.id}`}
                className="block"
              >
                <Card
                  className={`py-0 border-l-4 ${borderColor} transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Título + status */}
                        <div className="flex items-start gap-2 mb-1">
                          <p className="font-semibold text-[14px] leading-tight truncate flex-1">
                            {p.title}
                          </p>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {/* Cliente */}
                        {p.client?.name && (
                          <div className="flex items-center gap-1 mb-1.5">
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[12px] text-muted-foreground truncate">
                              {p.client.name}
                            </span>
                          </div>
                        )}

                        {/* Chips de ambiente */}
                        {(hasSunFull || hasSunPartial || waterFreq) && (
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {(hasSunFull || hasSunPartial) && (
                              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Sun className="h-2.5 w-2.5 shrink-0" />
                                {hasSunFull ? "Sol pleno" : "Meia sombra"}
                              </span>
                            )}
                            {waterFreq && (
                              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Droplets className="h-2.5 w-2.5 shrink-0" />
                                Rega {waterFreq}x/sem
                              </span>
                            )}
                          </div>
                        )}

                        {/* Alerta ou próxima data */}
                        {showAlert ? (
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              {daysSince !== null
                                ? `Sem manutenção há ${daysSince} dias`
                                : "Nunca executado"}
                            </span>
                          </div>
                        ) : nextDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground">
                              Próxima adubação:{" "}
                              {nextDate.toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        ) : lastDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground">
                              Última manutenção:{" "}
                              {lastDate.toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <Wrench className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">Nenhum plano cadastrado</h3>
            <p className="text-sm text-muted-foreground text-balance">
              Crie um plano de manutenção para começar a acompanhar os jardins
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/maintenance/new">Novo plano</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
