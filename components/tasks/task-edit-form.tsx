"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TaskEditForm({ task }: { task: { id: string; title: string | null; description: string | null; organized_description: string | null; importance: string | null; tags: string[] | null; due_date: string | null; status: string | null } }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState<string>(task.title || "")
  const [importance, setImportance] = useState<"low" | "medium" | "high">((task.importance as any) || "medium")
  const [tagsInput, setTagsInput] = useState<string>((task.tags || []).join(", "))
  const [description, setDescription] = useState<string>(task.description || "")
  const [organizedDescription, setOrganizedDescription] = useState<string>(task.organized_description || "")
  const [status, setStatus] = useState<"open" | "in_progress" | "done">((task.status as any) || "open")
  const [dueDate, setDueDate] = useState<string>(task.due_date || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
      const payload: any = {
        title: title || null,
        importance,
        tags: tags.length ? tags : null,
        description: description || null,
        organized_description: organizedDescription || null,
        status,
        due_date: dueDate || null,
      }
      const { error: upErr } = await supabase.from("tasks").update(payload).eq("id", task.id)
      if (upErr) throw upErr
      router.push(`/dashboard/tasks/${task.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar a tarefa")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={importance} onValueChange={(v) => setImportance(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberta</SelectItem>
                  <SelectItem value="in_progress">Em progresso</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Separadas por vírgula" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que precisa ser feito" rows={6} />
          </div>

          <div>
            <Label>Descrição organizada</Label>
            <Textarea value={organizedDescription} onChange={(e) => setOrganizedDescription(e.target.value)} placeholder="Passos ou checklist" rows={6} />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}