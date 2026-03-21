import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { IrisChat } from "@/components/dashboard/iris-chat"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Lock, ArrowRight } from "lucide-react"

export default async function AssistantPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.plan !== "plus") {
    return (
      <div className="flex flex-col gap-4">
        <Card className="py-0">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Sparkles className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-[15px] leading-tight">Iris</p>
                <p className="text-[11px] text-muted-foreground">
                  Assistente de jardinagem com IA
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Plano Plus</span>
              </div>
            </div>

            {/* Upgrade prompt */}
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-14 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>

              <div className="max-w-sm">
                <p className="font-bold text-lg leading-tight">
                  A Iris esta disponivel no Plano Plus
                </p>
                <p className="text-sm text-muted-foreground mt-2 text-balance">
                  Com a Iris voce agenda servicos, registra financeiro, gerencia
                  estoque e muito mais — tudo por texto ou voz, em portugues natural.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full max-w-xs">
                <div className="flex flex-col gap-1.5 text-sm text-left">
                  {[
                    "Comandos por texto e por voz",
                    "Criacao de agendamentos e clientes",
                    "Lancamento de receitas e despesas",
                    "Gestao de estoque por comando de voz",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <Button asChild className="mt-2 w-full gap-2">
                  <Link href="/dashboard/plan">
                    Ver planos e assinar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                {profile?.plan === "basic" && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Voce esta no Plano Basico. Faca upgrade para o Plus.
                  </p>
                )}
                {!profile?.plan && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Voce ainda nao possui um plano ativo.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <IrisChat />
}
