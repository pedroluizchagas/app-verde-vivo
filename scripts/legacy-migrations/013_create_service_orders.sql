create extension if not exists "pgcrypto";

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','issued','completed','cancelled')),
  labor_cost numeric(12,2) not null default 0,
  materials_total numeric(12,2) not null default 0,
  materials_markup_pct numeric(5,2) not null default 0,
  extra_charges numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  transaction_id uuid references public.financial_transactions(id) on delete set null,
  approved_by text,
  approved_at timestamptz,
  signature_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists service_orders_gardener_created_idx on public.service_orders (gardener_id, created_at desc);

alter table public.service_orders enable row level security;

drop policy if exists "service_orders_select_own" on public.service_orders;
create policy "service_orders_select_own" on public.service_orders for select using (auth.uid() = gardener_id);

drop policy if exists "service_orders_insert_own" on public.service_orders;
create policy "service_orders_insert_own" on public.service_orders for insert with check (auth.uid() = gardener_id);

drop policy if exists "service_orders_update_own" on public.service_orders;
create policy "service_orders_update_own" on public.service_orders for update using (auth.uid() = gardener_id);

drop policy if exists "service_orders_delete_own" on public.service_orders;
create policy "service_orders_delete_own" on public.service_orders for delete using (auth.uid() = gardener_id);

create or replace function public.update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_service_orders on public.service_orders;
create trigger set_updated_at_service_orders before update on public.service_orders for each row execute function public.update_updated_at();