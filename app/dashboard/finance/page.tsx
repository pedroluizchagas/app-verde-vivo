import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FinancialKpiCards } from "@/components/finance/kpi-cards";
import { ForecastCard } from "@/components/finance/forecast-card";
import { FinancialAlertsCard } from "@/components/finance/alerts-card";
import { MonthTransactionsTabs } from "@/components/finance/month-transactions-tabs";
import {
  calcularKpisFinanceiros,
  obterAlertasProximos7,
  obterPendentesProximos30,
  obterSaldoAtual,
  obterTransacoesDoMes,
} from "@/lib/domain/finance/queries";

export default async function FinancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date();

  const [monthTransactions, currentBalance, pending30, alerts] = await Promise.all([
    obterTransacoesDoMes(supabase, user!.id, today),
    obterSaldoAtual(supabase, user!.id),
    obterPendentesProximos30(supabase, user!.id, today),
    obterAlertasProximos7(supabase, user!.id, today),
  ]);

  const kpis = calcularKpisFinanceiros(monthTransactions, currentBalance, pending30);

  const monthLabel = today.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-[13px] text-muted-foreground mt-1 capitalize">{monthLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 rounded-lg text-[13px]">
            <Link href="/dashboard/finance/categories">Categorias</Link>
          </Button>
          <Button asChild size="icon" className="h-9 w-9 rounded-full">
            <Link href="/dashboard/finance/new">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Novo lançamento</span>
            </Link>
          </Button>
        </div>
      </div>

      <FinancialKpiCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ForecastCard pending30={pending30} forecastNext30={kpis.forecastNext30} />
        <FinancialAlertsCard alerts={alerts} />
      </div>

      <MonthTransactionsTabs
        transactions={monthTransactions}
        incomeCount={kpis.incomeCount}
        expenseCount={kpis.expenseCount}
      />
    </div>
  );
}
