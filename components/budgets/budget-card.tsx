import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { User, Calendar, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Budget {
  id: string
  title: string
  description: string | null
  total_amount: number
  status: string
  valid_until: string | null
  created_at: string
  client: {
    name: string
  } | null
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusLabels = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
}

export function BudgetCard({ budget }: { budget: Budget }) {
  const validUntil = budget.valid_until ? new Date(budget.valid_until).toLocaleDateString("pt-BR") : null

  return (
    <Link href={`/dashboard/budgets/${budget.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{budget.title}</h3>
                {budget.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{budget.description}</p>
                )}
              </div>
              <Badge variant="secondary" className={statusColors[budget.status as keyof typeof statusColors]}>
                {statusLabels[budget.status as keyof typeof statusLabels]}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-foreground">R$ {Number(budget.total_amount).toFixed(2)}</span>
              </div>

              {budget.client && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span>{budget.client.name}</span>
                </div>
              )}

              {validUntil && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Válido até {validUntil}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
