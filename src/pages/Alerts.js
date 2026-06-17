import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { daysSince, isOverdue, S } from '../lib/helpers';
import CheckInModal from '../components/CheckInModal';

const alertBox = (bg,bc) => ({ background:bg, border:`1px solid ${bc}`, borderRadius:8, padding:'10px 12px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 });

export default function Alerts() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInTarget, setCheckInTarget] = useState(null);

  async function load() {
    const { data } = await supabase.from('officers').select('*').order('name');
    setOfficers(data||[]); setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'#888' }}>Loading...</div>;

  const reds   = officers.filter(o=>o.status==='RED');
  const ambers = officers.filter(o=>o.status==='AMBER');
  const overdue = officers.filter(o=>o.status!=='RED'&&isOverdue(o.last_checked));

  return (
    <>
      {reds.length>0 && <div style={S.card}>
        <div style={{ ...S.sTitle, color:'#c62828' }}>🔴 Urgent — Immediate Attention Required</div>
        {reds.map(o=>(
          <div key={o.id} style={alertBox('#fce8e6','#ea4335')}>
            <div>
              <strong style={{ color:'#c62828' }}>{o.name}</strong>
              <div style={{ fontSize:12,color:'#666' }}>{o.rank} — {o.unit}</div>
              <div style={{ fontSize:12,color:'#888',marginTop:2 }}>{o.notes}</div>
              <div style={{ fontSize:11,color:'#aaa',marginTop:2 }}>Last checked: {daysSince(o.last_checked)}</div>
            </div>
            <button style={S.btn('#c62828')} onClick={()=>setCheckInTarget(o)}>Update Status</button>
          </div>
        ))}
      </div>}

      {ambers.length>0 && <div style={S.card}>
        <div style={{ ...S.sTitle, color:'#b07d00' }}>🟡 Monitoring — Follow Up Required</div>
        {ambers.map(o=>(
          <div key={o.id} style={alertBox('#fff8e1','#fbbc04')}>
            <div>
              <strong style={{ color:'#b07d00' }}>{o.name}</strong>
              <div style={{ fontSize:12,color:'#666' }}>{o.rank} — {o.unit}</div>
              <div style={{ fontSize:12,color:'#888',marginTop:2 }}>{o.notes}</div>
              <div style={{ fontSize:11,color:'#aaa',marginTop:2 }}>Last checked: {daysSince(o.last_checked)}</div>
            </div>
            <button style={S.btn('#b07d00')} onClick={()=>setCheckInTarget(o)}>Update Status</button>
          </div>
        ))}
      </div>}

      {overdue.length>0 && <div style={S.card}>
        <div style={S.sTitle}>⏰ Overdue Check-ins (&gt;30 days)</div>
        {overdue.map(o=>(
          <div key={o.id} style={alertBox('#f5f5f5','#ddd')}>
            <div>
              <strong>{o.name}</strong>
              <div style={{ fontSize:12,color:'#666' }}>{o.rank} — {o.unit}</div>
              <div style={{ fontSize:12,color:'#888' }}>Last checked: {daysSince(o.last_checked)}</div>
            </div>
            <button style={S.btn()} onClick={()=>setCheckInTarget(o)}>Check In Now</button>
          </div>
        ))}
      </div>}

      {!reds.length&&!ambers.length&&!overdue.length && (
        <div style={{ ...S.card, textAlign:'center', padding:56 }}>
          <div style={{ fontSize:52 }}>✅</div>
          <div style={{ fontSize:18, fontWeight:'bold', color:'#1e7e34', marginTop:12 }}>No Active Alerts</div>
          <div style={{ color:'#666', marginTop:6 }}>All officers are in good standing and check-ins are up to date.</div>
        </div>
      )}

      {checkInTarget && <CheckInModal officer={checkInTarget} onClose={()=>setCheckInTarget(null)} onSaved={()=>{ setCheckInTarget(null); load(); }}/>}
    </>
  );
}
