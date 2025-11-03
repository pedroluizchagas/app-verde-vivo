"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BudgetFormProps {
  clients: { id: string; name: string }[]
  budget?: {
    id: string
    title: string
    description: string | null
    client_id: string
    total_amount: number
    status: string
    valid_until: string | null
  }
}

export function BudgetForm({ clients, budget }: BudgetFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState(budget?.client_id || "")
  const [status, setStatus] = useState(budget?.status || "pending")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("Usuário não autenticado")
      setIsLoading(false)
      return
    }

    if (!selectedClient) {
      setError("Selecione um cliente")
      setIsLoading(false)
      return
    }

    const validUntil = formData.get("valid_until") as string

    const budgetData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      client_id: selectedClient,
      total_amount: Number.parseFloat(formData.get("total_amount") as string),
      status: status,
      valid_until: validUntil || null,
      gardener_id: user.id,
    }

    try {
      if (budget) {
        const { error } = await supabase.from("budgets").update(budgetData).eq("id", budget.id)

        if (error) throw error
        router.push(`/dashboard/budgets/${budget.id}`)
      } else {
        const { error } = await supabase.from("budgets").insert([budgetData])

        if (error) throw error
        router.push("/dashboard/budgets")
      }
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao salvar orçamento")
    } finally {
      setIsLoading(false)
    }
  }

  const defaultValidUntil = budget?.valid_until ? new Date(budget.valid_until).toISOString().split("T")[0] : ""

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Manutenção completa do jardim"
              required
              defaultValue={budget?.title}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient} required>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="total_amount">Valor total (R$) *</Label>
            <Input
              id="total_amount"
              name="total_amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              defaultValue={budget?.total_amount}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valid_until">Válido até</Label>
            <Input id="valid_until" name="valid_until" type="date" defaultValue={defaultValidUntil} className="h-11" />
          </div>

          {budget && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalhes sobre os serviços incluídos no orçamento"
              defaultValue={budget?.description || ""}
              className="min-h-32 resize-none"
            />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : budget ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
