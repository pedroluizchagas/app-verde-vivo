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

interface ClientFormProps {
  client?: {
    id: string
    name: string
    email: string | null
    phone: string
    address: string
    notes: string | null
  }
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    const clientData = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      notes: (formData.get("notes") as string) || null,
      gardener_id: user.id,
    }

    try {
      if (client) {
        const { error } = await supabase.from("clients").update(clientData).eq("id", client.id)

        if (error) throw error
        router.push(`/dashboard/clients/${client.id}`)
      } else {
        const { error } = await supabase.from("clients").insert([clientData])

        if (error) throw error
        router.push("/dashboard/clients")
      }
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao salvar cliente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="João Silva"
              required
              defaultValue={client?.name}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              required
              defaultValue={client?.phone}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="joao@email.com"
              defaultValue={client?.email || ""}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Endereço *</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Rua, número, bairro, cidade"
              required
              defaultValue={client?.address}
              className="min-h-20 resize-none"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Informações adicionais sobre o cliente ou jardim"
              defaultValue={client?.notes || ""}
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
              {isLoading ? "Salvando..." : client ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
