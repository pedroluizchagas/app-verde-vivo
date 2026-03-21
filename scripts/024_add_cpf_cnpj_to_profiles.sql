-- Add cpf_cnpj column to profiles (required by Asaas to create charges)
alter table public.profiles
  add column if not exists cpf_cnpj text;
