import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STATUS, daysSince, S } from '../lib/helpers';

export default function OfficerModal({ officer, onClose, onCheckIn }) {
  const isNew = !officer;
  const [form, setForm] = useState(officer ? {...officer} : {
    name:'', rank:'', unit:'', status:'NOTSET', assigned_to:'',
    intake_number:'', email:'', phone:'', address:'', faculty_dept:'', notes:''
  });
  const [editMode, setEditMode] = useState(isNew);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (officer) {
      supabase.from('checkins').select('*').eq('officer_id', officer.id).order('check_date',{ascending:false}).limit(10)
        .then(({ data }) => setHistory(data||[]));
    }
  }, [officer]);

  async function save() {
    if (!form.name.trim()||!form.unit.trim()) { setError('Name and unit/designation are required.'); return; }
    setLoading(true); setError('');
    const payload = {
      name: form.name, rank: form.rank||'', unit: form.unit, status: form.status,
      assigned_to: form.assigned_to||'', intake_number: form.intake_number||'',
      email: form.email||'', phone: form.phone||'', address: form.address||'',
      faculty_dept: form.faculty_dept||'', notes: form.notes||'',
    };
    if (isNew) {
      const { error } = await supabase.from('officers').insert(payload);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.from('officers').update(payload).eq('id', officer.id);
      if (error) { setError(error.message); setLoading(false); return; }
    }
    onClose();
  }

  async function deleteOfficer() {
    if (!window.confirm(`Remove ${officer.name}? This cannot be undone.`)) return;
    await supabase.from('officers').delete().eq('id', officer.id);
    onClose();
  }

  const detailRow = (label, value) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:10, color:'#999', textTransform:'uppercase', letterSpacing:.5, marginBottom:1 }}>{label}</div>
      <div style={{ fontSize:13, color: value ? '#333' : '#bbb', fontStyle: value ? 'normal' : 'italic' }}>{value || 'Not provided'}</div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 520 }} onClick={e=>e.stopPropagation()}>
        {!editMode ? <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #c8a800' }}>
            <div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:'bold', color:'#1a3a5c' }}>{officer.name}</div>
              <div style={{ fontSize:13, color:'#666' }}>{officer.rank ? `${officer.rank} · ` : ''}{officer.unit}</div>
            </div>
            <span style={S.pill(officer.status)}><span style={S.dot(officer.status)}/>{STATUS[officer.status].label}</span>
          </div>

          {/* Full detail panel */}
          <div style={{ background:'#f8fafc', borderRadius:8, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:'bold', color:'#1a3a5c', marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>📋 Full Profile</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 14px' }}>
              {detailRow('Intake Number', officer.intake_number)}
              {detailRow('Assigned Welfare Officer', officer.assigned_to)}
              {detailRow('Email', officer.email)}
              {detailRow('Phone', officer.phone)}
            </div>
            {detailRow('Home Address', officer.address)}
            {detailRow('Faculty / Department', officer.faculty_dept)}
          </div>

          <div style={{ background:'#f8fafc', borderRadius:8, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:3 }}>LATEST WELFARE NOTES</div>
            <div style={{ fontSize:14 }}>{officer.notes||'No notes recorded.'}</div>
            <div style={{ fontSize:11, color:'#888', marginTop:6 }}>Last checked: {daysSince(officer.last_checked)}</div>
          </div>

          {history.length>0 && <>
            <div style={{ fontSize:11, fontWeight:'bold', color:'#444', marginBottom:8, textTransform:'uppercase' }}>Check-in History</div>
            {history.map((h,i) => (
              <div key={i} style={{ borderLeft:`3px solid ${STATUS[h.status].dot}`, paddingLeft:10, marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:'bold' }}>{h.check_date} — <span style={{ color:STATUS[h.status].text }}>{STATUS[h.status].label}</span>{h.checked_by_name&&<span style={{ color:'#888', fontWeight:'normal' }}> · {h.checked_by_name}</span>}</div>
                <div style={{ fontSize:12, color:'#666' }}>{h.notes||'No notes.'}</div>
              </div>
            ))}
          </>}

          <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
            <button style={S.btn()} onClick={()=>onCheckIn(officer)}>Check In</button>
            <button style={S.btnOut} onClick={()=>setEditMode(true)}>Edit</button>
            <button style={{ ...S.btn('#c62828'), marginLeft:'auto' }} onClick={deleteOfficer}>Remove</button>
            <button style={S.btnOut} onClick={onClose}>Close</button>
          </div>
        </> : <>
          <div style={S.mTitle}>{isNew?'Add New Officer':`Edit — ${officer?.name}`}</div>
          {error && <div style={{ background:'#fce8e6', color:'#c62828', borderRadius:6, padding:'8px 12px', fontSize:13, marginBottom:10 }}>{error}</div>}

          <label style={S.label}>Full Name *</label>
          <input style={S.input} placeholder="e.g. CDT Amara Okafor" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>

          <label style={S.label}>Rank / Title</label>
          <input style={S.input} placeholder="Optional — e.g. Cadet Officer" value={form.rank||''} onChange={e=>setForm(p=>({...p,rank:e.target.value}))}/>

          <label style={S.label}>Unit / Designation *</label>
          <input style={S.input} placeholder="e.g. Oaustech Unit 9" value={form.unit||''} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/>

          <label style={S.label}>Welfare Status</label>
          <select style={{ ...S.select, width:'100%' }} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
            <option value="NOTSET">⚪ Not Set</option>
            <option value="GREEN">🟢 GREEN — All Clear</option>
            <option value="AMBER">🟡 AMBER — Monitor</option>
            <option value="RED">🔴 RED — Urgent</option>
          </select>

          <label style={S.label}>Assigned To (Welfare Officer)</label>
          <input style={S.input} placeholder="e.g. CDT Amaka Obi" value={form.assigned_to||''} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))}/>

          <label style={S.label}>Intake Number</label>
          <input style={S.input} placeholder="e.g. 9" value={form.intake_number||''} onChange={e=>setForm(p=>({...p,intake_number:e.target.value}))}/>

          <label style={S.label}>Email Address</label>
          <input style={S.input} placeholder="officer@email.com" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>

          <label style={S.label}>Phone Number</label>
          <input style={S.input} placeholder="e.g. 08012345678" value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>

          <label style={S.label}>Home Address</label>
          <input style={S.input} placeholder="Home address" value={form.address||''} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/>

          <label style={S.label}>Faculty / Department</label>
          <input style={S.input} placeholder="e.g. Electrical Electronics Engineering" value={form.faculty_dept||''} onChange={e=>setForm(p=>({...p,faculty_dept:e.target.value}))}/>

          <label style={S.label}>Welfare Notes</label>
          <textarea style={{ ...S.input, minHeight:70 }} placeholder="Optional notes..." value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>

          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button style={{ ...S.btn(), opacity:loading?.7:1 }} onClick={save} disabled={loading}>{loading?'Saving...':isNew?'Add Officer':'Save'}</button>
            <button style={S.btnOut} onClick={isNew?onClose:()=>setEditMode(false)}>Cancel</button>
          </div>
        </>}
      </div>
    </div>
  );
}
