"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export function CloseExecutionForm({ planId, executionId }: { planId: string; executionId?: string }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [labor, setLabor] = useState<string>("")
  const [materials, setMaterials] = useState<string>("")
  const [status, setStatus] = useState<string>("paid")
  const [dueDate, setDueDate] = useState<string>("")
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const { data: plan } = await supabase
        .from("maintenance_plans")
        .select("client_id, title, default_labor_cost, materials_markup_pct")
        .eq("id", planId)
        .maybeSingle()
      if (!plan) throw new Error("Plano inválido")
      let execId = executionId
      if (!execId) {
        const now = new Date()
        const cyc = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        const { data: ex } = await supabase
          .from("plan_executions")
          .select("id")
          .eq("plan_id", planId)
          .eq("cycle", cyc)
          .maybeSingle()
        execId = ex?.id
      }
      if (!execId) throw new Error("Execução não encontrada")

      const baseLabor = labor ? Number(labor) : Number(plan.default_labor_cost || 0)
      const mats = materials ? Number(materials) : 0
      const markup = Number(plan.materials_markup_pct || 0) / 100
      const total = Number((baseLabor + mats * (1 + markup)).toFixed(2))
      const today = new Date().toISOString().slice(0, 10)

      const { data: trx, error: terr } = await supabase
        .from("financial_transactions")
        .insert([
          {
            gardener_id: user.id,
            type: "income",
            amount: total,
            transaction_date: today,
            description: `Mensalidade: ${plan.title}`,
            category_id: null,
            client_id: plan.client_id,
            status,
            due_date: status === "pending" ? (dueDate || today) : null,
            paid_at: status === "paid" ? new Date().toISOString() : null,
          },
        ])
        .select("id")
        .single()
      if (terr) throw terr

      const { error: uerr } = await supabase
        .from("plan_executions")
        .update({ status: "done", final_amount: total, transaction_id: trx?.id })
        .eq("id", execId)
      if (uerr) throw uerr
      setOk(true)
      setMsg("Execução concluída")
    } catch (err: any) {
      setOk(false)
      setMsg(err?.message || "Falha ao concluir execução")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handle} className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label>Mão de obra</Label>
          <Input value={labor} onChange={(e) => setLabor(e.target.value)} placeholder="R$" type="number" step="0.01" min="0" />
        </div>
        <div className="grid gap-1">
          <Label>Materiais</Label>
          <Input value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="R$" type="number" step="0.01" min="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label>Vencimento</Label>
          <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>Concluir execução</Button>
        {msg && <span className={ok ? "text-green-600" : "text-destructive"}>{msg}</span>}
      </div>
    </form>
  )
}
