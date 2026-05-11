/**
 * Tipos do dashboard agregado da home.
 */

export interface DashboardKpis {
  clientsCount: number;
  clientsChange: number;
  activeClientsCount: number;
  activeClientsChange: number;
  monthIncome: number;
  monthExpense: number;
  monthResult: number;
  revenueChange: number;
  resultChange: number;
}

export interface ChartEntry {
  month: string;
  receita: number;
  despesa: number;
}

export interface AgendamentoResumo {
  id: string;
  title?: string | null;
  type?: string | null;
  status: string;
  scheduled_date: string;
  end_date?: string | null;
  all_day?: boolean | null;
  client?: { id?: string; name?: string | null } | { id?: string; name?: string | null }[] | null;
}

export interface ProdutividadeMes {
  completed: number;
  total: number;
}

export interface FiltroPeriodo {
  ano: number;
  mes: number | null; // null = visão anual
}
