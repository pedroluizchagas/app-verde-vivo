"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AppointmentFormProps {
  clients: { id: string; name: string }[]
  services: { id: string; name: string }[]
  appointment?: {
    id: string
    title: string
    description: string | null
    client_id: string
    service_id: string | null
    scheduled_date: string
    duration_minutes: number
    status: string
  }
}

export function AppointmentForm({ clients, services, appointment }: AppointmentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState(appointment?.client_id || "")
  const [selectedService, setSelectedService] = useState(appointment?.service_id || "")
  const [status, setStatus] = useState(appointment?.status || "scheduled")

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

    if (!selectedClient) {
      setError("Selecione um cliente")
      setIsLoading(false)
      return
    }

    const dateStr = formData.get("date") as string
    const timeStr = formData.get("time") as string
    const scheduledDate = new Date(`${dateStr}T${timeStr}`)

    const appointmentData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      client_id: selectedClient,
      service_id: selectedService || null,
      scheduled_date: scheduledDate.toISOString(),
      duration_minutes: Number.parseInt(formData.get("duration") as string),
      status: status,
      labor_cost: formData.get("labor_cost") ? Number(formData.get("labor_cost")) : 0,
      gardener_id: user.id,
    }

    try {
      if (appointment) {
        const { error } = await supabase.from("appointments").update(appointmentData).eq("id", appointment.id)

        if (error) throw error
        router.push(`/dashboard/schedule/${appointment.id}`)
      } else {
        const { error } = await supabase.from("appointments").insert([appointmentData])

        if (error) throw error
        router.push("/dashboard/schedule")
      }
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao salvar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const defaultDate = appointment
    ? new Date(appointment.scheduled_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0]

  const defaultTime = appointment ? new Date(appointment.scheduled_date).toTimeString().slice(0, 5) : "09:00"

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Manutenção do jardim"
              required
              defaultValue={appointment?.title}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient} required>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service">Serviço</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione um serviço (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {services.length > 0 ? (
                  services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-muted-foreground">Nenhum serviço cadastrado</div>
                )}
              </SelectContent>
            </Select>
            {services.length === 0 && (
              <div className="text-xs text-muted-foreground">Cadastre um serviço em <a href="/dashboard/services/new" className="text-primary hover:underline">Serviços</a></div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" name="date" type="date" required defaultValue={defaultDate} className="h-11" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Hora *</Label>
              <Input id="time" name="time" type="time" required defaultValue={defaultTime} className="h-11" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duração (minutos) *</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="15"
              step="15"
              placeholder="60"
              required
              defaultValue={appointment?.duration_minutes || 60}
              className="h-11"
            />
          </div>

          {appointment && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11">
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

          <div className="grid gap-2">
            <Label htmlFor="labor_cost">Mão de obra (R$)</Label>
            <Input
              id="labor_cost"
              name="labor_cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue={typeof (appointment as any)?.labor_cost === "number" ? (appointment as any).labor_cost : 0}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalhes sobre o serviço a ser realizado"
              defaultValue={appointment?.description || ""}
              className="min-h-24 resize-none"
            />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : appointment ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
