"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Home, Settings, Users, Calendar, FileText, StickyNote, ListTodo, BarChart3, Package, Bot, CalendarCheck, ClipboardList } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState<null | "operacao" | "negocios" | "config">(null)
  const [closing, setClosing] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="flex items-center justify-around">
        <Link
          href="/dashboard"
          className={cn("flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors", isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">Início</span>
        </Link>

        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (open === "operacao") {
              setClosing(true)
              setTimeout(() => { setOpen(null); setClosing(false) }, 200)
            } else {
              setOpen("operacao")
            }
          }}
        >
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Operação</span>
        </button>

        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (open === "negocios") {
              setClosing(true)
              setTimeout(() => { setOpen(null); setClosing(false) }, 200)
            } else {
              setOpen("negocios")
            }
          }}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="font-medium">Negócios</span>
        </button>

        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (open === "config") {
              setClosing(true)
              setTimeout(() => { setOpen(null); setClosing(false) }, 200)
            } else {
              setOpen("config")
            }
          }}
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Configurações</span>
        </button>
      </div>

      {(open || closing) && (
        <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
          <div className={cn("absolute inset-0 bg-black/40", closing ? "animate-out fade-out-0 duration-200" : "animate-in fade-in-0 duration-200")} onClick={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} />
          <div className={cn("absolute bottom-16 left-0 right-0 mx-4 rounded-lg border bg-card shadow-lg", closing ? "animate-out slide-out-to-bottom-2 fade-out-0 duration-200" : "animate-in slide-in-from-bottom-2 fade-in-0 duration-200")}>
            <div className="p-3">
              {open === "operacao" && (
                <div className="grid grid-cols-2 gap-2">
                  <SheetLink href="/dashboard/clients" icon={Users} label="Clientes" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/clients")} />
                  <SheetLink href="/dashboard/schedule" icon={Calendar} label="Agenda" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/schedule")} />
                  <SheetLink href="/dashboard/work-orders" icon={ClipboardList} label="Ordens de serviço" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/work-orders")} />
                  <SheetLink href="/dashboard/budgets" icon={FileText} label="Orçamentos" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/budgets")} />
                  <SheetLink href="/dashboard/notes" icon={StickyNote} label="Notas" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/notes")} />
                  <SheetLink href="/dashboard/tasks" icon={ListTodo} label="Tarefas" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/tasks")} />
                </div>
              )}
              {open === "negocios" && (
                <div className="grid grid-cols-2 gap-2">
                  <SheetLink href="/dashboard/finance" icon={BarChart3} label="Financeiro" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/finance")} />
                  <SheetLink href="/dashboard/stock" icon={Package} label="Estoque" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/stock")} />
                  <SheetLink href="/dashboard/maintenance" icon={CalendarCheck} label="Manutenções" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/maintenance")} />
                  <SheetLink href="/dashboard/assistant" icon={Bot} label="Assistente" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/assistant")} />
                </div>
              )}
              {open === "config" && (
                <div className="grid grid-cols-2 gap-2">
                  <SheetLink href="/dashboard/profile" icon={Settings} label="Perfil" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/profile")} />
                  <SheetLink href="/dashboard/finance/categories" icon={BarChart3} label="Categorias" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/finance/categories")} />
                  <SheetLink href="/dashboard/finance/settings" icon={BarChart3} label="Financeiro" onClose={() => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false) }, 200) }} active={isActive("/dashboard/finance/settings")} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function SheetLink({ href, icon: Icon, label, onClose, active }: { href: string; icon: any; label: string; onClose: () => void; active?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </Link>
  )
}
