import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STATUS, daysSince, isOverdue, S } from '../lib/helpers';
import CheckInModal from '../components/CheckInModal';
import OfficerModal from '../components/OfficerModal';
import BulkUploadModal from '../components/BulkUploadModal';

export default function Officers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [checkInTarget, setCheckInTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  async function load() {
    const { data } = await supabase.from('officers').select('*').order('name');
    setOfficers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const units = ['ALL', ...Array.from(new Set(officers.map(o => o.unit)))];
  const filtered = officers.filter(o =>
    (filterStatus==='ALL' || o.status===filterStatus) &&
    (filterUnit==='ALL' || o.unit===filterUnit) &&
    (o.name.toLowerCase().includes(search.toLowerCase()) || (o.rank||'').toLowerCase().includes(search.toLowerCase()) || (o.email||'').toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'#888' }}>Loading...</div>;

  return (
    <>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <input style={{ ...S.input, width:180, flex:1 }} placeholder="Search officers..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={S.select} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="NOTSET">⚪ Not Set</option>
          <option value="GREEN">🟢 All Clear</option>
          <option value="AMBER">🟡 Monitor</option>
          <option value="RED">🔴 Urgent</option>
        </select>
        <select style={S.select} value={filterUnit} onChange={e=>setFilterUnit(e.target.value)}>
          {units.map(u=><option key={u} value={u}>{u==='ALL'?'All Units':u}</option>)}
        </select>
        <button style={S.btn('#1a3a5c')} onClick={()=>setShowAdd(true)}>+ Add Officer</button>
        <button style={S.btn('#c8a800')} onClick={()=>setShowUpload(true)}>📂 Bulk Upload</button>
      </div>

      {/* Summary bar */}
      <div style={{ background:'#fff', borderRadius:8, padding:'10px 16px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,.06)', display:'flex', gap:20, flexWrap:'wrap', fontSize:13 }}>
        <span><strong style={{ color:'#1a3a5c' }}>{officers.length}</strong> total officers</span>
        <span><strong style={{ color:'#777' }}>{officers.filter(o=>o.status==='NOTSET').length}</strong> not set</span>
        <span><strong style={{ color:'#1e7e34' }}>{officers.filter(o=>o.status==='GREEN').length}</strong> all clear</span>
        <span><strong style={{ color:'#b07d00' }}>{officers.filter(o=>o.status==='AMBER').length}</strong> monitoring</span>
        <span><strong style={{ color:'#c62828' }}>{officers.filter(o=>o.status==='RED').length}</strong> urgent</span>
        <span><strong style={{ color:'#555' }}>{officers.filter(o=>isOverdue(o.last_checked)).length}</strong> overdue</span>
      </div>

      {/* Table */}
      <div style={S.card}>
        {officers.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <div style={{ fontSize:16, fontWeight:'bold', color:'#1a3a5c', marginBottom:8 }}>No officers yet</div>
            <div style={{ fontSize:13, color:'#666', marginBottom:20 }}>Add officers one by one or bulk upload your roster from an Excel/CSV file.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button style={S.btn()} onClick={()=>setShowAdd(true)}>+ Add Officer</button>
              <button style={S.btn('#c8a800')} onClick={()=>setShowUpload(true)}>📂 Bulk Upload</button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Officer','Rank','Unit','Status','Assigned To','Last Checked','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((o,i) => (
                  <tr key={o.id} style={{ background:i%2===0?'#fff':'#f8fafc' }}>
                    <td style={S.td}><strong style={{ color:'#1a3a5c' }}>{o.name}</strong></td>
                    <td style={{ ...S.td, color: o.rank ? '#333' : '#bbb', fontStyle: o.rank ? 'normal' : 'italic' }}>{o.rank || '—'}</td>
                    <td style={S.td}>{o.unit}</td>
                    <td style={S.td}><span style={S.pill(o.status)}><span style={S.dot(o.status)}/>{STATUS[o.status].label}</span></td>
                    <td style={{ ...S.td, color: o.assigned_to ? '#1a3a5c' : '#bbb', fontStyle: o.assigned_to ? 'normal' : 'italic' }}>
                      {o.assigned_to || 'Unassigned'}
                    </td>
                    <td style={{ ...S.td, color:isOverdue(o.last_checked)?'#c62828':'#333', fontWeight:isOverdue(o.last_checked)?'bold':'normal' }}>{daysSince(o.last_checked)}</td>
                    <td style={S.td}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button style={S.btn()} onClick={()=>setCheckInTarget(o)}>Check In</button>
                        <button style={S.btnOut} onClick={()=>setViewTarget(o)}>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && officers.length>0 && (
                  <tr><td colSpan={7} style={{ ...S.td, textAlign:'center', color:'#888', padding:32 }}>No officers match the filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {checkInTarget && <CheckInModal officer={checkInTarget} onClose={()=>setCheckInTarget(null)} onSaved={()=>{ setCheckInTarget(null); load(); }}/>}
      {viewTarget && <OfficerModal officer={viewTarget} onClose={()=>{ setViewTarget(null); load(); }} onCheckIn={o=>{ setViewTarget(null); setCheckInTarget(o); }}/>}
      {showAdd && <OfficerModal officer={null} onClose={()=>{ setShowAdd(false); load(); }} onCheckIn={()=>{}}/>}
      {showUpload && <BulkUploadModal onClose={()=>setShowUpload(false)} onSaved={()=>{ setShowUpload(false); load(); }}/>}
    </>
  );
}
