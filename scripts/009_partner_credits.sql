-- Table to track partner commissions/credits from floriculturas or suppliers
create table if not exists public.partner_credits (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null,
  partner_name text not null,
  credit_amount numeric(12,2) not null,
  credit_type text not null check (credit_type in ('cash','insumos')),
  percentage numeric(5,2),
  movement_id uuid references public.product_movements(id) on delete set null,
  description text,
  redeemed_amount numeric(12,2) default 0,
  status text not null default 'available' check (status in ('available','partial','redeemed')),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.partner_credits enable row level security;

-- Policies: owner can do all
create policy partner_credits_owner_all on public.partner_credits
  for all using (auth.uid() = gardener_id) with check (auth.uid() = gardener_id);