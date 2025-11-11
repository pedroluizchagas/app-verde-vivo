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

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar profile={{ full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null }} />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 pb-20 md:pb-0">
          <PageTransition>
            <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
              {children}
            </div>
          </PageTransition>
        </main>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </div>
  )
}
