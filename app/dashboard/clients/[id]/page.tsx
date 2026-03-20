import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Camera,
  Calendar,
  FileText,
  CheckCircle2,
  CalendarPlus,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteClientButton } from "@/components/clients/delete-client-button"

const appointmentStatusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  in_progress: "Em andamento",
  no_show: "Não compareceu",
}

const appointmentStatusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-muted text-muted-foreground",
}

const budgetStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Recusado",
  cancelled: "Cancelado",
}

const budgetStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
}

const AVATAR_COLORS = [
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-teal-500/15 text-teal-600 dark:text-teal-400",
]

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === "new") {
    redirect("/dashboard/clients/new")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .single()

  if (!client) {
    notFound()
  }

  const [
    { data: appointments },
    { data: budgets },
    { count: photosCount },
    { count: totalAppointments },
    { count: completedAppointments },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", id)
      .order("scheduled_date", { ascending: false })
      .limit(5),
    supabase
      .from("budgets")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("status", "completed"),
  ])

  // proximo agendamento futuro
  const nextAppointment = (appointments || []).find(
    (a) => new Date(a.scheduled_date) >= new Date() && a.status !== "cancelled"
  )

  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w.charAt(0).toUpperCase())
    .join("")

  const avatarColor = getAvatarColor(client.name)

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v)

  const memberSince = new Date(client.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {client.name}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Cliente desde {memberSince}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/clients/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteClientButton clientId={id} clientName={client.name} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Agendamentos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {totalAppointments ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">no total</p>
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
              {completedAppointments ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">serviços</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Fotos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {photosCount ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              registrada{(photosCount ?? 0) !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acoes rapidas */}
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="h-9 rounded-lg text-[13px] gap-1.5">
          <Link href="/dashboard/schedule/new">
            <CalendarPlus className="h-4 w-4" />
            Agendar serviço
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 rounded-lg text-[13px] gap-1.5">
          <Link href="/dashboard/budgets/new">
            <Receipt className="h-4 w-4" />
            Novo orçamento
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 rounded-lg text-[13px] gap-1.5">
          <Link href={`/dashboard/clients/${id}/photos`}>
            <Camera className="h-4 w-4" />
            Fotos
          </Link>
        </Button>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-4">
          {/* Perfil de contato */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/60">
                <div
                  className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 text-lg font-bold ${avatarColor}`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[16px] leading-tight truncate">
                    {client.name}
                  </p>
                  {nextAppointment ? (
                    <p className="text-[12px] text-primary mt-0.5">
                      Próximo:{" "}
                      {new Date(
                        nextAppointment.scheduled_date
                      ).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  ) : (
                    client.notes && (
                      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                        {client.notes}
                      </p>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col divide-y divide-border/60">
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                      Telefone
                    </p>
                    <p className="text-[13px] font-medium text-primary truncate">
                      {client.phone}
                    </p>
                  </div>
                </a>

                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        E-mail
                      </p>
                      <p className="text-[13px] font-medium text-primary truncate">
                        {client.email}
                      </p>
                    </div>
                  </a>
                )}

                <div className="flex items-start gap-3 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                      Endereço
                    </p>
                    <p className="text-[13px] font-medium leading-snug">
                      {client.address}
                    </p>
                  </div>
                </div>
              </div>

              {client.notes && nextAppointment && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                    Observações
                  </p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {client.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">
          {/* Agendamentos recentes */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h2 className="text-[14px] font-semibold">Agendamentos</h2>
                </div>
                <Link
                  href="/dashboard/schedule"
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Ver todos
                </Link>
              </div>

              {appointments && appointments.length > 0 ? (
                <div className="flex flex-col">
                  {appointments.map((apt: any) => {
                    const statusLabel =
                      appointmentStatusLabels[apt.status] ?? apt.status
                    const statusColor =
                      appointmentStatusColors[apt.status] ??
                      "bg-muted text-muted-foreground"
                    const dateStr = new Date(
                      apt.scheduled_date
                    ).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    return (
                      <Link
                        key={apt.id}
                        href={`/dashboard/schedule/${apt.id}`}
                        className="flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-b-0 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate leading-tight">
                            {apt.title || "Serviço"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {dateStr}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Nenhum agendamento encontrado.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Orcamentos recentes */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h2 className="text-[14px] font-semibold">Orçamentos</h2>
                </div>
                <Link
                  href="/dashboard/budgets"
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Ver todos
                </Link>
              </div>

              {budgets && budgets.length > 0 ? (
                <div className="flex flex-col">
                  {budgets.map((budget: any) => {
                    const statusLabel =
                      budgetStatusLabels[budget.status] ?? budget.status
                    const statusColor =
                      budgetStatusColors[budget.status] ??
                      "bg-muted text-muted-foreground"
                    return (
                      <Link
                        key={budget.id}
                        href={`/dashboard/budgets/${budget.id}`}
                        className="flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-b-0 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate leading-tight">
                            {budget.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {fmt(Number(budget.total_amount))}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Nenhum orçamento encontrado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
