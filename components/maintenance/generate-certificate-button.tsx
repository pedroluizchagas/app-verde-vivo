"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon } from "lucide-react"

export function GenerateMaintenanceCertificateButton({ planId }: { planId: string }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const shareLatest = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const { data: plan } = await supabase
        .from("maintenance_plans")
        .select("title, client:clients(name, phone, address)")
        .eq("id", planId)
        .maybeSingle()
      const { data: execs } = await supabase
        .from("plan_executions")
        .select("id, status, details, final_amount, created_at")
        .eq("plan_id", planId)
        .order("created_at", { ascending: false })
        .limit(5)
      const latest = (execs || []).find((e: any) => String(e.status) === "done") || (execs || [])[0]
      if (!latest) throw new Error("Sem execução para gerar comprovante")
      const build = await import("./service-note-rich")
      const node = document.createElement("div")
      document.body.appendChild(node)
      const { MaintenanceServiceNoteRich } = build as any
      const tmp = document.createElement("div")
      tmp.id = `tmp-cert-${latest.id}`
      document.body.appendChild(tmp)
      const canvasBlob = await (async () => {
        const details = (latest as any).details || {}
        const labor = Number(details?.labor ?? 0)
        const materials: any[] = Array.isArray(details?.materials) ? details.materials : []
        const markupPct = Number(details?.markupPct ?? 0)
        const materialsTotalRaw = materials.reduce((sum, m: any) => sum + Number(m.quantity || 0) * Number(m.unitCost || 0), 0)
        const materialsTotal = Number((materialsTotalRaw * (1 + (markupPct > 0 ? markupPct / 100 : 0))).toFixed(2))
        const total = Number((typeof latest.final_amount === "number" ? latest.final_amount : labor + materialsTotal).toFixed(2))
        const dateStr = new Date(String(latest.created_at || Date.now())).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        const bw = 360, scale = 3, margin = 24
        const canvas = document.createElement("canvas")
        canvas.width = bw * scale
        canvas.height = 600 * scale
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
        ctx.scale(scale, scale)
        ctx.fillStyle = "#fff"; ctx.fillRect(0,0,bw,600)
        ctx.fillStyle = "#111"; ctx.font = "700 26px system-ui"; ctx.fillText("Comprovante de manutenção", margin, 48)
        ctx.font = "400 12px system-ui"; ctx.fillStyle = "#666"; ctx.fillText(dateStr, margin, 68)
        ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, 88); ctx.lineTo(bw - margin, 88); ctx.stroke()
        ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Cliente", margin, 110)
        ctx.fillStyle = "#111"; ctx.font = "400 14px system-ui"; ctx.fillText(String(Array.isArray((plan as any).client) ? ((plan as any).client[0]?.name ?? "") : ((plan as any).client?.name ?? "")), margin, 130)
        ctx.strokeStyle = "#e9e9e9"; ctx.beginPath(); ctx.moveTo(margin, 150); ctx.lineTo(bw - margin, 150); ctx.stroke()
        ctx.fillStyle = "#666"; ctx.font = "500 13px system-ui"; ctx.fillText("Valores", margin, 174)
        ctx.fillStyle = "#111"; ctx.font = "400 16px system-ui"; ctx.fillText(`Total: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}`, margin, 198)
        return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
      })()
      if (!canvasBlob) throw new Error("Falha ao gerar imagem")
      const file = new File([canvasBlob], `comprovante-${latest.id}.png`, { type: "image/png" })
      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        try { await (navigator as any).share({ files: [file], title: "Comprovante de manutenção" }) } catch {}
      } else {
        const url = URL.createObjectURL(canvasBlob)
        window.open(url, "_blank")
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
      setMsg("Comprovante gerado")
    } catch (err: any) {
      setMsg(err?.message || "Falha ao gerar comprovante")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center">
      <Button className="gap-2" disabled={loading} onClick={shareLatest}><ImageIcon className="h-4 w-4" /> Gerar Comprovante</Button>
      {msg && <span className="ml-2 text-xs text-muted-foreground">{msg}</span>}
    </div>
  )
}

