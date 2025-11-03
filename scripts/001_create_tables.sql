-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('gardener', 'client')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Clients table (customers of the gardening business)
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  gardener_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text not null,
  address text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

create policy "clients_select_own"
  on public.clients for select
  using (auth.uid() = gardener_id);

create policy "clients_insert_own"
  on public.clients for insert
  with check (auth.uid() = gardener_id);

create policy "clients_update_own"
  on public.clients for update
  using (auth.uid() = gardener_id);

create policy "clients_delete_own"
  on public.clients for delete
  using (auth.uid() = gardener_id);

-- Services table (types of services offered)
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  gardener_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  default_price decimal(10,2),
  created_at timestamptz default now()
);

alter table public.services enable row level security;

create policy "services_select_own"
  on public.services for select
  using (auth.uid() = gardener_id);

create policy "services_insert_own"
  on public.services for insert
  with check (auth.uid() = gardener_id);

create policy "services_update_own"
  on public.services for update
  using (auth.uid() = gardener_id);

create policy "services_delete_own"
  on public.services for delete
  using (auth.uid() = gardener_id);

-- Appointments table (scheduled services)
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  gardener_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  description text,
  scheduled_date timestamptz not null,
  duration_minutes integer default 60,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.appointments enable row level security;

create policy "appointments_select_own"
  on public.appointments for select
  using (auth.uid() = gardener_id);

create policy "appointments_insert_own"
  on public.appointments for insert
  with check (auth.uid() = gardener_id);

create policy "appointments_update_own"
  on public.appointments for update
  using (auth.uid() = gardener_id);

create policy "appointments_delete_own"
  on public.appointments for delete
  using (auth.uid() = gardener_id);

-- Budgets table (quotes/estimates)
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  gardener_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text,
  total_amount decimal(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.budgets enable row level security;

create policy "budgets_select_own"
  on public.budgets for select
  using (auth.uid() = gardener_id);

create policy "budgets_insert_own"
  on public.budgets for insert
  with check (auth.uid() = gardener_id);

create policy "budgets_update_own"
  on public.budgets for update
  using (auth.uid() = gardener_id);

create policy "budgets_delete_own"
  on public.budgets for delete
  using (auth.uid() = gardener_id);

-- Photos table (before/after images)
create table if not exists public.photos (
  id uuid primary key default uuid_generate_v4(),
  gardener_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  url text not null,
  type text not null check (type in ('before', 'after', 'general')),
  caption text,
  created_at timestamptz default now()
);

alter table public.photos enable row level security;

create policy "photos_select_own"
  on public.photos for select
  using (auth.uid() = gardener_id);

create policy "photos_insert_own"
  on public.photos for insert
  with check (auth.uid() = gardener_id);

create policy "photos_delete_own"
  on public.photos for delete
  using (auth.uid() = gardener_id);
