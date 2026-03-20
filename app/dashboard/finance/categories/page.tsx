import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CategoryForm } from "@/components/finance/category-form"
import { CategorySeedButton } from "@/components/finance/category-seed"
import {
  ArrowLeft,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
} from "lucide-react"

export default async function FinanceCategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from("financial_categories")
    .select("id, name, parent_id, kind")
    .eq("gardener_id", user!.id)
    .order("name")

  const allCategories = (categories || []) as {
    id: string
    name: string
    parent_id: string | null
    kind: "expense" | "income" | null
  }[]

  const parents = allCategories.filter((c) => c.parent_id === null)
  const children = allCategories.filter((c) => c.parent_id !== null)

  const childrenByParent: Record<string, { id: string; name: string }[]> = {}
  children.forEach((c) => {
    const key = String(c.parent_id)
    childrenByParent[key] = childrenByParent[key] || []
    childrenByParent[key].push({ id: c.id, name: c.name })
  })

  const incomeParents = parents.filter((p) => p.kind === "income")
  const expenseParents = parents.filter((p) => p.kind === "expense")
  const uncategorizedParents = parents.filter((p) => p.kind == null)

  const incomeChildCount = children.filter((c) => {
    const parent = parents.find((p) => p.id === c.parent_id)
    return parent?.kind === "income"
  }).length
  const expenseChildCount = children.filter((c) => {
    const parent = parents.find((p) => p.id === c.parent_id)
    return parent?.kind === "expense"
  }).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/finance">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {allCategories.length} categoria
              {allCategories.length !== 1 ? "s" : ""} cadastrada
              {allCategories.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {allCategories.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {parents.length} grupo{parents.length !== 1 ? "s" : ""} +{" "}
              {children.length} subcategoria
              {children.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Receita
              </span>
              <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight text-emerald-600 dark:text-emerald-400">
              {incomeParents.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              grupo{incomeParents.length !== 1 ? "s" : ""} · {incomeChildCount}{" "}
              subcategoria{incomeChildCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Despesa
              </span>
              <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight text-red-500 dark:text-red-400">
              {expenseParents.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              grupo{expenseParents.length !== 1 ? "s" : ""} · {expenseChildCount}{" "}
              subcategoria{expenseChildCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de nova categoria */}
      <Card className="py-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <h2 className="text-[14px] font-semibold">Nova categoria</h2>
          </div>
          <CategoryForm parents={parents} />
        </CardContent>
      </Card>

      {/* Categorias sugeridas */}
      <Card className="py-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Categorias sugeridas</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Adicione automaticamente grupos pré-definidos de receitas e
                  despesas comuns para jardinagem.
                </p>
              </div>
            </div>
            <CategorySeedButton />
          </div>
        </CardContent>
      </Card>

      {/* Árvore de categorias */}
      {allCategories.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Receitas */}
          {incomeParents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Receitas
                </h3>
                <div className="flex-1 h-px bg-emerald-500/20" />
              </div>
              <div className="flex flex-col gap-2">
                {incomeParents.map((p) => (
                  <CategoryTreeCard
                    key={p.id}
                    parent={p}
                    subcategories={childrenByParent[p.id] || []}
                    kind="income"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Despesas */}
          {expenseParents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500 dark:text-red-400 shrink-0" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">
                  Despesas
                </h3>
                <div className="flex-1 h-px bg-red-500/20" />
              </div>
              <div className="flex flex-col gap-2">
                {expenseParents.map((p) => (
                  <CategoryTreeCard
                    key={p.id}
                    parent={p}
                    subcategories={childrenByParent[p.id] || []}
                    kind="expense"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sem tipo */}
          {uncategorizedParents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sem tipo
                </h3>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <div className="flex flex-col gap-2">
                {uncategorizedParents.map((p) => (
                  <CategoryTreeCard
                    key={p.id}
                    parent={p}
                    subcategories={childrenByParent[p.id] || []}
                    kind={null}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {allCategories.length === 0 && (
        <Card className="py-0">
          <CardContent className="p-8 text-center">
            <p className="text-[13px] text-muted-foreground">
              Nenhuma categoria criada. Use o formulário acima ou adicione as
              categorias sugeridas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CategoryTreeCard({
  parent,
  subcategories,
  kind,
}: {
  parent: { id: string; name: string }
  subcategories: { id: string; name: string }[]
  kind: "income" | "expense" | null
}) {
  const borderColor =
    kind === "income"
      ? "border-l-emerald-500"
      : kind === "expense"
        ? "border-l-red-400"
        : "border-l-border"

  return (
    <Card className={`py-0 border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <p className="font-semibold text-[14px] leading-tight mb-2">
          {parent.name}
        </p>
        {subcategories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((ch) => (
              <span
                key={ch.id}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {ch.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            Sem subcategorias
          </p>
        )}
      </CardContent>
    </Card>
  )
}
