import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  BarChart3,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
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
    .select(
      `*, category:financial_categories(name, parent_id), client:clients(name)`
    )
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

  const { data: partnerCredits } = await supabase
    .from("partner_credits")
    .select(
      "id, partner_name, credit_amount, credit_type, status, created_at"
    )
    .eq("gardener_id", user!.id)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(5)

  const totalPartnerCredits = (partnerCredits || []).reduce(
    (sum, c) => sum + Number(c.credit_amount),
    0
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Visao geral das suas financas
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="icon" className="h-10 w-10 rounded-full">
            <Link href="/dashboard/finance/new">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Novo lancamento</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/finance/categories">Categorias</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                Saldo Atual
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight mb-0.5">
              {currency(currentBalance)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Receitas - despesas pagas
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                Receitas no Mes
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight text-emerald-500 mb-0.5">
              {currency(monthIncome)}
            </p>
            <p className="text-[10px] text-muted-foreground">Mes atual</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                Despesas no Mes
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight text-red-400 mb-0.5">
              {currency(monthExpense)}
            </p>
            <p className="text-[10px] text-muted-foreground">Mes atual</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                Creditos Parceiros
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight text-emerald-500 mb-0.5">
              {currency(totalPartnerCredits)}
            </p>
            {partnerCredits && partnerCredits.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {partnerCredits.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="text-muted-foreground truncate mr-2">
                      {c.partner_name}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {currency(Number(c.credit_amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Nenhum credito disponivel
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forecast + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <h2 className="text-[14px] font-semibold mb-3">
              Previsao de fluxo (30 dias)
            </h2>
            <div className="flex items-baseline gap-2">
              <p
                className={`text-xl font-bold ${forecastNext30 >= 0 ? "text-emerald-500" : "text-red-400"}`}
              >
                {currency(forecastNext30)}
              </p>
              <span className="text-[10px] text-muted-foreground">
                pendentes com vencimento ate 30 dias
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <h2 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" /> Alertas (7
              dias)
            </h2>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          a.type === "income"
                            ? "bg-emerald-500/10 text-emerald-500 border-0"
                            : "bg-red-500/10 text-red-400 border-0"
                        }
                      >
                        {a.type === "income" ? "Receita" : "Despesa"}
                      </Badge>
                      <span className="text-[12px] text-muted-foreground truncate max-w-[140px]">
                        {a.description || "(sem descricao)"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-medium">
                        {currency(Number(a.amount))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(a.due_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                Sem pendencias proximas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">Lancamentos do mes</h2>
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

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expense">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-3">
            {monthTransactions && monthTransactions.length > 0 ? (
              <div className="grid gap-2">
                {monthTransactions.map((t) => (
                  <TransactionCard key={t.id} transaction={t} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-6 text-center">
                Nenhum lancamento no mes.
              </p>
            )}
          </TabsContent>
          <TabsContent value="income" className="mt-3">
            {monthTransactions &&
            monthTransactions.filter((t) => t.type === "income").length > 0 ? (
              <div className="grid gap-2">
                {monthTransactions
                  .filter((t) => t.type === "income")
                  .map((t) => (
                    <TransactionCard key={t.id} transaction={t} />
                  ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-6 text-center">
                Nenhuma receita no mes.
              </p>
            )}
          </TabsContent>
          <TabsContent value="expense" className="mt-3">
            {monthTransactions &&
            monthTransactions.filter((t) => t.type === "expense").length >
              0 ? (
              <div className="grid gap-2">
                {monthTransactions
                  .filter((t) => t.type === "expense")
                  .map((t) => (
                    <TransactionCard key={t.id} transaction={t} />
                  ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-6 text-center">
                Nenhuma despesa no mes.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
