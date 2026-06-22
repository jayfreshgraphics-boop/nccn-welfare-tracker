import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { S } from '../lib/helpers';

const today = new Date().toISOString().split('T')[0];

export default function CheckInModal({ officer, onClose, onSaved }) {
  const [form, setForm] = useState({ status: officer.status === 'NOTSET' ? 'GREEN' : officer.status, notes:'', date: today });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!form.notes.trim()) { setError('Please add welfare notes.'); return; }
    setLoading(true); setError('');
    const { data:{ user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    await supabase.from('checkins').insert({ officer_id:officer.id, checked_by:user.id, checked_by_name:profile?.full_name||user.email, status:form.status, notes:form.notes, check_date:form.date });
    await supabase.from('officers').update({ status:form.status, notes:form.notes, last_checked:form.date }).eq('id', officer.id);
    onSaved();
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>
        <div style={S.mTitle}>Welfare Check-In</div>
        <div style={{ fontSize:14, color:'#1a3a5c', fontWeight:'bold', marginBottom:2 }}>{officer.name}</div>
        <div style={{ fontSize:13, color:'#666', marginBottom:14 }}>{officer.rank} · {officer.unit}</div>
        {error && <div style={{ background:'#fce8e6', color:'#c62828', borderRadius:6, padding:'8px 12px', fontSize:13, marginBottom:10 }}>{error}</div>}
        <label style={S.label}>Check-in Date</label>
        <input type="date" style={S.input} value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
        <label style={S.label}>Welfare Status</label>
        <select style={{ ...S.select, width:'100%' }} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
          <option value="GREEN">🟢 GREEN — All Clear</option>
          <option value="AMBER">🟡 AMBER — Needs Monitoring</option>
          <option value="RED">🔴 RED — Urgent Attention</option>
        </select>
        <label style={S.label}>Notes / Observations *</label>
        <textarea style={{ ...S.input, minHeight:90 }} placeholder="Describe welfare status, concerns raised, or actions taken..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button style={{ ...S.btn(), opacity:loading?.7:1 }} onClick={submit} disabled={loading}>{loading?'Saving...':'Submit Check-in'}</button>
          <button style={S.btnOut} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
