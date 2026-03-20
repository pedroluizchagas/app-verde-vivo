import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface Note {
  id: string
  title: string | null
  importance: string | null
  tags: string[] | null
  organized_content: string | null
  created_at: string
}

export const importanceLabels: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
}

export const importanceBadgeColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
}

export const importanceBorderColors: Record<string, string> = {
  high: "border-l-destructive",
  medium: "border-l-amber-500",
  low: "border-l-border",
}

export function NoteCard({ note }: { note: Note }) {
  const importance = note.importance ?? "medium"
  const borderColor = importanceBorderColors[importance] ?? "border-l-border"
  const badgeColor = importanceBadgeColors[importance] ?? "bg-muted text-muted-foreground"
  const badgeLabel = importanceLabels[importance] ?? "Média"

  const preview = note.organized_content?.trim() || ""

  const tags = Array.isArray(note.tags) ? note.tags.filter(Boolean) : []
  const visibleTags = tags.slice(0, 3)
  const extraTags = tags.length - visibleTags.length

  const dateStr = new Date(note.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  return (
    <Link href={`/dashboard/notes/${note.id}`} className="block">
      <Card
        className={`py-0 border-l-4 ${borderColor} h-full transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]`}
      >
        <CardContent className="p-4 flex flex-col gap-2.5 h-full">
          {/* Cabeçalho: título + badge de importância */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-[14px] leading-snug line-clamp-2 flex-1">
              {note.title || "Sem título"}
            </p>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}
            >
              {badgeLabel}
            </span>
          </div>

          {/* Preview do conteúdo */}
          {preview && (
            <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3 flex-1">
              {preview}
            </p>
          )}

          {/* Tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              {visibleTags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {extraTags > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  +{extraTags}
                </span>
              )}
            </div>
          )}

          {/* Data */}
          <p className="text-[10px] text-muted-foreground mt-auto">{dateStr}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
