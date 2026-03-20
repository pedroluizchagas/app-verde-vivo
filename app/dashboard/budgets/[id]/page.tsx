import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteBudgetButton } from "@/components/budgets/delete-budget-button"
import { statusLabels, statusColors } from "@/components/budgets/budget-card"

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
    .select("*, client:clients(id, name, phone, address)")
    .eq("id", id)
    .eq("gardener_id", user!.id)
    .single()

  if (!budget) {
    notFound()
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

  const total = Number(budget.total_amount || 0)
  const statusLabel = statusLabels[budget.status] ?? budget.status
  const statusColor = statusColors[budget.status] ?? "bg-muted text-muted-foreground"

  const now = new Date()
  const validUntil = budget.valid_until ? new Date(budget.valid_until) : null
  const isExpired = validUntil && validUntil < now && budget.status === "pending"

  const validStr = validUntil
    ? validUntil.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null

  const createdStr = new Date(budget.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/budgets">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {budget.title}
            </h1>
            <p className="text-[13px] text-muted-foreground">Orçamento</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="icon">
            <Link href={`/dashboard/budgets/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <DeleteBudgetButton budgetId={id} budgetTitle={budget.title} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Valor
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[16px] font-bold leading-tight tabular-nums text-primary">
              {fmt(total)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">total</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Criado
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[13px] font-bold leading-tight capitalize">
              {createdStr}
            </p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${statusColor}`}>
              {statusLabel}
            </span>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Validade
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            {validStr ? (
              <>
                <p
                  className={`text-[13px] font-bold leading-tight capitalize ${isExpired ? "text-destructive" : ""}`}
                >
                  {validStr}
                </p>
                {isExpired && (
                  <p className="text-[10px] text-destructive mt-0.5 font-medium">
                    Expirado
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">Sem prazo</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-4">
          {budget.description ? (
            <Card className="py-0">
              <CardContent className="p-5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                  Descrição
                </p>
                <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {budget.description}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              <CardContent className="p-5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                  Descrição
                </p>
                <p className="text-[13px] text-muted-foreground italic">
                  Nenhuma descrição adicionada.
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-[12px] mt-3"
                >
                  <Link href={`/dashboard/budgets/${id}/edit`}>
                    Adicionar descrição
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">
          {/* Cliente */}
          {budget.client && (
            <Card className="py-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <h2 className="text-[14px] font-semibold">Cliente</h2>
                  </div>
                  <Link
                    href={`/dashboard/clients/${(budget.client as any).id}`}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Ver perfil
                  </Link>
                </div>

                <div className="flex flex-col divide-y divide-border/60">
                  <Link
                    href={`/dashboard/clients/${(budget.client as any).id}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        Nome
                      </p>
                      <p className="text-[13px] font-medium text-primary truncate">
                        {budget.client.name}
                      </p>
                    </div>
                  </Link>

                  {(budget.client as any).phone && (
                    <a
                      href={`tel:${(budget.client as any).phone}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                          Telefone
                        </p>
                        <p className="text-[13px] font-medium text-primary truncate">
                          {(budget.client as any).phone}
                        </p>
                      </div>
                    </a>
                  )}

                  {(budget.client as any).address && (
                    <div className="flex items-start gap-3 py-2.5">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                          Endereço
                        </p>
                        <p className="text-[13px] font-medium leading-snug">
                          {(budget.client as any).address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações rápidas */}
          <Card className="py-0">
            <CardContent className="p-5">
              <h2 className="text-[14px] font-semibold mb-3">Ações</h2>
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg text-[13px] w-full justify-start gap-2"
                >
                  <Link href={`/dashboard/budgets/${id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Editar orçamento
                  </Link>
                </Button>
                {budget.status === "approved" && (
                  <Button
                    asChild
                    size="sm"
                    className="h-9 rounded-lg text-[13px] w-full justify-start gap-2"
                  >
                    <Link
                      href={`/dashboard/work-orders/new${budget.client ? `?client=${(budget.client as any).id}` : ""}`}
                    >
                      Gerar OS
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
