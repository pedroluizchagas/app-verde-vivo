import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, User, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeleteBudgetButton } from "@/components/budgets/delete-budget-button"

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

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === "new") {
    redirect("/dashboard/budgets/new")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: budget } = await supabase
    .from("budgets")
    .select(`
      *,
      client:clients(id, name, phone, address)
    `)
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .single()

  if (!budget) {
    notFound()
  }

  const validUntil = budget.valid_until
    ? new Date(budget.valid_until).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null

  const createdAt = new Date(budget.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/budgets">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detalhes</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/budgets/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteBudgetButton budgetId={id} budgetTitle={budget.title} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{budget.title}</CardTitle>
            <Badge variant="secondary" className={statusColors[budget.status as keyof typeof statusColors]}>
              {statusLabels[budget.status as keyof typeof statusLabels]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold text-primary">R$ {Number(budget.total_amount).toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Criado em {createdAt}</span>
          </div>

          {validUntil && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Válido até {validUntil}</span>
            </div>
          )}

          {budget.description && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Descrição</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{budget.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {budget.client && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <Link href={`/dashboard/clients/${budget.client.id}`} className="text-primary hover:underline">
                {budget.client.name}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
