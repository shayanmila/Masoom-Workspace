# Owner bootstrap — manual and explicit

1. Verify nine tables have RLS enabled (run the FIRST query in `02_verify_after_install.sql` separately).
2. Identify the intended owner's Supabase Auth user UUID through the Supabase dashboard. If this is an existing Easy Authenticator account, only approve it with the owner's explicit agreement; otherwise create a dedicated Workspace Auth user through the Supabase Auth dashboard. Do not change Easy Authenticator Auth settings.
3. Review `03_owner_bootstrap_TEMPLATE.sql`, replace the placeholder UUID and company name locally, then run it once. Do not share real user UUIDs in chat unless necessary.
4. Configure `WORKSPACE_DATABASE_URL` only in the server's secret environment, and `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the web environment. Do not expose the DB URI in frontend bundles, GitHub or chat.
5. Start the web app and sign in. Server validates Supabase JWT, approved user and company membership on each request.

The initial owner is not created automatically. This avoids allowing any Easy Authenticator account to claim a Workspace company.
