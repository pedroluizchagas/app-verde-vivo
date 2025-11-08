"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MovementFormProps {
  products: { id: string; name: string; unit: string; cost: number }[]
  appointments: { id: string; title: string | null }[]
  defaultAppointmentId?: string | null
}

export function MovementForm({ products, appointments, defaultAppointmentId = null }: MovementFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [productId, setProductId] = useState<string | null>(null)
  const [type, setType] = useState<'in' | 'out'>('out')
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState<number | undefined>(undefined)
  const [movementDate, setMovementDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [appointmentId, setAppointmentId] = useState<string | null>(defaultAppointmentId)
  const [description, setDescription] = useState<string>("")

  const selectedProduct = products.find((p) => p.id === productId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      if (!productId) throw new Error("Selecione um produto")
      const payload: any = {
        product_id: productId,
        type,
        quantity,
        unit_cost: unitCost ?? selectedProduct?.cost ?? null,
        movement_date: movementDate,
        description: description || null,
        appointment_id: appointmentId,
      }
      const { error: insertError } = await supabase.from("product_movements").insert(payload)
      if (insertError) throw insertError
      router.push("/dashboard/stock")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao registrar movimentação")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Produto</Label>
              <Select value={productId || undefined} onValueChange={(v) => setProductId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'in' | 'out')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="out">Saída</SelectItem>
                  <SelectItem value="in">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Quantidade</Label>
              <Input type="number" step="0.001" min="0.001" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <Label>Custo unitário (R$)</Label>
              <Input type="number" step="0.01" min="0" value={unitCost ?? ''} onChange={(e) => setUnitCost(Number(e.target.value))} placeholder={selectedProduct ? String(selectedProduct.cost) : ""} />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Vincular a serviço (opcional)</Label>
            <Select value={appointmentId || undefined} onValueChange={(v) => setAppointmentId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem vínculo</SelectItem>
                {appointments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.title || a.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: uso no serviço, compra fornecida, etc." />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}