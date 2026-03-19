import type React from "react"
import { redirect } from "next/navigation"
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
    .select("full_name, avatar_url")
    .eq("id", user!.id)
    .maybeSingle()

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
