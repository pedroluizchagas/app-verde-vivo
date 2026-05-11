/**
 * Tipos do domínio Financeiro alinhados ao schema Supabase.
 * Usados pelas queries em `queries.ts` e pelos componentes em `components/finance/`.
 */

export type FinancialType = "income" | "expense";

export type FinancialStatus = "paid" | "pending" | string;

export interface CategoriaEmbutida {
  name?: string | null;
  parent_id?: string | null;
}

export interface ClienteEmbutido {
  name?: string | null;
}

export interface TransacaoFinanceira {
  id: string;
  gardener_id: string;
  type: FinancialType;
  amount: number;
  transaction_date: string;
  description?: string | null;
  status: FinancialStatus;
  due_date?: string | null;
  paid_at?: string | null;
  category_id?: string | null;
  client_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  category?: CategoriaEmbutida | null;
  client?: ClienteEmbutido | null;
}

export interface TransacaoResumo {
  id: string;
  type: FinancialType;
  amount: number;
  transaction_date: string;
  description?: string | null;
  status: FinancialStatus;
  due_date?: string | null;
}

export interface TransacaoPagaResumo {
  amount: number;
  type: FinancialType;
  status: FinancialStatus;
}

export interface AlertaVencimento {
  id: string;
  description?: string | null;
  amount: number;
  type: FinancialType;
  due_date: string;
}

export interface KpisFinanceiros {
  monthIncome: number;
  monthExpense: number;
  monthResult: number;
  currentBalance: number;
  forecastNext30: number;
  incomeCount: number;
  expenseCount: number;
}
