"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Image as ImageIcon, Download } from "lucide-react"

export function MaintenanceProgressNote({ executions, client, companyName, watermarkBase64 }: { executions: any[]; client?: any; companyName?: string; watermarkBase64?: string }) {
  const [months, setMonths] = useState<number>(6)
  const now = useMemo(() => new Date(), [])
  const start = useMemo(() => new Date(now.getFullYear(), now.getMonth() - months, now.getDate()), [now, months])

  const data = useMemo(() => {
    const periodExecs = (executions || []).filter((e) => new Date(String(e.created_at)) >= start && String(e.status) === "done")
    let totalExec = 0
    let totalFert = 0
    let totalPests = 0
    const checklistAgg: Record<string, { done: number; total: number }> = {}
    for (const e of periodExecs) {
      totalExec += 1
      const details = (e as any).details || {}
      const fert = Array.isArray(details?.fertilization) ? details.fertilization : []
      totalFert += fert.length
      const pest = Array.isArray(details?.pests) ? details.pests : []
      totalPests += pest.length
      const cl = Array.isArray(details?.checklist) ? details.checklist : []
      for (const c of cl) {
        const k = String(c.label || c.key || "Item")
        const agg = checklistAgg[k] || { done: 0, total: 0 }
        agg.total += 1
        if (Boolean(c.done)) agg.done += 1
        checklistAgg[k] = agg
      }
    }
    const checklistSummary = Object.keys(checklistAgg).map((k) => ({ label: k, pct: checklistAgg[k].total > 0 ? Math.round((checklistAgg[k].done / checklistAgg[k].total) * 100) : 0 }))
    return { totalExec, totalFert, totalPests, checklistSummary }
  }, [executions, start])

  const buildImage = async () => {
    const bw = 360
    const scale = 3
    const margin = 24
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
    const checklistH = Math.max(1, (data.checklistSummary || []).length) * 24 + 52
    const headerH = 120
    const clientNameLines = client?.name ? wrap(String(client.name), bw - margin * 2) : []
    const addressLines = client?.address ? wrap(String(client.address), bw - margin * 2) : []
    const footerH = 54 + 24
    const bh = headerH + 140 + checklistH + 54 + clientNameLines.length * 16 + addressLines.length * 16 + footerH
    const canvas = document.createElement("canvas")
    canvas.width = bw * scale
    canvas.height = Math.ceil(bh * scale)
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    ctx.scale(scale, scale)
    ctx.imageSmoothingEnabled = true
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, bw, bh)
    ctx.fillStyle = "#111"
    ctx.font = "700 26px system-ui"
    ctx.fillText(`Progresso ${months} meses`, margin, 48)
    ctx.font = "400 12px system-ui"
    ctx.fillStyle = "#666"
    const dateStr = `${String(start.toLocaleDateString("pt-BR"))} – ${String(now.toLocaleDateString("pt-BR"))}`
    ctx.fillText(dateStr, margin, 68)
    const logo = new Image()
    logo.src = watermarkBase64 || "/img/irislogo.png"
    await new Promise((res) => { logo.onload = () => res(null); logo.onerror = () => res(null) })
    try { ctx.drawImage(logo, bw - margin - 36, margin, 36, 36) } catch {}
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, headerH); ctx.lineTo(bw - margin, headerH); ctx.stroke()

    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"
    ctx.fillText("Executões", margin, headerH + 26)
    ctx.fillText("Adubações", margin + 110, headerH + 26)
    ctx.fillText("Pragas", margin + 220, headerH + 26)
    ctx.fillStyle = "#111"; ctx.font = "600 20px system-ui"
    ctx.fillText(String(data.totalExec), margin, headerH + 52)
    ctx.fillText(String(data.totalFert), margin + 110, headerH + 52)
    ctx.fillText(String(data.totalPests), margin + 220, headerH + 52)

    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, headerH + 72); ctx.lineTo(bw - margin, headerH + 72); ctx.stroke()
    let y = headerH + 100
    ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Checklist", margin, y)
    y += 22
    ctx.fillStyle = "#111"; ctx.font = "400 13px system-ui"
    const list = (data.checklistSummary || []).length > 0 ? data.checklistSummary : [{ label: "Nenhum", pct: 0 }]
    for (const it of list) {
      const label = String((it as any).label)
      const pct = `${String((it as any).pct)}%`
      ctx.fillText(label, margin, y)
      const wRight = ctx.measureText(pct).width
      ctx.fillStyle = "#666"; ctx.fillText(pct, bw - margin - wRight, y)
      ctx.fillStyle = "#111"
      y += 24
    }
    ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, y + 6); ctx.lineTo(bw - margin, y + 6); ctx.stroke()
    y += 30

    ctx.font = "600 14px system-ui"; ctx.fillStyle = "#666"; ctx.fillText("Cliente", margin, y)
    y += 20
    ctx.font = "400 13px system-ui"; ctx.fillStyle = "#111"
    if (client?.name) { ctx.fillText(String(client.name), margin, y); y += 16 }
    if (client?.phone) { ctx.fillText(String(client.phone), margin, y); y += 16 }
    if (client?.address) { for (const ln of addressLines) { ctx.fillText(ln, margin, y); y += 16 } }
    y += 12
    ctx.fillStyle = "#666"; ctx.font = "400 12px system-ui"
    const companyOnly = String(companyName || "Íris")
    const noteLabel = "Progresso de manutenção"
    const combinedLeft = companyOnly ? `${companyOnly} • ${noteLabel}` : noteLabel
    ctx.fillText(combinedLeft, margin, y)
    y += 20
    return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
  }

  const handleDownloadImage = async () => {
    const blob = await buildImage()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `progresso-manutencao-${months}m.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleShareImage = async () => {
    const blob = await buildImage()
    if (!blob) return
    const file = new File([blob], `progresso-manutencao-${months}m.png`, { type: "image/png" })
    if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
      try { await (navigator as any).share({ files: [file], title: `Progresso ${months} meses` }) } catch {}
      return
    }
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Progresso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Button variant={months === 6 ? "default" : "outline"} onClick={() => setMonths(6)}>Últimos 6 meses</Button>
          <Button variant={months === 12 ? "default" : "outline"} onClick={() => setMonths(12)}>Últimos 12 meses</Button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Execuções</p>
            <p className="text-lg font-semibold">{data.totalExec}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Adubações</p>
            <p className="text-lg font-semibold">{data.totalFert}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Pragas</p>
            <p className="text-lg font-semibold">{data.totalPests}</p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground mb-1">Checklist</p>
          <div className="grid gap-2">
            {(data.checklistSummary || []).length > 0 ? (
              (data.checklistSummary || []).map((it) => (
                <div key={it.label} className="flex items-center justify-between text-sm">
                  <span>{it.label}</span>
                  <span className="text-muted-foreground">{it.pct}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleShareImage}><ImageIcon className="h-4 w-4" /> Enviar imagem</Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadImage}><Download className="h-4 w-4" /> Baixar imagem</Button>
        </div>
      </CardContent>
    </Card>
  )
}
