import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { LogoutButton } from "@/components/profile/logout-button"
import { PreferencesForm } from "@/components/finance/preferences-form"
import { BrandForm } from "@/components/profile/brand-form"
import { User, LogOut, Settings } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, phone")
    .eq("id", user!.id)
    .maybeSingle()

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("credit_card_due_day, default_pending_days, default_product_margin_pct")
    .eq("gardener_id", user!.id)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="rounded-full"><Link href="/dashboard"><User className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Perfil e Preferências</h1>
        {/* Ação de sair está disponível no cabeçalho abaixo via componente client */}
      </div>

      {/* Cabeçalho com avatar e resumo */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border bg-muted overflow-hidden">
              {/* Avatar */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile?.avatar_url || "/placeholder-user.jpg"} alt="Avatar"
                   className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Olá,</p>
            <h2 className="text-xl font-bold">{profile?.full_name || "Jardineiro"}</h2>
            <p className="text-sm text-muted-foreground">Bem-vindo ao VerdeVivo</p>
          </div>
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>

      {/* Upload de avatar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Foto de perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload />
            </CardContent>
          </Card>
        </div>

        {/* Preferências do usuário */}
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
            </CardHeader>
            <CardContent>
              <PreferencesForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{"Empresa e marca d'água"}</CardTitle>
            </CardHeader>
            <CardContent>
              <BrandForm />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Espaço futuro para assinatura */}
      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Em breve: gestão de plano e cobrança.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// logout button is a client component imported from components/profile/logout-button
