"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Package,
  Bot,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  ListTodo,
  CalendarCheck,
  ClipboardList,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const sections: Array<{
  title: string
  items: { href: string; icon: any; label: string }[]
}> = [
  {
    title: "Menu Principal",
    items: [
      { href: "/dashboard", icon: Home, label: "Visao Geral" },
      { href: "/dashboard/clients", icon: Users, label: "Clientes" },
      { href: "/dashboard/schedule", icon: Calendar, label: "Agenda" },
      { href: "/dashboard/work-orders", icon: ClipboardList, label: "Ordens de servico" },
      { href: "/dashboard/budgets", icon: FileText, label: "Orcamentos" },
      { href: "/dashboard/notes", icon: StickyNote, label: "Notas" },
      { href: "/dashboard/tasks", icon: ListTodo, label: "Tarefas" },
    ],
  },
  {
    title: "Negocios",
    items: [
      { href: "/dashboard/finance", icon: BarChart3, label: "Financeiro" },
      { href: "/dashboard/stock", icon: Package, label: "Estoque" },
      { href: "/dashboard/maintenance", icon: CalendarCheck, label: "Manutencoes" },
      { href: "/dashboard/assistant", icon: Bot, label: "Assistente" },
    ],
  },
  {
    title: "Configuracoes",
    items: [
      { href: "/dashboard/profile", icon: UserIcon, label: "Perfil" },
    ],
  },
]

export function Sidebar({
  profile,
}: {
  profile?: { full_name: string | null; avatar_url: string | null }
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("sidebar.collapsed") === "true"
    } catch {
      return false
    }
  })
  const userName = profile?.full_name ?? null
  const avatarUrl = profile?.avatar_url ?? null

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem("sidebar.collapsed", String(next))
    } catch {}
  }

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "hidden md:flex md:flex-col bg-sidebar text-sidebar-foreground transition-all md:sticky md:top-0 md:h-svh",
        collapsed ? "md:w-16" : "md:w-64"
      )}
    >
      {/* Header with logo */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border px-3 py-4",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 flex-1">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">I</span>
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Iris</p>
                <p className="text-[10px] text-sidebar-foreground/50">
                  Jardinagem
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Minimizar sidebar"
              className="text-sidebar-foreground/50 h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Expandir sidebar"
            className="text-sidebar-foreground/50 h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search bar */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent px-3 py-2.5">
            <Search className="h-4 w-4 text-sidebar-foreground/30 shrink-0" />
            <span className="text-xs text-sidebar-foreground/30">
              Pesquise aqui...
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 min-h-0 overflow-y-auto",
          collapsed ? "px-1 py-2" : "px-2 py-1"
        )}
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-2">
            {!collapsed && (
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/35 font-medium">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "relative flex items-center rounded-xl py-2.5 text-sm transition-colors",
                      collapsed ? "justify-center px-2" : "gap-3 px-3",
                      isActive
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="sidebar-active-indicator absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary"
                      />
                    )}
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer with avatar */}
      <div
        className={cn(
          "border-t border-sidebar-border",
          collapsed ? "px-2 py-3" : "px-4 py-4"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-sidebar-border shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl || "/placeholder-user.jpg"}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight truncate">
                  {userName || "Usuario"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/35">
                  Iris {new Date().getFullYear()}
                </p>
              </div>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
