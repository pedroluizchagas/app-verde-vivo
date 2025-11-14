import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GenerateMonthlyTaskButton } from "@/components/maintenance/generate-task-button"

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: plans } = await supabase
    .from("maintenance_plans")
    .select("id, title, status, default_labor_cost, materials_markup_pct, client:clients(name)")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manutenções mensais</h1>
          <p className="text-sm text-muted-foreground">{plans?.length || 0} plano{plans && plans.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/maintenance/new">Novo plano</Link>
        </Button>
      </div>

      {plans && plans.length > 0 ? (
        <div className="grid gap-3">
          {plans.map((p: any) => (
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
                <div className="text-sm text-muted-foreground">Cliente: {p.client?.name || ""}</div>
                <div className="text-sm">Mão de obra padrão: R$ {Number(p.default_labor_cost || 0).toFixed(2)}</div>
                <div className="text-sm">Markup materiais: {Number(p.materials_markup_pct || 0)}%</div>
                <div className="pt-2">
                  <GenerateMonthlyTaskButton planId={p.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum plano cadastrado</p>
        </div>
      )}
    </div>
  )
}