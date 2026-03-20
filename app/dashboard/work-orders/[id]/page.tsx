import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Edit,
  User,
  MapPin,
  Phone,
  Calendar,
  Wrench,
  Package,
  DollarSign,
  FileText,
} from "lucide-react"
import { ExportDashboardPDFButton } from "@/components/reports/export-button"
import { RecordIncomeButton } from "@/components/work-orders/record-income-button"
import { WorkOrderServiceNoteRich } from "@/components/work-orders/service-note-rich"
import { statusLabels, statusColors } from "@/components/work-orders/work-order-card"

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (id === "new") {
    redirect("/dashboard/work-orders/new")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from("service_orders")
    .select(
      "*, client:clients(id, name, phone, address), appointment:appointments(id, title, scheduled_date)"
    )
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()

  if (!order) {
    notFound()
  }

  const { data: items } = await supabase
    .from("service_order_items")
    .select("id, quantity, unit_cost, unit_price, unit, product:products(name, unit)")
    .eq("order_id", id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, watermark_base64")
    .eq("id", user!.id)
    .maybeSingle()

  const currency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(v || 0))

  const laborCost = Number((order as any).labor_cost || 0)
  const markupPct = Number((order as any).materials_markup_pct || 0)
  const extraCharges = Number((order as any).extra_charges || 0)
  const discount = Number((order as any).discount || 0)

  const materialsBase = (items || []).reduce(
    (s: number, it: any) => s + Number(it.unit_cost) * Number(it.quantity),
    0
  )
  const materialsPrice = (items || []).reduce(
    (s: number, it: any) => s + Number(it.unit_price) * Number(it.quantity),
    0
  )
  const markupAmount = materialsPrice - materialsBase
  const total = Number((order as any).total_amount || 0)

  const statusLabel = statusLabels[(order as any).status] ?? (order as any).status
  const statusColor =
    statusColors[(order as any).status] ?? "bg-muted text-muted-foreground"

  const typeLabel = (order as any).appointment
    ? new Date((order as any).appointment.scheduled_date).toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "short", year: "numeric" }
      )
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/work-orders">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
              {(order as any).title}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Ordem de Serviço
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            size="icon"
            title="Editar OS"
          >
            <Link href={`/dashboard/work-orders/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          {(order as any).transaction_id ? (
            <Button asChild variant="outline" size="sm" className="h-9 rounded-lg text-[12px]">
              <Link
                href={`/dashboard/finance/transactions/${(order as any).transaction_id}`}
              >
                Ver lançamento
              </Link>
            </Button>
          ) : (
            <RecordIncomeButton
              orderId={id}
              amount={total}
              clientId={(order as any).client_id}
              title={(order as any).title}
            />
          )}
          <ExportDashboardPDFButton
            selector="#work-order-detail"
            fileName={`ordem-servico-${id}`}
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Mão de obra
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[16px] font-bold leading-tight tabular-nums">
              {currency(laborCost)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">serviço</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Materiais
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[16px] font-bold leading-tight tabular-nums">
              {currency(materialsPrice)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {(items || []).length} item{(items || []).length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[16px] font-bold leading-tight tabular-nums text-primary">
              {currency(total)}
            </p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main grid */}
      <div
        id="work-order-detail"
        className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start"
      >
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-4">
          {/* Descrição */}
          {(order as any).description && (
            <Card className="py-0">
              <CardContent className="p-5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                  Descrição
                </p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {(order as any).description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Itens de material */}
          {items && items.length > 0 && (
            <Card className="py-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h2 className="text-[14px] font-semibold">Materiais</h2>
                </div>

                <div className="flex flex-col">
                  {/* Cabeçalho */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-2 border-b border-border/60">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      Produto
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-right">
                      Qtd
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-right">
                      Total
                    </span>
                  </div>

                  {(items as any[]).map((it: any) => {
                    const lineTotal =
                      Number(it.unit_price) * Number(it.quantity)
                    const unit = it.unit || it.product?.unit || "un"
                    return (
                      <div
                        key={it.id}
                        className="grid grid-cols-[1fr_auto_auto] gap-x-4 py-2.5 border-b border-border/40 last:border-b-0"
                      >
                        <span className="text-[13px] font-medium truncate">
                          {it.product?.name || "—"}
                        </span>
                        <span className="text-[12px] text-muted-foreground text-right tabular-nums whitespace-nowrap">
                          {Number(it.quantity)} {unit}
                        </span>
                        <span className="text-[13px] font-semibold text-right tabular-nums">
                          {currency(lineTotal)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo financeiro */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                </div>
                <h2 className="text-[14px] font-semibold">Resumo financeiro</h2>
              </div>

              <div className="flex flex-col divide-y divide-border/40">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-muted-foreground">
                    Mão de obra
                  </span>
                  <span className="text-[13px] font-medium tabular-nums">
                    {currency(laborCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-muted-foreground">
                    Materiais (base)
                  </span>
                  <span className="text-[13px] font-medium tabular-nums">
                    {currency(materialsBase)}
                  </span>
                </div>
                {markupPct > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] text-muted-foreground">
                      Markup materiais ({markupPct}%)
                    </span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {currency(markupAmount)}
                    </span>
                  </div>
                )}
                {extraCharges > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] text-muted-foreground">
                      Adicionais
                    </span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {currency(extraCharges)}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] text-muted-foreground">
                      Desconto
                    </span>
                    <span className="text-[13px] font-medium tabular-nums text-destructive">
                      -{currency(discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 mt-1">
                  <span className="text-[14px] font-bold">Total</span>
                  <span className="text-[18px] font-bold tabular-nums text-primary">
                    {currency(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">
          {/* Cliente */}
          {(order as any).client && (
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
                    href={`/dashboard/clients/${(order as any).client.id}`}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Ver perfil
                  </Link>
                </div>

                <div className="flex flex-col divide-y divide-border/60">
                  <Link
                    href={`/dashboard/clients/${(order as any).client.id}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        Nome
                      </p>
                      <p className="text-[13px] font-medium text-primary truncate">
                        {(order as any).client.name}
                      </p>
                    </div>
                  </Link>

                  {(order as any).client.phone && (
                    <a
                      href={`tel:${(order as any).client.phone}`}
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
                          {(order as any).client.phone}
                        </p>
                      </div>
                    </a>
                  )}

                  {(order as any).client.address && (
                    <div className="flex items-start gap-3 py-2.5">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                          Endereço
                        </p>
                        <p className="text-[13px] font-medium leading-snug">
                          {(order as any).client.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agendamento vinculado */}
          {(order as any).appointment && (
            <Card className="py-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h2 className="text-[14px] font-semibold">Agendamento</h2>
                </div>

                <Link
                  href={`/dashboard/schedule/${(order as any).appointment.id}`}
                  className="flex items-start gap-3 hover:bg-accent/50 rounded-lg px-2 -mx-2 py-2 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-tight">
                      {(order as any).appointment.title || "Agendamento"}
                    </p>
                    {typeLabel && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {typeLabel}
                      </p>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Lançamento financeiro */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                </div>
                <h2 className="text-[14px] font-semibold">Financeiro</h2>
              </div>

              {(order as any).transaction_id ? (
                <div>
                  <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                    Receita registrada
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[12px] w-full"
                  >
                    <Link
                      href={`/dashboard/finance/transactions/${(order as any).transaction_id}`}
                    >
                      Ver lançamento
                    </Link>
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-[12px] text-muted-foreground mb-3">
                    Nenhuma receita registrada para esta OS.
                  </p>
                  <RecordIncomeButton
                    orderId={id}
                    amount={total}
                    clientId={(order as any).client_id}
                    title={(order as any).title}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Nota de serviço para impressão */}
      <WorkOrderServiceNoteRich
        order={order}
        items={items || []}
        companyName={
          (profile as any)?.company_name ||
          (profile as any)?.full_name ||
          "VerdeVivo"
        }
        watermarkBase64={(profile as any)?.watermark_base64 || undefined}
      />
    </div>
  )
}
