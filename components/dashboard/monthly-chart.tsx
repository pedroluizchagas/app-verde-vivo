"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

type ChartEntry = {
  month: string
  receita: number
  despesa: number
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v)
}

function formatAxis(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
  return String(v)
}

export function MonthlyChart({ data }: { data: ChartEntry[] }) {
  const { resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const isDark = !mounted || resolvedTheme === "dark"

  // Visao diaria quando ha mais de 12 entradas (dias do mes)
  const isDailyView = data.length > 12

  const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const axisColor = isDark ? "#666" : "#9a9a9a"
  const despesaFill = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"
  const tooltipBg = isDark ? "#1a1a1a" : "#ffffff"
  const tooltipBorder = isDark ? "none" : "1px solid #e8e3dc"
  const tooltipColor = isDark ? "#fff" : "#1a1a1a"
  const tooltipLabelColor = isDark ? "#888" : "#aaa"
  const cursorFill = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridStroke}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 10 }}
            // Na visao diaria exibe apenas um label a cada 5 dias para nao poluir
            interval={isDailyView ? 4 : 0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 10 }}
            tickFormatter={formatAxis}
            width={32}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: tooltipBorder,
              borderRadius: "10px",
              color: tooltipColor,
              fontSize: "11px",
              padding: "8px 14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "receita" ? "Receita" : "Despesa",
            ]}
            labelStyle={{
              color: tooltipLabelColor,
              fontSize: "9px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
              marginBottom: "4px",
            }}
            cursor={{ fill: cursorFill }}
          />
          <Bar
            dataKey="receita"
            fill="var(--color-primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={isDailyView ? 8 : 16}
            name="receita"
          />
          <Bar
            dataKey="despesa"
            fill={despesaFill}
            radius={[4, 4, 0, 0]}
            maxBarSize={isDailyView ? 8 : 16}
            name="despesa"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
