import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ProductivityChart } from "@/components/dashboard/productivity-chart";
import type { ProdutividadeMes } from "@/lib/domain/dashboard/types";

export function ProductivityCard({ produtividade }: { produtividade: ProdutividadeMes }) {
  const completed = produtividade.completed;
  const remaining = Math.max(produtividade.total - completed, 0);

  return (
    <Card className="py-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold">Produtividade do Mês</h2>
          <Link
            href="/dashboard/schedule"
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Ver agenda
          </Link>
        </div>
        <ProductivityChart completed={completed} remaining={remaining} />
      </CardContent>
    </Card>
  );
}
