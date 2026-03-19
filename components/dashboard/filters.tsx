"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

export function DashboardFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const currentYear = new Date().getFullYear()

  const mParam = params.get("m")
  const parts = (mParam ?? "").split("-")
  const year = Number(parts[0]) || currentYear
  // month is null when not explicitly selected (year-only view)
  const month: number | null = parts[1] ? (Number(parts[1]) || null) : null

  const years = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2],
    [currentYear]
  )

  const update = (y: number, m: number | null) => {
    const sp = new URLSearchParams(params.toString())
    sp.set("m", m != null ? `${y}-${pad(m)}` : String(y))
    router.replace(`${pathname}?${sp.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(year)}
        onValueChange={(v) => update(Number(v), month)}
      >
        <SelectTrigger className="rounded-full h-9 px-4 min-w-[80px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/*
        value="" nao corresponde a nenhum SelectItem, entao o Radix exibe o
        placeholder "Mês". Quando o usuario seleciona "Ano todo" (value="0"),
        update recebe "0" e chama update(year, null), voltando para visao anual.
      */}
      <Select
        value={month != null ? String(month) : ""}
        onValueChange={(v) => update(year, v === "0" ? null : Number(v))}
      >
        <SelectTrigger className="rounded-full h-9 px-4 min-w-[80px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Ano todo</SelectItem>
          {MONTH_LABELS.map((label, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
