"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParentCategory {
  id: string
  name: string
  kind: "expense" | "income" | null
}

export function CategoryForm({ parents }: { parents: ParentCategory[] }) {
  const supabase = createClient()
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [kind, setKind] = useState<"expense" | "income" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedParent = parents.find((p) => p.id === parentId) ?? null
  const inheritedKind = selectedParent?.kind ?? null
  const effectiveKind = inheritedKind ?? kind

  const handleParentChange = (v: string) => {
    const newParentId = v === "none" ? null : v
    setParentId(newParentId)
    const parent = parents.find((p) => p.id === newParentId)
    if (parent?.kind) setKind(parent.kind)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const { error: insertError } = await supabase
        .from("financial_categories")
        .insert({ name: name.trim(), parent_id: parentId, kind: effectiveKind })
      if (insertError) throw insertError
      setName("")
      setParentId(null)
      setKind(null)
      window?.location?.reload()
    } catch (err: any) {
      setError(err?.message || "Erro ao criar categoria")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Nome */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-name" className="text-[12px] font-medium">
          Nome da categoria
        </Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Combustível, Serviços de Poda..."
          required
          className="h-11"
        />
      </div>

      {/* Tipo: toggle visual */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium">
          Tipo
          {inheritedKind && (
            <span className="ml-2 text-[11px] text-muted-foreground font-normal">
              (herdado da categoria pai)
            </span>
          )}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!!inheritedKind}
            onClick={() => setKind("income")}
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-xl border-2 text-[13px] font-semibold transition-all",
              effectiveKind === "income"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border text-muted-foreground hover:border-muted-foreground/40",
              inheritedKind ? "opacity-60 cursor-not-allowed" : ""
            )}
          >
            <ArrowUpRight className="h-4 w-4 shrink-0" />
            Receita
          </button>
          <button
            type="button"
            disabled={!!inheritedKind}
            onClick={() => setKind("expense")}
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-xl border-2 text-[13px] font-semibold transition-all",
              effectiveKind === "expense"
                ? "border-red-400 bg-red-500/10 text-red-500 dark:text-red-400"
                : "border-border text-muted-foreground hover:border-muted-foreground/40",
              inheritedKind ? "opacity-60 cursor-not-allowed" : ""
            )}
          >
            <ArrowDownRight className="h-4 w-4 shrink-0" />
            Despesa
          </button>
        </div>
      </div>

      {/* Categoria pai */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-parent" className="text-[12px] font-medium">
          Categoria pai{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Select
          value={parentId || "none"}
          onValueChange={handleParentChange}
        >
          <SelectTrigger id="cat-parent" className="h-11">
            <SelectValue placeholder="Selecionar categoria pai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma (categoria raiz)</SelectItem>
            {parents.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isLoading || !name.trim()}>
        {isLoading ? "Salvando..." : "Criar categoria"}
      </Button>
    </form>
  )
}
