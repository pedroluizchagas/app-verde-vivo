"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export function ProductForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [unit, setUnit] = useState("un")
  const [unitOther, setUnitOther] = useState("")
  const [cost, setCost] = useState(0)
  const [supplier, setSupplier] = useState("")
  const [minStock, setMinStock] = useState(0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const finalUnit = unit === "custom" ? unitOther.trim() : unit
      if (!finalUnit) throw new Error("Informe a unidade de medida")
      const { error: insertError } = await supabase.from("products").insert({
        gardener_id: user.id,
        name,
        unit: finalUnit,
        cost,
        supplier: supplier || null,
        min_stock: minStock,
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
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Fertilizante NPK" />
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Unidade</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m2">m²</SelectItem>
                <SelectItem value="m">m</SelectItem>
                <SelectItem value="un">un</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="custom">Outra...</SelectItem>
              </SelectContent>
            </Select>
            {unit === "custom" && (
              <div className="mt-2">
                <Input value={unitOther} onChange={(e) => setUnitOther(e.target.value)} placeholder="Ex.: saco, pacote" />
              </div>
            )}
          </div>
          <div>
            <Label>Custo unitário (R$)</Label>
            <Input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
          </div>
            <div>
              <Label>Estoque mínimo</Label>
              <Input type="number" step="0.001" min="0" value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Fornecedor (opcional)</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex.: AgroSupplies Ltda" />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Criar produto"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}