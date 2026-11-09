import { NextRequest,NextResponse } from 'next/server';
import { addTeam,workspaceIdentity } from '../../../lib/workspace-server';
export const runtime='nodejs';
export async function POST(request:NextRequest) {
  const userId=await workspaceIdentity(request.headers.get('authorization'));
  if(!userId) return NextResponse.json({error:'Sign in required'},{status:401});
  let body:unknown;
  try {body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
  const name=body && typeof body==='object' && 'name' in body ? (body as {name:unknown}).name : null;
  if(typeof name!=='string' || name.trim().length<1 || name.trim().length>100)
    return NextResponse.json({error:'Team name must be 1–100 characters'},{status:400});
  try {
    const team=await addTeam(userId,name);
    if(!team) return NextResponse.json({error:'Administrator approval required'},{status:403});
    return NextResponse.json({team},{status:201});
  }catch{return NextResponse.json({error:'Unable to create team'},{status:503});}
}
