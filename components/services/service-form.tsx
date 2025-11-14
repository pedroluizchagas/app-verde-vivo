"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export function ServiceForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [defaultPrice, setDefaultPrice] = useState<number | "">("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const payload: any = {
        gardener_id: user.id,
        name,
        description: description || null,
        default_price: typeof defaultPrice === "number" ? defaultPrice : null,
      }
      const { error: insertError } = await supabase.from("services").insert(payload)
      if (insertError) throw insertError
      router.push("/dashboard/services")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao criar serviço")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Manutenção mensal" required />
          </div>
          <div>
            <Label>Preço padrão (R$)</Label>
            <Input type="number" step="0.01" min="0" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value ? Number(e.target.value) : "")} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do serviço" rows={5} />
          </div>
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? "Salvando..." : "Criar serviço"}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}