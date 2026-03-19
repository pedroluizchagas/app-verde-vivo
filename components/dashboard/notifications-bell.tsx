"use client"

import { Bell } from "lucide-react"
import { useNotifications } from "./notifications-context"

export function NotificationsBell() {
  const { isOpen, toggle } = useNotifications()

  return (
    <button
      onClick={toggle}
      aria-label="Abrir notificações"
      className={`h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-accent transition-all duration-300 ${
        isOpen ? "opacity-0 pointer-events-none scale-75" : "opacity-100 scale-100"
      }`}
    >
      <Bell className="h-4 w-4" />
    </button>
  )
}
