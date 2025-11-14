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

export function NoteEditForm({ note }: { note: { id: string; title: string | null; content: string; organized_content: string | null; importance: string | null; tags: string[] | null } }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState<string>(note.title || "")
  const [importance, setImportance] = useState<"low" | "medium" | "high">((note.importance as any) || "medium")
  const [tagsInput, setTagsInput] = useState<string>((note.tags || []).join(", "))
  const [content, setContent] = useState<string>(note.content || "")
  const [organizedContent, setOrganizedContent] = useState<string>(note.organized_content || "")

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
        content: content,
        organized_content: organizedContent || null,
      }
      const { error: upErr } = await supabase.from("notes").update(payload).eq("id", note.id)
      if (upErr) throw upErr
      router.push(`/dashboard/notes/${note.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar a nota")
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

          <div>
            <Label>Tags</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Separadas por vírgula" />
          </div>

          <div>
            <Label>Texto original</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Conteúdo" rows={6} />
          </div>

          <div>
            <Label>Texto organizado</Label>
            <Textarea value={organizedContent} onChange={(e) => setOrganizedContent(e.target.value)} placeholder="Versão organizada" rows={6} />
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