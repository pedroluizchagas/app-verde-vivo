-- Permite que um push token seja reutilizado por outro usuario no mesmo dispositivo.
-- O indice unico continua em (token), mas adicionamos uma funcao que apaga o
-- registro antigo antes do insert, evitando o conflito de RLS no UPDATE.

-- Muda o indice unico para (gardener_id, token) para permitir que o mesmo token
-- aponte para apenas um gardener de cada vez sem depender do UPDATE com RLS.

-- Estrategia: drop index atual, recria com (gardener_id, token), e ajusta
-- a funcao de upsert para que o cliente use onConflict="gardener_id,token".
-- Tokens orfaos (de outros gardeners) sao limpos por um trigger BEFORE INSERT.

-- 1) Remove indice unico antigo (so token)
drop index if exists public.device_tokens_token_unique;

-- 2) Cria indice unico composto (gardener_id, token)
create unique index if not exists device_tokens_gardener_token_unique
  on public.device_tokens (gardener_id, token);

-- 3) Trigger que remove tokens duplicados de outros gardeners antes do insert
create or replace function public.device_tokens_claim_token()
returns trigger language plpgsql security definer as $$
begin
  -- Remove entradas do mesmo token para qualquer outro gardener
  delete from public.device_tokens
  where token = new.token
    and gardener_id <> new.gardener_id;
  return new;
end;
$$;

drop trigger if exists device_tokens_claim_before_insert on public.device_tokens;
create trigger device_tokens_claim_before_insert
  before insert on public.device_tokens
  for each row execute function public.device_tokens_claim_token();
