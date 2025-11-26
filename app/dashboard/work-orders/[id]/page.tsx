import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportDashboardPDFButton } from "@/components/reports/export-button"
import { RecordIncomeButton } from "@/components/work-orders/record-income-button"
import { WorkOrderServiceNoteRich } from "@/components/work-orders/service-note-rich"
import { Edit } from "lucide-react"

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === "new") {
    redirect("/dashboard/work-orders/new")
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: order } = await supabase
    .from("service_orders")
    .select("*, client:clients(id, name, phone, address), appointment:appointments(id, title, scheduled_date)")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()
  if (!order) {
    notFound()
  }
  const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0))
  const total = Number((order as any).total_amount || 0)

  const { data: items } = await supabase
    .from("service_order_items")
    .select("id, quantity, unit_cost, unit_price, unit, product:products(name, unit)")
    .eq("order_id", id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, watermark_base64")
    .eq("id", user!.id)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/work-orders">Voltar</Link>
          </Button>
          <h1 className="text-2xl font-bold">Ordem de serviço</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/work-orders/${id}/edit`} title="Editar OS" className="inline-flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          {order.transaction_id ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/finance/transactions/${order.transaction_id}`}>Ver lançamento</Link>
            </Button>
          ) : (
            <RecordIncomeButton orderId={id} amount={total} clientId={(order as any).client_id} title={(order as any).title} />
          )}
          <ExportDashboardPDFButton selector="#work-order-detail" fileName={`ordem-servico-${id}`} />
        </div>
      </div>

      <Card id="work-order-detail">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{(order as any).title}</CardTitle>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{(order as any).status}</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {(order as any).description && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Descrição</p>
              <p className="text-muted-foreground">{(order as any).description}</p>
            </div>
          )}
          {(order as any).appointment && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Agendamento</p>
              <p className="text-muted-foreground">{(order as any).appointment?.title || (order as any).appointment?.id}</p>
              <p className="text-muted-foreground">{new Date((order as any).appointment?.scheduled_date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Mão de obra</p>
              <p className="text-lg font-bold">{currency((order as any).labor_cost)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Materiais</p>
              <p className="text-lg font-bold">{currency((items || []).reduce((s: number, it: any) => s + Number(it.unit_price) * Number(it.quantity), 0))}</p>
            </div>
          </div>
          {items && items.length > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Itens</p>
              <div className="mt-2 grid gap-2">
                {items.map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between">
                    <span>{it.product?.name} — {Number(it.quantity)} {String(it.unit || it.product?.unit)}</span>
                    <span className="text-muted-foreground">{currency(Number(it.unit_price) * Number(it.quantity))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Markup materiais</p>
              <p className="text-lg font-bold">{Number((order as any).materials_markup_pct || 0)}%</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Adicionais</p>
              <p className="text-lg font-bold">{currency((order as any).extra_charges)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Desconto</p>
              <p className="text-lg font-bold">{currency((order as any).discount)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">{currency(total)}</span>
          </div>
          {(order as any).client && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{(order as any).client?.name}</p>
              {(order as any).client?.phone && <p className="text-muted-foreground">{(order as any).client?.phone}</p>}
              {(order as any).client?.address && <p className="text-muted-foreground">{(order as any).client?.address}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkOrderServiceNoteRich order={order} items={items || []} companyName={(profile as any)?.company_name || (profile as any)?.full_name || "VerdeVivo"} watermarkBase64={(profile as any)?.watermark_base64 || undefined} />
    </div>
  )
}