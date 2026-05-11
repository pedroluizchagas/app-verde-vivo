import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { ExportDashboardPDFButton } from "@/components/reports/export-button";
import { RecordIncomeButton } from "@/components/work-orders/record-income-button";
import { WorkOrderServiceNoteRich } from "@/components/work-orders/service-note-rich";
import { statusLabels, statusColors } from "@/components/work-orders/work-order-card";
import type { ClienteResumo } from "@/lib/domain/types";

interface OrderItemRow {
  id: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  unit?: string | null;
  product?: { name?: string | null; unit?: string | null } | { name?: string | null; unit?: string | null }[] | null;
}

interface AppointmentEmbutido {
  id: string;
  title?: string | null;
  scheduled_date: string;
}

interface OrderRow {
  id: string;
  gardener_id: string;
  client_id: string | null;
  appointment_id?: string | null;
  title: string;
  description?: string | null;
  status: string;
  total_amount?: number | null;
  labor_cost?: number | null;
  materials_markup_pct?: number | null;
  extra_charges?: number | null;
  discount?: number | null;
  transaction_id?: string | null;
  client?: ClienteResumo | ClienteResumo[] | null;
  appointment?: AppointmentEmbutido | null;
}

interface ProfileEmbutido {
  company_name?: string | null;
  full_name?: string | null;
  watermark_base64?: string | null;
}

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "new") {
    redirect("/dashboard/work-orders/new");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orderRaw } = await supabase
    .from("service_orders")
    .select(
      "*, client:clients(id, name, phone, address), appointment:appointments(id, title, scheduled_date)",
    )
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle();

  if (!orderRaw) {
    notFound();
  }

  const order = orderRaw as OrderRow;
  const cliente: ClienteResumo | null = Array.isArray(order.client)
    ? ((order.client[0] as ClienteResumo | undefined) ?? null)
    : ((order.client as ClienteResumo | null) ?? null);

  const { data: itemsRaw } = await supabase
    .from("service_order_items")
    .select("id, quantity, unit_cost, unit_price, unit, product:products(name, unit)")
    .eq("order_id", id);

  const items = (itemsRaw ?? []) as OrderItemRow[];

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("company_name, full_name, watermark_base64")
    .eq("id", user!.id)
    .maybeSingle();

  const profile = profileRaw as ProfileEmbutido | null;

  const currency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(v || 0));

  const laborCost = Number(order.labor_cost ?? 0);
  const markupPct = Number(order.materials_markup_pct ?? 0);
  const extraCharges = Number(order.extra_charges ?? 0);
  const discount = Number(order.discount ?? 0);

  const materialsBase = items.reduce(
    (s, it) => s + Number(it.unit_cost) * Number(it.quantity),
    0,
  );
  const materialsPrice = items.reduce(
    (s, it) => s + Number(it.unit_price) * Number(it.quantity),
    0,
  );
  const markupAmount = materialsPrice - materialsBase;
  const total = Number(order.total_amount ?? 0);

  const statusLabel = statusLabels[order.status] ?? order.status;
  const statusColor = statusColors[order.status] ?? "bg-muted text-muted-foreground";

  const typeLabel = order.appointment
    ? new Date(order.appointment.scheduled_date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

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
              {order.title}
            </h1>
            <p className="text-[13px] text-muted-foreground">Ordem de Serviço</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="icon" title="Editar OS">
            <Link href={`/dashboard/work-orders/${id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          {order.transaction_id ? (
            <Button asChild variant="outline" size="sm" className="h-9 rounded-lg text-[12px]">
              <Link href={`/dashboard/finance/transactions/${order.transaction_id}`}>
                Ver lançamento
              </Link>
            </Button>
          ) : (
            <RecordIncomeButton
              orderId={id}
              amount={total}
              clientId={order.client_id ?? ""}
              title={order.title}
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
          {order.description && (
            <Card className="py-0">
              <CardContent className="p-5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                  Descrição
                </p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {order.description}
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

                  {items.map((it) => {
                    const lineTotal = Number(it.unit_price) * Number(it.quantity);
                    const produto = Array.isArray(it.product) ? it.product[0] : it.product;
                    const unit = it.unit ?? produto?.unit ?? "un";
                    return (
                      <div
                        key={it.id}
                        className="grid grid-cols-[1fr_auto_auto] gap-x-4 py-2.5 border-b border-border/40 last:border-b-0"
                      >
                        <span className="text-[13px] font-medium truncate">
                          {produto?.name ?? "—"}
                        </span>
                        <span className="text-[12px] text-muted-foreground text-right tabular-nums whitespace-nowrap">
                          {Number(it.quantity)} {unit}
                        </span>
                        <span className="text-[13px] font-semibold text-right tabular-nums">
                          {currency(lineTotal)}
                        </span>
                      </div>
                    );
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
                  <span className="text-[13px] text-muted-foreground">Mão de obra</span>
                  <span className="text-[13px] font-medium tabular-nums">
                    {currency(laborCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-muted-foreground">Materiais (base)</span>
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
                    <span className="text-[13px] text-muted-foreground">Adicionais</span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {currency(extraCharges)}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] text-muted-foreground">Desconto</span>
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
          {cliente && (
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
                    href={`/dashboard/clients/${cliente.id}`}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Ver perfil
                  </Link>
                </div>

                <div className="flex flex-col divide-y divide-border/60">
                  <Link
                    href={`/dashboard/clients/${cliente.id}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                        Nome
                      </p>
                      <p className="text-[13px] font-medium text-primary truncate">
                        {cliente.name}
                      </p>
                    </div>
                  </Link>

                  {cliente.phone && (
                    <a
                      href={`tel:${cliente.phone}`}
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
                          {cliente.phone}
                        </p>
                      </div>
                    </a>
                  )}

                  {cliente.address && (
                    <div className="flex items-start gap-3 py-2.5">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                          Endereço
                        </p>
                        <p className="text-[13px] font-medium leading-snug">{cliente.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agendamento vinculado */}
          {order.appointment && (
            <Card className="py-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h2 className="text-[14px] font-semibold">Agendamento</h2>
                </div>

                <Link
                  href={`/dashboard/schedule/${order.appointment.id}`}
                  className="flex items-start gap-3 hover:bg-accent/50 rounded-lg px-2 -mx-2 py-2 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-tight">
                      {order.appointment.title ?? "Agendamento"}
                    </p>
                    {typeLabel && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{typeLabel}</p>
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

              {order.transaction_id ? (
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
                    <Link href={`/dashboard/finance/transactions/${order.transaction_id}`}>
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
                    clientId={order.client_id ?? ""}
                    title={order.title}
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
        items={items.map((it) => ({
          ...it,
          product: Array.isArray(it.product) ? (it.product[0] ?? null) : (it.product ?? null),
        }))}
        companyName={profile?.company_name ?? profile?.full_name ?? "Gestão Garden"}
        watermarkBase64={profile?.watermark_base64 ?? undefined}
      />
    </div>
  );
}
