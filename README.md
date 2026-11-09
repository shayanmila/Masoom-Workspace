# Masoom Workspace

Private-first employee workspace. Phase 1 foundation: Next.js dashboard, Supabase PostgreSQL schema with tenant-scoped RLS, and a Rust Windows agent scaffold. Billing is deliberately disabled. All GitHub Actions are manual-only.

## Structure
- `apps/web`: Next.js admin dashboard starter (not connected to live data until Supabase configured)
- `apps/agent`: Rust background agent scaffold (does not monitor or transmit user activity yet)
- `packages/database/migrations`: company, membership, teams, tasks, chat, activity, future subscription model
- `.github/workflows`: manually dispatched validation workflow

## Start web locally
1. Install Node.js 22.
2. `cd apps/web && npm install && npm run dev`
3. Open http://localhost:3000

## Next implementation steps
1. Create a private Supabase project, apply migrations with Supabase CLI, configure project URL and anon key (never commit service-role keys).
2. Implement invite-only login and server-verified roles.
3. Add admin-only employee/team CRUD and audit logs.
4. Add real-time chat with membership checks and message history.
5. Implement consent-aware Windows activity capture, explicit on-duty state, encrypted transport, offline queue and retries.
6. Run RLS and multi-tenant security tests before any employee onboarding.

## Privacy and safety
Activity monitoring must be disclosed to employees, limited to agreed work sessions and business purpose. No keylogging, password capture, covert screenshots, or private message interception. Do not deploy the agent to employees before a security and privacy review.

## GitHub Actions quota
The workflow runs only with `workflow_dispatch`; no push, pull request or schedule triggers.
