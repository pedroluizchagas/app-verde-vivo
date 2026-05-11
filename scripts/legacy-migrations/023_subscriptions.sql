-- Add subscription fields to profiles
alter table public.profiles
  add column if not exists plan text check (plan in ('basic', 'plus'));

alter table public.profiles
  add column if not exists asaas_customer_id text;

-- Subscriptions table: tracks each subscription lifecycle
create table if not exists public.subscriptions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  plan                  text not null check (plan in ('basic', 'plus')),
  status                text not null default 'pending'
                          check (status in ('pending', 'active', 'overdue', 'cancelled', 'inactive')),
  asaas_subscription_id text unique,
  asaas_customer_id     text,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table public.subscriptions enable row level security;

-- Users can only read their own subscriptions;
-- inserts/updates are performed by the service role (checkout + webhook)
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);
