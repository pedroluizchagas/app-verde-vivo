"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

function stripMask(value: string): string {
  return value.replace(/\D/g, "")
}

export function CpfCnpjForm() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [value, setValue] = useState("")

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase
        .from("profiles")
        .select("cpf_cnpj")
        .eq("id", user.id)
        .maybeSingle()
      const raw = (profile as any)?.cpf_cnpj ?? ""
      setValue(raw ? formatCpfCnpj(raw) : "")
      setLoading(false)
    })()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = stripMask(e.target.value)
    if (digits.length > 14) return
    setValue(formatCpfCnpj(digits))
    setSuccess(false)
    setError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const digits = stripMask(value)
    if (digits.length !== 11 && digits.length !== 14) {
      setError("Informe um CPF (11 digitos) ou CNPJ (14 digitos) valido.")
      return
    }
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Nao autenticado")
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ cpf_cnpj: digits })
        .eq("id", user.id)
      if (upErr) throw upErr
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cpf-cnpj" className="text-[12px] font-medium">
          CPF ou CNPJ
        </Label>
        <Input
          id="cpf-cnpj"
          value={value}
          onChange={handleChange}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className="h-11"
          disabled={loading}
          inputMode="numeric"
        />
        <p className="text-[11px] text-muted-foreground">
          Obrigatorio para processar pagamentos via Asaas.
        </p>
      </div>

      {error && (
        <p className="text-[12px] text-destructive">{error}</p>
      )}
      {success && (
        <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
          CPF/CNPJ salvo com sucesso.
        </p>
      )}

      <Button type="submit" disabled={saving || loading}>
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
