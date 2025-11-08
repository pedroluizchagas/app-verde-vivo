"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CategoryForm({ parents }: { parents: { id: string; name: string }[] }) {
  const supabase = createClient()
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [kind, setKind] = useState<"expense" | "income" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from("financial_categories").insert({ name, parent_id: parentId, kind })
      if (insertError) throw insertError
      setName("")
      setParentId(null)
      setKind(null)
      // soft refresh
      // @ts-ignore
      window?.location?.reload()
    } catch (err: any) {
      setError(err?.message || "Erro ao criar categoria")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div>
        <Label>Nome da categoria</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Materiais, Combustível, Folha" />
      </div>
      <div>
        <Label>Categoria pai (opcional)</Label>
        <Select value={parentId || undefined} onValueChange={(v) => setParentId(v === "none" ? null : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem pai</SelectItem>
            {parents.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tipo</Label>
        <Select value={kind || undefined} onValueChange={(v) => setKind(v === "none" ? null : (v as any))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem tipo</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
            <SelectItem value="income">Receita</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : "Criar categoria"}</Button>
    </form>
  )
}