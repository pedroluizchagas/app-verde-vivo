"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

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
      const msg = String(err?.message || "")
      const isNetwork = /Failed to fetch|NetworkError|TypeError/i.test(msg)
      const rawEnvUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const looksLocal = /localhost|127\.0\.0\.1/i.test(String(rawEnvUrl))
      const looksInsecure = /^http:\/\//i.test(String(rawEnvUrl)) && !looksLocal
      const friendly =
        looksLocal
          ? "Configuracao invalida do Supabase (URL local)."
          : looksInsecure
          ? "Configuracao do Supabase usa HTTP. Utilize HTTPS em producao."
          : isNetwork
          ? "Falha ao conectar ao servidor. Verifique sua conexao."
          : msg || "Email ou senha incorretos"
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) {
      setError("Digite seu email acima para receber o link de redefinicao.")
      return
    }
    setResetLoading(true)
    try {
      const supabase = createClient()
      const redirectTo =
        `${process.env.NEXT_PUBLIC_APP_URL || "https://verdevivo.vercel.app"}/auth/callback`
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetErr) throw resetErr
      setResetSent(true)
      setError(null)
    } catch (err: any) {
      setError(err?.message || "Erro ao solicitar redefinicao de senha")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex" style={{ background: "#070708", color: "#f0f0f0" }}>
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 65%)", filter: "blur(2px)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(15,138,65,0.08) 0%, transparent 65%)", filter: "blur(2px)" }}
        />
      </div>

      {/* ── Left panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/">
          <img src="/img/iris.png" alt="Iris" className="h-10 w-auto" />
        </Link>

        <div>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm mb-8"
            style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", color: "#4ade80" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Bem-vindo de volta
          </div>

          <p className="text-3xl font-bold leading-snug mb-5" style={{ color: "#f9fafb" }}>
            Continue de onde<br />parou com a Iris
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
            Acesse seus clientes, agenda, financeiro e o assistente Iris
            — tudo sincronizado e sempre disponivel.
          </p>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>
          &copy; 2026 Iris. Todos os direitos reservados.
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <img src="/img/iris.png" alt="Iris" className="h-10 w-auto mx-auto" />
          </Link>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f9fafb" }}>
              Entrar na sua conta
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              Digite seu email e senha para acessar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <AuthLabel>Email</AuthLabel>
              <AuthInput
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <AuthLabel>Senha</AuthLabel>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetLoading}
                  className="text-xs transition-colors hover:text-green-300 disabled:opacity-50"
                  style={{ color: "rgba(34,197,94,0.80)" }}
                >
                  {resetLoading ? "Enviando..." : "Esqueceu a senha?"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-30 pr-10"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#f9fafb",
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(34,197,94,0.50)" }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
              >
                {error}
              </div>
            )}

            {resetSent && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
              >
                Link de redefinicao enviado! Verifique seu email.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{
                background: "linear-gradient(90deg,#16a34a,#22c55e)",
                color: "#fff",
                boxShadow: "0 0 24px rgba(34,197,94,0.22)",
              }}
            >
              {loading ? "Entrando..." : (
                <>Entrar <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Nao tem uma conta?{" "}
            <Link href="/auth/sign-up" className="font-medium text-green-400 hover:text-green-300 transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function AuthLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
      {children}
    </label>
  )
}

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-30"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "#f9fafb",
      }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid rgba(34,197,94,0.50)"
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)"
        props.onBlur?.(e)
      }}
    />
  )
}
