create extension if not exists "pgcrypto";

create table if not exists public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  default_description text,
  default_labor_cost numeric(12,2) not null default 0,
  materials_markup_pct numeric(5,2) not null default 0,
  preferred_weekday integer check (preferred_weekday between 0 and 6),
  preferred_week_of_month integer check (preferred_week_of_month between 1 and 4),
  window_days integer not null default 7,
  billing_day integer check (billing_day between 1 and 31),
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (gardener_id, client_id, title)
);

create table if not exists public.plan_executions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.maintenance_plans(id) on delete cascade,
  cycle text not null,
  task_id uuid references public.tasks(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  transaction_id uuid references public.financial_transactions(id) on delete set null,
  status text not null default 'open' check (status in ('open','done','skipped')),
  final_amount numeric(12,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (plan_id, cycle)
);

alter table public.maintenance_plans enable row level security;
alter table public.plan_executions enable row level security;

drop policy if exists "maintenance_plans_select_own" on public.maintenance_plans;
create policy "maintenance_plans_select_own" on public.maintenance_plans for select using (auth.uid() = gardener_id);
drop policy if exists "maintenance_plans_insert_own" on public.maintenance_plans;
create policy "maintenance_plans_insert_own" on public.maintenance_plans for insert with check (auth.uid() = gardener_id);
drop policy if exists "maintenance_plans_update_own" on public.maintenance_plans;
create policy "maintenance_plans_update_own" on public.maintenance_plans for update using (auth.uid() = gardener_id);
drop policy if exists "maintenance_plans_delete_own" on public.maintenance_plans;
create policy "maintenance_plans_delete_own" on public.maintenance_plans for delete using (auth.uid() = gardener_id);

drop policy if exists "plan_executions_select_own" on public.plan_executions;
create policy "plan_executions_select_own" on public.plan_executions for select using (
  auth.uid() = (select gardener_id from public.maintenance_plans where id = plan_id)
);
drop policy if exists "plan_executions_insert_own" on public.plan_executions;
create policy "plan_executions_insert_own" on public.plan_executions for insert with check (
  auth.uid() = (select gardener_id from public.maintenance_plans where id = plan_id)
);
drop policy if exists "plan_executions_update_own" on public.plan_executions;
create policy "plan_executions_update_own" on public.plan_executions for update using (
  auth.uid() = (select gardener_id from public.maintenance_plans where id = plan_id)
);
drop policy if exists "plan_executions_delete_own" on public.plan_executions;
create policy "plan_executions_delete_own" on public.plan_executions for delete using (
  auth.uid() = (select gardener_id from public.maintenance_plans where id = plan_id)
);

create or replace function public.update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_maintenance_plans on public.maintenance_plans;
create trigger set_updated_at_maintenance_plans before update on public.maintenance_plans for each row execute function public.update_updated_at();
drop trigger if exists set_updated_at_plan_executions on public.plan_executions;
create trigger set_updated_at_plan_executions before update on public.plan_executions for each row execute function public.update_updated_at();