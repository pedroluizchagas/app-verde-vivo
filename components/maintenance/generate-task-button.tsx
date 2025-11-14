"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function GenerateMonthlyTaskButton({ planId }: { planId: string }) {
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const supabase = createClient()
  return (
    <div className="flex items-center gap-2">
      <Button disabled={loading} onClick={async () => {
        setLoading(true)
        setMsg(null)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error("Não autenticado")
          const now = new Date()
          const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
          const { data: existing } = await supabase
            .from("plan_executions")
            .select("id, task_id")
            .eq("plan_id", planId)
            .eq("cycle", cycle)
            .maybeSingle()
          if (existing?.task_id) {
            setOk(true)
            setMsg("Tarefa do mês já existente")
          } else {
            const { data: task, error: terr } = await supabase
              .from("tasks")
              .insert([{ gardener_id: user.id, title: `Manutenção mensal`, tags: ["manutenção", cycle], status: "open" }])
              .select("id")
              .single()
            if (terr) throw terr
            const { error: eerr } = await supabase
              .from("plan_executions")
              .insert([{ plan_id: planId, cycle, task_id: task?.id, status: "open" }])
            if (eerr) throw eerr
            setOk(true)
            setMsg("Tarefa do mês criada")
          }
        } catch (err: any) {
          setOk(false)
          setMsg(err?.message || "Falha ao gerar tarefa")
        } finally {
          setLoading(false)
        }
      }}>Gerar tarefa do mês</Button>
      {msg && <span className={ok ? "text-green-600" : "text-destructive"}>{msg}</span>}
    </div>
  )
}