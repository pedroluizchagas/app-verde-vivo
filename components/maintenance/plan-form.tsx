"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const MONTH_ABBR = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez",
]

function MonthSelector({
  value,
  onChange,
  disabled,
}: {
  value: number[]
  onChange: (v: number[]) => void
  disabled?: boolean
}) {
  const toggle = (idx: number) => {
    const m = idx + 1
    onChange(
      value.includes(m)
        ? value.filter((x) => x !== m)
        : [...value, m].sort((a, b) => a - b)
    )
  }
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {MONTH_ABBR.map((m, idx) => (
        <button
          key={m}
          type="button"
          disabled={disabled}
          onClick={() => toggle(idx)}
          className={cn(
            "h-9 rounded-xl border-2 text-[12px] font-semibold transition-all",
            value.includes(idx + 1)
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-muted-foreground/40",
            disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

function nextPlannedDate(
  months: number[],
  weekday: string,
  weekOfMonth: string
) {
  const now = new Date()
  const cur = now.getMonth() + 1
  const next =
    months.length > 0
      ? months.find((m) => m >= cur) ?? months[0]
      : null
  if (!next) return "—"
  const y = next < cur ? now.getFullYear() + 1 : now.getFullYear()
  const prefWeekday = weekday && weekday !== "none" ? Number(weekday) : 1
  const prefWeek = weekOfMonth && weekOfMonth !== "none" ? Number(weekOfMonth) : 1
  const firstOfMonth = new Date(y, next - 1, 1)
  const firstDow = firstOfMonth.getDay()
  const offsetToWeekday = (prefWeekday - firstDow + 7) % 7
  const day = 1 + offsetToWeekday + (prefWeek - 1) * 7
  return new Date(y, next - 1, day).toLocaleDateString("pt-BR")
}

export function MaintenancePlanForm({ initialPlan }: { initialPlan?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initialPlan?.title || "")
  const [clientId, setClientId] = useState<string>(
    initialPlan?.client_id || ""
  )
  const [defaultLabor, setDefaultLabor] = useState<string>(
    typeof initialPlan?.default_labor_cost === "number"
      ? String(initialPlan.default_labor_cost)
      : ""
  )
  const [weekday, setWeekday] = useState<string>(
    typeof initialPlan?.preferred_weekday === "number"
      ? String(initialPlan.preferred_weekday)
      : ""
  )
  const [weekOfMonth, setWeekOfMonth] = useState<string>(
    typeof initialPlan?.preferred_week_of_month === "number"
      ? String(initialPlan.preferred_week_of_month)
      : ""
  )
  const [billingDay, setBillingDay] = useState<string>(
    typeof initialPlan?.billing_day === "number"
      ? String(initialPlan.billing_day)
      : ""
  )
  const [status, setStatus] = useState<"active" | "paused">(
    (initialPlan?.status as any) || "active"
  )
  const [description, setDescription] = useState<string>(
    initialPlan?.default_description || ""
  )

  const [clients, setClients] = useState<
    { id: string; name: string; phone?: string | null }[]
  >([])
  const [fertMonths, setFertMonths] = useState<number[]>([])
  const [pestMonths, setPestMonths] = useState<number[]>([])
  const [enableFert, setEnableFert] = useState<boolean>(false)
  const [enablePests, setEnablePests] = useState<boolean>(false)

  useState(() => {
    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data: cs } = await supabase
          .from("clients")
          .select("id, name, phone")
          .eq("gardener_id", user.id)
          .order("name")
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
            if (Array.isArray(schedule.fertilization_months))
              setFertMonths(schedule.fertilization_months)
            if (Array.isArray(schedule.pests_months))
              setPestMonths(schedule.pests_months)
            setEnableFert(Boolean((schedule.fertilization_months || []).length))
            setEnablePests(Boolean((schedule.pests_months || []).length))
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      if (!title || !clientId) throw new Error("Preencha título e cliente")
      const preservedServiceId = initialPlan?.id
        ? (initialPlan?.service_id ?? null)
        : null
      const payload: any = {
        gardener_id: user.id,
        client_id: clientId,
        service_id: preservedServiceId,
        title,
        default_description: description || null,
        default_labor_cost: defaultLabor ? Number(defaultLabor) : 0,
        materials_markup_pct: 0,
        preferred_weekday:
          weekday && weekday !== "none" ? Number(weekday) : null,
        preferred_week_of_month:
          weekOfMonth && weekOfMonth !== "none" ? Number(weekOfMonth) : null,
        window_days: 7,
        billing_day: billingDay ? Number(billingDay) : null,
        status,
      }
      const schedule = {
        fertilization_months: enableFert ? fertMonths : [],
        pests_months: enablePests ? pestMonths : [],
        weeds_months: [],
      }

      if (initialPlan?.id) {
        const { error: updateError } = await supabase
          .from("maintenance_plans")
          .update(payload)
          .eq("id", initialPlan.id)
        if (updateError) throw updateError
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
            .insert([
              {
                plan_id: initialPlan.id,
                cycle: "template",
                status: "open",
                details: { schedule },
              },
            ])
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
          await supabase.from("plan_executions").insert([
            {
              plan_id: inserted.id,
              cycle: "template",
              status: "open",
              details: { schedule },
            },
          ])
        }
        router.push(`/dashboard/maintenance/${inserted?.id ?? ""}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar plano")
      setIsLoading(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === clientId)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="py-0">
        <CardContent className="p-5 flex flex-col gap-5">

          {/* Identificação */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-title" className="text-[12px] font-medium">
                Título do plano
              </Label>
              <Input
                id="plan-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Manutenção mensal — Jardim da Ana"
                required
                className="h-11"
              />
            </div>

            {/* Status toggle */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium">Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={cn(
                    "h-11 rounded-xl border-2 text-[13px] font-semibold transition-all",
                    status === "active"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("paused")}
                  className={cn(
                    "h-11 rounded-xl border-2 text-[13px] font-semibold transition-all",
                    status === "paused"
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  Pausado
                </button>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-client" className="text-[12px] font-medium">
                Cliente
              </Label>
              <Select
                value={clientId}
                onValueChange={(v) => setClientId(v)}
              >
                <SelectTrigger id="plan-client" className="h-11">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClient?.phone && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-[12px] font-medium">
                  WhatsApp do cliente
                </Label>
                <Input
                  value={selectedClient.phone}
                  readOnly
                  className="h-11 bg-muted/50 text-muted-foreground"
                />
              </div>
            )}
          </div>

          {/* Financeiro */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-labor" className="text-[12px] font-medium">
                  Valor mensal (R$)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-[13px] pointer-events-none select-none">
                    R$
                  </span>
                  <Input
                    id="plan-labor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultLabor}
                    onChange={(e) => setDefaultLabor(e.target.value)}
                    placeholder="0,00"
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="plan-billing"
                  className="text-[12px] font-medium"
                >
                  Dia de vencimento{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="plan-billing"
                  type="number"
                  min="1"
                  max="31"
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  placeholder="Ex.: 5"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Agendamento preferencial */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
            <p className="text-[12px] font-medium">
              Agendamento preferencial{" "}
              <span className="text-muted-foreground font-normal">
                (para geração automática de serviços)
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="plan-weekday"
                  className="text-[12px] font-medium"
                >
                  Dia da semana
                </Label>
                <Select
                  value={weekday || "none"}
                  onValueChange={(v) => setWeekday(v)}
                >
                  <SelectTrigger id="plan-weekday" className="h-11">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem preferência</SelectItem>
                    <SelectItem value="1">Segunda-feira</SelectItem>
                    <SelectItem value="2">Terça-feira</SelectItem>
                    <SelectItem value="3">Quarta-feira</SelectItem>
                    <SelectItem value="4">Quinta-feira</SelectItem>
                    <SelectItem value="5">Sexta-feira</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                    <SelectItem value="0">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="plan-week"
                  className="text-[12px] font-medium"
                >
                  Semana do mês
                </Label>
                <Select
                  value={weekOfMonth || "none"}
                  onValueChange={(v) => setWeekOfMonth(v)}
                >
                  <SelectTrigger id="plan-week" className="h-11">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem preferência</SelectItem>
                    <SelectItem value="1">1ª semana</SelectItem>
                    <SelectItem value="2">2ª semana</SelectItem>
                    <SelectItem value="3">3ª semana</SelectItem>
                    <SelectItem value="4">4ª semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Planejamento de tratamentos */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-5">
            {/* Adubação */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">
                    Planejamento de adubação
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione os meses em que a adubação deve ser realizada
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableFert((v) => !v)}
                  className={cn(
                    "h-8 px-3 rounded-xl border-2 text-[12px] font-semibold transition-all shrink-0",
                    enableFert
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {enableFert ? "Habilitado" : "Habilitar"}
                </button>
              </div>
              <MonthSelector
                value={fertMonths}
                onChange={setFertMonths}
                disabled={!enableFert}
              />
              {enableFert && fertMonths.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Próxima:{" "}
                  <span className="font-medium text-foreground">
                    {nextPlannedDate(fertMonths, weekday, weekOfMonth)}
                  </span>
                </p>
              )}
            </div>

            {/* Pragas */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">
                    Controle de pragas
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione os meses para controle preventivo de pragas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnablePests((v) => !v)}
                  className={cn(
                    "h-8 px-3 rounded-xl border-2 text-[12px] font-semibold transition-all shrink-0",
                    enablePests
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {enablePests ? "Habilitado" : "Habilitar"}
                </button>
              </div>
              <MonthSelector
                value={pestMonths}
                onChange={setPestMonths}
                disabled={!enablePests}
              />
              {enablePests && pestMonths.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Próxima:{" "}
                  <span className="font-medium text-foreground">
                    {nextPlannedDate(pestMonths, weekday, weekOfMonth)}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Descrição do jardim */}
          <div className="border-t border-border/60 pt-4 flex flex-col gap-1.5">
            <Label
              htmlFor="plan-description"
              className="text-[12px] font-medium"
            >
              Descrição do jardim{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="plan-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Sol pleno, rega 3x por semana, gramado + canteiros..."
              rows={4}
              className="resize-none"
            />
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
              disabled={isLoading || !title.trim() || !clientId}
            >
              {isLoading ? (
                "Salvando..."
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  {initialPlan?.id ? "Salvar alterações" : "Criar plano"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
