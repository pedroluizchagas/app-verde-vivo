import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { BudgetCard } from "@/components/budgets/budget-card"

export default async function BudgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, client:clients(name)")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  const allBudgets = (budgets || []) as any[]

  const pendingBudgets = allBudgets.filter((b) => b.status === "pending")
  const approvedBudgets = allBudgets.filter((b) => b.status === "approved")
  const rejectedBudgets = allBudgets.filter((b) => b.status === "rejected")

  const approvedRevenue = approvedBudgets.reduce(
    (s, b) => s + Number(b.total_amount || 0),
    0
  )

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

  const fmtK = (v: number) => {
    if (v >= 1000) return `R$\u00a0${(v / 1000).toFixed(1)}K`
    return fmt(v)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {allBudgets.length} orçamento{allBudgets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/budgets/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Novo orçamento</span>
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
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {allBudgets.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              orçamento{allBudgets.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Pendentes
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {pendingBudgets.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              aguardando
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Aprovados
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {approvedBudgets.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              aprovado{approvedBudgets.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Aprovado
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[18px] font-bold leading-tight tabular-nums">
              {fmtK(approvedRevenue)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">em valor</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="all" className="text-[13px]">
            Todos
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-[13px] gap-1.5">
            Pendentes
            {pendingBudgets.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 leading-none">
                {pendingBudgets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-[13px]">
            Aprovados
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-[13px]">
            Rejeitados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {allBudgets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {allBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-muted p-6">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Nenhum orçamento cadastrado</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Crie seu primeiro orçamento para começar
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/budgets/new">Novo orçamento</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingBudgets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {pendingBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum orçamento pendente.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedBudgets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {approvedBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum orçamento aprovado.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedBudgets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {rejectedBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum orçamento rejeitado.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
