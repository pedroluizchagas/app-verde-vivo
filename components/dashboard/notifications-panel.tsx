"use client"

import { Bell, X } from "lucide-react"
import { useNotifications } from "./notifications-context"

export function NotificationsPanel() {
  const { isOpen, toggle, close } = useNotifications()

  return (
    /*
      O container externo controla a largura animada (0 → 332px).
      Os 332px = 12px de margem esquerda (gap visual) + 320px do painel.
      overflow-hidden garante que o conteudo fica oculto enquanto a largura e zero.
    */
    <div
      className="shrink-0 overflow-hidden transition-[width] duration-500 ease-in-out hidden md:block"
      style={{ width: isOpen ? "332px" : "0px" }}
    >
      {/*
        Container interno: margem esquerda cria o gap entre main e o painel,
        dando o efeito de dois blocos flutuantes separados.
        A opacidade anima com delay para o conteudo "aparecer" apos o painel abrir.
      */}
      <div
        className={`ml-3 w-80 h-full rounded-3xl bg-background flex flex-col overflow-hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 delay-200" : "opacity-0 delay-0"
        }`}
      >
        {/* Header do painel - o sino aparece aqui quando o painel abre */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground">
              <Bell className="h-4 w-4" />
            </div>
            <h2 className="text-[14px] font-semibold">Notificações</h2>
          </div>
          <button
            onClick={close}
            aria-label="Fechar notificações"
            className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Conteudo do painel */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 min-h-[200px]">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-[13px] font-medium">Tudo em dia</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Nenhuma notificação por enquanto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
