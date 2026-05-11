-- Finance module: categories and transactions

-- Table: financial_categories (supports parent/child for subcategories)
create table if not exists public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.financial_categories(id) on delete set null,
  created_at timestamptz default now(),
  unique (gardener_id, name, parent_id)
);

alter table public.financial_categories enable row level security;

drop policy if exists "financial_categories_select_own" on public.financial_categories;
create policy "financial_categories_select_own"
  on public.financial_categories for select
  using (auth.uid() = gardener_id);

drop policy if exists "financial_categories_insert_own" on public.financial_categories;
create policy "financial_categories_insert_own"
  on public.financial_categories for insert
  with check (auth.uid() = gardener_id);

drop policy if exists "financial_categories_update_own" on public.financial_categories;
create policy "financial_categories_update_own"
  on public.financial_categories for update
  using (auth.uid() = gardener_id);

drop policy if exists "financial_categories_delete_own" on public.financial_categories;
create policy "financial_categories_delete_own"
  on public.financial_categories for delete
  using (auth.uid() = gardener_id);

-- Table: financial_transactions
create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount >= 0),
  transaction_date date not null,
  description text,
  category_id uuid references public.financial_categories(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'paid' check (status in ('paid','pending')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists financial_transactions_gardener_date_idx
  on public.financial_transactions (gardener_id, transaction_date);

alter table public.financial_transactions enable row level security;

drop policy if exists "financial_transactions_select_own" on public.financial_transactions;
create policy "financial_transactions_select_own"
  on public.financial_transactions for select
  using (auth.uid() = gardener_id);

drop policy if exists "financial_transactions_insert_own" on public.financial_transactions;
create policy "financial_transactions_insert_own"
  on public.financial_transactions for insert
  with check (auth.uid() = gardener_id);

drop policy if exists "financial_transactions_update_own" on public.financial_transactions;
create policy "financial_transactions_update_own"
  on public.financial_transactions for update
  using (auth.uid() = gardener_id);

drop policy if exists "financial_transactions_delete_own" on public.financial_transactions;
create policy "financial_transactions_delete_own"
  on public.financial_transactions for delete
  using (auth.uid() = gardener_id);

-- Optional: trigger to update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_financial_transactions on public.financial_transactions;
create trigger set_updated_at_financial_transactions
before update on public.financial_transactions
for each row execute function public.update_updated_at();