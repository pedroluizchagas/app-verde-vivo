-- Tabela de idempotencia para eventos do Stripe.
-- O webhook insere o evento antes de processar. Se ja existir (PK unica),
-- evita o reprocessamento. Tambem armazena o payload bruto para auditoria
-- e o erro quando o processamento falhar (para diagnostico).

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

-- RLS habilitada sem policies: a tabela e admin-only e so e manipulada
-- pelo webhook via service-role. Roles anon/authenticated nao tem acesso.
alter table public.stripe_events enable row level security;

-- DOWN:
-- drop table public.stripe_events;
