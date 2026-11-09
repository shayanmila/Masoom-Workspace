-- READ ONLY. Run in the existing Easy Authenticator Supabase SQL editor.
-- Lists schema/table names only. Does not read user records or change anything.
select n.nspname as schema_name, c.relname as table_name, c.relkind as object_kind,
       c.relrowsecurity as row_security_enabled
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname not in ('pg_catalog','information_schema','pg_toast')
  and c.relkind in ('r','p','v','m')
order by n.nspname, c.relname;
-- Check for namespace collision before any proposed installation.
select exists(select 1 from pg_catalog.pg_namespace where nspname = 'masoom_workspace') as workspace_schema_already_exists;
-- Check existing public objects with the names used by old, UNSAFE shared-project migrations.
select table_schema,table_name from information_schema.tables
where table_schema='public' and table_name in
('companies','memberships','teams','team_members','tasks','chat_messages','activity_sessions','company_plans')
order by table_name;
