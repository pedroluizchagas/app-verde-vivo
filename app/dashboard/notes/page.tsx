import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Edit } from "lucide-react"

export default async function NotesPage({ searchParams }: { searchParams?: { q?: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const q = (searchParams?.q || "").trim()

  let query = supabase
    .from("notes")
    .select("id, title, importance, tags, organized_content, created_at")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  if (q) {
    const like = `%${q}%`
    query = query.or(`title.ilike.${like},content.ilike.${like},organized_content.ilike.${like}`)
  }

  const { data: notes } = await query

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notas</h1>
          <p className="text-sm text-muted-foreground">{notes?.length || 0} nota{notes && notes.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/notes/new">Nova nota</Link>
        </Button>
      </div>

      <form method="GET" className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Buscar por título ou texto" className="pl-8" />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {notes && notes.length > 0 ? (
        <div className="grid gap-3">
          {notes.map((n) => (
            <Card key={n.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {n.title || "Sem título"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={importanceClass(n.importance)}>{labelImportance(n.importance)}</Badge>
                  <Button asChild size="sm" variant="outline" className="bg-transparent">
                    <Link href={`/dashboard/notes/${n.id}/edit`} className="inline-flex items-center gap-1"><Edit className="h-4 w-4" />Editar</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</div>
                {Array.isArray(n.tags) && n.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {n.tags.map((t: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-sm whitespace-pre-line">{n.organized_content || ""}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma nota encontrada</p>
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