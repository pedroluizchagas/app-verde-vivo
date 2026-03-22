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
  Phone,
  Mail,
  MapPin,
  UserPlus,
  Clock3,
  CalendarDays,
  User,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  AlertCircle,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Droplets,
  Send,
  LogOut,
  UserCircle,
  Settings,
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
  @keyframes dashboardRise {
    from {
      opacity: 0;
      transform: perspective(1200px) translateY(150px);
    }
    to {
      opacity: 1;
      transform: perspective(1200px) translateY(0);
    }
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

  /* Dashboard rise — fade-in one-shot, 3D driven by scroll */
  .dashboard-rise {
    opacity: 0;
    transform-origin: center bottom;
    transition: opacity 0.8s cubic-bezier(0.22,0.68,0.35,1.0);
    will-change: transform, opacity;
  }
  .dashboard-rise.visible {
    opacity: 1;
  }

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
                <div
                  onClick={() => setActiveView("Perfil")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: T.bg3, border: `1px solid ${T.border}`,
                    borderRadius: 20, padding: "3px 10px 3px 3px",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderHover)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                >
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

      case "Clientes": {
        /* Paleta de cores dos avatares (6 cores rotativas como no real) */
        const avatarColors = [
          { bg: "rgba(16,185,129,0.15)", color: mockLightMode ? "#059669" : "#34d399" },
          { bg: "rgba(59,130,246,0.15)", color: mockLightMode ? "#2563eb" : "#60a5fa" },
          { bg: "rgba(139,92,246,0.15)", color: mockLightMode ? "#7c3aed" : "#a78bfa" },
          { bg: "rgba(245,158,11,0.15)", color: mockLightMode ? "#d97706" : "#fbbf24" },
          { bg: "rgba(244,63,94,0.15)", color: mockLightMode ? "#e11d48" : "#fb7185" },
          { bg: "rgba(20,184,166,0.15)", color: mockLightMode ? "#0d9488" : "#2dd4bf" },
        ]
        const getAvatarStyle = (name: string) => avatarColors[name.charCodeAt(0) % 6]

        /* Dados mock dos clientes agrupados alfabeticamente */
        const clientGroups = [
          { letter: "A", clients: [
            { name: "André Costa", phone: "(21) 99876-5432", email: "andre@email.com", address: "R. das Flores, 45" },
          ]},
          { letter: "C", clients: [
            { name: "Cláudia Ferreira", phone: "(11) 93456-7890", email: null, address: "Av. Paulista, 1200" },
            { name: "Carlos Mendes", phone: "(11) 94567-8901", email: "carlos.m@email.com", address: null },
          ]},
          { letter: "J", clients: [
            { name: "Juliana Santos", phone: "(11) 91234-5678", email: "ju.santos@email.com", address: "R. Augusta, 320" },
          ]},
          { letter: "M", clients: [
            { name: "Marco Rodrigues", phone: "(11) 98765-4321", email: "marco.r@email.com", address: "R. Oscar Freire, 89" },
            { name: "Marina Oliveira", phone: "(11) 92345-6789", email: "marina@email.com", address: null },
          ]},
          { letter: "P", clients: [
            { name: "Pedro Lima", phone: "(11) 97654-3210", email: null, address: "R. Consolação, 500" },
          ]},
        ]

        const getInitials = (name: string) => name.split(" ").slice(0, 2).map(w => w.charAt(0).toUpperCase()).join("")

        return (
          <>
            {/* Header: título + botão circular add */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>Clientes</div>
                <div style={{ fontSize: 11, color: T.muted }}>48 clientes cadastrados</div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: T.green, color: onGreen,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 600, lineHeight: 1,
              }}>+</div>
            </div>

            {/* KPI Strip — 3 cards com ícones */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Total", value: "48", sub: "clientes", icon: <Users size={10} /> },
                { label: "Novos", value: "5", sub: "este mês", icon: <UserCheck size={10} /> },
                { label: "Ativos", value: "31", sub: "últimos 30 dias", icon: <UserCheck size={10} /> },
              ].map(k => (
                <div key={k.label} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 11px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, fontWeight: 500 }}>{k.label}</div>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: ca(0.06),
                      display: "flex", alignItems: "center", justifyContent: "center", color: T.muted,
                    }}>{k.icon}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px", color: T.text }}>{k.value}</div>
                  <div style={{ fontSize: 8, color: T.muted, marginTop: 1 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Barra de busca */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: T.bg3, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "8px 10px", marginBottom: 14,
            }}>
              <Search size={11} style={{ color: T.muted, flexShrink: 0 }} />
              <span style={{ fontSize: 9.5, color: T.subtle }}>Buscar por nome, telefone ou endereço...</span>
            </div>

            {/* Lista agrupada alfabeticamente */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {clientGroups.map(group => (
                <div key={group.letter}>
                  {/* Header do grupo: letra + linha + contagem */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, flexShrink: 0 }}>{group.letter}</span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <span style={{ fontSize: 7.5, color: T.muted, flexShrink: 0 }}>{group.clients.length}</span>
                  </div>
                  {/* Grid de cards 2 colunas */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {group.clients.map(c => {
                      const avStyle = getAvatarStyle(c.name)
                      return (
                        <div key={c.name} style={{
                          background: T.bg3, border: `1px solid ${T.border}`,
                          borderRadius: 10, padding: "10px 10px",
                          display: "flex", alignItems: "center", gap: 8,
                        }}>
                          {/* Avatar colorido */}
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                            background: avStyle.bg, color: avStyle.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 700,
                          }}>{getInitials(c.name)}</div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 10, fontWeight: 600, color: T.text, lineHeight: 1.2,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3,
                            }}>{c.name}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Phone size={7} style={{ color: T.muted, flexShrink: 0 }} />
                                <span style={{ fontSize: 7.5, color: T.muted }}>{c.phone}</span>
                              </div>
                              {c.email && (
                                <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                                  <Mail size={7} style={{ color: T.muted, flexShrink: 0 }} />
                                  <span style={{ fontSize: 7.5, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span>
                                </div>
                              )}
                            </div>
                            {c.address && (
                              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                                <MapPin size={7} style={{ color: T.muted, flexShrink: 0 }} />
                                <span style={{ fontSize: 7.5, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      }

      case "Agenda": {
        /* Cores de status */
        const statusColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
          scheduled:   { bg: "rgba(59,130,246,0.10)", text: mockLightMode ? "#2563eb" : "#60a5fa", border: "#3b82f6", dot: "#3b82f6" },
          in_progress: { bg: "rgba(245,158,11,0.10)", text: mockLightMode ? "#d97706" : "#fbbf24", border: "#f59e0b", dot: "#f59e0b" },
          completed:   { bg: "rgba(16,185,129,0.10)", text: mockLightMode ? "#059669" : "#34d399", border: "#10b981", dot: "#10b981" },
        }
        const statusLabels: Record<string, string> = { scheduled: "Agendado", in_progress: "Em andamento", completed: "Concluído" }
        const typeLabelsAg: Record<string, string> = { service: "Serviço", technical_visit: "Visita técnica", meeting: "Reunião" }

        /* Dados mock */
        const todayAppts = [
          { day: 22, month: "Mar", time: "08:00 – 10:00", title: "Poda de arbustos", type: "service", client: "Marco Rodrigues", address: "R. Oscar Freire, 89", status: "completed" },
          { day: 22, month: "Mar", time: "10:30 – 12:00", title: "Manutenção jardim", type: "service", client: "Juliana Santos", address: "R. Augusta, 320", status: "in_progress" },
          { day: 22, month: "Mar", time: "14:00 – 16:00", title: "Plantio de mudas", type: "service", client: "André Costa", address: "R. das Flores, 45", status: "scheduled" },
        ]
        const tomorrowAppts = [
          { day: 23, month: "Mar", time: "09:00 – 11:00", title: "Irrigação automática", type: "technical_visit", client: "Pedro Lima", address: "R. Consolação, 500", status: "scheduled" },
          { day: 23, month: "Mar", time: "15:00 – 17:00", title: "Limpeza de terreno", type: "service", client: "Cláudia Ferreira", address: "Av. Paulista, 1200", status: "scheduled" },
        ]

        /* Mini calendário — dias do mês de março 2026 */
        const calDays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]
        const marchStart = 0 // Março 2026 começa no domingo
        const marchDays = 31
        const calCells: (number | null)[] = [...Array(marchStart).fill(null), ...Array.from({ length: marchDays }, (_, i) => i + 1)]

        return (
          <>
            {/* Header — largura total */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>Agenda</div>
                <div style={{ fontSize: 11, color: T.muted }}>9 agendamentos próximos</div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: T.green, color: onGreen,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 600, lineHeight: 1,
              }}>+</div>
            </div>

            {/* KPI Strip — largura total */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Hoje", value: "3", sub: "agendamentos", icon: <Clock3 size={10} /> },
                { label: "Esta semana", value: "8", sub: "próximos", icon: <CalendarDays size={10} /> },
                { label: "Concluídos", value: "22", sub: "este mês", icon: <CheckCircle2 size={10} /> },
              ].map(k => (
                <div key={k.label} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 11px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, fontWeight: 500 }}>{k.label}</div>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: ca(0.06),
                      display: "flex", alignItems: "center", justifyContent: "center", color: T.muted,
                    }}>{k.icon}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px", color: T.text }}>{k.value}</div>
                  <div style={{ fontSize: 8, color: T.muted, marginTop: 1 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Grid: Tabs+Lista ao lado de Calendário+Serviços ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, flex: 1, minHeight: 0 }}>
              {/* ── Coluna principal: Tabs + Compromissos ── */}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 0, marginBottom: 12, background: T.bg3, borderRadius: 8, padding: 3 }}>
                  <div style={{
                    flex: 1, textAlign: "center", fontSize: 9, fontWeight: 600, padding: "5px 0",
                    borderRadius: 6, background: T.bg, color: T.text,
                    boxShadow: `0 1px 2px ${ca(0.08)}`,
                  }}>
                    Próximos
                    <span style={{
                      marginLeft: 4, fontSize: 7.5, fontWeight: 500,
                      padding: "1px 5px", borderRadius: 8,
                      background: ga(0.1), color: T.green,
                    }}>5</span>
                  </div>
                  <div style={{
                    flex: 1, textAlign: "center", fontSize: 9, fontWeight: 500, padding: "5px 0",
                    borderRadius: 6, color: T.muted,
                  }}>Anteriores</div>
                </div>

                {/* ── Grupo: Hoje ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%", background: T.green,
                    boxShadow: `0 0 4px ${ga(0.5)}`,
                    animation: "pulse 2s infinite",
                  }} />
                  <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.green, flexShrink: 0 }}>Hoje</span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span style={{ fontSize: 7.5, color: T.muted, flexShrink: 0 }}>3 serviços</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                  {todayAppts.map((ap, i) => {
                    const sc = statusColors[ap.status]
                    return (
                      <div key={i} style={{
                        background: T.bg3, border: `1px solid ${T.border}`,
                        borderRadius: 10, borderLeft: `3px solid ${sc.border}`,
                        padding: "9px 10px",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        {/* Date block */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: ca(0.05),
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, color: T.text, fontVariantNumeric: "tabular-nums" }}>{ap.day}</div>
                          <div style={{ fontSize: 6.5, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, marginTop: 1 }}>{ap.month}</div>
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ap.title}</span>
                            <span style={{
                              fontSize: 7, fontWeight: 500, padding: "1px 5px", borderRadius: 8,
                              background: ca(0.06), color: T.muted, flexShrink: 0,
                            }}>{typeLabelsAg[ap.type]}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock3 size={7} style={{ color: T.muted, flexShrink: 0 }} />
                              <span style={{ fontSize: 7.5, color: T.muted }}>{ap.time}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <User size={7} style={{ color: T.muted, flexShrink: 0 }} />
                              <span style={{ fontSize: 7.5, color: T.muted }}>{ap.client}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                              <MapPin size={7} style={{ color: T.muted, flexShrink: 0 }} />
                              <span style={{ fontSize: 7.5, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ap.address}</span>
                            </div>
                          </div>
                        </div>
                        {/* Status badge */}
                        <div style={{
                          fontSize: 7, fontWeight: 500, padding: "3px 6px", borderRadius: 8,
                          background: sc.bg, color: sc.text, flexShrink: 0, whiteSpace: "nowrap",
                        }}>{statusLabels[ap.status]}</div>
                      </div>
                    )
                  })}
                </div>

                {/* ── Grupo: Amanhã ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, flexShrink: 0 }}>Amanhã</span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span style={{ fontSize: 7.5, color: T.muted, flexShrink: 0 }}>2 serviços</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {tomorrowAppts.map((ap, i) => {
                    const sc = statusColors[ap.status]
                    return (
                      <div key={i} style={{
                        background: T.bg3, border: `1px solid ${T.border}`,
                        borderRadius: 10, borderLeft: `3px solid ${sc.border}`,
                        padding: "9px 10px",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: ca(0.05),
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, color: T.text, fontVariantNumeric: "tabular-nums" }}>{ap.day}</div>
                          <div style={{ fontSize: 6.5, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, marginTop: 1 }}>{ap.month}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ap.title}</span>
                            <span style={{
                              fontSize: 7, fontWeight: 500, padding: "1px 5px", borderRadius: 8,
                              background: ca(0.06), color: T.muted, flexShrink: 0,
                            }}>{typeLabelsAg[ap.type]}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock3 size={7} style={{ color: T.muted, flexShrink: 0 }} />
                              <span style={{ fontSize: 7.5, color: T.muted }}>{ap.time}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <User size={7} style={{ color: T.muted, flexShrink: 0 }} />
                              <span style={{ fontSize: 7.5, color: T.muted }}>{ap.client}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                              <MapPin size={7} style={{ color: T.muted, flexShrink: 0 }} />
                              <span style={{ fontSize: 7.5, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ap.address}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: 7, fontWeight: 500, padding: "3px 6px", borderRadius: 8,
                          background: sc.bg, color: sc.text, flexShrink: 0, whiteSpace: "nowrap",
                        }}>{statusLabels[ap.status]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Coluna lateral: Calendário + Serviços de hoje ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Mini calendário */}
                <div style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <ChevronLeft size={10} style={{ color: T.muted, cursor: "pointer" }} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: T.text }}>Março 2026</span>
                    <ChevronRight size={10} style={{ color: T.muted, cursor: "pointer" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, marginBottom: 2 }}>
                    {calDays.map(d => (
                      <div key={d} style={{ fontSize: 6, fontWeight: 700, color: T.subtle, textAlign: "center", padding: "2px 0" }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
                    {calCells.map((day, i) => (
                      <div key={i} style={{
                        fontSize: 7, textAlign: "center", padding: "3px 0",
                        fontWeight: day === 22 ? 700 : 400,
                        color: day === 22 ? onGreen : day ? T.muted : "transparent",
                        borderRadius: "50%",
                        ...(day === 22 ? {
                          background: T.green,
                          width: 16, height: 16, lineHeight: "16px",
                          borderRadius: "50%", margin: "0 auto",
                          padding: 0,
                        } : {}),
                      }}>{day ?? ""}</div>
                    ))}
                  </div>
                </div>

                {/* Serviços de hoje */}
                <div style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: T.text }}>Serviços de hoje</span>
                    <span style={{
                      fontSize: 7, fontWeight: 500, padding: "1px 5px", borderRadius: 8,
                      background: ga(0.1), color: T.green,
                    }}>3</span>
                  </div>
                  {todayAppts.map((ap, i) => {
                    const dotColor = statusColors[ap.status].dot
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "6px 4px",
                        borderTop: i > 0 ? `1px solid ${ca(0.04)}` : "none",
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 7, color: T.muted, fontVariantNumeric: "tabular-nums", flexShrink: 0, width: 24 }}>{ap.time.split(" – ")[0]}</span>
                        <span style={{ fontSize: 8, fontWeight: 500, color: T.text, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ap.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )
      }

      case "Ordens de Serviço": {
        /* Cores de status das OS */
        const osStatusStyles: Record<string, { bg: string; text: string; border: string }> = {
          draft:     { bg: ca(0.06), text: T.muted, border: T.border },
          issued:    { bg: "rgba(59,130,246,0.10)", text: mockLightMode ? "#2563eb" : "#60a5fa", border: "#3b82f6" },
          completed: { bg: "rgba(16,185,129,0.10)", text: mockLightMode ? "#059669" : "#34d399", border: "#10b981" },
          cancelled: { bg: "rgba(239,68,68,0.10)", text: mockLightMode ? "#dc2626" : "#f87171", border: "#ef4444" },
        }
        const osStatusLabels: Record<string, string> = { draft: "Rascunho", issued: "Emitida", completed: "Concluída", cancelled: "Cancelada" }

        /* Dados mock */
        const activeOrders = [
          { title: "Paisagismo completo", client: "Marco Rodrigues", date: "18 mar 2026", status: "issued", amount: "R$ 3.200" },
          { title: "Instalação de irrigação", client: "Juliana Santos", date: "15 mar 2026", status: "draft", amount: "R$ 1.850" },
          { title: "Limpeza e adubação", client: "Cláudia Ferreira", date: "20 mar 2026", status: "issued", amount: "R$ 980" },
        ]
        const historyOrders = [
          { title: "Poda de árvores", client: "Pedro Lima", date: "10 mar 2026", status: "completed", amount: "R$ 980" },
          { title: "Replantio canteiro", client: "André Costa", date: "05 mar 2026", status: "completed", amount: "R$ 650" },
        ]

        return (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>Ordens de Serviço</div>
                <div style={{ fontSize: 11, color: T.muted }}>12 OS cadastradas</div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: T.green, color: onGreen,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 600, lineHeight: 1,
              }}>+</div>
            </div>

            {/* KPI Strip — 4 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Total", value: "12", sub: "ordens", icon: <ClipboardList size={10} /> },
                { label: "Em aberto", value: "3", sub: "ativas", icon: <Loader2 size={10} /> },
                { label: "Concluídas", value: "7", sub: "este mês", icon: <CheckCircle2 size={10} /> },
                { label: "Receita", value: "R$ 14K", sub: "concluídas", icon: <DollarSign size={10} /> },
              ].map(k => (
                <div key={k.label} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 11px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, fontWeight: 500 }}>{k.label}</div>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: ca(0.06),
                      display: "flex", alignItems: "center", justifyContent: "center", color: T.muted,
                    }}>{k.icon}</div>
                  </div>
                  <div style={{ fontSize: k.label === "Receita" ? 13 : 16, fontWeight: 800, letterSpacing: "-0.4px", color: T.text }}>{k.value}</div>
                  <div style={{ fontSize: 8, color: T.muted, marginTop: 1 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 12, background: T.bg3, borderRadius: 8, padding: 3 }}>
              <div style={{
                flex: 1, textAlign: "center", fontSize: 9, fontWeight: 600, padding: "5px 0",
                borderRadius: 6, background: T.bg, color: T.text,
                boxShadow: `0 1px 2px ${ca(0.08)}`,
              }}>
                Em andamento
                <span style={{
                  marginLeft: 4, fontSize: 7.5, fontWeight: 500,
                  padding: "1px 5px", borderRadius: 8,
                  background: ga(0.1), color: T.green,
                }}>3</span>
              </div>
              <div style={{
                flex: 1, textAlign: "center", fontSize: 9, fontWeight: 500, padding: "5px 0",
                borderRadius: 6, color: T.muted,
              }}>Histórico</div>
            </div>

            {/* Lista de OS ativas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {activeOrders.map((o, i) => {
                const ss = osStatusStyles[o.status]
                return (
                  <div key={i} style={{
                    background: T.bg3, border: `1px solid ${T.border}`,
                    borderRadius: 10, borderLeft: `3px solid ${ss.border}`,
                    padding: "10px 12px",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    {/* Conteúdo esquerdo */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.title}</span>
                        <span style={{
                          fontSize: 7, fontWeight: 500, padding: "2px 6px", borderRadius: 8,
                          background: ss.bg, color: ss.text, flexShrink: 0, whiteSpace: "nowrap",
                        }}>{osStatusLabels[o.status]}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <User size={7} style={{ color: T.muted, flexShrink: 0 }} />
                          <span style={{ fontSize: 7.5, color: T.muted }}>{o.client}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Calendar size={7} style={{ color: T.muted, flexShrink: 0 }} />
                          <span style={{ fontSize: 7.5, color: T.muted }}>{o.date}</span>
                        </div>
                      </div>
                    </div>
                    {/* Valor à direita */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>{o.amount}</div>
                      <div style={{ fontSize: 7, color: T.muted }}>total</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      }

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

      case "Financeiro": {
        /* Cores de receita / despesa */
        const incomeColor = mockLightMode ? "#059669" : "#34d399"
        const expenseColor = mockLightMode ? "#ef4444" : "#f87171"
        const amberColor = mockLightMode ? "#d97706" : "#fbbf24"

        /* Dados mock de transações */
        const transactions = [
          { desc: "Serviço de paisagismo", cat: "Serviços", client: "Marco Rodrigues", type: "income", amount: "R$ 3.200", date: "22 mar", status: "paid" },
          { desc: "Compra de fertilizantes", cat: "Insumos", client: null, type: "expense", amount: "R$ 280", date: "21 mar", status: "paid" },
          { desc: "Manutenção mensal", cat: "Serviços", client: "Juliana Santos", type: "income", amount: "R$ 1.500", date: "20 mar", status: "paid" },
          { desc: "Combustível", cat: "Transporte", client: null, type: "expense", amount: "R$ 350", date: "19 mar", status: "pending" },
          { desc: "Poda e limpeza", cat: "Serviços", client: "Pedro Lima", type: "income", amount: "R$ 850", date: "18 mar", status: "paid" },
        ]

        /* Pendentes (forecast) */
        const pending = [
          { desc: "Manutenção Cond. Jardins", type: "income", amount: "R$ 2.800", due: "25 mar" },
          { desc: "Aluguel ferramentas", type: "expense", amount: "R$ 420", due: "28 mar" },
        ]

        /* Vencimentos próximos */
        const alerts = [
          { desc: "Combustível março", type: "expense", amount: "R$ 350", due: "24 mar" },
          { desc: "Manutenção Cond. Jardins", type: "income", amount: "R$ 2.800", due: "25 mar" },
        ]

        return (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>Financeiro</div>
                <div style={{ fontSize: 11, color: T.muted }}>Março de 2026</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{
                  fontSize: 8, fontWeight: 500, padding: "5px 10px", borderRadius: 8,
                  border: `1px solid ${T.border}`, color: T.muted,
                }}>Categorias</div>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: T.green, color: onGreen,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 600, lineHeight: 1,
                }}>+</div>
              </div>
            </div>

            {/* KPI Strip — 4 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Saldo atual", value: "R$ 5.1K", sub: "receitas − despesas pagas", icon: <DollarSign size={10} />, valueColor: incomeColor },
                { label: "Receitas", value: "R$ 8.4K", sub: "6 lançamentos", icon: <TrendingUp size={10} />, valueColor: incomeColor, iconColor: incomeColor },
                { label: "Despesas", value: "R$ 3.3K", sub: "4 lançamentos", icon: <TrendingDown size={10} />, valueColor: expenseColor, iconColor: expenseColor },
                { label: "Resultado", value: "R$ 5.1K", sub: "receitas − despesas do mês", icon: <Banknote size={10} />, valueColor: incomeColor },
              ].map(k => (
                <div key={k.label} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 11px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, fontWeight: 500 }}>{k.label}</div>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: ca(0.06),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: k.iconColor || T.muted,
                    }}>{k.icon}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.4px", color: k.valueColor, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                  <div style={{ fontSize: 7, color: T.muted, marginTop: 1 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Previsão + Vencimentos lado a lado */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {/* Previsão de fluxo */}
              <div style={{
                background: T.bg3, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "10px 11px",
              }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginBottom: 6 }}>Previsão de fluxo (30 dias)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: incomeColor, fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>+ R$ 2.380</div>
                <div style={{ fontSize: 7, color: T.muted, marginBottom: 8 }}>em lançamentos pendentes</div>
                {pending.map((p, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 0",
                    borderTop: i > 0 ? `1px solid ${ca(0.04)}` : "none",
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                      background: p.type === "income" ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {p.type === "income"
                        ? <ArrowUpRight size={7} style={{ color: incomeColor }} />
                        : <ArrowDownRight size={7} style={{ color: expenseColor }} />
                      }
                    </div>
                    <span style={{ fontSize: 8, color: T.muted, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.desc}</span>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 8, fontWeight: 600, color: p.type === "income" ? incomeColor : expenseColor, fontVariantNumeric: "tabular-nums" }}>
                        {p.type === "income" ? "+" : "−"} {p.amount}
                      </div>
                      <div style={{ fontSize: 6.5, color: T.muted }}>{p.due}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vencimentos próximos */}
              <div style={{
                background: T.bg3, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "10px 11px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: T.text }}>Vencimentos próximos (7 dias)</span>
                  <AlertCircle size={8} style={{ color: amberColor, flexShrink: 0 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {alerts.map((al, i) => (
                    <div key={i} style={{
                      borderRadius: 7, border: `1px solid ${ca(0.06)}`,
                      padding: "7px 8px",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{
                        fontSize: 7, fontWeight: 500, padding: "2px 5px", borderRadius: 8, flexShrink: 0,
                        background: al.type === "income" ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                        color: al.type === "income" ? incomeColor : expenseColor,
                      }}>{al.type === "income" ? "Receita" : "Despesa"}</span>
                      <span style={{ fontSize: 8, color: T.muted, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{al.desc}</span>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 8, fontWeight: 600, color: T.text, fontVariantNumeric: "tabular-nums" }}>{al.amount}</div>
                        <div style={{ fontSize: 6.5, color: T.muted }}>{al.due}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lançamentos do mês */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.text }}>Lançamentos do mês</span>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 10, background: T.bg3, borderRadius: 8, padding: 3 }}>
              <div style={{
                flex: 1, textAlign: "center", fontSize: 9, fontWeight: 600, padding: "5px 0",
                borderRadius: 6, background: T.bg, color: T.text,
                boxShadow: `0 1px 2px ${ca(0.08)}`,
              }}>
                Todos
                <span style={{
                  marginLeft: 4, fontSize: 7.5, fontWeight: 500,
                  padding: "1px 5px", borderRadius: 8,
                  background: ga(0.1), color: T.green,
                }}>5</span>
              </div>
              <div style={{
                flex: 1, textAlign: "center", fontSize: 9, fontWeight: 500, padding: "5px 0",
                borderRadius: 6, color: T.muted,
              }}>
                Receitas
                <span style={{
                  marginLeft: 3, fontSize: 7.5, fontWeight: 500,
                  padding: "1px 5px", borderRadius: 8,
                  background: "rgba(16,185,129,0.10)", color: incomeColor,
                }}>3</span>
              </div>
              <div style={{
                flex: 1, textAlign: "center", fontSize: 9, fontWeight: 500, padding: "5px 0",
                borderRadius: 6, color: T.muted,
              }}>
                Despesas
                <span style={{
                  marginLeft: 3, fontSize: 7.5, fontWeight: 500,
                  padding: "1px 5px", borderRadius: 8,
                  background: "rgba(239,68,68,0.10)", color: expenseColor,
                }}>2</span>
              </div>
            </div>

            {/* Lista de transações */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {transactions.map((t, i) => (
                <div key={i} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  borderLeft: `3px solid ${t.type === "income" ? "#10b981" : "#ef4444"}`,
                  padding: "9px 10px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {/* Ícone circular */}
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: t.type === "income" ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {t.type === "income"
                      ? <ArrowUpRight size={9} style={{ color: incomeColor }} />
                      : <ArrowDownRight size={9} style={{ color: expenseColor }} />
                    }
                  </div>
                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{t.desc}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1px 6px" }}>
                      <span style={{ fontSize: 7.5, color: T.muted }}>{t.cat}{t.client ? ` · ${t.client}` : ""}</span>
                      <span style={{ fontSize: 7.5, color: T.muted }}>{t.date}</span>
                      <span style={{
                        fontSize: 7, fontWeight: 500, padding: "1px 5px", borderRadius: 8,
                        background: t.status === "paid" ? "rgba(16,185,129,0.10)" : "rgba(245,158,11,0.10)",
                        color: t.status === "paid" ? incomeColor : amberColor,
                      }}>{t.status === "paid" ? "Pago" : "Pendente"}</span>
                    </div>
                  </div>
                  {/* Valor */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, flexShrink: 0, fontVariantNumeric: "tabular-nums",
                    color: t.type === "income" ? incomeColor : expenseColor,
                  }}>{t.type === "income" ? "+" : "−"} {t.amount}</div>
                </div>
              ))}
            </div>
          </>
        )
      }

      case "Estoque": {
        const redStock = mockLightMode ? "#dc2626" : "#f87171"

        /* Dados mock de produtos */
        const products = [
          { name: "Adubo NPK 10-10-10", unit: "kg", minStock: 10, qty: 45, cost: "R$ 3,50" },
          { name: "Semente grama esmeralda", unit: "kg", minStock: 5, qty: 3, cost: "R$ 12,00" },
          { name: "Substrato vegetal", unit: "L", minStock: 20, qty: 120, cost: "R$ 1,80" },
          { name: "Defensivo orgânico Neem", unit: "L", minStock: 5, qty: 2, cost: "R$ 28,00" },
          { name: "Muda de primavera", unit: "un", minStock: 10, qty: 30, cost: "R$ 8,50" },
        ]

        /* Movimentações recentes */
        const movements = [
          { product: "Adubo NPK 10-10-10", qty: "10 kg", type: "in", desc: "Compra mensal", date: "22/03", cost: "R$ 3,50" },
          { product: "Semente grama esmeralda", qty: "2 kg", type: "out", desc: "Plantio jardim Marco", date: "21/03", cost: null },
          { product: "Substrato vegetal", qty: "40 L", type: "in", desc: "Reposição", date: "20/03", cost: "R$ 1,80" },
          { product: "Defensivo Neem", qty: "1 L", type: "out", desc: "Aplicação Pedro Lima", date: "19/03", cost: null },
        ]

        return (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>Estoque</div>
                <div style={{ fontSize: 11, color: T.muted }}>Produtos e movimentações</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{
                  fontSize: 8, fontWeight: 500, padding: "5px 10px", borderRadius: 8,
                  border: `1px solid ${T.border}`, color: T.muted,
                }}>Nova movimentação</div>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: T.green, color: onGreen,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 600, lineHeight: 1,
                }}>+</div>
              </div>
            </div>

            {/* KPI Strip — 3 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Produtos", value: "18", sub: "cadastrados", icon: <Package size={10} />, valueColor: T.text },
                { label: "Estoque baixo", value: "2", sub: "abaixo do mínimo", icon: <AlertTriangle size={10} />, valueColor: redStock, iconColor: redStock },
                { label: "Movimentações", value: "12", sub: "10 mais recentes", icon: <ArrowUpCircle size={10} />, valueColor: T.text },
              ].map(k => (
                <div key={k.label} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 11px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, fontWeight: 500 }}>{k.label}</div>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: ca(0.06),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: k.iconColor || T.muted,
                    }}>{k.icon}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px", color: k.valueColor }}>{k.value}</div>
                  <div style={{ fontSize: 8, color: T.muted, marginTop: 1 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Título da seção */}
            <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginBottom: 8 }}>Produtos e saldo atual</div>

            {/* Grid: Produtos + Última compra */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 10, alignItems: "start", marginBottom: 12 }}>
              {/* Lista de produtos */}
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {products.map((p, i) => {
                    const isLow = p.qty < p.minStock
                    return (
                      <div key={i} style={{
                        borderRadius: 8, border: `1px solid ${ca(0.06)}`,
                        padding: "8px 10px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 9, fontWeight: 500, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                          <div style={{ fontSize: 7, color: T.muted }}>{p.unit} — Mín: {p.minStock}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: isLow ? redStock : T.text }}>{p.qty} {p.unit}</div>
                          <div style={{ fontSize: 7, color: T.muted }}>Custo: {p.cost}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Última compra */}
              <div style={{
                background: T.bg3, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "10px 10px",
              }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginBottom: 8 }}>Última compra</div>
                <div style={{ fontSize: 9, fontWeight: 500, color: T.text, marginBottom: 2 }}>Adubo NPK 10-10-10</div>
                <div style={{ fontSize: 7, color: T.muted, marginBottom: 4 }}>10 kg — Unit: R$ 3,50</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 2 }}>R$ 35,00</div>
                <div style={{ fontSize: 7, color: T.muted, marginBottom: 6 }}>22/03/2026</div>
                <div style={{ fontSize: 7, color: T.muted }}>Reposição mensal de estoque</div>
              </div>
            </div>

            {/* Tabs de movimentações */}
            <div style={{ display: "flex", gap: 0, marginBottom: 10, background: T.bg3, borderRadius: 8, padding: 3 }}>
              {["Recentes", "Saídas", "Entradas"].map((tab, i) => (
                <div key={tab} style={{
                  flex: 1, textAlign: "center", fontSize: 9, padding: "5px 0", borderRadius: 6,
                  ...(i === 0
                    ? { fontWeight: 600, background: T.bg, color: T.text, boxShadow: `0 1px 2px ${ca(0.08)}` }
                    : { fontWeight: 500, color: T.muted }
                  ),
                }}>{tab}</div>
              ))}
            </div>

            {/* Lista de movimentações */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {movements.map((m, i) => (
                <div key={i} style={{
                  borderRadius: 8, border: `1px solid ${ca(0.06)}`,
                  padding: "7px 10px",
                  display: "flex", alignItems: "center", gap: 7,
                }}>
                  {m.type === "in"
                    ? <ArrowUpCircle size={11} style={{ color: mockLightMode ? "#059669" : "#10b981", flexShrink: 0 }} />
                    : <ArrowDownCircle size={11} style={{ color: redStock, flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: T.text }}>{m.product} ({m.qty})</div>
                    <div style={{ fontSize: 7, color: T.muted }}>{m.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 8, color: T.text }}>{m.date}</div>
                    {m.cost && <div style={{ fontSize: 7, color: T.muted }}>Unit: {m.cost}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      }

      case "Manutenções": {
        /* Cores de status */
        const mtStatusStyles: Record<string, { border: string; bg: string; text: string }> = {
          active:    { border: "#10b981", bg: "rgba(16,185,129,0.10)", text: mockLightMode ? "#059669" : "#34d399" },
          paused:    { border: "#f59e0b", bg: "rgba(245,158,11,0.10)", text: mockLightMode ? "#d97706" : "#fbbf24" },
          cancelled: { border: T.border, bg: ca(0.06), text: T.muted },
        }
        const mtStatusLabels: Record<string, string> = { active: "Ativo", paused: "Pausado", cancelled: "Cancelado" }

        const amberMt = mockLightMode ? "#d97706" : "#fbbf24"
        const emeraldMt = mockLightMode ? "#059669" : "#34d399"

        /* Dados mock — planos de manutenção mensal regular */
        const plans = [
          { title: "Manutenção mensal - Jardim frontal", client: "Marco Rodrigues", status: "active", sun: "Sol pleno", water: "3x/sem", lastDate: "15 mar 2026", overdue: false },
          { title: "Manutenção mensal - Área externa", client: "Juliana Santos", status: "active", sun: "Meia sombra", water: "2x/sem", lastDate: "10 mar 2026", overdue: false },
          { title: "Manutenção mensal - Jardim condomínio", client: "Cond. Jardins", status: "active", sun: null, water: "4x/sem", lastDate: null, overdue: true, overdueDays: 32 },
          { title: "Manutenção mensal - Quintal", client: "Pedro Lima", status: "paused", sun: "Sol pleno", water: "2x/sem", lastDate: "28 fev 2026", overdue: false },
          { title: "Manutenção mensal - Varanda e jardineiras", client: "André Costa", status: "active", sun: "Meia sombra", water: "3x/sem", lastDate: "18 mar 2026", overdue: false },
        ]

        return (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>Manutenções</div>
                <div style={{ fontSize: 11, color: T.muted }}>5 planos cadastrados</div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: T.green, color: onGreen,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 600, lineHeight: 1,
              }}>+</div>
            </div>

            {/* KPI Strip — 3 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Total", value: "5", sub: "planos", icon: <Wrench size={10} />, valueColor: T.text },
                { label: "Ativos", value: "4", sub: "em andamento", icon: <CheckCircle2 size={10} />, valueColor: emeraldMt },
                { label: "Atrasados", value: "1", sub: "sem manutenção", icon: <AlertTriangle size={10} />, valueColor: amberMt },
              ].map(k => (
                <div key={k.label} style={{
                  background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 11px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.08em", color: T.subtle, fontWeight: 500 }}>{k.label}</div>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: ca(0.06),
                      display: "flex", alignItems: "center", justifyContent: "center", color: T.muted,
                    }}>{k.icon}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px", color: k.valueColor }}>{k.value}</div>
                  <div style={{ fontSize: 8, color: T.muted, marginTop: 1 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Lista de planos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {plans.map((m, i) => {
                const ss = mtStatusStyles[m.status]
                return (
                  <div key={i} style={{
                    background: T.bg3, border: `1px solid ${T.border}`,
                    borderRadius: 10, borderLeft: `3px solid ${ss.border}`,
                    padding: "10px 12px",
                  }}>
                    {/* Título + badge status */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: T.text, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</span>
                      <span style={{
                        fontSize: 7, fontWeight: 500, padding: "2px 6px", borderRadius: 8,
                        background: ss.bg, color: ss.text, flexShrink: 0,
                      }}>{mtStatusLabels[m.status]}</span>
                    </div>

                    {/* Cliente */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 5 }}>
                      <User size={7} style={{ color: T.muted, flexShrink: 0 }} />
                      <span style={{ fontSize: 8, color: T.muted }}>{m.client}</span>
                    </div>

                    {/* Chips: sol + rega */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 5 }}>
                      {m.sun && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 3,
                          padding: "2px 6px", borderRadius: 8,
                          background: "rgba(245,158,11,0.10)",
                          fontSize: 7, fontWeight: 500, color: amberMt,
                        }}>
                          <Sun size={7} />
                          {m.sun}
                        </div>
                      )}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 3,
                        padding: "2px 6px", borderRadius: 8,
                        background: "rgba(59,130,246,0.10)",
                        fontSize: 7, fontWeight: 500, color: mockLightMode ? "#2563eb" : "#60a5fa",
                      }}>
                        <Droplets size={7} />
                        Rega {m.water}
                      </div>
                    </div>

                    {/* Status info: alerta ou última manutenção */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {m.overdue ? (
                        <>
                          <AlertTriangle size={8} style={{ color: "#f59e0b", flexShrink: 0 }} />
                          <span style={{ fontSize: 7.5, fontWeight: 500, color: amberMt }}>
                            {m.overdueDays ? `Sem manutenção há ${m.overdueDays} dias` : "Nunca executado"}
                          </span>
                        </>
                      ) : m.lastDate ? (
                        <>
                          <Calendar size={8} style={{ color: T.muted, flexShrink: 0 }} />
                          <span style={{ fontSize: 7.5, color: T.muted }}>Última manutenção: {m.lastDate}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      }

      case "Assistente": {
        const primaryBg = mockLightMode ? "#16a34a" : "#22c55e"
        const primaryText = mockLightMode ? "#ffffff" : "#000000"
        const mutedBubble = mockLightMode ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)"
        const emeraldOnline = mockLightMode ? "#059669" : "#10b981"

        return (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 14px", borderBottom: `1px solid ${ca(0.06)}`,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: ga(0.1),
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={12} style={{ color: T.green }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>Íris</div>
                <div style={{ fontSize: 8, color: T.muted }}>Assistente de jardinagem com IA</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: emeraldOnline,
                  boxShadow: `0 0 4px ${emeraldOnline}`,
                }} />
                <span style={{ fontSize: 8, color: T.muted }}>Online</span>
              </div>
            </div>

            {/* Messages area */}
            <div style={{
              flex: 1, padding: "14px 14px", display: "flex", flexDirection: "column", gap: 10,
              overflow: "hidden",
            }}>
              {/* Mensagem assistente 1 */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", maxWidth: "85%" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: ga(0.1),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 1,
                }}>
                  <Sparkles size={8} style={{ color: T.green }} />
                </div>
                <div style={{
                  background: mutedBubble,
                  borderRadius: "2px 12px 12px 12px",
                  padding: "8px 10px",
                  fontSize: 9.5, lineHeight: 1.6, color: T.text,
                }}>
                  Olá! Sou a Íris, sua assistente de jardinagem. Como posso ajudar hoje?
                </div>
              </div>

              {/* Sugestões */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 26 }}>
                {["Agendar serviço", "Criar orçamento", "Novo cliente", "Registrar despesa"].map(s => (
                  <div key={s} style={{
                    fontSize: 8, padding: "4px 8px", borderRadius: 10,
                    border: `1px solid ${ca(0.08)}`, color: T.muted,
                  }}>{s}</div>
                ))}
              </div>

              {/* Mensagem usuário 1 */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", alignSelf: "flex-end", maxWidth: "78%" }}>
                <div style={{
                  background: primaryBg, color: primaryText,
                  borderRadius: "12px 12px 2px 12px",
                  padding: "8px 10px",
                  fontSize: 9.5, lineHeight: 1.6,
                }}>
                  Agendar poda para o Marco amanhã às 9h
                </div>
              </div>

              {/* Mensagem assistente 2 */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", maxWidth: "85%" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: ga(0.1),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 1,
                }}>
                  <Sparkles size={8} style={{ color: T.green }} />
                </div>
                <div style={{
                  background: mutedBubble,
                  borderRadius: "2px 12px 12px 12px",
                  padding: "8px 10px",
                  fontSize: 9.5, lineHeight: 1.6, color: T.text,
                }}>
                  Poda agendada para Marco Rodrigues amanhã (23/03) às 09:00. Deseja adicionar alguma observação?
                </div>
              </div>

              {/* Mensagem usuário 2 */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", alignSelf: "flex-end", maxWidth: "78%" }}>
                <div style={{
                  background: primaryBg, color: primaryText,
                  borderRadius: "12px 12px 2px 12px",
                  padding: "8px 10px",
                  fontSize: 9.5, lineHeight: 1.6,
                }}>
                  Não, está ótimo. Obrigado!
                </div>
              </div>

              {/* Mensagem assistente 3 */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", maxWidth: "85%" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: ga(0.1),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 1,
                }}>
                  <Sparkles size={8} style={{ color: T.green }} />
                </div>
                <div style={{
                  background: mutedBubble,
                  borderRadius: "2px 12px 12px 12px",
                  padding: "8px 10px",
                  fontSize: 9.5, lineHeight: 1.6, color: T.text,
                }}>
                  Perfeito! Agendamento confirmado. Precisa de mais alguma coisa?
                </div>
              </div>
            </div>

            {/* Input area */}
            <div style={{
              padding: "8px 14px 12px",
              borderTop: `1px solid ${ca(0.06)}`,
              display: "flex", gap: 5, alignItems: "center",
            }}>
              <div style={{
                flex: 1, background: mutedBubble,
                border: `1px solid ${ca(0.08)}`, borderRadius: 8,
                padding: "7px 10px", fontSize: 9.5, color: T.subtle,
              }}>
                Peça algo à Íris...
              </div>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                border: `1px solid ${ca(0.08)}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.muted,
              }}>
                <Mic size={11} />
              </div>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: primaryBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Send size={10} style={{ color: primaryText }} />
              </div>
            </div>
          </div>
        )
      }

      case "Perfil": {
        return (
          <>
            {/* Header */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2, color: T.text }}>Perfil</div>
              <div style={{ fontSize: 11, color: T.muted }}>Gerencie suas informações e preferências</div>
            </div>

            {/* Hero card — preview do perfil */}
            <div style={{
              background: T.bg3, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "14px 14px",
              display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
            }}>
              {/* Avatar grande */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: ga(0.15), color: T.green,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700,
                border: `2px solid ${T.border}`,
              }}>PL</div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Pedro Luiz</div>
                <div style={{ fontSize: 8, color: T.muted, marginBottom: 3 }}>Membro desde janeiro de 2026</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Mail size={7} style={{ color: T.muted, flexShrink: 0 }} />
                    <span style={{ fontSize: 8, color: T.muted }}>pedro@email.com</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Phone size={7} style={{ color: T.muted, flexShrink: 0 }} />
                    <span style={{ fontSize: 8, color: T.muted }}>(11) 99876-5432</span>
                  </div>
                </div>
              </div>
              {/* Botão sair */}
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 8, fontWeight: 500, padding: "5px 9px", borderRadius: 7,
                border: `1px solid ${mockLightMode ? "rgba(220,38,38,0.3)" : "rgba(248,113,113,0.3)"}`,
                color: mockLightMode ? "#dc2626" : "#f87171",
                flexShrink: 0,
              }}>
                <LogOut size={9} />
                Sair
              </div>
            </div>

            {/* Grid 2 colunas — seções do perfil */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {/* Foto de perfil */}
              <div style={{
                background: T.bg3, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "12px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: ca(0.06),
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <UserCircle size={8} style={{ color: T.muted }} />
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: T.text }}>Foto de perfil</span>
                </div>
                <div style={{
                  borderRadius: 8, border: `1px dashed ${ca(0.12)}`,
                  padding: "16px 0", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: ga(0.15), color: T.green,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                    border: `2px solid ${ga(0.2)}`,
                  }}>PL</div>
                  <span style={{ fontSize: 7.5, color: T.muted }}>Clique para trocar</span>
                </div>
              </div>

              {/* Empresa e marca d'água */}
              <div style={{
                background: T.bg3, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "12px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: ca(0.06),
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={8} style={{ color: T.muted }} />
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: T.text }}>Empresa e marca d&apos;água</span>
                </div>
                {/* Campos */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div>
                    <div style={{ fontSize: 7.5, fontWeight: 500, color: T.muted, marginBottom: 3 }}>Nome da empresa</div>
                    <div style={{
                      background: ca(0.03), border: `1px solid ${ca(0.08)}`,
                      borderRadius: 6, padding: "6px 8px", fontSize: 9, color: T.text,
                    }}>Verde Vivo</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 7.5, fontWeight: 500, color: T.muted, marginBottom: 3 }}>Subtítulo <span style={{ color: ca(0.3) }}>(opcional)</span></div>
                    <div style={{
                      background: ca(0.03), border: `1px solid ${ca(0.08)}`,
                      borderRadius: 6, padding: "6px 8px", fontSize: 9, color: T.text,
                    }}>Jardinagem & Paisagismo</div>
                  </div>
                </div>
              </div>

              {/* Preferências */}
              <div style={{
                background: T.bg3, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "12px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: ca(0.06),
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Settings size={8} style={{ color: T.muted }} />
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: T.text }}>Preferências</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div>
                    <div style={{ fontSize: 7.5, fontWeight: 500, color: T.muted, marginBottom: 3 }}>Vencimento do cartão</div>
                    <div style={{
                      background: ca(0.03), border: `1px solid ${ca(0.08)}`,
                      borderRadius: 6, padding: "6px 8px", fontSize: 9, color: T.text,
                    }}>10</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 7.5, fontWeight: 500, color: T.muted, marginBottom: 3 }}>Margem de lucro padrão (%)</div>
                    <div style={{
                      background: ca(0.03), border: `1px solid ${ca(0.08)}`,
                      borderRadius: 6, padding: "6px 8px", fontSize: 9, color: T.text,
                    }}>20</div>
                  </div>
                </div>
              </div>

              {/* Assinatura */}
              <div style={{
                background: T.bg3, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "12px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: ga(0.08),
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={8} style={{ color: T.green }} />
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: T.text }}>Assinatura</span>
                </div>
                <div style={{
                  borderRadius: 8, background: ca(0.04), border: `1px solid ${ca(0.06)}`,
                  padding: "14px 10px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: T.text, marginBottom: 3 }}>Plano Plus</div>
                  <div style={{ fontSize: 8, color: T.muted, marginBottom: 6 }}>R$ 77,90/mês · Ativo</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontSize: 7.5, fontWeight: 500, padding: "3px 8px", borderRadius: 8,
                    background: ga(0.1), color: T.green,
                  }}>
                    <CheckCircle2 size={7} />
                    Assinatura ativa
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

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
      boxShadow: `0 0 0 1px ${T.border}, 0 0 0 8px ${ca(0.03)}, 0 48px 100px rgba(0,0,0,0.64), 0 0 80px ${ga(0.06)}`,
      transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
      position: "relative", zIndex: 1,
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
              textAlign: "left",
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
    <section style={{ padding: "140px 0 0", minHeight: "120vh", textAlign: "center", position: "relative" }}>
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
            textDecoration: "none", marginBottom: 10,
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
            fontSize: "clamp(38px, 4.5vw, 64px)",
            fontWeight: 500, lineHeight: "1em",
            letterSpacing: "-0.04em",
            marginBottom: 10,
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
            fontSize: "clamp(15px, 1.6vw, 17px)",
            color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 36px",
            fontWeight: 400, lineHeight: 1.65,
          }}>
            Organize clientes, agenda, finanças e ordens de serviço em um único lugar.
            Economize horas todo dia e foque no que realmente importa.
          </p>
        </div>

        {/* CTAs */}
        <div style={{
          animation: "fadeUp 0.6s 0.24s cubic-bezier(0.16,1,0.3,1) both",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, flexWrap: "wrap", marginBottom: 12,
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
          fontSize: 13, color: T.subtle, marginBottom: 40,
        }}>
          Sem cartão de crédito. Cancele quando quiser.
        </div>

        {/* Dashboard */}
        <DashboardRiseWrapper />
      </div>
    </section>
  )
}

function DashboardRiseWrapper() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fadeRef = useReveal("0px 0px -40px 0px")

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // progress: 0 = element top at viewport bottom, 1 = fully scrolled into view
      const raw = 1 - (rect.top / vh)
      const progress = Math.max(0, Math.min(1, raw))

      const rotateX = 28 * (1 - progress)       // 28deg → 0deg (inclinação dramática estilo Clario)
      const translateY = 280 * (1 - progress)   // 280px → 0px
      const scale = 1.18 - 0.18 * progress      // 1.18 → 1 (começa bem maior)

      el.style.transform = `perspective(1200px) rotateX(${rotateX}deg) translateY(${translateY}px) scale(${scale})`
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update, { passive: true })
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div
      ref={(node) => {
        (wrapRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (fadeRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }}
      className="dashboard-rise"
      style={{ position: "relative" }}
    >
      {/* Green glow behind dashboard (Clario style) */}
      <div style={{
        position: "absolute", top: -40, left: "50%",
        transform: "translateX(-50%)",
        width: 320, height: 60,
        background: "rgba(26,255,94,0.35)",
        filter: "blur(50px)",
        borderRadius: "50%",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Green line accent at top */}
      <div style={{
        position: "absolute", top: -2, left: "50%",
        transform: "translateX(-50%)",
        width: 120, height: 3,
        background: `linear-gradient(90deg, transparent, ${T.green}, transparent)`,
        borderRadius: 2,
        pointerEvents: "none", zIndex: 3,
      }} />

      {/* Bottom fade mask */}
      <div style={{
        position: "absolute", bottom: -1, left: 0, right: 0,
        height: 260,
        background: `linear-gradient(to top, ${T.bg}, ${T.bg}44, transparent)`,
        zIndex: 2, pointerEvents: "none",
      }} />
      <DashboardMockup />
    </div>
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
