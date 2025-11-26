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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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
  const [openCalc, setOpenCalc] = useState(false)
  const [lengthM, setLengthM] = useState<number>(0)
  const [widthM, setWidthM] = useState<number>(0)
  const [areasCount, setAreasCount] = useState<number>(1)
  const [wastePct, setWastePct] = useState<number>(0)
  const isAreaUnit = (() => {
    const raw = String(selectedProduct?.unit || "").toLowerCase().trim()
    const normalized = raw.replace(/\s+/g, "").replace(/²/g, "2")
    return normalized === "m2"
  })()
  const computedQty = (() => {
    const area = Number(lengthM) * Number(widthM) * Number(areasCount)
    const factor = 1 + (Number(wastePct) > 0 ? Number(wastePct) / 100 : 0)
    const qty = area * factor
    return isFinite(qty) && qty > 0 ? qty : 0
  })()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      if (!productId) throw new Error("Selecione um produto")
      const payload: any = {
        gardener_id: user.id,
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

      // Se for entrada com custo, registra automaticamente a despesa no Financeiro
      if (type === 'in') {
        const unit = payload.unit_cost ?? selectedProduct?.cost ?? 0
        const total = Number(quantity) * Number(unit)
        if (total > 0) {
          // Tenta localizar categoria "Estoque > Insumos"; cria se não existir
          let rootId: string | null = null
          let catId: string | null = null
          try {
            const { data: rootCat } = await supabase
              .from("financial_categories")
              .select("id")
              .eq("gardener_id", user.id)
              .eq("name", "Estoque")
              .limit(1)
              .maybeSingle()
            rootId = rootCat?.id ?? null

            const { data: childCat } = await supabase
              .from("financial_categories")
              .select("id")
              .eq("gardener_id", user.id)
              .eq("name", "Insumos")
              .eq("parent_id", rootId)
              .limit(1)
              .maybeSingle()
            catId = childCat?.id ?? null

            // Cria categorias sugeridas se não existirem
            if (!catId) {
              if (!rootId) {
                const { data: newRoot, error: rErr } = await supabase
                  .from("financial_categories")
                  .insert([{ gardener_id: user.id, name: "Estoque", parent_id: null, kind: "expense" }])
                  .select("id")
                  .single()
                if (!rErr) rootId = newRoot?.id ?? null
              }
              const { data: newChild, error: cErr } = await supabase
                .from("financial_categories")
                .insert([{ gardener_id: user.id, name: "Insumos", parent_id: rootId, kind: "expense" }])
                .select("id")
                .single()
              if (!cErr) catId = newChild?.id ?? null
            }

            await supabase.from("financial_transactions").insert([
              {
                gardener_id: user.id,
                type: "expense",
                amount: total,
                transaction_date: movementDate,
                description: description || `Compra de ${selectedProduct?.name || "produto"}`,
                category_id: catId,
                client_id: null,
                status: "paid",
                due_date: null,
                paid_at: new Date().toISOString(),
              },
            ])
          } catch (e) {
            // Não bloqueia o fluxo caso o registro financeiro falhe; apenas mantém o movimento
            console.warn("Falha ao registrar despesa de estoque:", e)
          }
        }
      }
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
              <Label>Quantidade{selectedProduct?.unit ? ` (${selectedProduct.unit})` : ""}</Label>
              <Input type="number" step="0.001" min="0.001" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              {isAreaUnit && (
                <div className="text-xs mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenCalc(true)}>Calcular área</Button>
                </div>
              )}
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
          <AlertDialog open={openCalc} onOpenChange={setOpenCalc}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Calcular área (m²)</AlertDialogTitle>
                <AlertDialogDescription>Informe as medidas para calcular a quantidade automaticamente.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Comprimento (m)</Label>
                  <Input type="number" step="0.01" min="0" value={lengthM} onChange={(e) => setLengthM(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Largura (m)</Label>
                  <Input type="number" step="0.01" min="0" value={widthM} onChange={(e) => setWidthM(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Áreas</Label>
                  <Input type="number" min="1" value={areasCount} onChange={(e) => setAreasCount(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Perda (%)</Label>
                  <Input type="number" step="0.01" min="0" value={wastePct} onChange={(e) => setWastePct(Number(e.target.value))} />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Quantidade calculada: <span className="font-medium">{new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(computedQty)}</span>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setOpenCalc(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setQuantity(computedQty || 0); setOpenCalc(false) }}>Aplicar quantidade</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div>
            <Label>Vincular a serviço (opcional)</Label>
            <Select value={appointmentId || undefined} onValueChange={(v) => setAppointmentId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo</SelectItem>
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