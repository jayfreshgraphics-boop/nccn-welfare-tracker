import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import nccnLogo from '../assets/nccn-logo.jpg';

export default function Layout({ session }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [redCount, setRedCount] = useState(0);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
    supabase.from('officers').select('id', { count:'exact' }).eq('status','RED').then(({ count }) => setRedCount(count||0));
  }, [session]);

  async function signOut() { await supabase.auth.signOut(); navigate('/login'); }

  const navStyle = ({ isActive }) => ({
    background: isActive ? '#c8a800' : 'transparent',
    color: isActive ? '#000' : '#aac4e0',
    textDecoration: 'none',
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: isActive ? 'bold' : 'normal',
    fontFamily: 'Georgia,serif',
    letterSpacing: 1,
    display: 'inline-block',
  });

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Georgia,serif' }}>
      <div style={{ background:'linear-gradient(135deg,#0d2240,#1a3a5c)', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60, boxShadow:'0 2px 10px rgba(0,0,0,.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img src={nccnLogo} alt="NCCN" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', border:'2px solid #c8a800' }}/>
          <div>
            <div style={{ color:'#fff', fontSize:15, fontWeight:'bold', letterSpacing:1 }}>NCCN</div>
            <div style={{ color:'#c8a800', fontSize:11, letterSpacing:2, textTransform:'uppercase' }}>Welfare Committee Tracker</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {profile && (
            <div
              onClick={() => navigate('/profile')}
              title="View your profile"
              style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'4px 8px', borderRadius:20, transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <span style={{ color:'#aac4e0', fontSize:12 }}>{profile.full_name}</span>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'2px solid #c8a800' }}/>
              ) : (
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#c8a800', display:'flex', alignItems:'center', justifyContent:'center', color:'#0d2240', fontSize:13, fontWeight:'bold', fontFamily:'Georgia,serif' }}>
                  {(profile.full_name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                </div>
              )}
            </div>
          )}
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid #aac4e0', color:'#aac4e0', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, fontFamily:'Georgia,serif' }}>Sign Out</button>
        </div>
      </div>
      <div style={{ background:'#1a3a5c' }}>
        <NavLink to="/" end style={navStyle}>📊 Dashboard</NavLink>
        <NavLink to="/officers" style={navStyle}>👥 Officers</NavLink>
        <NavLink to="/alerts" style={navStyle}>🚨 Alerts{redCount>0?` (${redCount})`:''}</NavLink>
        {profile?.is_admin && <NavLink to="/manage-committee" style={navStyle}>🛡️ Manage Committee</NavLink>}
      </div>
      <div style={{ maxWidth:1080, margin:'0 auto', padding:'20px 14px' }}>
        <Outlet />
      </div>
    </div>
  );
}
