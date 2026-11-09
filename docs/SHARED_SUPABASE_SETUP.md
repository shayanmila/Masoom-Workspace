# Masoom Workspace + Easy Authenticator — shared Supabase project

Project: `uuvqawlqcnrcdribwava`. Existing Easy Authenticator `public.encrypted_vaults` is unchanged.

## Completed by project owner
- Workspace migration executed successfully (reported).
- Schema USAGE verified: anon=false, authenticated=false, service_role=true.
- Easy Authenticator vault RLS remained enabled.
- Nine Workspace table RLS values have **not yet been shared**.

## Required before administrator sign-in
1. Run first SELECT from `02_verify_after_install.sql` separately; confirm nine tables and RLS=true.
2. Review `03_verify_and_owner_bootstrap_README.md`, then run `03_owner_bootstrap_TEMPLATE.sql` only after replacing the placeholder with the correct dedicated/approved auth.users UUID.
3. Configure `WORKSPACE_DATABASE_URL` in the server environment using a database connection URI with appropriate restricted database privileges. The current starter uses direct PostgreSQL and does NOT require exposing the Workspace schema via PostgREST. Avoid using an unrestricted database owner account in production; implement a dedicated DB role before deployment.
4. Configure public Supabase URL and anon/publishable key in web env. Do not commit credentials.
5. Run manual build validation; test unauthorized Easy Authenticator users, approved owner, non-admin, cross-company access.

## Architecture
- Frontend uses shared Supabase Auth only for sign-in.
- Server verifies bearer token with Supabase Auth `getUser`.
- Server connects directly to PostgreSQL, checks `masoom_workspace.approved_users` and company membership.
- Server returns tenant-scoped records. No schema API exposure required.
- Admin team creation is parameterized and requires owner/admin role.
- Invitations are intentionally disabled pending additional validation.
- Billing and Windows monitoring remain disabled.

## Legacy warning
Do not apply `packages/database/migrations/0001_foundation.sql` or `0002_private_setup.sql` to this shared project.
