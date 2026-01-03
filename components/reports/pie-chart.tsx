import { Card, CardContent } from "@/components/ui/card"

function buildConicGradient(slices: { color: string; percent: number }[]) {
  let start = 0
  const parts: string[] = []
  for (const s of slices) {
    const end = start + s.percent * 360
    parts.push(`${s.color} ${start}deg ${end}deg`)
    start = end
  }
  return `conic-gradient(${parts.join(", ")})`
}

export function SimplePieChart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const colors = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6"]
  const slices = data.map((d, i) => ({ color: colors[i % colors.length], percent: d.value / total }))
  const gradient = buildConicGradient(slices)
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">{title}</p>
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full" style={{ background: gradient }} />
          <div className="grid gap-2 text-xs">
            {data.map((d, i) => {
              const percent = Math.round(((d.value / total) * 100))
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded" style={{ background: colors[i % colors.length] }} />
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="ml-auto font-medium">{percent}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
