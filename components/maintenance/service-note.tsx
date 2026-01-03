"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportDashboardPDFButton } from "@/components/reports/export-button"
import { FileText, Share2 } from "lucide-react"

export function MaintenanceServiceNote({ planTitle, client, execution }: { planTitle: string; client?: any; execution: any }) {
  const selectorId = `maintenance-note-${execution.id}`
  const details = (execution as any).details || {}
  const labor = Number(details?.labor ?? 0)
  const materials: any[] = Array.isArray(details?.materials) ? details.materials : []
  const markupPct = Number(details?.markupPct ?? 0)
  const materialsTotalRaw = materials.reduce((sum, m: any) => sum + Number(m.quantity || 0) * Number(m.unitCost || 0), 0)
  const materialsTotal = Number((materialsTotalRaw * (1 + (markupPct > 0 ? markupPct / 100 : 0))).toFixed(2))
  const total = Number((typeof execution.final_amount === "number" ? execution.final_amount : labor + materialsTotal).toFixed(2))
  const description = String(details?.description || "")
  const title = String(details?.title || planTitle || "Manutenção")

  const buildNoteText = () => {
    const lines = [
      `Manutenção: ${title}`,
      description ? `Descrição: ${description}` : undefined,
      `Materiais:`,
      ...(materials.length > 0
        ? materials.map((m: any) => `${String(m.name || "Material")} — ${Number(m.quantity || 0)} ${String(m.unit || "un")} (${currency(Number(m.quantity || 0) * Number(m.unitCost || 0) * (1 + (markupPct > 0 ? markupPct / 100 : 0)))})`)
        : ["Nenhum"]),
      `Mão de obra: ${currency(labor)}`,
      `Materiais: ${currency(materialsTotal)}`,
      `Total: ${currency(total)}`,
      client ? `Cliente: ${client.name} | ${client.phone || ""} | ${client.address || ""}` : undefined,
    ].filter(Boolean)
    return lines.join("\n")
  }

  const handleShare = async () => {
    const text = buildNoteText()
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title, text })
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
        <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Nota de manutenção</CardTitle>
      </CardHeader>
      <CardContent>
        <div id={selectorId} className="rounded-md border p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Serviço</p>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">Status: {String(execution.status || "done")}</p>
          </div>
          {description && (
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm">{description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Materiais</p>
            <div className="space-y-1">
              {materials.length > 0 ? (
                materials.map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{String(m.name || "Material")} — {Number(m.quantity || 0)} {String(m.unit || "un")}</span>
                    <span className="text-muted-foreground">{currency(Number(m.quantity || 0) * Number(m.unitCost || 0) * (1 + (markupPct > 0 ? markupPct / 100 : 0)))}</span>
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
              <span className="font-medium">{currency(labor)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Materiais</span>
              <span className="font-medium">{currency(materialsTotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{currency(total)}</span>
            </div>
          </div>
          {client && (
            <div className="border-t pt-3 text-sm">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{client.name}</p>
              {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
              {client.address && <p className="text-muted-foreground">{client.address}</p>}
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleShare}><Share2 className="h-4 w-4" /> Enviar</Button>
          <Button variant="outline" className="gap-2" onClick={handleCopy}>Copiar texto</Button>
          <ExportDashboardPDFButton selector={`#${selectorId}`} fileName={`nota-manutencao-${execution.id}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

