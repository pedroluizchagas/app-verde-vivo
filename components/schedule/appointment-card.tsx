import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, User, MapPin } from "lucide-react"

interface Appointment {
  id: string
  title: string
  description: string | null
  scheduled_date: string
  end_date?: string | null
  duration_minutes: number
  status: string
  type?: string
  location?: string | null
  all_day?: boolean
  client: {
    name: string
    phone: string
    address: string
  } | null
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusBorderColors: Record<string, string> = {
  scheduled: "border-l-blue-500",
  in_progress: "border-l-amber-500",
  completed: "border-l-emerald-500",
  cancelled: "border-l-red-400",
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

const MONTH_ABBR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
]

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const date = new Date(appointment.scheduled_date)
  const day = date.getDate()
  const month = MONTH_ABBR[date.getMonth()]

  const timeStart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const end = appointment.end_date ? new Date(appointment.end_date) : null
  const timeEnd = end
    ? end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null
  const timeStr = appointment.all_day
    ? "Dia inteiro"
    : `${timeStart}${timeEnd ? ` \u2013 ${timeEnd}` : ""}`

  const statusColor =
    statusColors[appointment.status] ?? "bg-muted text-muted-foreground"
  const borderColor =
    statusBorderColors[appointment.status] ?? "border-l-border"
  const statusLabel = statusLabels[appointment.status] ?? appointment.status
  const typeLabel = appointment.type ? typeLabels[appointment.type] : null

  const displayLocation = appointment.location || null

  return (
    <Link href={`/dashboard/schedule/${appointment.id}`}>
      <Card
        className={`py-0 border-l-4 ${borderColor} transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Bloco de data */}
            <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-muted">
              <span className="text-[18px] font-bold leading-none tabular-nums">
                {day}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">
                {month}
              </span>
            </div>

            {/* Informacoes */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0 mb-1">
                <p className="font-semibold text-[14px] leading-tight truncate">
                  {appointment.title}
                </p>
                {typeLabel && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    {typeLabel}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    {timeStr}
                  </span>
                </div>
                {appointment.client && (
                  <div className="flex items-center gap-1 min-w-0">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {appointment.client.name}
                    </span>
                  </div>
                )}
                {displayLocation && (
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {displayLocation}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Badge de status */}
            <span
              className={`text-[10px] font-medium px-2 py-1 rounded-full shrink-0 ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
