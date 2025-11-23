import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf, Calendar, Users, FileText, Camera, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/img/iris.png" alt="Íris" className="h-10 w-auto" />
        </div>
        <div className="flex gap-3">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button asChild className="iris-gradient-btn">
            <Link href="/auth/sign-up">Começar</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="pointer-events-none [mask-image:radial-gradient(closest-side,white,transparent)]">
            <div className="mx-auto h-[480px] w-[480px] md:h-[720px] md:w-[720px] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, #15ABFB 0%, #655FF2 50%, transparent 70%)" }} />
          </div>
        </div>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-balance iris-hero-font">
              Gestão <span className="iris-gradient-text">Profissional</span> de <span className="iris-gradient-text">Jardinagem</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance">
              Íris é o assistente inteligente para jardineiros e equipes: clientes, agenda, orçamentos, financeiro e fotos em um só lugar.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg iris-gradient-btn">
                <Link href="/auth/sign-up">Começar gratuitamente</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link href="/auth/login">Ver demo</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>Clientes</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Agenda</span></div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>Orçamentos</span></div>
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /><span>Financeiro</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Tudo que você precisa para crescer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Gestão de Clientes"
            description="Cadastre e organize todos os seus clientes com informações completas e histórico de serviços."
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8" />}
            title="Agendamentos"
            description="Visualize e gerencie sua agenda de forma simples. Nunca mais perca um compromisso."
          />
          <FeatureCard
            icon={<FileText className="h-8 w-8" />}
            title="Orçamentos"
            description="Crie e acompanhe orçamentos profissionais. Saiba exatamente o status de cada proposta."
          />
          <FeatureCard
            icon={<Camera className="h-8 w-8" />}
            title="Galeria de Fotos"
            description="Registre o antes e depois de cada serviço. Mostre seu trabalho com qualidade."
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Dashboard"
            description="Acompanhe métricas importantes do seu negócio em tempo real."
          />
          <FeatureCard
            icon={<Leaf className="h-8 w-8" />}
            title="Mobile First"
            description="Acesse de qualquer lugar, em qualquer dispositivo. Trabalhe onde estiver."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Como a Íris funciona</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <StepCard index={1} title="Organize" description="Importe clientes, crie serviços e defina sua agenda em minutos." />
          <StepCard index={2} title="Execute" description="Registre fotos, notas e tarefas no app mobile, mesmo em campo." />
          <StepCard index={3} title="Cresça" description="Acompanhe o financeiro, produtividade e orçamentos aprovados." />
        </div>
      </section>

      {/* Audience */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold">Feito para quem vive de jardinagem</h2>
          <p className="text-muted-foreground">Autônomos, pequenas equipes e empresas — a Íris dá estrutura para o seu dia a dia e clareza para o seu crescimento.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-10">
          <AudienceCard title="Autônomos" description="Simplifique sua rotina e passe a cobrar com profissionalismo." />
          <AudienceCard title="Pequenas equipes" description="Centralize agenda e informações para que todos tenham o mesmo foco." />
          <AudienceCard title="Empresas" description="Padronize processos, meça resultados e acelere a expansão." />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute inset-0 -z-10 blur-2xl" style={{ background: "radial-gradient(closest-side, #15ABFB 0%, #655FF2 60%, transparent 70%)" }} />
          <div className="rounded-2xl p-12 text-center border bg-card">
            <h2 className="text-3xl font-bold mb-4">Pronto para transformar seu negócio?</h2>
            <p className="text-lg mb-8 text-muted-foreground">Crie sua conta e dê o próximo passo no seu trabalho</p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="text-lg iris-gradient-btn">
                <Link href="/auth/sign-up">Criar conta gratuita</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link href="/auth/login">Falar com a equipe</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>© 2025 Íris. Todos os Direitos Reservados.</p>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-3 hover:shadow-xl transition-all duration-300">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{index}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function AudienceCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
