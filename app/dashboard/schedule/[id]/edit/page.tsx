import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AppointmentForm } from "@/components/schedule/appointment-form"

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .single()

  if (!appointment) {
    notFound()
  }

  // Get clients for the dropdown
  const { data: clients } = await supabase.from("clients").select("id, name").eq("gardener_id", user!.id).order("name")

  // Get services for the dropdown
  const { data: services } = await supabase
    .from("services")
    .select("id, name")
    .eq("gardener_id", user!.id)
    .order("name")

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/schedule/${id}`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Editar agendamento</h1>
      </div>

      <AppointmentForm clients={clients || []} services={services || []} appointment={appointment} />
    </div>
  )
}
