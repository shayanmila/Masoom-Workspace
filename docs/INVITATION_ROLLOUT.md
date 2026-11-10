# Workspace invitations — security-first rollout

Status: **schema staged on local-testing, NOT enabled**.

## Current scope
- New migration: `packages/database/migrations/0003_invitation_staging.sql`
- Per-company invitation records, normalized email, limited roles, hashed tokens, expiry, revocation and acceptance fields.
- Row-level security enabled with no browser-client grants.
- No migration has been executed automatically. Existing shared Supabase data is unchanged.

## Before enabling
1. Confirm existing `masoom_workspace.companies` primary key is UUID and inspect current memberships, approved_users and authorization rules.
2. Run migration in an isolated test database first; confirm RLS and restricted role privileges.
3. Implement owner/admin-only create/list/revoke endpoints scoped by company and authenticated identity. Rate-limit and audit mutations.
4. Generate invitation tokens using a cryptographically secure random source; persist only SHA-256 hashes. Deliver raw token via a verified email provider and never return it in ordinary API responses or logs.
5. Implement acceptance with a logged-in Supabase user whose **verified** email matches the invitation email. Consume token atomically in a transaction, create membership and approved-user entry using established schema, and prevent replay/cross-company escalation.
6. Add UI only after acceptance and permissions tests pass. Never expose invitations through anon/authenticated PostgREST.
7. Test unauthorized users, expired/revoked tokens, repeat acceptance, concurrent acceptance, duplicate invites, tenant isolation, email changes and member role restrictions.

## Deployment safety
Do not run migration or activate invitations on the production Supabase project until explicit approval. Do not touch Easy Authenticator tables or enable billing/activity sync.
