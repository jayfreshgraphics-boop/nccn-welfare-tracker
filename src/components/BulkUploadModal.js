import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { S } from '../lib/helpers';

const VALID_STATUSES = ['NOTSET', 'GREEN', 'AMBER', 'RED'];

function normalizeStatus(val) {
  if (!val) return 'NOTSET';
  const v = val.toString().toUpperCase().trim();
  return VALID_STATUSES.includes(v) ? v : 'NOTSET';
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
      name:          get('name') || get('full_name') || get('officer_name'),
      rank:          get('rank') || get('title') || get('position') || '',
      unit:          get('unit') || get('designation') || get('status') || get('platoon') || '',
      welfare_status:normalizeStatus(get('welfare_status') || get('welfare')),
      assigned_to:   get('assigned_to') || get('assigned') || get('welfare_officer') || '',
      intake_number: get('intake_number') || get('intake') || '',
      email:         get('email') || get('email_address') || '',
      phone:         get('phone') || get('phone_number') || get('phone number') || '',
      address:       get('home_address') || get('address') || '',
      faculty_dept:  get('faculty_and_department_in_school_(if_student)') || get('faculty_and_department') || get('faculty_dept') || get('department') || get('faculty') || '',
      notes:         get('notes') || get('remarks') || '',
      _valid: !!(get('name')||get('full_name')||get('officer_name')) && !!(get('unit')||get('designation')||get('status')||get('platoon')),
    };
  }).filter(r => r.name || r.unit); // skip totally empty rows
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
    const toInsert = valid.map(r => ({
      name: r.name, rank: r.rank, unit: r.unit, status: r.welfare_status,
      assigned_to: r.assigned_to, intake_number: r.intake_number,
      email: r.email, phone: r.phone, address: r.address,
      faculty_dept: r.faculty_dept, notes: r.notes,
    }));
    const { error } = await supabase.from('officers').insert(toInsert, { count:'exact' });
    if (error) { setError(error.message); setLoading(false); return; }
    setResult({ imported: toInsert.length });
    setLoading(false);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Designation', 'Intake Number', 'Email', 'Phone number', 'Home Address', 'Faculty and Department in School (if student)', 'Welfare_Status'],
      ['CDT. Amara Okafor', 'Oaustech Unit 9', '9', 'amara.okafor@gmail.com', '8012345678', 'No 5 Example Street, Okitipupa', 'Faculty of Engineering, Electrical Engineering', ''],
      ['CDT. Bisi Adeyemi', 'Akure Unit 8', '8', 'bisi.adeyemi@gmail.com', '8023456789', 'No 12 Sample Road, Akure', 'Faculty of Science, Biochemistry', 'AMBER'],
    ]);
    ws['!cols'] = [{ wch:28 },{ wch:18 },{ wch:12 },{ wch:26 },{ wch:14 },{ wch:32 },{ wch:34 },{ wch:14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Officers');
    XLSX.writeFile(wb, 'NCCN_Officers_Template.xlsx');
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth:680 }} onClick={e=>e.stopPropagation()}>
        <div style={S.mTitle}>📂 Bulk Upload Officers</div>

        {result ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:20, fontWeight:'bold', color:'#1e7e34', marginBottom:8 }}>{result.imported} officers imported!</div>
            <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>They are now live in the tracker with welfare status set to "Not Set" unless specified.</div>
            <button style={S.btn()} onClick={onSaved}>View Officers</button>
          </div>
        ) : (
          <>
            <div style={{ background:'#eff4fa', borderRadius:8, padding:'12px 14px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:'bold', color:'#1a3a5c' }}>First time? Download the template</div>
                <div style={{ fontSize:12, color:'#666' }}>Fill it in Excel, save, then upload below.</div>
              </div>
              <button style={S.btn('#c8a800')} onClick={downloadTemplate}>⬇ Download Template</button>
            </div>

            <div style={{ fontSize:12, color:'#555', marginBottom:14, lineHeight:1.7 }}>
              <strong>Required columns:</strong> <code>Name</code>, <code>Designation</code> (used as Unit)<br/>
              <strong>Optional columns:</strong> <code>Intake Number</code>, <code>Email</code>, <code>Phone number</code>, <code>Home Address</code>, <code>Faculty and Department</code>, <code>Welfare_Status</code> (GREEN/AMBER/RED — leave blank for "Not Set")
            </div>

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
                    ⚠️ {invalid.length} row{invalid.length!==1?'s':''} will be skipped — missing name or designation/unit (rows: {invalid.map(r=>r._row).join(', ')})
                  </div>
                )}

                <div style={{ maxHeight:280, overflowY:'auto', border:'1px solid #eee', borderRadius:7, marginBottom:14 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        {['#','Name','Unit','Email','Phone','Status','Valid?'].map(h=>(
                          <th key={h} style={{ ...S.th, padding:'7px 10px', fontSize:11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r,i) => (
                        <tr key={i} style={{ background: !r._valid ? '#fff8e1' : i%2===0?'#fff':'#f8fafc' }}>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12, color:'#888' }}>{r._row}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12 }}>{r.name||<span style={{ color:'#c62828' }}>—</span>}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12 }}>{r.unit||<span style={{ color:'#c62828' }}>—</span>}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:11, color:'#666' }}>{r.email || '—'}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:11, color:'#666' }}>{r.phone || '—'}</td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:12 }}>
                            <span style={{ color: r.welfare_status==='GREEN'?'#1e7e34':r.welfare_status==='AMBER'?'#b07d00':r.welfare_status==='RED'?'#c62828':'#999', fontWeight:'bold' }}>
                              {r.welfare_status==='NOTSET' ? 'Not Set' : r.welfare_status}
                            </span>
                          </td>
                          <td style={{ ...S.td, padding:'6px 10px', fontSize:13, textAlign:'center' }}>{r._valid?'✅':'⚠️'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
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
