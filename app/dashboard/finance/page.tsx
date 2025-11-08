import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, BarChart3, AlertCircle } from "lucide-react"
import { TransactionCard } from "@/components/finance/transaction-card"
import { ExportButtons } from "@/components/finance/export-buttons"

function toISODate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default async function FinancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Dates
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  // Transactions for the month
  const { data: monthTransactions } = await supabase
    .from("financial_transactions")
    .select(`*, category:financial_categories(name, parent_id), client:clients(name)`) 
    .eq("gardener_id", user!.id)
    .gte("transaction_date", toISODate(startOfMonth))
    .lte("transaction_date", toISODate(endOfMonth))
    .order("transaction_date", { ascending: false })

  // All paid transactions for current balance
  const { data: paidTransactions } = await supabase
    .from("financial_transactions")
    .select("amount, type, status")
    .eq("gardener_id", user!.id)
    .eq("status", "paid")

  // Pending transactions due in next 30 days (forecast)
  const in30 = new Date(today)
  in30.setDate(in30.getDate() + 30)
  const { data: pending30 } = await supabase
    .from("financial_transactions")
    .select("amount, type, due_date, description")
    .eq("gardener_id", user!.id)
    .eq("status", "pending")
    .gte("due_date", toISODate(today))
    .lte("due_date", toISODate(in30))
    .order("due_date", { ascending: true })

  // Alerts: pending due next 7 days
  const in7 = new Date(today)
  in7.setDate(in7.getDate() + 7)
  const { data: alerts } = await supabase
    .from("financial_transactions")
    .select("id, description, amount, type, due_date")
    .eq("gardener_id", user!.id)
    .eq("status", "pending")
    .gte("due_date", toISODate(today))
    .lte("due_date", toISODate(in7))
    .order("due_date", { ascending: true })

  // Aggregations client-side
  const monthIncome = (monthTransactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const monthExpense = (monthTransactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const currentBalance = (paidTransactions || [])
    .reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0)

  const forecastNext30 = (pending30 || [])
    .reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0)

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  // Export helpers (CSV via link; PDF via print-friendly route)
  // We will generate CSV on client in a small inline script using data attributes

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild size="icon" className="h-10 w-10 rounded-full">
            <Link href="/dashboard/finance/new">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Novo lançamento</span>
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/finance/categories">Gerenciar categorias</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Saldo atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currency(currentBalance)}</p>
            <p className="text-xs text-muted-foreground">Somatório de receitas e despesas pagas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receitas no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{currency(monthIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Despesas no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{currency(monthExpense)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previsão de fluxo (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className={forecastNext30 >= 0 ? "text-xl font-bold text-emerald-600" : "text-xl font-bold text-red-600"}>
              {currency(forecastNext30)}
            </p>
            <span className="text-xs text-muted-foreground">considerando pendentes com vencimento até 30 dias</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" /> Alertas de vencimento (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <div className="grid gap-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Badge className={a.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                      {a.type === "income" ? "Receita" : "Despesa"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{a.description || "(sem descrição)"}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{currency(Number(a.amount))}</p>
                    <p className="text-xs text-muted-foreground">Vence {new Date(a.due_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem pendências próximas.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lançamentos do mês</h2>
        <ExportButtons transactions={(monthTransactions || []).map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          transaction_date: t.transaction_date,
          description: t.description,
          status: t.status,
          category: t.category ? { name: t.category.name } : undefined,
          client: t.client ? { name: t.client.name } : undefined,
        }))} />
      </div>

      <Tabs defaultValue="all" className="mt-2">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {monthTransactions && monthTransactions.length > 0 ? (
            <div className="grid gap-3">
              {monthTransactions.map((t) => (
                <TransactionCard key={t.id} transaction={t} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum lançamento no mês.</p>
          )}
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          {monthTransactions && monthTransactions.filter((t) => t.type === "income").length > 0 ? (
            <div className="grid gap-3">
              {monthTransactions.filter((t) => t.type === "income").map((t) => (
                <TransactionCard key={t.id} transaction={t} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma receita no mês.</p>
          )}
        </TabsContent>
        <TabsContent value="expense" className="mt-4">
          {monthTransactions && monthTransactions.filter((t) => t.type === "expense").length > 0 ? (
            <div className="grid gap-3">
              {monthTransactions.filter((t) => t.type === "expense").map((t) => (
                <TransactionCard key={t.id} transaction={t} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma despesa no mês.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}