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

type MonthData = {
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

export function MonthlyChart({ data }: { data: MonthData[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#666", fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#666", fontSize: 10 }}
            tickFormatter={formatAxis}
            width={32}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "11px",
              padding: "8px 14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "receita" ? "Receita" : "Despesa",
            ]}
            labelStyle={{
              color: "#888",
              fontSize: "9px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
              marginBottom: "4px",
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar
            dataKey="receita"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            maxBarSize={16}
            name="receita"
          />
          <Bar
            dataKey="despesa"
            fill="rgba(255,255,255,0.08)"
            radius={[4, 4, 0, 0]}
            maxBarSize={16}
            name="despesa"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
