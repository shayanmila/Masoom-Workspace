'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {browserClient} from '../../lib/supabase';
export default function ResetPassword(){
 const [ready,setReady]=useState(false);const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
 const [message,setMessage]=useState('Checking recovery link…');const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let live=true;const client=browserClient();
  async function init(){
   const params=new URLSearchParams(window.location.search);
   const code=params.get('code');
   const tokenHash=params.get('token_hash');
   const type=params.get('type');
   const error=params.get('error_description')||params.get('error');
   if(error){if(live)setMessage(error);return;}
   if(code){const {error:e}=await client.auth.exchangeCodeForSession(code);if(!live)return;if(e){setMessage(e.message);return;}history.replaceState(null,'','/reset-password');setReady(true);setMessage('Enter your new password.');return;}
   if(tokenHash&&type==='recovery'){const {error:e}=await client.auth.verifyOtp({token_hash:tokenHash,type:'recovery'});if(!live)return;if(e){setMessage(e.message);return;}history.replaceState(null,'','/reset-password');setReady(true);setMessage('Enter your new password.');return;}
   const hash=new URLSearchParams(window.location.hash.slice(1));
   if(hash.get('error')){setMessage(hash.get('error_description')||'Recovery link expired. Request a new one.');return;}
   if(hash.get('access_token')&&hash.get('refresh_token')){
    const {error:e}=await client.auth.setSession({access_token:hash.get('access_token')!,refresh_token:hash.get('refresh_token')!});
    if(!live)return;
    if(e){setMessage(e.message);return;}
    history.replaceState(null,'','/reset-password');setReady(true);setMessage('Enter your new password.');return;
   }
   setMessage('No valid recovery token found. Request a new password reset email.');
  }
  void init();return()=>{live=false;};
 },[]);
 async function submit(e:FormEvent){e.preventDefault();if(password.length<12){setMessage('Use at least 12 characters.');return;}if(password!==confirm){setMessage('Passwords do not match.');return;}
  setBusy(true);const client=browserClient();const {error}=await client.auth.updateUser({password});
  if(error){setMessage(error.message);}else{await client.auth.signOut();setReady(false);setPassword('');setConfirm('');setMessage('Password updated. Return to sign-in.');}
  setBusy(false);
 }
 return <main style={{maxWidth:460,margin:'12vh auto',padding:24,fontFamily:'system-ui'}}>
 <h1>Set a new password</h1><p role="status">{message}</p>
 {ready&&<form onSubmit={submit} style={{display:'grid',gap:14}}>
 <input type="password" autoComplete="new-password" aria-label="New password" placeholder="New password (12+ characters)" value={password} onChange={e=>setPassword(e.target.value)} required minLength={12}/>
 <input type="password" autoComplete="new-password" aria-label="Confirm password" placeholder="Confirm new password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={12}/>
 <button disabled={busy} style={{padding:12,background:'#653bb8',color:'white',border:0,borderRadius:8}}>{busy?'Updating…':'Update password'}</button></form>}
 <p><Link href="/forgot-password">Request another reset link</Link></p><p><Link href="/">Back to sign-in</Link></p>
 </main>;
}
