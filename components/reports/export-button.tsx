"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export function ExportDashboardPDFButton({ selector = "#dashboard-root", fileName = "relatorio-dashboard" }: { selector?: string; fileName?: string }) {
  const handlePrint = () => {
    const content = document.querySelector(selector)
    const w = window.open("", "_blank")
    if (!w || !content) return window.print()
    const style = `
      body { font-family: system-ui, sans-serif; padding: 24px; }
    `
    w.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${fileName}</title>
          <style>${style}</style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handlePrint}>
      <FileText className="h-4 w-4" /> Exportar PDF
    </Button>
  )
}