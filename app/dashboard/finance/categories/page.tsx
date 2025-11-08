import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderTree } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/finance/category-form"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from("financial_categories")
    .select("id, name, parent_id")
    .eq("gardener_id", user!.id)
    .order("name")

  const parents = (categories || []).filter((c) => !c.parent_id)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/finance">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FolderTree className="h-6 w-6" />Categorias</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm parents={parents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura atual</CardTitle>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <div className="grid gap-2">
              {parents.map((p) => (
                <div key={p.id}>
                  <p className="font-medium">{p.name}</p>
                  <ul className="ml-4 list-disc text-sm text-muted-foreground">
                    {(categories || [])
                      .filter((c) => c.parent_id === p.id)
                      .map((c) => (
                        <li key={c.id}>{c.name}</li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}