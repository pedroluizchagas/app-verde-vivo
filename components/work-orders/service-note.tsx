"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, FileText } from "lucide-react"
import { ExportDashboardPDFButton } from "@/components/reports/export-button"

export function WorkOrderServiceNote({ order, items }: { order: any; items: any[] }) {
  const selectorId = "work-order-service-note"

  const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const totals = (() => {
    const materials = (items || []).reduce((sum, it: any) => sum + Number(it.unit_price) * Number(it.quantity), 0)
    const labor = Number(order?.labor_cost || 0)
    const discount = Number(order?.discount || 0)
    const total = labor + materials - discount
    return { materials, labor, discount, total }
  })()

  const buildNoteText = () => {
    const lines = [
      `Ordem de serviço: ${order?.title || order?.id}`,
      order?.status ? `Status: ${order.status}` : undefined,
      order?.description ? `Descrição: ${order.description}` : undefined,
      `Materiais:`,
      ...(items.length > 0
        ? items.map((it: any) => `${it.product?.name || it.product_id} — ${Number(it.quantity)} ${String(it.unit || it.product?.unit || "un")} (${currency(Number(it.unit_price) * Number(it.quantity))})`)
        : ["Nenhum"]),
      `Mão de obra: ${currency(totals.labor)}`,
      totals.discount > 0 ? `Desconto: ${currency(totals.discount)}` : undefined,
      `Total: ${currency(totals.total)}`,
      order?.client ? `Cliente: ${order.client?.name} | ${order.client?.phone || ""} | ${order.client?.address || ""}` : undefined,
    ].filter(Boolean)
    return lines.join("\n")
  }

  const handleShare = async () => {
    const text = buildNoteText()
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: order?.title || "Ordem de serviço", text })
      } catch {}
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, "_blank")
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildNoteText())
      alert("Nota copiada para a área de transferência")
    } catch {}
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Nota de serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <div id={selectorId} className="rounded-md border p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Ordem</p>
            <p className="font-semibold">{order?.title}</p>
            <p className="text-xs text-muted-foreground">Status: {order?.status}</p>
          </div>
          {order?.description && (
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm">{order?.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Materiais</p>
            <div className="space-y-1">
              {items.length > 0 ? (
                items.map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <span>{it.product?.name || it.product_id} — {Number(it.quantity)} {String(it.unit || it.product?.unit || "un")}</span>
                    <span className="text-muted-foreground">{currency(Number(it.unit_price) * Number(it.quantity))}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum material</p>
              )}
            </div>
          </div>
          <div className="border-t pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Mão de obra</span>
              <span className="font-medium">{currency(totals.labor)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span className="font-medium">{currency(totals.discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Materiais</span>
              <span className="font-medium">{currency(totals.materials)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{currency(totals.total)}</span>
            </div>
          </div>
          {order?.client && (
            <div className="border-t pt-3 text-sm">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{order.client?.name}</p>
              {order.client?.phone && <p className="text-muted-foreground">{order.client?.phone}</p>}
              {order.client?.address && <p className="text-muted-foreground">{order.client?.address}</p>}
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleShare}><Share2 className="h-4 w-4" /> Enviar</Button>
          <Button variant="outline" className="gap-2" onClick={handleCopy}>Copiar texto</Button>
          <ExportDashboardPDFButton selector={`#${selectorId}`} fileName={`nota-os-${order?.id}`} />
        </div>
      </CardContent>
    </Card>
  )
}