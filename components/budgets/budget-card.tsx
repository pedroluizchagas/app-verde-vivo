import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { User, Clock } from "lucide-react";

interface Budget {
  id: string;
  title: string;
  description?: string | null;
  total_amount: number;
  status: string;
  valid_until?: string | null;
  created_at?: string | null;
  client?: { name?: string | null } | { name?: string | null }[] | null;
}

export const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
};

const statusBorderColors: Record<string, string> = {
  pending: "border-l-amber-500",
  approved: "border-l-emerald-500",
  rejected: "border-l-red-400",
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function BudgetCard({ budget }: { budget: Budget }) {
  const statusLabel = statusLabels[budget.status] ?? budget.status;
  const statusColor = statusColors[budget.status] ?? "bg-muted text-muted-foreground";
  const borderColor = statusBorderColors[budget.status] ?? "border-l-border";
  const total = Number(budget.total_amount || 0);

  const now = new Date();
  const validUntil = budget.valid_until ? new Date(budget.valid_until) : null;
  const isExpired = validUntil && validUntil < now && budget.status === "pending";

  const validStr = validUntil
    ? validUntil.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;

  return (
    <Link href={`/dashboard/budgets/${budget.id}`}>
      <Card
        className={`py-0 border-l-4 ${borderColor} transition-all hover:shadow-md hover:-translate-y-px active:scale-[0.99]`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-[14px] leading-tight truncate">{budget.title}</p>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {(() => {
                  const cliente = Array.isArray(budget.client)
                    ? (budget.client[0] ?? null)
                    : (budget.client ?? null);
                  return cliente?.name ? (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground truncate">
                        {cliente.name}
                      </span>
                    </div>
                  ) : null;
                })()}
                {validStr && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span
                      className={`text-[11px] ${isExpired ? "text-destructive font-medium" : "text-muted-foreground"}`}
                    >
                      {isExpired ? "Expirado " : "Válido até "}
                      {validStr}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[15px] font-bold leading-tight tabular-nums">{fmt(total)}</p>
              <p className="text-[10px] text-muted-foreground">total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
