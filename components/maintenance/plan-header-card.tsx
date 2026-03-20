"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Phone,
  Sun,
  Droplets,
  DollarSign,
  Calendar,
  CalendarDays,
  ExternalLink,
} from "lucide-react"

const AVATAR_COLORS = [
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-teal-500/15 text-teal-600 dark:text-teal-400",
]

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

const WEEK_LABELS = ["1ª semana", "2ª semana", "3ª semana", "4ª semana"]

export function MaintenancePlanHeaderCard({
  plan,
  client,
}: {
  plan: any
  client?: any
}) {
  const clientName = String(client?.name || "Cliente")
  const clientPhone = String(client?.phone || "")
  const clientId = client?.id || null

  const initials = clientName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w.charAt(0).toUpperCase())
    .join("")
  const avatarColor = getAvatarColor(clientName)

  const desc = String(plan?.default_description || "")
  const hasSunFull = /sol\s*pleno/i.test(desc)
  const hasSunPartial = /meia\s*sombra/i.test(desc)
  const waterMatch = desc.match(/rega\s*(\d+)x/i)
  const waterFreq = waterMatch ? waterMatch[1] : null

  const laborCost =
    typeof plan?.default_labor_cost === "number" &&
    plan.default_labor_cost > 0
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(plan.default_labor_cost)
      : null

  const billingDay =
    typeof plan?.billing_day === "number" && plan.billing_day > 0
      ? plan.billing_day
      : null

  const prefWeekday =
    typeof plan?.preferred_weekday === "number"
      ? WEEKDAY_LABELS[plan.preferred_weekday] ?? null
      : null

  const prefWeek =
    typeof plan?.preferred_week_of_month === "number" &&
    plan.preferred_week_of_month >= 1
      ? WEEK_LABELS[plan.preferred_week_of_month - 1] ?? null
      : null

  const scheduleLabel =
    prefWeekday && prefWeek
      ? `${prefWeek} — ${prefWeekday}`
      : prefWeekday || prefWeek || null

  return (
    <Card className="py-0">
      <CardContent className="p-5 flex flex-col gap-4">
        {/* Perfil do cliente */}
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 font-bold text-[15px] ${avatarColor}`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[16px] leading-tight truncate">
              {clientName}
            </p>
            {clientPhone && (
              <a
                href={`tel:${clientPhone}`}
                className="flex items-center gap-1.5 mt-0.5 group w-fit"
              >
                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[12px] text-primary group-hover:underline">
                  {clientPhone}
                </span>
              </a>
            )}
          </div>
          {clientId && (
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium shrink-0"
            >
              Ver perfil
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Informações financeiras e de agendamento */}
        {(laborCost || billingDay || scheduleLabel) && (
          <div className="border-t border-border/60 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {laborCost && (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                    Valor mensal
                  </p>
                  <p className="text-[13px] font-bold text-primary leading-tight">
                    {laborCost}
                  </p>
                </div>
              </div>
            )}
            {billingDay && (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                    Vencimento
                  </p>
                  <p className="text-[13px] font-semibold leading-tight">
                    Dia {billingDay}
                  </p>
                </div>
              </div>
            )}
            {scheduleLabel && (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                    Agendamento
                  </p>
                  <p className="text-[12px] font-semibold leading-tight">
                    {scheduleLabel}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ambiente do jardim */}
        {(hasSunFull || hasSunPartial || waterFreq || desc) && (
          <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
            {(hasSunFull || hasSunPartial || waterFreq) && (
              <div className="flex flex-wrap gap-1.5">
                {(hasSunFull || hasSunPartial) && (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Sun className="h-3 w-3 shrink-0" />
                    {hasSunFull ? "Sol pleno" : "Meia sombra"}
                  </span>
                )}
                {waterFreq && (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Droplets className="h-3 w-3 shrink-0" />
                    Rega {waterFreq}x por semana
                  </span>
                )}
              </div>
            )}
            {desc && (
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {desc}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
