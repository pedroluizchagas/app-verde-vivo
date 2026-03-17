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
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={formatAxis}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "receita" ? "Receita" : "Despesa",
            ]}
            labelStyle={{ color: "#9ca3af" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar
            dataKey="receita"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            name="receita"
          />
          <Bar
            dataKey="despesa"
            fill="#4ade80"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            name="despesa"
            opacity={0.45}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
