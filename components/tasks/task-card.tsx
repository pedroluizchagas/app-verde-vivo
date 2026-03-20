import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, AlertTriangle } from "lucide-react"

interface Task {
  id: string
  title: string | null
  status: string
  importance: string | null
  tags: string[] | null
  organized_description: string | null
  due_date: string | null
  created_at: string
}

export const statusLabels: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  done: "Concluída",
}

export const statusColors: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

const statusBorderColors: Record<string, string> = {
  open: "border-l-border",
  in_progress: "border-l-blue-500",
  done: "border-l-emerald-500",
}

const importanceLabels: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
}

const importanceBadgeColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
}

export function TaskCard({ task }: { task: Task }) {
  const statusLabel = statusLabels[task.status] ?? task.status
  const statusColor = statusColors[task.status] ?? "bg-muted text-muted-foreground"
  const borderColor = statusBorderColors[task.status] ?? "border-l-border"

  const importance = task.importance ?? "medium"
  const importanceLabel = importanceLabels[importance] ?? "Média"
  const importanceColor = importanceBadgeColors[importance] ?? "bg-muted text-muted-foreground"

  const tags = Array.isArray(task.tags) ? task.tags.filter(Boolean) : []
  const visibleTags = tags.slice(0, 3)
  const extraTags = tags.length - visibleTags.length

  const preview = task.organized_description?.trim() || ""

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = task.due_date ? new Date(`${task.due_date}T12:00:00`) : null
  const isOverdue = due && due < now && task.status !== "done"
  const isToday = due && due.getTime() === now.getTime()

  const dueStr = due
    ? due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null

  const dueDateColor = isOverdue
    ? "text-destructive font-semibold"
    : isToday
      ? "text-amber-600 dark:text-amber-400 font-semibold"
      : "text-muted-foreground"

  const isDone = task.status === "done"

  return (
    <Link href={`/dashboard/tasks/${task.id}`} className="block">
      <Card
        className={`py-0 border-l-4 ${borderColor} transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Indicador de status visual */}
            <div className="mt-0.5 shrink-0">
              {isDone ? (
                <div className="h-4 w-4 rounded bg-emerald-500 flex items-center justify-center">
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : task.status === "in_progress" ? (
                <div className="h-4 w-4 rounded border-2 border-blue-500 bg-blue-500/20" />
              ) : (
                <div className="h-4 w-4 rounded border-[1.5px] border-border" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Título + badges */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <p
                  className={`font-semibold text-[14px] leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title || "Sem título"}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {importance !== "low" && (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${importanceColor}`}
                    >
                      {importanceLabel}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* Preview da descrição */}
              {preview && !isDone && (
                <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mb-1.5">
                  {preview}
                </p>
              )}

              {/* Rodapé: prazo + tags */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {dueStr && (
                  <div className={`flex items-center gap-1 ${dueDateColor}`}>
                    {isOverdue ? (
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                    ) : (
                      <Calendar className="h-3 w-3 shrink-0" />
                    )}
                    <span className="text-[11px]">
                      {isOverdue ? "Atrasada — " : isToday ? "Hoje — " : ""}
                      {dueStr}
                    </span>
                  </div>
                )}
                {visibleTags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {extraTags > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{extraTags}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
