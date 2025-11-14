import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ServiceForm } from "@/components/services/service-form"

export default function NewServicePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/services">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Novo serviço</h1>
      </div>
      <ServiceForm />
    </div>
  )
}