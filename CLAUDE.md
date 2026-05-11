# Gestão Garden — Instruções do Projeto

## Visão Geral

**Gestão Garden** é um SaaS de gestão para profissionais de jardinagem. Web (Next.js/Vercel) + Mobile (Expo/React Native), com assistente de IA chamado **Íris** (Groq/LLaMA), pagamentos via Stripe e backend Supabase (PostgreSQL + Auth).

## Stack Técnica

- **Framework:** Next.js 16 (App Router, React 19, TypeScript 5.6)
- **Estilização:** Tailwind CSS v4, shadcn/ui (estilo "new-york"), Radix UI, CVA, clsx + tailwind-merge
- **Ícones:** Lucide React
- **Banco de Dados:** Supabase (PostgreSQL com Row Level Security)
- **Auth:** Supabase Auth — cookies (web) + Bearer token JWT (mobile)
- **Pagamentos:** Stripe (checkout sessions, webhooks, customer portal)
- **IA:** Groq SDK (LLaMA 3.1 8B para assistente, Whisper Large v3 para transcrição)
- **Mobile:** Expo (React Native) em `/mobile/`
- **Package Manager:** pnpm
- **Deploy:** Vercel

## Comandos

```bash
pnpm dev          # next dev --hostname 0.0.0.0 --webpack
pnpm build        # next build
pnpm lint         # eslint .
pnpm start        # next start
```

## Estrutura do Projeto

```
app/                  # Next.js App Router (páginas + API routes)
  api/                # API routes (runtime: nodejs)
  auth/               # Páginas de autenticação
  dashboard/          # Páginas do dashboard (protegidas)
components/           # Componentes React
  ui/                 # Primitivos shadcn/ui (button, card, input, dialog...)
  dashboard/          # Componentes do dashboard (charts, filtros)
  {feature}/          # Componentes por feature (budgets, clients, finance...)
lib/                  # Utilitários e clientes
  supabase/           # Clientes Supabase (server, client, service-role, with-token)
  stripe/             # Operações Stripe (checkout, customer)
  agent/              # Sistema de IA (orchestrator, registry, schema)
  groq/               # Cliente Groq
mobile/               # App Expo/React Native (separado)
scripts/              # Migrações e utilitários de banco
supabase/             # Templates de email Supabase
public/               # Assets estáticos
styles/               # CSS global e configuração Tailwind
middleware.ts         # Auth + controle de acesso por plano/assinatura
```

## Convenções de Código

### Idioma

- **Todo o código é em português:** variáveis, comentários, mensagens de erro, textos de UI
- Locale: `pt-BR` para datas (`toLocaleDateString("pt-BR", ...)`) e moeda (`Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`)
- HTML lang: `pt-BR`

### Nomenclatura de Arquivos

- **Componentes e páginas:** kebab-case (ex: `delete-appointment-button.tsx`, `work-order-form.tsx`)
- **Componentes React:** PascalCase para funções (ex: `NoteCard`, `AppointmentForm`)
- **Utilitários:** kebab-case (ex: `api-route-auth.ts`)
- **Extensões:** `.tsx` para componentes, `.ts` para utilitários e API routes

### Imports

- Sempre usar path alias `@/` para imports absolutos (ex: `@/components/ui/button`, `@/lib/supabase/client`)
- Nunca usar imports relativos

### Componentes React

- Usar `"use client"` explicitamente em componentes interativos (formulários, estado)
- Server Components (async) para páginas que fazem data fetching
- Props tipadas com `interface` no topo do arquivo
- Estado local com `useState` — não usar Redux/Zustand/Context

### Estilização

- Tailwind CSS via className — não usar CSS modules
- Utilitário `cn()` de `@/lib/utils` para merge de classes (`clsx` + `tailwind-merge`)
- Variantes de componentes com CVA (`class-variance-authority`)
- Suporte a dark mode via `next-themes`

### Formulários

- Estado gerenciado com múltiplos `useState` (não usar React Hook Form para state)
- Validação com Zod (principalmente no sistema de agentes IA)
- Mensagens de erro inline em português

### Data Fetching

- Supabase direto — sem React Query, SWR ou wrappers
- Server: `createClient()` de `@/lib/supabase/server.ts`
- Client: `createClient()` de `@/lib/supabase/client.ts`
- API routes com token: `createClientWithToken()` de `@/lib/supabase/with-token.ts`
- Service role (admin): `createServiceClient()` de `@/lib/supabase/service-role.ts`
- Pattern: `await supabase.from("tabela").select(...).eq(...)`

### API Routes

- Sempre declarar `export const runtime = "nodejs"`
- Respostas com `NextResponse.json()`
- Auth mobile via Bearer token: usar helper de `@/lib/supabase/api-route-auth.ts`
- Tratamento de erros com try-catch, mensagens em português

### Tratamento de Erros

- try-catch com `setError(err?.message || "Erro ao ...")` em componentes client
- Exibição inline: `<div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>`
- API routes retornam status HTTP adequados com mensagem de erro em JSON

### Notificações

- Sonner (`sonner`) disponível para toasts
- Erros inline no formulário (sem toast para erros de validação)

## Autenticação e Middleware

- `middleware.ts` protege rotas `/dashboard/*`
- Rotas públicas: `/`, `/auth/*`, `/api/*`, `/_vercel/*`, `/_next/*`
- Lógica de trial: 7 dias grátis após cadastro
- Usuários sem plano ativo são redirecionados para `/dashboard/plan`
- Mobile usa JWT Bearer token no header Authorization

## Pagamentos (Stripe)

- Planos: Básico (R$ 47,90/mês) e Plus (R$ 77,90/mês)
- Fluxo: checkout session → webhook → atualiza `subscriptions` + `profiles`
- Webhooks tratados: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
- Customer Portal para gestão de assinatura pelo usuário

## Sistema de IA (Íris)

- Orquestrador em `lib/agent/orchestrator.ts`
- Registry de intents com schemas Zod em `lib/agent/registry.ts`
- 15+ intents: criar cliente, agendar visita, criar orçamento, registrar despesa, etc.
- Suporta entrada de texto e áudio (transcrição via Whisper)
- Classificação de intent → extração de parâmetros → execução no banco

## Tabelas Principais (Supabase)

`profiles`, `subscriptions`, `clients`, `appointments`, `budgets`, `transactions`, `categories`, `stock_products`, `stock_movements`, `notes`, `tasks`, `maintenance_plans`, `work_orders`, `chat_messages`

## Variáveis de Ambiente

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIC
STRIPE_PRICE_PLUS

# Groq (IA)
GROQ_API_KEY
GROQ_MODEL              # default: llama-3.1-8b-instant
GROQ_TRANSCRIBE_MODEL   # whisper-large-v3
GROQ_TRANSCRIBE_FORMAT  # text

# App
NEXT_PUBLIC_APP_URL
```

## Testes

Não há suite de testes automatizados no projeto. Testar manualmente alterações críticas antes de deploy.

## Mobile (`/mobile/`)

- App Expo com React Navigation (bottom tabs + native stack)
- Bundle ID: `com.iris.jardinagem`
- Mesmo backend Supabase, auth via Bearer token
- Push notifications via Expo Server SDK
- Permissões: gravação de áudio (assistente IA)
