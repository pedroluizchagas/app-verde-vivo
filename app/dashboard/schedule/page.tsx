import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, CheckCircle2, Clock3, CalendarDays } from "lucide-react"
import Link from "next/link"
import { AppointmentCard } from "@/components/schedule/appointment-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { MiniCalendar } from "@/components/dashboard/mini-calendar"

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-blue-500",
  in_progress: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
}

function groupByDate(appointments: any[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeekStart = new Date(today)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)

  const DAY_NAMES = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ]

  const groups: { label: string; date: Date; appointments: any[] }[] = []
  const groupMap = new Map<string, any[]>()

  for (const apt of appointments) {
    const d = new Date(apt.scheduled_date)
    const aptDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const key = aptDay.toISOString()

    let label: string
    if (aptDay.getTime() === today.getTime()) {
      label = "Hoje"
    } else if (aptDay.getTime() === tomorrow.getTime()) {
      label = "Amanhã"
    } else if (aptDay < nextWeekStart) {
      label = DAY_NAMES[aptDay.getDay()]
    } else {
      label = aptDay.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: aptDay.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      })
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, [])
      groups.push({ label, date: aptDay, appointments: groupMap.get(key)! })
    }
    groupMap.get(key)!.push(apt)
  }

  return groups
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(`*, client:clients(name, phone, address)`)
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", today.toISOString())
    .order("scheduled_date", { ascending: true })

  const { data: pastAppointments } = await supabase
    .from("appointments")
    .select(`*, client:clients(name, phone, address)`)
    .eq("gardener_id", user!.id)
    .lt("scheduled_date", today.toISOString())
    .order("scheduled_date", { ascending: false })
    .limit(30)

  const { count: completedThisMonth } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .eq("status", "completed")
    .gte("scheduled_date", monthStart.toISOString())
    .lte("scheduled_date", monthEnd.toISOString())

  const upcomingList = upcomingAppointments || []
  const pastList = pastAppointments || []

  const todayAppointments = upcomingList.filter((a) => {
    const d = new Date(a.scheduled_date)
    return d <= todayEnd
  })
  const weekCount = upcomingList.filter((a) => {
    const d = new Date(a.scheduled_date)
    return d < weekEnd
  }).length

  const upcomingCount = upcomingList.length
  const groups = groupByDate(upcomingList)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {upcomingCount} agendamento{upcomingCount !== 1 ? "s" : ""} próximo
            {upcomingCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/schedule/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Novo agendamento</span>
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Hoje
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {todayAppointments.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              agendamento{todayAppointments.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Esta semana
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">{weekCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              agendamento{weekCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Concluídos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {completedThisMonth ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        {/* Coluna esquerda: Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="h-9">
            <TabsTrigger value="upcoming" className="text-[13px] gap-1.5">
              Próximos
              {upcomingCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                  {upcomingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="text-[13px]">
              Anteriores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {groups.length > 0 ? (
              <div className="flex flex-col gap-6">
                {groups.map((group) => (
                  <div key={group.date.toISOString()}>
                    {/* Cabecalho de secao */}
                    <div className="flex items-center gap-2 mb-3">
                      <h3
                        className={`text-[11px] font-semibold uppercase tracking-wider shrink-0 ${
                          group.label === "Hoje"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {group.label}
                      </h3>
                      {group.label === "Hoje" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                      )}
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {group.appointments.length}{" "}
                        {group.appointments.length !== 1
                          ? "serviços"
                          : "serviço"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {group.appointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">Nenhum agendamento próximo</h3>
                  <p className="text-sm text-muted-foreground text-balance">
                    Crie um novo agendamento para começar
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/schedule/new">Novo agendamento</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {pastList.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pastList.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum agendamento anterior.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Coluna direita: Calendario + Hoje */}
        <div className="hidden lg:flex flex-col gap-3">
          <Card className="py-0">
            <CardContent className="p-4">
              <MiniCalendar />
            </CardContent>
          </Card>

          {todayAppointments.length > 0 ? (
            <Card className="py-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold">Serviços de hoje</h3>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                    {todayAppointments.length}
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-border/40">
                  {todayAppointments.map((a) => {
                    const time = a.all_day
                      ? "Dia inteiro"
                      : new Date(a.scheduled_date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                    const dot = STATUS_DOT[a.status] ?? "bg-muted-foreground"
                    return (
                      <Link
                        key={a.id}
                        href={`/dashboard/schedule/${a.id}`}
                        className="flex items-center gap-2.5 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${dot}`}
                        />
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums w-9">
                          {time}
                        </span>
                        <span className="text-[12px] font-medium truncate">
                          {a.title}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              <CardContent className="p-4">
                <h3 className="text-[13px] font-semibold mb-2">
                  Serviços de hoje
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Nenhum serviço para hoje.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
