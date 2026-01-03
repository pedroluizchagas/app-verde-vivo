"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Sprout, Droplets } from "lucide-react"

export function MaintenancePlanHeaderCard({ plan, client }: { plan: any; client?: any }) {
  const title = String(plan?.title || "Plano de manutenção")
  const address = String(client?.address || "")
  const desc = String(plan?.default_description || "")
  const sun = /sol\s*pleno/i.test(desc) ? "Sol pleno" : null
  const waterMatch = desc.match(/rega\s*(\d+)x/i)
  const water = waterMatch ? `Rega ${waterMatch[1]}x` : null
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <Sprout className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{client?.name || "Cliente"}</p>
          {address && <p className="text-xs text-muted-foreground">{address}</p>}
          <div className="mt-1 flex items-center gap-4 text-xs">
            {sun && <span className="flex items-center gap-1"><Sprout className="h-3 w-3" />{sun}</span>}
            {water && <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{water}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

