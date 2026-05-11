-- Indices de performance para queries quentes em listagens.
--
-- Criterios: cobre as colunas usadas em where + order observados em
-- app/, components/ e lib/ (auditoria manual durante a Fase 03). Inclui
-- apenas indices que ainda nao existem em scripts/legacy-migrations/*.
--
-- Idempotente (`if not exists`). Reversivel via `drop index`.

-- clients: listagens por jardineiro.
create index if not exists idx_clients_gardener
  on public.clients (gardener_id);

-- appointments: agenda do dia/mes, ordenada por data agendada.
-- Coluna real e `scheduled_date` (timestamptz) — schema em 001_create_tables.
create index if not exists idx_appointments_gardener_scheduled
  on public.appointments (gardener_id, scheduled_date);

-- budgets: kanban por status, listas filtradas no dashboard.
create index if not exists idx_budgets_gardener_status
  on public.budgets (gardener_id, status);

-- subscriptions: lookup por user_id (status/plan da home) e por
-- stripe_subscription_id (reconciliacao e webhook).
create index if not exists idx_subscriptions_user
  on public.subscriptions (user_id);
create index if not exists idx_subscriptions_stripe_sub
  on public.subscriptions (stripe_subscription_id);

-- product_movements: linha do tempo do estoque por jardineiro.
create index if not exists idx_product_movements_gardener_date
  on public.product_movements (gardener_id, created_at desc);

-- service_orders: lista por status (concluida/aberta) por jardineiro.
create index if not exists idx_service_orders_gardener_status
  on public.service_orders (gardener_id, status);

-- DOWN:
-- drop index if exists public.idx_clients_gardener;
-- drop index if exists public.idx_appointments_gardener_scheduled;
-- drop index if exists public.idx_budgets_gardener_status;
-- drop index if exists public.idx_subscriptions_user;
-- drop index if exists public.idx_subscriptions_stripe_sub;
-- drop index if exists public.idx_product_movements_gardener_date;
-- drop index if exists public.idx_service_orders_gardener_status;
