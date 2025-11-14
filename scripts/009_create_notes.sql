create extension if not exists "pgcrypto";

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  organized_content text,
  importance text not null default 'medium' check (importance in ('low','medium','high')),
  tags text[],
  client_id uuid references public.clients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists notes_gardener_created_idx on public.notes (gardener_id, created_at desc);

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (auth.uid() = gardener_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = gardener_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes for update using (auth.uid() = gardener_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = gardener_id);

create or replace function public.update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_notes on public.notes;
create trigger set_updated_at_notes before update on public.notes for each row execute function public.update_updated_at();