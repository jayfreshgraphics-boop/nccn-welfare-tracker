import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { S } from '../lib/helpers';

const REQUIRED_COLS = ['name', 'rank', 'unit'];
const VALID_STATUSES = ['GREEN', 'AMBER', 'RED'];

function normalizeStatus(val) {
  if (!val) return 'GREEN';
  const v = val.toString().toUpperCase().trim();
  return VALID_STATUSES.includes(v) ? v : 'GREEN';
}

function parseRows(rawRows) {
  // Normalize headers — lowercase, trim, remove spaces
  const headers = Object.keys(rawRows[0] || {}).reduce((acc, k) => {
    acc[k.toLowerCase().trim().replace(/\s+/g, '_')] = k;
    return acc;
  }, {});

  return rawRows.map((row, i) => {
    const get = (col) => {
      const originalKey = headers[col] || headers[col.replace('_',' ')];
      return originalKey ? (row[originalKey]||'').toString().trim() : '';
    };
    return {
      _row: i + 2,
      name:        get('name') || get('full_name') || get('officer_name'),
      rank:        get('rank') || get('title') || get('position'),
      unit:        get('unit') || get('unit_name') || get('platoon'),
      status:      normalizeStatus(get('status') || get('welfare_status')),
      assigned_to: get('assigned_to') || get('assigned') || get('welfare_officer') || '',
      notes:       get('notes') || get('remarks') || '',
      _valid: !!(get('name')||get('full_name')||get('officer_name')) && !!(get('rank')||get('title')||get('position')) && !!(get('unit')||get('unit_name')||get('platoon')),
    };
  }).filter(r => r.name || r.rank || r.unit); // skip totally empty rows
}

export default function BulkUploadModal({ onClose, onSaved }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  function handleFile(file) {
    if (!file) return;
    setFileName(file.name); setRows([]); setResult(null); setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval:'' });
        if (!raw.length) { setError('The file appears to be empty.'); return; }
        setRows(parseRows(raw));
      } catch(err) {
        setError('Could not read the file. Make sure it is a valid Excel (.xlsx) or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  const valid = rows.filter(r => r._valid);
  const invalid = rows.filter(r => !r._valid);

  async function importOfficers() {
    if (!valid.length) return;
    setLoading(true); setError('');
    const toInsert = valid.map(r => ({ name:r.name, rank:r.rank, unit:r.unit, status:r.status, assigned_to:r.assigned_to||'', notes:r.notes }));
    const { error, count } = await supabase.from('officers').insert(toInsert, { count:'exact' });
    if (error) { setError(error.message); setLoading(false); return; }
    setResult({ imported: toInsert.length });
    setLoading(false);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'rank', 'unit', 'status', 'notes'],
      ['CDT Amara Okafor', 'Cadet Officer', 'Alpha Unit', 'GREEN', ''],
      ['CDT Bisi Adeyemi', 'Training Officer', 'Bravo Unit', 'AMBER', 'Follow up needed'],
    ]);
    ws['!cols'] = [{ wch:28 },{ wch:22 },{ wch:18 },{ wch:10 },{ wch:30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Officers');
    XLSX.writeFile(wb, 'NCCN_Officers_Template.xlsx');
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth:620 }} onClick={e=>e.stopPropagation()}>
        <div style={S.mTitle}>📂 Bulk Upload Officers</div>

        {result ? (
          // ── Success screen ──
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:20, fontWeight:'bold', color:'#1e7e34', marginBottom:8 }}>{result.imported} officers imported!</div>
            <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>They are now live in the tracker.</div>
            <button style={S.btn()} onClick={onSaved}>View Officers</button>
          </div>
        ) : (
          <>
            {/* Template download */}
            <div style={{ background:'#eff4fa', borderRadius:8, padding:'12px 14px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:'bold', color:'#1a3a5c' }}>First time? Download the template</div>
                <div style={{ fontSize:12, color:'#666' }}>Fill it in Excel, save, then upload below.</div>
              </div>
              <button style={S.btn('#c8a800')} onClick={downloadTemplate}>⬇ Download Template</button>
            </div>

            {/* Column guide */}
            <div style={{ fontSize:12, color:'#555', marginBottom:14, lineHeight:1.7 }}>
              <strong>Required columns:</strong> <code>name</code>, <code>rank</code>, <code>unit</code><br/>
              <strong>Optional columns:</strong> <code>status</code> (GREEN / AMBER / RED — defaults to GREEN), <code>notes</code>
            </div>

            {/* Drop zone */}
            {!rows.length && (
              <div
                onDrop={handleDrop}
                onDragOver={e=>e.preventDefault()}
                onClick={()=>inputRef.current.click()}
                style={{ border:'2px dashed #c8d8e8', borderRadius:10, padding:'32px 20px', textAlign:'center', cursor:'pointer', background:'#f8fafc', marginBottom:14 }}
              >
                <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
                <div style={{ fontSize:14, color:'#1a3a5c', fontWeight:'bold' }}>Drop your Excel or CSV file here</div>
                <div style={{ fontSize:12, color:'#888', marginTop:4 }}>or click to browse</div>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
            )}

            {error && <div style={{ background:'#fce8e6', color:'#c62828', borderRadius:6, padding:'8px 12px', fontSize:13, marginBottom:12 }}>{error}</div>}

            {/* Preview table */}
            {rows.length > 0 && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:'bold', color:'#1a3a5c' }}>
                    📋 {fileName} — {rows.length} row{rows.length!==1?'s':''} found
                  </div>
                  <button style={{ ...S.btnOut, fontSize:12 }} onClick={()=>{ setRows([]); setFileName(''); }}>Change file</button>
                </div>

                {invalid.length > 0 && (
                  <div style={{ background:'#fff8e1', border:'1px solid #fbbc04', borderRadius:7, padding:'10px 12px', fontSize:12, color:'#b07d00', marginBottom:10 }}>
                    ⚠️ {invalid.length} row{invalid.length!==1?'s':''} will be skipped — missing name, rank, or unit (rows: {invalid.map(r=>r._row).join(', ')})
                  </div>
                )}

                <div style={{ maxHeight:240, overflowY:'auto', border:'1px solid #eee', borderRadius:7, marginBottom:14 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        {['#','Name','Rank','Unit','Status','Assigned To','Valid?'].map(h=>(
                          <th key={h} style={{ ...S.th, padding:'7px 10px', fontSize:11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r,i) => (
                        <tr key={i} style={{ background: !r._valid ? '#fff8e1' : i%2===0?'#fff':'#f8fafc' }}>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12, color:'#888' }}>{r._row}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12 }}>{r.name||<span style={{ color:'#c62828' }}>—</span>}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12 }}>{r.rank||<span style={{ color:'#c62828' }}>—</span>}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12 }}>{r.unit||<span style={{ color:'#c62828' }}>—</span>}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12 }}>
                            <span style={{ color: r.status==='GREEN'?'#1e7e34':r.status==='AMBER'?'#b07d00':'#c62828', fontWeight:'bold' }}>{r.status}</span>
                          </td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12, color: r.assigned_to?'#333':'#bbb', fontStyle: r.assigned_to?'normal':'italic' }}>
                            {r.assigned_to || 'Unassigned'}
                          </td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:13, textAlign:'center' }}>{r._valid?'✅':'⚠️'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <button style={{ ...S.btn(), opacity:(!valid.length||loading)?.7:1 }} onClick={importOfficers} disabled={!valid.length||loading}>
                    {loading ? 'Importing...' : `Import ${valid.length} Officer${valid.length!==1?'s':''}`}
                  </button>
                  <button style={S.btnOut} onClick={onClose}>Cancel</button>
                  {valid.length < rows.length && <span style={{ fontSize:12, color:'#888', marginLeft:4 }}>{invalid.length} row{invalid.length!==1?'s':''} will be skipped</span>}
                </div>
              </>
            )}

            {!rows.length && !error && (
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button style={S.btnOut} onClick={onClose}>Cancel</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
