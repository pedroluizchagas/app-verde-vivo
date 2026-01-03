"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function SkipExecutionButton({ planId, executionId }: { planId: string; executionId?: string }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const handle = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
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
      const { error } = await supabase
        .from("plan_executions")
        .update({ status: "skipped" })
        .eq("id", execId)
      if (error) throw error
      setOk(true)
      setMsg("Execução marcada como pulada")
    } catch (err: any) {
      setOk(false)
      setMsg(err?.message || "Falha ao pular execução")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" disabled={loading} onClick={handle}>Pular execução</Button>
      {msg && <span className={ok ? "text-green-600" : "text-destructive"}>{msg}</span>}
    </div>
  )
}
