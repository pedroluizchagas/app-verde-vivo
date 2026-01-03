"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type MaterialEntry = { name: string; quantity: string; unit: string; unitCost: string }

export function QuickActionForm({ planId }: { planId: string }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [labor, setLabor] = useState("")
  const [materials, setMaterials] = useState<MaterialEntry[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [planDefaults, setPlanDefaults] = useState<{ default_labor_cost: number; materials_markup_pct: number; client: any; title: string } | null>(null)
  const [checklist, setChecklist] = useState<{ key: string; label: string; done: boolean; notes?: string }[]>([
    { key: "poda", label: "Poda", done: false },
    { key: "irrigacao", label: "Irrigação", done: false },
    { key: "limpeza", label: "Limpeza", done: false },
    { key: "corte", label: "Corte de grama", done: false },
    { key: "adubacao", label: "Adubação", done: false },
    { key: "pragas", label: "Controle de pragas", done: false },
  ])
  const [fertilization, setFertilization] = useState<{ product: string; dose: string; area: string; date?: string }[]>([])
  const [pests, setPests] = useState<{ type: string; severity: string; treatment: string; date?: string; notes?: string }[]>([])
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const { data: plan } = await supabase
          .from("maintenance_plans")
          .select("default_labor_cost, materials_markup_pct, title, client:clients(id, name, phone, address)")
          .eq("id", planId)
          .maybeSingle()
        if (plan) setPlanDefaults(plan as any)
        const { data: tmpl } = await supabase
          .from("plan_executions")
          .select("id, details, cycle")
          .eq("plan_id", planId)
          .eq("cycle", "template")
          .maybeSingle()
        const d = (tmpl as any)?.details || null
        if (d && Array.isArray(d.checklist)) setChecklist(d.checklist)
        if (d && Array.isArray(d.fertilization)) setFertilization(d.fertilization)
        if (d && Array.isArray(d.pests)) setPests(d.pests)
      } catch {}
    })()
  }, [planId])

  const totals = useMemo(() => {
    const laborNum = labor ? Number(labor) : Number(planDefaults?.default_labor_cost || 0)
    const matsRaw = materials.reduce((sum, m) => sum + Number(m.quantity || 0) * Number(m.unitCost || 0), 0)
    const markup = Number(planDefaults?.materials_markup_pct || 0) / 100
    const matsWithMarkup = Number((matsRaw * (1 + markup)).toFixed(2))
    const total = Number((laborNum + matsWithMarkup).toFixed(2))
    return { labor: laborNum, materials: matsWithMarkup, total }
  }, [labor, materials, planDefaults])

  const buildNoteText = () => {
    const lines = [
      `Ação rápida: ${title || "Serviço"}`,
      description ? `Descrição: ${description}` : undefined,
      `Checklist:`,
      ...(
        checklist.length > 0
          ? checklist.map((c) => `${c.label} — ${c.done ? "feito" : "pendente"}${c.notes ? ` (${c.notes})` : ""}`)
          : ["Nenhum"]
      ),
      `Adubação:`,
      ...(
        fertilization.length > 0
          ? fertilization.map((f) => `${f.product || "Produto"} — ${f.dose || ""} ${f.area || ""}`)
          : ["Nenhuma"]
      ),
      `Pragas:`,
      ...(
        pests.length > 0
          ? pests.map((p) => `${p.type || "Praga"} — ${p.severity || ""} • ${p.treatment || ""}`)
          : ["Nenhuma"]
      ),
      `Materiais:`,
      ...(
        materials.length > 0
          ? materials.map((m) => `${m.name || "Material"} — ${Number(m.quantity || 0)} ${m.unit || "un"} (${currency(Number(m.quantity || 0) * Number(m.unitCost || 0))})`)
          : ["Nenhum"]
      ),
      `Mão de obra: ${currency(totals.labor)}`,
      `Materiais (c/ markup): ${currency(totals.materials)}`,
      `Total: ${currency(totals.total)}`,
      planDefaults?.client ? `Cliente: ${planDefaults.client.name} | ${planDefaults.client.phone || ""} | ${planDefaults.client.address || ""}` : undefined,
    ].filter(Boolean)
    return lines.join("\n")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      const now = new Date()
      const cycle = `adhoc:${now.toISOString()}`
      const noteText = buildNoteText()

      const payloadDetails = {
        title,
        description,
        labor: Number(labor || planDefaults?.default_labor_cost || 0),
        materials: materials.map((m) => ({ name: m.name, quantity: Number(m.quantity || 0), unit: m.unit || "un", unitCost: Number(m.unitCost || 0) })),
        markupPct: Number(planDefaults?.materials_markup_pct || 0),
        checklist,
        fertilization,
        pests,
        photos,
      }

      const { error } = await supabase
        .from("plan_executions")
        .insert([{ plan_id: planId, cycle, status: "done", notes: noteText, final_amount: totals.total, details: payloadDetails }])
      if (error) throw error

      setOk(true)
      setMsg("Ação registrada no histórico")
      setTitle("")
      setDescription("")
      setLabor("")
      setMaterials([])
    } catch (err: any) {
      setOk(false)
      setMsg(err?.message || "Falha ao registrar ação")
    } finally {
      setLoading(false)
    }
  }

  const addMaterial = () => setMaterials((list) => [...list, { name: "", quantity: "", unit: "", unitCost: "" }])
  const updateMaterial = (idx: number, patch: Partial<MaterialEntry>) => setMaterials((list) => list.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  const removeMaterial = (idx: number) => setMaterials((list) => list.filter((_, i) => i !== idx))
  const toggleChecklist = (key: string, done: boolean) => setChecklist((list) => list.map((c) => (c.key === key ? { ...c, done } : c)))
  const setChecklistNotes = (key: string, notes: string) => setChecklist((list) => list.map((c) => (c.key === key ? { ...c, notes } : c)))
  const addFertilization = () => setFertilization((list) => [...list, { product: "", dose: "", area: "", date: "" }])
  const updateFertilization = (idx: number, patch: Partial<{ product: string; dose: string; area: string; date?: string }>) => setFertilization((list) => list.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  const removeFertilization = (idx: number) => setFertilization((list) => list.filter((_, i) => i !== idx))
  const addPest = () => setPests((list) => [...list, { type: "", severity: "", treatment: "", date: "", notes: "" }])
  const updatePest = (idx: number, patch: Partial<{ type: string; severity: string; treatment: string; date?: string; notes?: string }>) => setPests((list) => list.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  const removePest = (idx: number) => setPests((list) => list.filter((_, i) => i !== idx))
  const addPhoto = () => setPhotos((list) => [...list, ""]) 
  const updatePhoto = (idx: number, url: string) => setPhotos((list) => list.map((u, i) => (i === idx ? url : u)))
  const removePhoto = (idx: number) => setPhotos((list) => list.filter((_, i) => i !== idx))
  const addPhotoFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Arquivo muito grande (máximo 5MB)")
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = reader.result as string
      setPhotos((list) => [...list, base64])
    }
    reader.onerror = () => setMsg("Erro ao processar imagem")
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <Label>Título *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Aplicação de fungicida" required />
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="bg-transparent" onClick={async () => {
          setLoading(true)
          setMsg(null)
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Não autenticado")
            const { data: existing } = await supabase
              .from("plan_executions")
              .select("id, cycle")
              .eq("plan_id", planId)
              .eq("cycle", "template")
              .maybeSingle()
            const details = { checklist, fertilization, pests }
            if (existing?.id) {
              const { error: uerr } = await supabase
                .from("plan_executions")
                .update({ details })
                .eq("id", existing.id)
              if (uerr) throw uerr
            } else {
              const { error: ierr } = await supabase
                .from("plan_executions")
                .insert([{ plan_id: planId, cycle: "template", status: "open", details }])
              if (ierr) throw ierr
            }
            setOk(true)
            setMsg("Padrão salvo para o plano")
          } catch (err: any) {
            setOk(false)
            setMsg(err?.message || "Falha ao salvar padrão")
          } finally {
            setLoading(false)
          }
        }}>Salvar checklist como padrão</Button>
      </div>
      <div className="grid gap-1">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do que foi feito" className="min-h-24 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label>Mão de obra</Label>
          <Input type="number" step="0.01" min="0" value={labor} onChange={(e) => setLabor(e.target.value)} placeholder="R$" />
        </div>
        <div className="grid gap-1">
          <Label>Materiais (lista)</Label>
          <div className="space-y-2">
            {materials.map((m, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-1">
                <Input value={m.name} onChange={(e) => updateMaterial(idx, { name: e.target.value })} placeholder="Nome" />
                <Input type="number" step="0.01" min="0" value={m.quantity} onChange={(e) => updateMaterial(idx, { quantity: e.target.value })} placeholder="Qtd" />
                <Input value={m.unit} onChange={(e) => updateMaterial(idx, { unit: e.target.value })} placeholder="Un" />
                <div className="flex gap-1">
                  <Input className="flex-1" type="number" step="0.01" min="0" value={m.unitCost} onChange={(e) => updateMaterial(idx, { unitCost: e.target.value })} placeholder="R$ unit" />
                  <Button type="button" variant="outline" className="bg-transparent" onClick={() => removeMaterial(idx)}>Remover</Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="bg-transparent" onClick={addMaterial}>Adicionar material</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Checklist</Label>
        <div className="grid gap-2">
          {checklist.map((c) => (
            <div key={c.key} className="grid grid-cols-4 gap-2 items-center">
              <div className="col-span-1 flex items-center gap-2">
                <input type="checkbox" checked={c.done} onChange={(e) => toggleChecklist(c.key, e.target.checked)} />
                <span className="text-sm">{c.label}</span>
              </div>
              <div className="col-span-3">
                <Input value={c.notes || ""} onChange={(e) => setChecklistNotes(c.key, e.target.value)} placeholder="Observações do item" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Adubação</Label>
        <div className="space-y-2">
          {fertilization.map((f, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-1">
              <Input value={f.product} onChange={(e) => updateFertilization(idx, { product: e.target.value })} placeholder="Produto" />
              <Input value={f.dose} onChange={(e) => updateFertilization(idx, { dose: e.target.value })} placeholder="Dose" />
              <Input value={f.area} onChange={(e) => updateFertilization(idx, { area: e.target.value })} placeholder="Área" />
              <Input type="date" value={f.date || ""} onChange={(e) => updateFertilization(idx, { date: e.target.value })} />
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => removeFertilization(idx)}>Remover</Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="bg-transparent" onClick={addFertilization}>Adicionar adubação</Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Pragas</Label>
        <div className="space-y-2">
          {pests.map((p, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-1">
              <Input value={p.type} onChange={(e) => updatePest(idx, { type: e.target.value })} placeholder="Tipo" />
              <Input value={p.severity} onChange={(e) => updatePest(idx, { severity: e.target.value })} placeholder="Severidade" />
              <Input value={p.treatment} onChange={(e) => updatePest(idx, { treatment: e.target.value })} placeholder="Tratamento" />
              <Input type="date" value={p.date || ""} onChange={(e) => updatePest(idx, { date: e.target.value })} />
              <Input value={p.notes || ""} onChange={(e) => updatePest(idx, { notes: e.target.value })} placeholder="Observações" />
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => removePest(idx)}>Remover</Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="bg-transparent" onClick={addPest}>Adicionar praga</Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Fotos (URL)</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) addPhotoFile(f) }} />
            <Button type="button" variant="outline" className="bg-transparent" onClick={() => addPhoto()}>Adicionar URL</Button>
          </div>
          {photos.map((u, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input value={u} onChange={(e) => updatePhoto(idx, e.target.value)} placeholder="https:// ou data:image/png;base64,..." />
              {String(u || "").startsWith("data:") ? (
                <img src={u} alt="Foto" className="h-12 w-12 object-cover rounded" />
              ) : null}
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => removePhoto(idx)}>Remover</Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="bg-transparent" onClick={addPhoto}>Adicionar foto</Button>
        </div>
      </div>

      <div className="rounded-md border p-3 text-sm space-y-1">
        <p>Total mão de obra: {currency(totals.labor)}</p>
        <p>Total materiais (com markup): {currency(totals.materials)}</p>
        <p className="font-medium">Total: {currency(totals.total)}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>Registrar ação rápida</Button>
        {msg && <span className={ok ? "text-green-600" : "text-destructive"}>{msg}</span>}
      </div>
    </form>
  )
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}
