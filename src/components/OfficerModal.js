import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STATUS, daysSince, S } from '../lib/helpers';

export default function OfficerModal({ officer, onClose, onCheckIn }) {
  const isNew = !officer;
  const [form, setForm] = useState(officer ? {...officer} : { name:'', rank:'', unit:'', status:'GREEN', assigned_to:'', notes:'' });
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
    if (!form.name.trim()||!form.rank.trim()||!form.unit.trim()) { setError('Name, rank and unit are required.'); return; }
    setLoading(true); setError('');
    if (isNew) {
      const { error } = await supabase.from('officers').insert({ name:form.name, rank:form.rank, unit:form.unit, status:form.status, assigned_to:form.assigned_to||'', notes:form.notes||'' });
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.from('officers').update({ name:form.name, rank:form.rank, unit:form.unit, status:form.status, assigned_to:form.assigned_to||'', notes:form.notes }).eq('id', officer.id);
      if (error) { setError(error.message); setLoading(false); return; }
    }
    onClose();
  }

  async function deleteOfficer() {
    if (!window.confirm(`Remove ${officer.name}? This cannot be undone.`)) return;
    await supabase.from('officers').delete().eq('id', officer.id);
    onClose();
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>
        {!editMode ? <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #c8a800' }}>
            <div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:'bold', color:'#1a3a5c' }}>{officer.name}</div>
              <div style={{ fontSize:13, color:'#666' }}>{officer.rank} · {officer.unit}</div>
            </div>
            <span style={S.pill(officer.status)}><span style={S.dot(officer.status)}/>{STATUS[officer.status].label}</span>
          </div>
          <div style={{ background:'#f8fafc', borderRadius:8, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:3 }}>ASSIGNED WELFARE OFFICER</div>
            <div style={{ fontSize:14, color: officer.assigned_to ? '#1a3a5c' : '#bbb', fontStyle: officer.assigned_to ? 'normal' : 'italic' }}>
              {officer.assigned_to || 'Not assigned'}
            </div>
          </div>
          <div style={{ background:'#f8fafc', borderRadius:8, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:3 }}>LATEST NOTES</div>
            <div style={{ fontSize:14 }}>{officer.notes||'No notes recorded.'}</div>
            <div style={{ fontSize:11, color:'#888', marginTop:6 }}>Last checked: {daysSince(officer.last_checked)}</div>
          </div>
          {history.length>0 && <>
            <div style={{ fontSize:11, fontWeight:'bold', color:'#444', marginBottom:8, textTransform:'uppercase' }}>Check-in History</div>
            {history.map((h,i) => (
              <div key={i} style={{ borderLeft:`3px solid ${STATUS[h.status].dot}`, paddingLeft:10, marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:'bold' }}>{h.check_date} — <span style={{ color:STATUS[h.status].text }}>{h.status}</span>{h.checked_by_name&&<span style={{ color:'#888', fontWeight:'normal' }}> · {h.checked_by_name}</span>}</div>
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
          {[['Full Name *','name','e.g. CDT Amara Okafor'],['Rank / Title *','rank','e.g. Cadet Officer'],['Unit *','unit','e.g. Alpha Unit']].map(([lbl,key,ph])=>(
            <div key={key}><label style={S.label}>{lbl}</label><input style={S.input} placeholder={ph} value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/></div>
          ))}
          <label style={S.label}>Status</label>
          <select style={{ ...S.select, width:'100%' }} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
            <option value="GREEN">GREEN — All Clear</option>
            <option value="AMBER">AMBER — Monitor</option>
            <option value="RED">RED — Urgent</option>
          </select>
          <label style={S.label}>Assigned To (Welfare Officer)</label>
          <input style={S.input} placeholder="e.g. CDT Amaka Obi" value={form.assigned_to||''} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))}/>
          <label style={S.label}>Notes</label>
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
