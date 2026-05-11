-- User preferences: credit card due day and defaults
create table if not exists public.user_preferences (
  gardener_id uuid primary key,
  credit_card_due_day smallint check (credit_card_due_day between 1 and 31),
  default_pending_days smallint default 7 check (default_pending_days >= 0),
  default_product_margin_pct numeric(5,2) default 0 check (default_product_margin_pct >= 0),
  updated_at timestamp with time zone default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists user_preferences_owner_all on public.user_preferences;
create policy user_preferences_owner_all on public.user_preferences
  for all using (auth.uid() = gardener_id) with check (auth.uid() = gardener_id);

-- Ensure column exists for existing installations
alter table if exists public.user_preferences
  add column if not exists default_product_margin_pct numeric(5,2) default 0 check (default_product_margin_pct >= 0);