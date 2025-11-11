"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, FileText } from "lucide-react"
import { ExportDashboardPDFButton } from "@/components/reports/export-button"

export function ServiceNote({ appointment, materials, totals, marginPct = 0 }: { appointment: any; materials: any[]; totals: { laborCost: number; materialsCost: number; serviceTotal: number }; marginPct?: number }) {
  const handleShare = async () => {
    const noteText = buildNoteText(appointment, materials, totals, marginPct)
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: appointment.title, text: noteText })
      } catch {}
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(noteText)}`
      window.open(url, "_blank")
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildNoteText(appointment, materials, totals, marginPct))
      alert("Nota copiada para a área de transferência")
    } catch {}
  }

  const selectorId = "service-note"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Nota de serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <div id={selectorId} className="rounded-md border p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Serviço</p>
            <p className="font-semibold">{appointment.title}</p>
            <p className="text-xs text-muted-foreground">Status: {appointment.status}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Data</p>
              <p>{new Date(appointment.scheduled_date).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hora</p>
              <p>{new Date(appointment.scheduled_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
          {appointment.description && (
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm">{appointment.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Materiais</p>
            <div className="space-y-1">
              {materials.length > 0 ? (
                materials.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span>{m.product?.name} — {Number(m.quantity)} {m.product?.unit}</span>
                    <span className="text-muted-foreground">{currency(Number(m.quantity) * Number(m.unit_cost ?? m.product?.cost ?? 0) * (1 + (marginPct > 0 ? marginPct / 100 : 0)))}</span>
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
              <span className="font-medium">{currency(totals.laborCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Materiais</span>
              <span className="font-medium">{currency(totals.materialsCost)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{currency(totals.serviceTotal)}</span>
            </div>
          </div>
          {appointment.client && (
            <div className="border-t pt-3 text-sm">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{appointment.client.name}</p>
              <p className="text-muted-foreground">{appointment.client.phone}</p>
              <p className="text-muted-foreground">{appointment.client.address}</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleShare}><Share2 className="h-4 w-4" /> Compartilhar</Button>
          <Button variant="outline" className="gap-2" onClick={handleCopy}>Copiar texto</Button>
          <ExportDashboardPDFButton selector={`#${selectorId}`} fileName={`nota-servico-${appointment.id}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function buildNoteText(appointment: any, materials: any[], totals: { laborCost: number; materialsCost: number; serviceTotal: number }, marginPct: number = 0) {
  const date = new Date(appointment.scheduled_date)
  const lines = [
    `Serviço: ${appointment.title}`,
    `Status: ${appointment.status}`,
    `Data: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    appointment.description ? `Descrição: ${appointment.description}` : undefined,
    `Materiais:`,
    ...(materials.length > 0
      ? materials.map((m: any) => `${m.product?.name} — ${Number(m.quantity)} ${m.product?.unit} (${currency(Number(m.quantity) * Number(m.unit_cost ?? m.product?.cost ?? 0) * (1 + (marginPct > 0 ? marginPct / 100 : 0)))})`)
      : ["Nenhum"]),
    `Mão de obra: ${currency(totals.laborCost)}`,
    `Materiais: ${currency(totals.materialsCost)}`,
    `Total: ${currency(totals.serviceTotal)}`,
    appointment.client ? `Cliente: ${appointment.client.name} | ${appointment.client.phone} | ${appointment.client.address}` : undefined,
  ].filter(Boolean)
  return lines.join("\n")
}