import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TaskCreateForm } from "@/components/tasks/task-create-form"

export default function NewTaskPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/tasks">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nova tarefa</h1>
      </div>
      <TaskCreateForm />
    </div>
  )
}