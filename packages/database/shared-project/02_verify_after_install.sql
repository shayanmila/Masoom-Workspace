-- READ ONLY. Run after migration 01 to verify isolation.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='masoom_workspace' and c.relkind='r'
order by c.relname;
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema='masoom_workspace' and grantee in ('anon','authenticated','service_role')
order by grantee,privilege_type;
select has_schema_privilege('anon','masoom_workspace','USAGE') as anon_schema_access,
       has_schema_privilege('authenticated','masoom_workspace','USAGE') as authenticated_schema_access,
       has_schema_privilege('service_role','masoom_workspace','USAGE') as service_schema_access;
-- Existing vault RLS should remain enabled.
select relrowsecurity as encrypted_vaults_rls_enabled
from pg_class where oid='public.encrypted_vaults'::regclass;
