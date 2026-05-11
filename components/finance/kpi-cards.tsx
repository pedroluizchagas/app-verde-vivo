import { Card, CardContent } from "@/components/ui/card";
import { Banknote, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import type { KpisFinanceiros } from "@/lib/domain/finance/types";

interface KpiCardsProps {
  kpis: KpisFinanceiros;
}

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function FinancialKpiCards({ kpis }: KpiCardsProps) {
  const { currentBalance, monthIncome, monthExpense, monthResult, incomeCount, expenseCount } =
    kpis;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Saldo atual
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <p
            className={`text-[18px] font-bold leading-tight mb-0.5 tabular-nums ${
              currentBalance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {currency(currentBalance)}
          </p>
          <p className="text-[10px] text-muted-foreground">receitas − despesas pagas</p>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Receitas
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
          </div>
          <p className="text-[18px] font-bold leading-tight text-emerald-600 dark:text-emerald-400 mb-0.5 tabular-nums">
            {currency(monthIncome)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {incomeCount} lançamento{incomeCount !== 1 ? "s" : ""} no mês
          </p>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Despesas
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            </div>
          </div>
          <p className="text-[18px] font-bold leading-tight text-red-500 dark:text-red-400 mb-0.5 tabular-nums">
            {currency(monthExpense)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {expenseCount} lançamento{expenseCount !== 1 ? "s" : ""} no mês
          </p>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Resultado
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <p
            className={`text-[18px] font-bold leading-tight mb-0.5 tabular-nums ${
              monthResult >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {currency(monthResult)}
          </p>
          <p className="text-[10px] text-muted-foreground">receitas − despesas do mês</p>
        </CardContent>
      </Card>
    </div>
  );
}
