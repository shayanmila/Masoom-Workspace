# Shared Supabase installation — Easy Authenticator stays unchanged

Project: `uuvqawlqcnrcdribwava`.

## Inspection completed
The user supplied table metadata showing `public.encrypted_vaults` with RLS enabled, and confirmed that `masoom_workspace` does not exist. This is metadata inspection, not an access-control audit.

## Before executing SQL
1. Ensure you have a tested database backup or snapshot and understand how to restore it.
2. Review `packages/database/shared-project/01_workspace_schema_REVIEW_ONLY.sql` fully. It creates only new objects under `masoom_workspace`, rejects an existing schema, grants only `service_role` access, enables RLS and contains no direct end-user policies.
3. Confirm the target SQL Editor is the Easy Authenticator project. Execute the migration **once** after approval. PostgreSQL transaction rolls back on errors.
4. Run `02_verify_after_install.sql` and confirm nine new tables, RLS true on all, anon/authenticated schema access false, service schema access true, and `public.encrypted_vaults` RLS true.
5. Do not add `masoom_workspace` to Supabase's exposed schemas. Do not change existing Auth configuration.

## Application activation still blocked
The dashboard deliberately displays a shared-project setup gate. The earlier public-schema company RPC and invite endpoint are incompatible and must not be enabled. Next implement protected server routes using service_role only after verifying user JWT and explicit `approved_users` plus company membership. Existing Easy Authenticator accounts must never automatically gain workspace access.

## Credentials
Set URL and anon key in web deployment; keep the service-role key server-only. Do not paste any key in chat, GitHub, screenshots or client-side code.

## Legacy migrations
Never apply `packages/database/migrations/0001_foundation.sql` or `0002_private_setup.sql` to the shared project. Those are legacy standalone prototypes.

## Billing
Company plan table is a placeholder only. A check constraint enforces `billing_enabled=false`.
