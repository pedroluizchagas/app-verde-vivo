alter table if exists public.appointments
  add column if not exists end_date timestamptz;
