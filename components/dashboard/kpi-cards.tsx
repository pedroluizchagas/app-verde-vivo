import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, UserCheck, Users, Wallet } from "lucide-react";
import { ChangeIndicator } from "./change-indicator";
import type { DashboardKpis } from "@/lib/domain/dashboard/types";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function DashboardKpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Total de Clientes
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-[22px] font-bold leading-tight mb-0.5">
            {kpis.clientsCount.toLocaleString("pt-BR")}
          </p>
          <ChangeIndicator value={kpis.clientsChange} />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Clientes Ativos
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-[22px] font-bold leading-tight mb-0.5">
            {kpis.activeClientsCount.toLocaleString("pt-BR")}
          </p>
          <ChangeIndicator value={kpis.activeClientsChange} />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Receita do Mês
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-lg font-bold leading-tight mb-0.5">{fmt(kpis.monthIncome)}</p>
          <ChangeIndicator value={kpis.revenueChange} />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Resultado do Mês
            </span>
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-lg font-bold leading-tight mb-0.5">{fmt(kpis.monthResult)}</p>
          <ChangeIndicator value={kpis.resultChange} />
        </CardContent>
      </Card>
    </div>
  );
}
