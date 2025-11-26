import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function WorkOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: orders } = await supabase
    .from("service_orders")
    .select("id, title, status, total_amount, created_at, client:clients(name)")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordens de serviço</h1>
          <p className="text-sm text-muted-foreground">{orders?.length || 0} ordem{orders && orders.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/work-orders/new">Nova OS</Link>
        </Button>
      </div>

      {orders && orders.length > 0 ? (
        <div className="grid gap-3">
          {orders.map((o: any) => (
            <Card key={o.id}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg">{o.title}</CardTitle>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{o.status}</span>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-muted-foreground">{o.client?.name || ""}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(o.total_amount || 0))}</p>
                  <Link href={`/dashboard/work-orders/${o.id}`} className="text-xs text-primary hover:underline">Detalhes</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma OS cadastrada</p>
        </div>
      )}
    </div>
  )
}