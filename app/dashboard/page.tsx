import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardKpiCards } from "@/components/dashboard/kpi-cards";
import { FinancialChartCard } from "@/components/dashboard/financial-chart-card";
import { ProductivityCard } from "@/components/dashboard/productivity-card";
import { UpcomingAppointmentsCard } from "@/components/dashboard/upcoming-appointments-card";
import {
  calcularKpisDashboard,
  montarChartData,
  obterAppointmentsClientes,
  obterContagemClientes,
  obterDadosFinanceirosAnuais,
  obterNovosClientesPeriodo,
  obterProdutividadeMes,
  obterProximosAgendamentos,
  obterTransacoesPagas,
  parsearFiltroPeriodo,
  somarDespesa,
  somarReceita,
} from "@/lib/domain/dashboard/queries";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user!.id)
    .single();

  const now = new Date();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const mParam = typeof sp?.m === "string" ? sp.m : null;
  const filtro = parsearFiltroPeriodo(mParam, now);
  const kpiMonth = filtro.mes ?? now.getMonth() + 1;
  const startMonth = new Date(filtro.ano, kpiMonth - 1, 1);
  const endMonth = new Date(filtro.ano, kpiMonth, 0);
  const prevStartMonth = new Date(filtro.ano, kpiMonth - 2, 1);
  const prevEndMonth = new Date(filtro.ano, kpiMonth - 1, 0);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since60 = new Date();
  since60.setDate(since60.getDate() - 60);

  const [
    contagemClientes,
    newClientsThisMonth,
    newClientsPrevMonth,
    recentAppointments,
    prev30Appointments,
    monthTx,
    prevMonthTx,
    yearTx,
    produtividade,
    upcomingAppointments,
  ] = await Promise.all([
    obterContagemClientes(supabase, user!.id),
    obterNovosClientesPeriodo(supabase, user!.id, startMonth, endMonth),
    obterNovosClientesPeriodo(supabase, user!.id, prevStartMonth, prevEndMonth),
    obterAppointmentsClientes(supabase, user!.id, since30),
    obterAppointmentsClientes(supabase, user!.id, since60, since30),
    obterTransacoesPagas(supabase, user!.id, startMonth, endMonth),
    obterTransacoesPagas(supabase, user!.id, prevStartMonth, prevEndMonth),
    obterDadosFinanceirosAnuais(supabase, user!.id, filtro.ano),
    obterProdutividadeMes(supabase, user!.id, startMonth, endMonth),
    obterProximosAgendamentos(supabase, user!.id, dayStart),
  ]);

  const kpis = calcularKpisDashboard({
    clientsCount: contagemClientes.total,
    newClientsThisMonth,
    newClientsPrevMonth,
    recentAppointments,
    prev30Appointments,
    monthIncome: somarReceita(monthTx),
    monthExpense: somarDespesa(monthTx),
    prevMonthIncome: somarReceita(prevMonthTx),
    prevMonthExpense: somarDespesa(prevMonthTx),
  });

  const chartData = montarChartData(yearTx, filtro, endMonth);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        fullName={profile?.full_name}
        avatarUrl={profile?.avatar_url}
        email={user?.email}
      />

      <DashboardKpiCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        <div className="flex flex-col gap-3">
          <FinancialChartCard data={chartData} ano={filtro.ano} mes={filtro.mes} />
          <ProductivityCard produtividade={produtividade} />
        </div>

        <div className="flex flex-col gap-3">
          <Card className="py-0">
            <CardContent className="p-4">
              <MiniCalendar />
            </CardContent>
          </Card>
          <UpcomingAppointmentsCard appointments={upcomingAppointments} />
        </div>
      </div>
    </div>
  );
}
