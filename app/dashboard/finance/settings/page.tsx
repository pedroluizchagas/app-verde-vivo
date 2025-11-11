import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PreferencesForm } from "@/components/finance/preferences-form"
import { ArrowLeft, Settings } from "lucide-react"

export default async function FinanceSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("credit_card_due_day, default_pending_days, default_product_margin_pct")
    .eq("gardener_id", user!.id)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="rounded-full"><Link href="/dashboard/finance"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Preferências financeiras</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vencimento, pendências e margem</CardTitle>
        </CardHeader>
        <CardContent>
          <PreferencesForm initial={prefs || {}} />
        </CardContent>
      </Card>
    </div>
  )
}