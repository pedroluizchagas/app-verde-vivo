import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MobileNav } from "@/components/nav/mobile-nav"
import { Sidebar } from "@/components/nav/sidebar"
import { PageTransition } from "@/components/ui/page-transition"

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
      <div className="flex flex-1 flex-col overflow-hidden md:py-3 md:pr-3">
        <main className="flex-1 md:rounded-3xl bg-background overflow-hidden pb-20 md:pb-0">
          <div className="h-full overflow-y-auto">
            <PageTransition>
              <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
                {children}
              </div>
            </PageTransition>
          </div>
        </main>
        <div className="md:hidden shrink-0">
          <MobileNav />
        </div>
      </div>
    </div>
  )
}
