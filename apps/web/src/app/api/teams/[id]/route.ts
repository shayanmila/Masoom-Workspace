import { NextRequest,NextResponse } from 'next/server';
import { deleteTeam,renameTeam,workspaceIdentity } from '../../../../lib/workspace-server';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function PATCH(request:NextRequest,context:Context){
 const userId=await workspaceIdentity(request.headers.get('authorization'));
 if(!userId)return NextResponse.json({error:'Sign in required'},{status:401});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
 const name=body&&typeof body==='object'&&'name'in body?(body as {name:unknown}).name:null;
 if(typeof name!=='string'||name.trim().length<1||name.trim().length>100)return NextResponse.json({error:'Team name must be 1–100 characters'},{status:400});
 try{
  const {id}=await context.params;
  if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:'Invalid team ID'},{status:400});
  const team=await renameTeam(userId,id,name);
  if(!team)return NextResponse.json({error:'Team not found or permission denied'},{status:404});
  return NextResponse.json({team});
 }catch{return NextResponse.json({error:'Unable to rename team'},{status:503});}
}
export async function DELETE(request:NextRequest,context:Context){
 const userId=await workspaceIdentity(request.headers.get('authorization'));
 if(!userId)return NextResponse.json({error:'Sign in required'},{status:401});
 try{
  const {id}=await context.params;
  if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:'Invalid team ID'},{status:400});
  const deleted=await deleteTeam(userId,id);
  if(!deleted)return NextResponse.json({error:'Team not found or permission denied'},{status:404});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Unable to delete team; it may still have assigned members'},{status:503});}
}
