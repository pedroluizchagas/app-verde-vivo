import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, CheckSquare } from "lucide-react"

export default async function TasksPage({ searchParams }: { searchParams?: { q?: string; status?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const q = (searchParams?.q || "").trim()
  const status = (searchParams?.status || "").trim()
  let query = supabase
    .from("tasks")
    .select("id, title, importance, tags, organized_description, status, due_date, created_at")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })
  if (q) {
    const like = `%${q}%`
    query = query.or(`title.ilike.${like},description.ilike.${like},organized_description.ilike.${like}`)
  }
  if (status) {
    query = query.eq("status", status)
  }
  const { data: tasks } = await query

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Tarefas</h1>
            <p className="text-sm text-muted-foreground">{tasks?.length || 0} tarefa{tasks && tasks.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/tasks/new">Nova tarefa</Link>
        </Button>
      </div>

      <form method="GET" className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Buscar por título ou texto" className="pl-8" />
        </div>
        <Input name="status" defaultValue={status} placeholder="Status (open, in_progress, done)" className="w-52" />
        <Button type="submit">Buscar</Button>
      </form>

      {tasks && tasks.length > 0 ? (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {t.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={importanceClass(t.importance)}>{labelImportance(t.importance)}</Badge>
                  <Badge variant="outline" className={statusClass(t.status)}>{t.status}</Badge>
                  <Button asChild size="sm" variant="outline" className="bg-transparent">
                    <Link href={`/dashboard/tasks/${t.id}/edit`} className="inline-flex items-center gap-1"><Edit className="h-4 w-4" />Editar</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{new Date(t.created_at).toLocaleString("pt-BR")}</span>
                  {t.due_date && <span>• vence {new Date(t.due_date).toLocaleDateString("pt-BR")}</span>}
                </div>
                {Array.isArray(t.tags) && t.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.tags.map((x: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{x}</Badge>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-sm whitespace-pre-line">{t.organized_description || ""}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
        </div>
      )}
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