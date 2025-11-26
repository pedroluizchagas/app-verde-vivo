alter table if exists public.service_order_items
  add column if not exists unit text;