"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

type SuggestedMap = Record<string, string[]>

const suggested: SuggestedMap = {
  Operacional: ["EPIs", "Ferramentas", "Lubrificantes", "Combustível Máquinas"],
  Veículos: ["Combustível Veículos", "Manutenção Veículos", "Seguro"],
  Estoque: ["Insumos", "Herbicidas", "Fertilizantes", "Adubos", "Substratos", "Sementes", "Produtos para Revenda"],
  "Manutenção de Equipamentos": ["Peças", "Serviço de manutenção"],
  Administração: ["Internet", "Telefone", "Aluguel", "Energia", "Contabilidade"],
  Impostos: ["ISS", "INSS", "IR", "Taxas"],
  Marketing: ["Anúncios", "Materiais Promocionais"],
  Receitas: ["Serviços", "Produtos/Revenda", "Comissões", "Outros Recebimentos"],
}

const kindByParent: Record<string, "expense" | "income"> = {
  Receitas: "income",
  Operacional: "expense",
  Veículos: "expense",
  Estoque: "expense",
  "Manutenção de Equipamentos": "expense",
  Administração: "expense",
  Impostos: "expense",
  Marketing: "expense",
}

export function CategorySeedButton() {
  const supabase = createClient()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const seed = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      // Fetch existing categories to avoid duplicates
      const { data: existing } = await supabase
        .from("financial_categories")
        .select("id, name, parent_id")
        .eq("gardener_id", user.id)

      const byNameRoot = new Map<string, string>() // root name -> id
      const childrenByName = new Map<string, string>() // child name -> id
      (existing || []).forEach((c: any) => {
        if (c.parent_id == null) byNameRoot.set(c.name, c.id)
        else childrenByName.set(c.name, c.id)
      })

      for (const root of Object.keys(suggested)) {
        // upsert root
        let rootId = byNameRoot.get(root) || null
        if (!rootId) {
          const { data: insertedRoot, error } = await supabase
            .from("financial_categories")
            .insert([{ gardener_id: user.id, name: root, parent_id: null }])
            .select("id")
            .single()
          if (error) throw error
          rootId = insertedRoot?.id || null
          if (rootId) byNameRoot.set(root, rootId)
        }

        // upsert children under root
        for (const child of suggested[root]) {
          if (childrenByName.has(child)) continue
          const { data: insertedChild, error: ce } = await supabase
            .from("financial_categories")
            .insert([{ gardener_id: user.id, name: child, parent_id: rootId, kind: kindByParent[root] }])
            .select("id")
            .single()
          if (ce) throw ce
          const cid = insertedChild?.id
          if (cid) childrenByName.set(child, cid)
        }
      }

      setMsg("Categorias sugeridas adicionadas.")
    } catch (e: any) {
      setMsg(e?.message || "Erro ao adicionar categorias")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={seed} disabled={busy}>{busy ? "Adicionando..." : "Adicionar categorias sugeridas"}</Button>
      {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
    </div>
  )
}