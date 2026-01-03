"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MaintenanceTimeline({ executions, months = 6 }: { executions: any[]; months?: number }) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const labels: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const s = d.toLocaleString("pt-BR", { month: "short" })
    labels.push(s.charAt(0).toUpperCase() + s.slice(1).replace(".", ""))
  }
  const byMonth = labels.map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - idx), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const exec = (executions || []).find((e: any) => String(e.cycle) === key)
    const status = exec ? String(exec.status) : "pending"
    return { key, status }
  })
  const color = (s: string) => s === "done" ? "bg-emerald-500" : s === "skipped" ? "bg-yellow-500" : "bg-blue-500"
  const labelFor = (s: string) => s === "done" ? "Realizada" : s === "skipped" ? "Atrasada" : "Pendente"
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Acompanhamento (6 meses)</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-6 gap-3">
          {labels.map((m, idx) => (
            <div key={m} className="flex flex-col gap-2 items-start">
              <span className="text-xs text-muted-foreground">{m}</span>
              <div className={`h-2 w-full rounded-full ${color(byMonth[idx].status)}`}></div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-emerald-500"></span>{labelFor("done")}</span>
          <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-yellow-500"></span>{labelFor("skipped")}</span>
          <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-blue-500"></span>{labelFor("pending")}</span>
        </div>
      </CardContent>
    </Card>
  )
}

