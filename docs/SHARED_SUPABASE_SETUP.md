# Shared Supabase project: Easy Authenticator + Masoom Workspace

Target Supabase project: `uuvqawlqcnrcdribwava`.

## STOP: no SQL has been applied
Easy Authenticator is the existing production app. Its authentication, encryption, sync tables and settings must remain unchanged. Never run `packages/database/migrations/0001_foundation.sql` or `0002_private_setup.sql` in this shared project: those are legacy standalone-project prototypes that create public tables and permit arbitrary authenticated users to create companies.

## Safe review order
1. Take a database backup/snapshot through your existing maintenance procedure.
2. Run only `packages/database/shared-project/00_read_only_inspection.sql` in Supabase SQL Editor.
3. Review its output for namespace conflicts and share *table names only*, not account data, secrets or tokens.
4. After inspection and approval, review `01_workspace_schema_REVIEW_ONLY.sql` for schema and privilege compatibility. It has not been applied.
5. Add a single explicitly approved workspace owner user ID to `masoom_workspace.approved_users` using a separate administrator-only onboarding operation (not implemented yet).
6. Implement server-side service-role access with strict token validation, per-company membership authorization and separate workspace-specific invitations. Never invite an existing Easy Authenticator user into a workspace automatically.
7. Run cross-app and cross-company access tests before enabling the web app.

## Authentication warning
Both applications share `auth.users`, Auth provider configuration, email templates and rate limits. Separate database schemas do not isolate Auth. Do not enable public sign-up, change email settings or modify Auth hooks on behalf of Workspace. A workspace membership and explicit approval are required in addition to valid Supabase credentials.

## Current frontend safety
The Phase 1 web UI's earlier public-schema RPC and table calls are incompatible with shared-project mode. Shared mode is now blocked by a configuration gate until the new server-only workspace endpoints have been built and security-tested. Invitations are disabled in shared mode.

## Future SaaS
Billing is disabled by a database check constraint. Paid plans and public registration are out of scope.
