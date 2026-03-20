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
import { User, Phone, Mail, MapPin, FileText, AlertCircle } from "lucide-react"

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

const AVATAR_COLORS = [
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-teal-500/15 text-teal-600 dark:text-teal-400",
]

function getAvatarColor(name: string) {
  if (!name.trim()) return "bg-muted text-muted-foreground"
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (!parts.length) return null
  return parts
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameValue, setNameValue] = useState(client?.name ?? "")

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

  const initials = getInitials(nameValue)
  const avatarColor = getAvatarColor(nameValue)

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        {/* Cabeçalho com preview do avatar */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${avatarColor}`}
          >
            {initials ? (
              <span className="text-base font-bold">{initials}</span>
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-semibold text-[15px] leading-tight">
              {nameValue.trim() || (client ? client.name : "Novo cliente")}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {client ? "Editando perfil do cliente" : "Preencha os dados abaixo"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Dados pessoais */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Dados pessoais
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome completo{" "}
                  <span className="text-destructive font-normal">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="João Silva"
                    required
                    defaultValue={client?.name}
                    className="h-9 pl-8 text-[13px]"
                    onChange={(e) => setNameValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefone{" "}
                  <span className="text-destructive font-normal">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    required
                    defaultValue={client?.phone}
                    className="h-9 pl-8 text-[13px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="joao@email.com"
                  defaultValue={client?.email || ""}
                  className="h-9 pl-8 text-[13px]"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="flex flex-col gap-3 pt-5 border-t border-border/60">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Localização
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="address" className="text-sm font-medium">
                Endereço{" "}
                <span className="text-destructive font-normal">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Rua, número, bairro, cidade"
                  required
                  defaultValue={client?.address}
                  className="min-h-[72px] resize-none pl-8 pt-2 text-[13px]"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-3 pt-5 border-t border-border/60">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Observações
            </p>
            <div className="relative">
              <FileText className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Textarea
                id="notes"
                name="notes"
                placeholder="Informações adicionais sobre o cliente ou jardim..."
                defaultValue={client?.notes || ""}
                className="min-h-[88px] resize-none pl-8 pt-2 text-[13px]"
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
              {isLoading ? "Salvando..." : client ? "Atualizar cliente" : "Criar cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
