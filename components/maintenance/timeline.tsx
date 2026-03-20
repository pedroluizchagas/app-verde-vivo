"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Check, X, Clock, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineEntry {
  key: string
  status: "done" | "skipped" | "pending" | "open"
  isCurrentMonth: boolean
  label: string
}

export function MaintenanceTimeline({
  executions,
  months = 6,
}: {
  executions: any[]
  months?: number
}) {
  const now = new Date()

  const entries: TimelineEntry[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const shortMonth = d
      .toLocaleString("pt-BR", { month: "short" })
      .replace(".", "")
    const label =
      shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1)

    const exec = (executions || []).find(
      (e: any) => String(e.cycle) === key
    )
    const rawStatus = exec ? String(exec.status) : "pending"
    const isCurrentMonth = i === 0

    entries.push({
      key,
      status: rawStatus as TimelineEntry["status"],
      isCurrentMonth,
      label,
    })
  }

  const doneCount = entries.filter((e) => e.status === "done").length
  const skippedCount = entries.filter((e) => e.status === "skipped").length
  const pendingCount = entries.filter(
    (e) => e.status === "pending" || e.status === "open"
  ).length

  return (
    <Card className="py-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold">
            Acompanhamento — {months} meses
          </h2>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              {doneCount} realizada{doneCount !== 1 ? "s" : ""}
            </span>
            {skippedCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                {skippedCount} atrasada{skippedCount !== 1 ? "s" : ""}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {entries.map((entry) => {
            const isDone = entry.status === "done"
            const isSkipped = entry.status === "skipped"
            const isPending =
              entry.status === "pending" || entry.status === "open"

            return (
              <div
                key={entry.key}
                className={cn(
                  "flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all",
                  entry.isCurrentMonth
                    ? "border-primary/40 bg-primary/5"
                    : isDone
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : isSkipped
                        ? "border-amber-500/20 bg-amber-500/5"
                        : "border-border/50 bg-muted/30"
                )}
              >
                {/* Mês */}
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    entry.isCurrentMonth
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {entry.label}
                </span>

                {/* Indicador de status */}
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center",
                    isDone
                      ? "bg-emerald-500"
                      : isSkipped
                        ? "bg-amber-500"
                        : entry.isCurrentMonth
                          ? "bg-primary/20 border-2 border-primary"
                          : "bg-muted border-2 border-border/60"
                  )}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  ) : isSkipped ? (
                    <X className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  ) : entry.isCurrentMonth ? (
                    <Clock className="h-3 w-3 text-primary" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Label de status */}
                <span
                  className={cn(
                    "text-[9px] font-medium text-center leading-tight",
                    isDone
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isSkipped
                        ? "text-amber-600 dark:text-amber-400"
                        : entry.isCurrentMonth
                          ? "text-primary"
                          : "text-muted-foreground"
                  )}
                >
                  {isDone
                    ? "Feita"
                    : isSkipped
                      ? "Atrasada"
                      : entry.isCurrentMonth
                        ? "Atual"
                        : "Pendente"}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
