import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { AlertaVencimento } from "@/lib/domain/finance/types";

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface AlertsCardProps {
  alerts: AlertaVencimento[];
}

export function FinancialAlertsCard({ alerts }: AlertsCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <h2 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Vencimentos próximos (7 dias)
        </h2>
        {alerts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {alerts.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/finance/transactions/${a.id}`}
                className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      a.type === "income"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-500 dark:text-red-400"
                    }`}
                  >
                    {a.type === "income" ? "Receita" : "Despesa"}
                  </span>
                  <span className="text-[12px] text-muted-foreground truncate">
                    {a.description || "(sem descrição)"}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-[12px] font-semibold tabular-nums">
                    {currency(Number(a.amount))}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(`${a.due_date}T12:00:00`).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            Nenhum vencimento nos próximos 7 dias.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
