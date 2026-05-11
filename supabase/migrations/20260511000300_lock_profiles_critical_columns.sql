-- Hardening de public.profiles: trigger BEFORE UPDATE que preserva colunas
-- administrativas quando o caller nao e service-role.
--
-- Motivacao (risco residual identificado na Fase 01):
-- A policy de UPDATE em profiles e (auth.uid() = id). Sem hardening de coluna,
-- um usuario autenticado pode chamar via Supabase JS no cliente:
--     update profiles set plan = 'plus' where id = auth.uid();
-- e bypassar todo o gating de plano. O webhook (service-role) precisa
-- continuar conseguindo gravar essas colunas.
--
-- Colunas administrativas preservadas (inferidas das migracoes legacy
-- 001, 023, 026, 027):
--   - plan                  → fonte da verdade do plano (webhook escreve)
--   - trial_ends_at         → janela de teste (callback/trigger escreve)
--   - stripe_customer_id    → identidade no Stripe (checkout/webhook)
--   - asaas_customer_id     → legacy do provedor anterior
--   - role                  → tipo do usuario (gardener|client)
--   - created_at            → timestamp imutavel
--   - id                    → PK (ja imutavel pela tipagem)
--
-- O webhook do Stripe, o auth/callback e o cron de reconciliacao rodam
-- com a chave service-role; nesses casos `auth.role() = 'service_role'`
-- e o trigger libera a escrita.

create or replace function public.preserve_profile_admin_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service-role pode tudo (webhooks, jobs, callback de auth)
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Preserva colunas administrativas: mantem o valor antigo independente
  -- do que vier no UPDATE.
  new.plan := old.plan;
  new.trial_ends_at := old.trial_ends_at;
  new.stripe_customer_id := old.stripe_customer_id;
  new.asaas_customer_id := old.asaas_customer_id;
  new.role := old.role;
  new.created_at := old.created_at;
  -- id e PK, nao deve ser tocado.
  new.id := old.id;
  return new;
end;
$$;

drop trigger if exists trg_preserve_profile_admin_columns on public.profiles;
create trigger trg_preserve_profile_admin_columns
  before update on public.profiles
  for each row execute function public.preserve_profile_admin_columns();

-- DOWN:
-- drop trigger if exists trg_preserve_profile_admin_columns on public.profiles;
-- drop function if exists public.preserve_profile_admin_columns();
