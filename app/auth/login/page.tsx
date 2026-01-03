"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signErr) throw signErr
      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err?.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      const supabase = createClient()
      const redirect = (process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`) as string
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect })
      if (resetErr) throw resetErr
      alert("Verifique seu email para redefinição de senha")
    } catch (err: any) {
      alert(err?.message || "Erro ao solicitar redefinição")
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <Button type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          </form>
          <div className="mt-3 flex items-center justify-between text-sm">
            <button type="button" className="text-primary" onClick={handleReset}>Esqueceu a senha?</button>
            <Link href="/auth/sign-up" className="text-primary">Criar conta</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

