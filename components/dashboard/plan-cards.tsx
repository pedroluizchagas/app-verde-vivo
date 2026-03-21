"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Sparkles, Loader2, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Plan = "basic" | "plus"

const PLANS = [
  {
    id: "basic" as Plan,
    name: "Basico",
    price: "R$ 47,90",
    period: "/mes",
    description:
      "Gerencie sua empresa de jardinagem com todas as ferramentas essenciais.",
    features: [
      "Clientes ilimitados",
      "Agenda e agendamentos",
      "Financeiro e fluxo de caixa",
      "Estoque e produtos",
      "Orcamentos e ordens de servico",
      "Planos de manutencao recorrente",
      "Notas e tarefas",
    ],
    notIncluded: ["Assistente Iris com IA"],
    highlight: false,
  },
  {
    id: "plus" as Plan,
    name: "Plus",
    price: "R$ 77,90",
    period: "/mes",
    description:
      "Tudo do Basico mais o poder da inteligencia artificial no seu dia a dia.",
    features: [
      "Tudo do plano Basico",
      "Assistente Iris com IA",
      "Comandos por texto e por voz",
      "Agendamento por comando de voz",
      "Lancamento financeiro por voz",
      "Gestao de estoque por voz",
    ],
    notIncluded: [],
    highlight: true,
  },
] as const

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: "Ativo",
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Aguardando pagamento",
    color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  overdue: {
    label: "Pagamento em atraso",
    color: "text-red-600 bg-red-500/10 border-red-500/20",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelado",
    color: "text-muted-foreground bg-muted border-border",
    icon: <X className="h-3.5 w-3.5" />,
  },
}

interface Subscription {
  id: string
  plan: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

interface PlanCardsProps {
  currentPlan: string | null
  subscription: Subscription | null
  trialDaysLeft?: number
  trialEndsAt?: string | null
}

export function PlanCards({ currentPlan, subscription, trialDaysLeft = 0, trialEndsAt }: PlanCardsProps) {
  const [loading, setLoading] = useState<Plan | null>(null)
  const [reopenLoading, setReopenLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cpfMissing, setCpfMissing] = useState(false)

  async function handleSubscribe(plan: Plan) {
    if (loading !== null || reopenLoading) return
    setLoading(plan)
    setError(null)
    setCpfMissing(false)
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === "cpf_cnpj_required") {
          setCpfMissing(true)
        } else {
          setError(data.message ?? data.error ?? "Erro ao iniciar assinatura")
        }
        return
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError("Link de pagamento nao disponivel. Tente novamente.")
      }
    } catch (err: any) {
      setError(err?.message ?? "Erro ao iniciar assinatura")
    } finally {
      setLoading(null)
    }
  }

  async function handleReopenPayment() {
    if (loading !== null || reopenLoading) return
    setReopenLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/subscription/reopen-payment", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Erro ao recuperar link de pagamento")
        return
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError("Link de pagamento nao disponivel. Tente iniciar uma nova assinatura.")
      }
    } catch (err: any) {
      setError(err?.message ?? "Erro ao recuperar link de pagamento")
    } finally {
      setReopenLoading(false)
    }
  }

  const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
    : null

  const trialActive = !currentPlan && trialDaysLeft > 0
  const trialExpired = !currentPlan && trialDaysLeft === 0 && !!trialEndsAt
  const trialEndDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("pt-BR")
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de trial ativo */}
      {trialActive && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8 text-sm">
          <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-amber-600">
              Periodo de teste: {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
            </span>
            {trialEndDate && (
              <span className="text-amber-600/70 font-normal ml-1">
                · Expira em {trialEndDate}
              </span>
            )}
            <p className="text-muted-foreground mt-0.5 text-[13px]">
              Assine um plano para continuar usando o Iris apos o periodo de teste.
            </p>
          </div>
        </div>
      )}

      {/* Banner de trial expirado */}
      {trialExpired && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/8 text-sm">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-red-600">
              Seu periodo de teste encerrou
            </span>
            <p className="text-muted-foreground mt-0.5 text-[13px]">
              Escolha um plano abaixo para reativar seu acesso ao Iris.
            </p>
          </div>
        </div>
      )}
      {/* Status da assinatura atual */}
      {subscription && statusInfo && (
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium",
            statusInfo.color
          )}
        >
          {statusInfo.icon}
          <span>
            {statusInfo.label}
            {subscription.plan === "basic" && " — Plano Basico"}
            {subscription.plan === "plus" && " — Plano Plus"}
            {periodEnd && subscription.status === "active" && (
              <span className="font-normal opacity-70 ml-1">
                · Proximo vencimento: {periodEnd}
              </span>
            )}
            {subscription.status === "pending" && (
              <span className="font-normal opacity-70 ml-1">
                · Acesse o link de pagamento para ativar seu plano.
              </span>
            )}
            {subscription.status === "overdue" && (
              <span className="font-normal opacity-70 ml-1">
                · Regularize o pagamento para manter o acesso.
              </span>
            )}
          </span>
          {(subscription.status === "pending" || subscription.status === "overdue") && (
            <button
              type="button"
              disabled={reopenLoading || loading !== null}
              onClick={handleReopenPayment}
              className="ml-auto text-xs underline underline-offset-2 font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reopenLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Abrir pagamento"
              )}
            </button>
          )}
        </div>
      )}

      {/* CPF/CNPJ ausente */}
      {cpfMissing && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Preencha seu CPF ou CNPJ antes de assinar.{" "}
            <Link href="/dashboard/profile" className="underline underline-offset-2 font-medium">
              Ir para o perfil
            </Link>
          </span>
        </div>
      )}

      {/* Erro generico */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Cards de plano */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isAnyLoading = loading !== null || reopenLoading

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.highlight && !isCurrent && "border-primary ring-1 ring-primary/30",
                isCurrent && "border-emerald-500 ring-1 ring-emerald-500/30"
              )}
            >
              {plan.highlight && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    Recomendado
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    Plano atual
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {plan.id === "plus" && (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-1 text-[13px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 flex-1">
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-[13px] text-muted-foreground/50"
                    >
                      <X className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-2"
                  variant={plan.highlight ? "default" : "outline"}
                  disabled={isCurrent || isAnyLoading}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Redirecionando...
                    </>
                  ) : isCurrent ? (
                    "Plano atual"
                  ) : currentPlan ? (
                    `Mudar para ${plan.name}`
                  ) : (
                    `Assinar ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Nota sobre pagamento */}
      <p className="text-[12px] text-muted-foreground text-center">
        Pagamento seguro via{" "}
        <span className="font-medium text-foreground/60">Asaas</span> — PIX,
        boleto ou cartao de credito. Cancele a qualquer momento.
      </p>
    </div>
  )
}
