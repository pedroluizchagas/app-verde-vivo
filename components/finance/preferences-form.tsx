"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function PreferencesForm({ initial }: { initial?: { credit_card_due_day?: number | null; default_pending_days?: number | null; default_product_margin_pct?: number | null } }) {
  const supabase = createClient()
  const [creditDue, setCreditDue] = useState<number | "">(initial?.credit_card_due_day ?? "")
  const [pendingDays, setPendingDays] = useState<number>(initial?.default_pending_days ?? 7)
  const [productMargin, setProductMargin] = useState<number>(initial?.default_product_margin_pct ?? 0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => { setMessage(null) }, [creditDue, pendingDays, productMargin])

  const savePrefs = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const payload: any = {
        gardener_id: user.id,
        credit_card_due_day: creditDue === "" ? null : Number(creditDue),
        default_pending_days: Number(pendingDays),
        default_product_margin_pct: Number(productMargin),
      }
      const { error } = await supabase.from("user_preferences").upsert(payload)
      if (error) throw error
      setMessage("Preferências salvas com sucesso")
    } catch (e: any) {
      setMessage(e?.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <div>
          <Label>Dia de vencimento do cartão (1–31)</Label>
          <Input type="number" min={1} max={31} value={creditDue === "" ? "" : creditDue} onChange={(e) => {
            const v = e.target.value
            setCreditDue(v === "" ? "" : Math.max(1, Math.min(31, Number(v))))
          }} placeholder="Ex.: 15" />
          <p className="text-xs text-muted-foreground mt-1">Usado para despesas no crédito (definimos o vencimento automaticamente).</p>
        </div>
        <div>
          <Label>Dias padrão para pendências</Label>
          <Input type="number" min={0} value={pendingDays} onChange={(e) => setPendingDays(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground mt-1">Usado para despesas pendentes quando não há outro vencimento indicado.</p>
        </div>
        <div>
          <Label>Margem de lucro padrão (%)</Label>
          <Input type="number" min={0} step={0.1} value={productMargin} onChange={(e) => setProductMargin(Number(e.target.value))} placeholder="Ex.: 20" />
          <p className="text-xs text-muted-foreground mt-1">Aplicada automaticamente ao preço dos materiais em serviços e orçamentos. Não é exibida ao cliente como margem separada.</p>
        </div>
        {message && <div className="rounded-md bg-muted p-2 text-sm">{message}</div>}
        <div className="flex gap-2">
          <Button onClick={savePrefs} disabled={saving}>{saving ? "Salvando..." : "Salvar preferências"}</Button>
        </div>
      </CardContent>
    </Card>
  )
}