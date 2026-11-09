import { NextRequest,NextResponse } from 'next/server';
import { getWorkspaceOverview,workspaceIdentity } from '../../../lib/workspace-server';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
  const userId=await workspaceIdentity(request.headers.get('authorization'));
  if(!userId) return NextResponse.json({error:'Sign in required'}, {status:401});
  try {
    const overview=await getWorkspaceOverview(userId);
    if(!overview) return NextResponse.json({error:'No approved Workspace membership. Ask your administrator.'},{status:403});
    return NextResponse.json(overview,{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({error:'Workspace backend unavailable. Check server database configuration.'},{status:503});
  }
}
