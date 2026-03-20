"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"

const PRESET_UNITS = ["un", "kg", "L", "m", "m²", "saco", "cx"]

export function ProductForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [unit, setUnit] = useState("un")
  const [isCustomUnit, setIsCustomUnit] = useState(false)
  const [customUnit, setCustomUnit] = useState("")
  const [cost, setCost] = useState("")
  const [supplier, setSupplier] = useState("")
  const [minStock, setMinStock] = useState("")

  const effectiveUnit = isCustomUnit ? customUnit.trim() : unit

  const handleUnitSelect = (u: string) => {
    setUnit(u)
    setIsCustomUnit(false)
    setCustomUnit("")
  }

  const handleCustomUnit = () => {
    setIsCustomUnit(true)
    setUnit("")
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
      if (!effectiveUnit) throw new Error("Informe a unidade de medida")
      if (!name.trim()) throw new Error("Informe o nome do produto")

      const { error: insertError } = await supabase.from("products").insert({
        gardener_id: user.id,
        name: name.trim(),
        unit: effectiveUnit,
        cost: Number(cost) || 0,
        supplier: supplier.trim() || null,
        min_stock: Number(minStock) || 0,
      })
      if (insertError) throw insertError
      router.push("/dashboard/stock")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao criar produto")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="py-0">
        <CardContent className="p-5 flex flex-col gap-5">

          {/* Identificação */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-[12px] font-medium">
                Nome do produto
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Fertilizante NPK, Grama São Carlos, Substrato..."
                required
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier" className="text-[12px] font-medium">
                Fornecedor{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ex.: AgroSupplies Ltda, Viveiro Central..."
                className="h-11"
              />
            </div>
          </div>

          {/* Unidade de medida */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium">
              Unidade de medida
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitSelect(u)}
                  className={cn(
                    "px-3 h-9 rounded-xl border-2 text-[13px] font-semibold transition-all",
                    !isCustomUnit && unit === u
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {u}
                </button>
              ))}
              <button
                type="button"
                onClick={handleCustomUnit}
                className={cn(
                  "px-3 h-9 rounded-xl border-2 text-[13px] font-semibold transition-all",
                  isCustomUnit
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground/40"
                )}
              >
                Outra...
              </button>
            </div>

            {isCustomUnit && (
              <Input
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Ex.: fardo, pacote, rolo..."
                autoFocus
                required={isCustomUnit}
                className="h-11 mt-1"
              />
            )}

            {effectiveUnit && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Unidade selecionada:{" "}
                <span className="font-semibold text-foreground">
                  {effectiveUnit}
                </span>
              </p>
            )}
          </div>

          {/* Custo e estoque mínimo */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cost" className="text-[12px] font-medium">
                  Custo unitário (R$)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-[13px] pointer-events-none select-none">
                    R$
                  </span>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0,00"
                    className="h-11 pl-9"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Usado para calcular o valor das movimentações.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="min_stock" className="text-[12px] font-medium">
                  Estoque mínimo
                  {effectiveUnit ? (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({effectiveUnit})
                    </span>
                  ) : null}
                </Label>
                <Input
                  id="min_stock"
                  type="number"
                  step="0.001"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  className="h-11"
                />
                <p className="text-[11px] text-muted-foreground">
                  Alerta quando o estoque ficar abaixo deste valor.
                </p>
              </div>
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
              className="flex-1 gap-2"
              disabled={isLoading || !name.trim() || !effectiveUnit}
            >
              {isLoading ? (
                "Salvando..."
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Criar produto
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
