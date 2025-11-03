import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { AppointmentCard } from "@/components/schedule/appointment-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get upcoming appointments
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      client:clients(name, phone, address)
    `)
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", today.toISOString())
    .order("scheduled_date", { ascending: true })

  // Get past appointments
  const { data: pastAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      client:clients(name, phone, address)
    `)
    .eq("gardener_id", user!.id)
    .lt("scheduled_date", today.toISOString())
    .order("scheduled_date", { ascending: false })
    .limit(20)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {upcomingAppointments?.length || 0} agendamento{upcomingAppointments?.length !== 1 ? "s" : ""} próximo
            {upcomingAppointments?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/schedule/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Novo agendamento</span>
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="past">Anteriores</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingAppointments && upcomingAppointments.length > 0 ? (
            <div className="grid gap-3">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-muted p-6">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Nenhum agendamento</h3>
                <p className="text-sm text-muted-foreground text-balance">Crie seu primeiro agendamento</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/schedule/new">Novo agendamento</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastAppointments && pastAppointments.length > 0 ? (
            <div className="grid gap-3">
              {pastAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum agendamento anterior</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
