"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export function GenerateMonthlyAppointmentButton({ planId }: { planId: string }) {
  const [date, setDate] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [allDay, setAllDay] = useState<boolean>(false)
  const [planTitle, setPlanTitle] = useState<string>("")
  const supabase = createClient()
  const router = useRouter()

  const prefillDefaults = async () => {
    try {
      const { data: plan } = await supabase
        .from("maintenance_plans")
        .select("preferred_weekday, preferred_week_of_month, title")
        .eq("id", planId)
        .maybeSingle()
      if (plan) {
        const cycle = computePreferredDate(plan)
        const isoDate = cycle.toISOString().split("T")[0]
        setDate((d) => d || isoDate)
        setStartTime((t) => t || "09:00")
        setEndTime((t) => t || "10:00")
        setPlanTitle(String((plan as any).title || "Manutenção"))
      }
    } catch {}
  }

  if (!date || !startTime || !endTime) {
    // Lazy prefill once mounted
    void prefillDefaults()
  }

  const goToNewAppointment = () => {
    const params = new URLSearchParams()
    if (planTitle) params.set("title", `Manutenção: ${planTitle}`)
    if (date) params.set("date", date)
    if (allDay) params.set("allDay", "true")
    if (!allDay) {
      if (startTime) params.set("start", startTime)
      if (endTime) params.set("end", endTime)
    }
    params.set("planId", planId)
    router.push(`/dashboard/schedule/new?${params.toString()}`)
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1">
          <Label>Data *</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-11" />
        </div>
        <div className="grid gap-1">
          <Label>Início *</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required={!allDay} disabled={allDay} className="h-11" />
        </div>
        <div className="grid gap-1">
          <Label>Término *</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required={!allDay} disabled={allDay} className="h-11" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="maint-all-day" type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        <Label htmlFor="maint-all-day">Dia inteiro</Label>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={goToNewAppointment}>Realizar agendamento</Button>
      </div>
    </div>
  )
}
