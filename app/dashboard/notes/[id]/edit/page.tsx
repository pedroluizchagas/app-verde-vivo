import { createClient } from "@/lib/supabase/server"
import { NoteEditForm } from "@/components/notes/note-edit-form"

export default async function NoteEditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: note } = await supabase
    .from("notes")
    .select("id, title, content, organized_content, importance, tags")
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Editar nota</h1>
      <NoteEditForm note={note} />
    </div>
  )
}