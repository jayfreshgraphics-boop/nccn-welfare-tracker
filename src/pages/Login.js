import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import nccnLogo from '../assets/nccn-logo.jpg';

const S = {
  page: { minHeight:'100vh', background:'linear-gradient(135deg,#0d2240,#1a3a5c)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia,serif', padding:16 },
  box: { background:'#fff', borderRadius:14, padding:'40px 36px', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.4)' },
  title: { color:'#0d2240', fontSize:22, fontWeight:'bold', margin:0, textAlign:'center' },
  sub: { color:'#c8a800', fontSize:12, letterSpacing:2, textTransform:'uppercase', marginTop:4, textAlign:'center' },
  divider: { height:3, background:'linear-gradient(90deg,#0d2240,#c8a800)', borderRadius:2, margin:'20px 0' },
  label: { display:'block', fontSize:12, fontWeight:'bold', color:'#444', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 },
  input: { width:'100%', border:'1px solid #ddd', borderRadius:7, padding:'10px 12px', fontSize:14, fontFamily:'Georgia,serif', boxSizing:'border-box', marginBottom:14 },
  btn: { width:'100%', background:'#0d2240', color:'#fff', border:'none', borderRadius:7, padding:12, fontSize:15, fontWeight:'bold', fontFamily:'Georgia,serif', cursor:'pointer', marginTop:6 },
  toggle: { textAlign:'center', marginTop:16, fontSize:13, color:'#666' },
  toggleBtn: { color:'#0d2240', fontWeight:'bold', background:'none', border:'none', cursor:'pointer', fontFamily:'Georgia,serif', fontSize:13 },
  error: { background:'#fce8e6', color:'#c62828', borderRadius:7, padding:'10px 12px', fontSize:13, marginBottom:14 },
  success: { background:'#e6f4ea', color:'#1e7e34', borderRadius:7, padding:'10px 12px', fontSize:13, marginBottom:14 },
};

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit() {
    setError(''); setSuccess(''); setLoading(true);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); }
      else if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, full_name: name, role: 'Welfare Officer' });
        setSuccess('Account created! You can now sign in.');
        setMode('login');
      }
    }
    setLoading(false);
  }

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={{ textAlign:'center', marginBottom:4 }}>
          <img src={nccnLogo} alt="NCCN" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid #c8a800' }}/>
        </div>
        <div style={S.title}>NCCN</div>
        <div style={S.sub}>Welfare Committee Tracker</div>
        <div style={S.divider}/>
        {error && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}
        {mode === 'signup' && <>
          <label style={S.label}>Full Name</label>
          <input style={S.input} placeholder="e.g. CDT Amaka Obi" value={name} onChange={e => setName(e.target.value)}/>
        </>}
        <label style={S.label}>Email Address</label>
        <input style={S.input} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}/>
        <label style={S.label}>Password</label>
        <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSubmit()}/>
        <button style={{ ...S.btn, opacity:loading?.7:1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode==='login' ? 'Sign In' : 'Create Account'}
        </button>
        <div style={S.toggle}>
          {mode==='login'
            ? <>No account? <button style={S.toggleBtn} onClick={()=>{setMode('signup');setError('');}}>Sign Up</button></>
            : <>Have an account? <button style={S.toggleBtn} onClick={()=>{setMode('login');setError('');}}>Sign In</button></>}
        </div>
      </div>
    </div>
  );
}
