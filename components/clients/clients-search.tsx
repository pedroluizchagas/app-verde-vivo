"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function ClientsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("q", value)
      } else {
        params.delete("q")
      }
      router.replace(`/dashboard/clients?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Buscar por nome, telefone ou endereço..."
        className="h-11 pl-9"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={handleSearch}
      />
    </div>
  )
}
