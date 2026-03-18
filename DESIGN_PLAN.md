# Plano de Melhoria de Design e Experiência — App Verde Vivo (Iris)

> Análise realizada sobre o estado atual da interface web (Next.js + Shadcn UI + Tailwind CSS).
> Referência de tela principal: Dashboard — Visão Geral (`/app/dashboard/page.tsx`)

---

## 1. Análise do Estado Atual

### 1.1 Pontos Fortes Identificados

- **Hierarquia de camadas visuais** bem definida: sidebar escura → painel de conteúdo cinza escuro → cards ligeiramente mais claros (3 layers de profundidade no dark mode)
- **Tipografia consistente** com Poppins em todo o app
- **Paleta verde coerente** com identidade do produto (jardinagem)
- **Layout responsivo** com grid fluido e sidebar colapsável
- **Transição de página** suave com `fadeSlideIn`
- **KPI cards** com indicadores de variação percentual (positivo/negativo) funcionando corretamente
- **Gráfico de barras** mensal com receita × despesa bem posicionado

---

### 1.2 Problemas Identificados

#### 🔴 Críticos (impactam diretamente a experiência)

| # | Local | Problema | Impacto |
|---|-------|----------|---------|
| 1 | `monthly-chart.tsx` | Tooltip e cores de barras com valores hardcoded para dark (`#1a1a1a`, `rgba(255,255,255,0.08)`) — no light mode quebra visualmente | Alto |
| 2 | `productivity-chart.tsx` | Tanto "Serviços Concluídos" quanto "Serviços Pendentes" usam a mesma cor `bg-primary` nas barras — impossível diferenciar visualmente | Alto |
| 3 | Sidebar | Busca (`Pesquise aqui...`) é puramente decorativa — sem funcionalidade. Gera expectativa falsa no usuário | Alto |
| 4 | `dashboard/page.tsx` | KPI "Total de Clientes" mostra o `activeClientsChange` como indicador de variação, mas o label é "Total de Clientes" — dado incorreto | Médio-Alto |

#### 🟡 Moderados (prejudicam polimento e consistência)

| # | Local | Problema |
|---|-------|----------|
| 5 | Todo o app | Falta de acentuação: "Ola" → "Olá", "Visao" → "Visão", "Proxima" → "Próxima", "Orcamento" → "Orçamento", "Negocios" → "Negócios", "Manutencoes" → "Manutenções", etc. |
| 6 | Sidebar | Logo usa apenas a letra "I" em um quadrado — arquivo `/public/img/iris.png` existe mas não é utilizado |
| 7 | KPI Cards | Todos os 4 cards têm ícones com fundo `bg-muted` idêntico — sem diferenciação de cor por tipo de métrica |
| 8 | `client-card.tsx` | Cards de clientes sem avatar/iniciais visuais — lista longa fica monótona e difícil de escanear |
| 9 | `monthly-chart.tsx` | Barra de despesa (`rgba(255,255,255,0.08)`) quase invisível — despesas mal representadas no gráfico |
| 10 | Mini-calendar | Não exibe pontos/indicadores nos dias com agendamentos — perdendo oportunidade de visualização rápida |
| 11 | Agenda (dashboard) | Texto de data/hora muito pequeno (`text-[9px]`) — ilegível, principalmente em telas menores |
| 12 | Sidebar colapsada | `title` HTML puro como tooltip — sem estilo visual (tooltip customizado ausente) |
| 13 | Sidebar colapsada | `ThemeToggle` desaparece quando sidebar está colapsada — usuário perde acesso ao toggle |

#### 🟢 Melhorias de UX (oportunidades de polimento)

| # | Local | Oportunidade |
|---|-------|-------------|
| 14 | Dashboard | Ausência de KPI de lucro/saldo líquido do mês (receita - despesa) |
| 15 | Clientes | Busca estática (sem filtro em tempo real) |
| 16 | Agenda | Nenhuma separação temporal dos agendamentos (ex: "Hoje", "Esta semana", "Mais tarde") |
| 17 | Empty states | Padrão genérico com ícone `Plus` em todos os vazios — sem personalidade ou contexto por módulo |
| 18 | Finance | Card "Créditos Parceiros" tem layout interno diferente dos outros 3 KPI cards — inconsistência |
| 19 | Dashboard | Header com bell button sem badge de notificações nem funcionalidade |
| 20 | Dashboard | Filtro de mês (`DashboardFilters`) afeta apenas o gráfico de barras mas não fica claro para o usuário |

---

## 2. Plano de Implementação

### Fase 1 — Correções Críticas e de Acessibilidade
*Objetivo: eliminar bugs visuais e dados incorretos*

---

#### 1.1 Corrigir KPI "Total de Clientes" — indicador de variação incorreto

**Arquivo:** `app/dashboard/page.tsx`

- Criar variável `clientsChange` comparando total de clientes agora vs 30 dias atrás (usar `created_at < since30` para contar clientes antigos)
- Substituir `activeClientsChange` pelo novo `clientsChange` no primeiro card
- Manter `activeClientsChange` apenas no card "Clientes Ativos"

---

#### 1.2 Corrigir cores do `MonthlyChart` — modo claro quebrado

**Arquivo:** `components/dashboard/monthly-chart.tsx`

- Substituir cor hardcoded da barra de despesa `rgba(255,255,255,0.08)` por `var(--color-muted)` via CSS variable ou `hsl(var(--muted))`
- Substituir `backgroundColor: "#1a1a1a"` do tooltip por `var(--color-popover)` e `color: "#fff"` por `var(--color-popover-foreground)`
- Tornar tick colors (`fill: "#666"`) responsivos ao tema usando CSS variables

**Solução técnica:** Usar `useTheme()` do `next-themes` para detectar tema e aplicar cores condicionalmente no componente cliente.

---

#### 1.3 Diferenciar barras do `ProductivityChart`

**Arquivo:** `components/dashboard/productivity-chart.tsx`

- Barra de "Serviços Concluídos": manter `bg-primary` (verde)
- Barra de "Serviços Pendentes": trocar para `bg-muted-foreground/30` (cinza neutro)
- Considerar adicionar contagem absoluta abaixo do percentual: ex: `"8 de 12 serviços"`

---

#### 1.4 Converter busca da sidebar em funcional (ou remover)

**Arquivo:** `components/nav/sidebar.tsx`

**Opção A (recomendada):** Transformar em Command Palette que abre com `Cmd+K` — redireciona para as seções principais
**Opção B (simples):** Remover o campo de busca da sidebar e liberar o espaço vertical para os itens de menu

---

### Fase 2 — Correções de Texto e Localização
*Objetivo: corrigir acentuação e gramática em todo o app*

#### 2.1 Mapeamento completo de strings sem acentuação

**Arquivos afetados:** `sidebar.tsx`, `dashboard/page.tsx`, `finance/page.tsx`, `schedule/page.tsx`, `clients/page.tsx`, e componentes de cards

| Errado | Correto |
|--------|---------|
| `Visao Geral` | `Visão Geral` |
| `Orcamentos` | `Orçamentos` |
| `Ordens de servico` | `Ordens de Serviço` |
| `Manutencoes` | `Manutenções` |
| `Configuracoes` | `Configurações` |
| `Negocios` | `Negócios` |
| `Ola,` | `Olá,` |
| `Aqui esta a visao geral` | `Aqui está a visão geral` |
| `Proxima Agenda` | `Próxima Agenda` |
| `do mes passado` | `do mês passado` |
| `do mes atual` | `do mês atual` |
| `Servicos Concluidos` | `Serviços Concluídos` |
| `Servicos Pendentes` | `Serviços Pendentes` |
| `Visao Geral das Vendas` | `Visão Geral das Vendas` |
| `Previsao de fluxo` | `Previsão de fluxo` |
| `Lancamentos do mes` | `Lançamentos do mês` |
| `Saldo Atual` | correto |
| `Creditos Parceiros` | `Créditos de Parceiros` |
| `Pesquise aqui...` | `Pesquisar...` |

---

### Fase 3 — Melhorias Visuais de Alto Impacto
*Objetivo: elevar o nível estético e de scannability*

---

#### 3.1 Logo real na Sidebar

**Arquivo:** `components/nav/sidebar.tsx`

- Substituir o `<div>` com letra "I" por `<img src="/img/iris.png" />` com `h-8 w-8 object-contain`
- Quando colapsada: mostrar apenas o logo sem o nome
- Quando expandida: logo + "Iris" + "Jardinagem" (estado atual, apenas com o logo correto)

---

#### 3.2 KPI Cards com ícones coloridos

**Arquivo:** `app/dashboard/page.tsx` e `app/dashboard/finance/page.tsx`

Substituir o padrão `bg-muted` genérico por cores semânticas:

| Card | Ícone | Cor do fundo | Cor do ícone |
|------|-------|-------------|-------------|
| Total de Clientes | `Users` | `bg-blue-500/10` | `text-blue-500` |
| Clientes Ativos | `UserCheck` | `bg-emerald-500/10` | `text-emerald-500` |
| Receita Total/Mês | `DollarSign` ou `TrendingUp` | `bg-emerald-500/10` | `text-emerald-500` |
| Despesa Total/Mês | `CreditCard` ou `TrendingDown` | `bg-red-500/10` | `text-red-400` |
| Saldo Atual (Finance) | `DollarSign` | Condicional: verde se positivo, vermelho se negativo | idem |

---

#### 3.3 ClientCard com Avatar de Iniciais

**Arquivo:** `components/clients/client-card.tsx`

Adicionar um círculo com as iniciais do nome do cliente no lado esquerdo do card:

```
[ AB ]  Ana Beatriz Santos
        📞 (11) 99999-9999
        📍 Rua das Flores, 123
```

- Gerar cor de fundo determinística baseada no nome (hash simples) para dar personalidade
- Tamanho: `h-10 w-10 rounded-full`
- Texto: `text-sm font-bold` com as 2 primeiras letras do nome (ou `Nome.split(' ').map(n => n[0]).join('').slice(0,2)`)

---

#### 3.4 Mini-Calendar com indicadores de eventos

**Arquivo:** `components/dashboard/mini-calendar.tsx`

- Receber prop `eventDates: string[]` (array de datas ISO com agendamentos)
- Renderizar um ponto verde `•` abaixo do número do dia quando há evento
- No `dashboard/page.tsx`: passar as datas dos `upcomingAppointments` para o componente

---

#### 3.5 Agenda com tamanho de fonte legível

**Arquivo:** `app/dashboard/page.tsx` (seção "Próxima Agenda")

- Aumentar data/hora de `text-[9px]` para `text-[11px]`
- Aumentar largura do bloco de data de `w-[48px]` para `w-[56px]`
- Usar `text-xs` para título e `text-[11px]` para nome do cliente

---

#### 3.6 Barra de despesa mais visível no gráfico

**Arquivo:** `components/dashboard/monthly-chart.tsx`

- Trocar `fill="rgba(255,255,255,0.08)"` por uma cor semântica de despesa
- Dark mode: `hsl(0 60% 35%)` (vermelho escuro) ou `hsl(0 0% 30%)` (cinza escuro)
- Light mode: `hsl(0 84% 80%)` (vermelho claro) ou `hsl(240 10% 75%)` (cinza claro)
- Usar `useTheme()` para alternar

---

### Fase 4 — Melhorias de UX e Funcionalidade
*Objetivo: features pequenas com alto retorno de usabilidade*

---

#### 4.1 KPI de Saldo do Mês no Dashboard

**Arquivo:** `app/dashboard/page.tsx`

- Adicionar um 5º KPI (ou substituir um dos menos relevantes) com `monthIncome - monthExpense`
- Label: `Resultado do Mês`
- Valor em verde se positivo, vermelho se negativo
- Ícone: `TrendingUp` ou `TrendingDown` condicional

---

#### 4.2 Agrupamento temporal na Agenda

**Arquivo:** `app/dashboard/schedule/page.tsx`

Agrupar os agendamentos por contexto temporal:
- **Hoje** — agendamentos com `scheduled_date` = hoje
- **Esta semana** — agendamentos nos próximos 7 dias
- **Mais tarde** — demais

Exibir cabeçalho de seção antes de cada grupo com texto pequeno e linha separadora.

---

#### 4.3 Busca funcional em Clientes

**Arquivo:** `app/dashboard/clients/page.tsx`

- Converter página para Client Component (`"use client"`)
- Ou implementar busca via URL search params (`?q=`)
- Filtrar `clients` por `name`, `phone`, `email` e `address`
- Mantendo o resultado instantâneo com debounce de 300ms

---

#### 4.4 ThemeToggle acessível na sidebar colapsada

**Arquivo:** `components/nav/sidebar.tsx`

- Mover `ThemeToggle` para fora do bloco `{!collapsed && (...)}`
- Quando colapsada: exibir o toggle abaixo do avatar, centralizado
- Quando expandida: manter posição atual à direita do nome

---

#### 4.5 Tooltips na Sidebar Colapsada

**Arquivo:** `components/nav/sidebar.tsx`

- Substituir `title` HTML nativo por `TooltipProvider` + `Tooltip` do Radix UI (já disponível via Shadcn)
- Exibir o `item.label` no tooltip ao hover quando `collapsed === true`
- Posição: `side="right"` com pequeno offset

---

#### 4.6 Empty States contextuais por módulo

Substituir o padrão genérico (ícone Plus + texto) por estados vazios com ícone temático:

| Página | Ícone Sugerido | Mensagem |
|--------|---------------|----------|
| Clientes | `Users` | "Nenhum cliente ainda — adicione o primeiro para começar a organizar seu trabalho" |
| Agenda | `CalendarX` | "Sua agenda está livre — que tal criar um agendamento?" |
| Financeiro | `Receipt` | "Sem lançamentos neste mês" |
| Tarefas | `CheckSquare` | "Nenhuma tarefa pendente — tudo em dia!" |
| Notas | `StickyNote` | "Suas anotações vão aparecer aqui" |
| Estoque | `PackageOpen` | "Estoque vazio — registre os seus produtos" |

---

### Fase 5 — Refinamentos Finais e Consistência
*Objetivo: uniformizar padrões visuais em todos os módulos*

---

#### 5.1 Padronizar tamanhos mínimos de fonte

Criar uma convenção interna:

| Uso | Classe Tailwind |
|-----|----------------|
| Rótulos de métricas (KPI label) | `text-xs` (12px) |
| Valores principais de KPI | `text-2xl font-bold` |
| Indicadores de variação | `text-xs` |
| Títulos de seção em cards | `text-sm font-semibold` |
| Texto de suporte / meta-info | `text-xs text-muted-foreground` |
| **Mínimo absoluto** | `text-[10px]` — usar apenas em contextos extremamente compactos |

---

#### 5.2 Consistência dos cards KPI em Finance

**Arquivo:** `app/dashboard/finance/page.tsx`

- Card "Créditos de Parceiros": mover a lista de parceiros para fora do card ou para um card separado de altura maior
- Manter os 4 cards com estrutura idêntica: `label | icon | value | sub-info`

---

#### 5.3 Indicador de notificações no Bell Button

**Arquivo:** `app/dashboard/page.tsx`

- Adicionar badge vermelho `absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500` quando houver alertas financeiros pendentes
- Passar `alerts.length > 0` como prop para mostrar/ocultar badge

---

#### 5.4 Hover states e micro-interações nos KPI Cards

**Arquivo:** `app/dashboard/page.tsx`

- Adicionar `hover:shadow-md transition-shadow` ou `iris-hover-lift` (já definido no CSS) nos cards de KPI
- Tornar os cards clicáveis com `Link` para os módulos correspondentes:
  - Total de Clientes → `/dashboard/clients`
  - Clientes Ativos → `/dashboard/clients`
  - Receita Total → `/dashboard/finance`
  - Despesa Total → `/dashboard/finance`

---

## 3. Resumo de Prioridades

| Prioridade | Fase | Esforço Estimado | Impacto Visual |
|-----------|------|-----------------|----------------|
| 🔴 P1 | Fase 1 — Correções críticas | Baixo | Alto |
| 🔴 P1 | Fase 2 — Acentuação/texto | Baixo | Médio |
| 🟡 P2 | Fase 3.1 — Logo na sidebar | Baixo | Alto |
| 🟡 P2 | Fase 3.2 — KPI icons coloridos | Baixo | Alto |
| 🟡 P2 | Fase 3.3 — ClientCard com avatar | Médio | Alto |
| 🟡 P2 | Fase 3.5 — Agenda legível | Baixo | Médio |
| 🟡 P2 | Fase 4.4 — ThemeToggle colapsado | Baixo | Médio |
| 🟡 P2 | Fase 4.5 — Tooltips sidebar | Médio | Médio |
| 🟢 P3 | Fase 3.4 — Mini-calendar eventos | Médio | Médio |
| 🟢 P3 | Fase 4.1 — KPI Resultado do Mês | Médio | Alto |
| 🟢 P3 | Fase 4.2 — Agrupamento na Agenda | Médio | Alto |
| 🟢 P3 | Fase 4.3 — Busca funcional | Alto | Alto |
| 🟢 P3 | Fase 4.6 — Empty states contextuais | Médio | Médio |
| 🔵 P4 | Fase 5 — Refinamentos finais | Médio | Baixo-Médio |

---

## 4. Arquivos Envolvidos

```
app/
  dashboard/
    page.tsx                          ← Fases 1.1, 3.2, 3.5, 4.1, 5.3, 5.4
    finance/page.tsx                  ← Fases 3.2, 5.2
    schedule/page.tsx                 ← Fases 4.2, 4.6
    clients/page.tsx                  ← Fases 4.3, 4.6
    work-orders/page.tsx              ← Fase 4.6
    tasks/page.tsx                    ← Fase 4.6
    notes/page.tsx                    ← Fase 4.6
    stock/page.tsx                    ← Fase 4.6

components/
  nav/
    sidebar.tsx                       ← Fases 1.4, 2.1, 3.1, 4.4, 4.5
  dashboard/
    monthly-chart.tsx                 ← Fases 1.2, 3.6
    productivity-chart.tsx            ← Fase 1.3
    mini-calendar.tsx                 ← Fase 3.4
  clients/
    client-card.tsx                   ← Fase 3.3
```

---

*Plano criado em: 2026-03-18*
