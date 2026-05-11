-- Add trial_ends_at to profiles table (required for trial period feature)
alter table public.profiles
  add column if not exists trial_ends_at timestamptz;

-- Backfill: existing users without plan and without trial get 7 days from now
update public.profiles
set trial_ends_at = now() + interval '7 days'
where trial_ends_at is null
  and plan is null;

-- Update trigger so every new user gets trial_ends_at set automatically on signup
-- This ensures mobile users (who bypass the web auth/callback) also get their trial
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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
