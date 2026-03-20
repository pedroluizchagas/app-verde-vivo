import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { User, Calendar } from "lucide-react"

interface WorkOrder {
  id: string
  title: string
  status: string
  total_amount: number | null
  created_at: string
  client: { name: string } | null
}

export const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  issued: "Emitida",
  completed: "Concluída",
  cancelled: "Cancelada",
}

export const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusBorderColors: Record<string, string> = {
  draft: "border-l-border",
  issued: "border-l-blue-500",
  completed: "border-l-emerald-500",
  cancelled: "border-l-red-400",
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

export function WorkOrderCard({ order }: { order: WorkOrder }) {
  const statusLabel = statusLabels[order.status] ?? order.status
  const statusColor = statusColors[order.status] ?? "bg-muted text-muted-foreground"
  const borderColor = statusBorderColors[order.status] ?? "border-l-border"
  const total = Number(order.total_amount || 0)

  const date = new Date(order.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  return (
    <Link href={`/dashboard/work-orders/${order.id}`}>
      <Card
        className={`py-0 border-l-4 ${borderColor} transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-[14px] leading-tight truncate">
                  {order.title}
                </p>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {order.client && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {order.client.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground">{date}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[15px] font-bold leading-tight tabular-nums">
                {fmt(total)}
              </p>
              <p className="text-[10px] text-muted-foreground">total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
