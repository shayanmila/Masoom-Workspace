'use client';
import { useEffect,useState,type FormEvent } from 'react';
import { browserClient } from '../lib/supabase';
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
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [teamName,setTeamName]=useState('');
 async function load(s:Session|null){
   setSession(s);setOverview(null);
   if(!s){setStatus('Sign in with your approved Workspace account.');return;}
   try{
    const res=await fetch('/api/workspace',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});
    const data=await res.json();
    if(!res.ok){setStatus(data.error||'Unable to load workspace');return;}
    setOverview(data);setStatus('');
   }catch{setStatus('Could not connect to Workspace backend.');}
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
 return <main style={{maxWidth:1080,margin:'auto',padding:'36px 22px',fontFamily:'system-ui,Segoe UI,sans-serif'}}>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:45}}>
   <strong style={{fontSize:25,color:'#653bb8'}}>Masoom Workspace</strong><span style={{background:'#eee8fb',color:'#58349d',padding:'8px 14px',borderRadius:24}}>Private · Phase 1</span>
  </header>
  {!configured?<section style={card}><h1>Setup required</h1><p>Configure Supabase credentials and server-side Workspace database connection. See docs/SHARED_SUPABASE_SETUP.md.</p></section>:
   !session?<section style={{...card,maxWidth:460,margin:'50px auto'}}><h1>Workspace sign-in</h1><p>Invite-only. Existing Easy Authenticator accounts are not automatically approved.</p><form onSubmit={signIn} style={{display:'grid',gap:14}}><label>Email<input type="email" required style={input} value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required style={input} value={password} onChange={e=>setPassword(e.target.value)}/></label><button style={button}>Sign in</button></form></section>:
   overview?<><section style={card}><h1 style={{marginTop:0}}>{overview.company.name}</h1><p>Signed in as {session.user.email} · {overview.role}</p><button style={{...button,background:'#e9e9f2',color:'#273149'}} onClick={()=>void browserClient().auth.signOut()}>Sign out</button></section>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
    {[['Employees',overview.members.length],['Teams',overview.teams.length],['Billing','Disabled'],['Activity sync','Disabled']].map(([label,value])=><section key={label} style={card}><p>{label}</p><strong style={{fontSize:27}}>{value}</strong></section>)}
   </div><section style={card}><h2>Members</h2>{overview.members.map(m=><p key={m.user_id} style={{overflowWrap:'anywhere'}}>{m.user_id} — {m.role}</p>)}</section>
   <section style={card}><h2>Teams</h2>{overview.teams.length?overview.teams.map(t=><p key={t.id}>{t.name}</p>):<p>No teams yet.</p>}
   {['owner','admin'].includes(overview.role)&&<form onSubmit={createTeam} style={{display:'flex',gap:12,flexWrap:'wrap'}}><input style={{...input,flex:1,minWidth:180}} value={teamName} maxLength={100} required placeholder="Team name" onChange={e=>setTeamName(e.target.value)}/><button style={button}>Add team</button></form>}</section></>:
   <section style={card}><h1>Workspace access pending</h1><p>{status}</p><button style={button} onClick={()=>void browserClient().auth.signOut()}>Sign out</button></section>}
  {session&&overview&&status&&<p role="status">{status}</p>}
  <footer style={{color:'#778298',marginTop:35}}>MasoomDev · Private Workspace · No billing or activity collection enabled</footer>
 </main>;
}
