import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Users, UserCheck, UserPlus } from "lucide-react"
import Link from "next/link"
import { ClientCard } from "@/components/clients/client-card"
import { ClientsSearch } from "@/components/clients/clients-search"
import { Card, CardContent } from "@/components/ui/card"

function groupAlphabetically(clients: any[]) {
  const sorted = [...clients].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  )
  const groups = new Map<string, any[]>()
  for (const client of sorted) {
    const letter = client.name.charAt(0).toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(client)
  }
  return Array.from(groups.entries())
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const query = (typeof sp.q === "string" ? sp.q : "").toLowerCase()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("gardener_id", user!.id)
    .order("created_at", { ascending: false })

  const allClients = clients || []

  // KPI: novos este mes
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = allClients.filter(
    (c) => new Date(c.created_at) >= monthStart
  ).length

  // KPI: ativos (com agendamento nos ultimos 30 dias)
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  const { data: recentAppointments } = await supabase
    .from("appointments")
    .select("client_id")
    .eq("gardener_id", user!.id)
    .gte("scheduled_date", since30.toISOString())

  const activeCount = new Set(
    (recentAppointments || []).map((a) => a.client_id).filter(Boolean)
  ).size

  const filtered = query
    ? allClients.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.address?.toLowerCase().includes(query)
      )
    : allClients

  const alphabeticalGroups = !query ? groupAlphabetically(filtered) : null

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {allClients.length} cliente{allClients.length !== 1 ? "s" : ""}{" "}
            cadastrado{allClients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 rounded-full">
          <Link href="/dashboard/clients/new">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Adicionar cliente</span>
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {allClients.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              cliente{allClients.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Novos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">
              {newThisMonth}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">este mês</p>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Ativos
              </span>
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[22px] font-bold leading-tight">{activeCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Suspense
        fallback={<div className="h-11 rounded-xl bg-muted animate-pulse" />}
      >
        <ClientsSearch />
      </Suspense>

      {/* Lista */}
      {filtered.length > 0 ? (
        query ? (
          /* Resultado de busca: lista flat com contador */
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-muted-foreground">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}{" "}
              para &ldquo;{query}&rdquo;
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </div>
        ) : (
          /* Lista completa: agrupada alfabeticamente */
          <div className="flex flex-col gap-5">
            {alphabeticalGroups!.map(([letter, group]) => (
              <div key={letter}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                    {letter}
                  </h3>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {group.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : allClients.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">Nenhum resultado encontrado</h3>
            <p className="text-sm text-muted-foreground text-balance">
              Tente buscar por outro nome, telefone ou endereço
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">Nenhum cliente cadastrado</h3>
            <p className="text-sm text-muted-foreground text-balance">
              Adicione seu primeiro cliente para começar
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/clients/new">Adicionar cliente</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
