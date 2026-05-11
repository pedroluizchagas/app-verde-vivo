-- Auditoria de RLS em tabelas de dominio.
--
-- Garante que toda tabela owner-scoped tem:
--   1. row level security habilitada;
--   2. policies SELECT/INSERT/UPDATE/DELETE com auth.uid() = <coluna_dono>.
--
-- Migracao idempotente: usa do $$ ... $$ com pg_policies para nao tentar
-- recriar policy existente. As policies criadas pelo legacy
-- 031_optimize_rls_auth_initplan.sql e 033_subscriptions_owner_policies.sql
-- sao preservadas; este bloco so adiciona o que estiver faltando.
--
-- Status esperado antes/depois esta documentado no PR (ver corpo).

do $$
declare
  rec record;
  -- Tabelas owner = gardener_id
  tabelas_gardener text[] := array[
    'clients',
    'services',
    'appointments',
    'budgets',
    'photos',
    'financial_categories',
    'financial_transactions',
    'products',
    'product_movements',
    'equipment',
    'notes',
    'tasks',
    'maintenance_plans',
    'service_orders',
    'user_preferences',
    'partner_credits',
    'device_tokens'
  ];
  tbl text;
  policy_select text;
  policy_insert text;
  policy_update text;
  policy_delete text;
begin
  foreach tbl in array tabelas_gardener loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', tbl);

    policy_select := tbl || '_select_own';
    policy_insert := tbl || '_insert_own';
    policy_update := tbl || '_update_own';
    policy_delete := tbl || '_delete_own';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tbl
        and (cmd = 'SELECT' or cmd = 'ALL')
    ) then
      execute format(
        'create policy %I on public.%I for select using ((select auth.uid()) = gardener_id)',
        policy_select, tbl
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tbl
        and (cmd = 'INSERT' or cmd = 'ALL')
    ) then
      execute format(
        'create policy %I on public.%I for insert with check ((select auth.uid()) = gardener_id)',
        policy_insert, tbl
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tbl
        and (cmd = 'UPDATE' or cmd = 'ALL')
    ) then
      execute format(
        'create policy %I on public.%I for update using ((select auth.uid()) = gardener_id) with check ((select auth.uid()) = gardener_id)',
        policy_update, tbl
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tbl
        and (cmd = 'DELETE' or cmd = 'ALL')
    ) then
      execute format(
        'create policy %I on public.%I for delete using ((select auth.uid()) = gardener_id)',
        policy_delete, tbl
      );
    end if;
  end loop;

  -- profiles: dono = id (= auth.uid()). Sem policy de DELETE: cascade vem
  -- de auth.users via FK. INSERT do cliente bloqueado por trigger handle_new_user.
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';

    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='profiles' and (cmd='SELECT' or cmd='ALL')
    ) then
      create policy "profiles_select_own"
        on public.profiles for select
        using ((select auth.uid()) = id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='profiles' and (cmd='INSERT' or cmd='ALL')
    ) then
      create policy "profiles_insert_own"
        on public.profiles for insert
        with check ((select auth.uid()) = id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='profiles' and (cmd='UPDATE' or cmd='ALL')
    ) then
      create policy "profiles_update_own"
        on public.profiles for update
        using ((select auth.uid()) = id);
    end if;
  end if;

  -- subscriptions: dono = user_id. Coberto por 033_subscriptions_owner_policies.sql.
  if to_regclass('public.subscriptions') is not null then
    execute 'alter table public.subscriptions enable row level security';

    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and (cmd='SELECT' or cmd='ALL')
    ) then
      create policy "subscriptions_select_own"
        on public.subscriptions for select
        using ((select auth.uid()) = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and (cmd='INSERT' or cmd='ALL')
    ) then
      create policy "subscriptions_insert_own"
        on public.subscriptions for insert
        with check ((select auth.uid()) = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and (cmd='UPDATE' or cmd='ALL')
    ) then
      create policy "subscriptions_update_own"
        on public.subscriptions for update
        using ((select auth.uid()) = user_id)
        with check ((select auth.uid()) = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and (cmd='DELETE' or cmd='ALL')
    ) then
      create policy "subscriptions_delete_own"
        on public.subscriptions for delete
        using ((select auth.uid()) = user_id);
    end if;
  end if;

  -- plan_executions: ownership indireto via maintenance_plans.gardener_id.
  if to_regclass('public.plan_executions') is not null then
    execute 'alter table public.plan_executions enable row level security';

    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='plan_executions' and (cmd='SELECT' or cmd='ALL')
    ) then
      create policy "plan_executions_select_own"
        on public.plan_executions for select
        using ((select auth.uid()) = (select gardener_id from public.maintenance_plans where id = plan_id));
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='plan_executions' and (cmd='INSERT' or cmd='ALL')
    ) then
      create policy "plan_executions_insert_own"
        on public.plan_executions for insert
        with check ((select auth.uid()) = (select gardener_id from public.maintenance_plans where id = plan_id));
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='plan_executions' and (cmd='UPDATE' or cmd='ALL')
    ) then
      create policy "plan_executions_update_own"
        on public.plan_executions for update
        using ((select auth.uid()) = (select gardener_id from public.maintenance_plans where id = plan_id));
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='plan_executions' and (cmd='DELETE' or cmd='ALL')
    ) then
      create policy "plan_executions_delete_own"
        on public.plan_executions for delete
        using ((select auth.uid()) = (select gardener_id from public.maintenance_plans where id = plan_id));
    end if;
  end if;

  -- service_order_items: ownership indireto via service_orders.gardener_id.
  if to_regclass('public.service_order_items') is not null then
    execute 'alter table public.service_order_items enable row level security';

    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='service_order_items' and (cmd='SELECT' or cmd='ALL')
    ) then
      create policy "service_order_items_select_owner"
        on public.service_order_items for select
        using ((select auth.uid()) = (select gardener_id from public.service_orders where id = order_id));
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='service_order_items' and (cmd='INSERT' or cmd='ALL')
    ) then
      create policy "service_order_items_insert_owner"
        on public.service_order_items for insert
        with check ((select auth.uid()) = (select gardener_id from public.service_orders where id = order_id));
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='service_order_items' and (cmd='UPDATE' or cmd='ALL')
    ) then
      create policy "service_order_items_update_owner"
        on public.service_order_items for update
        using ((select auth.uid()) = (select gardener_id from public.service_orders where id = order_id));
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='service_order_items' and (cmd='DELETE' or cmd='ALL')
    ) then
      create policy "service_order_items_delete_owner"
        on public.service_order_items for delete
        using ((select auth.uid()) = (select gardener_id from public.service_orders where id = order_id));
    end if;
  end if;
end;
$$;

-- Inventario apos esta migracao (verificavel em pg_policies):
--   profiles                  → 3 policies (select/insert/update por id) [legacy 031]
--   subscriptions             → 4 policies (select/insert/update/delete por user_id) [legacy 033]
--   stripe_events             → 0 policies (admin-only via service-role) [Fase 03]
--   clients, services, appointments, budgets, photos, financial_categories,
--   financial_transactions, products, product_movements, equipment, notes,
--   tasks, maintenance_plans, service_orders, partner_credits → 4 cada (gardener_id) [legacy 031]
--   user_preferences          → 1 (FOR ALL) [legacy 031]
--   device_tokens             → 4 (gardener_id, role authenticated) [legacy 019/031]
--   plan_executions           → 4 (indirect via maintenance_plans) [legacy 031]
--   service_order_items       → 4 (indirect via service_orders) [legacy 014/031]
--
-- DOWN: nao reverter automaticamente; remover policies criadas aqui exigiria
-- saber quais ja existiam antes. Use o git log dos arquivos legacy.
