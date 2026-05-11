import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { AgendamentoResumo } from "@/lib/domain/dashboard/types";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTH_NAMES = [
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

const TYPE_LABELS: Record<string, string> = {
  service: "Serviço",
  technical_visit: "Visita técnica",
  training: "Treinamento",
  meeting: "Reunião",
  other: "Outro",
};

interface Props {
  appointments: AgendamentoResumo[];
}

export function UpcomingAppointmentsCard({ appointments }: Props) {
  return (
    <Card className="py-0 flex-1 min-h-0">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">Próxima Agenda</h2>
          <Link
            href="/dashboard/schedule"
            className="text-[10px] text-primary hover:underline font-medium"
          >
            Ver todos
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1 scrollbar-thin">
          {appointments.length > 0 ? (
            appointments.map((a) => {
              const date = new Date(a.scheduled_date);
              const dayName = DAY_NAMES[date.getDay()];
              const dateStr = `${dayName}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
              const timeStr = a.all_day
                ? "Dia inteiro"
                : date.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
              const isCompleted = a.status === "completed";
              const title = a.title || (a.type ? TYPE_LABELS[a.type] : null) || "Compromisso";
              const cliente = Array.isArray(a.client) ? (a.client[0] ?? null) : (a.client ?? null);
              const clientName = cliente?.name ?? "";

              return (
                <Link
                  key={a.id}
                  href={`/dashboard/schedule/${a.id}`}
                  className="flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-b-0 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  {isCompleted ? (
                    <div className="mt-0.5 h-[15px] w-[15px] rounded bg-primary flex items-center justify-center shrink-0">
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary-foreground"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : (
                    <div className="mt-0.5 h-[15px] w-[15px] rounded border-[1.5px] border-border shrink-0" />
                  )}
                  <div className="shrink-0 w-[48px]">
                    <p className="text-[9px] text-muted-foreground font-medium leading-tight">
                      {dateStr}
                    </p>
                    <p className="text-[9px] text-muted-foreground">{timeStr}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate leading-tight">{title}</p>
                    {clientName && (
                      <p className="text-[10px] text-muted-foreground truncate">{clientName}</p>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Nenhum agendamento encontrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
