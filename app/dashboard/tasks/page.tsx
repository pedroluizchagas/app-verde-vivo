import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  CheckSquare,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  Search,
} from "lucide-react"
import { TaskCard } from "@/components/tasks/task-card"

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const q = (typeof sp.q === "string" ? sp.q : "").trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from("tasks")
    .select(
      "id, title, importance, tags, organized_description, status, due_date, created_at"
    )
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  if (q) {
    const like = `%${q}%`
    query = query.or(
      `title.ilike.${like},description.ilike.${like},organized_description.ilike.${like}`
    )
  }

  const { data: tasks } = await query
  const allTasks = (tasks || []) as any[]

  const openTasks = allTasks.filter((t) => t.status === "open")
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress")
  const doneTasks = allTasks.filter((t) => t.status === "done")

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const overdueTasks = allTasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false
    return new Date(`${t.due_date}T12:00:00`) < now
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {allTasks.length} tarefa{allTasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/tasks/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Nova tarefa</span>
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Abertas
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {openTasks.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              pendente{openTasks.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Em andamento
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {inProgressTasks.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              em execução
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Concluídas
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {doneTasks.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Atrasadas
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p
              className={`text-[22px] font-bold leading-tight ${overdueTasks.length > 0 ? "text-destructive" : ""}`}
            >
              {overdueTasks.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              com prazo vencido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <form method="GET" action="/dashboard/tasks">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título ou descrição..."
            className="h-11 pl-9"
          />
        </div>
      </form>

      {/* Tabs por status */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="active" className="text-[13px] gap-1.5">
            Ativas
            {openTasks.length + inProgressTasks.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                {openTasks.length + inProgressTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="open" className="text-[13px]">
            Abertas
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-[13px]">
            Em andamento
          </TabsTrigger>
          <TabsTrigger value="done" className="text-[13px]">
            Concluídas
          </TabsTrigger>
        </TabsList>

        {/* Ativas = open + in_progress */}
        <TabsContent value="active" className="mt-4">
          {openTasks.length + inProgressTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {[...inProgressTasks, ...openTasks].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-muted p-6">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Nenhuma tarefa ativa</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Todas as tarefas foram concluídas ou crie uma nova
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/tasks/new">Nova tarefa</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="mt-4">
          {openTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {openTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa aberta.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="mt-4">
          {inProgressTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa em andamento.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4">
          {doneTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {doneTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa concluída.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
