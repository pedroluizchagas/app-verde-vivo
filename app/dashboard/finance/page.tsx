import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
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

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const { data: monthTransactions } = await supabase
    .from("financial_transactions")
    .select("*, category:financial_categories(name, parent_id), client:clients(name)")
    .eq("gardener_id", user!.id)
    .gte("transaction_date", toISODate(startOfMonth))
    .lte("transaction_date", toISODate(endOfMonth))
    .order("transaction_date", { ascending: false })

  const { data: paidTransactions } = await supabase
    .from("financial_transactions")
    .select("amount, type, status")
    .eq("gardener_id", user!.id)
    .eq("status", "paid")

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

  const monthIncome = (monthTransactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const monthExpense = (monthTransactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const monthResult = monthIncome - monthExpense

  const currentBalance = (paidTransactions || []).reduce(
    (sum, t) =>
      sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  )

  const forecastNext30 = (pending30 || []).reduce(
    (sum, t) =>
      sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  )

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  const monthLabel = today.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  const incomeCount = (monthTransactions || []).filter(
    (t) => t.type === "income"
  ).length
  const expenseCount = (monthTransactions || []).filter(
    (t) => t.type === "expense"
  ).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-[13px] text-muted-foreground mt-1 capitalize">
            {monthLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-[13px]"
          >
            <Link href="/dashboard/finance/categories">Categorias</Link>
          </Button>
          <Button asChild size="icon" className="h-9 w-9 rounded-full">
            <Link href="/dashboard/finance/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Novo lançamento</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Saldo atual
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p
              className={`text-[18px] font-bold leading-tight mb-0.5 tabular-nums ${
                currentBalance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {currency(currentBalance)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              receitas − despesas pagas
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Receitas
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
            <p className="text-[18px] font-bold leading-tight text-emerald-600 dark:text-emerald-400 mb-0.5 tabular-nums">
              {currency(monthIncome)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {incomeCount} lançamento{incomeCount !== 1 ? "s" : ""} no mês
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Despesas
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              </div>
            </div>
            <p className="text-[18px] font-bold leading-tight text-red-500 dark:text-red-400 mb-0.5 tabular-nums">
              {currency(monthExpense)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {expenseCount} lançamento{expenseCount !== 1 ? "s" : ""} no mês
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Resultado
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p
              className={`text-[18px] font-bold leading-tight mb-0.5 tabular-nums ${
                monthResult >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {currency(monthResult)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              receitas − despesas do mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Previsão + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Previsão de fluxo */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h2 className="text-[14px] font-semibold mb-3">
              Previsão de fluxo (30 dias)
            </h2>
            <div className="flex items-baseline gap-2 mb-3">
              <p
                className={`text-xl font-bold tabular-nums ${
                  forecastNext30 >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {currency(forecastNext30)}
              </p>
              <span className="text-[11px] text-muted-foreground">
                em lançamentos pendentes
              </span>
            </div>
            {pending30 && pending30.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/40">
                {pending30.slice(0, 4).map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          t.type === "income"
                            ? "bg-emerald-500/10"
                            : "bg-red-500/10"
                        }`}
                      >
                        {t.type === "income" ? (
                          <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500 dark:text-red-400" />
                        )}
                      </div>
                      <span className="text-[12px] text-muted-foreground truncate">
                        {t.description || "(sem descrição)"}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p
                        className={`text-[12px] font-semibold tabular-nums ${
                          t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {currency(Number(t.amount))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(`${t.due_date}T12:00:00`).toLocaleDateString(
                          "pt-BR",
                          { day: "2-digit", month: "short" }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                Nenhum lançamento pendente nos próximos 30 dias.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alertas 7 dias */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h2 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Vencimentos próximos (7 dias)
            </h2>
            {alerts && alerts.length > 0 ? (
              <div className="flex flex-col gap-2">
                {alerts.map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/dashboard/finance/transactions/${a.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          a.type === "income"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-500 dark:text-red-400"
                        }`}
                      >
                        {a.type === "income" ? "Receita" : "Despesa"}
                      </span>
                      <span className="text-[12px] text-muted-foreground truncate">
                        {a.description || "(sem descrição)"}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-[12px] font-semibold tabular-nums">
                        {currency(Number(a.amount))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(
                          `${a.due_date}T12:00:00`
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                Nenhum vencimento nos próximos 7 dias.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lançamentos do mês */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">
            Lançamentos do mês
          </h2>
          <ExportButtons
            transactions={(monthTransactions || []).map((t) => ({
              id: t.id,
              type: t.type,
              amount: Number(t.amount),
              transaction_date: t.transaction_date,
              description: t.description,
              status: t.status,
              category: t.category ? { name: t.category.name } : undefined,
              client: t.client ? { name: t.client.name } : undefined,
            }))}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-[13px] gap-1.5">
              Todos
              {(monthTransactions || []).length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                  {(monthTransactions || []).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="income" className="text-[13px] gap-1.5">
              Receitas
              {incomeCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 leading-none">
                  {incomeCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="expense" className="text-[13px] gap-1.5">
              Despesas
              {expenseCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 leading-none">
                  {expenseCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-3">
            {monthTransactions && monthTransactions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {monthTransactions.map((t) => (
                  <TransactionCard key={t.id} transaction={t} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-8 text-center">
                Nenhum lançamento no mês.
              </p>
            )}
          </TabsContent>

          <TabsContent value="income" className="mt-3">
            {monthTransactions &&
            monthTransactions.filter((t) => t.type === "income").length > 0 ? (
              <div className="flex flex-col gap-2">
                {monthTransactions
                  .filter((t) => t.type === "income")
                  .map((t) => (
                    <TransactionCard key={t.id} transaction={t} />
                  ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-8 text-center">
                Nenhuma receita no mês.
              </p>
            )}
          </TabsContent>

          <TabsContent value="expense" className="mt-3">
            {monthTransactions &&
            monthTransactions.filter((t) => t.type === "expense").length > 0 ? (
              <div className="flex flex-col gap-2">
                {monthTransactions
                  .filter((t) => t.type === "expense")
                  .map((t) => (
                    <TransactionCard key={t.id} transaction={t} />
                  ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-8 text-center">
                Nenhuma despesa no mês.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
