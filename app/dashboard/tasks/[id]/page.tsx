import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import { DeleteTaskButton } from "@/components/tasks/delete-task-button"

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("gardener_id", user!.id)
    .eq("id", params.id)
    .maybeSingle()
  if (!task) {
    return <div className="p-4"><p className="text-sm text-muted-foreground">Tarefa não encontrada</p></div>
  }
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarefa</h1>
          <p className="text-sm text-muted-foreground">{new Date(task.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href={`/dashboard/tasks/${task.id}/edit`} className="inline-flex items-center gap-1"><Edit className="h-4 w-4" />Editar</Link>
          </Button>
          <DeleteTaskButton taskId={task.id} taskTitle={task.title || "Sem título"} />
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{task.title || "Sem título"}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={importanceClass(task.importance)}>{labelImportance(task.importance)}</Badge>
            <Badge variant="outline" className={statusClass(task.status)}>{task.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {task.due_date && <div className="text-sm text-muted-foreground">Vencimento: {new Date(task.due_date).toLocaleDateString("pt-BR")}</div>}
          {Array.isArray(task.tags) && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((t: string, idx: number) => (
                <Badge key={idx} variant="secondary">{t}</Badge>
              ))}
            </div>
          )}
          {task.description && (
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm whitespace-pre-line">{task.description}</p>
            </div>
          )}
          {task.organized_description && (
            <div>
              <p className="text-sm text-muted-foreground">Descrição organizada</p>
              <p className="text-sm whitespace-pre-line">{task.organized_description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function importanceClass(v?: string | null) {
  switch (v) {
    case "high":
      return "border-destructive text-destructive"
    case "medium":
      return "border-yellow-500 text-yellow-600"
    case "low":
      return "border-muted-foreground text-muted-foreground"
    default:
      return "border-muted-foreground text-muted-foreground"
  }
}

function labelImportance(v?: string | null) {
  switch (v) {
    case "high":
      return "Alta"
    case "medium":
      return "Média"
    case "low":
      return "Baixa"
    default:
      return "Média"
  }
}

function statusClass(v?: string | null) {
  switch (v) {
    case "done":
      return "border-green-500 text-green-600"
    case "in_progress":
      return "border-blue-500 text-blue-600"
    case "open":
      return "border-muted-foreground text-muted-foreground"
    default:
      return "border-muted-foreground text-muted-foreground"
  }
}