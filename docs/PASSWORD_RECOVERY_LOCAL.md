# Local Workspace password recovery

Workspace now has `/forgot-password` and `/reset-password` pages. The previous email opened MasoomDev because Supabase fell back to its configured Site URL. Do **not** change the Site URL, email templates, or existing Easy Authenticator configuration.

1. In the existing Supabase dashboard, open **Authentication → URL Configuration → Redirect URLs**.
2. **Add** `http://localhost:3001/reset-password` as an additional allowed redirect URL. Preserve every existing entry and the existing Site URL. This additive allowlist change is shared-project configuration; review it with any other app owners.
3. Pull latest code in the Windows clone, restart the dev server on port 3001.
4. Open `http://localhost:3001/forgot-password`, request a **new** reset email for the approved Workspace owner. Old links may be expired or point to MasoomDev.
5. Open the new link on the same Windows computer. The `/reset-password` page should display a new password form after the recovery session is validated.
6. Choose a unique password of at least 12 characters. Then sign in on `http://localhost:3001`.

This feature is for local testing. Do not add a production URL until deployment is explicitly approved. A reset link is sensitive; do not paste it into chat or screenshots. Password changes affect the shared Supabase Auth account wherever that identity is used.

If a link still opens MasoomDev, confirm that the exact redirect URL is allowed, the new request was initiated from Workspace, and that the correct project is configured in `.env.local`.
