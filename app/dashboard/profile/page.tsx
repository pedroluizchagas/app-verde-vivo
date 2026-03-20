import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { LogoutButton } from "@/components/profile/logout-button"
import { PreferencesForm } from "@/components/finance/preferences-form"
import { BrandForm } from "@/components/profile/brand-form"
import { Phone, Mail, UserCircle, Settings, Sparkles } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, phone")
    .eq("id", user!.id)
    .maybeSingle()

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select(
      "credit_card_due_day, default_pending_days, default_product_margin_pct"
    )
    .eq("gardener_id", user!.id)
    .maybeSingle()

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Gerencie suas informações e preferências
        </p>
      </div>

      {/* Hero do perfil */}
      <Card className="py-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full border-2 border-border bg-muted overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile?.avatar_url || "/placeholder-user.jpg"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[18px] leading-tight truncate">
                {profile?.full_name || "Jardineiro"}
              </p>
              {memberSince && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Membro desde {memberSince}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                {user?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[12px] text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[12px] text-muted-foreground">
                      {profile.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de logout */}
            <div className="shrink-0">
              <LogoutButton />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-4">
          {/* Foto de perfil */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <UserCircle className="h-3 w-3 text-muted-foreground" />
                </div>
                <h2 className="text-[14px] font-semibold">Foto de perfil</h2>
              </div>
              <AvatarUpload />
            </CardContent>
          </Card>

          {/* Empresa e marca d'água */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                </div>
                <h2 className="text-[14px] font-semibold">
                  Empresa e marca d&apos;água
                </h2>
              </div>
              <BrandForm />
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">
          {/* Preferências */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Settings className="h-3 w-3 text-muted-foreground" />
                </div>
                <h2 className="text-[14px] font-semibold">Preferências</h2>
              </div>
              <PreferencesForm
                initial={{
                  credit_card_due_day: prefs?.credit_card_due_day,
                  default_pending_days: prefs?.default_pending_days,
                  default_product_margin_pct: prefs?.default_product_margin_pct,
                }}
              />
            </CardContent>
          </Card>

          {/* Assinatura */}
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <h2 className="text-[14px] font-semibold">Assinatura</h2>
              </div>
              <div className="rounded-xl bg-muted/60 border border-border/60 p-4 text-center">
                <p className="text-[13px] font-medium mb-1">Plano gratuito</p>
                <p className="text-[12px] text-muted-foreground">
                  Gestão completa de planos pagos em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
