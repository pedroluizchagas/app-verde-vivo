import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf, Calendar, Users, FileText, Camera, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary">VerdeVivo</span>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Começar</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Gerencie seu negócio de jardinagem com facilidade
          </h1>
          <p className="text-xl text-muted-foreground text-balance">
            Organize clientes, agendamentos, orçamentos e fotos em um só lugar. Profissional, simples e feito para
            jardineiros.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg">
              <Link href="/auth/sign-up">Começar gratuitamente</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg bg-transparent">
              <Link href="/auth/login">Fazer login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Tudo que você precisa para crescer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
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

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Pronto para transformar seu negócio?</h2>
          <p className="text-lg mb-8 opacity-90">Junte-se aos jardineiros que já estão crescendo com o VerdeVivo</p>
          <Button asChild size="lg" variant="secondary" className="text-lg text-primary">
            <Link href="/auth/sign-up">Criar conta gratuita</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>© 2025 VerdeVivo. Todos os Direitos Reservados.</p>
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
    <div className="bg-card border rounded-xl p-6 space-y-3 hover:shadow-lg transition-shadow">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
