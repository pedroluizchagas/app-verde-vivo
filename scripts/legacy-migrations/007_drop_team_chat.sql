-- Rollback: drop Team and Chat modules (if they exist)

-- Drop policies added to appointments and clients
drop policy if exists "appointments_select_assigned_team" on public.appointments;
drop policy if exists "clients_select_assigned_team" on public.clients;

-- Drop triggers related to team and internal notes
drop trigger if exists set_updated_at_team_members on public.team_members;
drop trigger if exists set_updated_at_team_schedules on public.team_schedules;
drop trigger if exists set_updated_at_internal_notes on public.internal_notes;

-- Drop chat tables
drop table if exists public.service_messages cascade;
drop table if exists public.general_messages cascade;

-- Drop notes
drop table if exists public.internal_notes cascade;

-- Drop team tables
drop table if exists public.performance_reviews cascade;
drop table if exists public.work_hours cascade;
drop table if exists public.service_assignments cascade;
drop table if exists public.team_schedules cascade;
drop table if exists public.team_members cascade;

-- Note: keep update_updated_at() function since it's used elsewhere.