"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface WorkOrderEditFormProps {
  order: any
  items: { id: string; product_id: string; quantity: number; unit_cost: number; unit_price: number; unit?: string; product?: { name: string; unit: string } }[]
  clients: { id: string; name: string }[]
  appointments: { id: string; title: string | null }[]
  products: { id: string; name: string; unit: string; cost: number }[]
}

export function WorkOrderEditForm({ order, items: initialItems, clients, appointments, products }: WorkOrderEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [appointmentId, setAppointmentId] = useState<string | null>(order?.appointment_id || null)
  const [clientId, setClientId] = useState<string | null>(order?.client_id || null)
  const [title, setTitle] = useState<string>(order?.title || "")
  const [description, setDescription] = useState<string>(order?.description || "")
  const [status, setStatus] = useState<"draft" | "issued" | "completed" | "cancelled">(order?.status || "issued")

  const [laborCost, setLaborCost] = useState<number>(Number(order?.labor_cost || 0))
  const [markupPct] = useState<number>(Number(order?.materials_markup_pct || 0))
  const [discount, setDiscount] = useState<number>(Number(order?.discount || 0))

  const [items, setItems] = useState(initialItems.map((it) => ({ product_id: it.product_id, quantity: Number(it.quantity), unit_cost: Number(it.unit_cost), unit_price: Number(it.unit_price), unit: String((it as any).unit || it.product?.unit || "un") })))

  const [newProductId, setNewProductId] = useState<string | null>(null)
  const [newUnit, setNewUnit] = useState<string>("un")
  const [newQuantity, setNewQuantity] = useState<number>(1)
  const [lengthM, setLengthM] = useState<number>(0)
  const [widthM, setWidthM] = useState<number>(0)
  const [areasCount, setAreasCount] = useState<number>(1)
  const [wastePct, setWastePct] = useState<number>(0)
  const [openCalc, setOpenCalc] = useState(false)

  const unitOptions = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => set.add(String(p.unit || "un")))
    ;["m2", "m", "un", "kg", "L"].forEach((u) => set.add(u))
    return Array.from(set)
  }, [products])
  const isAreaUnit = useMemo(() => {
    const raw = String(newUnit || "").toLowerCase().trim()
    const normalized = raw.replace(/\s+/g, "").replace(/²/g, "2")
    return normalized === "m2"
  }, [newUnit])

  const computedQty = useMemo(() => {
    const area = Number(lengthM) * Number(widthM) * Number(areasCount)
    const factor = 1 + (Number(wastePct) > 0 ? Number(wastePct) / 100 : 0)
    const qty = area * factor
    return isFinite(qty) && qty > 0 ? qty : 0
  }, [lengthM, widthM, areasCount, wastePct])

  const materialsBaseTotal = useMemo(() => items.reduce((sum, it) => sum + Number(it.unit_cost) * Number(it.quantity), 0), [items])
  const materialsPriceTotal = useMemo(() => items.reduce((sum, it) => sum + Number(it.unit_price) * Number(it.quantity), 0), [items])
  const total = useMemo(() => Number(laborCost) + materialsPriceTotal - Number(discount), [laborCost, materialsPriceTotal, discount])

  const addItem = () => {
    if (!newProductId) return
    const p = products.find((x) => x.id === newProductId)
    if (!p) return
    const base = Number(p.cost || 0)
    const price = base * (1 + (Number(markupPct) > 0 ? Number(markupPct) / 100 : 0))
    const qty = Number(newQuantity) || 1
    setItems((prev) => [...prev, { product_id: p.id, quantity: qty, unit_cost: base, unit_price: price, unit: newUnit || (p.unit || "un") }])
    setNewProductId(null)
    setNewUnit("un")
    setNewQuantity(1)
    setLengthM(0)
    setWidthM(0)
    setAreasCount(1)
    setWastePct(0)
  }

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItemQuantity = (idx: number, qty: number) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: qty } : it))
  }

  const updateItemUnit = (idx: number, unit: string) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, unit } : it))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      if (!clientId) throw new Error("Selecione um cliente")
      const payload: any = {
        client_id: clientId,
        appointment_id: appointmentId,
        title: title || "Serviço",
        description: description || null,
        status,
        labor_cost: Number(laborCost) || 0,
        materials_total: Number(materialsBaseTotal) || 0,
        materials_markup_pct: Number(markupPct) || 0,
        discount: Number(discount) || 0,
        total_amount: Number(total) || 0,
      }
      const { error: updateError } = await supabase.from("service_orders").update(payload).eq("id", order.id)
      if (updateError) throw updateError

      await supabase.from("service_order_items").delete().eq("order_id", order.id)
      if (items.length > 0) {
        const rows = items.map((it) => ({ order_id: order.id, product_id: it.product_id, quantity: it.quantity, unit_cost: it.unit_cost, unit_price: it.unit_price, total_price: Number(it.unit_price) * Number(it.quantity), unit: it.unit || null }))
        const { error: itemsErr } = await supabase.from("service_order_items").insert(rows)
        if (itemsErr) throw itemsErr
      }
      router.push(`/dashboard/work-orders/${order.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao atualizar OS")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Cliente</Label>
              <Select value={clientId || undefined} onValueChange={(v) => setClientId(v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agendamento</Label>
              <Select value={appointmentId || undefined} onValueChange={(v) => setAppointmentId(v === "none" ? null : v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {appointments.map((a) => (<SelectItem key={a.id} value={a.id}>{a.title || a.id}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="issued">Emitida</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Mão de obra (R$)</Label>
              <Input type="number" step="0.01" min="0" value={laborCost} onChange={(e) => setLaborCost(Number(e.target.value))} />
            </div>
            <div>
              <Label>Desconto (R$)</Label>
              <Input type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Materiais</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={newProductId || undefined} onValueChange={(v) => { setNewProductId(v); const p = products.find((x) => x.id === v); setNewUnit(String(p?.unit || "un")) }}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>))}
                </SelectContent>
              </Select>
              <div className="space-y-1">
                <Label>Unidade</Label>
                <Select value={newUnit} onValueChange={(v) => setNewUnit(v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["m2","m","un","kg","L"].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Quantidade</Label>
                <Input type="number" step="0.001" min="0.001" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} />
                {isAreaUnit && (
                  <div className="text-xs"><Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => setOpenCalc(true)}>Calcular área</Button></div>
                )}
              </div>
              <Button type="button" onClick={addItem}>Adicionar</Button>
            </div>
            <AlertDialog open={openCalc} onOpenChange={setOpenCalc}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Calcular área (m²)</AlertDialogTitle>
                  <AlertDialogDescription>Informe as medidas para calcular a quantidade automaticamente.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Comprimento (m)</Label><Input type="number" step="0.01" min="0" value={lengthM} onChange={(e) => setLengthM(Number(e.target.value))} /></div>
                  <div className="space-y-1"><Label>Largura (m)</Label><Input type="number" step="0.01" min="0" value={widthM} onChange={(e) => setWidthM(Number(e.target.value))} /></div>
                  <div className="space-y-1"><Label>Áreas</Label><Input type="number" min="1" value={areasCount} onChange={(e) => setAreasCount(Number(e.target.value))} /></div>
                  <div className="space-y-1"><Label>Perda (%)</Label><Input type="number" step="0.01" min="0" value={wastePct} onChange={(e) => setWastePct(Number(e.target.value))} /></div>
                </div>
                <div className="text-sm text-muted-foreground">Quantidade calculada: <span className="font-medium">{new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(computedQty)}</span></div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setOpenCalc(false)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setNewQuantity(computedQty || 0); setOpenCalc(false) }}>Aplicar quantidade</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {items.length > 0 ? (
              <div className="grid gap-2">
                {items.map((it, idx) => {
                  const p = products.find((x) => x.id === it.product_id)
                  const lineTotal = Number(it.unit_price) * Number(it.quantity)
                  return (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 items-center gap-3 rounded-md border p-3">
                      <div className="sm:col-span-2">
                        <p className="font-medium">{p?.name || it.product_id}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Quantidade</Label>
                            <Input type="number" step="0.001" min="0.001" value={it.quantity} onChange={(e) => updateItemQuantity(idx, Number(e.target.value))} />
                          </div>
                          <div>
                            <Label className="text-xs">Unidade</Label>
                            <Select value={it.unit || "un"} onValueChange={(v) => updateItemUnit(idx, v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["m2","m","un","kg","L"].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Preço unitário</p>
                        <p className="font-medium">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(it.unit_price))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Subtotal</p>
                        <p className="font-medium">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(lineTotal)}</p>
                      </div>
                      <div className="text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => removeItem(idx)}>Remover</Button>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <p className="font-medium">Materiais</p>
                  <p className="text-lg font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(materialsPriceTotal)}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Nenhum material</div>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(total || 0))}</span>
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? "Salvando..." : "Atualizar OS"}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}