"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Image as ImageIcon, Download, Share2 } from "lucide-react"

export function MaintenanceServiceNoteRich({ planTitle, client, execution, companyName, watermarkBase64 }: { planTitle: string; client?: any; execution: any; companyName?: string; watermarkBase64?: string }) {
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
  const checklist: any[] = Array.isArray(details?.checklist) ? details.checklist : []
  const fertilization: any[] = Array.isArray(details?.fertilization) ? details.fertilization : []
  const pests: any[] = Array.isArray(details?.pests) ? details.pests : []
  const photos: string[] = Array.isArray(details?.photos) ? details.photos : []

  const dateStr = (() => {
    const d = execution?.created_at ? new Date(execution.created_at) : new Date()
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  })()

  const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const buildImage = async () => {
    const bw = 360
    const scale = 3
    const margin = 24
    const colGap = 16
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = 1
    tempCanvas.height = 1
    const measureCtx = tempCanvas.getContext("2d") as CanvasRenderingContext2D
    measureCtx.font = "400 13px system-ui"
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

    const itemsH = Math.max(1, materials.length) * 28 + 52
    const checklistH = (checklist.length > 0 ? checklist.length * 26 + 40 : 60)
    const fertH = (fertilization.length > 0 ? fertilization.length * 26 + 40 : 60)
    const pestsH = (pests.length > 0 ? pests.length * 26 + 40 : 60)
    const photosH = photos.length > 0 ? 100 : 0
    const headerH = 120
    const totalsH = 96
    const clientNameLines = client?.name ? wrap(String(client.name), bw - margin * 2) : []
    const addressLines = client?.address ? wrap(String(client.address), bw - margin * 2) : []
    const footerH = 54 + 24
    const bh = headerH + itemsH + totalsH + checklistH + fertH + pestsH + photosH + 54 + clientNameLines.length * 16 + addressLines.length * 16 + footerH

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

    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, bw, bh)
    ctx.fillStyle = "#111"
    ctx.font = "700 26px system-ui"
    ctx.fillText("Nota de manutenção", margin, 48)
    ctx.font = "400 12px system-ui"
    ctx.fillStyle = "#666"
    ctx.fillText(dateStr, margin, 68)
    const logo = new Image()
    logo.src = watermarkBase64 || "/img/irislogo.png"
    await new Promise((res) => { logo.onload = () => res(null); logo.onerror = () => res(null) })
    try { ctx.drawImage(logo, bw - margin - 36, margin, 36, 36) } catch {}
    ctx.strokeStyle = "#e9e9e9"
    ctx.beginPath(); ctx.moveTo(margin, headerH); ctx.lineTo(bw - margin, headerH); ctx.stroke()

    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    ctx.fillText("Serviço", margin, headerH + 26)
    ctx.fillStyle = "#111"; ctx.font = "600 18px system-ui"
    ctx.fillText(fit(title, bw - margin * 2), margin, headerH + 50)

    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, headerH + 72); ctx.lineTo(bw - margin, headerH + 72); ctx.stroke()

    let y = headerH + 92
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Materiais", margin, y)
    y += 22
    ctx.font = "400 13px system-ui"; ctx.fillStyle = "#111"
    const list = materials.length > 0 ? materials : [{ name: "Nenhum", quantity: 0, unitCost: 0, unit: "" }]
    for (const it of list) {
      const name = fit(String((it as any).name || "Material"), bw - margin * 2 - 80)
      const qty = Number((it as any).quantity)
      const unit = String((it as any).unit || "un")
      const subtotal = currency(Number((it as any).unitCost) * qty * (1 + (markupPct > 0 ? markupPct / 100 : 0)))
      ctx.fillText(name, margin, y)
      const right = `${qty} ${unit} • ${subtotal}`
      const wRight = ctx.measureText(right).width
      ctx.fillStyle = "#666"; ctx.fillText(right, bw - margin - wRight, y)
      ctx.fillStyle = "#111"
      y += 28
    }
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y + 6); ctx.lineTo(bw - margin, y + 6); ctx.stroke()
    y += 30

    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    ctx.fillText("Mão de obra", margin, y)
    ctx.fillText("Materiais", margin + 160, y)
    y += 24
    ctx.fillStyle = "#111"; ctx.font = "400 16px system-ui"
    ctx.fillText(currency(labor), margin, y)
    ctx.fillText(currency(materialsTotal), margin + 160, y)
    y += 26
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(bw - margin, y); ctx.stroke()
    y += 24

    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Checklist", margin, y)
    y += 22
    ctx.fillStyle = "#111"; ctx.font = "400 13px system-ui"
    if (checklist.length > 0) {
      for (const it of checklist) {
        const label = fit(String(it.label || it.key || "Item"), bw - margin * 2 - 80)
        const done = Boolean(it.done)
        const right = done ? "feito" : "pendente"
        const wRight = ctx.measureText(right).width
        ctx.fillText(label, margin, y)
        ctx.fillStyle = done ? "#10B981" : "#EF4444"; ctx.fillText(right, bw - margin - wRight, y)
        ctx.fillStyle = "#111"
        y += 26
      }
    } else {
      ctx.fillStyle = "#666"; ctx.fillText("Nenhum", margin, y)
      ctx.fillStyle = "#111"
      y += 26
    }
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(bw - margin, y); ctx.stroke()
    y += 24

    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Adubação", margin, y)
    y += 22
    ctx.fillStyle = "#111"; ctx.font = "400 13px system-ui"
    if (fertilization.length > 0) {
      for (const f of fertilization) {
        const prod = fit(String(f.product || "Produto"), bw - margin * 2 - 80)
        const right = `${String(f.dose || "")} ${String(f.area || "")}`
        const wRight = ctx.measureText(right).width
        ctx.fillText(prod, margin, y)
        ctx.fillStyle = "#666"; ctx.fillText(right, bw - margin - wRight, y)
        ctx.fillStyle = "#111"
        y += 26
      }
    } else {
      ctx.fillStyle = "#666"; ctx.fillText("Nenhuma", margin, y)
      ctx.fillStyle = "#111"
      y += 26
    }
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(bw - margin, y); ctx.stroke()
    y += 24

    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Pragas", margin, y)
    y += 22
    ctx.fillStyle = "#111"; ctx.font = "400 13px system-ui"
    if (pests.length > 0) {
      for (const p of pests) {
        const typ = fit(String(p.type || "Praga"), bw - margin * 2 - 80)
        const right = `${String(p.severity || "")} • ${String(p.treatment || "")}`
        const wRight = ctx.measureText(right).width
        ctx.fillText(typ, margin, y)
        ctx.fillStyle = "#666"; ctx.fillText(right, bw - margin - wRight, y)
        ctx.fillStyle = "#111"
        y += 26
      }
    } else {
      ctx.fillStyle = "#666"; ctx.fillText("Nenhuma", margin, y)
      ctx.fillStyle = "#111"
      y += 26
    }
    if (photos.length > 0) {
      ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(bw - margin, y); ctx.stroke()
      y += 16
      const size = 60
      let x = margin
      for (const url of photos.slice(0, 4)) {
        const img = new Image()
        img.src = url
        try {
          await new Promise((res) => { img.onload = () => res(null); img.onerror = () => res(null) })
          ctx.drawImage(img, x, y, size, size)
        } catch {}
        x += size + 8
      }
      y += size + 16
    }

    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(bw - margin, y); ctx.stroke()
    y += 24
    ctx.font = "600 14px system-ui"; ctx.fillStyle = "#666"; ctx.fillText("Cliente", margin, y)
    y += 20
    ctx.font = "400 13px system-ui"; ctx.fillStyle = "#111"
    if (client?.name) { ctx.fillText(String(client.name), margin, y); y += 16 }
    if (client?.phone) { ctx.fillText(String(client.phone), margin, y); y += 16 }
    if (client?.address) { for (const ln of addressLines) { ctx.fillText(ln, margin, y); y += 16 } }

    y += 12
    ctx.fillStyle = "#666"; ctx.font = "400 12px system-ui"
    const companyOnly = String(companyName || "Íris")
    const noteLabel = "Nota de manutenção"
    const shortId = String(execution?.id || "").slice(0, 8)
    const idTxt = `ID: ${shortId}`
    const combinedLeft = companyOnly ? `${companyOnly} • ${noteLabel}` : noteLabel
    ctx.fillText(combinedLeft, margin, y)
    const idWDraw = ctx.measureText(idTxt).width
    ctx.fillText(idTxt, bw - margin - idWDraw, y)
    y += 20

    return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
  }

  const handleDownloadImage = async () => {
    const blob = await buildImage()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nota-manutencao-${execution.id}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleShareImage = async () => {
    const blob = await buildImage()
    if (!blob) return
    const file = new File([blob], `nota-manutencao-${execution.id}.png`, { type: "image/png" })
    if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
      try { await (navigator as any).share({ files: [file], title: title }) } catch {}
      return
    }
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const buildNoteText = () => {
    const lines = [
      `Manutenção: ${title}`,
      description ? `Descrição: ${description}` : undefined,
      `Checklist:`,
      ...(checklist.length > 0 ? checklist.map((c: any) => `${String(c.label || c.key || "Item")} — ${Boolean(c.done) ? "feito" : "pendente"}${c.notes ? ` (${String(c.notes)})` : ""}`) : ["Nenhum"]),
      `Adubação:`,
      ...(fertilization.length > 0 ? fertilization.map((f: any) => `${String(f.product || "Produto")} — ${String(f.dose || "")} ${String(f.area || "")}`) : ["Nenhuma"]),
      `Pragas:`,
      ...(pests.length > 0 ? pests.map((p: any) => `${String(p.type || "Praga")} — ${String(p.severity || "")} • ${String(p.treatment || "")}`) : ["Nenhuma"]),
      `Materiais:`,
      ...(materials.length > 0 ? materials.map((m: any) => `${String(m.name || "Material")} — ${Number(m.quantity || 0)} ${String(m.unit || "un")} (${currency(Number(m.quantity || 0) * Number(m.unitCost || 0) * (1 + (markupPct > 0 ? markupPct / 100 : 0)))})`) : ["Nenhum"]),
      `Mão de obra: ${currency(labor)}`,
      `Materiais: ${currency(materialsTotal)}`,
      `Total: ${currency(total)}`,
      client ? `Cliente: ${client.name} | ${client.phone || ""} | ${client.address || ""}` : undefined,
    ].filter(Boolean)
    return lines.join("\n")
  }

  const handleShareText = async () => {
    const text = buildNoteText()
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title, text }) } catch {}
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, "_blank")
    }
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
          <div>
            <p className="text-sm text-muted-foreground">Checklist</p>
            <div className="space-y-1">
              {checklist.length > 0 ? (
                checklist.map((c: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{String(c.label || c.key || "Item")}</span>
                    <span className={Boolean(c.done) ? "text-green-600" : "text-destructive"}>{Boolean(c.done) ? "feito" : "pendente"}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Adubação</p>
            <div className="space-y-1">
              {fertilization.length > 0 ? (
                fertilization.map((f: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{String(f.product || "Produto")}</span>
                    <span className="text-muted-foreground">{String(f.dose || "")} {String(f.area || "")}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma adubação</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pragas</p>
            <div className="space-y-1">
              {pests.length > 0 ? (
                pests.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{String(p.type || "Praga")}</span>
                    <span className="text-muted-foreground">{String(p.severity || "")} • {String(p.treatment || "")}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma ocorrência</p>
              )}
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
          <Button variant="outline" className="gap-2" onClick={handleShareImage}><ImageIcon className="h-4 w-4" /> Enviar imagem</Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadImage}><Download className="h-4 w-4" /> Baixar imagem</Button>
          <Button variant="outline" className="gap-2" onClick={handleShareText}><Share2 className="h-4 w-4" /> Enviar texto</Button>
        </div>
      </CardContent>
    </Card>
  )
}

