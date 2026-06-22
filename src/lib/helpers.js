export const STATUS = {
  NOTSET: { bg:'#f1f1f1', text:'#777', border:'#bbb', dot:'#bbb', label:'Not Set' },
  GREEN:  { bg:'#e6f4ea', text:'#1e7e34', border:'#34a853', dot:'#34a853', label:'All Clear' },
  AMBER:  { bg:'#fff8e1', text:'#b07d00', border:'#fbbc04', dot:'#fbbc04', label:'Monitor' },
  RED:    { bg:'#fce8e6', text:'#c62828', border:'#ea4335', dot:'#ea4335', label:'Urgent' },
};

export function daysSince(d) {
  if (!d) return 'Never';
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  return diff === 0 ? 'Today' : diff === 1 ? '1 day ago' : `${diff} days ago`;
}

export function isOverdue(lastChecked) {
  if (!lastChecked) return true;
  return (Date.now() - new Date(lastChecked)) / 86400000 > 30;
}

export const S = {
  card: { background:'#fff', borderRadius:10, boxShadow:'0 1px 6px rgba(0,0,0,.08)', padding:18, marginBottom:18 },
  sTitle: { fontFamily:'Georgia,serif', fontSize:16, fontWeight:'bold', color:'#1a3a5c', marginBottom:14 },
  input: { border:'1px solid #ddd', borderRadius:6, padding:'8px 12px', fontSize:14, fontFamily:'Georgia,serif', width:'100%', boxSizing:'border-box' },
  select: { border:'1px solid #ddd', borderRadius:6, padding:'8px 12px', fontSize:14, fontFamily:'Georgia,serif', background:'#fff', cursor:'pointer' },
  btn: (c='#1a3a5c') => ({ background:c, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontSize:13, fontWeight:'bold', fontFamily:'Georgia,serif' }),
  btnOut: { background:'transparent', border:'1px solid #1a3a5c', color:'#1a3a5c', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:13, fontFamily:'Georgia,serif' },
  pill: s => ({ background:STATUS[s].bg, color:STATUS[s].text, border:`1px solid ${STATUS[s].border}`, borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:'bold', display:'inline-flex', alignItems:'center', gap:5 }),
  dot: s => ({ width:8, height:8, borderRadius:'50%', background:STATUS[s].dot, display:'inline-block' }),
  th: { background:'#1a3a5c', color:'#fff', padding:'9px 12px', textAlign:'left', fontSize:12, letterSpacing:1, fontFamily:'Georgia,serif', fontWeight:'bold' },
  td: { padding:'9px 12px', borderBottom:'1px solid #eee', fontSize:13, verticalAlign:'middle' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal: { background:'#fff', borderRadius:12, padding:24, width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,.25)' },
  mTitle: { fontFamily:'Georgia,serif', fontSize:17, fontWeight:'bold', color:'#1a3a5c', marginBottom:14, paddingBottom:8, borderBottom:'2px solid #c8a800' },
  label: { display:'block', fontSize:11, fontWeight:'bold', color:'#444', marginBottom:3, marginTop:10, letterSpacing:.5, textTransform:'uppercase' },
  row: { display:'flex', gap:14, marginBottom:18, flexWrap:'wrap' },
  stat: c => ({ background:'#fff', borderRadius:10, boxShadow:'0 1px 6px rgba(0,0,0,.08)', padding:'18px 20px', borderLeft:`5px solid ${c}`, flex:1, minWidth:110 }),
};
