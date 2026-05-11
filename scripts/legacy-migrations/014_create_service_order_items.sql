create extension if not exists "pgcrypto";

create table if not exists public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists service_order_items_order_idx on public.service_order_items (order_id);

alter table public.service_order_items enable row level security;

drop policy if exists "service_order_items_select_owner" on public.service_order_items;
create policy "service_order_items_select_owner" on public.service_order_items for select using (
  auth.uid() = (select gardener_id from public.service_orders where id = order_id)
);

drop policy if exists "service_order_items_insert_owner" on public.service_order_items;
create policy "service_order_items_insert_owner" on public.service_order_items for insert with check (
  auth.uid() = (select gardener_id from public.service_orders where id = order_id)
);

drop policy if exists "service_order_items_update_owner" on public.service_order_items;
create policy "service_order_items_update_owner" on public.service_order_items for update using (
  auth.uid() = (select gardener_id from public.service_orders where id = order_id)
);

drop policy if exists "service_order_items_delete_owner" on public.service_order_items;
create policy "service_order_items_delete_owner" on public.service_order_items for delete using (
  auth.uid() = (select gardener_id from public.service_orders where id = order_id)
);

create or replace function public.update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_service_order_items on public.service_order_items;
create trigger set_updated_at_service_order_items before update on public.service_order_items for each row execute function public.update_updated_at();