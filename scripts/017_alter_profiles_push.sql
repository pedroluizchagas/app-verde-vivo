alter table if exists public.profiles
  add column if not exists push_token text,
  add column if not exists push_provider text;
