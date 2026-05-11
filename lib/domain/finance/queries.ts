import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AlertaVencimento,
  KpisFinanceiros,
  TransacaoFinanceira,
  TransacaoPagaResumo,
  TransacaoResumo,
} from "./types";

type Supabase = SupabaseClient;

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function obterTransacoesDoMes(
  supabase: Supabase,
  userId: string,
  referencia: Date,
): Promise<TransacaoFinanceira[]> {
  const startOfMonth = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const endOfMonth = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);

  const { data } = await supabase
    .from("financial_transactions")
    .select("*, category:financial_categories(name, parent_id), client:clients(name)")
    .eq("gardener_id", userId)
    .gte("transaction_date", toISODate(startOfMonth))
    .lte("transaction_date", toISODate(endOfMonth))
    .order("transaction_date", { ascending: false });

  return (data ?? []) as TransacaoFinanceira[];
}

export async function obterSaldoAtual(supabase: Supabase, userId: string): Promise<number> {
  const { data } = await supabase
    .from("financial_transactions")
    .select("amount, type, status")
    .eq("gardener_id", userId)
    .eq("status", "paid");

  return ((data ?? []) as TransacaoPagaResumo[]).reduce(
    (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0,
  );
}

export async function obterPendentesProximos30(
  supabase: Supabase,
  userId: string,
  referencia: Date,
): Promise<TransacaoResumo[]> {
  const in30 = new Date(referencia);
  in30.setDate(in30.getDate() + 30);

  const { data } = await supabase
    .from("financial_transactions")
    .select("id, amount, type, due_date, description, status, transaction_date")
    .eq("gardener_id", userId)
    .eq("status", "pending")
    .gte("due_date", toISODate(referencia))
    .lte("due_date", toISODate(in30))
    .order("due_date", { ascending: true });

  return (data ?? []) as TransacaoResumo[];
}

export async function obterAlertasProximos7(
  supabase: Supabase,
  userId: string,
  referencia: Date,
): Promise<AlertaVencimento[]> {
  const in7 = new Date(referencia);
  in7.setDate(in7.getDate() + 7);

  const { data } = await supabase
    .from("financial_transactions")
    .select("id, description, amount, type, due_date")
    .eq("gardener_id", userId)
    .eq("status", "pending")
    .gte("due_date", toISODate(referencia))
    .lte("due_date", toISODate(in7))
    .order("due_date", { ascending: true });

  return (data ?? []) as AlertaVencimento[];
}

export function calcularKpisFinanceiros(
  monthTransactions: TransacaoFinanceira[],
  currentBalance: number,
  pending30: TransacaoResumo[],
): KpisFinanceiros {
  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthResult = monthIncome - monthExpense;
  const incomeCount = monthTransactions.filter((t) => t.type === "income").length;
  const expenseCount = monthTransactions.filter((t) => t.type === "expense").length;

  const forecastNext30 = pending30.reduce(
    (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  return {
    monthIncome,
    monthExpense,
    monthResult,
    currentBalance,
    forecastNext30,
    incomeCount,
    expenseCount,
  };
}
