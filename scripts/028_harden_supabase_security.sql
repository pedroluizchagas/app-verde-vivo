-- Harden Supabase database objects flagged by Security Advisor.
-- Fixes:
-- - function_search_path_mutable
-- - pg_graphql_anon_table_exposed

-- Pin trigger helper functions to an empty search_path so they do not
-- inherit role/session settings.
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Hide operational tables from unauthenticated GraphQL introspection.
-- Authenticated access continues to be enforced by RLS policies.
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

-- Prevent future public tables created by the same database role from
-- automatically exposing metadata to anon.
alter default privileges in schema public revoke all on tables from anon;
