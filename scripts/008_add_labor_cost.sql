-- Add labor_cost column to appointments
alter table if exists public.appointments
  add column if not exists labor_cost numeric(12,2) default 0;