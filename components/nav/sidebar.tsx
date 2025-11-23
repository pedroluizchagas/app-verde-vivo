"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, Users, Calendar, FileText, BarChart3, Package, Bot, User as UserIcon, ChevronLeft, ChevronRight, StickyNote, ListTodo, Sprout, CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const sections: Array<{ title: string; items: { href: string; icon: any; label: string }[] }> = [
  {
    title: "Operação",
    items: [
      { href: "/dashboard", icon: Home, label: "Início" },
      { href: "/dashboard/clients", icon: Users, label: "Clientes" },
      { href: "/dashboard/schedule", icon: Calendar, label: "Agenda" },
      { href: "/dashboard/budgets", icon: FileText, label: "Orçamentos" },
      { href: "/dashboard/notes", icon: StickyNote, label: "Notas" },
      { href: "/dashboard/tasks", icon: ListTodo, label: "Tarefas" },
    ],
  },
  {
    title: "Negócios",
    items: [
      { href: "/dashboard/finance", icon: BarChart3, label: "Financeiro" },
      { href: "/dashboard/stock", icon: Package, label: "Estoque" },
      { href: "/dashboard/services", icon: Sprout, label: "Serviços" },
      { href: "/dashboard/maintenance", icon: CalendarCheck, label: "Manutenções" },
      { href: "/dashboard/assistant", icon: Bot, label: "Assistente" },
    ],
  },
  {
    title: "Configurações",
    items: [
      { href: "/dashboard/profile", icon: UserIcon, label: "Perfil" },
    ],
  },
]

export function Sidebar({ profile }: { profile?: { full_name: string | null; avatar_url: string | null } }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState<string | null>(profile?.full_name ?? null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)

  useEffect(() => {
    const raw = localStorage.getItem("sidebar.collapsed")
    setCollapsed(raw === "true")
  }, [])

  useEffect(() => {
    if (profile) {
      setUserName(profile.full_name ?? null)
      setAvatarUrl(profile.avatar_url ?? null)
      return
    }
    // Fallback fetch on client if no profile was provided from server
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle()
        setUserName(data?.full_name ?? null)
        setAvatarUrl(data?.avatar_url ?? null)
      } catch {}
    })()
  }, [profile])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem("sidebar.collapsed", String(next)) } catch {}
  }

  return (
    <aside data-collapsed={collapsed}
      className={cn(
      "hidden md:flex md:flex-col border-r bg-gradient-to-b from-background to-muted/40 backdrop-blur-sm shadow-sm transition-all md:sticky md:top-0 md:h-svh",
      collapsed ? "md:w-16" : "md:w-64"
    )}>
      <div className={cn("flex items-center px-3 py-3 border-b transition-all", collapsed ? "justify-center" : "gap-3")}
           aria-label="Barra lateral">
        {!collapsed && (
          <div>
            <p className="text-sm leading-tight">Íris</p>
            <p className="text-xs text-muted-foreground">Assistente de Jardinagem</p>
          </div>
        )}
        <div className={cn("ml-auto", collapsed ? "hidden" : "block")}> 
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Minimizar sidebar">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        {collapsed && (
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Expandir sidebar">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className={cn("flex-1 min-h-0 py-2 overflow-y-auto", collapsed ? "px-1" : "px-2")}> 
        <div className={cn("space-y-2", collapsed ? "" : "")}>
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={cn(
                        "relative group flex items-center rounded-md py-2 text-sm transition-colors",
                        collapsed ? "justify-center px-2" : "gap-3 px-3",
                        isActive ? "bg-muted/70 text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="sidebar-active-indicator absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary"
                        />
                      )}
                      <Icon className="h-4 w-4" />
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className={cn("border-t transition-all", collapsed ? "px-2 py-2" : "px-4 py-3")}> 
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}> 
          <div className="w-7 h-7 rounded-full overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl || "/placeholder-user.jpg"} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-xs font-medium leading-tight">{userName || "Usuário"}</p>
              <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Íris</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}