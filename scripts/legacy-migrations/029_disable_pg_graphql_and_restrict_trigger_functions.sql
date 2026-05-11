-- Follow-up hardening for remaining Supabase Security Advisor warnings.
-- Fixes:
-- - pg_graphql_authenticated_table_exposed
-- - anon_security_definer_function_executable

-- The application uses the REST API from Supabase and does not rely on the
-- /graphql/v1 endpoint, so blocking the resolver is the safest fix.
do $$
declare
  graphql_resolve record;
begin
  for graphql_resolve in
    select pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'graphql'
      and p.proname = 'resolve'
  loop
    execute format(
      'revoke all on function graphql.resolve(%s) from anon, authenticated',
      graphql_resolve.identity_args
    );
  end loop;
end;
$$;

-- Lock down the signup trigger helper. Trigger execution still works after
-- revoking EXECUTE from API roles because it is invoked by the trigger itself.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role, trial_ends_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'User'),
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'gardener'),
    now() + interval '7 days'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
