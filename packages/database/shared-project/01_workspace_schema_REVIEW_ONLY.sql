-- Masoom Workspace isolated schema — REVIEW BEFORE EXECUTING.
-- Target: existing Easy Authenticator Supabase project.
-- Preconditions: backup, 00_read_only_inspection.sql reviewed, approval to run.
-- NO modifications to auth.users, public.encrypted_vaults, existing app tables,
-- Supabase Auth settings, realtime publications, or exposed API schemas.
-- Abort rather than reuse any existing workspace namespace.
begin;
do $$
begin
  if exists(select 1 from pg_namespace where nspname = 'masoom_workspace') then
    raise exception 'masoom_workspace already exists; stop and inspect before proceeding';
  end if;
end $$;
create schema masoom_workspace;
revoke all on schema masoom_workspace from public, anon, authenticated;
grant usage on schema masoom_workspace to service_role;

create table masoom_workspace.companies (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 2 and 120),
 created_at timestamptz not null default now()
);
create table masoom_workspace.approved_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 approved_at timestamptz not null default now(),
 note text
);
create table masoom_workspace.memberships (
 company_id uuid not null references masoom_workspace.companies(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','admin','manager','employee')),
 joined_at timestamptz not null default now(),
 primary key(company_id,user_id)
);
create table masoom_workspace.teams (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references masoom_workspace.companies(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 100),
 created_at timestamptz not null default now(),
 unique(id,company_id)
);
create table masoom_workspace.team_members (
 company_id uuid not null,
 team_id uuid not null,
 user_id uuid not null,
 primary key(team_id,user_id),
 foreign key(team_id,company_id) references masoom_workspace.teams(id,company_id) on delete cascade,
 foreign key(company_id,user_id) references masoom_workspace.memberships(company_id,user_id) on delete cascade
);
create table masoom_workspace.tasks (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references masoom_workspace.companies(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 300),
 status text not null default 'todo' check(status in ('todo','doing','done')),
 assignee_id uuid,
 created_at timestamptz not null default now(),
 foreign key(company_id,assignee_id) references masoom_workspace.memberships(company_id,user_id)
);
create table masoom_workspace.chat_messages (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null,
 team_id uuid not null,
 sender_id uuid not null,
 body text not null check(length(body) between 1 and 10000),
 created_at timestamptz not null default now(),
 foreign key(team_id,company_id) references masoom_workspace.teams(id,company_id) on delete cascade,
 foreign key(company_id,sender_id) references masoom_workspace.memberships(company_id,user_id)
);
create table masoom_workspace.activity_sessions (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null,
 user_id uuid not null,
 started_at timestamptz not null,
 ended_at timestamptz,
 active_seconds integer not null default 0 check(active_seconds>=0),
 idle_seconds integer not null default 0 check(idle_seconds>=0),
 foreign key(company_id,user_id) references masoom_workspace.memberships(company_id,user_id),
 check(ended_at is null or ended_at>=started_at)
);
create table masoom_workspace.company_plans (
 company_id uuid primary key references masoom_workspace.companies(id) on delete cascade,
 plan_code text not null default 'private',
 seat_limit integer check(seat_limit is null or seat_limit>0),
 billing_enabled boolean not null default false check(billing_enabled=false)
);

alter table masoom_workspace.companies enable row level security;
alter table masoom_workspace.approved_users enable row level security;
alter table masoom_workspace.memberships enable row level security;
alter table masoom_workspace.teams enable row level security;
alter table masoom_workspace.team_members enable row level security;
alter table masoom_workspace.tasks enable row level security;
alter table masoom_workspace.chat_messages enable row level security;
alter table masoom_workspace.activity_sessions enable row level security;
alter table masoom_workspace.company_plans enable row level security;

revoke all on all tables in schema masoom_workspace from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema masoom_workspace to service_role;
-- Default privileges for future objects created by the SQL editor's postgres role.
alter default privileges for role postgres in schema masoom_workspace
  revoke all on tables from public, anon, authenticated;
-- No API exposure or direct user grants. Server endpoints must verify BOTH
-- auth identity and workspace approval/membership before using service_role.
commit;
