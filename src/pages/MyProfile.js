import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const S = {
  page: { minHeight:'calc(100vh - 108px)', background:'#f0f4f8', fontFamily:'Georgia,serif', padding:'24px 14px' },
  card: { maxWidth:560, margin:'0 auto', background:'#fff', borderRadius:12, boxShadow:'0 1px 6px rgba(0,0,0,.08)', padding:28 },
  header: { display:'flex', alignItems:'center', gap:18, paddingBottom:20, borderBottom:'2px solid #c8a800', marginBottom:22 },
  avatarWrap: { position:'relative', width:88, height:88, flexShrink:0 },
  avatar: { width:88, height:88, borderRadius:'50%', objectFit:'cover', border:'3px solid #1a3a5c', background:'#eee' },
  avatarPlaceholder: { width:88, height:88, borderRadius:'50%', background:'#1a3a5c', display:'flex', alignItems:'center', justifyContent:'center', color:'#c8a800', fontSize:32, fontWeight:'bold', fontFamily:'Georgia,serif', border:'3px solid #1a3a5c' },
  uploadBtn: { position:'absolute', bottom:-2, right:-2, width:30, height:30, borderRadius:'50%', background:'#c8a800', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14 },
  name: { fontSize:20, fontWeight:'bold', color:'#1a3a5c', fontFamily:'Georgia,serif' },
  role: { fontSize:13, color:'#888', marginTop:2 },
  badge: { display:'inline-block', background:'#fff8e1', color:'#b07d00', border:'1px solid #fbbc04', borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:'bold', marginTop:6 },
  label: { display:'block', fontSize:11, fontWeight:'bold', color:'#444', marginBottom:4, marginTop:14, textTransform:'uppercase', letterSpacing:.5 },
  input: { width:'100%', border:'1px solid #ddd', borderRadius:7, padding:'9px 12px', fontSize:14, fontFamily:'Georgia,serif', boxSizing:'border-box' },
  btn: (c='#1a3a5c') => ({ background:c, color:'#fff', border:'none', borderRadius:7, padding:'10px 20px', cursor:'pointer', fontSize:14, fontWeight:'bold', fontFamily:'Georgia,serif' }),
  btnOut: { background:'transparent', border:'1px solid #1a3a5c', color:'#1a3a5c', borderRadius:7, padding:'9px 18px', cursor:'pointer', fontSize:14, fontFamily:'Georgia,serif' },
  success: { background:'#e6f4ea', color:'#1e7e34', borderRadius:7, padding:'10px 12px', fontSize:13, marginBottom:14 },
  error: { background:'#fce8e6', color:'#c62828', borderRadius:7, padding:'10px 12px', fontSize:13, marginBottom:14 },
  statRow: { display:'flex', gap:14, marginTop:20, flexWrap:'wrap' },
  statBox: { flex:1, minWidth:100, background:'#f8fafc', borderRadius:8, padding:'12px 14px', textAlign:'center' },
  statNum: { fontSize:22, fontWeight:'bold', color:'#1a3a5c' },
  statLbl: { fontSize:11, color:'#888', marginTop:2 },
};

export default function MyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name:'', role:'', phone:'', address:'', unit:'', bio:'' });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ checkins: 0 });
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data);
      setForm({ full_name: data.full_name||'', role: data.role||'', phone: data.phone||'', address: data.address||'', unit: data.unit||'', bio: data.bio||'' });
    }
    const { count } = await supabase.from('checkins').select('id', { count:'exact' }).eq('checked_by', user.id);
    setStats({ checkins: count || 0 });
  }

  async function handleAvatarUpload(file) {
    if (!file || !user) return;
    setUploading(true); setError('');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { setError('Could not upload photo: ' + upErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + '?t=' + Date.now(); // cache-bust
    const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    if (dbErr) { setError('Photo uploaded but could not save: ' + dbErr.message); setUploading(false); return; }
    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    setUploading(false);
    setSuccess('Profile photo updated.');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function save() {
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name, role: form.role, phone: form.phone,
      address: form.address, unit: form.unit, bio: form.bio,
    }).eq('id', user.id);
    if (error) { setError(error.message); setLoading(false); return; }
    setProfile(p => ({ ...p, ...form }));
    setEditMode(false);
    setLoading(false);
    setSuccess('Profile updated successfully.');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  if (!profile) return <div style={{ textAlign:'center', padding:60, color:'#888' }}>Loading...</div>;

  const initials = (profile.full_name || user?.email || '?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();

  return (
    <div style={S.page}>
      <div style={S.card}>
        {success && <div style={S.success}>{success}</div>}
        {error && <div style={S.error}>{error}</div>}

        <div style={S.header}>
          <div style={S.avatarWrap}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="Profile" style={S.avatar}/>
              : <div style={S.avatarPlaceholder}>{initials}</div>}
            <div style={S.uploadBtn} onClick={()=>fileRef.current.click()} title="Upload photo">
              {uploading ? '…' : '📷'}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => handleAvatarUpload(e.target.files[0])}/>
          </div>
          <div>
            <div style={S.name}>{profile.full_name}</div>
            <div style={S.role}>{user?.email}</div>
            <div style={S.badge}>{profile.role || 'Welfare Officer'}{profile.is_admin ? ' · Admin' : ''}</div>
          </div>
        </div>

        <div style={S.statRow}>
          <div style={S.statBox}>
            <div style={S.statNum}>{stats.checkins}</div>
            <div style={S.statLbl}>Check-ins Logged</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statNum}>{profile.is_admin ? 'Yes' : 'No'}</div>
            <div style={S.statLbl}>Admin Access</div>
          </div>
        </div>

        {!editMode ? (
          <>
            <div style={{ marginTop:24 }}>
              <div style={S.label}>Phone Number</div>
              <div style={{ fontSize:14, color: profile.phone?'#333':'#bbb', fontStyle: profile.phone?'normal':'italic' }}>{profile.phone || 'Not provided'}</div>
              <div style={S.label}>Address</div>
              <div style={{ fontSize:14, color: profile.address?'#333':'#bbb', fontStyle: profile.address?'normal':'italic' }}>{profile.address || 'Not provided'}</div>
              <div style={S.label}>Unit</div>
              <div style={{ fontSize:14, color: profile.unit?'#333':'#bbb', fontStyle: profile.unit?'normal':'italic' }}>{profile.unit || 'Not provided'}</div>
              <div style={S.label}>About</div>
              <div style={{ fontSize:14, color: profile.bio?'#333':'#bbb', fontStyle: profile.bio?'normal':'italic' }}>{profile.bio || 'No bio added yet.'}</div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, flexWrap:'wrap' }}>
              <button style={S.btn()} onClick={()=>setEditMode(true)}>Edit Profile</button>
              <button style={S.btnOut} onClick={signOut}>Sign Out</button>
            </div>
          </>
        ) : (
          <>
            <label style={S.label}>Full Name *</label>
            <input style={S.input} value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))}/>
            <label style={S.label}>Role / Title</label>
            <input style={S.input} placeholder="e.g. Welfare Officer, Secretary" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}/>
            <label style={S.label}>Phone Number</label>
            <input style={S.input} placeholder="e.g. 08012345678" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
            <label style={S.label}>Address</label>
            <input style={S.input} placeholder="Home or unit address" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/>
            <label style={S.label}>Unit</label>
            <input style={S.input} placeholder="e.g. Oaustech Unit 9" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/>
            <label style={S.label}>About / Bio</label>
            <textarea style={{ ...S.input, minHeight:70 }} placeholder="A short note about yourself..." value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))}/>
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button style={{ ...S.btn(), opacity:loading?.7:1 }} onClick={save} disabled={loading}>{loading?'Saving...':'Save Changes'}</button>
              <button style={S.btnOut} onClick={()=>setEditMode(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
