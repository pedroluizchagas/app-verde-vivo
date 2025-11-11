"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
      router.refresh()
    } catch (e) {
      console.error("Erro ao sair:", e)
    }
  }
  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" /> Sair
    </Button>
  )
}