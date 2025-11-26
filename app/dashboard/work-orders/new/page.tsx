import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { WorkOrderForm } from "@/components/work-orders/work-order-form"

export default async function NewWorkOrderPage({ searchParams }: { searchParams: Promise<{ appointment?: string }> }) {
  const { appointment } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("gardener_id", user!.id)
    .order("name")

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, title, client_id, scheduled_date, labor_cost")
    .eq("gardener_id", user!.id)
    .order("scheduled_date", { ascending: false })
    .limit(50)

  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, cost")
    .eq("gardener_id", user!.id)
    .order("name")

  let defaultClientId: string | null = null
  let defaultTitle: string | null = null
  let defaultLaborCost = 0
  let defaultMarkupPct = 0
  let defaultItems: { product_id: string; quantity: number; unit_cost: number; unit_price: number }[] = []

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("default_product_margin_pct")
    .eq("gardener_id", user!.id)
    .maybeSingle()
  defaultMarkupPct = Number((prefs as any)?.default_product_margin_pct ?? 0)

  if (appointment) {
    const { data: ap } = await supabase
      .from("appointments")
      .select("id, title, client_id, scheduled_date, labor_cost")
      .eq("id", appointment)
      .eq("gardener_id", user!.id)
      .maybeSingle()
    if (ap) {
      defaultClientId = (ap as any).client_id || null
      defaultTitle = (ap as any).title || null
      defaultLaborCost = Number((ap as any).labor_cost || 0)
      const { data: usedMaterials } = await supabase
        .from("product_movements")
        .select("product_id, quantity, unit_cost, product:products(cost, unit)")
        .eq("gardener_id", user!.id)
        .eq("appointment_id", ap.id)
        .eq("type", "out")
      defaultItems = (usedMaterials || []).map((m: any) => {
        const base = Number(m.unit_cost ?? m.product?.cost ?? 0)
        const price = base * (1 + (Number(defaultMarkupPct) > 0 ? Number(defaultMarkupPct) / 100 : 0))
        return { product_id: String(m.product_id), quantity: Number(m.quantity), unit_cost: base, unit_price: price, unit: String(m.product?.unit || "un") }
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/work-orders">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nova ordem de serviço</h1>
      </div>

      <WorkOrderForm
        clients={clients || []}
        appointments={appointments || []}
        products={products || []}
        defaultAppointmentId={appointment || null}
        defaultClientId={defaultClientId}
        defaultTitle={defaultTitle || undefined}
        defaultLaborCost={defaultLaborCost}
        defaultMarkupPct={defaultMarkupPct}
        defaultItems={defaultItems}
      />
    </div>
  )
}