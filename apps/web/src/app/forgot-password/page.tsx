'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {browserClient} from '../../lib/supabase';
export default function ForgotPassword(){
 const [email,setEmail]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage('');
  try {
   const redirectTo=window.location.origin+'/reset-password';
   const {error}=await browserClient().auth.resetPasswordForEmail(email.trim(),{redirectTo});
   setMessage(error?error.message:'If this account exists, a recovery email has been sent. Check your inbox and spam.');
  }catch{setMessage('Unable to request recovery. Check Supabase configuration.');}
  finally{setBusy(false);}
 }
 return <main style={{maxWidth:460,margin:'12vh auto',padding:24,fontFamily:'system-ui'}}>
 <h1>Reset Workspace password</h1><p>Enter your Workspace administrator email to receive a recovery link.</p>
 <form onSubmit={submit} style={{display:'grid',gap:14}}><input aria-label="Email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" style={{padding:12}}/>
 <button disabled={busy} style={{padding:12,background:'#653bb8',color:'white',border:0,borderRadius:8}}>{busy?'Sending…':'Send reset link'}</button></form>
 {message&&<p role="status">{message}</p>}<p><Link href="/">Back to sign-in</Link></p></main>;
}
