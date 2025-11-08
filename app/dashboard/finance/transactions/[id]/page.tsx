import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { TransactionDetail } from "@/components/finance/transaction-detail"

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const id = params.id

  const { data: trx } = await supabase
    .from("financial_transactions")
    .select("*, category:financial_categories(name), client:clients(name)")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()

  if (!trx) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Lançamento não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link href="/dashboard/finance">Voltar ao Financeiro</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: categories } = await supabase
    .from("financial_categories")
    .select("id, name, parent_id")
    .eq("gardener_id", user!.id)

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("gardener_id", user!.id)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="rounded-full"><Link href="/dashboard/finance"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Detalhe do lançamento</h1>
      </div>

      <TransactionDetail transaction={trx} categories={categories || []} clients={clients || []} />
    </div>
  )
}