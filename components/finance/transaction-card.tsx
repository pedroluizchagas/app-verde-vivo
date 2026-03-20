import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
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

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

export function TransactionCard({ transaction }: TransactionCardProps) {
  const isIncome = transaction.type === "income"

  const dateStr = new Date(
    `${transaction.transaction_date}T12:00:00`
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const statusColor =
    transaction.status === "paid"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  const statusLabel = transaction.status === "paid" ? "Pago" : "Pendente"

  const amountColor = isIncome
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-500 dark:text-red-400"

  const borderColor = isIncome ? "border-l-emerald-500" : "border-l-red-400"

  const meta = [
    transaction.category?.name,
    transaction.client?.name,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Link href={`/dashboard/finance/transactions/${transaction.id}`}>
      <Card
        className={`py-0 border-l-4 ${borderColor} transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Ícone de tipo */}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                isIncome
                  ? "bg-emerald-500/10"
                  : "bg-red-500/10"
              }`}
            >
              {isIncome ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500 dark:text-red-400" />
              )}
            </div>

            {/* Descrição + meta */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] leading-tight truncate">
                {transaction.description || "(sem descrição)"}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                {meta && (
                  <span className="text-[11px] text-muted-foreground truncate">
                    {meta}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {dateStr}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Valor + ações */}
            <div className="flex items-center gap-2 shrink-0">
              <p className={`text-[15px] font-bold tabular-nums ${amountColor}`}>
                {isIncome ? "+" : "-"}
                {currency(Number(transaction.amount))}
              </p>
              <div onClick={(e) => e.preventDefault()}>
                <DeleteTransactionButton transactionId={transaction.id} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
