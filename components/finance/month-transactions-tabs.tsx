import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionCard } from "@/components/finance/transaction-card";
import { ExportButtons } from "@/components/finance/export-buttons";
import type { TransacaoFinanceira } from "@/lib/domain/finance/types";

interface Props {
  transactions: TransacaoFinanceira[];
  incomeCount: number;
  expenseCount: number;
}

export function MonthTransactionsTabs({ transactions, incomeCount, expenseCount }: Props) {
  const incomes = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold">Lançamentos do mês</h2>
        <ExportButtons
          transactions={transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            transaction_date: t.transaction_date,
            description: t.description,
            status: t.status,
            category: t.category?.name ? { name: t.category.name } : undefined,
            client: t.client?.name ? { name: t.client.name } : undefined,
          }))}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="all" className="text-[13px] gap-1.5">
            Todos
            {transactions.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                {transactions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="income" className="text-[13px] gap-1.5">
            Receitas
            {incomeCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 leading-none">
                {incomeCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expense" className="text-[13px] gap-1.5">
            Despesas
            {expenseCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 leading-none">
                {expenseCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-3">
          {transactions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {transactions.map((t) => (
                <TransactionCard key={t.id} transaction={t} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground py-8 text-center">
              Nenhum lançamento no mês.
            </p>
          )}
        </TabsContent>

        <TabsContent value="income" className="mt-3">
          {incomes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {incomes.map((t) => (
                <TransactionCard key={t.id} transaction={t} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground py-8 text-center">
              Nenhuma receita no mês.
            </p>
          )}
        </TabsContent>

        <TabsContent value="expense" className="mt-3">
          {expenses.length > 0 ? (
            <div className="flex flex-col gap-2">
              {expenses.map((t) => (
                <TransactionCard key={t.id} transaction={t} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground py-8 text-center">
              Nenhuma despesa no mês.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
