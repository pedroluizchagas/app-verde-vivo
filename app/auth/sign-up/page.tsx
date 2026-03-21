"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react"

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("As senhas nao coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${process.env.NEXT_PUBLIC_APP_URL || "https://verdevivo.app"}/dashboard`,
          data: {
            full_name: fullName,
            phone: phone,
            role: "gardener",
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
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
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 65%)", filter: "blur(2px)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(15,138,65,0.08) 0%, transparent 65%)", filter: "blur(2px)" }}
        />
      </div>

      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/">
          <img src="/img/iris.png" alt="Iris" className="h-10 w-auto" />
        </Link>

        <div>
          <p
            className="text-3xl font-bold leading-tight mb-8"
            style={{ color: "#f9fafb" }}
          >
            Gerencie seu negocio<br />de jardinagem com<br />
            <span style={{ background: "linear-gradient(90deg,#16a34a,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              inteligencia artificial
            </span>
          </p>

          <ul className="space-y-4">
            {[
              "Clientes, agenda e financeiro em um so lugar",
              "Orcamentos profissionais em minutos",
              "Assistente Iris responde por texto e voz",
              "App mobile para trabalhar em campo",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.30)" }}
                >
                  <Check className="h-3 w-3 text-green-400" />
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
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

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f9fafb" }}>
              Criar conta
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              Preencha os dados abaixo para comecar
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <AuthLabel>Nome completo</AuthLabel>
                <AuthInput
                  type="text"
                  placeholder="Joao Silva"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <AuthLabel>Telefone</AuthLabel>
                <AuthInput
                  type="tel"
                  placeholder="(11) 99999-9999"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <AuthLabel>Email</AuthLabel>
                <AuthInput
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <AuthLabel>Senha</AuthLabel>
                <AuthPasswordInput
                  placeholder="Minimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <AuthLabel>Confirmar senha</AuthLabel>
                <AuthPasswordInput
                  placeholder="Repita a senha"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  show={showRepeat}
                  onToggle={() => setShowRepeat((v) => !v)}
                />
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{
                background: "linear-gradient(90deg,#16a34a,#22c55e)",
                color: "#fff",
                boxShadow: "0 0 24px rgba(34,197,94,0.22)",
              }}
            >
              {isLoading ? "Criando conta..." : (
                <>Criar minha conta <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Ja tem uma conta?{" "}
            <Link href="/auth/login" className="font-medium text-green-400 hover:text-green-300 transition-colors">
              Entrar
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

function AuthPasswordInput({
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: "rgba(255,255,255,0.30)" }}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
