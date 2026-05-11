import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgendamentoResumo,
  ChartEntry,
  DashboardKpis,
  FiltroPeriodo,
  ProdutividadeMes,
} from "./types";

type Supabase = SupabaseClient;

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function changePct(atual: number, anterior: number): number {
  if (anterior > 0) return ((atual - anterior) / anterior) * 100;
  if (anterior < 0) return ((atual - anterior) / Math.abs(anterior)) * 100;
  if (atual > 0) return 100;
  if (atual < 0) return -100;
  return 0;
}

interface ClienteRefRow {
  client?: { id?: string | null } | { id?: string | null }[] | null;
}

function extrairClienteId(row: ClienteRefRow): string | null {
  if (!row.client) return null;
  if (Array.isArray(row.client)) return row.client[0]?.id ?? null;
  return row.client.id ?? null;
}

export function parsearFiltroPeriodo(mParam: string | null, hoje: Date): FiltroPeriodo {
  const parts = (mParam ?? "").split("-");
  const ano = Number(parts[0]) || hoje.getFullYear();
  const mes: number | null = parts[1] ? Number(parts[1]) || null : null;
  return { ano, mes };
}

export interface ResultadosKpisInput {
  clientsCount: number | null;
  newClientsThisMonth: number | null;
  newClientsPrevMonth: number | null;
  recentAppointments: ClienteRefRow[];
  prev30Appointments: ClienteRefRow[];
  monthIncome: number;
  monthExpense: number;
  prevMonthIncome: number;
  prevMonthExpense: number;
}

export function calcularKpisDashboard(input: ResultadosKpisInput): DashboardKpis {
  const monthResult = input.monthIncome - input.monthExpense;
  const prevMonthResult = input.prevMonthIncome - input.prevMonthExpense;

  const activeClientsCount = new Set(
    input.recentAppointments.map(extrairClienteId).filter(Boolean),
  ).size;
  const prev30ActiveCount = new Set(input.prev30Appointments.map(extrairClienteId).filter(Boolean))
    .size;

  return {
    clientsCount: input.clientsCount ?? 0,
    clientsChange: changePct(input.newClientsThisMonth ?? 0, input.newClientsPrevMonth ?? 0),
    activeClientsCount,
    activeClientsChange: changePct(activeClientsCount, prev30ActiveCount),
    monthIncome: input.monthIncome,
    monthExpense: input.monthExpense,
    monthResult,
    revenueChange: changePct(input.monthIncome, input.prevMonthIncome),
    resultChange: changePct(monthResult, prevMonthResult),
  };
}

interface TxResumo {
  amount: number;
  type: string;
  status: string;
  transaction_date: string;
}

function somarPagas(txs: TxResumo[], tipo: string): number {
  return txs
    .filter((t) => t.type === tipo && t.status === "paid")
    .reduce((s, t) => s + Number(t.amount), 0);
}

export async function obterTransacoesPagas(
  supabase: Supabase,
  userId: string,
  inicio: Date,
  fim: Date,
): Promise<TxResumo[]> {
  const { data } = await supabase
    .from("financial_transactions")
    .select("amount, type, status, transaction_date")
    .eq("gardener_id", userId)
    .gte("transaction_date", iso(inicio))
    .lte("transaction_date", iso(fim));
  return (data ?? []) as TxResumo[];
}

export async function obterDadosFinanceirosAnuais(
  supabase: Supabase,
  userId: string,
  ano: number,
): Promise<TxResumo[]> {
  const startYear = new Date(ano, 0, 1);
  const endYear = new Date(ano, 11, 31);
  return obterTransacoesPagas(supabase, userId, startYear, endYear);
}

export function montarChartData(
  yearTx: TxResumo[],
  filtro: FiltroPeriodo,
  endMonthDate: Date,
): ChartEntry[] {
  const mLabels = [
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

  const parseLocalDate = (dateStr: string) => new Date(`${dateStr}T12:00:00`);

  if (filtro.mes != null) {
    return Array.from({ length: endMonthDate.getDate() }, (_, dayIdx) => {
      const day = dayIdx + 1;
      const txs = yearTx.filter((t) => {
        const d = parseLocalDate(t.transaction_date);
        return d.getMonth() + 1 === filtro.mes && d.getDate() === day;
      });
      return {
        month: String(day),
        receita: somarPagas(txs, "income"),
        despesa: somarPagas(txs, "expense"),
      };
    });
  }

  return mLabels.map((label, i) => {
    const txs = yearTx.filter((t) => {
      const d = parseLocalDate(t.transaction_date);
      return d.getMonth() === i;
    });
    return {
      month: label,
      receita: somarPagas(txs, "income"),
      despesa: somarPagas(txs, "expense"),
    };
  });
}

export async function obterAppointmentsClientes(
  supabase: Supabase,
  userId: string,
  desde: Date,
  ate?: Date,
): Promise<ClienteRefRow[]> {
  let query = supabase
    .from("appointments")
    .select("client:clients(id)")
    .eq("gardener_id", userId)
    .gte("scheduled_date", desde.toISOString());
  if (ate) {
    query = query.lt("scheduled_date", ate.toISOString());
  }
  const { data } = await query;
  return (data ?? []) as ClienteRefRow[];
}

export async function obterProdutividadeMes(
  supabase: Supabase,
  userId: string,
  inicio: Date,
  fim: Date,
): Promise<ProdutividadeMes> {
  const { count: completed } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", userId)
    .eq("status", "completed")
    .gte("scheduled_date", inicio.toISOString())
    .lte("scheduled_date", fim.toISOString());

  const { count: total } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", userId)
    .gte("scheduled_date", inicio.toISOString())
    .lte("scheduled_date", fim.toISOString());

  return { completed: completed ?? 0, total: total ?? 0 };
}

export async function obterProximosAgendamentos(
  supabase: Supabase,
  userId: string,
  desde: Date,
  limite = 6,
): Promise<AgendamentoResumo[]> {
  const { data } = await supabase
    .from("appointments")
    .select("id, title, type, status, scheduled_date, end_date, all_day, client:clients(id, name)")
    .eq("gardener_id", userId)
    .gte("scheduled_date", desde.toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(limite);
  return (data ?? []) as AgendamentoResumo[];
}

export async function obterContagemClientes(
  supabase: Supabase,
  userId: string,
): Promise<{ total: number | null; mesAtual: number | null; mesAnterior: number | null }> {
  const total = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", userId);
  return {
    total: total.count,
    mesAtual: null,
    mesAnterior: null,
  };
}

export async function obterNovosClientesPeriodo(
  supabase: Supabase,
  userId: string,
  inicio: Date,
  fim: Date,
): Promise<number | null> {
  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", userId)
    .gte("created_at", inicio.toISOString())
    .lte("created_at", fim.toISOString());
  return count;
}

export function somarReceita(txs: TxResumo[]): number {
  return somarPagas(txs, "income");
}

export function somarDespesa(txs: TxResumo[]): number {
  return somarPagas(txs, "expense");
}
