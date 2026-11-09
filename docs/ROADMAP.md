# Masoom Workspace — Roadmap

## Phase 1: Private foundation
- [x] Monorepo scaffolding: Next.js, Rust agent and PostgreSQL schema
- [x] Reserve per-company SaaS plan fields (billing disabled)
- [x] Manual-only GitHub Actions validation
- [ ] Private Supabase project provisioning and applying migrations 0001 + 0002
- [x] Invitation-based authentication UI and admin invitation endpoint (requires Supabase configuration and testing)
- [x] Admin dashboard with member directory and team creation (team assignment and edits pending)
- [ ] Tenant-isolation security validation

## Phase 2: Transparent desktop work tracking
- On-duty/off-duty switch with clear employee-facing status
- Windows app activity / active-idle summaries, without collecting keystrokes or private messages
- Durable encrypted transport, local SQLite offline queue, deduplication and retry
- Attendance, breaks and employee-accessible activity timeline

## Phase 3: Collaboration
- Real-time group chat, private messages and notifications
- Team-level permissions and task assignments
- Reports and export

## Future SaaS
- Multi-company signup, self-service plans, paid subscriptions, seat limits
- Billing remains disabled until explicitly enabled after security testing
