"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

type WatermarkFit = "contain" | "cover"

export function BrandForm() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [companySubtitle, setCompanySubtitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [watermarkRemoved, setWatermarkRemoved] = useState(false)
  const [watermarkFit, setWatermarkFit] = useState<WatermarkFit>("contain")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, company_subtitle, watermark_base64, watermark_fit")
        .eq("id", user.id)
        .maybeSingle()
      setCompanyName(String((profile as any)?.company_name || ""))
      setCompanySubtitle(String((profile as any)?.company_subtitle || ""))
      setPreviewUrl(((profile as any)?.watermark_base64 as string) || null)
      setWatermarkFit(((profile as any)?.watermark_fit as WatermarkFit) || "contain")
      setLoading(false)
    })()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Máximo 4MB")
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setWatermarkRemoved(false)
      setError(null)
      setSuccess(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      let watermark_base64: string | null = null
      if (selectedFile) {
        const reader = new FileReader()
        const asPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error("Erro ao ler imagem"))
        })
        reader.readAsDataURL(selectedFile)
        watermark_base64 = await asPromise
      }

      const payload: any = {
        company_name: companyName.trim() || null,
        company_subtitle: companySubtitle.trim() || null,
        watermark_fit: watermarkFit,
      }
      if (watermark_base64) {
        payload.watermark_base64 = watermark_base64
      } else if (watermarkRemoved) {
        payload.watermark_base64 = null
      }

      const { error: upErr } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
      if (upErr) throw upErr
      setSuccess(true)
      setSelectedFile(null)
      setWatermarkRemoved(false)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      {/* Nome da empresa */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company-name" className="text-[12px] font-medium">
          Nome da empresa
        </Label>
        <Input
          id="company-name"
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value)
            setSuccess(false)
          }}
          placeholder="Ex.: VerdeVivo"
          className="h-11"
          disabled={loading}
        />
      </div>

      {/* Subtítulo */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company-subtitle" className="text-[12px] font-medium">
          Subtítulo{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="company-subtitle"
          value={companySubtitle}
          onChange={(e) => {
            setCompanySubtitle(e.target.value)
            setSuccess(false)
          }}
          placeholder="Ex.: Jardinagem & Paisagismo"
          className="h-11"
          disabled={loading}
        />
        <p className="text-[11px] text-muted-foreground">
          Aparece abaixo do nome na barra lateral e nos comprovantes gerados.
        </p>
      </div>

      {/* Marca d'água */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium">
          Ícone / marca d&apos;água{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <div className="flex flex-col gap-3">
            <div className="relative rounded-xl border border-border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Prévia do ícone"
                className={cn(
                  "w-full h-36 bg-muted/30 p-2",
                  watermarkFit === "cover" ? "object-cover" : "object-contain"
                )}
              />
              <button
                type="button"
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/90 flex items-center justify-center hover:bg-destructive transition-colors"
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setWatermarkRemoved(true)
                }}
              >
                <X className="h-3 w-3 text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-white/90 hover:text-white transition-colors"
                >
                  Clique para trocar
                </button>
              </div>
            </div>

            {/* Opcoes de ajuste + preview circular */}
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-medium">Ajuste no ícone da sidebar</p>
              <div className="flex items-center gap-3">
                {/* Preview circular */}
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview sidebar"
                    className={cn(
                      "h-full w-full p-0.5",
                      watermarkFit === "cover" ? "object-cover" : "object-contain"
                    )}
                  />
                </div>
                {/* Botoes de escolha */}
                <div className="flex gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setWatermarkFit("contain")}
                    className={cn(
                      "flex-1 text-[11px] rounded-lg border px-3 py-2 transition-all text-left",
                      watermarkFit === "contain"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span className="font-semibold block">Ajustar</span>
                    <span className="text-[10px] opacity-70">Imagem inteira visível</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatermarkFit("cover")}
                    className={cn(
                      "flex-1 text-[11px] rounded-lg border px-3 py-2 transition-all text-left",
                      watermarkFit === "cover"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span className="font-semibold block">Preencher</span>
                    <span className="text-[10px] opacity-70">Ocupa todo o espaço</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all",
              "border-border hover:border-primary/40 hover:bg-accent/30"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              PNG com fundo transparente, até 4MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-destructive">{error}</p>
      )}
      {success && (
        <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
          Informações salvas com sucesso.
        </p>
      )}

      <Button type="submit" disabled={saving || loading} className="gap-2">
        <Upload className="h-4 w-4" />
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
