import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit, Sparkles } from "lucide-react"
import { DeleteNoteButton } from "@/components/notes/delete-note-button"
import {
  importanceLabels,
  importanceBadgeColors,
  importanceBorderColors,
} from "@/components/notes/note-card"

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()

  if (!note) {
    notFound()
  }

  const importance = note.importance ?? "medium"
  const borderColor = importanceBorderColors[importance] ?? "border-l-border"
  const badgeColor =
    importanceBadgeColors[importance] ?? "bg-muted text-muted-foreground"
  const badgeLabel = importanceLabels[importance] ?? "Média"

  const tags = Array.isArray(note.tags) ? note.tags.filter(Boolean) : []

  const dateStr = new Date(note.created_at).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const timeStr = new Date(note.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {note.title || "Sem título"}
            </h1>
            <p className="text-[13px] text-muted-foreground capitalize">
              {dateStr} às {timeStr}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/notes/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteNoteButton noteId={note.id} noteTitle={note.title || "Sem título"} />
        </div>
      </div>

      {/* Importância + tags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badgeColor}`}>
          Importância: {badgeLabel}
        </span>
        {tags.map((tag: string, i: number) => (
          <span
            key={i}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Conteúdo original */}
      <Card className={`py-0 border-l-4 ${borderColor}`}>
        <CardContent className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Conteúdo
          </p>
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        </CardContent>
      </Card>

      {/* Conteúdo organizado pela IA */}
      {note.organized_content && note.organized_content !== note.content && (
        <Card className="py-0 border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
                Conteúdo organizado pela Iris
              </p>
            </div>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {note.organized_content}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
