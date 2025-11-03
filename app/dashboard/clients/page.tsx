import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { ClientCard } from "@/components/clients/client-card"
import { Input } from "@/components/ui/input"

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clients?.length || 0} cliente{clients?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/clients/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Adicionar cliente</span>
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar clientes..." className="h-11 pl-9" />
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid gap-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="rounded-full bg-muted p-6">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">Nenhum cliente cadastrado</h3>
            <p className="text-sm text-muted-foreground text-balance">Adicione seu primeiro cliente para começar</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/clients/new">Adicionar cliente</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
