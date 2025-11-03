import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch stats
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)

  const { count: appointmentsCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .eq("status", "scheduled")

  const { count: budgetsCount } = await supabase
    .from("budgets")
    .select("*", { count: "exact", head: true })
    .eq("gardener_id", user!.id)
    .eq("status", "pending")

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single()

  const stats = [
    {
      title: "Clientes",
      value: clientsCount || 0,
      icon: Users,
      href: "/dashboard/clients",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Agendamentos",
      value: appointmentsCount || 0,
      icon: Calendar,
      href: "/dashboard/schedule",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Orçamentos",
      value: budgetsCount || 0,
      icon: FileText,
      href: "/dashboard/budgets",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-balance">Olá, {profile?.full_name || "Jardineiro"}</h1>
        <p className="text-sm text-muted-foreground">Bem-vindo ao VerdeVivo</p>
      </div>

      <div className="grid gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={cn("rounded-xl p-3", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild className="w-full justify-start bg-transparent" variant="outline">
            <Link href="/dashboard/clients/new">
              <Users className="mr-2 h-4 w-4" />
              Adicionar cliente
            </Link>
          </Button>
          <Button asChild className="w-full justify-start bg-transparent" variant="outline">
            <Link href="/dashboard/schedule/new">
              <Calendar className="mr-2 h-4 w-4" />
              Novo agendamento
            </Link>
          </Button>
          <Button asChild className="w-full justify-start bg-transparent" variant="outline">
            <Link href="/dashboard/budgets/new">
              <FileText className="mr-2 h-4 w-4" />
              Criar orçamento
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
