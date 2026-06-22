import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STATUS, daysSince, isOverdue, S } from '../lib/helpers';
import CheckInModal from '../components/CheckInModal';

export default function Dashboard() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInTarget, setCheckInTarget] = useState(null);

  async function load() {
    const { data } = await supabase.from('officers').select('*').order('name');
    setOfficers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'#888' }}>Loading...</div>;

  const counts = {
    NOTSET:  officers.filter(o=>o.status==='NOTSET').length,
    GREEN:   officers.filter(o=>o.status==='GREEN').length,
    AMBER:   officers.filter(o=>o.status==='AMBER').length,
    RED:     officers.filter(o=>o.status==='RED').length,
    overdue: officers.filter(o=>isOverdue(o.last_checked)).length,
  };
  const units = Array.from(new Set(officers.map(o=>o.unit)));
  const recent = [...officers].sort((a,b)=>new Date(b.last_checked||0)-new Date(a.last_checked||0)).slice(0,6);

  return (
    <>
      <div style={S.row}>
        {[['#bbb',counts.NOTSET,'⚪ Not Set'],['#34a853',counts.GREEN,'🟢 All Clear'],['#fbbc04',counts.AMBER,'🟡 Monitoring'],['#ea4335',counts.RED,'🔴 Urgent'],['#1a3a5c',counts.overdue,'⏰ Overdue'],['#666',officers.length,'👥 Total']].map(([c,n,lbl])=>(
          <div key={lbl} style={S.stat(c)}>
            <div style={{ fontSize:32, fontWeight:'bold', color:c==='#666'?'#333':c }}>{n}</div>
            <div style={{ fontSize:12, color:'#666', marginTop:3 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.sTitle}>📍 Status by Unit</div>
        {units.length===0 && <div style={{ color:'#888', fontSize:13 }}>No officers added yet.</div>}
        {units.map(unit => {
          const uo = officers.filter(o=>o.unit===unit);
          const n=uo.filter(o=>o.status==='NOTSET').length, g=uo.filter(o=>o.status==='GREEN').length, a=uo.filter(o=>o.status==='AMBER').length, r=uo.filter(o=>o.status==='RED').length;
          return (
            <div key={unit} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, fontSize:13 }}>
                <strong style={{ color:'#1a3a5c' }}>{unit}</strong>
                <span><span style={{ color:'#999' }}>●{n}</span> <span style={{ color:'#1e7e34' }}>●{g}</span> <span style={{ color:'#b07d00' }}>●{a}</span> <span style={{ color:'#c62828' }}>●{r}</span></span>
              </div>
              <div style={{ height:8, background:'#eee', borderRadius:4, overflow:'hidden', display:'flex' }}>
                {n>0&&<div style={{ width:`${n/uo.length*100}%`, background:'#bbb' }}/>}
                {g>0&&<div style={{ width:`${g/uo.length*100}%`, background:'#34a853' }}/>}
                {a>0&&<div style={{ width:`${a/uo.length*100}%`, background:'#fbbc04' }}/>}
                {r>0&&<div style={{ width:`${r/uo.length*100}%`, background:'#ea4335' }}/>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={S.card}>
        <div style={S.sTitle}>📋 Recent Check-ins</div>
        {recent.length===0 ? <div style={{ color:'#888', fontSize:13 }}>No check-ins recorded yet.</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Officer','Unit','Status','Last Check-in','Action'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {recent.map((o,i)=>(
                  <tr key={o.id} style={{ background:i%2===0?'#fff':'#f8fafc' }}>
                    <td style={S.td}><strong>{o.name}</strong>{o.rank && <div style={{ fontSize:11,color:'#888' }}>{o.rank}</div>}</td>
                    <td style={S.td}>{o.unit}</td>
                    <td style={S.td}><span style={S.pill(o.status)}><span style={S.dot(o.status)}/>{STATUS[o.status].label}</span></td>
                    <td style={{ ...S.td, color:isOverdue(o.last_checked)?'#c62828':'#333', fontWeight:isOverdue(o.last_checked)?'bold':'normal' }}>{daysSince(o.last_checked)}</td>
                    <td style={S.td}><button style={S.btn()} onClick={()=>setCheckInTarget(o)}>Check In</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {checkInTarget && <CheckInModal officer={checkInTarget} onClose={()=>setCheckInTarget(null)} onSaved={()=>{ setCheckInTarget(null); load(); }}/>}
    </>
  );
}
