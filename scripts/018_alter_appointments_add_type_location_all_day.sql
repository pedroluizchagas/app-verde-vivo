alter table if exists public.appointments
  add column if not exists type text default 'service' check (type in ('service','training','technical_visit','meeting','other')),
  add column if not exists location text,
  add column if not exists all_day boolean default false;
