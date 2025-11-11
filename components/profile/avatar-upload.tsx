"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

export function AvatarUpload() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("Usuário não autenticado")
      setIsLoading(false)
      return
    }

    try {
      const reader = new FileReader()
      reader.readAsDataURL(selectedFile)
      reader.onload = async () => {
        const base64 = reader.result as string
        const { error: upErr } = await supabase
          .from("profiles")
          .update({ avatar_url: base64 })
          .eq("id", user.id)
        if (upErr) throw upErr
        router.refresh()
        setSelectedFile(null)
        setPreviewUrl(null)
      }
      reader.onerror = () => {
        throw new Error("Erro ao processar imagem")
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar avatar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="avatar">Foto de perfil</Label>
            <div className="flex flex-col gap-3">
              <Input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="h-11" />
              {previewUrl && (
                <div className="relative">
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview"
                       className="w-32 h-32 object-cover rounded-full border" />
                  <Button type="button" variant="destructive" size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" disabled={isLoading || !selectedFile}>
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? "Enviando..." : "Salvar avatar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}