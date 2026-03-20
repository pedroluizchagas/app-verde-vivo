import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ClipboardList, CheckCircle2, DollarSign, Loader2 } from "lucide-react"
import { WorkOrderCard } from "@/components/work-orders/work-order-card"

export default async function WorkOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from("service_orders")
    .select("id, title, status, total_amount, created_at, client:clients(name)")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  const allOrders = (orders || []) as any[]

  const activeOrders = allOrders.filter(
    (o) => o.status === "draft" || o.status === "issued"
  )
  const historyOrders = allOrders.filter(
    (o) => o.status === "completed" || o.status === "cancelled"
  )
  const completedOrders = allOrders.filter((o) => o.status === "completed")

  const totalRevenue = completedOrders.reduce(
    (s, o) => s + Number(o.total_amount || 0),
    0
  )

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v)

  const fmtK = (v: number) => {
    if (v >= 1000) return `R$\u00a0${(v / 1000).toFixed(1)}K`
    return fmt(v)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {allOrders.length} OS cadastrada
            {allOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/work-orders/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Nova OS</span>
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {allOrders.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              ordens
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Em aberto
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Loader2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {activeOrders.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              ativa{activeOrders.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Concluídas
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {completedOrders.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">ordens</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Receita
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[18px] font-bold leading-tight tabular-nums">
              {fmtK(totalRevenue)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="active" className="text-[13px] gap-1.5">
            Em andamento
            {activeOrders.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                {activeOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[13px]">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeOrders.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeOrders.map((order) => (
                <WorkOrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-muted p-6">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Nenhuma OS em andamento</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Crie uma nova ordem de serviço para começar
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/work-orders/new">Nova OS</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyOrders.length > 0 ? (
            <div className="flex flex-col gap-2">
              {historyOrders.map((order) => (
                <WorkOrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma OS no histórico.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
