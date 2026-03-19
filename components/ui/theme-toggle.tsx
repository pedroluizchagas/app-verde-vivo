"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const isDark = (resolvedTheme || theme) === "dark"

  const cls = "h-9 w-9 rounded-full border border-border bg-card text-muted-foreground hover:bg-accent"

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Alternar tema" className={cls} disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar tema"
      className={cls}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
