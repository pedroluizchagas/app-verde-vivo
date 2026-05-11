-- Inventory module: products, movements, equipment/EPIs

-- Ensure pgcrypto for gen_random_uuid
create extension if not exists "pgcrypto";

-- Table: products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unit text not null default 'un',
  cost numeric(12,2) not null default 0,
  supplier text,
  min_stock numeric(12,3) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (gardener_id, name)
);

alter table public.products enable row level security;

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own"
  on public.products for select
  using (auth.uid() = gardener_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
  on public.products for insert
  with check (auth.uid() = gardener_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
  on public.products for update
  using (auth.uid() = gardener_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
  on public.products for delete
  using (auth.uid() = gardener_id);

-- Table: product_movements (entries/exits)
create table if not exists public.product_movements (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('in','out')),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost numeric(12,2),
  movement_date date not null,
  description text,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists product_movements_product_idx
  on public.product_movements (product_id, movement_date);

alter table public.product_movements enable row level security;

drop policy if exists "product_movements_select_own" on public.product_movements;
create policy "product_movements_select_own"
  on public.product_movements for select
  using (auth.uid() = gardener_id);

drop policy if exists "product_movements_insert_own" on public.product_movements;
create policy "product_movements_insert_own"
  on public.product_movements for insert
  with check (auth.uid() = gardener_id);

drop policy if exists "product_movements_update_own" on public.product_movements;
create policy "product_movements_update_own"
  on public.product_movements for update
  using (auth.uid() = gardener_id);

drop policy if exists "product_movements_delete_own" on public.product_movements;
create policy "product_movements_delete_own"
  on public.product_movements for delete
  using (auth.uid() = gardener_id);

-- Table: equipment (tools/EPIs inventory)
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  type text not null check (type in ('tool','epi')),
  quantity integer not null default 1 check (quantity >= 0),
  status text not null default 'available' check (status in ('available','in_use','maintenance','lost')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (gardener_id, name, type)
);

alter table public.equipment enable row level security;

drop policy if exists "equipment_select_own" on public.equipment;
create policy "equipment_select_own"
  on public.equipment for select
  using (auth.uid() = gardener_id);

drop policy if exists "equipment_insert_own" on public.equipment;
create policy "equipment_insert_own"
  on public.equipment for insert
  with check (auth.uid() = gardener_id);

drop policy if exists "equipment_update_own" on public.equipment;
create policy "equipment_update_own"
  on public.equipment for update
  using (auth.uid() = gardener_id);

drop policy if exists "equipment_delete_own" on public.equipment;
create policy "equipment_delete_own"
  on public.equipment for delete
  using (auth.uid() = gardener_id);

-- Updated at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_products on public.products;
create trigger set_updated_at_products
before update on public.products
for each row execute function public.update_updated_at();

drop trigger if exists set_updated_at_product_movements on public.product_movements;
create trigger set_updated_at_product_movements
before update on public.product_movements
for each row execute function public.update_updated_at();

drop trigger if exists set_updated_at_equipment on public.equipment;
create trigger set_updated_at_equipment
before update on public.equipment
for each row execute function public.update_updated_at();