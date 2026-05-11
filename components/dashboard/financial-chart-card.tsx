import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { DashboardFilters } from "@/components/dashboard/filters";
import type { ChartEntry } from "@/lib/domain/dashboard/types";

const MES_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const fmtK = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
};

interface Props {
  data: ChartEntry[];
  ano: number;
  mes: number | null;
}

export function FinancialChartCard({ data, ano, mes }: Props) {
  const totalReceita = data.reduce((s, d) => s + d.receita, 0);
  const totalDespesa = data.reduce((s, d) => s + d.despesa, 0);

  return (
    <Card className="py-0">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[14px] font-semibold">
              Desempenho Financeiro &mdash; {mes != null ? `${MES_LABELS[mes - 1]} / ${ano}` : ano}
            </h2>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                <span className="text-[11px] text-muted-foreground">
                  Receita {fmtK(totalReceita)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/20" />
                <span className="text-[11px] text-muted-foreground">
                  Despesa {fmtK(totalDespesa)}
                </span>
              </div>
            </div>
          </div>
          <Suspense fallback={<div className="h-9 w-36 rounded-full bg-muted animate-pulse" />}>
            <DashboardFilters />
          </Suspense>
        </div>
        <MonthlyChart data={data} />
      </CardContent>
    </Card>
  );
}
