import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const NOW_MS = Date.now()

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: plans } = await supabase
    .from("maintenance_plans")
    .select("id, title, status, default_description, preferred_weekday, preferred_week_of_month, client:clients(name)")
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
    for (const t of tmpls || []) templates[String((t as any).plan_id)] = t
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes Plano Mensal</h1>
          <p className="text-sm text-muted-foreground">{plans?.length || 0} cliente{plans && plans.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/maintenance/new">Novo plano</Link>
        </Button>
      </div>

      {plans && plans.length > 0 ? (
        <div className="grid gap-3">
          {plans.map((p: any) => {
            const last = latestExecs.find((e: any) => e.plan_id === p.id)
            const lastDate = last ? new Date(String(last.created_at)) : null
            const daysSince = lastDate ? Math.floor((NOW_MS - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : null
            const showAlert = typeof daysSince === "number" ? daysSince > 25 : true
            const desc = String(p.default_description || "")
            const sun = /sol\s*pleno/i.test(desc) ? "Sol Pleno" : /meia\s*sombra/i.test(desc) ? "Meia Sombra" : ""
            const waterMatch = desc.match(/rega\s*(\d+)x/i)
            const water = waterMatch ? `Rega ${waterMatch[1]}x` : ""
            const tmpl = templates[p.id]
            const schedule = (tmpl as any)?.details?.schedule || null
            const months: number[] = Array.isArray(schedule?.fertilization_months) ? schedule.fertilization_months : []
            const now = new Date()
            const cur = now.getMonth() + 1
            const nextMonth = months.length > 0 ? (months.find((m: number) => m >= cur) ?? months[0]) : null
            const prefWeekday = typeof p.preferred_weekday === "number" ? p.preferred_weekday : 1
            const prefWeek = typeof p.preferred_week_of_month === "number" ? p.preferred_week_of_month : 1
            const base = (() => {
              const first = new Date(now.getFullYear(), now.getMonth(), 1)
              const firstDow = first.getDay()
              const offset = (prefWeekday - firstDow + 7) % 7
              const day = 1 + offset + (prefWeek - 1) * 7
              return new Date(now.getFullYear(), now.getMonth(), day)
            })()
            const nextDate = (() => {
              if (!nextMonth) return null
              const y = nextMonth < cur ? now.getFullYear() + 1 : now.getFullYear()
              return new Date(y, nextMonth - 1, base.getDate())
            })()
            return (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={p.status === "active" ? "border-green-500 text-green-600" : "border-muted-foreground text-muted-foreground"}>{p.status}</Badge>
                  <Button asChild size="sm" variant="outline" className="bg-transparent">
                    <Link href={`/dashboard/maintenance/${p.id}`}>Detalhes</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm font-medium">{p.client?.name || ""}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-4">
                  {sun && <span>{sun}</span>}
                  {water && <span>{water}</span>}
                </div>
                {showAlert ? (
                  <div className="text-sm text-yellow-500">Manutenção Atrasada</div>
                ) : (
                  <div className="text-sm">Próxima manutenção: {nextDate ? nextDate.toLocaleDateString("pt-BR") : "—"}</div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum plano cadastrado</p>
        </div>
      )}
    </div>
  )
}
