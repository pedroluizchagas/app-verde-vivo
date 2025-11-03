"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Upload, X } from "lucide-react"

interface PhotoUploadProps {
  clientId: string
  appointmentId?: string
}

export function PhotoUpload({ clientId, appointmentId }: PhotoUploadProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoType, setPhotoType] = useState<string>("general")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Arquivo muito grande. Máximo 5MB.")
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) {
      setError("Selecione uma foto")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Usuário não autenticado")
      setIsLoading(false)
      return
    }

    try {
      // Convert to base64 for simple storage
      const reader = new FileReader()
      reader.readAsDataURL(selectedFile)
      reader.onload = async () => {
        const base64 = reader.result as string

        const formData = new FormData(e.currentTarget)
        const caption = formData.get("caption") as string

        const { error: insertError } = await supabase.from("photos").insert([
          {
            gardener_id: user.id,
            client_id: clientId,
            appointment_id: appointmentId || null,
            url: base64,
            type: photoType,
            caption: caption || null,
          },
        ])

        if (insertError) throw insertError

        router.refresh()
        setSelectedFile(null)
        setPreviewUrl(null)
        setPhotoType("general")
        ;(e.target as HTMLFormElement).reset()
      }

      reader.onerror = () => {
        throw new Error("Erro ao processar imagem")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer upload")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="photo">Foto *</Label>
            <div className="flex flex-col gap-3">
              <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} className="h-11" required />
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={photoType} onValueChange={setPhotoType} required>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Antes</SelectItem>
                <SelectItem value="after">Depois</SelectItem>
                <SelectItem value="general">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="caption">Legenda</Label>
            <Input id="caption" name="caption" type="text" placeholder="Descrição da foto" className="h-11" />
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" disabled={isLoading || !selectedFile}>
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? "Enviando..." : "Enviar foto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
