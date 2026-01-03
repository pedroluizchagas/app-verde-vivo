"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

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

export function ExportMaintenanceICSButton({ planId }: { planId: string }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const downloadICS = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const { data: plan } = await supabase
        .from("maintenance_plans")
        .select("title, client:clients(name, address), preferred_weekday, preferred_week_of_month")
        .eq("id", planId)
        .maybeSingle()
      if (!plan) throw new Error("Plano inválido")

      const { data: exec } = await supabase
        .from("plan_executions")
        .select("appointment_id, cycle")
        .eq("plan_id", planId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      let start: Date | null = null
      let end: Date | null = null
      let title = `Manutenção: ${String((plan as any).title)}`
      let location = String(Array.isArray((plan as any).client) ? ((plan as any).client[0]?.address ?? "") : ((plan as any).client?.address ?? ""))

      if (exec?.appointment_id) {
        const { data: ap } = await supabase
          .from("appointments")
          .select("scheduled_date, end_date, duration_minutes")
          .eq("id", exec.appointment_id)
          .maybeSingle()
        if (ap) {
          const s = new Date(String(ap.scheduled_date))
          const e = ap.end_date ? new Date(String(ap.end_date)) : new Date(s.getTime() + Number(ap.duration_minutes || 60) * 60000)
          start = s
          end = e
        }
      }
      if (!start || !end) {
        const base = computePreferredDate(plan)
        start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0)
        end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 10, 0)
      }

      const pad = (n: number) => String(n).padStart(2, "0")
      const fmt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
      const uid = `${planId}-${Date.now()}@verdevivo`
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//VerdeVivo//Manutenção//PT-BR",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${title}`,
        location ? `LOCATION:${location.replace(/\r?\n/g, " ")}` : "",
        "END:VEVENT",
        "END:VCALENDAR",
      ].filter(Boolean).join("\r\n")

      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "manutencao.ics"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMsg("Evento exportado")
    } catch (err: any) {
      setMsg(err?.message || "Falha ao exportar evento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="bg-transparent" disabled={loading} onClick={downloadICS}><Calendar className="h-4 w-4 mr-2" /> Exportar .ics</Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  )
}

