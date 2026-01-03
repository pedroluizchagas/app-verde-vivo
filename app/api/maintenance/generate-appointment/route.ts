import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { planId, date, startTime, endTime, allDay } = await req.json()
    if (!planId) return NextResponse.json({ ok: false, error: "planId é obrigatório" }, { status: 400 })
    if (!date) return NextResponse.json({ ok: false, error: "data é obrigatória" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 })

    const { data: plan } = await supabase
      .from("maintenance_plans")
      .select("id, title, client_id, service_id")
      .eq("id", planId)
      .maybeSingle()
    if (!plan) return NextResponse.json({ ok: false, error: "Plano inválido" }, { status: 404 })

    const cycDate = String(date)
    const start = new Date(`${cycDate}T${allDay ? "00:00" : (String(startTime || "00:00"))}`)
    const end = new Date(`${cycDate}T${allDay ? "23:59" : (String(endTime || "23:59"))}`)
    if (!allDay && start >= end) return NextResponse.json({ ok: false, error: "Horário término deve ser após início" }, { status: 400 })

    // Conflicts
    const { data: overlaps } = await supabase
      .from("appointments")
      .select("id, scheduled_date, end_date, duration_minutes")
      .eq("gardener_id", user.id)
      .gte("scheduled_date", new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order("scheduled_date", { ascending: true })
    const hasConflict = (overlaps || []).some((a: any) => {
      const s = new Date(String(a.scheduled_date))
      const e = a.end_date ? new Date(String(a.end_date)) : new Date(s.getTime() + Number(a.duration_minutes || 0) * 60000)
      return s < end && e > start
    })
    if (hasConflict) return NextResponse.json({ ok: false, error: "Conflito de horário na agenda" }, { status: 409 })

    // Ensure no duplicate execution appointment
    const now = new Date()
    const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const { data: exec } = await supabase
      .from("plan_executions")
      .select("id, appointment_id")
      .eq("plan_id", planId)
      .eq("cycle", cycle)
      .maybeSingle()
    if (exec?.appointment_id) return NextResponse.json({ ok: true, existed: true, id: exec.appointment_id })

    // Create appointment (minimal fields first)
    const duration = allDay ? 0 : Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
    const minimal: any = {
      gardener_id: user.id,
      client_id: plan.client_id,
      service_id: plan.service_id ?? null,
      title: `Manutenção: ${plan.title}`,
      description: null,
      scheduled_date: start.toISOString(),
      duration_minutes: duration,
      status: "scheduled",
    }
    const { data: appt, error: aerr } = await supabase
      .from("appointments")
      .insert([minimal])
      .select("id")
      .single()
    if (aerr) return NextResponse.json({ ok: false, error: aerr.message }, { status: 500 })

    // Optional update with extended fields
    try {
      await supabase
        .from("appointments")
        .update({ end_date: end.toISOString(), type: "service", location: null, all_day: allDay })
        .eq("id", appt?.id)
    } catch {}

    // Link execution
    if (exec?.id) {
      await supabase.from("plan_executions").update({ appointment_id: appt?.id }).eq("id", exec.id)
    } else {
      await supabase.from("plan_executions").insert([{ plan_id: planId, cycle, appointment_id: appt?.id, status: "open" }])
    }

    return NextResponse.json({ ok: true, id: appt?.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro" }, { status: 500 })
  }
}
