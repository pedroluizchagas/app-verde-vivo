import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { MiniCalendar } from "@/components/dashboard/mini-calendar"
import { ProductivityChart } from "@/components/dashboard/productivity-chart"
import { DashboardFilters } from "@/components/dashboard/filters"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { NotificationsBell } from "@/components/dashboard/notifications-bell"

function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <div
      className={`flex items-center gap-1 text-[11px] mt-1.5 ${
        isPositive ? "text-emerald-500" : "text-red-400"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      <span className="font-medium">
        {isPositive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
      <span className="text-muted-foreground font-normal">do mês passado</span>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user!.id)
    .single()

  const now = new Date()
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)

  const mParam = typeof sp?.m === "string" ? sp.m : null
  const mParts = (mParam || "").split("-")
  const mYear = Number(mParts[0]) || now.getFullYear()
  // null = nenhum mes selecionado (visao anual); number = mes especifico (visao diaria)
  const mMonth: number | null = mParts[1] ? (Number(mParts[1]) || null) : null

  // KPI cards sempre comparam um mes concreto: o selecionado ou o mes atual
  const kpiMonth = mMonth ?? (now.getMonth() + 1)
  const startMonth = new Date(mYear, kpiMonth - 1, 1)
  const endMonth = new Date(mYear, kpiMonth, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  const prevStartMonth = new Date(mYear, kpiMonth - 2, 1)
  const prevEndMonth = new Date(mYear, kpiMonth - 1, 0)

  // --- Total de clientes ---
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)

  // Novos clientes este mes vs mes anterior (para o ChangeIndicator)
  const { count: newClientsThisMonth } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .gte("created_at", startMonth.toISOString())
    .lte("created_at", endMonth.toISOString())

  const { count: newClientsPrevMonth } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .gte("created_at", prevStartMonth.toISOString())
    .lte("created_at", prevEndMonth.toISOString())

  const clientsChange =
    (newClientsPrevMonth || 0) > 0
      ? (((newClientsThisMonth || 0) - (newClientsPrevMonth || 0)) /
          (newClientsPrevMonth || 0)) *
        100
      : (newClientsThisMonth || 0) > 0
        ? 100
        : 0

  // --- Clientes ativos (ultimos 30 dias) ---
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  const { data: recentAppointments } = await supabase
    .from("appointments")
    .select("client:clients(id)")
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", since30.toISOString())

  const activeClientsCount = new Set(
    (recentAppointments || [])
      .map((a: any) => a.client?.id)
      .filter(Boolean)
  ).size

  const since60 = new Date()
  since60.setDate(since60.getDate() - 60)
  const { data: prev30Appointments } = await supabase
    .from("appointments")
    .select("client:clients(id)")
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", since60.toISOString())
    .lt("scheduled_date", since30.toISOString())

  const prev30ActiveCount = new Set(
    (prev30Appointments || [])
      .map((a: any) => a.client?.id)
      .filter(Boolean)
  ).size

  const activeClientsChange =
    prev30ActiveCount > 0
      ? ((activeClientsCount - prev30ActiveCount) / prev30ActiveCount) * 100
      : activeClientsCount > 0
        ? 100
        : 0

  // --- Financeiro do mes selecionado ---
  const { data: monthTx } = await supabase
    .from("financial_transactions")
    .select("amount, type, status, transaction_date")
    .eq("gardener_id", user!.id)
    .gte("transaction_date", iso(startMonth))
    .lte("transaction_date", iso(endMonth))

  const monthIncome = (monthTx || [])
    .filter((t) => t.type === "income" && t.status === "paid")
    .reduce((s, t) => s + Number(t.amount), 0)
  const monthExpense = (monthTx || [])
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((s, t) => s + Number(t.amount), 0)
  const monthResult = monthIncome - monthExpense

  // --- Financeiro do mes anterior ---
  const { data: prevMonthTx } = await supabase
    .from("financial_transactions")
    .select("amount, type, status, transaction_date")
    .eq("gardener_id", user!.id)
    .gte("transaction_date", iso(prevStartMonth))
    .lte("transaction_date", iso(prevEndMonth))

  const prevMonthIncome = (prevMonthTx || [])
    .filter((t) => t.type === "income" && t.status === "paid")
    .reduce((s, t) => s + Number(t.amount), 0)
  const prevMonthExpense = (prevMonthTx || [])
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((s, t) => s + Number(t.amount), 0)
  const prevMonthResult = prevMonthIncome - prevMonthExpense

  const revenueChange =
    prevMonthIncome > 0
      ? ((monthIncome - prevMonthIncome) / prevMonthIncome) * 100
      : monthIncome > 0
        ? 100
        : 0

  const resultChange =
    prevMonthResult !== 0
      ? ((monthResult - prevMonthResult) / Math.abs(prevMonthResult)) * 100
      : monthResult > 0
        ? 100
        : monthResult < 0
          ? -100
          : 0

  // --- Grafico anual: usa mYear do filtro ---
  const startYear = new Date(mYear, 0, 1)
  const endYear = new Date(mYear, 11, 31)
  const { data: yearTx } = await supabase
    .from("financial_transactions")
    .select("amount, type, status, transaction_date")
    .eq("gardener_id", user!.id)
    .gte("transaction_date", iso(startYear))
    .lte("transaction_date", iso(endYear))

  const mLabels = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ]

  // Parseamos datas com horario local (T12:00:00) para evitar erros de fuso
  // quando o banco retorna strings de data sem horario (ex: "2026-03-01")
  const parseLocalDate = (dateStr: string) => new Date(`${dateStr}T12:00:00`)

  type ChartEntry = { month: string; receita: number; despesa: number }

  const sumTx = (txs: typeof yearTx, type: string) =>
    (txs || [])
      .filter((t) => t.type === type && t.status === "paid")
      .reduce((s, t) => s + Number(t.amount), 0)

  const chartData: ChartEntry[] = mMonth != null
    ? // Visao diaria: uma barra por dia do mes selecionado
      Array.from({ length: endMonth.getDate() }, (_, dayIdx) => {
        const day = dayIdx + 1
        const txs = (yearTx || []).filter((t) => {
          const d = parseLocalDate(t.transaction_date)
          return d.getMonth() + 1 === mMonth && d.getDate() === day
        })
        return {
          month: String(day),
          receita: sumTx(txs, "income"),
          despesa: sumTx(txs, "expense"),
        }
      })
    : // Visao anual: uma barra por mes
      mLabels.map((label, i) => {
        const txs = (yearTx || []).filter((t) => {
          const d = parseLocalDate(t.transaction_date)
          return d.getMonth() === i
        })
        return {
          month: label,
          receita: sumTx(txs, "income"),
          despesa: sumTx(txs, "expense"),
        }
      })

  const totalChartReceita = chartData.reduce((s, d) => s + d.receita, 0)
  const totalChartDespesa = chartData.reduce((s, d) => s + d.despesa, 0)

  // --- Produtividade ---
  const { count: completedThisMonth } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .eq("status", "completed")
    .gte("scheduled_date", startMonth.toISOString())
    .lte("scheduled_date", endMonth.toISOString())

  const { count: totalMonthAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", startMonth.toISOString())
    .lte("scheduled_date", endMonth.toISOString())

  // --- Proximos agendamentos ---
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(
      "id, title, type, status, scheduled_date, end_date, all_day, client:clients(id, name)"
    )
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", dayStart.toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(6)

  const typeLabels: Record<string, string> = {
    service: "Serviço",
    technical_visit: "Visita técnica",
    training: "Treinamento",
    meeting: "Reunião",
    other: "Outro",
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v)

  const fmtK = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
    return v.toFixed(0)
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            Olá, {profile?.full_name || "Jardineiro"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Aqui está a visão geral do seu negócio.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <NotificationsBell />
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 bg-card rounded-full py-1.5 pl-1.5 pr-4 border border-border shadow-sm hover:bg-accent transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile?.avatar_url || "/placeholder-user.jpg"}
              alt="Avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="hidden lg:block">
              <p className="text-[12px] font-semibold leading-tight">
                {profile?.full_name || "Usuário"}
              </p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Total de Clientes
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight mb-0.5">
              {(clientsCount || 0).toLocaleString("pt-BR")}
            </p>
            <ChangeIndicator value={clientsChange} />
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Clientes Ativos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight mb-0.5">
              {activeClientsCount.toLocaleString("pt-BR")}
            </p>
            <ChangeIndicator value={activeClientsChange} />
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Receita do Mês
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-lg font-bold leading-tight mb-0.5">
              {fmt(monthIncome)}
            </p>
            <ChangeIndicator value={revenueChange} />
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Resultado do Mês
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-lg font-bold leading-tight mb-0.5">
              {fmt(monthResult)}
            </p>
            <ChangeIndicator value={resultChange} />
          </CardContent>
        </Card>
      </div>

      {/* Content Grid: Left (grafico + produtividade) | Right (calendario + agenda) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-3">
          {/* Grafico de vendas */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-[14px] font-semibold">
                    Desempenho Financeiro &mdash;{" "}
                    {mMonth != null
                      ? `${mLabels[mMonth - 1]} / ${mYear}`
                      : mYear}
                  </h2>
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                      <span className="text-[11px] text-muted-foreground">
                        Receita {fmtK(totalChartReceita)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/20" />
                      <span className="text-[11px] text-muted-foreground">
                        Despesa {fmtK(totalChartDespesa)}
                      </span>
                    </div>
                  </div>
                </div>
                <Suspense
                  fallback={
                    <div className="h-9 w-36 rounded-full bg-muted animate-pulse" />
                  }
                >
                  <DashboardFilters />
                </Suspense>
              </div>
              <MonthlyChart data={chartData} />
            </CardContent>
          </Card>

          {/* Produtividade */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold">
                  Produtividade do Mês
                </h2>
                <Link
                  href="/dashboard/schedule"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Ver agenda
                </Link>
              </div>
              <ProductivityChart
                completed={completedThisMonth || 0}
                remaining={Math.max(
                  (totalMonthAppointments || 0) - (completedThisMonth || 0),
                  0
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-3">
          {/* Mini Calendario */}
          <Card className="py-0">
            <CardContent className="p-4">
              <MiniCalendar />
            </CardContent>
          </Card>

          {/* Proxima Agenda */}
          <Card className="py-0 flex-1 min-h-0">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-semibold">Próxima Agenda</h2>
                <Link
                  href="/dashboard/schedule"
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Ver todos
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto -mx-1 px-1 scrollbar-thin">
                {(upcomingAppointments || []).length > 0 ? (
                  upcomingAppointments!.map((a: any) => {
                    const date = new Date(a.scheduled_date)
                    const dayName = dayNames[date.getDay()]
                    const dateStr = `${dayName}, ${date.getDate()} ${monthNames[date.getMonth()]}`
                    const timeStr = a.all_day
                      ? "Dia inteiro"
                      : date.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                    const isCompleted = a.status === "completed"
                    const title =
                      a.title || typeLabels[a.type] || "Compromisso"
                    const clientName = a.client?.name || ""

                    return (
                      <Link
                        key={a.id}
                        href={`/dashboard/schedule/${a.id}`}
                        className="flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-b-0 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                      >
                        {isCompleted ? (
                          <div className="mt-0.5 h-[15px] w-[15px] rounded bg-primary flex items-center justify-center shrink-0">
                            <svg
                              width="9"
                              height="9"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-primary-foreground"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="mt-0.5 h-[15px] w-[15px] rounded border-[1.5px] border-border shrink-0" />
                        )}
                        <div className="shrink-0 w-[48px]">
                          <p className="text-[9px] text-muted-foreground font-medium leading-tight">
                            {dateStr}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {timeStr}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate leading-tight">
                            {title}
                          </p>
                          {clientName && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {clientName}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Nenhum agendamento encontrado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
