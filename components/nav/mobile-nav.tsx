"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Users, Calendar, FileText, BarChart3, Package, Bot, User as UserIcon, StickyNote, ListTodo, Sprout } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/clients", icon: Users, label: "Clientes" },
  { href: "/dashboard/services", icon: Sprout, label: "Serviços" },
  { href: "/dashboard/schedule", icon: Calendar, label: "Agenda" },
  { href: "/dashboard/budgets", icon: FileText, label: "Orçamentos" },
  { href: "/dashboard/notes", icon: StickyNote, label: "Notas" },
  { href: "/dashboard/tasks", icon: ListTodo, label: "Tarefas" },
  { href: "/dashboard/finance", icon: BarChart3, label: "Financeiro" },
  { href: "/dashboard/stock", icon: Package, label: "Estoque" },
  { href: "/dashboard/assistant", icon: Bot, label: "Assistente" },
  { href: "/dashboard/profile", icon: UserIcon, label: "Perfil" },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Logout removido do nav — agora disponível na página de Perfil */}
      </div>
    </nav>
  )
}
