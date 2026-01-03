"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, FileText, Image as ImageIcon, Download } from "lucide-react"

const NOW_MS = Date.now()

export function WorkOrderServiceNoteRich({ order, items, companyName, watermarkBase64 }: { order: any; items: any[]; companyName?: string; watermarkBase64?: string }) {
  const selectorId = "work-order-service-note"
  const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const dateStr = (() => {
    const d = order?.appointment?.scheduled_date ? new Date(order.appointment.scheduled_date) : new Date(order?.created_at || NOW_MS)
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  })()
  const totals = (() => {
    const materials = (items || []).reduce((sum, it: any) => sum + Number(it.unit_price) * Number(it.quantity), 0)
    const labor = Number(order?.labor_cost || 0)
    const discount = Number(order?.discount || 0)
    const total = labor + materials - discount
    return { materials, labor, discount, total }
  })()
  const nsu = String(order?.id || "").slice(0, 8)

  const buildImage = async () => {
    const bw = 360
    const scale = 3
    const margin = 24
    const colGap = 16
    const colW = (bw - margin * 2 - colGap) / 2
    const rowH = 30
    const headerH = 120
    const baseAfterHeader = 100
    const itemsH = Math.max(1, items.length) * rowH + 52
    const totalsH = 96
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = 1
    tempCanvas.height = 1
    const measureCtx = tempCanvas.getContext("2d") as CanvasRenderingContext2D
    measureCtx.font = "400 14px system-ui"
    const wrap = (t: string, max: number) => {
      const words = String(t || "").split(/\s+/)
      const lines: string[] = []
      let cur = ""
      for (const w of words) {
        const test = cur ? cur + " " + w : w
        if (measureCtx.measureText(test).width <= max) cur = test
        else { if (cur) lines.push(cur); cur = w }
      }
      if (cur) lines.push(cur)
      return lines
    }
    const nameLines = order?.client?.name ? wrap(String(order.client.name), bw - margin * 2) : []
    const phoneLines = order?.client?.phone ? [String(order.client.phone)] : []
    const addressLines = order?.client?.address ? wrap(String(order.client.address), bw - margin * 2) : []
    // Footer brand layout: if (company + " • Nota de serviço" + ID) doesn't fit
    // move "Nota de serviço" + ID to the next line and wrap company if needed
    measureCtx.font = "400 12px system-ui"
    const shortId = String(order?.id || "").slice(0, 8)
    const idTxt = `ID da OS: ${shortId}`
    const idW = measureCtx.measureText(idTxt).width
    const companyOnly = String(companyName || "")
    const noteLabel = "Nota de serviço"
    const combinedLeft = companyOnly ? `${companyOnly} • ${noteLabel}` : noteLabel
    const combinedLeftW = measureCtx.measureText(combinedLeft).width
    const avail = bw - margin * 2
    const companyWrapped = wrap(companyOnly, avail)
    const singleLineFits = combinedLeftW + idW <= avail
    const brandLinesCount = singleLineFits ? 1 : (companyWrapped.length + 1)
    const brandH = brandLinesCount * 16
    const linesH = (nameLines.length + phoneLines.length + addressLines.length) * 18
    const clientH = 54 + linesH + 20
    const footerH = 54 + brandH + 24
    const extraBottom = 16
    const bh = headerH + baseAfterHeader + itemsH + totalsH + clientH + footerH + extraBottom
    const canvas = document.createElement("canvas")
    canvas.width = bw * scale
    canvas.height = Math.ceil(bh * scale)
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    ctx.scale(scale, scale)
    ctx.imageSmoothingEnabled = true
    const fit = (t: string, max: number) => {
      let s = t
      while (ctx.measureText(s).width > max && s.length > 3) s = s.slice(0, -1)
      if (s !== t) s = s.slice(0, Math.max(0, s.length - 3)) + "..."
      return s
    }
    const unitFmt = (u: string) => u.replace(/m2/i, "m²")
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, bw, bh)
    ctx.fillStyle = "#111"
    ctx.font = "700 28px system-ui"
    ctx.fillText("Nota de serviço", margin, 54)
    ctx.font = "400 13px system-ui"
    ctx.fillStyle = "#666"
    ctx.fillText(dateStr, margin, 80)
    const logo = new Image()
    logo.src = watermarkBase64 || "/img/irislogo.png"
    await new Promise((res) => { logo.onload = () => res(null); logo.onerror = () => res(null) })
    try { ctx.drawImage(logo, bw - margin - 36, margin, 36, 36) } catch {}
    ctx.strokeStyle = "#e9e9e9"
    ctx.beginPath(); ctx.moveTo(margin, headerH); ctx.lineTo(bw - margin, headerH); ctx.stroke()
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    ctx.fillText("Valor", margin, headerH + 26)
    ctx.fillText("Tipo de serviço", margin + colW + colGap, headerH + 26)
    ctx.fillStyle = "#111"; ctx.font = "600 20px system-ui"
    ctx.fillText(currency(totals.total), margin, headerH + 52)
    ctx.font = "400 16px system-ui"; ctx.fillText("Serviço de jardinagem", margin + colW + colGap, headerH + 52)
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, headerH + 72); ctx.lineTo(bw - margin, headerH + 72); ctx.stroke()
    // Info block: sequential lines for clarity
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    ctx.fillText("Data e hora", margin, headerH + 98)
    ctx.fillStyle = "#111"; ctx.font = "400 14px system-ui"
    ctx.fillText(dateStr, bw - margin - ctx.measureText(dateStr).width, headerH + 98)
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    const empLabel = "Empresa"
    ctx.fillText(empLabel, margin, headerH + 118)
    const empVal = companyName || "VerdeVivo"
    ctx.fillStyle = "#111"; ctx.font = "400 14px system-ui"
    ctx.fillText(empVal, bw - margin - ctx.measureText(empVal).width, headerH + 118)
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    ctx.fillText("ID", margin, headerH + 138)
    ctx.fillStyle = "#111"; ctx.font = "400 14px system-ui"
    ctx.fillText(nsu, bw - margin - ctx.measureText(nsu).width, headerH + 138)
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, headerH + 156); ctx.lineTo(bw - margin, headerH + 156); ctx.stroke()
    let y = headerH + 182
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Itens", margin, y)
    y += 22
    ctx.font = "400 13px system-ui"; ctx.fillStyle = "#111"
    const list = items.length > 0 ? items : [{ id: "none", product: { name: "Nenhum" }, quantity: 0, unit_price: 0, unit: "" }]
    for (const it of list) {
      const name = fit(String((it as any).product?.name || (it as any).product_id), colW)
      const qty = Number((it as any).quantity)
      const unit = unitFmt(String((it as any).unit || (it as any).product?.unit || "un"))
      const subtotal = currency(Number((it as any).unit_price) * qty)
      ctx.fillText(name, margin, y)
      const right = `${qty} ${unit} • ${subtotal}`
      const wRight = ctx.measureText(right).width
      ctx.fillStyle = "#666"; ctx.fillText(right, bw - margin - wRight, y)
      ctx.fillStyle = "#111"
      y += rowH
    }
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y + 6); ctx.lineTo(bw - margin, y + 6); ctx.stroke()
    y += 30
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    ctx.fillText("Mão de obra", margin, y)
    ctx.fillText("Desconto", margin + colW + colGap, y)
    y += 24
    ctx.fillStyle = "#111"; ctx.font = "400 16px system-ui"
    ctx.fillText(currency(totals.labor), margin, y)
    ctx.fillText(currency(totals.discount), margin + colW + colGap, y)
    y += 26
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(bw - margin, y); ctx.stroke()
    y += 24
    ctx.font = "600 16px system-ui"; ctx.fillStyle = "#666"; ctx.fillText("Cliente", margin, y)
    y += 22
    ctx.font = "400 14px system-ui"; ctx.fillStyle = "#111"
    for (const ln of nameLines) { ctx.fillText(ln, margin, y); y += 18 }
    ctx.fillStyle = "#666"; ctx.font = "400 14px system-ui"
    for (const ln of phoneLines) { ctx.fillText(ln, margin, y); y += 18 }
    for (const ln of addressLines) { ctx.fillText(ln, margin, y); y += 18 }
    y += 16
    ctx.fillStyle = "#666"; ctx.font = "400 12px system-ui"
    if (singleLineFits) {
      ctx.fillText(combinedLeft, margin, y)
      const idWDraw = ctx.measureText(idTxt).width
      ctx.fillText(idTxt, bw - margin - idWDraw, y)
      y += 20
    } else {
      for (const ln of companyWrapped) { ctx.fillText(ln, margin, y); y += 16 }
      ctx.fillText(noteLabel, margin, y)
      const idWDraw = ctx.measureText(idTxt).width
      ctx.fillText(idTxt, bw - margin - idWDraw, y)
      y += 20
    }
    return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
  }

  const handleDownloadImage = async () => {
    const blob = await buildImage()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nota-os-${order?.id}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleShareImage = async () => {
    const blob = await buildImage()
    if (!blob) return
    const file = new File([blob], `nota-os-${order?.id}.png`, { type: "image/png" })
    if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
      try { await (navigator as any).share({ files: [file], title: order?.title || "Nota de serviço" }) } catch {}
      return
    }
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const handleExportPdf = async () => {
    const blob = await buildImage()
    if (!blob) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      document.body.appendChild(iframe)
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      const style = `body{margin:0;padding:0}img{display:block;width:100%;height:auto}`
      doc?.open()
      doc?.write(`<!doctype html><html><head><meta charset='utf-8'><title>nota-os-${order?.id}</title><style>${style}</style></head><body><img src='${dataUrl}'/></body></html>`)
      doc?.close()
      const wnd = iframe.contentWindow
      if (!wnd) return
      const cleanup = () => { try { document.body.removeChild(iframe) } catch {} }
      wnd.onafterprint = cleanup
      setTimeout(() => { wnd.focus(); wnd.print() }, 100)
    }
    reader.readAsDataURL(blob)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Nota de serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <div id={selectorId} className="rounded-lg border overflow-hidden">
          <div className="p-5 flex items-center gap-3">
            <img src="/img/irislogo.png" alt="Logo" className="h-8 w-8 rounded" />
            <div>
              <p className="text-xl font-semibold">Nota de serviço</p>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
          </div>
          <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-lg font-bold">{currency(totals.total)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tipo de transação</p>
              <p className="text-sm">Serviço de jardinagem</p>
            </div>
          </div>
          <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Data e hora</p>
              <p className="text-sm">{dateStr}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estabelecimento</p>
              <p className="text-sm">Íris</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="text-sm">{nsu}</p>
            </div>
          </div>
          <div className="px-5 py-3 border-t">
            <p className="text-sm text-muted-foreground mb-2">Itens</p>
            <div className="space-y-1">
              {items.length > 0 ? (
                items.map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <span>{it.product?.name || it.product_id}</span>
                    <span className="text-muted-foreground">{Number(it.quantity)} {String(it.unit || it.product?.unit || "un")} • {currency(Number(it.unit_price) * Number(it.quantity))}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum material</p>
              )}
            </div>
          </div>
          <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mão de obra</p>
              <p className="text-sm">{currency(totals.labor)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Materiais</p>
              <p className="text-sm">{currency(totals.materials)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Desconto</p>
              <p className="text-sm">{currency(totals.discount)}</p>
            </div>
          </div>
          <div className="px-5 py-3 border-t">
            <p className="text-sm text-muted-foreground mb-1">Cliente</p>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order?.client?.name || ""}</p>
              {order?.client?.phone && <p className="text-muted-foreground">{order.client.phone}</p>}
              {order?.client?.address && <p className="text-muted-foreground">{order.client.address}</p>}
            </div>
          </div>
          <div className="px-5 py-4 bg-muted border-t text-xs text-muted-foreground">
            <p>Íris • Comprovante gerado automaticamente</p>
            <p>ID da OS: {String(order?.id || "")}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleShareImage}><ImageIcon className="h-4 w-4" /> Enviar imagem</Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadImage}><Download className="h-4 w-4" /> Baixar imagem</Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPdf}><FileText className="h-4 w-4" /> Exportar PDF</Button>
        </div>
      </CardContent>
    </Card>
  )
}
