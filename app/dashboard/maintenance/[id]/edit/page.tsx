import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MaintenancePlanForm } from "@/components/maintenance/plan-form"

export default async function EditMaintenancePlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plan } = await supabase
    .from("maintenance_plans")
    .select("*")
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .maybeSingle()

  if (!plan) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/maintenance/${id}`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Editar plano de manutenção</h1>
      </div>

      <MaintenancePlanForm initialPlan={plan} />
    </div>
  )
}

