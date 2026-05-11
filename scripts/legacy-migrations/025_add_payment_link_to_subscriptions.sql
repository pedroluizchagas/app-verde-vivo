alter table public.subscriptions
  add column if not exists payment_link text;
