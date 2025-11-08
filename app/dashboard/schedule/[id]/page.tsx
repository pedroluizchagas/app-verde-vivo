import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Calendar, Clock, User, MapPin, Phone, Package } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeleteAppointmentButton } from "@/components/schedule/delete-appointment-button"

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
    .select(`
      *,
      client:clients(id, name, phone, address),
      service:services(name)
    `)
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .single()

  if (!appointment) {
    notFound()
  }

  const date = new Date(appointment.scheduled_date)
  const dateStr = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Materials used and cost per service (sum of product_movements linked to this appointment)
  const { data: usedMaterials } = await supabase
    .from("product_movements")
    .select(`
      id,
      type,
      quantity,
      unit_cost,
      product:products(name, unit, cost)
    `)
    .eq("gardener_id", user!.id)
    .eq("appointment_id", id)
    .eq("type", "out")
    .order("movement_date", { ascending: false })

  const totalCost = (usedMaterials || []).reduce((sum, m: any) => sum + Number(m.quantity) * Number(m.unit_cost ?? m.product?.cost ?? 0), 0)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/schedule">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detalhes</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/schedule/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteAppointmentButton appointmentId={id} appointmentTitle={appointment.title} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{appointment.title}</CardTitle>
            <Badge variant="secondary" className={statusColors[appointment.status as keyof typeof statusColors]}>
              {statusLabels[appointment.status as keyof typeof statusLabels]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{dateStr}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {timeStr} ({appointment.duration_minutes} minutos)
            </span>
          </div>

          {appointment.service && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Serviço</p>
              <p className="text-muted-foreground">{appointment.service.name}</p>
            </div>
          )}

          {appointment.description && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Descrição</p>
              <p className="text-muted-foreground">{appointment.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5" />Materiais usados</CardTitle>
            <Button asChild variant="outline">
              <Link href={`/dashboard/stock/movements/new?appointment=${id}`}>Adicionar materiais</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usedMaterials && usedMaterials.length > 0 ? (
            <div className="grid gap-2">
              {usedMaterials.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{m.product?.name}</p>
                    <p className="text-xs text-muted-foreground">{Number(m.quantity)} {m.product?.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Custo unitário: R$ {Number(m.unit_cost ?? m.product?.cost ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Subtotal: R$ {(Number(m.quantity) * Number(m.unit_cost ?? m.product?.cost ?? 0)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-md bg-muted p-3">
                <p className="font-medium">Custo total do serviço</p>
                <p className="text-lg font-bold">R$ {totalCost.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum material vinculado a este serviço.</p>
          )}
        </CardContent>
      </Card>

      {appointment.client && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <Link href={`/dashboard/clients/${appointment.client.id}`} className="text-primary hover:underline">
                {appointment.client.name}
              </Link>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${appointment.client.phone}`} className="text-primary hover:underline">
                {appointment.client.phone}
              </a>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{appointment.client.address}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
