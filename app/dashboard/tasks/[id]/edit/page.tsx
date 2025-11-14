import { createClient } from "@/lib/supabase/server"
import { TaskEditForm } from "@/components/tasks/task-edit-form"

export default async function TaskEditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, description, organized_description, importance, tags, due_date, status")
    .eq("gardener_id", user!.id)
    .eq("id", params.id)
    .maybeSingle()
  if (!task) {
    return <div className="p-4"><p className="text-sm text-muted-foreground">Tarefa não encontrada</p></div>
  }
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Editar tarefa</h1>
      <TaskEditForm task={task} />
    </div>
  )
}