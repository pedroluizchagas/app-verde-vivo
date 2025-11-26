import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { WorkOrderEditForm } from "@/components/work-orders/work-order-edit-form"

export default async function EditWorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: order } = await supabase
    .from("service_orders")
    .select("*, client:clients(id, name), appointment:appointments(id, title)")
    .eq("gardener_id", user!.id)
    .eq("id", id)
    .maybeSingle()
  const { data: items } = await supabase
    .from("service_order_items")
    .select("id, product_id, quantity, unit_cost, unit_price, unit, product:products(name, unit)")
    .eq("order_id", id)
  const { data: clients } = await supabase.from("clients").select("id, name").eq("gardener_id", user!.id).order("name")
  const { data: appointments } = await supabase.from("appointments").select("id, title").eq("gardener_id", user!.id).order("scheduled_date", { ascending: false }).limit(50)
  const { data: products } = await supabase.from("products").select("id, name, unit, cost").eq("gardener_id", user!.id).order("name")

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/work-orders/${id}`}><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Editar OS</h1>
      </div>
      <WorkOrderEditForm order={order} items={items || []} clients={clients || []} appointments={appointments || []} products={products || []} />
    </div>
  )
}