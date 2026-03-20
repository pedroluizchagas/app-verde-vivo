alter table if exists public.profiles
  add column if not exists company_subtitle text,
  add column if not exists watermark_fit text default 'contain';
