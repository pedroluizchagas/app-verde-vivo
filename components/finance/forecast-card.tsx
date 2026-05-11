import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { TransacaoResumo } from "@/lib/domain/finance/types";

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface ForecastCardProps {
  pending30: TransacaoResumo[];
  forecastNext30: number;
}

export function ForecastCard({ pending30, forecastNext30 }: ForecastCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <h2 className="text-[14px] font-semibold mb-3">Previsão de fluxo (30 dias)</h2>
        <div className="flex items-baseline gap-2 mb-3">
          <p
            className={`text-xl font-bold tabular-nums ${
              forecastNext30 >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {currency(forecastNext30)}
          </p>
          <span className="text-[11px] text-muted-foreground">em lançamentos pendentes</span>
        </div>
        {pending30.length > 0 ? (
          <div className="flex flex-col divide-y divide-border/40">
            {pending30.slice(0, 4).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                      t.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {t.type === "income" ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500 dark:text-red-400" />
                    )}
                  </div>
                  <span className="text-[12px] text-muted-foreground truncate">
                    {t.description || "(sem descrição)"}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p
                    className={`text-[12px] font-semibold tabular-nums ${
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {currency(Number(t.amount))}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.due_date
                      ? new Date(`${t.due_date}T12:00:00`).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            Nenhum lançamento pendente nos próximos 30 dias.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
