"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Minus,
  Users,
  Calendar,
  FileText,
  BarChart2,
  Package,
  Sparkles,
  Leaf,
  Smartphone,
  Lock,
  Menu,
  X,
  Star,
  TrendingUp,
  Home,
  ClipboardList,
  Wallet,
  NotebookText,
  CheckSquare,
  Wrench,
  Bot,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  DollarSign,
  TrendingDown,
  Sun,
  Moon,
  CheckCircle2,
  Search,
  StickyNote,
  ListTodo,
  BarChart3,
  CalendarCheck,
  Zap,
  Globe,
  CreditCard,
  MessageSquare,
  Bell,
  Mic,
  Cloud,
  Map,
} from "lucide-react"

/* ─────────────────────────────────────────────
   DESIGN TOKENS — espelho do Nexus
───────────────────────────────────────────── */
const T = {
  bg:          "#0c0c0c",
  bg2:         "#111111",
  bg3:         "#161616",
  border:      "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  text:        "#ffffff",
  muted:       "rgba(255,255,255,0.48)",
  subtle:      "rgba(255,255,255,0.26)",
  green:       "#1aff5e",
  greenDim:    "#00e044",
  greenGlow:   "rgba(26,255,94,0.12)",
  greenGlow2:  "rgba(26,255,94,0.05)",
}

/* ─────────────────────────────────────────────
   GLOBAL CSS — animações idênticas ao Nexus
───────────────────────────────────────────── */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: ${T.bg};
    color: ${T.text};
    font-family: 'Manrope', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* Grain overlay */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.5;
  }

  /* ── Entry animations (Nexus style) ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.97) translateY(24px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* ── Scroll reveal ── */
  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1),
                transform 0.65s cubic-bezier(0.16,1,0.3,1);
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal.delay-1 { transition-delay: 0.08s; }
  .reveal.delay-2 { transition-delay: 0.16s; }
  .reveal.delay-3 { transition-delay: 0.24s; }
  .reveal.delay-4 { transition-delay: 0.32s; }

  /* ── Marquee ── */
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes marqueeReverse {
    from { transform: translateX(-50%); }
    to   { transform: translateX(0); }
  }
  .marquee-track        { animation: marquee        28s linear infinite; }
  .marquee-track-slow   { animation: marquee        40s linear infinite; }
  .marquee-track-reverse{ animation: marqueeReverse 40s linear infinite; }
  .marquee-track:hover,
  .marquee-track-slow:hover,
  .marquee-track-reverse:hover { animation-play-state: paused; }

  /* ── Pill pulse ── */
  @keyframes pillGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(26,255,94,0.3); }
    50%      { box-shadow: 0 0 0 5px rgba(26,255,94,0); }
  }
  .pill-dot { animation: pillGlow 2.4s ease-in-out infinite; }

  /* ── Button pulse ── */
  @keyframes btnGlow {
    0%,100% { box-shadow: 0 0 24px rgba(26,255,94,0.28); }
    50%      { box-shadow: 0 0 40px rgba(26,255,94,0.48); }
  }
  .btn-primary-glow { animation: btnGlow 3s ease-in-out infinite; }

  /* ── Card hover ── */
  .card-hover {
    transition: border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
  }
  .card-hover:hover {
    border-color: ${T.borderHover} !important;
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.28);
  }

  /* ── Green card hover ── */
  .card-hover-green:hover {
    border-color: rgba(26,255,94,0.25) !important;
    box-shadow: 0 16px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(26,255,94,0.08);
  }

  /* ── Pricing toggle sliding indicator ── */
  .toggle-pill {
    position: absolute;
    top: 4px; bottom: 4px;
    border-radius: 100px;
    background: #fff;
    transition: transform 0.26s cubic-bezier(0.34,1.56,0.64,1), width 0.22s ease;
    pointer-events: none;
  }

  /* ── Nav link hover ── */
  .nav-link {
    position: relative;
    color: ${T.muted};
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    padding: 7px 14px;
    border-radius: 8px;
    transition: color 0.18s ease, background 0.18s ease;
  }
  .nav-link:hover { color: ${T.text}; background: rgba(255,255,255,0.05); }

  /* ── Input / form ── */
  input, textarea, select { font-family: 'Manrope', sans-serif; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .hide-mobile { display: none !important; }
    .col-2-mobile { grid-template-columns: 1fr !important; }
    .col-1-mobile { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 600px) {
    .hide-sm { display: none !important; }
    .full-sm { width: 100% !important; }
    .text-center-sm { text-align: center !important; }
  }
`

/* ─────────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: T.green, marginBottom: 14,
    }}>
      <span style={{ width: 18, height: 2, background: T.green, borderRadius: 2, display: "block", flexShrink: 0 }} />
      {children}
    </div>
  )
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{
      fontFamily: "'Manrope', sans-serif",
      fontSize: "clamp(30px, 4.2vw, 50px)",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-1.2px",
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </h2>
  )
}

function Divider() {
  return <div style={{ height: 1, background: T.border, margin: "20px 0" }} />
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      background: "linear-gradient(135deg, #1a3a22, #0f2016)",
      border: `2px solid ${T.bg}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: T.green,
      marginLeft: -9, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

/* ─────────────────────────────────────────────
   SCROLL REVEAL HOOK
───────────────────────────────────────────── */
function useReveal(rootMargin = "0px 0px -60px 0px") {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible")
          obs.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])
  return ref
}

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useReveal()
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 0",
      transition: "background 0.3s ease, border-color 0.3s ease",
      background: scrolled ? "rgba(12,12,12,0.82)" : "transparent",
      backdropFilter: scrolled ? "blur(22px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(22px)" : "none",
      borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 0 }}>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800, fontSize: 19, letterSpacing: "-0.5px",
              color: "#d4f0d9",
            }}>Gestão</span>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800, fontSize: 19, letterSpacing: "-0.5px",
              background: `linear-gradient(90deg, #7dffaa, ${T.green})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Garden</span>
          </Link>

          {/* Desktop links */}
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {["Funcionalidades", "Preços", "Depoimentos", "Sobre"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>
            ))}
          </div>

          {/* CTA */}
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/auth/login" style={{
              padding: "8px 18px", borderRadius: 100,
              fontSize: 14, fontWeight: 600, color: T.muted,
              border: `1px solid ${T.border}`, textDecoration: "none",
              transition: "color 0.18s, border-color 0.18s",
            }}>
              Entrar
            </Link>
            <Link href="#preços" className="btn-primary-glow" style={{
              padding: "9px 20px", borderRadius: 100,
              fontSize: 14, fontWeight: 700,
              background: T.green, color: "#000",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
            }}>
              Começar Grátis
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="show-mobile"
            onClick={() => setOpen(!open)}
            style={{
              background: "none", border: `1px solid ${T.border}`,
              color: T.text, cursor: "pointer", padding: "8px 10px",
              borderRadius: 8, display: "none",
            }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </nav>
  )
}

/* ─────────────────────────────────────────────
   HERO DASHBOARD MOCKUP
───────────────────────────────────────────── */
function DashboardMockup() {
  const [activeView, setActiveView] = useState("Visão Geral")
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mockLightMode, setMockLightMode] = useState(false)

  /* ── Tokens de tema do mockup (shadow do T global) ── */
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const T = mockLightMode ? {
    bg: "#ffffff", bg2: "#fafafa", bg3: "#f3f4f6",
    border: "rgba(0,0,0,0.09)", borderHover: "rgba(0,0,0,0.15)",
    text: "#1a1a1a", muted: "rgba(0,0,0,0.45)", subtle: "rgba(0,0,0,0.26)",
    green: "#16a34a", greenDim: "#15803d",
    greenGlow: "rgba(22,163,74,0.08)", greenGlow2: "rgba(22,163,74,0.04)",
  } : {
    bg: "#0c0c0c", bg2: "#111111", bg3: "#161616",
    border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,255,255,0.14)",
    text: "#ffffff", muted: "rgba(255,255,255,0.48)", subtle: "rgba(255,255,255,0.26)",
    green: "#1aff5e", greenDim: "#00e044",
    greenGlow: "rgba(26,255,94,0.12)", greenGlow2: "rgba(26,255,94,0.05)",
  }

  /* Helpers de cor adaptáveis ao tema */
  const ca = (o: number) => mockLightMode ? `rgba(0,0,0,${o})` : `rgba(255,255,255,${o})`
  const ga = (o: number) => mockLightMode ? `rgba(22,163,74,${o})` : `rgba(26,255,94,${o})`
  const pos = mockLightMode ? "#16a34a" : "#4ade80"
  const onGreen = mockLightMode ? "#fff" : "#000"
  const sidebarBg = mockLightMode ? "#e8e8e8" : "#141414"
  const browserBarBg = mockLightMode ? "#dedede" : "#191919"

  const mockNotifications = [
    { id: 1, icon: "📋", title: "Novo orçamento aprovado", desc: "Juliana Santos aprovou o orçamento #127", time: "Há 12 min", unread: true },
    { id: 2, icon: "📅", title: "Agendamento confirmado", desc: "Poda de arbustos — Seg, 23 Mar às 08:00", time: "Há 34 min", unread: true },
    { id: 3, icon: "💰", title: "Pagamento recebido", desc: "R$ 850,00 de Marco Rodrigues", time: "Há 1h", unread: true },
    { id: 4, icon: "✅", title: "Serviço concluído", desc: "Manutenção jardim — Pedro Lima", time: "Há 2h", unread: false },
    { id: 5, icon: "👤", title: "Novo cliente cadastrado", desc: "Fernanda Oliveira foi adicionada", time: "Há 3h", unread: false },
    { id: 6, icon: "🔔", title: "Lembrete de manutenção", desc: "Plano mensal de André Costa vence em 3 dias", time: "Há 5h", unread: false },
  ]

  const sidebarItems = [
    { icon: <Home size={14} />, label: "Visão Geral", route: "" },
    { icon: <Users size={14} />, label: "Clientes", route: "clients" },
    { icon: <Calendar size={14} />, label: "Agenda", route: "schedule" },
    { icon: <ClipboardList size={14} />, label: "Ordens de Serviço", route: "work-orders" },
    { icon: <FileText size={14} />, label: "Orçamentos", route: "budgets" },
    { icon: <StickyNote size={14} />, label: "Notas", route: "notes" },
    { icon: <ListTodo size={14} />, label: "Tarefas", route: "tasks" },
  ]
  const sidebarItems2 = [
    { icon: <BarChart3 size={14} />, label: "Financeiro", route: "finance" },
    { icon: <Package size={14} />, label: "Estoque", route: "stock" },
    { icon: <CalendarCheck size={14} />, label: "Manutenções", route: "maintenance" },
    { icon: <Bot size={14} />, label: "Assistente", route: "assistant" },
  ]

  const allItems = [...sidebarItems, ...sidebarItems2]
  const activeRoute = allItems.find(i => i.label === activeView)?.route || ""
  const urlPath = activeRoute
    ? `app.gestaogarden.com/dashboard/${activeRoute}`
    : "app.gestaogarden.com/dashboard"

  /* ── Helpers de mockup ── */
  const KpiCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{
      background: T.bg3, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: "10px 11px",
    }}>
      <div style={{ fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: T.green, marginTop: 2 }}>{sub}</div>}
    </div>
  )

  const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>{title}</div>
        <div style={{ fontSize: 11, color: T.muted }}>{subtitle}</div>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: T.green, color: onGreen,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, lineHeight: 1,
      }}>+</div>
    </div>
  )

  const StatusBadge = ({ label, color }: { label: string; color: string }) => (
    <span style={{
      fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
      background: color === "green" ? ga(0.12) : color === "amber" ? "rgba(255,191,0,0.12)" : color === "blue" ? "rgba(59,130,246,0.12)" : color === "red" ? "rgba(239,68,68,0.12)" : ca(0.06),
      color: color === "green" ? pos : color === "amber" ? "#fbbf24" : color === "blue" ? "#60a5fa" : color === "red" ? "#f87171" : T.muted,
    }}>{label}</span>
  )

  const ListRow = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 10px", borderRadius: 7,
      background: ca(0.02),
      border: `1px solid ${T.border}`,
      marginBottom: 4,
    }}>{children}</div>
  )

  const AvatarCircle = ({ initials, size = 26 }: { initials: string; size?: number }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: ga(0.1), color: T.green,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  )

  /* ── Conteúdo por view ── */
  const renderContent = () => {
    switch (activeView) {

      case "Visão Geral": {
        /* Dados mockados do gráfico — pares [receita%, despesa%] por mês */
        const chartBars = [
          [28,18],[52,30],[38,22],[68,40],[44,28],[82,48],
          [56,34],[94,55],[62,38],[78,44],[42,26],[22,14],
        ]
        const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

        /* Mini calendário de março 2026 */
        const calDayNames = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"]
        const calFirstDay = 0 // Março 2026 começa no domingo
        const calDays = 31
        const calCells: (number|null)[] = []
        for (let i = 0; i < calFirstDay; i++) calCells.push(null)
        for (let d = 1; d <= calDays; d++) calCells.push(d)
        const todayDate = 22

        /* Próximos agendamentos */
        const appointments = [
          { done: false, day: "Seg, 23 Mar", time: "08:00", title: "Poda de arbustos", client: "Marco Rodrigues" },
          { done: false, day: "Seg, 23 Mar", time: "10:30", title: "Manutenção jardim", client: "Juliana Santos" },
          { done: false, day: "Ter, 24 Mar", time: "14:00", title: "Plantio de mudas", client: "André Costa" },
          { done: true, day: "Ter, 24 Mar", time: "09:00", title: "Irrigação automática", client: "Pedro Lima" },
          { done: false, day: "Qua, 25 Mar", time: "15:00", title: "Limpeza de terreno", client: "Cláudia Ferreira" },
        ]

        /* KPI cards */
        const kpis = [
          { label: "Total de Clientes", value: "48", icon: <Users size={11} />, change: 12.5, positive: true },
          { label: "Clientes Ativos", value: "31", icon: <UserCheck size={11} />, change: 8.3, positive: true },
          { label: "Receita do Mês", value: "R$ 8.450", icon: <DollarSign size={11} />, change: 15.2, positive: true },
          { label: "Resultado do Mês", value: "R$ 5.120", icon: <Wallet size={11} />, change: 4.7, positive: true },
        ]

        return (
          <>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, textAlign: "left", color: T.text }}>
                  Olá, Pedro Luiz
                </div>
                <div style={{ fontSize: 11, color: T.muted, textAlign: "left" }}>Aqui está a visão geral do seu negócio.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  onClick={() => setMockLightMode(v => !v)}
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: ca(0.05), border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.3s ease",
                  }}
                >
                  {mockLightMode ? <Moon size={11} style={{ color: T.muted }} /> : <Sun size={11} style={{ color: T.muted }} />}
                </div>
                <div
                  onClick={() => setNotificationsOpen(v => !v)}
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: ca(0.05), border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    opacity: notificationsOpen ? 0 : 1,
                    transform: notificationsOpen ? "scale(0.75)" : "scale(1)",
                    pointerEvents: notificationsOpen ? "none" : "auto",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Bell size={11} style={{ color: T.muted }} />
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: "3px 10px 3px 3px",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: ga(0.15), color: T.green,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700,
                  }}>PL</div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.2, textAlign: "left", color: T.text }}>Pedro Luiz</div>
                    <div style={{ fontSize: 7.5, color: T.muted, lineHeight: 1, textAlign: "left" }}>pedro@email.com</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              {kpis.map(({ label, value, icon, change, positive }) => (
                <div key={label} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 11px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, fontWeight: 500 }}>{label}</div>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: ca(0.06),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: T.muted,
                    }}>{icon}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 3, textAlign: "left", color: T.text }}>{value}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 8.5 }}>
                    {positive
                      ? <TrendingUp size={8} style={{ color: pos }} />
                      : <TrendingDown size={8} style={{ color: "#f87171" }} />
                    }
                    <span style={{ color: positive ? pos : "#f87171", fontWeight: 600 }}>
                      {positive ? "+" : ""}{change.toFixed(1)}%
                    </span>
                    <span style={{ color: T.muted, fontWeight: 400 }}>do mês passado</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Content Grid: Left (gráfico + produtividade) | Right (calendário + agenda) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 8 }}>
              {/* Coluna esquerda */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Gráfico financeiro */}
                <div style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "12px 12px 8px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.2px", marginBottom: 4, color: T.text }}>
                        Desempenho Financeiro &mdash; 2026
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: T.green, display: "inline-block" }} />
                          <span style={{ fontSize: 8, color: T.muted }}>Receita 50.2K</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: ca(0.12), display: "inline-block" }} />
                          <span style={{ fontSize: 8, color: T.muted }}>Despesa 28.4K</span>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 8, color: T.muted, background: ca(0.05),
                      border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px",
                      fontWeight: 500,
                    }}>2026 ▾</div>
                  </div>
                  {/* Barras duplas (receita + despesa) */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                    {chartBars.map(([r, d], i) => (
                      <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, height: "100%" }}>
                        <div style={{
                          flex: 1, borderRadius: "2px 2px 0 0",
                          height: `${r}%`, background: T.green, minHeight: 2,
                        }} />
                        <div style={{
                          flex: 1, borderRadius: "2px 2px 0 0",
                          height: `${d}%`, background: ca(0.10), minHeight: 2,
                        }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 7, color: T.subtle }}>
                    {months.map(m => <span key={m}>{m}</span>)}
                  </div>
                </div>

                {/* Produtividade do mês */}
                <div style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "12px 12px 10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.2px", color: T.text }}>Produtividade do Mês</div>
                    <div style={{ fontSize: 8, color: T.muted, fontWeight: 500 }}>Ver agenda</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Serviços Concluídos */}
                    <div>
                      <div style={{ fontSize: 8, color: T.muted, marginBottom: 3 }}>Serviços Concluídos</div>
                      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 5, lineHeight: 1, color: T.text }}>72.5%</div>
                      <div style={{
                        height: 5, background: ca(0.08), borderRadius: 3, overflow: "hidden",
                      }}>
                        <div style={{ width: "72.5%", height: "100%", background: T.green, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 7.5, color: T.muted, marginTop: 3 }}>do mês atual</div>
                    </div>
                    {/* Serviços Pendentes */}
                    <div>
                      <div style={{ fontSize: 8, color: T.muted, marginBottom: 3 }}>Serviços Pendentes</div>
                      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 5, lineHeight: 1, color: T.text }}>27.5%</div>
                      <div style={{
                        height: 5, background: ca(0.08), borderRadius: 3, overflow: "hidden",
                      }}>
                        <div style={{ width: "27.5%", height: "100%", background: T.green, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 7.5, color: T.muted, marginTop: 3 }}>do mês atual</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna direita */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Mini Calendário */}
                <div style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 10px 8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text }}>Março 2026</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: ca(0.06),
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ChevronLeft size={9} style={{ color: T.muted }} />
                      </div>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: ca(0.06),
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ChevronRight size={9} style={{ color: T.muted }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                    {calDayNames.map(n => (
                      <div key={n} style={{
                        textAlign: "center", fontSize: 7, color: T.muted,
                        padding: "2px 0", fontWeight: 500,
                      }}>{n}</div>
                    ))}
                    {calCells.map((d, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "1.5px 0",
                      }}>
                        {d !== null ? (
                          <span style={{
                            width: 17, height: 17, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 8, fontWeight: d === todayDate ? 700 : 400,
                            background: d === todayDate ? T.green : "transparent",
                            color: d === todayDate ? onGreen : T.muted,
                          }}>{d}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Próxima Agenda */}
                <div style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 10px 8px",
                  flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text }}>Próxima Agenda</div>
                    <div style={{ fontSize: 7.5, color: T.green, fontWeight: 500 }}>Ver todos</div>
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    {appointments.map((a, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 5,
                        padding: "5px 4px",
                        borderBottom: i < appointments.length - 1 ? `1px solid ${ca(0.04)}` : "none",
                      }}>
                        {/* Checkbox */}
                        {a.done ? (
                          <div style={{
                            width: 11, height: 11, borderRadius: 3, marginTop: 1,
                            background: T.green, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Check size={7} style={{ color: onGreen }} />
                          </div>
                        ) : (
                          <div style={{
                            width: 11, height: 11, borderRadius: 3, marginTop: 1,
                            border: `1.5px solid ${ca(0.15)}`, flexShrink: 0,
                          }} />
                        )}
                        {/* Data/hora */}
                        <div style={{ flexShrink: 0, width: 36 }}>
                          <div style={{ fontSize: 6.5, color: T.muted, fontWeight: 500, lineHeight: 1.2 }}>{a.day}</div>
                          <div style={{ fontSize: 6.5, color: T.muted }}>{a.time}</div>
                        </div>
                        {/* Título + cliente */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 9, fontWeight: 600, lineHeight: 1.2,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{a.title}</div>
                          <div style={{
                            fontSize: 7.5, color: T.muted,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{a.client}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      case "Clientes":
        return (
          <>
            <PageHeader title="Clientes" subtitle="48 clientes cadastrados" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Total" value="48" sub="clientes" />
              <KpiCard label="Novos" value="5" sub="este mês" />
              <KpiCard label="Ativos" value="31" sub="↑ +8%" />
            </div>
            {[
              { initials: "MR", name: "Marco Rodrigues", phone: "(11) 98765-4321", tag: "Ativo" },
              { initials: "JS", name: "Juliana Santos", phone: "(11) 91234-5678", tag: "Ativo" },
              { initials: "AC", name: "André Costa", phone: "(21) 99876-5432", tag: "Novo" },
              { initials: "PL", name: "Pedro Lima", phone: "(11) 97654-3210", tag: "Ativo" },
              { initials: "CF", name: "Cláudia Ferreira", phone: "(11) 93456-7890", tag: "Inativo" },
            ].map(c => (
              <ListRow key={c.initials}>
                <AvatarCircle initials={c.initials} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{c.phone}</div>
                </div>
                <StatusBadge label={c.tag} color={c.tag === "Ativo" ? "green" : c.tag === "Novo" ? "blue" : "muted"} />
              </ListRow>
            ))}
          </>
        )

      case "Agenda":
        return (
          <>
            <PageHeader title="Agenda" subtitle="Próximos agendamentos" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Hoje" value="3" sub="agendamentos" />
              <KpiCard label="Semana" value="8" sub="próximos" />
              <KpiCard label="Concluídos" value="22" sub="este mês" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Hoje</div>
            {[
              { time: "08:00", title: "Poda de arbustos", client: "Marco Rodrigues", status: "scheduled" },
              { time: "10:30", title: "Manutenção jardim", client: "Juliana Santos", status: "in_progress" },
              { time: "14:00", title: "Plantio de mudas", client: "André Costa", status: "scheduled" },
            ].map((a, i) => (
              <ListRow key={i}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.green, width: 36, flexShrink: 0 }}>{a.time}</div>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: a.status === "in_progress" ? "#fbbf24" : "#3b82f6",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{a.client}</div>
                </div>
              </ListRow>
            ))}
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, margin: "10px 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Amanhã</div>
            {[
              { time: "09:00", title: "Irrigação automática", client: "Pedro Lima" },
              { time: "15:00", title: "Limpeza de terreno", client: "Cláudia Ferreira" },
            ].map((a, i) => (
              <ListRow key={i}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, width: 36, flexShrink: 0 }}>{a.time}</div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: "#3b82f6" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{a.client}</div>
                </div>
              </ListRow>
            ))}
          </>
        )

      case "Ordens de Serviço":
        return (
          <>
            <PageHeader title="Ordens de Serviço" subtitle="12 OS cadastradas" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Total" value="12" />
              <KpiCard label="Em aberto" value="4" />
              <KpiCard label="Concluídas" value="7" />
              <KpiCard label="Faturado" value="R$ 14.2K" />
            </div>
            {[
              { id: "OS-012", title: "Paisagismo completo", client: "Marco Rodrigues", status: "Emitida", statusColor: "blue", amount: "R$ 3.200" },
              { id: "OS-011", title: "Instalação de irrigação", client: "Juliana Santos", status: "Rascunho", statusColor: "amber", amount: "R$ 1.850" },
              { id: "OS-010", title: "Poda de árvores", client: "Pedro Lima", status: "Concluída", statusColor: "green", amount: "R$ 980" },
              { id: "OS-009", title: "Replantio canteiro", client: "André Costa", status: "Concluída", statusColor: "green", amount: "R$ 650" },
            ].map(o => (
              <ListRow key={o.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: T.subtle, fontWeight: 600 }}>{o.id}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.title}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{o.client}</div>
                </div>
                <StatusBadge label={o.status} color={o.statusColor} />
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, flexShrink: 0 }}>{o.amount}</div>
              </ListRow>
            ))}
          </>
        )

      case "Orçamentos":
        return (
          <>
            <PageHeader title="Orçamentos" subtitle="15 orçamentos" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Total" value="15" />
              <KpiCard label="Pendentes" value="6" />
              <KpiCard label="Aprovados" value="8" />
              <KpiCard label="Valor" value="R$ 22.5K" />
            </div>
            {[
              { title: "Jardim residencial completo", client: "Marco Rodrigues", status: "Aprovado", statusColor: "green", amount: "R$ 4.500" },
              { title: "Manutenção mensal condomínio", client: "Cond. Jardins", status: "Pendente", statusColor: "amber", amount: "R$ 2.800" },
              { title: "Paisagismo área externa", client: "Juliana Santos", status: "Pendente", statusColor: "amber", amount: "R$ 6.200" },
              { title: "Replantio e adubação", client: "Pedro Lima", status: "Aprovado", statusColor: "green", amount: "R$ 1.350" },
            ].map((b, i) => (
              <ListRow key={i}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{b.title}</div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{b.client}</div>
                </div>
                <StatusBadge label={b.status} color={b.statusColor} />
                <div style={{ fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{b.amount}</div>
              </ListRow>
            ))}
          </>
        )

      case "Notas":
        return (
          <>
            <PageHeader title="Notas" subtitle="9 notas" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Total" value="9" sub="notas" />
              <KpiCard label="Alta prioridade" value="3" />
              <KpiCard label="Com tags" value="6" />
            </div>
            {[
              { title: "Cuidados com orquídeas", preview: "Regar 2x por semana, luz indireta...", importance: "high", tag: "Plantas" },
              { title: "Fornecedor de mudas", preview: "Contato: Flora Garden - (11) 3456...", importance: "medium", tag: "Fornecedores" },
              { title: "Receita de adubo orgânico", preview: "Misturar húmus com casca de ovo...", importance: "low", tag: "Técnicas" },
              { title: "Pragas em roseiras", preview: "Aplicar neem a cada 15 dias...", importance: "high", tag: "Pragas" },
            ].map((n, i) => (
              <ListRow key={i}>
                <div style={{
                  width: 4, height: 28, borderRadius: 2, flexShrink: 0,
                  background: n.importance === "high" ? "#f87171" : n.importance === "medium" ? "#fbbf24" : "rgba(255,255,255,0.1)",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 9.5, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.preview}</div>
                </div>
                <StatusBadge label={n.tag} color="muted" />
              </ListRow>
            ))}
          </>
        )

      case "Tarefas":
        return (
          <>
            <PageHeader title="Tarefas" subtitle="14 tarefas" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Abertas" value="5" />
              <KpiCard label="Em andamento" value="3" />
              <KpiCard label="Concluídas" value="4" />
              <KpiCard label="Atrasadas" value="2" />
            </div>
            {[
              { title: "Comprar sementes de grama", done: false, due: "Hoje", priority: "high" },
              { title: "Orçar sistema de irrigação", done: false, due: "Amanhã", priority: "medium" },
              { title: "Entregar relatório mensal", done: false, due: "25/03", priority: "high" },
              { title: "Revisar equipamentos", done: true, due: "20/03", priority: "low" },
              { title: "Agendar visita técnica", done: true, due: "18/03", priority: "medium" },
            ].map((t, i) => (
              <ListRow key={i}>
                <div style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: t.done ? "none" : `1.5px solid ${T.subtle}`,
                  background: t.done ? T.green : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {t.done && <span style={{ fontSize: 9, color: onGreen, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    textDecoration: t.done ? "line-through" : "none",
                    color: t.done ? T.muted : T.text,
                  }}>{t.title}</div>
                </div>
                <div style={{ fontSize: 9, color: t.due === "Hoje" ? "#f87171" : T.muted, flexShrink: 0 }}>{t.due}</div>
              </ListRow>
            ))}
          </>
        )

      case "Financeiro":
        return (
          <>
            <PageHeader title="Financeiro" subtitle="março de 2026" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Receita" value="R$ 8.4K" sub="↑ +15%" />
              <KpiCard label="Despesas" value="R$ 3.3K" />
              <KpiCard label="Resultado" value="R$ 5.1K" sub="↑ +22%" />
              <KpiCard label="Saldo" value="R$ 24.8K" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Transações recentes</div>
            {[
              { desc: "Serviço de paisagismo", type: "income", amount: "+ R$ 3.200", date: "22/03" },
              { desc: "Compra de fertilizantes", type: "expense", amount: "- R$ 280", date: "21/03" },
              { desc: "Manutenção mensal", type: "income", amount: "+ R$ 1.500", date: "20/03" },
              { desc: "Combustível", type: "expense", amount: "- R$ 350", date: "19/03" },
              { desc: "Poda e limpeza", type: "income", amount: "+ R$ 850", date: "18/03" },
            ].map((t, i) => (
              <ListRow key={i}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: t.type === "income" ? "#4ade80" : "#f87171",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{t.desc}</div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{t.date}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  color: t.type === "income" ? "#4ade80" : "#f87171",
                }}>{t.amount}</div>
              </ListRow>
            ))}
          </>
        )

      case "Estoque":
        return (
          <>
            <PageHeader title="Estoque" subtitle="Produtos e movimentações" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Produtos" value="18" sub="cadastrados" />
              <KpiCard label="Estoque baixo" value="3" sub="atenção" />
              <KpiCard label="Última compra" value="R$ 245" />
            </div>
            {[
              { name: "Adubo NPK 10-10-10", unit: "kg", qty: 45, status: "ok" },
              { name: "Semente grama esmeralda", unit: "kg", qty: 3, status: "low" },
              { name: "Substrato vegetal", unit: "L", qty: 120, status: "ok" },
              { name: "Defensivo orgânico Neem", unit: "L", qty: 2, status: "low" },
              { name: "Muda de primavera", unit: "un", qty: 30, status: "ok" },
            ].map((p, i) => (
              <ListRow key={i}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{p.unit}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, marginRight: 4 }}>{p.qty}</div>
                <StatusBadge label={p.status === "low" ? "Baixo" : "OK"} color={p.status === "low" ? "red" : "green"} />
              </ListRow>
            ))}
          </>
        )

      case "Manutenções":
        return (
          <>
            <PageHeader title="Manutenções" subtitle="8 planos cadastrados" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              <KpiCard label="Total" value="8" sub="planos" />
              <KpiCard label="Ativos" value="6" sub="em execução" />
              <KpiCard label="Alertas" value="2" sub="atrasados" />
            </div>
            {[
              { title: "Manutenção jardim frontal", client: "Marco Rodrigues", status: "Ativo", statusColor: "green", freq: "Mensal" },
              { title: "Poda trimestral", client: "Juliana Santos", status: "Ativo", statusColor: "green", freq: "Trimestral" },
              { title: "Irrigação e adubação", client: "Cond. Jardins", status: "Alerta", statusColor: "amber", freq: "Mensal" },
              { title: "Controle de pragas", client: "Pedro Lima", status: "Pausado", statusColor: "muted", freq: "Bimestral" },
            ].map((m, i) => (
              <ListRow key={i}>
                <div style={{
                  width: 4, height: 28, borderRadius: 2, flexShrink: 0,
                  background: m.statusColor === "green" ? "#4ade80" : m.statusColor === "amber" ? "#fbbf24" : "rgba(255,255,255,0.1)",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{m.title}</div>
                  <div style={{ fontSize: 9.5, color: T.muted }}>{m.client} · {m.freq}</div>
                </div>
                <StatusBadge label={m.status} color={m.statusColor} />
              </ListRow>
            ))}
          </>
        )

      case "Assistente Íris":
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(26,255,94,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={14} color={T.green} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Íris</div>
                <div style={{ fontSize: 9.5, color: T.muted }}>Assistente de jardinagem com IA</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <StatusBadge label="Online" color="green" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ display: "flex", gap: 8, maxWidth: "85%" }}>
                <AvatarCircle initials="I" size={22} />
                <div style={{
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                  borderRadius: "2px 10px 10px 10px", padding: "8px 10px",
                  fontSize: 11, lineHeight: 1.5, color: T.muted,
                }}>
                  Olá! Sou a Íris, sua assistente de jardinagem. Como posso ajudar hoje?
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, maxWidth: "75%", alignSelf: "flex-end" }}>
                <div style={{
                  background: "rgba(26,255,94,0.1)", border: "1px solid rgba(26,255,94,0.15)",
                  borderRadius: "10px 2px 10px 10px", padding: "8px 10px",
                  fontSize: 11, lineHeight: 1.5, color: T.text,
                }}>
                  Agendar poda para o Marco amanhã às 9h
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, maxWidth: "85%" }}>
                <AvatarCircle initials="I" size={22} />
                <div style={{
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                  borderRadius: "2px 10px 10px 10px", padding: "8px 10px",
                  fontSize: 11, lineHeight: 1.5, color: T.muted,
                }}>
                  Poda agendada para Marco Rodrigues amanhã (23/03) às 09:00. Deseja adicionar alguma observação?
                </div>
              </div>
            </div>
            <div style={{
              marginTop: "auto", paddingTop: 10,
              display: "flex", gap: 6, alignItems: "center",
            }}>
              <div style={{
                flex: 1, background: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`, borderRadius: 8,
                padding: "8px 10px", fontSize: 11, color: T.subtle,
              }}>
                Digite ou fale com a Íris...
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: T.green, color: onGreen,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
              }}>↑</div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      overflow: "hidden",
      background: T.bg2,
      boxShadow: `0 0 0 1px ${T.border}, 0 48px 100px rgba(0,0,0,0.64), 0 0 80px ${ga(0.04)}`,
      transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
    }}>
      {/* Browser bar */}
      <div style={{
        background: browserBarBg,
        borderBottom: `1px solid ${T.border}`,
        transition: "background 0.4s ease",
        padding: "11px 16px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <div style={{
          flex: 1, background: ca(0.05), borderRadius: 6,
          padding: "5px 12px", fontSize: 11.5, color: T.muted,
          textAlign: "center", margin: "0 16px",
          transition: "all 0.2s ease",
        }}>
          {urlPath}
        </div>
      </div>

      {/* Content: sidebar + main (com efeito "abraço" rounded) */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: 420 }}>

        {/* ── Sidebar ── */}
        <div style={{
          background: sidebarBg,
          display: "flex", flexDirection: "column",
          transition: "background 0.4s ease",
        }}>
          {/* Header: logo + nome + botão minimizar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 12px",
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: ga(0.15),
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ color: T.green, fontWeight: 700, fontSize: 12 }}>V</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left", color: T.text }}>Verde Vivo</div>
              <div style={{ fontSize: 8, color: ca(0.35), lineHeight: 1, textAlign: "left" }}>Jardinagem Profissional</div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: ca(0.35), cursor: "pointer",
            }}>
              <ChevronLeft size={12} />
            </div>
          </div>

          {/* Campo de busca */}
          <div style={{ padding: "10px 10px 6px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: ca(0.04), borderRadius: 10,
              padding: "7px 10px",
            }}>
              <Search size={11} style={{ color: ca(0.2), flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: ca(0.2) }}>Pesquise aqui...</span>
            </div>
          </div>

          {/* Navegação */}
          <nav style={{ flex: 1, overflow: "hidden", padding: "2px 6px" }}>
            {/* Menu Principal */}
            <div style={{ padding: "8px 8px 4px", fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: ca(0.22) }}>
              Menu Principal
            </div>
            {sidebarItems.map(({ icon, label }) => {
              const isActive = activeView === label
              return (
                <div
                  key={label}
                  onClick={() => setActiveView(label)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "7px 10px", margin: "1px 0", borderRadius: 10,
                    fontSize: 11.5, fontWeight: isActive ? 600 : 400,
                    color: isActive ? T.green : ca(0.4),
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: 18, borderRadius: "0 3px 3px 0",
                      background: T.green,
                    }} />
                  )}
                  {icon} {label}
                </div>
              )
            })}

            {/* Negócios */}
            <div style={{ padding: "10px 8px 4px", fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: ca(0.22) }}>
              Negócios
            </div>
            {sidebarItems2.map(({ icon, label }) => {
              const isActive = activeView === label
              return (
                <div
                  key={label}
                  onClick={() => setActiveView(label)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "7px 10px", margin: "1px 0", borderRadius: 10,
                    fontSize: 11.5, fontWeight: isActive ? 600 : 400,
                    color: isActive ? T.green : ca(0.4),
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: 18, borderRadius: "0 3px 3px 0",
                      background: T.green,
                    }} />
                  )}
                  {icon} {label}
                </div>
              )
            })}
          </nav>

          {/* Rodapé: badge plano + card próximo serviço */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 10px 12px" }}>
            {/* Badge de plano */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 8px", borderRadius: 7, marginBottom: 8,
            }}>
              <CreditCard size={10} style={{ color: ca(0.28), flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: ca(0.28), flex: 1 }}>Plano Plus</span>
              <span style={{
                fontSize: 7.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10,
                background: ga(0.12), color: T.green,
              }}>Plus</span>
            </div>

            {/* Card próximo serviço */}
            <div style={{
              background: ca(0.04), borderRadius: 10,
              padding: "10px 10px 9px",
            }}>
              <div style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ca(0.2), marginBottom: 5 }}>
                Próximo Serviço
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.3, marginBottom: 2, color: T.text }}>
                Poda de arbustos
              </div>
              <div style={{ fontSize: 8, color: ca(0.3), marginBottom: 8 }}>
                Seg, 23 Mar &middot; 08:00
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 7, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
                    background: ga(0.12), color: T.green,
                  }}>Serviço</span>
                  <span style={{
                    fontSize: 7, fontWeight: 500, padding: "2px 7px", borderRadius: 10,
                    background: ca(0.05), color: ca(0.35),
                  }}>Marco R.</span>
                </div>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: T.green,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ArrowRight size={8} style={{ color: onGreen }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main area com efeito "abraço" + painel notificações ── */}
        <div style={{
          background: sidebarBg,
          padding: "10px 10px 10px 0",
          transition: "background 0.4s ease",
        }}>
          <div style={{ display: "flex", height: "100%", gap: 0 }}>
            {/* Conteúdo principal */}
            <div style={{
              flex: 1,
              background: T.bg,
              color: T.text,
              borderRadius: 20,
              overflow: "hidden",
              padding: "20px 18px",
              display: "flex", flexDirection: "column",
              minWidth: 0,
              transition: "background 0.4s ease, color 0.4s ease",
            }}>
              {renderContent()}
            </div>

            {/* Painel de notificações — anima largura como o real */}
            <div style={{
              width: notificationsOpen ? 200 : 0,
              flexShrink: 0,
              overflow: "hidden",
              transition: "width 0.5s ease-in-out",
            }}>
              <div style={{
                marginLeft: 8,
                width: 192,
                height: "100%",
                background: T.bg,
                color: T.text,
                borderRadius: 20,
                display: "flex", flexDirection: "column",
                overflow: "hidden",
                opacity: notificationsOpen ? 1 : 0,
                transition: "opacity 0.3s ease 0.2s, background 0.4s ease",
              }}>
                {/* Header do painel */}
                <div style={{
                  padding: "12px 12px 10px",
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexShrink: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      border: `1px solid ${T.border}`, background: T.bg3,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Bell size={10} style={{ color: T.muted }} />
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: T.text }}>Notificações</span>
                  </div>
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: T.muted, cursor: "pointer",
                    }}
                  >
                    <X size={10} />
                  </div>
                </div>

                {/* Lista de notificações */}
                <div style={{ flex: 1, overflow: "hidden", padding: "8px 10px" }}>
                  {mockNotifications.map(n => (
                    <div key={n.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 7,
                      padding: "7px 6px",
                      borderRadius: 8,
                      background: n.unread ? ga(0.04) : "transparent",
                      marginBottom: 2,
                    }}>
                      <span style={{ fontSize: 12, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{n.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4, marginBottom: 1,
                        }}>
                          <span style={{
                            fontSize: 8.5, fontWeight: 600, lineHeight: 1.2, color: T.text,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{n.title}</span>
                          {n.unread && (
                            <span style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: T.green, flexShrink: 0,
                            }} />
                          )}
                        </div>
                        <div style={{
                          fontSize: 7.5, color: T.muted, lineHeight: 1.3,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{n.desc}</div>
                        <div style={{ fontSize: 7, color: T.subtle, marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ padding: "152px 0 0", textAlign: "center", position: "relative" }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "-10%", left: "50%",
        transform: "translateX(-50%)",
        width: 800, height: 500,
        background: "radial-gradient(ellipse, rgba(26,255,94,0.07) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* Pill */}
        <div style={{ animation: "fadeDown 0.55s cubic-bezier(0.16,1,0.3,1) both" }}>
          <Link href="#" style={{
            display: "inline-flex", alignItems: "center", gap: 9,
            background: "rgba(26,255,94,0.09)",
            border: "1px solid rgba(26,255,94,0.22)",
            borderRadius: 100, padding: "5px 16px 5px 7px",
            fontSize: 13, fontWeight: 600, color: T.green,
            textDecoration: "none", marginBottom: 36,
            transition: "background 0.18s, border-color 0.18s",
          }}>
            <span className="pill-dot" style={{
              width: 22, height: 22, borderRadius: "50%",
              background: T.green, color: "#000",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11,
            }}>
              <Sparkles size={11} strokeWidth={2.5} />
            </span>
            Assistente IA Íris disponível agora
            <ChevronRight size={14} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Headline */}
        <div style={{ animation: "fadeUp 0.6s 0.08s cubic-bezier(0.16,1,0.3,1) both" }}>
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "clamp(46px, 7.2vw, 88px)",
            fontWeight: 800, lineHeight: 1.04,
            letterSpacing: "-2.8px",
            marginBottom: 24,
          }}>
            Gestão Completa para<br />
            Sua Empresa de{" "}
            <span style={{
              background: `linear-gradient(135deg, #7dffaa 0%, ${T.green} 55%, #00b83a 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Jardinagem
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div style={{ animation: "fadeUp 0.6s 0.16s cubic-bezier(0.16,1,0.3,1) both" }}>
          <p style={{
            fontSize: "clamp(15px, 1.8vw, 18.5px)",
            color: T.muted, maxWidth: 540, margin: "0 auto 40px",
            fontWeight: 400, lineHeight: 1.72,
          }}>
            Organize clientes, agenda, finanças e ordens de serviço em um único lugar.
            Economize horas todo dia e foque no que realmente importa.
          </p>
        </div>

        {/* CTAs */}
        <div style={{
          animation: "fadeUp 0.6s 0.24s cubic-bezier(0.16,1,0.3,1) both",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, flexWrap: "wrap", marginBottom: 14,
        }}>
          <Link href="#preços" className="btn-primary-glow" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 26px", borderRadius: 100,
            background: T.green, color: "#000",
            fontSize: 14.5, fontWeight: 700,
            textDecoration: "none",
            transition: "background 0.18s, transform 0.18s",
          }}>
            Começar Grátis — 7 dias
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
          <Link href="#funcionalidades" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", borderRadius: 100,
            border: `1px solid ${T.border}`, color: T.text,
            fontSize: 14.5, fontWeight: 600,
            textDecoration: "none",
            transition: "border-color 0.18s, background 0.18s",
          }}>
            Ver funcionalidades
          </Link>
        </div>

        <div style={{
          animation: "fadeUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both",
          fontSize: 13, color: T.subtle, marginBottom: 52,
        }}>
          Sem cartão de crédito. Cancele quando quiser.
        </div>

        {/* Social proof */}
        <div style={{
          animation: "fadeUp 0.6s 0.36s cubic-bezier(0.16,1,0.3,1) both",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 14, marginBottom: 60,
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {["MR","JS","AC","PL"].map((i, idx) => (
              <Avatar key={i} initials={i} />
            ))}
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: T.greenGlow, border: `2px solid ${T.bg}`,
              marginLeft: -9,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: T.green,
            }}>+</div>
          </div>
          <div style={{ fontSize: 13.5, color: T.muted }}>
            <strong style={{ color: T.text, fontWeight: 700 }}>+500 profissionais</strong> já gerenciam seus negócios
          </div>
        </div>

        {/* Dashboard */}
        <div style={{
          animation: "scaleIn 0.75s 0.42s cubic-bezier(0.16,1,0.3,1) both",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", bottom: -1, left: 0, right: 0,
            height: 220,
            background: `linear-gradient(to top, ${T.bg}, transparent)`,
            zIndex: 2, pointerEvents: "none",
          }} />
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   TRUST BAR
───────────────────────────────────────────── */
function TrustBar() {
  return (
    <div style={{
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      padding: "18px 0",
      textAlign: "center",
      fontSize: 13, fontWeight: 500,
      color: T.subtle,
      letterSpacing: "0.02em",
      position: "relative", zIndex: 1,
      background: T.bg,
    }}>
      <span>A plataforma preferida de </span>
      <span style={{ color: T.muted, fontWeight: 600 }}>+500 jardineiros e paisagistas brasileiros</span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ABOUT
───────────────────────────────────────────── */
function About() {
  const aboutFeatures = [
    { icon: <Leaf size={15} />, title: "Feito para Jardinagem", desc: "Pensado para o dia a dia real do profissional do verde." },
    { icon: <Smartphone size={15} />, title: "Web + App Mobile", desc: "Acesse do computador ou do celular, onde você estiver." },
    { icon: <Bot size={15} />, title: "Íris — Assistente IA", desc: "Crie clientes, agendas e orçamentos por voz ou texto." },
    { icon: <Lock size={15} />, title: "Dados Protegidos", desc: "Criptografia de nível bancário com Supabase + RLS." },
  ]

  return (
    <section id="sobre" style={{ padding: "110px 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="col-2-mobile">

          {/* Visual */}
          <Reveal>
            <div style={{
              border: `1px solid ${T.border}`,
              borderRadius: 20, overflow: "hidden",
              background: T.bg2, aspectRatio: "16/10",
              position: "relative",
            }}>
              <div style={{
                inset: 0, position: "absolute",
                background: "linear-gradient(135deg, #0c1e0e 0%, #111f13 50%, #0a160c 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Ambient glow */}
                <div style={{
                  position: "absolute",
                  background: "radial-gradient(ellipse at 35% 45%, rgba(26,255,94,0.1) 0%, transparent 65%)",
                  inset: 0,
                }} />

                {/* Phone mockup */}
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{
                    width: 82, height: 164,
                    background: "#1a1a1a",
                    borderRadius: 20,
                    border: "1.5px solid rgba(26,255,94,0.28)",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 32px rgba(26,255,94,0.1)",
                    padding: "14px 10px",
                    display: "flex", flexDirection: "column", gap: 7, alignItems: "center",
                  }}>
                    <div style={{ width: 28, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 4 }} />
                    {[100, 70, 85, 60, 92, 55, 78].map((w, i) => (
                      <div key={i} style={{
                        height: 5, width: `${w}%`, borderRadius: 3,
                        background: i % 3 === 0 ? "rgba(26,255,94,0.35)" : "rgba(255,255,255,0.07)",
                      }} />
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.green, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>App Mobile</div>
                    <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.4px", lineHeight: 1.3, marginBottom: 7 }}>Gerencie em<br />qualquer lugar</div>
                    <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.55, maxWidth: 160 }}>iOS e Android. Grave áudios para a Íris enquanto trabalha no jardim.</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Text */}
          <div>
            <Reveal>
              <SectionLabel>Sobre o GestãoGarden</SectionLabel>
              <SectionTitle>Gerencie Seu Negócio com Inteligência</SectionTitle>
              <p style={{ fontSize: 16.5, color: T.muted, lineHeight: 1.74, marginBottom: 36 }}>
                O GestãoGarden nasceu para profissionalizar o mercado de jardinagem e paisagismo no Brasil.
                Tudo que você precisa em um único sistema, sem burocracia.
              </p>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {aboutFeatures.map(({ icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.07}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 34, height: 34, flexShrink: 0,
                      background: T.greenGlow,
                      border: `1px solid rgba(26,255,94,0.18)`,
                      borderRadius: 9,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: T.green,
                    }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>{desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   FEATURE CARD VISUALS
───────────────────────────────────────────── */
function ClientsMockup() {
  const rows = [
    { init: "MR", name: "Maria Rodrigues", detail: "Jardim residencial · Mensal", badge: "Ativo" },
    { init: "JS", name: "João Silva",       detail: "Piscina + Jardim · Quinzenal", badge: "Ativo" },
    { init: "AC", name: "Ana Castro",       detail: "Paisagismo · Contrato",       badge: "Novo" },
  ]
  return (
    <div style={{ background: "linear-gradient(135deg, #0d1e0f, #121a12)", padding: 16, height: "100%", display: "flex", flexDirection: "column", gap: 7 }}>
      {rows.map(({ init, name, detail, badge }) => (
        <div key={name} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.035)", border: `1px solid rgba(255,255,255,0.05)`,
          borderRadius: 9, padding: "9px 11px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(26,255,94,0.18), rgba(26,255,94,0.04))",
            border: "1px solid rgba(26,255,94,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9.5, fontWeight: 800, color: T.green, flexShrink: 0,
          }}>{init}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 10, color: T.subtle }}>{detail}</div>
          </div>
          <div style={{
            fontSize: 10, padding: "3px 9px", borderRadius: 100,
            background: "rgba(26,255,94,0.1)", color: T.green,
            border: "1px solid rgba(26,255,94,0.2)", fontWeight: 600,
          }}>{badge}</div>
        </div>
      ))}
    </div>
  )
}

function CalendarMockup() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const events = [3, 5, 7, 10, 14, 20, 22, 24]
  return (
    <div style={{ background: "linear-gradient(135deg, #0d1e0f, #121a12)", padding: 14, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 11.5, fontWeight: 700 }}>
        <span>Março 2026</span>
        <span style={{ color: T.green }}>→</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {["D","S","T","Q","Q","S","S"].map((d, i) => (
          <div key={i} style={{ fontSize: 9, fontWeight: 700, color: T.subtle, textAlign: "center", padding: "3px 0" }}>{d}</div>
        ))}
        {[null, null, null, null, null, null].map((_, i) => <div key={`e${i}`} />)}
        {days.map(d => (
          <div key={d} style={{
            aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, borderRadius: 5, fontWeight: d === 20 ? 800 : 500,
            background: d === 20 ? T.green : events.includes(d) ? "rgba(26,255,94,0.14)" : "transparent",
            color: d === 20 ? "#000" : events.includes(d) ? T.green : T.muted,
          }}>{d}</div>
        ))}
      </div>
    </div>
  )
}

function FinanceMockup() {
  const bars = [30, 48, 62, 100]
  return (
    <div style={{ background: "linear-gradient(135deg, #0d1e0f, #121a12)", padding: 16, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 10, color: T.subtle, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Receita do mês</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}>R$ 8.420</div>
        <div style={{ fontSize: 10.5, color: T.green, marginTop: 3 }}>↑ +23% vs. mês anterior</div>
      </div>
      <div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 50 }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: "3px 3px 0 0",
              height: `${h}%`,
              background: `rgba(26,255,94,${0.2 + i * 0.2})`,
            }} />
          ))}
          <div style={{ flex: 1, height: "25%", borderRadius: "3px 3px 0 0", background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.subtle, marginTop: 5 }}>
          {["Jan","Fev","Mar","Abr","Mai"].map(m => <span key={m}>{m}</span>)}
        </div>
      </div>
    </div>
  )
}

function AIMockup() {
  return (
    <div style={{ background: "linear-gradient(135deg, #0a180b, #0d1a0e)", padding: 16, height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10.5, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
        <Bot size={12} /> Íris — Assistente IA
      </div>
      <div style={{
        padding: "9px 12px", borderRadius: "10px 10px 4px 10px", alignSelf: "flex-end",
        background: "rgba(26,255,94,0.1)", border: "1px solid rgba(26,255,94,0.18)",
        fontSize: 11, color: "#9effa8", maxWidth: "85%", lineHeight: 1.5,
      }}>
        Agende a Maria pra amanhã às 9h
      </div>
      <div style={{
        padding: "9px 12px", borderRadius: "10px 10px 10px 4px", alignSelf: "flex-start",
        background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
        fontSize: 11, color: T.muted, maxWidth: "88%", lineHeight: 1.5,
      }}>
        ✓ Agendado! Visita para Maria Rodrigues criada para amanhã às 09:00. Confirmo?
      </div>
      <div style={{
        padding: "9px 12px", borderRadius: "10px 10px 4px 10px", alignSelf: "flex-end",
        background: "rgba(26,255,94,0.1)", border: "1px solid rgba(26,255,94,0.18)",
        fontSize: 11, color: "#9effa8", maxWidth: "75%",
      }}>
        Sim, e cria um orçamento de R$ 450
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   FEATURES
───────────────────────────────────────────── */
function FeatureCard({
  title, desc, children, delay = 0,
}: {
  title: string; desc: string; children: React.ReactNode; delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="card-hover" style={{
        background: T.bg2, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: "hidden",
        position: "relative",
      }}>
        {/* Top glow line on hover via CSS */}
        <div style={{
          aspectRatio: "16/7.5",
          background: T.bg3, overflow: "hidden",
          borderBottom: `1px solid ${T.border}`,
        }}>
          {children}
        </div>
        <div style={{ padding: "22px 24px 26px" }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px", marginBottom: 8 }}>{title}</h3>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.64 }}>{desc}</p>
        </div>
      </div>
    </Reveal>
  )
}

function LargeFeatureCard({
  label, title, desc, children, delay = 0,
}: {
  label: string; title: string; desc: string; children: React.ReactNode; delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="card-hover" style={{
        background: T.bg2, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "32px 32px 32px",
        display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28, alignItems: "center",
      }}>
        <div>
          <SectionLabel>{label}</SectionLabel>
          <h3 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 12, lineHeight: 1.25 }}>{title}</h3>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.64 }}>{desc}</p>
        </div>
        <div style={{
          aspectRatio: "4/3", background: T.bg3,
          border: `1px solid ${T.border}`, borderRadius: 12,
          overflow: "hidden",
        }}>
          {children}
        </div>
      </div>
    </Reveal>
  )
}

function WorkOrderMockup() {
  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, background: "linear-gradient(135deg, #0d1e0f, #121a12)", height: "100%" }}>
      {[
        { num: "#124", title: "Poda e Adubação", client: "João Silva", value: "R$ 320", status: "Em andamento", statusColor: T.green, bg: "rgba(26,255,94,0.08)", border: "rgba(26,255,94,0.2)" },
        { num: "#123", title: "Paisagismo Jardim", client: "Ana Castro", value: "R$ 1.200", status: "Concluído", statusColor: "#6dcca0", bg: "rgba(100,200,150,0.06)", border: "rgba(100,200,150,0.15)" },
        { num: "#122", title: "Limpeza de Área", client: "Pedro Lima", value: "R$ 180", status: "Pendente", statusColor: "#c0a060", bg: "rgba(200,160,80,0.06)", border: "rgba(200,160,80,0.15)" },
      ].map(({ num, title, client, value, status, statusColor, bg, border }) => (
        <div key={num} style={{
          background: bg, border: `1px solid ${border}`,
          borderRadius: 9, padding: "10px 12px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700 }}>{num} — {title}</span>
            <span style={{ fontSize: 10, color: statusColor, fontWeight: 700 }}>{status}</span>
          </div>
          <div style={{ fontSize: 10.5, color: T.subtle }}>{client} · {value}</div>
        </div>
      ))}
    </div>
  )
}

function StockMockup() {
  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 7, background: "linear-gradient(135deg, #0d1e0f, #121a12)", height: "100%" }}>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.07em", color: T.subtle, marginBottom: 2 }}>Estoque Atual</div>
      {[
        { name: "Adubo NPK 10kg", qty: "12 un.", ok: true },
        { name: "Tesoura de Poda Pro", qty: "3 un.", ok: true },
        { name: "Herbicida 1L", qty: "1 un.", ok: false },
        { name: "Substrato Universal 5L", qty: "8 un.", ok: true },
      ].map(({ name, qty, ok }) => (
        <div key={name} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: ok ? "rgba(255,255,255,0.03)" : "rgba(255,80,80,0.05)",
          border: ok ? `1px solid ${T.border}` : "1px solid rgba(255,80,80,0.15)",
          borderRadius: 8, padding: "9px 11px", fontSize: 11,
        }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ fontWeight: 700, color: ok ? T.green : "#ff6b6b" }}>
            {qty} {!ok && "⚠"}
          </span>
        </div>
      ))}
    </div>
  )
}

function Features() {
  return (
    <section id="funcionalidades" style={{ padding: "100px 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>Funcionalidades</SectionLabel>
            <SectionTitle>Ferramentas Poderosas,<br />Possibilidades Ilimitadas</SectionTitle>
            <p style={{ fontSize: 16.5, color: T.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.72 }}>
              Tudo que sua empresa de jardinagem precisa em um único sistema integrado.
            </p>
          </div>
        </Reveal>

        {/* Row 1: 2 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="col-2-mobile">
          <FeatureCard title="Gestão de Clientes" desc="Cadastre todos os seus clientes com histórico completo, preferências, endereços e contatos. Acesso rápido a qualquer informação." delay={0}>
            <ClientsMockup />
          </FeatureCard>
          <FeatureCard title="Agenda Inteligente" desc="Visualize todos os seus agendamentos com clareza. Nunca mais perca um compromisso ou confunda horários de serviço." delay={0.08}>
            <CalendarMockup />
          </FeatureCard>
        </div>

        {/* Row 2: 2 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="col-2-mobile">
          <FeatureCard title="Controle Financeiro" desc="Registre receitas e despesas, acompanhe seu resultado e entenda para onde vai seu dinheiro com relatórios visuais." delay={0}>
            <FinanceMockup />
          </FeatureCard>
          <FeatureCard title="Assistente de IA Íris" desc="Fale com a Íris por texto ou voz para criar clientes, agendamentos e orçamentos instantaneamente. Trabalhe sem parar." delay={0.08}>
            <AIMockup />
          </FeatureCard>
        </div>

        {/* Row 3: 2 large cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="col-2-mobile">
          <LargeFeatureCard
            label="Ordens de Serviço"
            title="Controle Total do Serviço Prestado"
            desc="Crie ordens de serviço detalhadas, acompanhe o status em tempo real e mantenha histórico completo de cada cliente."
            delay={0}
          >
            <WorkOrderMockup />
          </LargeFeatureCard>
          <LargeFeatureCard
            label="Estoque"
            title="Gerencie Produtos e Insumos"
            desc="Controle mudas, adubos, ferramentas e insumos. Saiba quando repor e quanto cada item impacta nos seus custos."
            delay={0.08}
          >
            <StockMockup />
          </LargeFeatureCard>
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Reveal>
            <Link href="#preços" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 100,
              border: `1px solid ${T.border}`, color: T.text,
              fontSize: 14.5, fontWeight: 600, textDecoration: "none",
              transition: "border-color 0.18s, background 0.18s",
            }}>
              Ver todos os recursos <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
function Stats() {
  const cards = [
    {
      label: "Profissionais",
      number: "500+",
      title: "Jardineiros e Paisagistas",
      desc: "Profissionais que modernizaram sua empresa e pararam de perder tempo com planilhas e cadernos.",
    },
    {
      label: "Agendamentos",
      number: "12k+",
      title: "Serviços Gerenciados",
      desc: "Agendamentos criados e executados com sucesso na plataforma todos os meses pelos nossos clientes.",
    },
    {
      label: "Volume Financeiro",
      number: "R$ 2M+",
      title: "Faturado pelos Usuários",
      desc: "Volume total de receita gerenciado pelos jardineiros que usam o GestãoGarden para controlar seu negócio.",
    },
    {
      label: "Satisfação",
      number: "4.9/5",
      title: "Avaliação dos Clientes",
      desc: "Nota média coletada em pesquisas mensais de satisfação com todos os usuários ativos da plataforma.",
    },
  ]

  return (
    <section id="comunidade" style={{ padding: "80px 0", position: "relative" }}>
      {/* Ambient */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        width: 700, height: 400,
        background: "radial-gradient(ellipse, rgba(26,255,94,0.05) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>Comunidade</SectionLabel>
            <SectionTitle>O Poder da Nossa Comunidade</SectionTitle>
            <p style={{ fontSize: 16.5, color: T.muted, maxWidth: 500, margin: "0 auto", lineHeight: 1.72 }}>
              Centenas de profissionais já transformaram seus negócios com o GestãoGarden.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }} className="col-2-mobile">
          {cards.map(({ label, number, title, desc }, i) => (
            <Reveal key={label} delay={i * 0.08}>
              <div className="card-hover card-hover-green" style={{
                background: T.bg2, border: `1px solid ${T.border}`,
                borderRadius: 16, padding: "32px",
                background: `linear-gradient(135deg, #0e1f10 0%, ${T.bg2} 100%)`,
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, marginBottom: 12 }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 54, fontWeight: 800, letterSpacing: "-2px",
                  color: T.green, lineHeight: 1, marginBottom: 14,
                }}>
                  {number}
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.58 }}>{desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   TOOLS MARQUEE
───────────────────────────────────────────── */
function ToolsMarquee() {
  const tools = [
    { icon: <CreditCard size={17} />, label: "Stripe Payments" },
    { icon: <MessageSquare size={17} />, label: "WhatsApp" },
    { icon: <Globe size={17} />, label: "Supabase" },
    { icon: <Bot size={17} />, label: "Groq AI" },
    { icon: <Bell size={17} />, label: "Push Notifications" },
    { icon: <Map size={17} />, label: "Google Maps" },
    { icon: <Smartphone size={17} />, label: "App Mobile" },
    { icon: <Mic size={17} />, label: "Whisper AI" },
    { icon: <Cloud size={17} />, label: "Vercel Edge" },
    { icon: <Zap size={17} />, label: "Webhooks" },
  ]
  const repeated = [...tools, ...tools]

  return (
    <section style={{ padding: "72px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 40 }}>
        <Reveal>
          <SectionLabel>Integrações</SectionLabel>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 10 }}>
            Conectado com as Ferramentas que Você Usa
          </h2>
          <p style={{ fontSize: 15.5, color: T.muted }}>Pagamentos, comunicação e muito mais integrados nativamente.</p>
        </Reveal>
      </div>

      <div style={{ position: "relative" }}>
        {/* Fade masks */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 120,
          background: `linear-gradient(to right, ${T.bg}, transparent)`,
          zIndex: 2, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 120,
          background: `linear-gradient(to left, ${T.bg}, transparent)`,
          zIndex: 2, pointerEvents: "none",
        }} />

        <div className="marquee-track" style={{ display: "flex", gap: 14, width: "max-content" }}>
          {repeated.map(({ icon, label }, i) => (
            <div key={`${label}-${i}`} className="card-hover" style={{
              display: "flex", alignItems: "center", gap: 10,
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 100, padding: "12px 22px",
              fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
              color: T.muted, flexShrink: 0,
              cursor: "default",
            }}>
              <span style={{ color: T.green }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */
const testimonials = [
  {
    title: "Finalmente Consigo Ver Para Onde Vai Meu Dinheiro",
    body: "Antes controlava tudo no papel e sempre errava as contas. Com o GestãoGarden, vejo tudo em tempo real. Mudou completamente minha visão do negócio.",
    name: "Marco Rodrigues", role: "Jardinagem Rodrigues, Belo Horizonte", init: "MR",
  },
  {
    title: "A Íris Mudou Completamente Como Eu Trabalho",
    body: "Agendo clientes por voz enquanto estou com as mãos sujas de terra. Só falo o que preciso e a Íris faz tudo. Parece mágica mas é tecnologia de verdade.",
    name: "Juliana Santos", role: "Verde Vida Paisagismo, São Paulo", init: "JS",
  },
  {
    title: "Economizo 3 Horas Por Dia com o Sistema",
    body: "Antes perdia horas confirmando horários no WhatsApp. Agora tudo fica organizado e registrado automaticamente. Uso esse tempo para fazer mais serviços.",
    name: "André Costa", role: "Jardineiro Autônomo, Curitiba", init: "AC",
  },
  {
    title: "Profissionalizei Minha Empresa em Uma Semana",
    body: "Organizei 47 clientes, criei orçamentos padronizados e montei minha agenda completa. Meus clientes perceberam a diferença na hora.",
    name: "Pedro Lima", role: "Eco Jardins, Goiânia", init: "PL",
  },
  {
    title: "O App Mobile é Perfeito para o Trabalho em Campo",
    body: "Uso direto do celular quando estou no cliente. Lanço o serviço na hora e já gera a ordem. Minha empresa ficou muito mais profissional.",
    name: "Ricardo Ferreira", role: "Ferreira Jardins, Porto Alegre", init: "RF",
  },
  {
    title: "Dobrei Minha Receita em 6 Meses",
    body: "Com o controle financeiro descobri que estava cobrando barato. Reajustei os preços e organizei os serviços. Hoje fatura o dobro com menos esforço.",
    name: "Cláudia Mendes", role: "Mendes Paisagismo, Brasília", init: "CM",
  },
]

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="card-hover" style={{
      width: 310, flexShrink: 0,
      background: T.bg2, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
        {Array(5).fill(0).map((_, i) => (
          <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
        ))}
      </div>
      <h3 style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.2px", lineHeight: 1.35, marginBottom: 10 }}>
        {t.title}
      </h3>
      <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.64, marginBottom: 18 }}>{t.body}</p>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: T.greenGlow, border: "1px solid rgba(26,255,94,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: T.green, flexShrink: 0,
        }}>
          {t.init}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{t.role}</div>
        </div>
      </div>
    </div>
  )
}

function Testimonials() {
  const row1 = [...testimonials, ...testimonials]
  const row2 = [...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)]

  return (
    <section id="depoimentos" style={{ padding: "80px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 48 }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, marginBottom: 14 }}>
            {Array(5).fill(0).map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
          </div>
          <SectionLabel>Avaliado 4.9/5 por +500 usuários</SectionLabel>
          <SectionTitle>Depoimentos que Falam por Si</SectionTitle>
          <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.7 }}>
            Veja o que os profissionais de jardinagem dizem sobre o GestãoGarden.
          </p>
        </Reveal>
      </div>

      {/* Row 1 */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
        <div className="marquee-track-slow" style={{ display: "flex", gap: 14, width: "max-content" }}>
          {row1.map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      </div>

      {/* Row 2 — reverse */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: "none" }} />
        <div className="marquee-track-reverse" style={{ display: "flex", gap: 14, width: "max-content" }}>
          {row2.map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   PRICING
───────────────────────────────────────────── */
const planFeatures = {
  trial: [
    { text: "Acesso completo à plataforma", ok: true },
    { text: "App mobile iOS + Android", ok: true },
    { text: "Assistente IA Íris", ok: true },
    { text: "Até 10 clientes", ok: true },
    { text: "Agendamentos ilimitados", ok: false },
    { text: "Suporte prioritário", ok: false },
  ],
  basic: [
    { text: "Clientes ilimitados", ok: true },
    { text: "Agenda completa", ok: true },
    { text: "Ordens de serviço", ok: true },
    { text: "Controle financeiro", ok: true },
    { text: "Assistente IA Íris", ok: true },
    { text: "App mobile iOS + Android", ok: true },
    { text: "Suporte via WhatsApp", ok: true },
    { text: "Planos de manutenção", ok: false },
  ],
  plus: [
    { text: "Tudo do Plano Básico", ok: true },
    { text: "Planos de manutenção", ok: true },
    { text: "Relatórios avançados", ok: true },
    { text: "Gestão de estoque", ok: true },
    { text: "Múltiplos usuários", ok: true },
    { text: "Orçamentos em PDF", ok: true },
    { text: "Suporte prioritário", ok: true },
    { text: "Notas e tarefas avançadas", ok: true },
  ],
}

function PlanFeature({ text, ok }: { text: string; ok: boolean }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: ok ? T.muted : T.subtle }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: ok ? "rgba(26,255,94,0.12)" : "transparent",
        border: ok ? "1px solid rgba(26,255,94,0.24)" : `1px solid ${T.border}`,
        color: ok ? T.green : T.subtle,
      }}>
        {ok ? <Check size={10} strokeWidth={3} /> : <Minus size={10} strokeWidth={2} />}
      </span>
      {text}
    </li>
  )
}

function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="preços" style={{ padding: "100px 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>

        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel>Preços</SectionLabel>
            <SectionTitle>Planos que Cabem no Seu Negócio</SectionTitle>
            <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.72 }}>
              Sem taxa de adesão, sem contratos longos. Cancele quando quiser.
            </p>

            {/* Toggle */}
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 100, padding: 4 }}>
              <div className="toggle-pill" style={{
                left: yearly ? "calc(50% - 2px)" : 4,
                width: yearly ? "calc(50% - 2px)" : "calc(50% - 2px)",
              }} />
              {[{ label: "Mensal", val: false }, { label: "Anual", val: true }].map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => setYearly(val)}
                  style={{
                    position: "relative", zIndex: 1,
                    padding: "8px 24px", borderRadius: 100, border: "none",
                    background: "transparent", cursor: "pointer",
                    fontSize: 14, fontWeight: 700,
                    color: yearly === val ? T.bg : T.muted,
                    transition: "color 0.22s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                  {val && (
                    <span style={{
                      marginLeft: 6, fontSize: 10.5,
                      background: yearly ? "rgba(0,0,0,0.15)" : "rgba(26,255,94,0.15)",
                      color: yearly ? "#000" : T.green,
                      padding: "2px 7px", borderRadius: 100, fontWeight: 700,
                    }}>-20%</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.08fr 1fr", gap: 16, alignItems: "start" }} className="col-1-mobile">

          {/* Trial */}
          <Reveal delay={0}>
            <div className="card-hover" style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: 28,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", marginBottom: 8 }}>Trial Gratuito</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 22 }}>Para conhecer o GestãoGarden sem compromisso.</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 4 }}>7 dias</div>
              <div style={{ fontSize: 12, color: T.subtle, marginBottom: 22 }}>Completamente grátis</div>
              <Link href="/auth/register" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "12px", borderRadius: 10, border: `1px solid ${T.border}`,
                color: T.text, fontSize: 14, fontWeight: 700, textDecoration: "none",
                transition: "border-color 0.18s, background 0.18s",
              }}>
                Começar Grátis
              </Link>
              <Divider />
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {planFeatures.trial.map(f => <PlanFeature key={f.text} {...f} />)}
              </ul>
            </div>
          </Reveal>

          {/* Básico — featured */}
          <Reveal delay={0.08}>
            <div className="card-hover card-hover-green" style={{
              background: `linear-gradient(180deg, rgba(26,255,94,0.05) 0%, ${T.bg2} 100%)`,
              border: "1px solid rgba(26,255,94,0.28)",
              borderRadius: 20, padding: 28, position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: T.green, color: "#000",
                fontSize: 11, fontWeight: 800,
                padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap",
              }}>
                Mais Popular
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", marginBottom: 8, color: T.green }}>Plano Básico</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 22 }}>Para jardineiros autônomos e pequenas empresas.</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: T.muted }}>R$</span>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1 }}>
                  {yearly ? "38" : "47"}
                </span>
                <span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}>,90/mês</span>
              </div>
              <div style={{ fontSize: 12, color: T.subtle, marginBottom: 22, transition: "all 0.2s" }}>
                {yearly ? "Cobrado anualmente: R$ 459,00" : "ou R$ 459,00/ano (economize R$ 115)"}
              </div>
              <Link href="/auth/register" className="btn-primary-glow" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px", borderRadius: 10,
                background: T.green, color: "#000",
                fontSize: 14, fontWeight: 800, textDecoration: "none",
                animation: "btnGlow 3s ease-in-out infinite",
              }}>
                Começar Agora <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <Divider />
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {planFeatures.basic.map(f => <PlanFeature key={f.text} {...f} />)}
              </ul>
            </div>
          </Reveal>

          {/* Plus */}
          <Reveal delay={0.16}>
            <div className="card-hover" style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: 28,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", marginBottom: 8 }}>Plano Plus</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 22 }}>Para empresas que querem controle total do negócio.</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: T.muted }}>R$</span>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1 }}>
                  {yearly ? "62" : "77"}
                </span>
                <span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}>,90/mês</span>
              </div>
              <div style={{ fontSize: 12, color: T.subtle, marginBottom: 22 }}>
                {yearly ? "Cobrado anualmente: R$ 748,00" : "ou R$ 748,00/ano (economize R$ 187)"}
              </div>
              <Link href="/auth/register" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "12px", borderRadius: 10, border: `1px solid ${T.border}`,
                color: T.text, fontSize: 14, fontWeight: 700, textDecoration: "none",
                transition: "border-color 0.18s, background 0.18s",
              }}>
                Assinar Plus
              </Link>
              <Divider />
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {planFeatures.plus.map(f => <PlanFeature key={f.text} {...f} />)}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   CTA FINAL
───────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{ padding: "60px 0 100px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{
            background: "linear-gradient(135deg, rgba(26,255,94,0.06) 0%, rgba(0,0,0,0) 60%)",
            border: "1px solid rgba(26,255,94,0.14)",
            borderRadius: 28, padding: "80px 48px",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Ambient */}
            <div style={{
              position: "absolute", top: "-40%", left: "50%", transform: "translateX(-50%)",
              width: 500, height: 300,
              background: "radial-gradient(ellipse, rgba(26,255,94,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {["MR","JS","AC","PL"].map(i => <Avatar key={i} initials={i} />)}
                </div>
                <span style={{ fontSize: 13.5, color: T.muted }}>+500 profissionais já começaram</span>
              </div>

              <h2 style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "clamp(34px, 5vw, 60px)",
                fontWeight: 800, letterSpacing: "-2px",
                lineHeight: 1.08, marginBottom: 18,
              }}>
                Comece a Gerir Seu<br />Negócio Hoje
              </h2>

              <p style={{ fontSize: 17, color: T.muted, marginBottom: 36, lineHeight: 1.72, maxWidth: 480, margin: "0 auto 36px" }}>
                7 dias grátis, sem cartão. Configure em minutos e veja a diferença na sua produtividade.
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <Link href="/auth/register" className="btn-primary-glow" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 28px", borderRadius: 100,
                  background: T.green, color: "#000",
                  fontSize: 15, fontWeight: 800, textDecoration: "none",
                }}>
                  Começar Grátis — 7 dias
                  <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
                <Link href="#funcionalidades" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "13px 26px", borderRadius: 100,
                  border: `1px solid ${T.border}`, color: T.text,
                  fontSize: 15, fontWeight: 600, textDecoration: "none",
                }}>
                  Ver Funcionalidades
                </Link>
              </div>

              <p style={{ marginTop: 18, fontSize: 13, color: T.subtle }}>
                Sem cartão de crédito. Cancele a qualquer momento.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: "56px 0 40px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="col-2-mobile">

          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: "#d4f0d9", letterSpacing: "-0.4px" }}>Gestão</span>
              <span style={{
                fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: "-0.4px",
                background: `linear-gradient(90deg, #7dffaa, ${T.green})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Garden</span>
            </div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.64, maxWidth: 230 }}>
              A plataforma de gestão feita especialmente para profissionais de jardinagem e paisagismo do Brasil.
            </p>
          </div>

          {[
            {
              title: "Produto",
              links: ["Funcionalidades", "Preços", "App Mobile", "Novidades", "Roadmap"],
            },
            {
              title: "Suporte",
              links: ["Central de Ajuda", "WhatsApp", "Documentação", "Status do Sistema"],
            },
            {
              title: "Empresa",
              links: ["Sobre", "Blog", "Política de Privacidade", "Termos de Uso"],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{title}</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(l => (
                  <li key={l}>
                    <Link href="#" style={{ fontSize: 13, color: T.muted, textDecoration: "none", transition: "color 0.18s" }}>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 28, borderTop: `1px solid ${T.border}`,
          fontSize: 13, color: T.subtle,
        }}>
          <span>© 2026 GestãoGarden. Todos os direitos reservados.</span>
          <span>Feito para jardineiros brasileiros</span>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────
   PAGE — EXPORT DEFAULT
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />

      {/* Radial bg glow global */}
      <div style={{
        position: "fixed", top: "-20%", left: "50%",
        transform: "translateX(-50%)",
        width: 860, height: 560,
        background: "radial-gradient(ellipse, rgba(26,255,94,0.065) 0%, transparent 68%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <Hero />
        <TrustBar />
        <About />
        <Features />
        <Stats />
        <ToolsMarquee />
        <Testimonials />
        <Pricing />
        <CTASection />
        <Footer />
      </div>
    </>
  )
}
