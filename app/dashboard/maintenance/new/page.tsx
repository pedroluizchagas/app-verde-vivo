import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MaintenancePlanForm } from "@/components/maintenance/plan-form"

export default function NewMaintenancePlanPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/maintenance">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Novo plano de manutenção</h1>
      </div>
      <MaintenancePlanForm />
    </div>
  )
}