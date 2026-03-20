"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TransactionFormProps {
  categories: {
    id: string
    name: string
    parent_id: string | null
    kind?: "expense" | "income" | null
  }[]
  clients: { id: string; name: string }[]
}

export function TransactionForm({ categories, clients }: TransactionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<"income" | "expense">("income")
  const [amount, setAmount] = useState<string>("")
  const [transactionDate, setTransactionDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  )
  const [status, setStatus] = useState<"paid" | "pending">("paid")
  const [dueDate, setDueDate] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [description, setDescription] = useState<string>("")

  const categoryOptions = useMemo(() => {
    const byParent: Record<
      string,
      {
        id: string
        name: string
        parent_id: string | null
        kind?: "expense" | "income" | null
      }[]
    > = {}
    categories.forEach((c) => {
      const key = c.parent_id || "root"
      byParent[key] = byParent[key] || []
      byParent[key].push(c)
    })
    const result: { id: string; label: string }[] = []
    const roots = byParent["root"] || []
    roots.forEach((root) => {
      const children = (byParent[root.id] || []).filter(
        (ch) => ch.kind === type
      )
      children.forEach((ch) =>
        result.push({ id: ch.id, label: `${root.name} > ${ch.name}` })
      )
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
        amount: Number(amount) || 0,
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

      const { error: insertError } = await supabase
        .from("financial_transactions")
        .insert(payload)
      if (insertError) throw insertError
      router.push("/dashboard/finance")
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Erro ao salvar o lançamento")
      setIsLoading(false)
    }
  }

  const isIncome = type === "income"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="py-0">
        <CardContent className="p-5 flex flex-col gap-5">

          {/* Tipo: toggle visual */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
              Tipo
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType("income"); setCategoryId(null) }}
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-[14px] font-semibold transition-all",
                  isIncome
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border text-muted-foreground hover:border-muted-foreground/40"
                )}
              >
                <ArrowUpRight className="h-4 w-4 shrink-0" />
                Receita
              </button>
              <button
                type="button"
                onClick={() => { setType("expense"); setCategoryId(null) }}
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-[14px] font-semibold transition-all",
                  !isIncome
                    ? "border-red-400 bg-red-500/10 text-red-500 dark:text-red-400"
                    : "border-border text-muted-foreground hover:border-muted-foreground/40"
                )}
              >
                <ArrowDownRight className="h-4 w-4 shrink-0" />
                Despesa
              </button>
            </div>
          </div>

          {/* Valor: campo grande e proeminente */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="amount"
              className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              Valor
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-[16px] pointer-events-none select-none">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
                className={cn(
                  "h-14 pl-11 text-[22px] font-bold tabular-nums",
                  isIncome
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                )}
              />
            </div>
          </div>

          {/* Data + Status */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="transaction_date"
                  className="text-[12px] font-medium"
                >
                  Data do lançamento
                </Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[12px] font-medium">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("paid")}
                    className={cn(
                      "h-11 rounded-xl border-2 text-[13px] font-medium transition-all",
                      status === "paid"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border text-muted-foreground hover:border-muted-foreground/40"
                    )}
                  >
                    Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("pending")}
                    className={cn(
                      "h-11 rounded-xl border-2 text-[13px] font-medium transition-all",
                      status === "pending"
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-border text-muted-foreground hover:border-muted-foreground/40"
                    )}
                  >
                    Pendente
                  </button>
                </div>
              </div>
            </div>

            {status === "pending" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="due_date" className="text-[12px] font-medium">
                  Data de vencimento
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-11"
                />
              </div>
            )}
          </div>

          {/* Categoria + Cliente */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category" className="text-[12px] font-medium">
                Categoria
              </Label>
              <Select
                value={categoryId || "none"}
                onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
              >
                <SelectTrigger id="category" className="h-11">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categoryOptions.length > 0 ? (
                    categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled>
                      Nenhuma categoria para {isIncome ? "receita" : "despesa"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client" className="text-[12px] font-medium">
                Cliente{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Select
                value={clientId || "none"}
                onValueChange={(v) => setClientId(v === "none" ? null : v)}
              >
                <SelectTrigger id="client" className="h-11">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cliente</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-[12px] font-medium">
              Descrição{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isIncome
                  ? "Ex.: serviço de jardinagem concluído, pagamento de manutenção..."
                  : "Ex.: compra de insumos, ferramentas, combustível..."
              }
              className="min-h-24 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={cn(
                "flex-1 gap-2",
                isIncome
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  : "bg-red-500 hover:bg-red-600 text-white dark:bg-red-500 dark:hover:bg-red-600"
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                "Salvando..."
              ) : (
                <>
                  {isIncome ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  Registrar {isIncome ? "receita" : "despesa"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
