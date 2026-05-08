# Fase 06 — Observabilidade e Operação

## Contexto

Hoje o projeto opera às cegas:
- Sem logger estruturado (apenas `console.error` esparso).
- Sem rastreio de erros (Sentry/equivalente).
- Sem métricas de negócio (assinaturas ativas, churn, falhas Stripe).
- Sem alertas.
- Webhooks falhando passam despercebidos até alguém reclamar.

## Objetivo

Tornar a operação observável: logs estruturados, errors capturados, métricas de negócio visíveis, alertas em incidentes críticos.

## Escopo

### Entra
- Logger estruturado (`pino` ou similar) em `lib/observability/logger.ts`.
- Sentry para erros web e mobile.
- Métricas básicas via tabela `metrics_daily` calculada por cron.
- Endpoint `/api/admin/metrics` (protegido) com snapshot.
- Alertas: webhook Stripe com falha persistente, taxa 5xx, intent IA com erro recorrente.
- CSP no `next.config.mjs` (agora que sabemos as origens).
- Política de retenção de logs (`agent_invocations`, `stripe_events`).

### Não entra
- Dashboard visual completo de métricas (Grafana). Por ora, JSON via endpoint.
- Substituição de Sentry por outro provedor.
- Distributed tracing (overkill para monolito).

## Prompt para o agente executor

```markdown
Você está executando a **Fase 06 — Observabilidade e Operação** do Gestão Garden.

**Pré-requisitos:** Fases 01, 02, 03, 04 mergeadas.

**Branch:** `feat/fase-06-observabilidade`.

**Tarefas:**

### 1. Logger estruturado

```
pnpm add pino pino-pretty
```

`lib/observability/logger.ts`:
```ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "gestao-garden" },
  ...(process.env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});

export function loggerComContexto(meta: Record<string, unknown>) {
  return logger.child(meta);
}
```

Substituir todos os `console.error` em `app/api/**` e `lib/**` por:
```ts
const log = loggerComContexto({ route: "/api/...", userId });
log.error({ err }, "mensagem descritiva");
```

Regra ESLint: `no-console` em `error` (já adicionado em Fase 02). Permitir `console.error` apenas em testes.

### 2. Sentry (web)

```
pnpm add @sentry/nextjs
```

Seguir wizard ou config manual. Adicionar:
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- `withSentryConfig` em `next.config.mjs`.
- Envs: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- Adicionar em `.env.example`.

Filtros importantes:
- Ignorar `AbortError` em fetch.
- `beforeSend` que remove dados sensíveis (Stripe metadata, Bearer tokens em logs).
- `tracesSampleRate: 0.1` (production), `1.0` (dev).

### 3. Sentry (mobile)

`pnpm --filter mobile add @sentry/react-native` (ou equivalente para Expo).
Inicializar em `mobile/App.tsx`. Mesmo DSN, projeto Sentry separado.

### 4. Métricas de negócio

Migração `<timestamp>_create_metrics_daily.sql`:
```sql
create table if not exists public.metrics_daily (
  date date primary key,
  trial_users integer not null default 0,
  active_basic integer not null default 0,
  active_plus integer not null default 0,
  past_due integer not null default 0,
  canceled_today integer not null default 0,
  new_signups integer not null default 0,
  agent_invocations_total integer not null default 0,
  agent_invocations_errors integer not null default 0,
  webhook_events_total integer not null default 0,
  webhook_events_failed integer not null default 0,
  computed_at timestamptz not null default now()
);
alter table public.metrics_daily enable row level security;
-- Sem policy: tabela admin-only.
```

Cron diário `app/api/cron/compute-metrics/route.ts`:
- Protegido por `CRON_SECRET`.
- Calcula valores do dia anterior agregando `profiles`, `subscriptions`, `agent_invocations`, `stripe_events`.
- `INSERT ... ON CONFLICT (date) DO UPDATE SET ...`.

`vercel.json`:
```json
{ "path": "/api/cron/compute-metrics", "schedule": "30 3 * * *" }
```

(30min depois do reconcile-subscriptions criado na Fase 03.)

### 5. Endpoint admin de métricas

`app/api/admin/metrics/route.ts`:
- Auth: header `X-Admin-Token` validado contra `ADMIN_API_TOKEN` (env).
- Query string `?days=30` retorna últimos N dias de `metrics_daily`.
- JSON: `{ data: [...], generated_at }`.

Adicionar `ADMIN_API_TOKEN` ao `.env.example`.

### 6. Alertas

**Webhook Stripe falhando:**
- Em `webhook/route.ts`, no catch, se erro for persistente (3 falhas em 1h para mesmo `event.type`), `logger.fatal` com tag `alert: stripe_webhook`.
- Sentry captura e dispara alerta configurado no dashboard Sentry (configuração manual, documentar em README).

**Taxa 5xx:**
- Sentry tem alerta nativo. Configurar para "issue volume > 50/h".

**Intent IA com erro recorrente:**
- Cron de métricas calcula `agent_invocations_errors`. Se > 10% do total do dia, gravar issue em log com `alert: agent_high_error_rate`.

### 7. CSP

Agora que conhecemos as origens (Supabase, Stripe, Groq, Sentry, Upstash, Expo push), adicionar CSP em `next.config.mjs`:

```js
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.sentry.io",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.groq.com https://*.sentry.io https://*.upstash.io",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
  ].join("; "),
}
```

**Testar manualmente** após aplicar — CSP é fácil de quebrar features. Conferir Stripe checkout, Sentry capturando, push notifications, IA respondendo.

### 8. Retenção de dados

Migração `<timestamp>_data_retention_jobs.sql`:
```sql
-- Função para limpar dados antigos
create or replace function public.limpar_dados_antigos() returns void as $$
begin
  delete from public.agent_invocations where created_at < now() - interval '90 days';
  delete from public.stripe_events where received_at < now() - interval '180 days';
end;
$$ language plpgsql security definer;
```

Não executar via cron Vercel (precisa de DB access). Usar Supabase scheduled functions ou cron do Postgres (`pg_cron` extension). Documentar configuração no PR.

### 9. README operacional

Criar `docs/operacao.md` com:
- Como ler logs em produção (Vercel logs + Sentry).
- Como ver métricas (`curl` no endpoint admin).
- Lista de alertas configurados e o que fazer.
- Como rodar reconciliação Stripe manualmente.
- Como rotacionar secrets.

### 10. Verificações finais

- `pnpm test`, `pnpm build` passam.
- Disparar erro intencional em rota e ver no Sentry.
- Rodar cron de métricas manualmente, ver linha em `metrics_daily`.
- Conferir que CSP não quebrou nada (Stripe checkout, IA, push).

**Entrega:**
- PR draft.
- Título: `feat(observabilidade): logger estruturado, Sentry, métricas e CSP`.

**Definition of Done — copiar para o PR:**
- [ ] Pino configurado e usado em rotas críticas.
- [ ] `console.error` substituído por logger (exceto testes).
- [ ] Sentry web e mobile inicializados.
- [ ] Tabela `metrics_daily` + cron + endpoint admin.
- [ ] Alertas documentados (Sentry + log fatal).
- [ ] CSP aplicado e validado manualmente.
- [ ] Função de retenção criada.
- [ ] `docs/operacao.md` criado.
- [ ] `.env.example` com novas envs (Sentry, ADMIN_API_TOKEN).
```

## Definition of Done

- [ ] Logger estruturado em uso.
- [ ] Sentry web e mobile.
- [ ] Métricas e endpoint.
- [ ] Alertas.
- [ ] CSP.
- [ ] Doc de operação.

## Riscos

- **CSP é traiçoeiro.** Testar TODAS as features depois de aplicar. Considerar `Content-Security-Policy-Report-Only` por 1 semana antes de enforçar.
- **Sentry tem custo por evento.** Sample rate 10% em produção é razoável. Ignorar erros conhecidos via `beforeSend`.
- **Logs em Vercel são efêmeros.** Considerar logdrain para Datadog/Logtail no futuro — registrar como pendência, não desta fase.
