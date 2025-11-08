import { Card, CardContent } from "@/components/ui/card"

export function SimpleBarChart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">{title}</p>
        <div className="grid gap-2">
          {data.map((d, i) => (
            <div key={i} className="grid gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-medium">{fmt(d.value)}</span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div className="h-2 rounded bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}