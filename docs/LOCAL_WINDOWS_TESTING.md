# Local Windows testing (no deployment)

## Prerequisites
- Windows PowerShell, Git, Node.js 20+ and npm.
- GitHub access to private `shayanmila/Masoom-Workspace`.
- Existing Supabase project and verified Workspace owner.
- **Do not use the Supabase postgres superuser in a running web server.** Provision a separate restricted database login before connecting to real data.

## Clone and install
```powershell
git clone https://github.com/shayanmila/Masoom-Workspace.git
cd Masoom-Workspace\apps\web
npm install
Copy-Item .env.example .env.local
```

## Local environment
Edit `apps/web/.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`: existing project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable/anon key from Supabase dashboard
- `NEXT_PUBLIC_SHARED_SUPABASE_MODE=true`
- `WORKSPACE_DATABASE_URL`: **server-only**, restricted DB login URI. Use the pooler hostname/port provided by Supabase. Never paste the URI into GitHub, chat or screenshots.

`WORKSPACE_DATABASE_URL` is intentionally not supplied in this repo. Until the restricted login is created, the sign-in screen can be tested, but dashboard API calls should return 503. Do not bypass this by using a database-owner credential.

## Start and test
```powershell
npm run typecheck
npm run build
npm run dev
```
Visit http://localhost:3000. Sign in with the approved Workspace owner account. When the DB connection is configured, expect company `Masoom Workspace`, owner role, billing disabled. Try creating a test team. An unapproved Supabase account must get HTTP 403 on `/api/workspace` when signed in.

## Security notes
- Never add the `masoom_workspace` schema to Supabase exposed API schemas.
- Auth user verification is server-side; membership and approval checks happen in the database.
- Existing Easy Authenticator Auth configuration and `public.encrypted_vaults` must remain unchanged.
- Never run legacy standalone public-schema migrations in this project.
- No GitHub Actions or deployment is needed for local testing.
- This is an early test build, not production-ready. Before production, add restricted database role, end-to-end authorization tests, CSRF/abuse protections, audit logging and robust tenant-scoped queries.

## Troubleshooting
- `Cannot find module 'server-only'`: run `npm install` in `apps/web`.
- `Workspace backend unavailable`: check that a **restricted** database URI is configured and network/SSL connectivity works.
- `No approved Workspace membership`: verify the account UUID in `masoom_workspace.approved_users` and `memberships`.
- `npm` not recognized: install Node.js LTS and restart PowerShell.
