import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
let pool: Pool | undefined;
function getPool() {
  const connectionString = process.env.WORKSPACE_DATABASE_URL;
  if (!connectionString) throw new Error('Workspace database connection not configured');
  return pool ??= new Pool({connectionString, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, ssl: {rejectUnauthorized: true}});
}
export async function workspaceIdentity(authorization: string | null) {
  const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  const supabase = createClient(url, anon, {auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error} = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}
export async function getWorkspaceOverview(userId: string) {
  const db = getPool();
  // Parameterized queries; access requires BOTH explicit approval and company membership.
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
