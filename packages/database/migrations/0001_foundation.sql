-- Phase 1 schema. Apply in a private Supabase project after review.
create extension if not exists pgcrypto;
create type public.workspace_role as enum ('owner','admin','manager','employee');
create table public.companies (id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 120), created_at timestamptz not null default now());
create table public.memberships (company_id uuid not null references public.companies(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role public.workspace_role not null default 'employee', joined_at timestamptz not null default now(), primary key(company_id,user_id));
create table public.teams (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, name text not null check(length(name) between 1 and 100), created_at timestamptz not null default now(), unique(id,company_id));
create table public.team_members (company_id uuid not null, team_id uuid not null, user_id uuid not null, primary key(team_id,user_id), foreign key(team_id,company_id) references public.teams(id,company_id) on delete cascade, foreign key(company_id,user_id) references public.memberships(company_id,user_id) on delete cascade);
create table public.tasks (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, title text not null, status text not null default 'todo' check(status in ('todo','doing','done')), assignee_id uuid, created_at timestamptz not null default now(), foreign key(company_id,assignee_id) references public.memberships(company_id,user_id));
create table public.chat_messages (id uuid primary key default gen_random_uuid(), company_id uuid not null, team_id uuid not null, sender_id uuid not null, body text not null check(length(body) between 1 and 10000), created_at timestamptz not null default now(), foreign key(team_id,company_id) references public.teams(id,company_id) on delete cascade, foreign key(company_id,sender_id) references public.memberships(company_id,user_id));
create table public.activity_sessions (id uuid primary key default gen_random_uuid(), company_id uuid not null, user_id uuid not null, started_at timestamptz not null, ended_at timestamptz, active_seconds integer not null default 0 check(active_seconds >= 0), idle_seconds integer not null default 0 check(idle_seconds >= 0), foreign key(company_id,user_id) references public.memberships(company_id,user_id), check(ended_at is null or ended_at >= started_at));
-- Future subscription support only. No payment integration or billing triggers.
create table public.company_plans (company_id uuid primary key references public.companies(id) on delete cascade, plan_code text not null default 'private', seat_limit integer, billing_enabled boolean not null default false check(billing_enabled = false), created_at timestamptz not null default now());

create function public.is_member(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.memberships m where m.company_id = cid and m.user_id = (select auth.uid())) $$;
create function public.is_admin(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.memberships m where m.company_id = cid and m.user_id = (select auth.uid()) and m.role in ('owner','admin')) $$;
create function public.in_team(cid uuid, tid uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.team_members tm where tm.company_id = cid and tm.team_id = tid and tm.user_id = (select auth.uid())) $$;
revoke all on function public.is_member(uuid), public.is_admin(uuid), public.in_team(uuid,uuid) from public;
grant execute on function public.is_member(uuid), public.is_admin(uuid), public.in_team(uuid,uuid) to authenticated;

alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.chat_messages enable row level security;
alter table public.activity_sessions enable row level security;
alter table public.company_plans enable row level security;

create policy companies_read on public.companies for select to authenticated using(public.is_member(id));
create policy memberships_read on public.memberships for select to authenticated using(public.is_member(company_id));
create policy teams_read on public.teams for select to authenticated using(public.is_member(company_id));
create policy team_members_read on public.team_members for select to authenticated using(public.is_member(company_id));
create policy tasks_read on public.tasks for select to authenticated using(public.is_member(company_id));
create policy messages_read on public.chat_messages for select to authenticated using(public.in_team(company_id,team_id));
create policy activity_read on public.activity_sessions for select to authenticated using(user_id=(select auth.uid()) or public.is_admin(company_id));
create policy plans_read on public.company_plans for select to authenticated using(public.is_admin(company_id));
-- Deliberately no direct INSERT/UPDATE/DELETE policies yet: implement server-validated write paths and test before enabling mutations.
