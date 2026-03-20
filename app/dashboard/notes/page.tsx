import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, StickyNote, AlertCircle, Tag, Search } from "lucide-react"
import { NoteCard } from "@/components/notes/note-card"

export default async function NotesPage({
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
    .from("notes")
    .select("id, title, importance, tags, organized_content, created_at")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  if (q) {
    const like = `%${q}%`
    query = query.or(
      `title.ilike.${like},content.ilike.${like},organized_content.ilike.${like}`
    )
  }

  const { data: notes } = await query
  const allNotes = notes || []

  const highCount = allNotes.filter((n) => n.importance === "high").length
  const taggedCount = allNotes.filter(
    (n) => Array.isArray(n.tags) && n.tags.length > 0
  ).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notas</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {allNotes.length} nota{allNotes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/notes/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Nova nota</span>
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">{allNotes.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              nota{allNotes.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Alta prioridade
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">{highCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              nota{highCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Com tags
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">{taggedCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              categorizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <form method="GET" action="/dashboard/notes">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título ou conteúdo..."
            className="h-11 pl-9"
          />
        </div>
      </form>

      {/* Lista */}
      {allNotes.length > 0 ? (
        <>
          {q && (
            <p className="text-[12px] text-muted-foreground">
              {allNotes.length} resultado{allNotes.length !== 1 ? "s" : ""}{" "}
              para &ldquo;{q}&rdquo;
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <StickyNote className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            {q ? (
              <>
                <h3 className="font-semibold">Nenhuma nota encontrada</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Tente buscar por outro termo
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold">Nenhuma nota criada</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Registre observações, ideias e lembretes sobre seus jardins
                </p>
              </>
            )}
          </div>
          {!q && (
            <Button asChild>
              <Link href="/dashboard/notes/new">Nova nota</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
