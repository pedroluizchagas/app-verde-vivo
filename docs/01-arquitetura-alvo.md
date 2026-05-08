# 01 — Arquitetura-Alvo

Estado **alvo** ao final do roadmap. O estado atual está descrito em `00-visao-tecnica.md`.

## Visão de alto nível

```
                    ┌──────────────────────────────────────────┐
                    │                Usuários                  │
                    │   web (browser)         mobile (Expo)    │
                    └─────────┬──────────────────┬─────────────┘
                              │                  │
                       cookies/sessão     Bearer JWT
                              │                  │
                    ┌─────────▼──────────────────▼─────────────┐
                    │      Next.js (Vercel) — App Router       │
                    │  ┌────────────┐  ┌────────────────────┐  │
                    │  │ middleware │  │ rate limit (Upstash)│ │
                    │  └────────────┘  └────────────────────┘  │
                    │  ┌────────────┐  ┌────────────────────┐  │
                    │  │ pages SSR  │  │ API routes         │  │
                    │  └────────────┘  └────────────────────┘  │
                    └─────┬──────────────┬───────────┬─────────┘
                          │              │           │
                  ┌───────▼───┐  ┌───────▼───┐  ┌────▼─────┐
                  │ Supabase  │  │  Stripe   │  │  Groq    │
                  │ (PG + RLS)│  │ (billing) │  │ (LLM/STT)│
                  └───────────┘  └─────┬─────┘  └──────────┘
                                       │
                                  webhooks idempotentes
```

## Camadas

### 1. Cliente (web)
- **Next.js 16** App Router, React 19, TypeScript em `strict` real (sem `ignoreBuildErrors`).
- **Server Components** por padrão. `"use client"` só onde houver interação ou estado.
- **Páginas finas:** data fetching e cálculos pesados em `lib/`. Página orquestra, não calcula.
- **UI:** Tailwind v4 + shadcn/ui + Radix. CVA para variantes.
- **Forms:** `react-hook-form` + Zod. Mensagens em pt-BR, locale `pt-BR` para datas e moeda.

### 2. Cliente (mobile)
- **Expo SDK 54+** com React Native, mesma backend.
- Auth via Bearer JWT. Centralizado em `mobile/src/services/api.ts`.
- Compartilha **schemas Zod** com web via pacote `lib/shared/` ou symlink — única fonte da verdade para validação.

### 3. API e domínio
- **API routes** em `app/api/` declaram `runtime = "nodejs"` quando usarem libs Node.
- Toda rota não-pública passa por `withAuth(handler)` e, quando aplicável, `withRateLimit(handler)`.
- Lógica de negócio em `lib/domain/<bounded-context>/`. API route = adapter HTTP fino.
- Padrão de resposta consistente: `{ data, error }` ou códigos HTTP padrão. Nunca vazar stack traces.

### 4. Dados (Supabase / Postgres)
- **RLS habilitada em todas as tabelas de domínio.** Política `auth.uid() = gardener_id` (ou equivalente) para SELECT/INSERT/UPDATE/DELETE.
- **Service role** usado apenas em:
  - `/api/auth/callback` (bootstrap do perfil/trial).
  - `/api/subscription/webhook` (eventos Stripe).
  - Jobs internos / cron.
- Demais rotas autenticadas usam **JWT do usuário** (cookie ou Bearer) e RLS protege os dados.
- **Migrações versionadas** em `supabase/migrations/` (nome: `YYYYMMDDHHMM_descricao.sql`). Cada migração tem seção `-- DOWN` documentada (mesmo que não execute automaticamente).
- Índices obrigatórios em todas as colunas usadas em `.eq()`, `.in()`, `.order()` de queries quentes.

### 5. Pagamentos (Stripe)
- **Webhook idempotente:** tabela `stripe_events(event_id PK, type, created_at, processed_at)`. `INSERT ... ON CONFLICT DO NOTHING` no início do handler. Se o insert não criou linha, o evento já foi processado.
- **Período da assinatura lido do Stripe** (`subscription.current_period_end`). Nunca calculado em JS.
- **Reconciliação periódica:** cron diário compara `subscriptions` locais com Stripe e corrige drift.
- **Customer Portal** para self-service (cancelar, atualizar cartão, mudar plano).
- Eventos tratados: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.

### 6. IA (Íris)
- **Pipeline:**
  ```
  input (texto/áudio)
    → [opcional] Whisper (transcrição)
    → sanitização (escape de delimitadores, limite de tamanho)
    → orchestrator (Groq + system prompt com guardrails)
    → resposta JSON estruturada
    → validação Zod estrita
    → confirmação UI obrigatória se intent.critical === true
    → execução em lib/domain/* (não acessa DB diretamente do orchestrator)
  ```
- **Prompt** versionado em `lib/agent/prompts/`. Mudanças passam por review.
- **Sem `service_role`** no caminho da IA. A IA usa o JWT do usuário; RLS impede side-effects cross-tenant.
- **Rate limit por usuário** (Upstash): N requisições/min, M transcrições/hora.
- **Telemetria:** cada execução grava `{ user_id, intent, tokens_in, tokens_out, latency, success, error }` em tabela `agent_invocations`.

### 7. Segurança
- **Headers:** CSP, HSTS, X-Frame-Options, Referrer-Policy via `next.config.mjs`.
- **CORS:** explícito por rota (mobile precisa, painel admin não).
- **Secrets:** apenas em `.env` (local) e em variáveis de ambiente da Vercel/Supabase. Nunca commitados. `.env.example` mantido atualizado.
- **Auth helpers únicos:** `lib/auth/api.ts` exporta `requireUser(request)` e `requireUserWithPlan(request, plan)`. Todas as rotas usam essas funções; nada de extração de token ad-hoc.

### 8. Observabilidade
- **Logs estruturados** com `pino` ou similar: `{ level, ts, traceId, userId, route, ...meta }`.
- **Sentry** (ou equivalente) para erros não tratados e monitoring de performance.
- **Métricas de negócio:** assinaturas ativas, churn diário, falhas de webhook, intents executadas, custo Groq.
- **Alertas:** webhook Stripe com falha repetida, taxa de erro 5xx > 1%, latência p95 > 2s.

### 9. CI/CD
- **GitHub Actions:**
  - `lint` (eslint + tsc --noEmit) em todo PR.
  - `test` (Vitest unit + Playwright E2E em PR para main).
  - `build` em todo PR.
  - `migrate-check` valida que migrações são reversíveis.
- **Vercel:** preview deploy por PR. Production só em merge na main.
- **Branch protection** em main: PR obrigatório, 1 review, status checks verdes.

## Estrutura-alvo de pastas

```
app/                          # Next.js App Router (rotas e páginas)
  (auth)/                     # group: páginas de auth
  (marketing)/                # group: landing
  dashboard/                  # área autenticada
  api/
    [bounded-context]/        # rotas agrupadas por contexto

components/
  ui/                         # primitivos shadcn (não modificar manualmente)
  shared/                     # compartilhado entre features
  [feature]/                  # componentes da feature

lib/
  auth/                       # helpers de autenticação centralizados
  domain/                     # lógica de negócio por contexto
    clients/
    finance/
    scheduling/
    stock/
    subscriptions/
  agent/                      # IA (Íris)
    prompts/
    intents/
    orchestrator.ts
  stripe/
  supabase/
  validation/                 # schemas Zod compartilhados
  observability/              # logger, métricas, Sentry init

mobile/                       # Expo (sub-projeto)

supabase/
  migrations/                 # migrações versionadas (substitui scripts/)

docs/                         # esta pasta
  adr/                        # Architecture Decision Records

tests/
  unit/                       # Vitest
  e2e/                        # Playwright

.github/
  workflows/                  # CI

scripts/                      # utilitários de dev (seeds, dumps), não migrações
```

## Decisões a registrar como ADR

Conforme cada uma for tomada, criar `docs/adr/NNNN-titulo.md`:

- ADR-0001: Permanecer em monolito Next.js + Supabase.
- ADR-0002: Stripe como provedor único de billing (não Pagar.me / Mercado Pago) — revisitar quando expandir BR.
- ADR-0003: Groq como provedor de LLM (latência, custo) — fallback para Anthropic em caso de outage.
- ADR-0004: Upstash para rate limit e cache.
- ADR-0005: Sentry para error tracking.
