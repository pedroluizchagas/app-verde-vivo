import type React from "react"
import Link from "next/link"
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll"
import {
  Calendar,
  Users,
  FileText,
  Camera,
  TrendingUp,
  Package,
  Sprout,
  CalendarCheck,
  Bot,
  Smartphone,
  Bell,
  WifiOff,
  ArrowRight,
  Zap,
  CheckCircle,
  Check,
  X,
  Sparkles,
} from "lucide-react"

/* ─── Main page ─── */
export default function HomePage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden relative"
      style={{ background: "#070708", color: "#f0f0f0" }}
    >
      {/* ── Fixed ambient background ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Orb 1 – top-left */}
        <div
          className="absolute -top-56 -left-56 w-[760px] h-[760px] rounded-full orb-float-1"
          style={{
            background:
              "radial-gradient(circle, rgba(34,197,94,0.11) 0%, transparent 68%)",
            filter: "blur(2px)",
          }}
        />
        {/* Orb 2 – mid-right */}
        <div
          className="absolute top-1/3 -right-72 w-[640px] h-[640px] rounded-full orb-float-2"
          style={{
            background:
              "radial-gradient(circle, rgba(15,138,65,0.09) 0%, transparent 68%)",
            filter: "blur(2px)",
          }}
        />
        {/* Orb 3 – bottom-center */}
        <div
          className="absolute bottom-0 left-1/4 w-[520px] h-[520px] rounded-full orb-float-1"
          style={{
            background:
              "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 68%)",
            filter: "blur(2px)",
            animationDelay: "-13s",
          }}
        />
      </div>

      {/* ── Navigation ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(7,7,8,0.78)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          borderBottom: "1px solid rgba(255,255,255,0.065)",
        }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <img src="/img/iris.png" alt="Íris" className="h-9 w-auto" />

          <nav className="hidden md:flex items-center">
            <a href="#features" className="landing-nav-link">
              Funcionalidades
            </a>
            <a href="#planos" className="landing-nav-link">
              Planos
            </a>
            <a href="#app-mobile" className="landing-nav-link">
              App Mobile
            </a>
            <a href="#como-funciona" className="landing-nav-link">
              Como funciona
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="landing-nav-link hidden sm:block">
              Entrar
            </Link>
            <Link
              href="/auth/sign-up"
              className="iris-gradient-btn iris-glow-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ color: "#fff" }}
            >
              Criar conta <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20">
        <div className="container mx-auto px-6 text-center max-w-5xl">
          {/* Badge */}
          <div className="animate-slide-up-1 flex justify-center mb-8">
            <span className="landing-badge">
              <Zap className="w-3.5 h-3.5" />
              Planos a partir de R$ 47,90/mês
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up-2 text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.06] tracking-tight mb-6 iris-hero-font">
            Gestão{" "}
            <span className="iris-gradient-text">Profissional</span>
            <br />
            de{" "}
            <span className="iris-gradient-text">Jardinagem</span>
          </h1>

          {/* Subheading */}
          <p
            className="animate-slide-up-3 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.52)" }}
          >
            Clientes, agenda, financeiro, estoque e orçamentos em um só lugar.
            No Plano Plus, conte ainda com a Íris — assistente inteligente
            que entende comandos por texto e voz.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up-4 flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              href="/auth/sign-up"
              className="iris-gradient-btn iris-glow-btn inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold"
              style={{ color: "#fff" }}
            >
              Criar minha conta
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#planos"
              className="landing-outline-btn px-8 py-4 rounded-2xl text-base font-semibold"
            >
              Ver planos e preços
            </a>
          </div>

          {/* Feature pills */}
          <div className="animate-slide-up-5 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: <Users className="w-3.5 h-3.5" />, label: "Clientes" },
              { icon: <Calendar className="w-3.5 h-3.5" />, label: "Agenda" },
              { icon: <FileText className="w-3.5 h-3.5" />, label: "Orçamentos" },
              { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Financeiro" },
              { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Iris IA" },
              { icon: <Smartphone className="w-3.5 h-3.5" />, label: "App Móvel" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm"
                style={{
                  background: "rgba(255,255,255,0.045)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "rgba(255,255,255,0.52)",
                }}
              >
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="relative py-6">
        <div className="container mx-auto px-6 max-w-7xl">
          <div
            className="glass-panel rounded-2xl py-8 px-10 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <StatItem value="500+" label="Jardineiros ativos" />
            <StatItem value="98%" label="Satisfação" />
            <StatItem value="10x" label="Produtividade" />
            <StatItem value="24/7" label="Disponível" />
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="relative py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <AnimateOnScroll>
            <SectionHeader
              badge="Funcionalidades"
              heading={
                <>
                  Tudo que <span className="iris-gradient-text">você</span>{" "}
                  precisa
                  <br />
                  para <span className="iris-gradient-text">crescer</span>
                </>
              }
            />
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            {[
              { icon: <Users />, title: "Clientes", desc: "Cadastro completo, histórico e contatos sempre à mão." },
              { icon: <Calendar />, title: "Agenda", desc: "Planeje serviços e receba lembretes no dia certo." },
              { icon: <FileText />, title: "Orçamentos", desc: "Propostas profissionais com status e aprovação rápida." },
              { icon: <TrendingUp />, title: "Financeiro", desc: "Receitas, despesas e previsões para não perder prazos." },
              { icon: <Package />, title: "Estoque", desc: "Produtos, entradas e saídas com custo e margem." },
              { icon: <Sprout />, title: "Serviços", desc: "Catálogo de serviços com preços e descrição." },
              { icon: <CalendarCheck />, title: "Manutenções", desc: "Planos recorrentes e tarefas mensais automáticas." },
              { icon: <Bot />, title: "Assistente IA", desc: "Ajuda inteligente para textos, tarefas e organização." },
              { icon: <Camera />, title: "Fotos", desc: "Antes e depois para destacar seu trabalho." },
            ].map(({ icon, title, desc }, i) => (
              <AnimateOnScroll key={title} delay={i * 70}>
                <GlassFeatureCard icon={icon} title={title} description={desc} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing section ── */}
      <section id="planos" className="relative py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <AnimateOnScroll>
            <SectionHeader
              badge="Planos"
              heading={
                <>
                  Simples, transparente{" "}
                  <br />e{" "}
                  <span className="iris-gradient-text">sem surpresas</span>
                </>
              }
              sub="Escolha o plano ideal para o seu negócio. Pague via PIX, boleto ou cartão. Cancele quando quiser."
            />
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-6 mt-16 max-w-3xl mx-auto">
            {/* Plano Basico */}
            <AnimateOnScroll delay={0}>
              <div
                className="glass-panel rounded-2xl p-8 flex flex-col gap-6 h-full"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Basico
                  </p>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-4xl font-extrabold">R$ 47,90</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>/mês</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                    Todas as ferramentas essenciais para gerenciar seu negócio de jardinagem.
                  </p>
                </div>

                <ul className="flex-1 space-y-3">
                  {[
                    "Clientes ilimitados",
                    "Agenda e agendamentos",
                    "Financeiro e fluxo de caixa",
                    "Estoque e produtos",
                    "Orçamentos e ordens de serviço",
                    "Planos de manutenção recorrente",
                    "Notas e tarefas",
                    "App móvel (Android e iOS)",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span style={{ color: "rgba(255,255,255,0.70)" }}>{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-sm opacity-35">
                    <X className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.40)" }} />
                    <span className="line-through" style={{ color: "rgba(255,255,255,0.40)" }}>Assistente Íris com IA</span>
                  </li>
                </ul>

                <Link
                  href="/auth/sign-up"
                  className="landing-outline-btn w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
                >
                  Assinar Basico
                </Link>
              </div>
            </AnimateOnScroll>

            {/* Plano Plus */}
            <AnimateOnScroll delay={160}>
              <div className="relative rounded-2xl p-8 flex flex-col gap-6 h-full" style={{
                background: "linear-gradient(145deg, rgba(15,138,65,0.14) 0%, rgba(7,7,8,0.90) 55%)",
                border: "1px solid rgba(34,197,94,0.28)",
                boxShadow: "0 0 40px rgba(34,197,94,0.08)",
              }}>
                {/* Recommended badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: "linear-gradient(90deg, #16a34a, #22c55e)",
                      color: "#fff",
                    }}
                  >
                    <Sparkles className="w-3 h-3" /> Recomendado
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-green-400">
                    Plus
                  </p>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-4xl font-extrabold">R$ 77,90</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>/mês</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                    Tudo do Básico mais o poder da inteligência artificial no seu dia a dia.
                  </p>
                </div>

                <ul className="flex-1 space-y-3">
                  {[
                    "Tudo do plano Básico",
                    "Assistente Íris com IA",
                    "Comandos por texto e por voz",
                    "Agendamento por comando de voz",
                    "Lançamento financeiro por voz",
                    "Gestão de estoque por voz",
                  ].map((f, i) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${i === 0 ? "text-green-400" : "text-green-400"}`} />
                      <span style={{ color: i >= 1 ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.70)" }}>
                        {i >= 1 && (
                          <Sparkles
                            className="inline w-3 h-3 mr-1 text-green-400 opacity-70"
                            style={{ verticalAlign: "middle" }}
                          />
                        )}
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/sign-up"
                  className="iris-gradient-btn iris-glow-btn w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
                  style={{ color: "#fff" }}
                >
                  Assinar Plus <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Payment note */}
          <AnimateOnScroll delay={240}>
            <p className="text-center text-sm mt-8" style={{ color: "rgba(255,255,255,0.28)" }}>
              Pagamento seguro via{" "}
              <span style={{ color: "rgba(255,255,255,0.50)" }}>Asaas</span>
              {" "}— PIX, boleto ou cartão de crédito. Cancele a qualquer momento.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Mobile app section ── */}
      <section id="app-mobile" className="relative py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <AnimateOnScroll>
              <div>
                <span className="landing-badge mb-6 inline-flex">App Móvel</span>
                <h2 className="text-4xl md:text-5xl font-bold iris-hero-font mt-4 mb-6 leading-tight">
                  <span className="iris-gradient-text">Trabalhe em campo</span>
                  <br />
                  com tudo na palma
                  <br />
                  da mão
                </h2>
                <p
                  className="text-lg mb-8 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.52)" }}
                >
                  Leve a Íris no bolso: registre fotos e notas em tempo real,
                  consulte clientes e agenda, e mantenha tudo sincronizado com
                  seu painel web.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mb-10">
                  <MobileFeatureItem
                    icon={<WifiOff className="w-4 h-4" />}
                    title="Modo offline"
                    description="Continue trabalhando sem internet e sincronize depois."
                  />
                  <MobileFeatureItem
                    icon={<Bell className="w-4 h-4" />}
                    title="Lembretes"
                    description="Notificações de agendamentos e pendências."
                  />
                  <MobileFeatureItem
                    icon={<Camera className="w-4 h-4" />}
                    title="Fotos em campo"
                    description="Registre o antes e depois direto do celular."
                  />
                  <MobileFeatureItem
                    icon={<Smartphone className="w-4 h-4" />}
                    title="Instalável"
                    description="Disponível para Android e iOS."
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/auth/sign-up"
                    className="iris-gradient-btn iris-glow-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold"
                    style={{ color: "#fff" }}
                  >
                    Criar conta e usar o app
                  </Link>
                  <Link
                    href="/auth/login"
                    className="landing-outline-btn px-6 py-3.5 rounded-xl font-semibold"
                  >
                    Entrar
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Card side */}
            <AnimateOnScroll delay={180}>
              <div className="glass-panel rounded-3xl p-8 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-green-400"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(15,138,65,0.32), rgba(34,197,94,0.16))",
                      border: "1px solid rgba(34,197,94,0.22)",
                    }}
                  >
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Íris no celular</span>
                </div>

                {/* Platform cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Android", sub: "Instalação via APK de prévia" },
                    { name: "iOS", sub: "Disponível via TestFlight" },
                  ].map(({ name, sub }) => (
                    <div
                      key={name}
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.032)",
                        border: "1px solid rgba(255,255,255,0.065)",
                      }}
                    >
                      <p className="font-semibold mb-1">{name}</p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                        {sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Feature list */}
                <div
                  className="rounded-xl p-5 space-y-3"
                  style={{
                    background: "rgba(255,255,255,0.032)",
                    border: "1px solid rgba(255,255,255,0.065)",
                  }}
                >
                  {[
                    "Sincronização em tempo real",
                    "Funciona sem internet",
                    "Notificações push",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="relative py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <AnimateOnScroll>
            <SectionHeader
              badge="Processo"
              heading={
                <>
                  Como a <span className="iris-gradient-text">Íris</span>{" "}
                  funciona
                </>
              }
            />
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            {[
              {
                n: 1,
                title: "Organize",
                desc: "Importe clientes, crie serviços e defina sua agenda em minutos.",
              },
              {
                n: 2,
                title: "Execute",
                desc: "Use o app móvel para fotos, notas e agenda mesmo offline.",
              },
              {
                n: 3,
                title: "Cresça",
                desc: "Acompanhe o financeiro, produtividade e orçamentos aprovados.",
              },
            ].map(({ n, title, desc }, i) => (
              <AnimateOnScroll key={n} delay={i * 160}>
                <StepCard index={n} title={title} description={desc} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audience ── */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 max-w-7xl">
          <AnimateOnScroll>
            <SectionHeader
              badge="Para quem é"
              heading={
                <>
                  Feito para quem{" "}
                  <span className="iris-gradient-text">vive</span> de{" "}
                  <span className="iris-gradient-text">jardinagem</span>
                </>
              }
              sub="Autônomos, pequenas equipes e empresas — a Íris dá estrutura para o
                seu dia a dia e clareza para o seu crescimento."
            />
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-5 mt-16">
            <AnimateOnScroll delay={0}>
              <AudienceCard
                title="Autônomos"
                description="Simplifique sua rotina e passe a cobrar com profissionalismo."
                features={["Agenda pessoal", "Orçamentos rápidos", "Controle financeiro"]}
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay={160}>
              <AudienceCard
                title="Pequenas equipes"
                description="Centralize agenda e informações para que todos tenham o mesmo foco."
                features={["Multi-usuário", "Agenda compartilhada", "Relatórios da equipe"]}
                featured
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay={320}>
              <AudienceCard
                title="Empresas"
                description="Padronize processos, meça resultados e acelere a expansão."
                features={["Múltiplas equipes", "Dashboard gerencial", "Integrações avançadas"]}
              />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32">
        <div className="container mx-auto px-6">
          <AnimateOnScroll>
            <div className="relative max-w-4xl mx-auto text-center">
              {/* Glow backdrop */}
              <div
                className="absolute inset-0 -z-10 blur-3xl"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(34,197,94,0.28) 0%, transparent 68%)",
                  opacity: 0.5,
                }}
              />
              <div
                className="glass-panel rounded-3xl px-8 py-16 md:px-16"
                style={{ borderColor: "rgba(34,197,94,0.18)" }}
              >
                <span className="landing-badge mb-6 inline-flex">Comece agora</span>

                <h2 className="text-4xl md:text-6xl font-bold iris-hero-font mb-5">
                  Pronto para{" "}
                  <span className="iris-gradient-text">transformar</span>
                  <br />
                  seu{" "}
                  <span className="iris-gradient-text">negócio?</span>
                </h2>

                <p
                  className="text-lg mb-10 max-w-xl mx-auto"
                  style={{ color: "rgba(255,255,255,0.52)" }}
                >
                  Crie sua conta, escolha seu plano e comece a transformar seu negócio de jardinagem.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/auth/sign-up"
                    className="iris-gradient-btn iris-glow-btn inline-flex items-center gap-2 px-9 py-4 rounded-2xl text-base font-semibold"
                    style={{ color: "#fff" }}
                  >
                    Criar minha conta <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#planos"
                    className="landing-outline-btn px-9 py-4 rounded-2xl text-base font-semibold"
                  >
                    Ver planos
                  </a>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.062)" }}>
        <div className="container mx-auto px-6 py-10 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <img src="/img/iris.png" alt="Íris" className="h-8 w-auto opacity-50" />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.32)" }}>
              © 2026 Íris. Todos os Direitos Reservados.
            </p>
            <div className="flex gap-6 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              <a href="#" className="hover:text-white transition-colors duration-200">
                Privacidade
              </a>
              <a href="#" className="hover:text-white transition-colors duration-200">
                Termos
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─── Sub-components ─── */

function SectionHeader({
  badge,
  heading,
  sub,
}: {
  badge: string
  heading: React.ReactNode
  sub?: string
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="landing-badge mb-5 inline-flex">{badge}</span>
      <h2 className="text-4xl md:text-5xl font-bold iris-hero-font mt-3 leading-tight">
        {heading}
      </h2>
      {sub && (
        <p className="mt-5 text-lg" style={{ color: "rgba(255,255,255,0.52)" }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="stat-number text-3xl md:text-4xl font-bold mb-1.5">{value}</div>
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
        {label}
      </div>
    </div>
  )
}

function GlassFeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="glass-feature-card rounded-2xl p-7 space-y-5 h-full">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-green-400 [&>svg]:w-6 [&>svg]:h-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,138,65,0.28), rgba(34,197,94,0.13))",
          border: "1px solid rgba(34,197,94,0.22)",
        }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
        {description}
      </p>
    </div>
  )
}

function MobileFeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div
      className="flex gap-3 p-4 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.028)",
        border: "1px solid rgba(255,255,255,0.065)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-green-400"
        style={{ background: "rgba(34,197,94,0.10)" }}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm mb-0.5">{title}</p>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.44)" }}>
          {description}
        </p>
      </div>
    </div>
  )
}

function StepCard({
  index,
  title,
  description,
}: {
  index: number
  title: string
  description: string
}) {
  return (
    <div
      className="glass-panel rounded-2xl p-8 space-y-5"
    >
      <div
        className="step-number w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white"
      >
        {index}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
        {description}
      </p>
    </div>
  )
}

function AudienceCard({
  title,
  description,
  features,
  featured,
}: {
  title: string
  description: string
  features: string[]
  featured?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-8 space-y-5 h-full transition-all duration-300 ${
        featured ? "audience-card-featured" : "glass-panel"
      }`}
    >
      {featured && (
        <span className="landing-badge text-xs inline-flex mb-1">Mais popular</span>
      )}
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
        {description}
      </p>
      <ul className="space-y-3 pt-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm">
            <CheckCircle
              className="w-4 h-4 shrink-0 text-green-400"
            />
            <span style={{ color: "rgba(255,255,255,0.72)" }}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
