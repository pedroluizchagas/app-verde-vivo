alter table if exists public.profiles
  add column if not exists company_name text,
  add column if not exists watermark_base64 text;