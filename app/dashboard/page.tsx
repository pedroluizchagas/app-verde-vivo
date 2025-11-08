import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, FileText, BarChart3, PieChart, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SimpleBarChart } from "@/components/reports/bar-chart"
import { SimplePieChart } from "@/components/reports/pie-chart"
import { ExportDashboardPDFButton } from "@/components/reports/export-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch stats
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)

  const { count: appointmentsCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .eq("status", "scheduled")

  const { count: budgetsCount } = await supabase
    .from("budgets")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .eq("status", "pending")

  // Limites de hoje
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date()
  dayEnd.setHours(23, 59, 59, 999)

  // Próximos agendamentos (após hoje)
  const { data: upcomingAppointmentsBrief } = await supabase
    .from("appointments")
    .select("id, scheduled_date, status, client:clients(id, name)")
    .eq("gardener_id", user!.id)
    .gt("scheduled_date", dayEnd.toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(5)

  // Orçamentos pendentes (recentes)
  const { data: pendingBudgets } = await supabase
    .from("budgets")
    .select("id, title, total_amount, status, client:clients(id, name)")
    .eq("gardener_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  // Serviços do dia
  const { count: todayServices } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", dayStart.toISOString())
    .lte("scheduled_date", dayEnd.toISOString())

  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select("id, scheduled_date, status, client:clients(id, name, phone)")
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", dayStart.toISOString())
    .lte("scheduled_date", dayEnd.toISOString())
    .order("scheduled_date", { ascending: true })

  // Receita total (pagas)
  const { data: allPaidIncome } = await supabase
    .from("financial_transactions")
    .select("amount, type, status")
    .eq("gardener_id", user!.id)
    .eq("status", "paid")
    .eq("type", "income")

  const totalRevenue = (allPaidIncome || []).reduce((s, t) => s + Number(t.amount), 0)

  // Saldo atual (receitas - despesas pagas)
  const { data: paidTx } = await supabase
    .from("financial_transactions")
    .select("amount, type, status")
    .eq("gardener_id", user!.id)
    .eq("status", "paid")

  const currentBalance = (paidTx || []).reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0)

  // Financeiro mensal/anual
  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startYear = new Date(now.getFullYear(), 0, 1)
  const endYear = new Date(now.getFullYear(), 11, 31)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  const { data: monthTx } = await supabase
    .from("financial_transactions")
    .select("amount, type, status, transaction_date")
    .eq("gardener_id", user!.id)
    .gte("transaction_date", iso(startMonth))
    .lte("transaction_date", iso(endMonth))

  const monthIncome = (monthTx || []).filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)
  const monthExpense = (monthTx || []).filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)

  const { data: yearTx } = await supabase
    .from("financial_transactions")
    .select("amount, type, status, transaction_date")
    .eq("gardener_id", user!.id)
    .gte("transaction_date", iso(startYear))
    .lte("transaction_date", iso(endYear))

  const yearIncome = (yearTx || []).filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)
  const yearExpense = (yearTx || []).filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)

  // Produtividade (serviços concluídos no mês)
  const { count: completedThisMonth } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .eq("status", "completed")
    .gte("scheduled_date", startMonth.toISOString())
    .lte("scheduled_date", endMonth.toISOString())

  // Serviços mais realizados (top 5 nos últimos 90 dias)
  const since90 = new Date()
  since90.setDate(since90.getDate() - 90)
  const { data: recentServices } = await supabase
    .from("appointments")
    .select("service:services(name)")
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", since90.toISOString())

  // Clientes ativos (últimos 30 dias) — deduplicado
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  const { data: recentAppointments } = await supabase
    .from("appointments")
    .select("scheduled_date, client:clients(id, name, phone)")
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", since30.toISOString())
    .order("scheduled_date", { ascending: false })

  const activeClientsMap = new Map<string, { id: string; name: string; phone: string | null; lastService: string }>()
  for (const a of recentAppointments || []) {
    const c = (a as any).client
    if (!c?.id) continue
    const prev = activeClientsMap.get(c.id)
    const currentDate = (a as any).scheduled_date
    if (!prev || new Date(currentDate) > new Date(prev.lastService)) {
      activeClientsMap.set(c.id, { id: c.id, name: c.name, phone: c.phone ?? null, lastService: currentDate })
    }
  }
  const activeClients = Array.from(activeClientsMap.values()).slice(0, 8)

  const serviceCounts: Record<string, number> = {}
  for (const a of recentServices || []) {
    const name = (a as any).service?.name || "(Sem serviço)"
    serviceCounts[name] = (serviceCounts[name] || 0) + 1
  }
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }))

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single()

  // Cards de topo removidos conforme solicitado (Agendamentos/Orçamentos)

  return (
    <div id="dashboard-root" className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-balance">Olá, {profile?.full_name || "Jardineiro"}</h1>
        <p className="text-sm text-muted-foreground">Bem-vindo ao VerdeVivo</p>
      </div>

      {/* Cards de topo removidos: a visão agora concentra-se no Resumo geral e nas listas abaixo */}

      {/* Resumo geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" />Resumo geral</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Clientes</p>
            <p className="text-2xl font-bold">{clientsCount || 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Agendamentos</p>
            <p className="text-2xl font-bold">{appointmentsCount || 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Orçamentos</p>
            <p className="text-2xl font-bold">{budgetsCount || 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Serviços do dia</p>
            <p className="text-2xl font-bold">{todayServices || 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Receita total</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue)}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Saldo atual</p>
            <p className={currentBalance >= 0 ? "text-2xl font-bold text-emerald-600" : "text-2xl font-bold text-red-600"}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(currentBalance)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SimpleBarChart
          title="Financeiro mensal (receitas vs despesas)"
          data={[
            { label: "Receitas", value: monthIncome },
            { label: "Despesas", value: monthExpense },
          ]}
        />
        <SimpleBarChart
          title="Financeiro anual (receitas vs despesas)"
          data={[
            { label: "Receitas", value: yearIncome },
            { label: "Despesas", value: yearExpense },
          ]}
        />
      </div>

      {/* Produtividade e Serviços mais realizados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produtividade (mês)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Serviços concluídos</p>
            <p className="text-2xl font-bold">{completedThisMonth || 0}</p>
          </CardContent>
        </Card>

        <SimplePieChart title="Serviços mais realizados (90 dias)" data={topServices} />
      </div>

      {/* Clientes ativos (30 dias) e Serviços do dia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Clientes ativos (30 dias)</span>
              <Link href="/dashboard/clients" className="text-sm text-primary hover:underline">Ver todos</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {activeClients && activeClients.length > 0 ? (
              <div className="grid gap-2">
                {activeClients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                    <Link href={`/dashboard/clients/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Último serviço: {new Date(c.lastService).toLocaleDateString("pt-BR")}</p>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="text-xs text-primary hover:underline">{c.phone}</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum cliente ativo nos últimos 30 dias.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Serviços do dia</span>
              <Link href="/dashboard/schedule" className="text-sm text-primary hover:underline">Ver todos</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="grid gap-2">
                {todayAppointments.map((a) => (
                  <div key={(a as any).id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{(a as any).client?.name || "(Sem cliente)"}</p>
                      <p className="text-xs text-muted-foreground">{new Date((a as any).scheduled_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Link href={`/dashboard/schedule/${(a as any).id}`} className="text-xs text-primary hover:underline">Detalhes</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum serviço hoje.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos agendamentos e Orçamentos pendentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Próximos agendamentos</span>
              <Link href="/dashboard/schedule" className="text-sm text-primary hover:underline">Ver todos</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {upcomingAppointmentsBrief && upcomingAppointmentsBrief.length > 0 ? (
              <div className="grid gap-2">
                {upcomingAppointmentsBrief.map((a) => (
                  <div key={(a as any).id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{(a as any).client?.name || "(Sem cliente)"}</p>
                      <p className="text-xs text-muted-foreground">{new Date((a as any).scheduled_date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Link href={`/dashboard/schedule/${(a as any).id}`} className="text-xs text-primary hover:underline">Detalhes</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Orçamentos pendentes</span>
              <Link href="/dashboard/budgets" className="text-sm text-primary hover:underline">Ver todos</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {pendingBudgets && pendingBudgets.length > 0 ? (
              <div className="grid gap-2">
                {pendingBudgets.map((b) => (
                  <div key={(b as any).id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{(b as any).title}</p>
                      <p className="text-xs text-muted-foreground">{(b as any).client?.name || "(Sem cliente)"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number((b as any).total_amount || 0))}</p>
                      <Link href={`/dashboard/budgets/${(b as any).id}`} className="text-xs text-primary hover:underline">Detalhes</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum orçamento pendente.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Ações rápidas</span>
            <ExportDashboardPDFButton />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild className="w-full justify-start bg-transparent" variant="outline">
            <Link href="/dashboard/clients/new">
              <Users className="mr-2 h-4 w-4" />
              Adicionar cliente
            </Link>
          </Button>
          <Button asChild className="w-full justify-start bg-transparent" variant="outline">
            <Link href="/dashboard/schedule/new">
              <Calendar className="mr-2 h-4 w-4" />
              Novo agendamento
            </Link>
          </Button>
          <Button asChild className="w-full justify-start bg-transparent" variant="outline">
            <Link href="/dashboard/budgets/new">
              <FileText className="mr-2 h-4 w-4" />
              Criar orçamento
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
