import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, default_price")
    .eq("gardener_id", user!.id)
    .order("name")

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">{services?.length || 0} serviço{services && services.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/services/new">Novo serviço</Link>
        </Button>
      </div>

      {services && services.length > 0 ? (
        <div className="grid gap-3">
          {services.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-lg">{s.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {typeof s.default_price === "number" && <p className="text-sm">Preço padrão: R$ {Number(s.default_price).toFixed(2)}</p>}
                {s.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{s.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
        </div>
      )}
    </div>
  )
}