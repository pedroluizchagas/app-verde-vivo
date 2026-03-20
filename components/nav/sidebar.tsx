'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Package,
  Bot,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  ListTodo,
  CalendarCheck,
  ClipboardList,
  Search,
  X,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const sections: Array<{
  title: string
  items: { href: string; icon: any; label: string }[]
}> = [
  {
    title: 'Menu Principal',
    items: [
      { href: '/dashboard', icon: Home, label: 'Visão Geral' },
      { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
      { href: '/dashboard/schedule', icon: Calendar, label: 'Agenda' },
      {
        href: '/dashboard/work-orders',
        icon: ClipboardList,
        label: 'Ordens de Serviço',
      },
      { href: '/dashboard/budgets', icon: FileText, label: 'Orçamentos' },
      { href: '/dashboard/notes', icon: StickyNote, label: 'Notas' },
      { href: '/dashboard/tasks', icon: ListTodo, label: 'Tarefas' },
    ],
  },
  {
    title: 'Negócios',
    items: [
      { href: '/dashboard/finance', icon: BarChart3, label: 'Financeiro' },
      { href: '/dashboard/stock', icon: Package, label: 'Estoque' },
      {
        href: '/dashboard/maintenance',
        icon: CalendarCheck,
        label: 'Manutenções',
      },
      { href: '/dashboard/assistant', icon: Bot, label: 'Assistente' },
    ],
  },
]

const typeLabels: Record<string, string> = {
  service: 'Serviço',
  technical_visit: 'Visita técnica',
  training: 'Treinamento',
  meeting: 'Reunião',
  other: 'Outro',
}

type NextAppointment = {
  id: string
  title: string | null
  type: string
  scheduled_date: string
  all_day: boolean
  clientName: string | null
}

export function Sidebar({
  profile,
  nextAppointment,
}: {
  profile?: {
    full_name: string | null
    avatar_url: string | null
    company_name: string | null
    company_subtitle: string | null
    watermark_base64: string | null
    watermark_fit: string | null
  }
  nextAppointment?: NextAppointment | null
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const allItems = sections.flatMap((s) => s.items)
  const filteredItems = searchQuery.trim()
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : null

  useEffect(() => {
    try {
      if (localStorage.getItem('sidebar.collapsed') === 'true') {
        setCollapsed(true)
      }
    } catch {}
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('sidebar.collapsed', String(next))
    } catch {}
  }

  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const MONTH_NAMES = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]

  let nextApptTitle = ''
  let nextApptDateStr = ''
  let nextApptTimeStr = ''
  if (nextAppointment) {
    const date = new Date(nextAppointment.scheduled_date)
    nextApptTitle =
      nextAppointment.title || typeLabels[nextAppointment.type] || 'Serviço'
    nextApptDateStr = `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
    nextApptTimeStr = nextAppointment.all_day
      ? 'Dia inteiro'
      : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'hidden md:flex md:flex-col bg-sidebar text-sidebar-foreground transition-all md:sticky md:top-0 md:h-svh',
        collapsed ? 'md:w-16' : 'md:w-64',
      )}
    >
      {/* Header com logo */}
      <div
        className={cn(
          'flex items-center border-b border-sidebar-border px-3 py-4',
          collapsed ? 'justify-center' : 'gap-3',
        )}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                {profile?.watermark_base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.watermark_base64}
                    alt="Logo"
                    className={cn(
                      "h-full w-full",
                      profile.watermark_fit === "cover"
                        ? "object-cover"
                        : "object-contain p-0.5"
                    )}
                  />
                ) : (
                  <span className="text-primary font-bold text-sm">
                    {profile?.company_name?.charAt(0)?.toUpperCase() || 'V'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {profile?.company_name || 'Verde Vivo'}
                </p>
                {(profile?.company_subtitle) && (
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">
                    {profile.company_subtitle}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Minimizar sidebar"
              className="text-sidebar-foreground/50 h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Expandir sidebar"
            className="text-sidebar-foreground/50 h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Campo de busca */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent px-3 py-2.5">
            <Search className="h-4 w-4 text-sidebar-foreground/30 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquise aqui..."
              className="flex-1 bg-transparent text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/30 outline-none min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors shrink-0"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navegação */}
      <nav
        className={cn(
          'flex-1 min-h-0 overflow-y-auto',
          collapsed ? 'px-1 py-2' : 'px-2 py-1',
        )}
      >
        {filteredItems ? (
          <div className="px-1">
            {filteredItems.length > 0 ? (
              <div className="space-y-0.5">
                {filteredItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      onClick={() => setSearchQuery('')}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl py-2.5 px-3 text-sm transition-colors',
                        isActive
                          ? 'text-primary font-medium'
                          : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="sidebar-active-indicator absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary"
                        />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="text-[11px] text-sidebar-foreground/35 text-center py-6 px-3">
                Nenhum resultado para &ldquo;{searchQuery}&rdquo;.
              </p>
            )}
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.title} className="mb-2">
              {!collapsed && (
                <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/35 font-medium">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={cn(
                        'relative flex items-center rounded-xl py-2.5 text-sm transition-colors',
                        collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                        isActive
                          ? 'text-primary font-medium'
                          : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="sidebar-active-indicator absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary"
                        />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Card Próximo Serviço */}
      {!collapsed && (
        <div className="mt-auto border-t border-sidebar-border px-3 pt-3 pb-4">
          {nextAppointment ? (
            <div className="rounded-xl bg-sidebar-accent px-3 py-3">
              {/* Label dentro da caixa */}
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/30 mb-1.5">
                Próximo Serviço
              </p>
              {/* Título do serviço */}
              <p className="text-[12px] font-semibold text-sidebar-foreground leading-snug truncate mb-0.5">
                {nextApptTitle}
              </p>
              {/* Data e horário */}
              <p className="text-[10px] text-sidebar-foreground/40 mb-3">
                {nextApptDateStr} &middot; {nextApptTimeStr}
              </p>
              {/* Rodapé: badges + botão circular */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                    {typeLabels[nextAppointment.type] || 'Serviço'}
                  </span>
                  {nextAppointment.clientName && (
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-sidebar-foreground/[0.07] text-sidebar-foreground/45 truncate">
                      {nextAppointment.clientName}
                    </span>
                  )}
                </div>
                <Link
                  href={`/dashboard/schedule/${nextAppointment.id}`}
                  className="h-[22px] w-[22px] rounded-full bg-primary flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                  aria-label="Ver agendamento"
                >
                  <ArrowRight className="h-2.5 w-2.5 text-primary-foreground" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-sidebar-accent px-3 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/30 mb-2">
                Próximo Serviço
              </p>
              <p className="text-[11px] text-sidebar-foreground/30">
                Nenhum serviço agendado.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
