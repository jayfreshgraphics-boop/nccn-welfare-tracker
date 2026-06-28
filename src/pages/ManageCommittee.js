import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const S = {
  page: { minHeight:'calc(100vh - 108px)', background:'#f0f4f8', fontFamily:'Georgia,serif', padding:'24px 14px' },
  wrap: { maxWidth:900, margin:'0 auto' },
  card: { background:'#fff', borderRadius:12, boxShadow:'0 1px 6px rgba(0,0,0,.08)', padding:24, marginBottom:18 },
  title: { fontSize:20, fontWeight:'bold', color:'#1a3a5c', marginBottom:4 },
  sub: { fontSize:13, color:'#777', marginBottom:20 },
  row: { display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid #eee' },
  avatar: { width:44, height:44, borderRadius:'50%', objectFit:'cover', background:'#1a3a5c', flexShrink:0 },
  avatarPlaceholder: { width:44, height:44, borderRadius:'50%', background:'#1a3a5c', display:'flex', alignItems:'center', justifyContent:'center', color:'#c8a800', fontSize:15, fontWeight:'bold', flexShrink:0 },
  name: { fontWeight:'bold', color:'#1a3a5c', fontSize:14 },
  meta: { fontSize:12, color:'#888', marginTop:2 },
  badge: (active) => ({ display:'inline-block', background: active?'#fff8e1':'#f1f1f1', color: active?'#b07d00':'#999', border:`1px solid ${active?'#fbbc04':'#ddd'}`, borderRadius:12, padding:'2px 9px', fontSize:10, fontWeight:'bold', marginLeft:8 }),
  toggle: (on) => ({ width:46, height:26, borderRadius:14, background: on?'#1e7e34':'#ccc', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }),
  toggleKnob: (on) => ({ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: on?24:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,.3)' }),
  btnDanger: { background:'#c62828', color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:'bold', fontFamily:'Georgia,serif' },
  search: { width:'100%', border:'1px solid #ddd', borderRadius:7, padding:'9px 12px', fontSize:14, fontFamily:'Georgia,serif', boxSizing:'border-box', marginBottom:18 },
  error: { background:'#fce8e6', color:'#c62828', borderRadius:7, padding:'10px 12px', fontSize:13, marginBottom:14 },
  success: { background:'#e6f4ea', color:'#1e7e34', borderRadius:7, padding:'10px 12px', fontSize:13, marginBottom:14 },
  denied: { textAlign:'center', padding:60, color:'#888' },
  statRow: { display:'flex', gap:14, marginBottom:18, flexWrap:'wrap' },
  statBox: { flex:1, minWidth:120, background:'#fff', borderRadius:10, padding:'16px 18px', boxShadow:'0 1px 6px rgba(0,0,0,.08)' },
  statNum: { fontSize:26, fontWeight:'bold', color:'#1a3a5c' },
  statLbl: { fontSize:11, color:'#888', marginTop:2 },
};

export default function ManageCommittee() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    setCurrentUserId(user.id);
    const { data: myProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    setIsAdmin(!!myProfile?.is_admin);
    setChecking(false);
    if (myProfile?.is_admin) loadMembers();
  }

  async function loadMembers() {
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    setMembers(data || []);
  }

  async function toggleAdmin(member) {
    setError(''); setSuccess('');
    const newValue = !member.is_admin;
    const { error } = await supabase.from('profiles').update({ is_admin: newValue }).eq('id', member.id);
    if (error) { setError(error.message); return; }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_admin: newValue } : m));
    setSuccess(`${member.full_name} is now ${newValue ? 'an admin' : 'a regular member'}.`);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.full_name} from the committee?\n\nThis removes their profile, admin rights, and dashboard access immediately. Their original login will still technically exist but will have no access to anything in this app. This cannot be undone from here.`)) return;

    setBusyId(member.id); setError(''); setSuccess('');
    const { error } = await supabase.from('profiles').delete().eq('id', member.id);
    if (error) {
      setError(error.message || 'Could not remove this member.');
      setBusyId(null);
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== member.id));
    setSuccess(`${member.full_name} has been removed from the committee.`);
    setTimeout(() => setSuccess(''), 4000);
    setBusyId(null);
  }

  if (checking) return <div style={S.denied}>Loading...</div>;

  if (!isAdmin) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <div style={S.card}>
            <div style={S.denied}>
              🔒 This page is for admins only.<br/>
              <span style={{ fontSize:13 }}>Contact a committee admin if you believe you should have access.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = members.filter(m =>
    (m.full_name||'').toLowerCase().includes(search.toLowerCase())
  );
  const adminCount = members.filter(m => m.is_admin).length;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.statRow}>
          <div style={S.statBox}>
            <div style={S.statNum}>{members.length}</div>
            <div style={S.statLbl}>Registered Members</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statNum}>{adminCount}</div>
            <div style={S.statLbl}>Admins</div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.title}>👥 Manage Committee</div>
          <div style={S.sub}>View every registered account. Toggle admin access or remove a member's account entirely.</div>

          {error && <div style={S.error}>{error}</div>}
          {success && <div style={S.success}>{success}</div>}

          <input style={S.search} placeholder="Search members..." value={search} onChange={e=>setSearch(e.target.value)}/>

          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', color:'#888', padding:30 }}>No members found.</div>
          ) : filtered.map(m => {
            const initials = (m.full_name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
            const isSelf = m.id === currentUserId;
            return (
              <div key={m.id} style={S.row}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" style={S.avatar}/>
                  : <div style={S.avatarPlaceholder}>{initials}</div>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={S.name}>
                    {m.full_name}
                    {isSelf && <span style={{ color:'#999', fontWeight:'normal', fontSize:12 }}> (you)</span>}
                    {m.is_admin && <span style={S.badge(true)}>ADMIN</span>}
                  </div>
                  <div style={S.meta}>{m.role || 'Welfare Officer'}{m.unit ? ` · ${m.unit}` : ''}</div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div title={isSelf ? "You can't change your own admin status here" : (m.is_admin ? 'Revoke admin' : 'Make admin')}>
                    <div
                      style={{ ...S.toggle(m.is_admin), opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                      onClick={() => !isSelf && toggleAdmin(m)}
                    >
                      <div style={S.toggleKnob(m.is_admin)}/>
                    </div>
                  </div>

                  {!isSelf && (
                    <button
                      style={{ ...S.btnDanger, opacity: busyId===m.id ? 0.6 : 1 }}
                      onClick={() => removeMember(m)}
                      disabled={busyId === m.id}
                    >
                      {busyId === m.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
