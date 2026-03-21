import type React from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/nav/sidebar"
import { NotificationsProvider } from "@/components/dashboard/notifications-context"
import { NotificationsShell } from "@/components/dashboard/notifications-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, company_name, company_subtitle, watermark_base64, watermark_fit, plan, trial_ends_at")
    .eq("id", user!.id)
    .maybeSingle()

  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const isOnPlanPage = pathname.startsWith("/dashboard/plan")

  const hasPlan = !!profile?.plan
  const trialActive =
    profile?.trial_ends_at != null && new Date(profile.trial_ends_at) > new Date()
  const hasAccess = hasPlan || trialActive

  if (!hasAccess && !isOnPlanPage) {
    redirect("/dashboard/plan")
  }

  const trialDaysLeft = trialActive
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile!.trial_ends_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const { data: nextAppointment } = await supabase
    .from("appointments")
    .select("id, title, type, scheduled_date, all_day, client:clients(name)")
    .eq("gardener_id", user!.id)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .gte("scheduled_date", now.toISOString())
    .order("scheduled_date", { ascending: true })
    .limit(1)
    .maybeSingle()

  return (
    <div className="flex h-svh bg-sidebar overflow-hidden">
      <Sidebar
        profile={{
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          company_name: (profile as any)?.company_name ?? null,
          company_subtitle: (profile as any)?.company_subtitle ?? null,
          watermark_base64: (profile as any)?.watermark_base64 ?? null,
          watermark_fit: (profile as any)?.watermark_fit ?? "contain",
          plan: (profile as any)?.plan ?? null,
          trial_days_left: hasPlan ? 0 : trialDaysLeft,
        }}
        nextAppointment={
          nextAppointment
            ? {
                id: nextAppointment.id,
                title: nextAppointment.title,
                type: nextAppointment.type,
                scheduled_date: nextAppointment.scheduled_date,
                all_day: nextAppointment.all_day,
                clientName: (nextAppointment.client as any)?.name ?? null,
              }
            : null
        }
      />
      <NotificationsProvider>
        <NotificationsShell>{children}</NotificationsShell>
      </NotificationsProvider>
    </div>
  )
}
