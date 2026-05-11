-- Fase 01: permitir que o próprio usuário gerencie suas assinaturas via RLS,
-- removendo a necessidade de service-role nas rotas de checkout/verify-payment/reopen-payment.
--
-- Contexto: a tabela public.subscriptions tinha apenas a policy de SELECT
-- (`subscriptions_select_own`). INSERTs e UPDATEs eram feitos exclusivamente
-- via service-role, anulando o benefício de RLS e ampliando o blast radius
-- de qualquer rota autenticada.
--
-- Esta migração adiciona policies de INSERT/UPDATE/DELETE restritas ao
-- próprio usuário (auth.uid() = user_id). O webhook do Stripe e o callback
-- de auth continuam usando service-role (operações administrativas), agora
-- explicitamente comentadas no código como uso justificado.
--
-- Risco: o usuário passa a poder modificar registros da própria assinatura
-- (ex.: status='active'). Mitigação: o middleware/gating de plano olha
-- `profiles.plan` (mantido) e a fonte da verdade do estado da assinatura
-- continua sendo o webhook Stripe, que sobrescreve via service-role.
-- Fase 02/03 endurecerá colunas críticas com triggers/policies WITH CHECK
-- mais finas.

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own"
  on public.subscriptions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "subscriptions_delete_own" on public.subscriptions;
create policy "subscriptions_delete_own"
  on public.subscriptions for delete
  using ((select auth.uid()) = user_id);

-- DOWN:
-- drop policy if exists "subscriptions_insert_own" on public.subscriptions;
-- drop policy if exists "subscriptions_update_own" on public.subscriptions;
-- drop policy if exists "subscriptions_delete_own" on public.subscriptions;
