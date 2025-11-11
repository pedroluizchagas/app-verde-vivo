import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard } from "lucide-react"

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Faça login para gerenciar seu plano</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link href="/auth/login">Ir para login</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="rounded-full"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /> Gerenciar plano</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Em breve: gerenciamento de assinatura, troca de plano, histórico de pagamentos e notas fiscais.</p>
          <div className="flex gap-2">
            <Button variant="default" disabled>Alterar plano</Button>
            <Button variant="outline" disabled>Método de pagamento</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}