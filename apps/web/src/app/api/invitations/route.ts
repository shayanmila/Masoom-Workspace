import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return NextResponse.json({error:'Server invitation service not configured'}, {status:503});
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({error:'Authentication required'}, {status:401});
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error:'Invalid request'}, {status:400}); }
  if (!body || typeof body !== 'object') return NextResponse.json({error:'Invalid request'}, {status:400});
  const {companyId,email,role} = body as Record<string,unknown>;
  if (typeof companyId !== 'string' || !/^[0-9a-f-]{36}$/i.test(companyId) ||
      typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !['employee','manager','admin'].includes(String(role)))
    return NextResponse.json({error:'Invalid company, email or role'}, {status:400});
  const caller = createClient(url, anon, {global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false}});
  const {data:{user},error:userError} = await caller.auth.getUser(token);
  if (userError || !user) return NextResponse.json({error:'Invalid session'}, {status:401});
  const {data:membership,error:membershipError} = await caller.from('memberships').select('role').eq('company_id',companyId).eq('user_id',user.id).single();
  if (membershipError || !membership || !['owner','admin'].includes(membership.role))
    return NextResponse.json({error:'Administrator permission required'}, {status:403});
  const admin = createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:invited,error:inviteError} = await admin.auth.admin.inviteUserByEmail(email.toLowerCase().trim());
  if (inviteError || !invited.user) return NextResponse.json({error:'Could not send invitation. Check email configuration or existing account.'},{status:400});
  const {error:joinError} = await admin.from('memberships').insert({company_id:companyId,user_id:invited.user.id,role});
  if (joinError) return NextResponse.json({error:'Invitation was initiated, but membership setup failed. Contact administrator.'},{status:409});
  return NextResponse.json({message:'Invitation sent. Employee membership created.'});
}
