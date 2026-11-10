import {NextRequest,NextResponse} from 'next/server';
import {createInvitation,invitationsEnabled,listInvitations,workspaceIdentity} from '../../../lib/workspace-server';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 if(!invitationsEnabled)return NextResponse.json({error:'Invitations disabled'},{status:404});
 const userId=await workspaceIdentity(request.headers.get('authorization'));
 if(!userId)return NextResponse.json({error:'Sign in required'},{status:401});
 try{const invitations=await listInvitations(userId);
  return invitations?NextResponse.json({invitations},{headers:{'Cache-Control':'no-store'}}):NextResponse.json({error:'Admin access required'},{status:403});
 }catch{return NextResponse.json({error:'Unable to load invitations'},{status:503});}
}
export async function POST(request:NextRequest){
 if(!invitationsEnabled)return NextResponse.json({error:'Invitations disabled'},{status:404});
 const userId=await workspaceIdentity(request.headers.get('authorization'));
 if(!userId)return NextResponse.json({error:'Sign in required'},{status:401});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
 const input=body&&typeof body==='object'?body as Record<string,unknown>:{};
 const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
 const role=input.role;
 if(email.length>254||email.length<3||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||(role!=='admin'&&role!=='member'))
  return NextResponse.json({error:'Valid email and role required'},{status:400});
 try{const created=await createInvitation(userId,email,role);
  if(!created)return NextResponse.json({error:'Admin access required'},{status:403});
  // No token returned or delivered until verified-email acceptance is implemented.
  return NextResponse.json({invitation:created.invitation,delivery:'not_configured'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(error&&typeof error==='object'&&'code'in error&&error.code==='INVITE_EXISTS')
   return NextResponse.json({error:'A pending invitation already exists for this email'},{status:409});
  return NextResponse.json({error:'Unable to create invitation'},{status:503});
 }
}
