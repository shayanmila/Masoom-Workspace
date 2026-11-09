export default function SharedProjectSetup() {
  return <main style={{maxWidth:820,margin:'60px auto',padding:24,fontFamily:'system-ui'}}>
    <h1>Masoom Workspace · Shared Supabase setup</h1>
    <p>Easy Authenticator remains the existing application in this Supabase project. Workspace database setup is waiting for a read-only inspection and security review.</p>
    <p><strong>Current state:</strong> No Workspace database changes have been applied. Employee invitations, company creation and activity monitoring are disabled.</p>
    <p>See <code>docs/SHARED_SUPABASE_SETUP.md</code> and run only <code>00_read_only_inspection.sql</code> after reviewing the instructions.</p>
  </main>;
}
