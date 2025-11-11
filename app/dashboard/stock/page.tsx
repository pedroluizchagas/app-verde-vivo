import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, AlertTriangle, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react"

const number = (v: number) => new Intl.NumberFormat("pt-BR").format(v)
const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

export default async function StockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
      .in("product_id", productIds);

    (movements || []).forEach((m) => {
      stockByProduct[m.product_id] = stockByProduct[m.product_id] || 0
      stockByProduct[m.product_id] += m.type === "in" ? Number(m.quantity) : -Number(m.quantity)
    })
  }

  const lowStock = (products || []).filter((p) => (stockByProduct[p.id] || 0) < Number(p.min_stock))

  const { data: recentMovements } = await supabase
    .from("product_movements")
    .select("id, product_id, type, quantity, movement_date, description, unit_cost, product:products(name, unit)")
    .eq("gardener_id", user!.id)
    .order("movement_date", { ascending: false })
    .limit(10)

  const totalProducts = products?.length || 0
  const totalLowStock = lowStock.length

  // Última compra (entrada com unit_cost)
  const { data: lastInList } = await supabase
    .from("product_movements")
    .select("id, product_id, type, quantity, movement_date, description, unit_cost, product:products(name, unit)")
    .eq("gardener_id", user!.id)
    .eq("type", "in")
    .not("unit_cost", "is", null)
    .order("movement_date", { ascending: false })
    .limit(1)

  const lastIn = (lastInList || [])[0]
  const lastTotal = lastIn ? Number(lastIn.quantity) * Number(lastIn.unit_cost ?? 0) : 0
  const lastTotalRounded = Math.round(lastTotal * 100) / 100
  const lastDateISO = lastIn ? new Date(lastIn.movement_date).toISOString().slice(0, 10) : null

  // Tenta localizar o lançamento financeiro correspondente (heurística: data e valor iguais, pago)
  let lastExpense: any = null
  if (lastIn && lastDateISO) {
    const { data: expenseCandidates } = await supabase
      .from("financial_transactions")
      .select("id, amount, transaction_date, status, category:financial_categories(name, parent_id)")
      .eq("gardener_id", user!.id)
      .eq("type", "expense")
      .eq("status", "paid")
      .eq("transaction_date", lastDateISO)
      .eq("amount", lastTotalRounded)
      .limit(1)
    lastExpense = (expenseCandidates || [])[0] || null
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Estoque</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild size="icon" className="h-10 w-10 rounded-full">
            <Link href="/dashboard/stock/products/new">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Novo produto</span>
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/stock/movements/new">Nova movimentação</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-red-600">{totalLowStock}</p>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Últimas entradas/saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentMovements?.length || 0}</p>
            <p className="text-xs text-muted-foreground">10 mais recentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos e saldo atual</CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <div className="grid gap-2">
              {products.map((p) => {
                const stock = stockByProduct[p.id] || 0
                const isLow = stock < Number(p.min_stock)
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Unidade: {p.unit} • Mínimo: {number(Number(p.min_stock))}</p>
                    </div>
                    <div className="text-right">
                      <p className={isLow ? "text-lg font-bold text-red-600" : "text-lg font-bold"}>{number(stock)} {p.unit}</p>
                      <p className="text-xs text-muted-foreground">Custo: R$ {number(Number(p.cost))}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da última compra</CardTitle>
        </CardHeader>
        <CardContent>
          {lastIn ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lastIn.product?.name}</p>
                  <p className="text-xs text-muted-foreground">{number(Number(lastIn.quantity))} {lastIn.product?.unit} • Unitário: {currency(Number(lastIn.unit_cost))}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{currency(lastTotal)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(lastIn.movement_date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{lastIn.description || "(sem descrição)"}</span>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/finance">Abrir Financeiro</Link>
                  </Button>
                  {lastExpense ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/finance/transactions/${lastExpense.id}`}>Lançamento #{lastExpense.id}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem compras com custo registradas.</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="recent" className="mt-2">
        <TabsList>
          <TabsTrigger value="recent">Movimentações recentes</TabsTrigger>
          <TabsTrigger value="outs">Saídas</TabsTrigger>
          <TabsTrigger value="ins">Entradas</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="mt-4">
          {recentMovements && recentMovements.length > 0 ? (
            <div className="grid gap-2">
              {recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    {m.type === "in" ? (
                      <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{m.product?.name} ({number(Number(m.quantity))} {m.product?.unit})</p>
                      <p className="text-xs text-muted-foreground">{m.description || "(sem descrição)"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(m.movement_date).toLocaleDateString("pt-BR")}</p>
                    {m.unit_cost ? (
                      <p className="text-xs text-muted-foreground">Unitário: R$ {number(Number(m.unit_cost))}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem movimentações.</p>
          )}
        </TabsContent>
        <TabsContent value="outs" className="mt-4">
          {recentMovements && recentMovements.filter((m) => m.type === "out").length > 0 ? (
            <div className="grid gap-2">
              {recentMovements.filter((m) => m.type === "out").map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">{m.product?.name} ({number(Number(m.quantity))} {m.product?.unit})</p>
                      <p className="text-xs text-muted-foreground">{m.description || "(sem descrição)"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(m.movement_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem saídas.</p>
          )}
        </TabsContent>
        <TabsContent value="ins" className="mt-4">
          {recentMovements && recentMovements.filter((m) => m.type === "in").length > 0 ? (
            <div className="grid gap-2">
              {recentMovements.filter((m) => m.type === "in").map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium">{m.product?.name} ({number(Number(m.quantity))} {m.product?.unit})</p>
                      <p className="text-xs text-muted-foreground">{m.description || "(sem descrição)"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(m.movement_date).toLocaleDateString("pt-BR")}</p>
                    {m.unit_cost ? (
                      <p className="text-xs text-muted-foreground">Unitário: R$ {number(Number(m.unit_cost))}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem entradas.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}