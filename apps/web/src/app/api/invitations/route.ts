import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function POST() {
  // Disabled until shared-project identity allowlist and tenant-scoped server endpoints exist.
  // In particular, never create auth.users identities in Easy Authenticator's project
  // as a side effect of an unreviewed Workspace invitation.
  return NextResponse.json({error:'Workspace invitations are disabled pending shared-project security review.'},{status:503});
}
