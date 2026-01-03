"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X } from "lucide-react"

export function BrandForm() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, watermark_base64")
        .eq("id", user.id)
        .maybeSingle()
      setCompanyName(String((profile as any)?.company_name || ""))
      setPreviewUrl(((profile as any)?.watermark_base64 as string) || null)
      setLoading(false)
    })()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 4 * 1024 * 1024) { setError("Máximo 4MB"); return }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
      const payload: any = { company_name: companyName || null }
      if (watermark_base64) payload.watermark_base64 = watermark_base64
      const { error: upErr } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
      if (upErr) throw upErr
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Nome da empresa</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex.: VerdeVivo Jardinagem" />
          </div>
          <div className="grid gap-2">
            <Label>{"Marca d'água (imagem)"}</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {previewUrl && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Prévia" className="w-full h-40 object-contain rounded-lg border" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Button type="submit" disabled={loading}><Upload className="mr-2 h-4 w-4" />{loading ? "Salvando..." : "Salvar"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
