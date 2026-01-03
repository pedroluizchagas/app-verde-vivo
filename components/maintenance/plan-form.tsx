"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function MaintenancePlanForm({ initialPlan }: { initialPlan?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initialPlan?.title || "")
  const [clientId, setClientId] = useState<string>(initialPlan?.client_id || "")
  const [defaultLabor, setDefaultLabor] = useState<number | "">(
    typeof initialPlan?.default_labor_cost === "number" ? Number(initialPlan.default_labor_cost) : ""
  )
  const [markup, setMarkup] = useState<number | "">(
    typeof initialPlan?.materials_markup_pct === "number" ? Number(initialPlan.materials_markup_pct) : ""
  )
  const [weekday, setWeekday] = useState<string>(
    typeof initialPlan?.preferred_weekday === "number" ? String(initialPlan.preferred_weekday) : ""
  )
  const [weekOfMonth, setWeekOfMonth] = useState<string>(
    typeof initialPlan?.preferred_week_of_month === "number" ? String(initialPlan.preferred_week_of_month) : ""
  )
  const [windowDays, setWindowDays] = useState<number>(
    typeof initialPlan?.window_days === "number" ? Number(initialPlan.window_days) : 7
  )
  const [billingDay, setBillingDay] = useState<string>(
    typeof initialPlan?.billing_day === "number" ? String(initialPlan.billing_day) : ""
  )
  const [status, setStatus] = useState<"active" | "paused">((initialPlan?.status as any) || "active")
  const [description, setDescription] = useState<string>(initialPlan?.default_description || "")

  const [clients, setClients] = useState<{ id: string; name: string; phone?: string | null }[]>([])
  const [fertMonths, setFertMonths] = useState<number[]>([])
  const [pestMonths, setPestMonths] = useState<number[]>([])
  const [enableFert, setEnableFert] = useState<boolean>(false)
  const [enablePests, setEnablePests] = useState<boolean>(false)
  const [enableWeeds, setEnableWeeds] = useState<boolean>(false)

  useState(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: cs } = await supabase.from("clients").select("id, name, phone").eq("gardener_id", user.id).order("name")
        setClients(cs || [])
        if (initialPlan?.id) {
          const { data: tmpl } = await supabase
            .from("plan_executions")
            .select("id, details, cycle")
            .eq("plan_id", initialPlan.id)
            .eq("cycle", "template")
            .maybeSingle()
          const schedule = (tmpl as any)?.details?.schedule || null
          if (schedule) {
            if (Array.isArray(schedule.fertilization_months)) setFertMonths(schedule.fertilization_months)
            if (Array.isArray(schedule.pests_months)) setPestMonths(schedule.pests_months)
            setEnableFert(Boolean((schedule.fertilization_months || []).length))
            setEnablePests(Boolean((schedule.pests_months || []).length))
            setEnableWeeds(Boolean((schedule.weeds_months || []).length))
          }
        }
      } catch {}
    })()
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      if (!title || !clientId) throw new Error("Preencha título e cliente")
      const preservedServiceId = initialPlan?.id ? (initialPlan?.service_id ?? null) : null
      const payload: any = {
        gardener_id: user.id,
        client_id: clientId,
        service_id: preservedServiceId,
        title,
        default_description: description || null,
        default_labor_cost: typeof defaultLabor === "number" ? defaultLabor : 0,
        materials_markup_pct: typeof markup === "number" ? markup : 0,
        preferred_weekday: weekday && weekday !== "none" ? Number(weekday) : null,
        preferred_week_of_month: weekOfMonth && weekOfMonth !== "none" ? Number(weekOfMonth) : null,
        window_days: windowDays,
        billing_day: billingDay ? Number(billingDay) : null,
        status,
      }
      if (initialPlan?.id) {
        const { error: updateError } = await supabase
          .from("maintenance_plans")
          .update(payload)
          .eq("id", initialPlan.id)
        if (updateError) throw updateError
        const schedule = { fertilization_months: enableFert ? fertMonths : [], pests_months: enablePests ? pestMonths : [], weeds_months: [] }
        const { data: tmpl } = await supabase
          .from("plan_executions")
          .select("id, cycle")
          .eq("plan_id", initialPlan.id)
          .eq("cycle", "template")
          .maybeSingle()
        if (tmpl?.id) {
          const { error: uerr } = await supabase
            .from("plan_executions")
            .update({ details: { schedule } })
            .eq("id", tmpl.id)
          if (uerr) throw uerr
        } else {
          const { error: ierr } = await supabase
            .from("plan_executions")
            .insert([{ plan_id: initialPlan.id, cycle: "template", status: "open", details: { schedule } }])
          if (ierr) throw ierr
        }
        router.push(`/dashboard/maintenance/${initialPlan.id}`)
        router.refresh()
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("maintenance_plans")
          .insert(payload)
          .select("id")
          .single()
        if (insertError) throw insertError
        if (inserted?.id) {
          const schedule = { fertilization_months: enableFert ? fertMonths : [], pests_months: enablePests ? pestMonths : [], weeds_months: [] }
          const { error: ierr } = await supabase
            .from("plan_executions")
            .insert([{ plan_id: inserted.id, cycle: "template", status: "open", details: { schedule } }])
          if (ierr) throw ierr
        }
        router.push(`/dashboard/maintenance/${inserted?.id ?? ""}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao criar plano")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Manutenção de Jardim</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Manutenção mensal jardim da Ana" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Selecionar cliente</Label>
              <Select value={clientId} onValueChange={(v) => setClientId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contato (Whatsapp)</Label>
              <Input value={(clients.find((c) => c.id === clientId)?.phone || "")} readOnly placeholder="(31) 98877-6665" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Valor mensal (R$)</Label>
              <Input type="number" step="0.01" min="0" value={defaultLabor} onChange={(e) => setDefaultLabor(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div>
              <Label>Dia de vencimento</Label>
              <Input type="number" min="1" max="31" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Dia preferido da semana</Label>
              <Select value={weekday} onValueChange={(v) => setWeekday(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="1">Segunda</SelectItem>
                  <SelectItem value="2">Terça</SelectItem>
                  <SelectItem value="3">Quarta</SelectItem>
                  <SelectItem value="4">Quinta</SelectItem>
                  <SelectItem value="5">Sexta</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                  <SelectItem value="0">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semana do mês</Label>
              <Select value={weekOfMonth} onValueChange={(v) => setWeekOfMonth(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="1">1ª</SelectItem>
                  <SelectItem value="2">2ª</SelectItem>
                  <SelectItem value="3">3ª</SelectItem>
                  <SelectItem value="4">4ª</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição do jardim</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Sol pleno, rega 3x por semana" rows={5} />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Planejamento de adubação</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={enableFert} onChange={(e) => setEnableFert(e.target.checked)} />
                  <span className="text-sm">Habilitar</span>
                </div>
              </div>
              <MonthSelector value={fertMonths} onChange={setFertMonths} disabled={!enableFert} />
              <div className="text-xs text-muted-foreground">Próxima: {nextPlannedDate(fertMonths, weekday, weekOfMonth)}</div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Controle de pragas</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={enablePests} onChange={(e) => setEnablePests(e.target.checked)} />
                  <span className="text-sm">Habilitar</span>
                </div>
              </div>
              <MonthSelector value={pestMonths} onChange={setPestMonths} disabled={!enablePests} />
              <div className="text-xs text-muted-foreground">Próxima: {nextPlannedDate(pestMonths, weekday, weekOfMonth)}</div>
            </div>
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar Manutenção"}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

function nextPlannedDate(months: number[], weekday: string, weekOfMonth: string) {
  const now = new Date()
  const cur = now.getMonth() + 1
  const next = months.length > 0 ? (months.find((m) => m >= cur) ?? months[0]) : null
  if (!next) return "—"
  const y = next < cur ? now.getFullYear() + 1 : now.getFullYear()
  const prefWeekday = weekday && weekday !== "none" ? Number(weekday) : 1
  const prefWeek = weekOfMonth && weekOfMonth !== "none" ? Number(weekOfMonth) : 1
  const firstOfMonth = new Date(y, next - 1, 1)
  const firstDow = firstOfMonth.getDay()
  const offsetToWeekday = (prefWeekday - firstDow + 7) % 7
  const day = 1 + offsetToWeekday + (prefWeek - 1) * 7
  const d = new Date(y, next - 1, day)
  return d.toLocaleDateString("pt-BR")
}

function MonthSelector({ value, onChange, disabled }: { value: number[]; onChange: (v: number[]) => void; disabled?: boolean }) {
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  const toggle = (idx: number) => {
    const m = idx + 1
    onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m].sort((a,b)=>a-b))
  }
  return (
    <div className="grid grid-cols-6 gap-2">
      {months.map((m, idx) => (
        <button key={m} type="button" disabled={disabled} onClick={() => toggle(idx)} className={`h-9 rounded-md border text-sm ${value.includes(idx+1) ? "bg-primary text-primary-foreground" : "bg-muted"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>{m}</button>
      ))}
    </div>
  )
}
