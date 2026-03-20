import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit, Calendar, AlertTriangle, Sparkles } from "lucide-react"
import { DeleteTaskButton } from "@/components/tasks/delete-task-button"
import { statusLabels, statusColors } from "@/components/tasks/task-card"

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

const statusBorderColors: Record<string, string> = {
  open: "border-l-border",
  in_progress: "border-l-blue-500",
  done: "border-l-emerald-500",
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()

  if (!task) {
    notFound()
  }

  const importance = task.importance ?? "medium"
  const importanceLabel = importanceLabels[importance] ?? "Média"
  const importanceColor =
    importanceBadgeColors[importance] ?? "bg-muted text-muted-foreground"

  const statusLabel = statusLabels[task.status] ?? task.status
  const statusColor = statusColors[task.status] ?? "bg-muted text-muted-foreground"
  const borderColor = statusBorderColors[task.status] ?? "border-l-border"

  const tags = Array.isArray(task.tags) ? task.tags.filter(Boolean) : []

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = task.due_date ? new Date(`${task.due_date}T12:00:00`) : null
  const isOverdue = due && due < now && task.status !== "done"
  const isToday = due && due.getTime() === now.getTime()

  const dueStr = due
    ? due.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null

  const dueDateColor = isOverdue
    ? "text-destructive"
    : isToday
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground"

  const createdStr = new Date(task.created_at).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/tasks">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {task.title || "Sem título"}
            </h1>
            <p className="text-[13px] text-muted-foreground capitalize">
              {createdStr}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/tasks/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteTaskButton
            taskId={task.id}
            taskTitle={task.title || "Sem título"}
          />
        </div>
      </div>

      {/* Status + importância + prazo + tags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${importanceColor}`}>
          Importância: {importanceLabel}
        </span>
        {dueStr && (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted ${dueDateColor}`}>
            {isOverdue ? (
              <AlertTriangle className="h-3 w-3 shrink-0" />
            ) : (
              <Calendar className="h-3 w-3 shrink-0" />
            )}
            <span>
              {isOverdue ? "Atrasada — " : isToday ? "Hoje — " : "Vence em "}
              {dueStr}
            </span>
          </div>
        )}
        {tags.map((tag: string, i: number) => (
          <span
            key={i}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Descrição original */}
      {task.description && (
        <Card className={`py-0 border-l-4 ${borderColor}`}>
          <CardContent className="p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Descrição
            </p>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Descrição organizada pela IA */}
      {task.organized_description &&
        task.organized_description !== task.description && (
          <Card className="py-0 border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
                  Descrição organizada pela Iris
                </p>
              </div>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {task.organized_description}
              </p>
            </CardContent>
          </Card>
        )}

      {/* Se não há nenhum conteúdo */}
      {!task.description && !task.organized_description && (
        <Card className={`py-0 border-l-4 ${borderColor}`}>
          <CardContent className="p-5">
            <p className="text-[13px] text-muted-foreground italic">
              Nenhuma descrição adicionada.
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-[12px] mt-3"
            >
              <Link href={`/dashboard/tasks/${id}/edit`}>
                Adicionar descrição
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
