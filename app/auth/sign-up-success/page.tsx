import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-svh flex items-center justify-center px-6 py-12" style={{ background: "#070708", color: "#f0f0f0" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.09) 0%, transparent 65%)", filter: "blur(2px)" }}
        />
      </div>

      <div className="w-full max-w-[420px] text-center">
        {/* Logo */}
        <Link href="/" className="inline-block mb-10">
          <img src="/img/iris.png" alt="Iris" className="h-9 w-auto mx-auto" />
        </Link>

        {/* Icone animado */}
        <div className="relative mx-auto mb-8 w-24 h-24">
          {/* Anel externo pulsante */}
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "rgba(34,197,94,0.12)", animationDuration: "2.4s" }}
          />
          {/* Anel medio */}
          <div
            className="absolute inset-2 rounded-full"
            style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)" }}
          />
          {/* Icone central */}
          <div
            className="absolute inset-4 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(22,163,74,0.30), rgba(34,197,94,0.15))",
              border: "1px solid rgba(34,197,94,0.35)",
            }}
          >
            <Mail className="h-7 w-7 text-green-400" />
          </div>
        </div>

        {/* Titulo */}
        <h1 className="text-2xl font-bold mb-3" style={{ color: "#f9fafb" }}>
          Verifique seu email
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
          Enviamos um link de confirmacao para o seu email.
          Clique no link para ativar sua conta e comecar a usar a Iris.
        </p>

        {/* Card de instrucoes */}
        <div
          className="rounded-2xl p-5 mb-6 text-left space-y-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {[
            "Abra seu email e procure a mensagem da Iris",
            'Clique em "Confirmar meu e-mail"',
            "Pronto — voce sera redirecionado para o app",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: "#4ade80",
                }}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Aviso spam */}
        <div
          className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-8 text-left"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}
        >
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#fbbf24" }} />
          <p className="text-xs leading-relaxed" style={{ color: "rgba(251,191,36,0.80)" }}>
            Nao recebeu? Verifique a pasta de spam ou lixo eletronico.
            O email pode levar alguns minutos para chegar.
          </p>
        </div>

        {/* Botao voltar */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors text-white/40 hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}
