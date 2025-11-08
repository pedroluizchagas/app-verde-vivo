import { MovementForm } from "@/components/stock/movement-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function NewMovementPage({ searchParams }: { searchParams: Promise<{ appointment?: string }> }) {
  const { appointment } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, cost")
    .eq("gardener_id", user!.id)
    .order("name")

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, title")
    .eq("gardener_id", user!.id)
    .order("scheduled_date", { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/stock">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nova movimentação</h1>
      </div>

      <MovementForm products={products || []} appointments={appointments || []} defaultAppointmentId={appointment || null} />
    </div>
  )
}