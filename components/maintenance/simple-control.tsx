"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function computePreferredDate(plan: any): Date {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const weekday = typeof plan?.preferred_weekday === "number" ? plan.preferred_weekday : 1
  const weekOfMonth = typeof plan?.preferred_week_of_month === "number" ? plan.preferred_week_of_month : 1
  const firstOfMonth = new Date(year, month, 1)
  const firstDow = firstOfMonth.getDay()
  const offsetToWeekday = (weekday - firstDow + 7) % 7
  const day = 1 + offsetToWeekday + (weekOfMonth - 1) * 7
  return new Date(year, month, day)
}

export function MaintenanceSimpleControl({ planId, type }: { planId: string; type: "fertilization" | "pests" | "weeds" }) {
  const supabase = createClient()
  const [nextDate, setNextDate] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: plan } = await supabase
          .from("maintenance_plans")
          .select("preferred_weekday, preferred_week_of_month")
          .eq("id", planId)
          .maybeSingle()
        let targetMonth: number | null = null
        try {
          const { data: tmpl } = await supabase
            .from("plan_executions")
            .select("details, cycle")
            .eq("plan_id", planId)
            .eq("cycle", "template")
            .maybeSingle()
          const schedule = (tmpl as any)?.details?.schedule || null
          const months = type === "fertilization" ? (schedule?.fertilization_months || []) : type === "pests" ? (schedule?.pests_months || []) : (schedule?.weeds_months || [])
          if (Array.isArray(months) && months.length > 0) {
            const now = new Date()
            const cur = now.getMonth() + 1
            const next = months.find((m: number) => m >= cur) ?? months[0]
            targetMonth = next
          }
        } catch {}
        let d: Date
        if (plan) {
          if (targetMonth) {
            const base = computePreferredDate({ preferred_weekday: plan.preferred_weekday, preferred_week_of_month: plan.preferred_week_of_month })
            d = new Date(base.getFullYear(), targetMonth - 1, base.getDate())
          } else {
            d = computePreferredDate(plan)
          }
        } else {
          d = new Date()
        }
        setNextDate(d.toLocaleDateString("pt-BR"))
      } catch {}
    })()
  }, [planId])

  const markDone = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const now = new Date()
      const cyc = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const { data: exec } = await supabase
        .from("plan_executions")
        .select("id, details")
        .eq("plan_id", planId)
        .eq("cycle", cyc)
        .maybeSingle()
      const details = (exec as any)?.details || {}
      const list = Array.isArray(details?.[type]) ? details[type] : []
      const entry: any = type === "fertilization" ? { product: "Adubo", dose: "", area: "", date: now.toISOString().slice(0, 10) } : { type: "Praga", severity: "", treatment: "", date: now.toISOString().slice(0, 10) }
      const patch = { ...details, [type]: [...list, entry] }
      if (exec?.id) {
        const { error: uerr } = await supabase
          .from("plan_executions")
          .update({ details: patch })
          .eq("id", exec.id)
        if (uerr) throw uerr
      } else {
        const { error: ierr } = await supabase
          .from("plan_executions")
          .insert([{ plan_id: planId, cycle: cyc, status: "open", details: patch }])
        if (ierr) throw ierr
      }
      setMsg("Marcado como feito")
    } catch (err: any) {
      setMsg(err?.message || "Falha ao marcar como feito")
    } finally {
      setLoading(false)
    }
  }

  const title = type === "fertilization" ? "Controle de Adubação" : type === "pests" ? "Controle de Pragas" : "Controle de Ervas daninhas"
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="text-sm">
          <p className="text-muted-foreground">Próxima:</p>
          <p className="font-medium">{nextDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled={loading} onClick={markDone}>Marcar como feito</Button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
