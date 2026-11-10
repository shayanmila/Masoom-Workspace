-- Masoom Workspace: invitation staging (local-testing only).
-- Review against existing company/membership schema before executing.
-- Do not run this migration against production without approval.
begin;
create table if not exists masoom_workspace.invitations (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references masoom_workspace.companies(id) on delete cascade,
 email text not null,
 role text not null check (role in ('admin','member')),
 token_hash text not null unique,
 invited_by uuid not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '7 days'),
 accepted_at timestamptz,
 revoked_at timestamptz,
 constraint invitation_email_format check (length(email) between 3 and 254 and email = lower(btrim(email)) and position('@' in email)>1)
);
create unique index if not exists workspace_one_active_invitation
 on masoom_workspace.invitations(company_id,email)
 where accepted_at is null and revoked_at is null;
create index if not exists workspace_invitation_expiry on masoom_workspace.invitations(expires_at);
alter table masoom_workspace.invitations enable row level security;
revoke all on masoom_workspace.invitations from anon,authenticated;
-- Server database role must be explicitly granted required privileges separately.
commit;
