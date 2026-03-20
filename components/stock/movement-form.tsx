"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PackagePlus, PackageMinus, Calculator, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface MovementFormProps {
  products: { id: string; name: string; unit: string; cost: number }[]
  appointments: { id: string; title: string | null }[]
  defaultAppointmentId?: string | null
}

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

const fmtQty = (v: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(v)

export function MovementForm({
  products,
  appointments,
  defaultAppointmentId = null,
}: MovementFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [productId, setProductId] = useState<string | null>(null)
  const [type, setType] = useState<"in" | "out">("out")
  const [quantity, setQuantity] = useState<string>("1")
  const [unitCost, setUnitCost] = useState<string>("")
  const [movementDate, setMovementDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  )
  const [appointmentId, setAppointmentId] = useState<string | null>(
    defaultAppointmentId
  )
  const [description, setDescription] = useState<string>("")

  // Calculadora de área
  const [openCalc, setOpenCalc] = useState(false)
  const [lengthM, setLengthM] = useState<string>("0")
  const [widthM, setWidthM] = useState<string>("0")
  const [areasCount, setAreasCount] = useState<string>("1")
  const [wastePct, setWastePct] = useState<string>("0")

  const selectedProduct = products.find((p) => p.id === productId) ?? null

  const isAreaUnit = useMemo(() => {
    const raw = String(selectedProduct?.unit || "").toLowerCase().trim()
    return raw.replace(/\s+/g, "").replace(/²/g, "2") === "m2"
  }, [selectedProduct])

  const computedCalcQty = useMemo(() => {
    const area =
      Number(lengthM) * Number(widthM) * Math.max(Number(areasCount), 1)
    const factor = 1 + (Number(wastePct) > 0 ? Number(wastePct) / 100 : 0)
    const qty = area * factor
    return isFinite(qty) && qty > 0 ? qty : 0
  }, [lengthM, widthM, areasCount, wastePct])

  const effectiveCost = useMemo(() => {
    if (unitCost !== "") return Number(unitCost)
    return selectedProduct?.cost ?? 0
  }, [unitCost, selectedProduct])

  const totalValue = useMemo(
    () => Number(quantity) * effectiveCost,
    [quantity, effectiveCost]
  )

  const isIn = type === "in"

  const handleProductChange = (id: string) => {
    setProductId(id)
    const p = products.find((x) => x.id === id)
    if (p && unitCost === "") {
      setUnitCost(String(p.cost))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      if (!productId) throw new Error("Selecione um produto")

      const payload: any = {
        gardener_id: user.id,
        product_id: productId,
        type,
        quantity: Number(quantity),
        unit_cost: effectiveCost || selectedProduct?.cost || null,
        movement_date: movementDate,
        description: description || null,
        appointment_id: appointmentId,
      }

      const { error: insertError } = await supabase
        .from("product_movements")
        .insert(payload)
      if (insertError) throw insertError

      // Para entrada: registra despesa automática no financeiro
      if (type === "in") {
        const total = Number(quantity) * (effectiveCost || 0)
        if (total > 0) {
          try {
            let rootId: string | null = null
            let catId: string | null = null

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

            if (!catId) {
              if (!rootId) {
                const { data: newRoot, error: rErr } = await supabase
                  .from("financial_categories")
                  .insert([
                    {
                      gardener_id: user.id,
                      name: "Estoque",
                      parent_id: null,
                      kind: "expense",
                    },
                  ])
                  .select("id")
                  .single()
                if (!rErr) rootId = newRoot?.id ?? null
              }
              const { data: newChild, error: cErr } = await supabase
                .from("financial_categories")
                .insert([
                  {
                    gardener_id: user.id,
                    name: "Insumos",
                    parent_id: rootId,
                    kind: "expense",
                  },
                ])
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
                description:
                  description ||
                  `Compra de ${selectedProduct?.name || "produto"}`,
                category_id: catId,
                client_id: null,
                status: "paid",
                due_date: null,
                paid_at: new Date().toISOString(),
              },
            ])
          } catch (e) {
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
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className="py-0">
          <CardContent className="p-5 flex flex-col gap-5">

            {/* Tipo: toggle visual */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
                Tipo de movimentação
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("in")}
                  className={cn(
                    "flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-[14px] font-semibold transition-all",
                    isIn
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  <PackagePlus className="h-4 w-4 shrink-0" />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setType("out")}
                  className={cn(
                    "flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-[14px] font-semibold transition-all",
                    !isIn
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  <PackageMinus className="h-4 w-4 shrink-0" />
                  Saída
                </button>
              </div>

              {/* Dica contextual */}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Info className="h-3 w-3 shrink-0" />
                {isIn
                  ? "Entrada: compra ou recebimento de material. Gera despesa automática no financeiro."
                  : "Saída: uso de material em um serviço ou consumo interno."}
              </p>
            </div>

            {/* Produto */}
            <div className="border-t border-border/60 pt-4 flex flex-col gap-1.5">
              <Label htmlFor="product" className="text-[12px] font-medium">
                Produto
              </Label>
              <Select
                value={productId || undefined}
                onValueChange={handleProductChange}
              >
                <SelectTrigger id="product" className="h-11">
                  <SelectValue placeholder="Selecionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.length > 0 ? (
                    products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        <span className="text-muted-foreground ml-1.5">
                          ({p.unit})
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled>
                      Nenhum produto cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Unidade: {selectedProduct.unit}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Custo padrão: {currency(selectedProduct.cost)}
                  </span>
                </div>
              )}
            </div>

            {/* Quantidade + Data */}
            <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="quantity" className="text-[12px] font-medium">
                    Quantidade
                    {selectedProduct?.unit
                      ? ` (${selectedProduct.unit})`
                      : ""}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="h-11"
                  />
                  {isAreaUnit && (
                    <button
                      type="button"
                      onClick={() => setOpenCalc(true)}
                      className="flex items-center gap-1.5 text-[11px] text-primary hover:underline mt-0.5 w-fit"
                    >
                      <Calculator className="h-3 w-3" />
                      Calcular por área
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="movement_date"
                    className="text-[12px] font-medium"
                  >
                    Data
                  </Label>
                  <Input
                    id="movement_date"
                    type="date"
                    value={movementDate}
                    onChange={(e) => setMovementDate(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Custo unitário (somente entrada) */}
            {isIn && (
              <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="unit_cost"
                      className="text-[12px] font-medium"
                    >
                      Custo unitário (R$)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-[13px] pointer-events-none select-none">
                        R$
                      </span>
                      <Input
                        id="unit_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        placeholder={
                          selectedProduct
                            ? String(selectedProduct.cost)
                            : "0,00"
                        }
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>

                  {/* Total calculado */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground">
                      Total calculado
                    </Label>
                    <div
                      className={cn(
                        "h-11 rounded-xl border-2 flex items-center px-3",
                        totalValue > 0
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-muted/30"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[15px] font-bold tabular-nums",
                          totalValue > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {currency(totalValue)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {fmtQty(Number(quantity))} × {currency(effectiveCost)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vínculo + Descrição */}
            <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="appointment"
                  className="text-[12px] font-medium"
                >
                  Vincular a serviço{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Select
                  value={appointmentId || "none"}
                  onValueChange={(v) =>
                    setAppointmentId(v === "none" ? null : v)
                  }
                >
                  <SelectTrigger id="appointment" className="h-11">
                    <SelectValue placeholder="Selecionar serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem vínculo</SelectItem>
                    {appointments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title || a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="description"
                  className="text-[12px] font-medium"
                >
                  Descrição{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isIn
                      ? "Ex.: compra no fornecedor, reposição de estoque..."
                      : "Ex.: uso no jardim do cliente, manutenção..."
                  }
                  className="h-11"
                />
              </div>
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
                  isIn
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                )}
                disabled={isLoading || !productId}
              >
                {isLoading ? (
                  "Salvando..."
                ) : (
                  <>
                    {isIn ? (
                      <PackagePlus className="h-4 w-4" />
                    ) : (
                      <PackageMinus className="h-4 w-4" />
                    )}
                    Registrar {isIn ? "entrada" : "saída"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Calculadora de área */}
      <AlertDialog open={openCalc} onOpenChange={setOpenCalc}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Calcular área (m²)</AlertDialogTitle>
            <AlertDialogDescription>
              Informe as medidas para calcular a quantidade automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium">
                Comprimento (m)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={lengthM}
                onChange={(e) => setLengthM(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium">Largura (m)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={widthM}
                onChange={(e) => setWidthM(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium">
                Nº de áreas
              </Label>
              <Input
                type="number"
                min="1"
                value={areasCount}
                onChange={(e) => setAreasCount(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium">Perda (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={wastePct}
                onChange={(e) => setWastePct(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">
              Quantidade calculada
            </span>
            <span className="text-[16px] font-bold tabular-nums">
              {fmtQty(computedCalcQty)} m²
            </span>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenCalc(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setQuantity(String(computedCalcQty || 0))
                setOpenCalc(false)
              }}
            >
              Aplicar quantidade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
