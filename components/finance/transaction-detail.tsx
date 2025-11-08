"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionEditForm } from "@/components/finance/transaction-edit-form"
import { DeleteTransactionButton } from "@/components/finance/delete-transaction-button"
import { ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react"

const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

interface TransactionDetailProps {
  transaction: any
  categories: { id: string; name: string; parent_id: string | null }[]
  clients: { id: string; name: string }[]
}

export function TransactionDetail({ transaction, categories, clients }: TransactionDetailProps) {
  const [editing, setEditing] = useState(false)
  const isIncome = transaction.type === "income"
  const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle

  if (editing) {
    return (
      <div className="space-y-3">
        <TransactionEditForm
          transaction={transaction}
          categories={categories}
          clients={clients}
          onDone={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TypeIcon className={isIncome ? "h-5 w-5 text-emerald-600" : "h-5 w-5 text-red-600"} />
            Lançamento financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{isIncome ? "Receita" : "Despesa"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className={isIncome ? "text-xl font-bold text-emerald-700" : "text-xl font-bold text-red-700"}>{currency(Number(transaction.amount))}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {new Date(transaction.transaction_date).toLocaleDateString("pt-BR")}</div>
            <div className="text-right"><span className="px-2 py-1 rounded-full bg-muted">{transaction.status === "paid" ? "Pago" : "Pendente"}</span></div>
          </div>
          {transaction.status === "pending" && transaction.due_date && (
            <div className="text-sm text-muted-foreground">Vencimento: {new Date(transaction.due_date).toLocaleDateString("pt-BR")}</div>
          )}
          {transaction.category && (
            <div className="text-sm">Categoria: <span className="text-muted-foreground">{transaction.category?.name || "Sem categoria"}</span></div>
          )}
          {transaction.client && (
            <div className="text-sm">Cliente: <span className="text-muted-foreground">{transaction.client?.name || "Sem cliente"}</span></div>
          )}
          {transaction.description && (
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm">{transaction.description}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>Editar</Button>
            <DeleteTransactionButton transactionId={transaction.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}