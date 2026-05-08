# Fase 03 — Pagamentos Robustos e Modelo de Dados

## Contexto

Fase **bloqueante para produção**. Os problemas críticos identificados:

1. **Webhook Stripe sem idempotência** — retentativas duplicam ativações.
2. **Período de assinatura calculado em JS** (`now + 1 mês`) em vez de ler `current_period_end` do Stripe.
3. **Race condition** entre `checkout.session.completed` e `invoice.payment_succeeded`.
4. **Sem reconciliação periódica** — drift entre Stripe e DB local fica invisível.
5. **Migrações desorganizadas** — pasta `scripts/` com 35 arquivos numerados, sem `supabase/migrations/` formal.
6. **Índices de banco ausentes** em colunas usadas por queries quentes.
7. **Sem auditoria de RLS completa** — apenas hardening parcial.

## Objetivo

Tornar o fluxo de pagamento **confiável e auditável**. Migrar para `supabase/migrations/` com convenção do CLI Supabase. Adicionar índices. Validar RLS. Construir reconciliação automática.

## Escopo

### Entra
- Tabela `stripe_events` para idempotência.
- Refator do webhook para idempotência + uso de `current_period_end` real.
- Tratamento explícito de mais eventos: `customer.subscription.updated`, `customer.subscription.created`.
- Cron job (Vercel Cron) `/api/cron/reconcile-subscriptions` rodando diariamente.
- Migração de `scripts/*.sql` para `supabase/migrations/<timestamp>_<descricao>.sql`. Manter histórico (não rebaselinar).
- Auditoria de RLS em todas as tabelas de domínio. Migração corretiva se faltar política.
- Adição de índices em `clients.gardener_id`, `appointments.gardener_id+date`, `transactions.gardener_id+date`, `subscriptions.gardener_id`, etc.
- Coluna `idempotency_key` em `stripe_events` e validação no checkout para evitar dupla criação de session.

### Não entra
- Mudança de provedor de pagamento.
- Suporte a planos anuais (registrar como pendência).
- Customer Portal redesign (já existe, manter).
- Refator do orquestrador da Íris.

## Prompt para o agente executor

```markdown
Você está executando a **Fase 03 — Pagamentos Robustos e Modelo de Dados** do Gestão Garden, conforme `docs/fases/fase-03-pagamentos-dados.md`.

**Pré-requisitos:** Fases 00 e 01 mergeadas. Fase 02 fortemente recomendada antes (typecheck honesto pega bugs de tipo Stripe).

**Branch:** `feat/fase-03-pagamentos-dados`.

**Leia antes:**
- `docs/01-arquitetura-alvo.md` (seção Pagamentos)
- `app/api/subscription/webhook/route.ts`
- `app/api/subscription/checkout/route.ts`
- `app/api/subscription/verify-payment/route.ts`
- `lib/stripe/`
- Todas as migrações em `scripts/`

**Tarefas:**

### 1. Reorganizar migrações em `supabase/migrations/`

- Criar pasta `supabase/migrations/` se não existir.
- **NÃO renomear** arquivos antigos em `scripts/`. Em vez disso, criar uma migração marco `<timestamp>_baseline.sql` documentando o estado atual (apenas comentários listando os scripts já aplicados em produção).
- Daqui em diante, **toda nova migração** vai em `supabase/migrations/` com formato `YYYYMMDDHHMMSS_descricao.sql` (compatível com Supabase CLI).
- Atualizar `docs/03-padroes-e-convencoes.md` se necessário (já cita esse padrão).
- Mover `scripts/` para `scripts/legacy-migrations/` para deixar claro que é histórico.

### 2. Tabela de idempotência de eventos Stripe

Criar migração `supabase/migrations/<timestamp>_create_stripe_events.sql`:

```sql
-- UP
create table if not exists public.stripe_events (
  event_id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create index if not exists idx_stripe_events_type_received
  on public.stripe_events (type, received_at desc);

alter table public.stripe_events enable row level security;
-- Sem policies: tabela é admin-only, manipulada apenas via service-role no webhook.

-- DOWN: drop table public.stripe_events;
```

### 3. Refatorar webhook Stripe

Editar `app/api/subscription/webhook/route.ts`:

- Validar assinatura (já está OK).
- **Logo após validar**, inserir o evento:
  ```ts
  const { data: inserted, error } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type, payload: event as unknown })
    .select("event_id")
    .single();

  if (error?.code === "23505" /* unique violation */) {
    // já processado, retornar 200 OK
    return NextResponse.json({ ok: true, deduplicated: true });
  }
  if (error) throw error;
  ```
- Processar o evento dentro de try/catch.
- Em sucesso, atualizar `processed_at = now()`.
- Em falha, gravar `error` e retornar 500 (Stripe retentará, e o INSERT já preveniu duplicação na próxima volta — porque o INSERT inicial só vai falhar se já existir; precisamos tratar caso de re-tentar processamento de evento que falhou). **Estratégia:** se já existe e `processed_at IS NULL`, prosseguir com processamento (re-tentativa); se `processed_at` está setado, retornar 200 (já processado). Implemente essa lógica explícita.

### 4. Eventos tratados — usar dados reais do Stripe

Tratar:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Para CADA um, atualizar `subscriptions` lendo:
- `subscription.current_period_end` (Unix → timestamptz). **Nunca calcular em JS.**
- `subscription.status` (mapear para enum local: `active`, `past_due`, `canceled`, `unpaid`).
- `subscription.cancel_at_period_end`.
- `subscription.items.data[0].price.id` (para detectar mudança de plano).

Atualizar `profiles.plan` consistentemente. Considerar criar uma função única `sincronizarAssinaturaDoStripe(subscriptionId)` que busca a subscription completa via `stripe.subscriptions.retrieve(id)` e aplica no DB. Os handlers de eventos chamam essa função em vez de duplicar lógica.

Eliminar a heurística atual de `periodEnd = now + 1 mês` (linhas ~47-48 do webhook).

### 5. Refatorar checkout

`app/api/subscription/checkout/route.ts`:

- Usar `requireUser` (Fase 01).
- Validar plano com Zod.
- Validar idempotency key opcional do client (se vier, passar para Stripe via `idempotencyKey` na criação da session).
- **Não** criar registro `subscriptions` localmente antes do checkout — deixar para o webhook criar/atualizar quando o pagamento confirmar. Eliminar a "subscription pending órfã" identificada na auditoria.
- `success_url` e `cancel_url`: validar que começam com `NEXT_PUBLIC_APP_URL`.

### 6. Cron de reconciliação

Criar `app/api/cron/reconcile-subscriptions/route.ts`:

- Proteger com header `Authorization: Bearer ${CRON_SECRET}` ou Vercel cron header.
- Listar `subscriptions` ativas no DB.
- Para cada uma, chamar `stripe.subscriptions.retrieve(id)`.
- Comparar `status` e `current_period_end`. Se divergir, sincronizar. Logar.
- Se a subscription não existir mais no Stripe, marcar como `canceled` no DB.
- Gerar resumo `{ scanned, drift_corrected, errors }`.

Configurar `vercel.json` com cron diário 03:00 UTC:
```json
{
  "crons": [
    { "path": "/api/cron/reconcile-subscriptions", "schedule": "0 3 * * *" }
  ]
}
```

Adicionar `CRON_SECRET` em `.env.example`.

### 7. Auditoria de RLS

Para cada tabela de domínio (`clients`, `appointments`, `budgets`, `transactions`, `categories`, `stock_products`, `stock_movements`, `notes`, `tasks`, `maintenance_plans`, `work_orders`, `chat_messages`, `subscriptions`, `device_tokens`, `agent_invocations` se existir):

- Confirmar `enable row level security`.
- Confirmar policy `select`, `insert`, `update`, `delete` com `auth.uid() = gardener_id` (ou equivalente).
- Onde faltar, criar migração `<timestamp>_complete_rls_audit.sql` que aplique de forma idempotente:
  ```sql
  do $$
  begin
    if not exists (select 1 from pg_policies where tablename = 'clients' and policyname = 'clients_owner') then
      create policy "clients_owner" on public.clients
        for all using (auth.uid() = gardener_id) with check (auth.uid() = gardener_id);
    end if;
  end $$;
  ```

### 8. Índices

Criar migração `<timestamp>_add_performance_indexes.sql` com índices para queries quentes. Examinar uso real, mas como mínimo:

```sql
create index if not exists idx_clients_gardener on public.clients (gardener_id);
create index if not exists idx_appointments_gardener_date on public.appointments (gardener_id, date);
create index if not exists idx_transactions_gardener_date on public.transactions (gardener_id, date desc);
create index if not exists idx_budgets_gardener_status on public.budgets (gardener_id, status);
create index if not exists idx_subscriptions_gardener on public.subscriptions (gardener_id);
create index if not exists idx_subscriptions_stripe_sub on public.subscriptions (stripe_subscription_id);
create index if not exists idx_stock_movements_gardener_date on public.stock_movements (gardener_id, created_at desc);
create index if not exists idx_work_orders_gardener_status on public.work_orders (gardener_id, status);
```

Inspecionar queries reais antes — se houver outras colunas em `where`/`order` frequente, adicionar.

### 9. Validar trial e plano em middleware

Conferir que após mudanças, o middleware ainda funciona corretamente para usuários:
- Em trial.
- Com pagamento `active`.
- Com `past_due`.
- Cancelados.

Sem mudanças funcionais — só validar que o webhook agora coloca dados corretos e o middleware responde como esperado.

### 10. Verificações finais

- Stripe CLI: `stripe listen --forward-to localhost:3000/api/subscription/webhook`. Disparar `stripe trigger checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `invoice.payment_failed`. Conferir comportamento e idempotência (disparar 2x mesmo evento → segundo retorna `deduplicated: true`).
- Rodar cron de reconciliação manualmente: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/reconcile-subscriptions`.
- `pnpm tsc --noEmit && pnpm lint && pnpm build` passam.

**Restrições:**
- NÃO criar coluna nova em `subscriptions` ou `profiles` sem necessidade. Reutilizar o que existe.
- NÃO migrar usuários existentes. Mudanças são forward-only.
- NÃO mexer em rotas fora de `subscription/*` e `cron/*`.

**Entrega:**
- PR draft.
- Título: `feat(stripe): idempotência, period_end real e reconciliação periódica`.
- Resumo cobrindo migrações criadas, eventos novos tratados, comportamento do cron.

**Definition of Done — copiar para o PR:**
- [ ] Tabela `stripe_events` criada e usada.
- [ ] Webhook idempotente (testado disparando evento duplicado).
- [ ] `current_period_end` lido do Stripe, nunca calculado.
- [ ] 6 eventos tratados explicitamente.
- [ ] Cron de reconciliação configurado e testado manualmente.
- [ ] Migração de RLS audit aplicada, todas as tabelas com policies.
- [ ] Índices de performance criados.
- [ ] `scripts/` movido para `scripts/legacy-migrations/`, novas migrações em `supabase/migrations/`.
- [ ] Subscription "pending órfã" eliminada — checkout não cria mais.
- [ ] Stripe CLI test: 4 cenários verificados.
- [ ] CRON_SECRET adicionado ao `.env.example`.
```

## Definition of Done

- [ ] Idempotência via `stripe_events`.
- [ ] `current_period_end` real.
- [ ] 6 eventos Stripe tratados.
- [ ] Cron de reconciliação.
- [ ] RLS auditada.
- [ ] Índices criados.
- [ ] Migrações reorganizadas.

## Riscos

- **Webhooks em produção podem não suportar a refatoração** se Stripe estiver com configuração antiga. **Antes de mergear**, conferir endpoint configurado no dashboard Stripe e eventos habilitados.
- **Migração de RLS pode bloquear acesso legítimo** se a policy estiver mais restritiva do que a anterior. Aplicar em staging antes.
- **Cron rodando em prod sem CRON_SECRET configurado** = rota aberta. Garantir env antes do deploy.
- **Eliminação de subscription pending** quebra UI que esperava o registro. Conferir `dashboard/plan` e ajustar.
