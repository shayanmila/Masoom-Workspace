# Phase 2 — Local integration verification (Windows)

This checklist is for the local-testing branch. It does not deploy the web app, modify Supabase schema, or run GitHub Actions.

## Prerequisites
- Node.js 22 and npm installed.
- `apps/web/.env.local` exists and is **not committed**.
- `WORKSPACE_DATABASE_URL` points to the intended Supabase PostgreSQL database, with SSL as required by your provider.
- Supabase project URL and public/anon key are configured for the browser.
- Required migrations and approved-owner bootstrap have already been applied to the intended database.

## Start
From PowerShell at the repository root:

```powershell
cd apps/web
npm install
npm run typecheck
npm run build
npm run dev
```

Open http://localhost:3000. Do not share terminal output containing credentials.

## Acceptance checks
1. Login with an approved owner account; confirm authenticated routes load.
2. Refresh and reopen the dashboard; confirm the session is handled correctly.
3. Confirm password recovery works only through the intended local flow; no passwords or reset tokens in logs.
4. Confirm the owner can access only their own tenant's employees, teams and tasks.
5. With a second test tenant, verify that reading or mutating records across tenants is denied. Never use production employee data for this test.
6. Verify an unapproved user cannot gain owner access through a client-side role change.
7. Verify failed API requests return safe errors without exposing connection strings, SQL or server secrets.
8. Confirm employee/team create, update and delete operations are audited once implemented.
9. Verify the dashboard has loading, empty and error states, and does not display sample data as real data.
10. Verify the Windows agent remains inactive; no activity collection or upload without explicit consent and on-duty controls.

## Stop conditions
- Any cross-tenant access, unauthorized role elevation, exposed secret, or unexpected agent monitoring: stop testing and fix before onboarding users.
- Build/typecheck failures: capture the error **after redacting credentials** and fix before proceeding.

## Next engineering tasks
- Inspect existing server API routes and Supabase schema before editing them.
- Implement and test authenticated tenant-scoped employee/team/task operations.
- Add integration tests for RLS, owner permissions, and error responses.
- Keep GitHub Actions manual-only and do not deploy until local tests pass.
