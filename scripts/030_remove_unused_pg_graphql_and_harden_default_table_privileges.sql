-- Final hardening for Supabase Security Advisor findings.
-- Fixes:
-- - pg_graphql_authenticated_table_exposed
-- - pg_graphql_anon_table_exposed
--
-- The application uses Supabase REST/RPC clients and does not rely on
-- the /graphql/v1 endpoint. Removing the extension is the cleanest way to
-- eliminate schema exposure warnings for both anon and authenticated roles.
drop extension if exists pg_graphql;
--
-- Keep future tables private by default. New relations created in schema
-- public will require explicit GRANT statements instead of inheriting broad
-- access for API-facing roles.
alter default privileges in schema public revoke all on tables from anon, authenticated;
--
-- Defensive fallback: if pg_graphql is re-enabled later, the currently
-- sensitive application tables should still not be introspectable by API
-- roles unless a future migration grants access intentionally.
do $$
declare
  table_name text;
  protected_tables text[] := array[
    'appointments',
    'budgets',
    'clients',
    'device_tokens',
    'equipment',
    'financial_categories',
    'financial_transactions',
    'maintenance_plans',
    'notes',
    'partner_credits',
    'photos',
    'plan_executions',
    'product_movements',
    'products',
    'profiles',
    'service_order_items',
    'service_orders',
    'services',
    'subscriptions',
    'tasks',
    'user_preferences'
  ];
begin
  foreach table_name in array protected_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('revoke all on table public.%I from anon', table_name);
    end if;
  end loop;
end;
$$;
