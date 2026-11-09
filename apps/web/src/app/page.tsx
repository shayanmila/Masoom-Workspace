'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { browserClient } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
type Company = { id: string; name: string };
type Member = { user_id: string; role: string; joined_at: string };
type Team = { id: string; name: string };
const panel: React.CSSProperties = { background: '#fff', border: '1px solid #e5e8f1', borderRadius: 16, padding: 24, marginBottom: 18 };
const input: React.CSSProperties = { padding: '12px', border: '1px solid #cfd5e4', borderRadius: 9, width: '100%', boxSizing: 'border-box' };
const btn: React.CSSProperties = { background: '#643bb7', border: 0, borderRadius: 9, padding: '12px 18px', color: 'white', fontWeight: 700, cursor: 'pointer' };
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const sharedMode = process.env.NEXT_PUBLIC_SHARED_SUPABASE_MODE !== 'false';
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const refresh = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const db = browserClient();
    const { data: { session: current } } = await db.auth.getSession();
    setSession(current);
    if (!current) { setCompany(null); setMembers([]); setTeams([]); setRole(''); setLoading(false); return; }
    const { data: memberships, error } = await db.from('memberships').select('company_id,role').eq('user_id', current.user.id).limit(1);
    if (error) setMessage(error.message);
    const membership = memberships?.[0];
    if (!membership) { setCompany(null); setMembers([]); setTeams([]); setRole(''); setLoading(false); return; }
    const cid = membership.company_id as string;
    const [c, m, t] = await Promise.all([
      db.from('companies').select('id,name').eq('id', cid).single(),
      db.from('memberships').select('user_id,role,joined_at').eq('company_id', cid).order('joined_at'),
      db.from('teams').select('id,name').eq('company_id', cid).order('name')
    ]);
    if (c.error || m.error || t.error) setMessage(c.error?.message || m.error?.message || t.error?.message || '');
    setCompany(c.data as Company | null);
    setMembers((m.data || []) as Member[]);
    setTeams((t.data || []) as Team[]);
    setRole(membership.role as string);
    setLoading(false);
  }, [configured]);
  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    const db = browserClient();
    void refresh();
    const { data: { subscription } } = db.auth.onAuthStateChange(() => { void refresh(); });
    return () => subscription.unsubscribe();
  }, [configured, refresh]);
  async function signIn(e: FormEvent) {
    e.preventDefault(); setMessage('');
    const { error } = await browserClient().auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message); else await refresh();
  }
  async function createCompany(e: FormEvent) {
    e.preventDefault(); setMessage('');
    const { error } = await browserClient().rpc('create_private_company', { company_name: companyName.trim() });
    if (error) setMessage(error.message); else { setCompanyName(''); await refresh(); }
  }
  async function createTeam(e: FormEvent) {
    e.preventDefault(); if (!company) return; setMessage('');
    const { error } = await browserClient().from('teams').insert({ company_id: company.id, name: teamName.trim() });
    if (error) setMessage(error.message); else { setTeamName(''); await refresh(); }
  }
  async function invite(e: FormEvent) {
    e.preventDefault(); if (!company || !session) return; setMessage('');
    try {
      const response = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ companyId: company.id, email: inviteEmail.trim(), role: inviteRole }) });
      const data: { error?: string; message?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invitation failed');
      setMessage(data.message || 'Invitation sent'); setInviteEmail(''); await refresh();
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Invitation failed'); }
  }
  if (sharedMode) return <main style={{maxWidth:850,margin:'70px auto',padding:28,fontFamily:'system-ui'}}><h1>Masoom Workspace</h1><p>Shared Supabase integration is awaiting a read-only database inspection and security review.</p><p>Easy Authenticator remains untouched. Workspace login, invitations, company creation and monitoring are disabled until safe server endpoints are ready.</p><a href='/shared-project'>View setup status</a></main>;
  return <main style={{maxWidth:1100,margin:'auto',padding:'36px 20px'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:36}}>
      <strong style={{fontSize:25,color:'#643bb7'}}>Masoom Workspace</strong>
      <span style={{background:'#eae3fb',padding:'8px 14px',borderRadius:30,color:'#56349c'}}>Private · Phase 1</span>
    </header>
    {!configured ? <section style={panel}><h1>Configuration required</h1><p>Copy <code>apps/web/.env.example</code> to <code>.env.local</code>, configure your private Supabase project, and apply both database migrations. No backend is connected yet.</p></section> :
      loading ? <p>Loading workspace…</p> :
      !session ? <section style={{...panel,maxWidth:480,margin:'60px auto'}}><h1>Sign in to your workspace</h1><p>Invitation-only access. Public sign-up is disabled.</p><form onSubmit={signIn} style={{display:'grid',gap:12}}><label>Email<input style={input} type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input style={input} type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button style={btn}>Sign in</button></form></section> :
      !company ? <section style={{...panel,maxWidth:540}}><h1>Create your private company</h1><p>Only an invited or administrator-created account can sign in. Each account may bootstrap one company. Existing employees should ask their administrator for an invitation.</p><form onSubmit={createCompany} style={{display:'grid',gap:12}}><input style={input} minLength={2} maxLength={120} required placeholder="Company name" value={companyName} onChange={e=>setCompanyName(e.target.value)}/><button style={btn}>Create company</button></form></section> :
      <><section style={panel}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}><div><p style={{color:'#7651bd',fontWeight:700}}>COMPANY OVERVIEW</p><h1 style={{margin:'4px 0'}}>{company.name}</h1><p style={{color:'#6e7890'}}>Signed in as {session.user.email} · {role}</p></div><button style={{...btn,background:'#e8eaf0',color:'#25304c'}} onClick={async()=>{await browserClient().auth.signOut();await refresh();}}>Sign out</button></div></section>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:18}}>
      {[['Employees',members.length],['Teams',teams.length],['Billing','Disabled'],['Desktop sync','Not enabled']].map(([label,value])=><section key={label} style={panel}><p style={{color:'#71809b'}}>{label}</p><strong style={{fontSize:28}}>{value}</strong></section>)}</div>
      <section style={panel}><h2>Employees</h2><p style={{color:'#6c7990'}}>Membership directory (user IDs shown until profile display names are implemented).</p>{members.map(m=><div key={m.user_id} style={{padding:'10px 0',borderBottom:'1px solid #edf0f4',overflowWrap:'anywhere'}}>{m.user_id} · <strong>{m.role}</strong></div>)}</section>
      <section style={panel}><h2>Teams</h2>{teams.length ? teams.map(t=><p key={t.id}>{t.name}</p>) : <p>No teams created yet.</p>}{['owner','admin'].includes(role)&&<form onSubmit={createTeam} style={{display:'flex',gap:8,flexWrap:'wrap'}}><input style={{...input,flex:1,minWidth:200}} placeholder="New team name" maxLength={100} required value={teamName} onChange={e=>setTeamName(e.target.value)}/><button style={btn}>Create team</button></form>}</section>
      {['owner','admin'].includes(role)&&<section style={panel}><h2>Invite employee</h2><p style={{color:'#6c7990'}}>Invitations are sent from the server using a protected Supabase service credential.</p><form onSubmit={invite} style={{display:'flex',gap:8,flexWrap:'wrap'}}><input style={{...input,flex:2,minWidth:220}} type="email" placeholder="employee@company.com" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/><select style={{...input,flex:1,minWidth:120}} value={inviteRole} onChange={e=>setInviteRole(e.target.value)}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option></select><button style={btn}>Send invitation</button></form></section>}
      <section style={panel}><h2>Next features</h2><p>Live team chat, task assignments, attendance and employee-controlled Windows activity sync are under development. Activity monitoring is not active.</p></section></>}
    {message&&<p role="status" style={{background:'#fff5e5',padding:15,borderRadius:10,color:'#65420d'}}>{message}</p>}
    <footer style={{color:'#7b8598',padding:'22px 0'}}>MasoomDev · Internal development · No payments or employee monitoring enabled</footer>
  </main>;
}
