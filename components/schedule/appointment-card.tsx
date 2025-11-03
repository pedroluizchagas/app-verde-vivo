import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Appointment {
  id: string
  title: string
  description: string | null
  scheduled_date: string
  duration_minutes: number
  status: string
  client: {
    name: string
    phone: string
    address: string
  } | null
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusLabels = {
  scheduled: "Agendado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const date = new Date(appointment.scheduled_date)
  const dateStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Link href={`/dashboard/schedule/${appointment.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{appointment.title}</h3>
                {appointment.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{appointment.description}</p>
                )}
              </div>
              <Badge variant="secondary" className={statusColors[appointment.status as keyof typeof statusColors]}>
                {statusLabels[appointment.status as keyof typeof statusLabels]}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{dateStr}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {timeStr} ({appointment.duration_minutes} min)
                </span>
              </div>

              {appointment.client && (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span>{appointment.client.name}</span>
                  </div>

                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{appointment.client.address}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
