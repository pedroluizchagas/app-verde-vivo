import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  AlertTriangle,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react"

const number = (v: number) => new Intl.NumberFormat("pt-BR").format(v)
const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v)

export default async function StockPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, cost, min_stock")
    .eq("gardener_id", user!.id)
    .order("name")

  const productIds = (products || []).map((p) => p.id)
  let stockByProduct: Record<string, number> = {}

  if (productIds.length > 0) {
    const { data: movements } = await supabase
      .from("product_movements")
      .select("product_id, type, quantity")
      .eq("gardener_id", user!.id)
      .in("product_id", productIds)
    ;(movements || []).forEach((m) => {
      stockByProduct[m.product_id] = stockByProduct[m.product_id] || 0
      stockByProduct[m.product_id] +=
        m.type === "in" ? Number(m.quantity) : -Number(m.quantity)
    })
  }

  const lowStock = (products || []).filter(
    (p) => (stockByProduct[p.id] || 0) < Number(p.min_stock)
  )

  const { data: recentMovements } = await supabase
    .from("product_movements")
    .select(
      "id, product_id, type, quantity, movement_date, description, unit_cost, product:products(name, unit)"
    )
    .eq("gardener_id", user!.id)
    .order("movement_date", { ascending: false })
    .limit(10)

  const totalProducts = products?.length || 0
  const totalLowStock = lowStock.length

  const { data: lastInList } = await supabase
    .from("product_movements")
    .select(
      "id, product_id, type, quantity, movement_date, description, unit_cost, product:products(name, unit)"
    )
    .eq("gardener_id", user!.id)
    .eq("type", "in")
    .not("unit_cost", "is", null)
    .order("movement_date", { ascending: false })
    .limit(1)

  const lastIn = (lastInList || [])[0]
  const lastInProduct = Array.isArray(lastIn?.product)
    ? lastIn.product[0]
    : lastIn?.product
  const lastTotal = lastIn
    ? Number(lastIn.quantity) * Number(lastIn.unit_cost ?? 0)
    : 0
  const lastTotalRounded = Math.round(lastTotal * 100) / 100
  const lastDateISO = lastIn
    ? new Date(lastIn.movement_date).toISOString().slice(0, 10)
    : null

  let lastExpense: any = null
  if (lastIn && lastDateISO) {
    const { data: expenseCandidates } = await supabase
      .from("financial_transactions")
      .select(
        "id, amount, transaction_date, status, category:financial_categories(name, parent_id)"
      )
      .eq("gardener_id", user!.id)
      .eq("type", "expense")
      .eq("status", "paid")
      .eq("transaction_date", lastDateISO)
      .eq("amount", lastTotalRounded)
      .limit(1)
    lastExpense = (expenseCandidates || [])[0] || null
  }

  const recentMovementsNorm = (recentMovements || []).map((m: any) => ({
    ...m,
    product: Array.isArray(m.product) ? m.product[0] : m.product,
  }))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Produtos e movimentacoes
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="icon" className="h-10 w-10 rounded-full">
            <Link href="/dashboard/stock/products/new">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Novo produto</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/stock/movements/new">Nova movimentacao</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                Produtos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight mb-0.5">
              {totalProducts}
            </p>
            <p className="text-[10px] text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                Estoque Baixo
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight text-red-400 mb-0.5">
              {totalLowStock}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Abaixo do minimo
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                Movimentacoes
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ArrowUpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight mb-0.5">
              {recentMovements?.length || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">10 mais recentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Products + Last Purchase */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <h2 className="text-[14px] font-semibold mb-3">
              Produtos e saldo atual
            </h2>
            {products && products.length > 0 ? (
              <div className="space-y-2">
                {products.map((p) => {
                  const stock = stockByProduct[p.id] || 0
                  const isLow = stock < Number(p.min_stock)
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-2.5"
                    >
                      <div>
                        <p className="text-[12px] font-medium">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.unit} -- Min: {number(Number(p.min_stock))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${isLow ? "text-red-400" : ""}`}
                        >
                          {number(stock)} {p.unit}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Custo: {currency(Number(p.cost))}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                Nenhum produto cadastrado.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <h2 className="text-[14px] font-semibold mb-3">Ultima compra</h2>
            {lastIn ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-medium">
                      {lastInProduct?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {number(Number(lastIn.quantity))} {lastInProduct?.unit} --
                      Unit: {currency(Number(lastIn.unit_cost))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{currency(lastTotal)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(lastIn.movement_date).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {lastIn.description || "(sem descricao)"}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/finance">Financeiro</Link>
                  </Button>
                  {lastExpense && (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/dashboard/finance/transactions/${lastExpense.id}`}
                      >
                        Lancamento
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                Sem compras registradas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Movements Tabs */}
      <div>
        <Tabs defaultValue="recent">
          <TabsList>
            <TabsTrigger value="recent">Recentes</TabsTrigger>
            <TabsTrigger value="outs">Saidas</TabsTrigger>
            <TabsTrigger value="ins">Entradas</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-3">
            {recentMovementsNorm && recentMovementsNorm.length > 0 ? (
              <div className="space-y-2">
                {recentMovementsNorm.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      {m.type === "in" ? (
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-[12px] font-medium">
                          {m.product?.name} ({number(Number(m.quantity))}{" "}
                          {m.product?.unit})
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {m.description || "(sem descricao)"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px]">
                        {new Date(m.movement_date).toLocaleDateString("pt-BR")}
                      </p>
                      {m.unit_cost && (
                        <p className="text-[10px] text-muted-foreground">
                          Unit: {currency(Number(m.unit_cost))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-6 text-center">
                Sem movimentacoes.
              </p>
            )}
          </TabsContent>
          <TabsContent value="outs" className="mt-3">
            {recentMovementsNorm &&
            recentMovementsNorm.filter((m: any) => m.type === "out").length >
              0 ? (
              <div className="space-y-2">
                {recentMovementsNorm
                  .filter((m: any) => m.type === "out")
                  .map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowDownCircle className="h-4 w-4 text-red-400 shrink-0" />
                        <div>
                          <p className="text-[12px] font-medium">
                            {m.product?.name} ({number(Number(m.quantity))}{" "}
                            {m.product?.unit})
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.description || "(sem descricao)"}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] shrink-0">
                        {new Date(m.movement_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-6 text-center">
                Sem saidas.
              </p>
            )}
          </TabsContent>
          <TabsContent value="ins" className="mt-3">
            {recentMovementsNorm &&
            recentMovementsNorm.filter((m: any) => m.type === "in").length >
              0 ? (
              <div className="space-y-2">
                {recentMovementsNorm
                  .filter((m: any) => m.type === "in")
                  .map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[12px] font-medium">
                            {m.product?.name} ({number(Number(m.quantity))}{" "}
                            {m.product?.unit})
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.description || "(sem descricao)"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px]">
                          {new Date(m.movement_date).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                        {m.unit_cost && (
                          <p className="text-[10px] text-muted-foreground">
                            Unit: {currency(Number(m.unit_cost))}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground py-6 text-center">
                Sem entradas.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
