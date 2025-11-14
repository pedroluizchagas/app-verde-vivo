import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import { DeleteNoteButton } from "@/components/notes/delete-note-button"

export default async function NoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("gardener_id", user!.id)
    .eq("id", params.id)
    .maybeSingle()

  if (!note) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Nota não encontrada</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nota</h1>
          <p className="text-sm text-muted-foreground">{new Date(note.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href={`/dashboard/notes/${note.id}/edit`} className="inline-flex items-center gap-1"><Edit className="h-4 w-4" />Editar</Link>
          </Button>
          <DeleteNoteButton noteId={note.id} noteTitle={note.title || "Sem título"} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{note.title || "Sem título"}</CardTitle>
          <Badge variant="outline" className={importanceClass(note.importance)}>{labelImportance(note.importance)}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.isArray(note.tags) && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((t: string, idx: number) => (
                <Badge key={idx} variant="secondary">{t}</Badge>
              ))}
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Texto original</p>
            <p className="text-sm whitespace-pre-line">{note.content}</p>
          </div>
          {note.organized_content && (
            <div>
              <p className="text-sm text-muted-foreground">Texto organizado</p>
              <p className="text-sm whitespace-pre-line">{note.organized_content}</p>
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