-- Add kind column to financial_categories to distinguish expense vs income
alter table if exists public.financial_categories
  add column if not exists kind text check (kind in ('expense','income'));