"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TransactionEditFormProps {
  transaction: {
    id: string
    type: "income" | "expense"
    amount: number
    transaction_date: string
    status: "paid" | "pending"
    due_date: string | null
    paid_at: string | null
    category_id: string | null
    client_id: string | null
    description: string | null
  }
  categories: { id: string; name: string; parent_id: string | null; kind?: "expense" | "income" | null }[]
  clients: { id: string; name: string }[]
  onDone?: () => void
}

export function TransactionEditForm({ transaction, categories, clients, onDone }: TransactionEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<"income" | "expense">(transaction.type)
  const [amount, setAmount] = useState(Number(transaction.amount))
  const [transactionDate, setTransactionDate] = useState<string>(() => transaction.transaction_date.slice(0, 10))
  const [status, setStatus] = useState<"paid" | "pending">(transaction.status)
  const [dueDate, setDueDate] = useState<string>(transaction.due_date || "")
  const [categoryId, setCategoryId] = useState<string | null>(transaction.category_id)
  const [clientId, setClientId] = useState<string | null>(transaction.client_id)
  const [description, setDescription] = useState<string>(transaction.description || "")

  const categoryOptions = useMemo(() => {
    const byParent: Record<string, { id: string; name: string; parent_id: string | null; kind?: "expense" | "income" | null }[]> = {}
    categories.forEach((c) => {
      const key = c.parent_id || "root"
      byParent[key] = byParent[key] || []
      byParent[key].push(c)
    })
    const result: { id: string; label: string }[] = []
    const roots = byParent["root"] || []
    roots.forEach((root) => {
      const children = (byParent[root.id] || []).filter((ch) => ch.kind === type)
      children.forEach((ch) => result.push({ id: ch.id, label: `${root.name} > ${ch.name}` }))
    })
    return result
  }, [categories, type])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const payload: any = {
        type,
        amount,
        transaction_date: transactionDate,
        description: description || null,
        category_id: categoryId,
        client_id: clientId,
        status,
      }
      if (status === "paid") {
        payload.paid_at = new Date().toISOString()
        payload.due_date = null
      } else {
        payload.paid_at = null
        payload.due_date = dueDate || null
      }

      const { error: updateError } = await supabase
        .from("financial_transactions")
        .update(payload)
        .eq("id", transaction.id)
      if (updateError) throw updateError
      if (onDone) onDone()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Erro ao atualizar o lançamento")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense") }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "paid" | "pending") }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === "pending" && (
            <div>
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}

          <div>
            <Label>Categoria</Label>
            <Select value={categoryId || undefined} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cliente (opcional)</Label>
            <Select value={clientId || undefined} onValueChange={(v) => setClientId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: serviço concluído, material comprado..." />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={onDone} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}