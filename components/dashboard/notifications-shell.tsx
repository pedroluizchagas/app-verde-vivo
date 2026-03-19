"use client"

import { MobileNav } from "@/components/nav/mobile-nav"
import { PageTransition } from "@/components/ui/page-transition"
import { NotificationsPanel } from "./notifications-panel"

/*
  Substitui o wrapper interno do layout.tsx.
  Gerencia a disposicao horizontal: [main] [painel de notificacoes].
  O painel anima sua propria largura, empurrando o main para a esquerda.
*/
export function NotificationsShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden md:py-3 md:pr-3">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 md:rounded-3xl bg-background overflow-hidden pb-20 md:pb-0">
          <div className="h-full overflow-y-auto">
            <PageTransition>
              <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
                {children}
              </div>
            </PageTransition>
          </div>
        </main>

        {/* Painel de notificacoes anima para a direita do main */}
        <NotificationsPanel />
      </div>

      {/* Navegacao mobile — fica abaixo do conteudo em telas pequenas */}
      <div className="md:hidden shrink-0">
        <MobileNav />
      </div>
    </div>
  )
}
