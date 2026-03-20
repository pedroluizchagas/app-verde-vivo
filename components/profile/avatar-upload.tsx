"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, X, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

export function AvatarUpload() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setSuccess(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Arquivo muito grande. Máximo 5MB.")
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
      setSuccess(false)
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
    setSuccess(false)

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
      const reader = new FileReader()
      reader.readAsDataURL(selectedFile)
      reader.onload = async () => {
        const base64 = reader.result as string
        const { error: upErr } = await supabase
          .from("profiles")
          .update({ avatar_url: base64 })
          .eq("id", user.id)
        if (upErr) throw upErr
        setSuccess(true)
        setSelectedFile(null)
        setPreviewUrl(null)
        router.refresh()
        setIsLoading(false)
      }
      reader.onerror = () => {
        throw new Error("Erro ao processar imagem")
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar foto")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Zona de upload */}
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none",
          previewUrl
            ? "h-44 border-primary/30 bg-primary/5"
            : "h-32 border-border hover:border-primary/40 hover:bg-accent/30"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Prévia"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shadow-sm"
            />
            <p className="text-[11px] text-primary font-medium">
              Clique para trocar
            </p>
            <button
              type="button"
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/90 flex items-center justify-center hover:bg-destructive transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
                setPreviewUrl(null)
              }}
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </>
        ) : (
          <>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-medium text-muted-foreground">
                Clique ou arraste uma imagem
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                JPG, PNG até 5MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-destructive">{error}</p>
      )}
      {success && (
        <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
          Foto atualizada com sucesso.
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || !selectedFile}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {isLoading ? "Enviando..." : "Salvar foto"}
      </Button>
    </form>
  )
}
