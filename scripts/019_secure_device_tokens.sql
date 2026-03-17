-- Harden device_tokens with RLS and least-privilege access
-- Remediation for:
-- - rls_disabled_in_public
-- - sensitive_columns_exposed
-- This script is idempotent and safe to run multiple times.

-- 1) Enable RLS
alter table if exists public.device_tokens enable row level security;

-- 2) Ensure authenticated role has base privileges (RLS will still gate access)
grant select, insert, update, delete on table public.device_tokens to authenticated;
revoke all on table public.device_tokens from anon;

-- 3) Policies (owner-only)
do $$
begin
  -- SELECT
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'device_tokens'
      and policyname = 'device_tokens_select_owner'
  ) then
    create policy device_tokens_select_owner
      on public.device_tokens
      for select
      to authenticated
      using (gardener_id = auth.uid());
  end if;

  -- INSERT
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'device_tokens'
      and policyname = 'device_tokens_insert_owner'
  ) then
    create policy device_tokens_insert_owner
      on public.device_tokens
      for insert
      to authenticated
      with check (gardener_id = auth.uid());
  end if;

  -- UPDATE
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'device_tokens'
      and policyname = 'device_tokens_update_owner'
  ) then
    create policy device_tokens_update_owner
      on public.device_tokens
      for update
      to authenticated
      using (gardener_id = auth.uid())
      with check (gardener_id = auth.uid());
  end if;

  -- DELETE
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'device_tokens'
      and policyname = 'device_tokens_delete_owner'
  ) then
    create policy device_tokens_delete_owner
      on public.device_tokens
      for delete
      to authenticated
      using (gardener_id = auth.uid());
  end if;
end;
$$;

-- 4) Optional: keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists device_tokens_set_updated_at on public.device_tokens;
create trigger device_tokens_set_updated_at
before update on public.device_tokens
for each row execute function public.set_updated_at();

-- Notes:
-- - Upserts from clients must include gardener_id = auth.uid().
-- - If a token exists for another user, the update will be denied, preventing hijack.

