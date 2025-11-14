"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function MaintenancePlanForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [clientId, setClientId] = useState<string>("")
  const [serviceId, setServiceId] = useState<string>("")
  const [defaultLabor, setDefaultLabor] = useState<number | "">("")
  const [markup, setMarkup] = useState<number | "">("")
  const [weekday, setWeekday] = useState<string>("")
  const [weekOfMonth, setWeekOfMonth] = useState<string>("")
  const [windowDays, setWindowDays] = useState<number>(7)
  const [billingDay, setBillingDay] = useState<string>("")
  const [status, setStatus] = useState<"active" | "paused">("active")
  const [description, setDescription] = useState<string>("")

  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])

  useState(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: cs } = await supabase.from("clients").select("id, name").eq("gardener_id", user.id).order("name")
        const { data: ss } = await supabase.from("services").select("id, name").eq("gardener_id", user.id).order("name")
        setClients(cs || [])
        setServices(ss || [])
      } catch {}
    })()
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      if (!title || !clientId) throw new Error("Preencha título e cliente")
      const payload: any = {
        gardener_id: user.id,
        client_id: clientId,
        service_id: serviceId && serviceId !== "none" ? serviceId : null,
        title,
        default_description: description || null,
        default_labor_cost: typeof defaultLabor === "number" ? defaultLabor : 0,
        materials_markup_pct: typeof markup === "number" ? markup : 0,
        preferred_weekday: weekday && weekday !== "none" ? Number(weekday) : null,
        preferred_week_of_month: weekOfMonth && weekOfMonth !== "none" ? Number(weekOfMonth) : null,
        window_days: windowDays,
        billing_day: billingDay ? Number(billingDay) : null,
        status,
      }
      const { error: insertError } = await supabase.from("maintenance_plans").insert(payload)
      if (insertError) throw insertError
      router.push("/dashboard/maintenance")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao criar plano")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Manutenção mensal jardim da Ana" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={(v) => setClientId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serviço (opcional)</Label>
              <Select value={serviceId} onValueChange={(v) => setServiceId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {services.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Mão de obra padrão (R$)</Label>
              <Input type="number" step="0.01" min="0" value={defaultLabor} onChange={(e) => setDefaultLabor(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div>
              <Label>Markup materiais (%)</Label>
              <Input type="number" step="0.01" min="0" value={markup} onChange={(e) => setMarkup(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div>
              <Label>Janela (dias)</Label>
              <Input type="number" min="1" value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Dia preferido da semana</Label>
              <Select value={weekday} onValueChange={(v) => setWeekday(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="1">Segunda</SelectItem>
                  <SelectItem value="2">Terça</SelectItem>
                  <SelectItem value="3">Quarta</SelectItem>
                  <SelectItem value="4">Quinta</SelectItem>
                  <SelectItem value="5">Sexta</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                  <SelectItem value="0">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semana do mês</Label>
              <Select value={weekOfMonth} onValueChange={(v) => setWeekOfMonth(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="1">1ª</SelectItem>
                  <SelectItem value="2">2ª</SelectItem>
                  <SelectItem value="3">3ª</SelectItem>
                  <SelectItem value="4">4ª</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dia de cobrança</Label>
              <Input type="number" min="1" max="31" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Descrição padrão</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição padrão do serviço" rows={5} />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? "Salvando..." : "Criar plano"}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}