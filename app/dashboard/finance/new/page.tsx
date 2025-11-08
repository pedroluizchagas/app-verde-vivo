import { TransactionForm } from "@/components/finance/transaction-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function NewTransactionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from("financial_categories")
    .select("id, name, parent_id, kind")
    .eq("gardener_id", user!.id)
    .order("name")

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("gardener_id", user!.id)
    .order("name")

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/finance">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Novo lançamento</h1>
      </div>

      <TransactionForm categories={categories || []} clients={clients || []} />
    </div>
  )
}