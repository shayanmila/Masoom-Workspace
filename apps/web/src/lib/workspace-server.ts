import 'server-only';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

let pool: Pool | undefined;

function getPool() {
  if (pool) return pool;
  const raw = process.env.WORKSPACE_DATABASE_URL?.trim();
  if (!raw) throw new Error('Workspace database connection not configured');

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Workspace database URL is malformed');
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname || !parsed.username) {
    throw new Error('Workspace database URL must be a PostgreSQL URI');
  }
  // pg-connection-string can override the explicit TLS configuration when
  // sslmode/sslrootcert appears in the URI. Reject ambiguous configurations.
  for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    if (parsed.searchParams.has(key)) {
      throw new Error('Remove ' + key + ' from WORKSPACE_DATABASE_URL; configure TLS with WORKSPACE_DATABASE_CA_FILE');
    }
  }

  const caFile = process.env.WORKSPACE_DATABASE_CA_FILE?.trim();
  const ssl = caFile
    ? { rejectUnauthorized: true, ca: readFileSync(caFile, 'utf8') }
    : { rejectUnauthorized: true };

  pool = new Pool({
    connectionString: raw,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    ssl
  });
  pool.on('error', (error) => {
    // A failed idle connection must not crash the development server.
    const code = (error as NodeJS.ErrnoException).code ?? 'UNKNOWN';
    console.error('[Workspace DB] idle connection error code:', code);
  });
  return pool;
}

export async function workspaceIdentity(authorization: string | null) {
  const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export async function getWorkspaceOverview(userId: string) {
  const db = getPool();
  const membership = await db.query<{company_id:string;role:string;company_name:string}>(`
    select m.company_id,m.role,c.name as company_name
    from masoom_workspace.memberships m
    join masoom_workspace.approved_users a on a.user_id=m.user_id
    join masoom_workspace.companies c on c.id=m.company_id
    where m.user_id=$1
    order by m.joined_at asc limit 1`, [userId]);
  const current = membership.rows[0];
  if (!current) return null;
  const [members,teams] = await Promise.all([
    db.query<{user_id:string;role:string;joined_at:string}>(`select m.user_id,m.role,m.joined_at
      from masoom_workspace.memberships m
      join masoom_workspace.approved_users a on a.user_id=m.user_id
      where m.company_id=$1 order by m.joined_at`,[current.company_id]),
    db.query<{id:string;name:string}>(`select id,name from masoom_workspace.teams where company_id=$1 order by name`,[current.company_id])
  ]);
  return {company:{id:current.company_id,name:current.company_name},role:current.role,members:members.rows,teams:teams.rows,billingEnabled:false,activitySyncEnabled:false};
}

export async function addTeam(userId:string, name:string) {
  const db = getPool();
  const result=await db.query<{id:string;name:string}>(`
    insert into masoom_workspace.teams(company_id,name)
    select m.company_id,$2 from masoom_workspace.memberships m
    join masoom_workspace.approved_users a on a.user_id=m.user_id
    where m.user_id=$1 and m.role in ('owner','admin')
    and length(trim($2::text)) between 1 and 100
    returning id,name`,[userId,name.trim()]);
  return result.rows[0] ?? null;
}
