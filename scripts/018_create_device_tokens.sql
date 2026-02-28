create table if not exists public.device_tokens (
  id bigserial primary key,
  gardener_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  provider text,
  platform text,
  device_id text,
  last_seen timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists device_tokens_token_unique on public.device_tokens (token);
create index if not exists device_tokens_gardener_idx on public.device_tokens (gardener_id);
