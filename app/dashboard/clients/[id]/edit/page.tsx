import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ClientForm } from "@/components/clients/client-form"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).eq("gardener_id", user!.id).single()

  if (!client) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={`/dashboard/clients/${id}`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">Editar cliente</h1>
          <p className="text-[13px] text-muted-foreground">Atualize os dados do cliente</p>
        </div>
      </div>

      <ClientForm client={client} />
    </div>
  )
}
