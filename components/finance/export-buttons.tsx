"use client"

import { Button } from "@/components/ui/button"
import { FileDown, FileText } from "lucide-react"

type Tx = {
  id: string
  type: "income" | "expense"
  amount: number
  transaction_date: string
  description: string | null
  status: "paid" | "pending"
  category?: { name: string | null } | null
  client?: { name: string | null } | null
}

export function ExportButtons({ transactions, fileName = "financeiro" }: { transactions: Tx[]; fileName?: string }) {
  const handleCSV = () => {
    const headers = ["Tipo", "Valor", "Data", "Status", "Categoria", "Cliente", "Descrição"]
    const rows = transactions.map((t) => [
      t.type === "income" ? "Receita" : "Despesa",
      String(t.amount).replace(".", ","),
      new Date(t.transaction_date).toLocaleDateString("pt-BR"),
      t.status === "paid" ? "Pago" : "Pendente",
      t.category?.name || "",
      t.client?.name || "",
      (t.description || "").replace(/\n/g, " "),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePDF = () => {
    const w = window.open("", "_blank")
    if (!w) return
    const style = `
      body { font-family: system-ui, sans-serif; padding: 24px; }
      h1 { font-size: 18px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
      th { background: #f7f7f7; text-align: left; }
    `
    const rows = transactions
      .map(
        (t) => `
          <tr>
            <td>${t.type === "income" ? "Receita" : "Despesa"}</td>
            <td>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(t.amount))}</td>
            <td>${new Date(t.transaction_date).toLocaleDateString("pt-BR")}</td>
            <td>${t.status === "paid" ? "Pago" : "Pendente"}</td>
            <td>${t.category?.name || ""}</td>
            <td>${t.client?.name || ""}</td>
            <td>${(t.description || "").replace(/</g, "&lt;")}</td>
          </tr>
        `,
      )
      .join("")
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${fileName}</title>
          <style>${style}</style>
        </head>
        <body>
          <h1>Relatório financeiro</h1>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Status</th>
                <th>Categoria</th>
                <th>Cliente</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="gap-2" onClick={handleCSV}>
        <FileDown className="h-4 w-4" /> Exportar CSV
      </Button>
      <Button variant="outline" className="gap-2" onClick={handlePDF}>
        <FileText className="h-4 w-4" /> Exportar PDF
      </Button>
    </div>
  )
}