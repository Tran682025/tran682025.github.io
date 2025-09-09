// ===== consts / helpers
const LS_USER = 'pchord.user';
const LS_PREM = 'pchord.premium';
const PREFIX  = 'pchord.project.';
const TRASH   = 'pchord.trash.'; // soft delete

const $ = (s, r=document) => r.querySelector(s);
const out = $('#out');

const slug = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

const currentId = () => $('#projIdEl')?.value?.trim() || localStorage.getItem('pchord.currId') || '';
const setCurrentId = id => { localStorage.setItem('pchord.currId', id||''); if($('#projIdEl')) $('#projIdEl').value=id||''; uiRefresh(); };
const toast = m => { out.textContent = m; console.log(m); };

// ===== auth / premium demo
const getUser = () => { try{return JSON.parse(localStorage.getItem(LS_USER)||'null')}catch{return null} };
const setUser = u => localStorage.setItem(LS_USER, JSON.stringify(u));
const hasPrem = () => localStorage.getItem(LS_PREM) === '1';
const setPrem = v => localStorage.setItem(LS_PREM, v?'1':'0');

// ===== init
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',e=>e.preventDefault()));

  $('#btnLogin')?.addEventListener('click', onLogin);
  $('#btnLogout')?.addEventListener('click', onLogout);
  $('#btnBuyPremium')?.addEventListener('click', onBuyPremium);

  $('#btnSaveProject')?.addEventListener('click', onSaveProject);
  $('#btnOpenLast')?.addEventListener('click', onOpenLast);
  $('#btnList')?.addEventListener('click', onList);

  $('#btnDelete')?.addEventListener('click', onDelete);
  $('#btnTrash')?.addEventListener('click', onTrashList);
  $('#btnRestore')?.addEventListener('click', onRestore);
  $('#btnPurge')?.addEventListener('click', onPurge);

  $('#btnExportSrt')?.addEventListener('click', onExportSrt);
  $('#btnExportPdf')?.addEventListener('click', onExportPdf);

  uiRefresh();
});

// ===== UI state
function uiRefresh(){
  const user = getUser();
  const premium = hasPrem();
  const hasId = !!currentId();

  $('#premiumBadge')?.classList.toggle('hidden', !premium);
  $('#btnBuyPremium')?.toggleAttribute('disabled', premium);
  $('#btnLogin')?.classList.toggle('hidden', !!user);
  $('#btnLogout')?.classList.toggle('hidden', !user);

  ['#btnDelete','#btnRestore','#btnPurge'].forEach(sel => $(sel)?.toggleAttribute('disabled', !hasId));
  $('#btnExportPdf')?.toggleAttribute('disabled', !premium);

  $('#idTip')?.classList.toggle('hidden', hasId);
}

// ===== Auth/Premium (thay bằng PiSDK sau)
async function onLogin(){
  // TODO: Pi.authenticate(...)
  const fake = { username: 'Tranmarket', uid: 'uid_'+Date.now() };
  setUser(fake);
  toast(`Xin chào, ${fake.username}!`);
  uiRefresh();
}
function onLogout(){
  localStorage.removeItem(LS_USER);
  setPrem(false);
  toast('Đã đăng xuất.');
  uiRefresh();
}
async function onBuyPremium(){
  const u = getUser(); if(!u){ toast('Hãy đăng nhập trước.'); return; }
  // TODO: Pi.createPayment(...)
  setPrem(true);
  toast('Kích hoạt Premium (demo) thành công ✅');
  uiRefresh();
}

// ===== Projects (localStorage demo)
function read(id){ return JSON.parse(localStorage.getItem(PREFIX+id)||'null'); }
function write(rec){ localStorage.setItem(PREFIX+rec.id, JSON.stringify(rec)); }
function del(id){ const rec = read(id); if(rec){ localStorage.setItem(TRASH+id, JSON.stringify(rec)); localStorage.removeItem(PREFIX+id); } }
function purge(id){ localStorage.removeItem(PREFIX+id); localStorage.removeItem(TRASH+id); }

function onSaveProject(){
  const title = $('#titleEl')?.value?.trim() || 'Untitled';
  const raw   = $('#chartEl')?.value || '';
  let id = currentId();
  if(!id) id = `${slug(title)||'untitled'}-${Date.now().toString(36)}`;
  const rec = { id, title, raw, ts: Date.now() };
  write(rec);
  setCurrentId(id);
  localStorage.setItem('pchord.last', id);
  toast(`Đã lưu: ${title}\nID: ${id}`);
}
function onOpenLast(){
  const id = localStorage.getItem('pchord.last');
  if(!id){ toast('Chưa có bản lưu nào.'); return; }
  const rec = read(id); if(!rec){ toast('Không tìm thấy project.'); return; }
  $('#titleEl').value = rec.title; $('#chartEl').value = rec.raw; setCurrentId(rec.id);
  toast('Đã mở bản gần nhất.');
}
function onList(){
  const keys = Object.keys(localStorage).filter(k=>k.startsWith(PREFIX));
  if(!keys.length){ toast('Chưa có project nào.'); return; }
  const list = keys.map(k=>JSON.parse(localStorage.getItem(k))).sort((a,b)=>b.ts-a.ts);
  const pick = prompt('Chọn ID:\n'+list.map(x=>`${x.id} — ${x.title}`).join('\n'));
  if(pick){ const rec = read(pick); if(rec){ $('#titleEl').value=rec.title; $('#chartEl').value=rec.raw; setCurrentId(rec.id); toast('Đã mở '+rec.title); } }
}
function onDelete(){
  const id = currentId(); if(!id){ toast('Chưa có ID.'); return; }
  del(id); setCurrentId('');
  toast('Đã đưa vào Thùng rác.');
}
function onTrashList(){
  const keys = Object.keys(localStorage).filter(k=>k.startsWith(TRASH));
  if(!keys.length){ toast('Thùng rác trống.'); return; }
  const list = keys.map(k=>JSON.parse(localStorage.getItem(k)));
  toast('Trong thùng rác:\n'+list.map(x=>`${x.id} — ${x.title}`).join('\n'));
}
function onRestore(){
  const id = currentId(); if(!id){ toast('Chưa có ID.'); return; }
  const rec = JSON.parse(localStorage.getItem(TRASH+id)||'null');
  if(!rec){ toast('Không có trong thùng rác.'); return; }
  write(rec); localStorage.removeItem(TRASH+id);
  toast('Đã khôi phục.');
}
function onPurge(){
  const id = currentId(); if(!id){ toast('Chưa có ID.'); return; }
  purge(id); setCurrentId('');
  toast('Đã xoá vĩnh viễn.');
}

// ===== Export
function parseLines(text, dur){
  const lines = (text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  return lines.map((line,i)=>({ i:i+1, t:i*dur, d:dur, text: line }));
}
function fmtTs(sec){
  const s=Math.max(0,Math.floor(sec)), ms=Math.round((sec-s)*1000);
  const hh=String(Math.floor(s/3600)).padStart(2,'0');
  const mm=String(Math.floor((s%3600)/60)).padStart(2,'0');
  const ss=String(s%60).padStart(2,'0'); const mss=String(ms).padStart(3,'0');
  return `${hh}:${mm}:${ss},${mss}`;
}
function download(name, blob){
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}

async function onExportSrt(){
  const title = $('#titleEl')?.value?.trim() || 'Chord Sheet';
  const dur   = Number($('#durEl')?.value || 2);
  const raw   = $('#chartEl')?.value || '';
  const items = parseLines(raw, dur);
  if(!items.length){ toast('Không thấy dòng hợp lệ.'); return; }
  const srt = items.map((it,idx)=>`${idx+1}\n${fmtTs(it.t)} --> ${fmtTs(it.t+it.d)}\n${it.text}\n`).join('\n');
  download(`${title}.srt`, new Blob([srt],{type:'text/plain;charset=utf-8'}));
  toast('Đã tải .srt');
}

async function onExportPdf(){
  if(!hasPrem()){ toast('Tính năng PDF dành cho Premium.'); return; }
  const title = $('#titleEl')?.value?.trim() || 'Chord Sheet';
  const dur   = Number($('#durEl')?.value || 2);
  const raw   = $('#chartEl')?.value || '';
  const items = parseLines(raw, dur);
  if(!items.length){ toast('Không thấy dòng hợp lệ.'); return; }

  // Fallback client-only: tạo file HTML để in ra PDF
  const html = `<!doctype html><meta charset="utf-8">
  <style>body{font-family:system-ui,Arial;margin:24px} h1{margin:0 0 12px}</style>
  <h1>${title}</h1>
  <pre>${items.map(x=>x.text).join('\n')}</pre>`;
  download(`${title}.pdf.html`, new Blob([html],{type:'application/octet-stream'}));
  toast('Đã xuất bản in (mở file → In → Lưu PDF).');
}
