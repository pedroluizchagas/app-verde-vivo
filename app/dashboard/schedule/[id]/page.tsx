import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Calendar, Clock, MapPin, User, Phone, FileText } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteAppointmentButton } from "@/components/schedule/delete-appointment-button"

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
}

const typeLabels: Record<string, string> = {
  service: "Serviço",
  technical_visit: "Visita técnica",
  training: "Treinamento",
  meeting: "Reunião",
  other: "Outro",
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === "new") {
    redirect("/dashboard/schedule/new")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: appointment } = await supabase
    .from("appointments")
    .select(`*, client:clients(id, name, phone, address), service:services(name)`)
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .single()

  if (!appointment) {
    notFound()
  }

  const { data: order } = await supabase
    .from("service_orders")
    .select("id, title, status")
    .eq("gardener_id", user!.id)
    .eq("appointment_id", id)
    .maybeSingle()

  const date = new Date(appointment.scheduled_date)
  const dateStr = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  const timeStart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const endDate = (appointment as any).end_date
    ? new Date((appointment as any).end_date)
    : null
  const timeEnd = endDate
    ? endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null
  const timeDisplay = (appointment as any).all_day
    ? "Dia inteiro"
    : `${timeStart}${timeEnd ? ` – ${timeEnd}` : ""}`

  const statusColor =
    statusColors[appointment.status] ?? "bg-muted text-muted-foreground"
  const statusLabel = statusLabels[appointment.status] ?? appointment.status
  const typeLabel = (appointment as any).type
    ? typeLabels[(appointment as any).type]
    : null
  const location =
    (appointment as any).location || appointment.client?.address || null

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/schedule">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {appointment.title}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Detalhes do agendamento
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/schedule/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteAppointmentButton
            appointmentId={id}
            appointmentTitle={appointment.title}
          />
        </div>
      </div>

      {/* Grid: detalhes | cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        {/* Coluna esquerda: dados do agendamento */}
        <div className="flex flex-col gap-4">
          <Card className="py-0">
            <CardContent className="p-5">
              {/* Título + status + tipo */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-border/60">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[17px] leading-tight">
                    {appointment.title}
                  </p>
                  {typeLabel && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {typeLabel}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Data / Horário / Local */}
              <div className="flex flex-col divide-y divide-border/60">
                <div className="flex items-center gap-3 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                      Data
                    </p>
                    <p className="text-[13px] font-medium capitalize">
                      {dateStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                      Horário
                    </p>
                    <p className="text-[13px] font-medium">{timeDisplay}</p>
                  </div>
                </div>

                {location && (
                  <div className="flex items-start gap-3 py-2.5">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        Local
                      </p>
                      <p className="text-[13px] font-medium leading-snug">
                        {location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {appointment.description && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    Descrição
                  </p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {appointment.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ordem de serviço vinculada */}
          {order && (
            <Card className="py-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        Ordem de Serviço
                      </p>
                      <p className="text-[13px] font-semibold">{order.title}</p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[12px]"
                  >
                    <Link href={`/dashboard/work-orders/${order.id}`}>
                      Ver OS
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna direita: cliente */}
        {appointment.client && (
          <div className="flex flex-col gap-4">
            <Card className="py-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[14px] font-semibold">Cliente</h2>
                  <Link
                    href={`/dashboard/clients/${(appointment.client as any).id}`}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Ver perfil
                  </Link>
                </div>

                <div className="flex flex-col divide-y divide-border/60">
                  <Link
                    href={`/dashboard/clients/${(appointment.client as any).id}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        Nome
                      </p>
                      <p className="text-[13px] font-medium text-primary truncate">
                        {appointment.client.name}
                      </p>
                    </div>
                  </Link>

                  <a
                    href={`tel:${appointment.client.phone}`}
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
                        {appointment.client.phone}
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-3 py-2.5">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        Endereço
                      </p>
                      <p className="text-[13px] font-medium leading-snug">
                        {appointment.client.address}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
