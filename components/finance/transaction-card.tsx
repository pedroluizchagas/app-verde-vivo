import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteTransactionButton } from "@/components/finance/delete-transaction-button"

interface TransactionCardProps {
  transaction: {
    id: string
    type: "income" | "expense"
    amount: number
    transaction_date: string
    description: string | null
    status: "paid" | "pending"
    category?: { name: string | null } | null
    client?: { name: string | null } | null
  }
}

const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export function TransactionCard({ transaction }: TransactionCardProps) {
  const isIncome = transaction.type === "income"
  const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle
  const typeLabel = isIncome ? "Receita" : "Despesa"

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <TypeIcon className={isIncome ? "h-5 w-5 text-emerald-600" : "h-5 w-5 text-red-600"} />
          <div>
            <div className="flex items-center gap-2">
              <Badge className={isIncome ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{typeLabel}</Badge>
              <span className="text-sm text-muted-foreground">{transaction.category?.name || "Sem categoria"}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{transaction.client?.name || "Sem cliente"}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{transaction.description || "(sem descrição)"}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" /> {new Date(transaction.transaction_date).toLocaleDateString("pt-BR")}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-muted">{transaction.status === "paid" ? "Pago" : "Pendente"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className={isIncome ? "text-lg font-bold text-emerald-700" : "text-lg font-bold text-red-700"}>{currency(Number(transaction.amount))}</p>
          <DeleteTransactionButton transactionId={transaction.id} />
        </div>
      </CardContent>
    </Card>
  )
}