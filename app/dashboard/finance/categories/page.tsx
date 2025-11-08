import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/finance/category-form"
import { CategorySeedButton } from "@/components/finance/category-seed"
import { ArrowLeft, FolderTree } from "lucide-react"

export default async function FinanceCategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: categories } = await supabase
    .from("financial_categories")
    .select("id, name, parent_id")
    .eq("gardener_id", user!.id)
    .order("name")

  const parents = (categories || []).filter((c) => c.parent_id === null)
  const children = (categories || []).filter((c) => c.parent_id !== null)
  const childrenByParent: Record<string, { id: string; name: string }[]> = {}
  children.forEach((c) => {
    const key = String(c.parent_id)
    childrenByParent[key] = childrenByParent[key] || []
    childrenByParent[key].push({ id: c.id, name: c.name })
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="rounded-full"><Link href="/dashboard/finance"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FolderTree className="h-6 w-6 text-primary" /> Categorias financeiras</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CategoryForm parents={parents} />
          <CategorySeedButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {parents.length > 0 ? (
            <div className="grid gap-3">
              {parents.map((p) => (
                <div key={p.id} className="rounded-md border p-3">
                  <p className="font-medium">{p.name}</p>
                  <div className="mt-2 grid gap-1">
                    {(childrenByParent[p.id] || []).length > 0 ? (
                      childrenByParent[p.id].map((ch) => (
                        <div key={ch.id} className="text-sm text-muted-foreground">- {ch.name}</div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">(sem subcategorias)</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma categoria criada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}