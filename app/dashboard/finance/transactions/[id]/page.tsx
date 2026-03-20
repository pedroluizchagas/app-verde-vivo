import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TransactionDetail } from "@/components/finance/transaction-detail"

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: trx } = await supabase
    .from("financial_transactions")
    .select("*, category:financial_categories(name), client:clients(name)")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()

  if (!trx) {
    notFound()
  }

  const { data: categories } = await supabase
    .from("financial_categories")
    .select("id, name, parent_id, kind")
    .eq("gardener_id", user!.id)

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("gardener_id", user!.id)

  const typeLabel = trx.type === "income" ? "Receita" : "Despesa"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/dashboard/finance">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
            {trx.description || typeLabel}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Detalhe do lançamento
          </p>
        </div>
      </div>

      <TransactionDetail
        transaction={trx}
        categories={categories || []}
        clients={clients || []}
      />
    </div>
  )
}
