"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

interface AppointmentFormProps {
  clients: { id: string; name: string }[]
  orders?: { id: string; title: string }[]
  appointment?: {
    id: string
    title: string
    description: string | null
    client_id: string
    scheduled_date: string
    end_date?: string | null
    duration_minutes: number
    status: string
  }
}

export function AppointmentForm({ clients, orders, appointment }: AppointmentFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const planIdFromQuery = searchParams?.get("planId") || null
  const titleFromQuery = searchParams?.get("title") || null
  const dateFromQuery = searchParams?.get("date") || null
  const startFromQuery = searchParams?.get("start") || null
  const endFromQuery = searchParams?.get("end") || null
  const allDayFromQuery = searchParams?.get("allDay") || null

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState(appointment?.client_id || "")
  const [selectedOrder, setSelectedOrder] = useState("")
  const [status, setStatus] = useState(appointment?.status || "scheduled")
  const [type, setType] = useState((appointment as any)?.type || "service")
  const [location, setLocation] = useState((appointment as any)?.location || "")
  const [allDay, setAllDay] = useState(
    Boolean((appointment as any)?.all_day) || Boolean(allDayFromQuery)
  )

  useEffect(() => {
    if (!planIdFromQuery) return
    const supabase = createClient()
    supabase
      .from("maintenance_plans")
      .select("client_id, client:clients(id, address)")
      .eq("id", planIdFromQuery)
      .maybeSingle()
      .then(({ data: plan }) => {
        if (!plan) return
        const cid = Array.isArray((plan as any)?.client)
          ? ((plan as any)?.client[0]?.id ?? (plan as any)?.client_id ?? "")
          : ((plan as any)?.client_id ?? (plan as any)?.client?.id ?? "")
        if (cid) setSelectedClient(String(cid))
        const addr = Array.isArray((plan as any)?.client)
          ? ((plan as any)?.client[0]?.address ?? "")
          : ((plan as any)?.client?.address ?? "")
        if (!location && addr) setLocation(String(addr))
      })
  }, [planIdFromQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("Usuário não autenticado")
      setIsLoading(false)
      return
    }

    const dateStr = formData.get("date") as string
    const startStr = formData.get("start_time") as string
    const endStr = formData.get("end_time") as string
    const startDate = new Date(`${dateStr}T${allDay ? "00:00" : startStr || "00:00"}`)
    const endDate = new Date(`${dateStr}T${allDay ? "23:59" : endStr || "23:59"}`)

    const appointmentData: any = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      client_id: selectedClient || null,
      scheduled_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      duration_minutes: allDay
        ? 0
        : Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000)),
      status,
      type,
      location: location || null,
      all_day: allDay,
      gardener_id: user.id,
    }

    try {
      let createdId = appointment?.id
      if (appointment) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointment.id)
        if (error) throw error
      } else {
        const { data: inserted, error } = await supabase
          .from("appointments")
          .insert([appointmentData])
          .select("id")
          .single()
        if (error) throw error
        createdId = inserted?.id
      }

      if (selectedOrder && createdId) {
        await supabase
          .from("service_orders")
          .update({ appointment_id: createdId })
          .eq("id", selectedOrder)
      }

      router.push(
        appointment ? `/dashboard/schedule/${appointment.id}` : "/dashboard/schedule"
      )
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao salvar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const defaultDate = appointment
    ? new Date(appointment.scheduled_date).toISOString().split("T")[0]
    : dateFromQuery || new Date().toISOString().split("T")[0]

  const defaultStart = appointment
    ? new Date(appointment.scheduled_date).toTimeString().slice(0, 5)
    : startFromQuery || "09:00"

  const defaultEnd = appointment?.end_date
    ? new Date(appointment.end_date).toTimeString().slice(0, 5)
    : endFromQuery || "10:00"

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Identificação */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Identificação
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Título <span className="text-destructive font-normal">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Manutenção do jardim"
                  required
                  defaultValue={appointment?.title ?? titleFromQuery ?? undefined}
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="type" className="text-sm font-medium">
                  Tipo <span className="text-destructive font-normal">*</span>
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Serviço</SelectItem>
                    <SelectItem value="technical_visit">Visita técnica</SelectItem>
                    <SelectItem value="training">Treinamento</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Data e horário */}
          <div className="flex flex-col gap-3 pt-5 border-t border-border/60">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Data e horário
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="all_day"
                  name="all_day"
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-primary"
                />
                <span className="text-[12px] text-muted-foreground select-none">
                  Dia inteiro
                </span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="date" className="text-sm font-medium">
                  Data <span className="text-destructive font-normal">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={defaultDate}
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="start_time" className="text-sm font-medium">
                  Início
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required={!allDay}
                  defaultValue={defaultStart}
                  disabled={allDay}
                  className="h-9 text-[13px] disabled:opacity-40"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="end_time" className="text-sm font-medium">
                  Término
                </Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  required={!allDay}
                  defaultValue={defaultEnd}
                  disabled={allDay}
                  className="h-9 text-[13px] disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="flex flex-col gap-3 pt-5 border-t border-border/60">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Detalhes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="client" className="text-sm font-medium">
                  Cliente
                </Label>
                <Select
                  value={selectedClient}
                  onValueChange={(v) => setSelectedClient(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="location" className="text-sm font-medium">
                  Local
                </Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder={
                    selectedClient
                      ? "Endereço do cliente (padrão)"
                      : "Local do compromisso"
                  }
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9 text-[13px]"
                />
              </div>
            </div>

            {Array.isArray(orders) && orders.length > 0 && (
              <div className="grid gap-1.5">
                <Label htmlFor="order" className="text-sm font-medium">
                  Ordem de serviço
                </Label>
                <Select
                  value={selectedOrder}
                  onValueChange={(v) => setSelectedOrder(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Vincular uma OS (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem OS</SelectItem>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Status (somente edição) + Descrição */}
          <div className="flex flex-col gap-3 pt-5 border-t border-border/60">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Observações
            </p>

            {appointment && (
              <div className="grid gap-1.5">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detalhes sobre o serviço a ser realizado..."
                defaultValue={appointment?.description || ""}
                className="min-h-[80px] resize-none text-[13px]"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Salvando..."
                : appointment
                ? "Atualizar agendamento"
                : "Criar agendamento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
