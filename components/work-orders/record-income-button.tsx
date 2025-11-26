"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function RecordIncomeButton({ orderId, amount, clientId, title }: { orderId: string; amount: number; clientId: string; title: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  return (
    <div className="flex items-center gap-2">
      <Button disabled={loading} onClick={async () => {
        setLoading(true)
        setError(null)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error("Não autenticado")
          const today = new Date().toISOString().slice(0, 10)
          const { data: trx, error: terr } = await supabase
            .from("financial_transactions")
            .insert([
              {
                gardener_id: user.id,
                type: "income",
                amount,
                transaction_date: today,
                description: title || "Serviço",
                category_id: null,
                client_id: clientId,
                status: "pending",
                due_date: today,
                paid_at: null,
              },
            ])
            .select("id")
            .single()
          if (terr) throw terr
          const { error: uerr } = await supabase
            .from("service_orders")
            .update({ transaction_id: (trx as any)?.id })
            .eq("id", orderId)
          if (uerr) throw uerr
          router.push(`/dashboard/finance/transactions/${(trx as any)?.id}`)
          router.refresh()
        } catch (err: any) {
          setError(err?.message || "Erro ao gerar receita")
        } finally {
          setLoading(false)
        }
      }}>Gerar receita</Button>
      {error && <span className="text-destructive text-sm">{error}</span>}
    </div>
  )
}