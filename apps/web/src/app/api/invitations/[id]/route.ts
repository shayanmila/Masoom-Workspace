import {NextRequest,NextResponse} from 'next/server';
import {invitationsEnabled,revokeInvitation,workspaceIdentity} from '../../../../lib/workspace-server';
export const runtime='nodejs';
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!invitationsEnabled)return NextResponse.json({error:'Invitations disabled'},{status:404});
 const userId=await workspaceIdentity(request.headers.get('authorization'));
 if(!userId)return NextResponse.json({error:'Sign in required'},{status:401});
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:'Invalid invitation ID'},{status:400});
 try{const ok=await revokeInvitation(userId,id);
  return ok?NextResponse.json({ok:true}):NextResponse.json({error:'Invitation not found or access denied'},{status:404});
 }catch{return NextResponse.json({error:'Unable to revoke invitation'},{status:503});}
}
