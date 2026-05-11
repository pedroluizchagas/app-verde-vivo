import { TrendingDown, TrendingUp } from "lucide-react";

export function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <div
      className={`flex items-center gap-1 text-[11px] mt-1.5 ${
        isPositive ? "text-emerald-500" : "text-red-400"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      <span className="font-medium">
        {isPositive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
      <span className="text-muted-foreground font-normal">do mês passado</span>
    </div>
  );
}
