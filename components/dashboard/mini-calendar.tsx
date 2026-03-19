"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export function MiniCalendar() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d: number) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="h-[22px] w-[22px] rounded-md bg-muted flex items-center justify-center hover:bg-accent transition"
          >
            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={nextMonth}
            className="h-[22px] w-[22px] rounded-md bg-muted flex items-center justify-center hover:bg-accent transition"
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-[10px] text-muted-foreground py-1 font-medium"
          >
            {name}
          </div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            {d !== null ? (
              <span
                className={
                  isToday(d)
                    ? "flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-[12px]"
                    : "flex items-center justify-center w-7 h-7 rounded-full text-[12px] text-muted-foreground hover:bg-accent transition-colors cursor-default"
                }
              >
                {d}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
