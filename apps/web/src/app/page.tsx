'use client';
import { useEffect,useState,type FormEvent } from 'react';
import { browserClient } from '../lib/supabase';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
type Overview={company:{id:string;name:string};role:string;members:{user_id:string;role:string}[];teams:{id:string;name:string}[];billingEnabled:boolean;activitySyncEnabled:boolean};
const card:React.CSSProperties={background:'#fff',border:'1px solid #e7e7f2',borderRadius:16,padding:24,marginBottom:18};
const input:React.CSSProperties={border:'1px solid #cbd0dc',borderRadius:8,padding:12,width:'100%',boxSizing:'border-box'};
const button:React.CSSProperties={border:0,borderRadius:8,background:'#653bb8',color:'#fff',padding:'12px 18px',fontWeight:700,cursor:'pointer'};
const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export default function Home(){
 const [session,setSession]=useState<Session|null>(null);
 const [overview,setOverview]=useState<Overview|null>(null);
 const [status,setStatus]=useState('Loading…');
 const [busyTeam,setBusyTeam]=useState<string|null>(null);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [teamName,setTeamName]=useState('');
 async function load(s:Session|null){
   setSession(s);setOverview(null);
   if(!s){setStatus('Sign in with your approved Workspace account.');return;}
   try{
    const res=await fetch('/api/workspace',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});
    const contentType=res.headers.get('content-type')||'';
    if(!contentType.toLowerCase().includes('application/json')){
      setStatus('Workspace API returned HTTP '+res.status+' with a non-JSON response. Check the development server terminal.');
      return;
    }
    const data=await res.json();
    if(!res.ok){setStatus((typeof data.error==='string'?data.error:'Workspace request failed')+' (HTTP '+res.status+')');return;}
    setOverview(data);setStatus('');
   }catch(error){
    const detail=error instanceof Error?error.message:'Unknown request error';
    setStatus('Workspace request failed: '+detail);
   }
 }
 useEffect(()=>{
   if(!configured){setStatus('Supabase environment variables are not configured.');return;}
   const client=browserClient();
   void client.auth.getSession().then(({data})=>load(data.session));
   const {data:{subscription}}=client.auth.onAuthStateChange((_event,s)=>{void load(s);});
   return ()=>subscription.unsubscribe();
 },[]);
 async function signIn(e:FormEvent){e.preventDefault();setStatus('Signing in…');const {data,error}=await browserClient().auth.signInWithPassword({email,password});if(error)setStatus(error.message);else await load(data.session);}
 async function createTeam(e:FormEvent){
  e.preventDefault();if(!session)return;
  const res=await fetch('/api/teams',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({name:teamName})});
  const data=await res.json();if(!res.ok){setStatus(data.error||'Failed to create team');return;}
  setTeamName('');await load(session);
 }
 async function manageTeam(id:string,action:'rename'|'delete',currentName:string){
  if(!session||busyTeam)return;
  let name:string|undefined;
  if(action==='rename'){
   const answer=window.prompt('New team name',currentName);
   if(answer===null)return;
   name=answer.trim();
   if(!name||name.length>100){setStatus('Team name must be 1–100 characters.');return;}
   if(name===currentName)return;
  }else if(!window.confirm('Delete team "'+currentName+'"? This cannot be undone.'))return;
  setBusyTeam(id);setStatus('');
  try{
   const res=await fetch('/api/teams/'+encodeURIComponent(id),{
    method:action==='rename'?'PATCH':'DELETE',
    headers:{Authorization:'Bearer '+session.access_token,...(action==='rename'?{'Content-Type':'application/json'}:{})},
    ...(action==='rename'?{body:JSON.stringify({name})}:{})
   });
   const data=await res.json();
   if(!res.ok){setStatus(data.error||'Team update failed');return;}
   await load(session);
  }catch(error){setStatus(error instanceof Error?error.message:'Team update failed');}
  finally{setBusyTeam(null);}
 }
 return <main style={{maxWidth:1080,margin:'auto',padding:'36px 22px',fontFamily:'system-ui,Segoe UI,sans-serif'}}>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:45}}>
   <strong style={{fontSize:25,color:'#653bb8'}}>Masoom Workspace</strong><span style={{background:'#eee8fb',color:'#58349d',padding:'8px 14px',borderRadius:24}}>Private · Phase 1</span>
  </header>
  {!configured?<section style={card}><h1>Setup required</h1><p>Configure Supabase credentials and server-side Workspace database connection. See docs/SHARED_SUPABASE_SETUP.md.</p></section>:
   !session?<section style={{...card,maxWidth:460,marginTop:50,marginRight:'auto',marginBottom:50,marginLeft:'auto'}}><h1>Workspace sign-in</h1><p>Invite-only. Existing Easy Authenticator accounts are not automatically approved.</p><form onSubmit={signIn} style={{display:'grid',gap:14}}><label>Email<input type="email" required style={input} value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required style={input} value={password} onChange={e=>setPassword(e.target.value)}/></label><button style={button}>Sign in</button><Link href="/forgot-password" style={{color:'#653bb8'}}>Forgot password?</Link></form></section>:
   overview?<><section style={card}><h1 style={{marginTop:0}}>{overview.company.name}</h1><p>Signed in as {session.user.email} · {overview.role}</p><button style={{...button,background:'#e9e9f2',color:'#273149'}} onClick={()=>void browserClient().auth.signOut()}>Sign out</button></section>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
    {[['Employees',overview.members.length],['Teams',overview.teams.length],['Billing','Disabled'],['Activity sync','Disabled']].map(([label,value])=><section key={label} style={card}><p>{label}</p><strong style={{fontSize:27}}>{value}</strong></section>)}
   </div><section style={card}><h2>Members</h2>{overview.members.map(m=><p key={m.user_id} style={{overflowWrap:'anywhere'}}>{m.user_id===session.user.id?(session.user.email||'Your account'):m.user_id} — {m.role}</p>)}<p style={{color:'#778298',fontSize:14}}>Other members’ email addresses are not available in the current API.</p></section>
   <section style={card}><h2>Teams</h2>{overview.teams.length?overview.teams.map(t=><div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',padding:'12px 0',borderBottom:'1px solid #eee'}}><strong>{t.name}</strong>{['owner','admin'].includes(overview.role)&&<div style={{display:'flex',gap:8}}><button type="button" disabled={Boolean(busyTeam)} onClick={()=>void manageTeam(t.id,'rename',t.name)} style={{...button,background:'#eee8fb',color:'#58349d',padding:'8px 12px'}}>Rename</button><button type="button" disabled={Boolean(busyTeam)} onClick={()=>void manageTeam(t.id,'delete',t.name)} style={{...button,background:'#fff0f0',color:'#9b2633',padding:'8px 12px'}}>Delete</button></div>}</div>):<p>No teams yet.</p>}
   {['owner','admin'].includes(overview.role)&&<form onSubmit={createTeam} style={{display:'flex',gap:12,flexWrap:'wrap'}}><input style={{...input,flex:1,minWidth:180}} value={teamName} maxLength={100} required placeholder="Team name" onChange={e=>setTeamName(e.target.value)}/><button style={button}>Add team</button></form>}<p style={{fontSize:14,color:'#778298'}}>Member invitations are not enabled yet; approval and acceptance security checks are required first.</p></section></>:
   <section style={card}><h1>Workspace access pending</h1><p>{status}</p><button style={button} onClick={()=>void browserClient().auth.signOut()}>Sign out</button></section>}
  {session&&overview&&status&&<p role="status">{status}</p>}
  <footer style={{color:'#778298',marginTop:35}}>MasoomDev · Private Workspace · No billing or activity collection enabled</footer>
 </main>;
}
