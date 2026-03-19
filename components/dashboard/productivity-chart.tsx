"use client"

export function ProductivityChart({
  completed,
  remaining,
}: {
  completed: number
  remaining: number
}) {
  const total = completed + remaining || 1
  const completedPct = ((completed / total) * 100).toFixed(1)
  const remainingPct = ((remaining / total) * 100).toFixed(1)

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">
          Serviços Concluídos
        </p>
        <p className="text-[28px] font-bold leading-none mb-2.5">
          {completedPct}%
        </p>
        <div className="h-[7px] bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${completedPct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">do mês atual</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">
          Serviços Pendentes
        </p>
        <p className="text-[28px] font-bold leading-none mb-2.5">
          {remainingPct}%
        </p>
        <div className="h-[7px] bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${remainingPct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">do mês atual</p>
      </div>
    </div>
  )
}
