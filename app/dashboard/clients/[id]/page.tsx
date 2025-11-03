import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, MapPin, Phone, Mail, Camera } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteClientButton } from "@/components/clients/delete-client-button"

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

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).eq("gardener_id", user!.id).single()

  if (!client) {
    notFound()
  }

  // Get related data
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", id)
    .order("scheduled_date", { ascending: false })
    .limit(5)

  const { data: budgets } = await supabase
    .from("budgets")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { count: photosCount } = await supabase
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detalhes</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/clients/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteClientButton clientId={id} clientName={client.name} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{client.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${client.phone}`} className="text-primary hover:underline">
              {client.phone}
            </a>
          </div>

          {client.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                {client.email}
              </a>
            </div>
          )}

          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{client.address}</span>
          </div>

          {client.notes && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Observações</p>
              <p className="text-muted-foreground">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Fotos</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/clients/${id}/photos`}>
              <Camera className="mr-2 h-4 w-4" />
              Ver todas ({photosCount || 0})
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agendamentos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments && appointments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{apt.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.scheduled_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum agendamento</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orçamentos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets && budgets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {budgets.map((budget) => (
                <div key={budget.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{budget.title}</p>
                    <p className="text-sm text-muted-foreground">R$ {Number(budget.total_amount).toFixed(2)}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {budget.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum orçamento</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
