"use client"

import { createContext, useContext, useState } from "react"

type NotificationsContextType = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <NotificationsContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((v) => !v),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error("useNotifications fora do NotificationsProvider")
  return ctx
}
