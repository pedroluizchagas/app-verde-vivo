import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { BudgetCard } from "@/components/budgets/budget-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function BudgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get pending budgets
  const { data: pendingBudgets } = await supabase
    .from("budgets")
    .select(`
      *,
      client:clients(name)
    `)
    .eq("gardener_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Get approved budgets
  const { data: approvedBudgets } = await supabase
    .from("budgets")
    .select(`
      *,
      client:clients(name)
    `)
    .eq("gardener_id", user!.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  // Get rejected budgets
  const { data: rejectedBudgets } = await supabase
    .from("budgets")
    .select(`
      *,
      client:clients(name)
    `)
    .eq("gardener_id", user!.id)
    .eq("status", "rejected")
    .order("created_at", { ascending: false })

  const allBudgets = [...(pendingBudgets || []), ...(approvedBudgets || []), ...(rejectedBudgets || [])]

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {allBudgets.length > 0 ? (
            <div className="grid gap-3">
              {allBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-muted p-6">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Nenhum orçamento</h3>
                <p className="text-sm text-muted-foreground text-balance">Crie seu primeiro orçamento</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/budgets/new">Novo orçamento</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingBudgets && pendingBudgets.length > 0 ? (
            <div className="grid gap-3">
              {pendingBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum orçamento pendente</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedBudgets && approvedBudgets.length > 0 ? (
            <div className="grid gap-3">
              {approvedBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum orçamento aprovado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedBudgets && rejectedBudgets.length > 0 ? (
            <div className="grid gap-3">
              {rejectedBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum orçamento rejeitado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
