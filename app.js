const state = { lang: 'zh', entries: [], uploads: [], activeId: null, dirty: false };
const STORE = 'tristan_entries_v5';
const UPLOAD_STORE = 'tristan_uploads_v5';
const md = window.markdownit({ html: true, linkify: true, breaks: true, typographer: true }).use(window.markdownitMark).use(window.markdownitIns);

const $ = (id) => document.getElementById(id);

function renderMdInto(el, text) {
  el.innerHTML = md.render(text || '');
  el.querySelectorAll('pre code').forEach((b) => window.hljs && window.hljs.highlightElement(b));
  if (window.renderMathInElement) {
    window.renderMathInElement(el, { delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false }
    ] });
  }
}

function persist() {
  localStorage.setItem(STORE, JSON.stringify(state.entries));
  localStorage.setItem(UPLOAD_STORE, JSON.stringify(state.uploads));
}

function setView(view) {
  if (document.getElementById('compose').classList.contains('active') && state.dirty) {
    if (!window.confirm('检测到未保存内容，是否放弃并离开撰写页？')) return;
  }
  if (view !== 'compose') resetCompose();
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === view));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
}

function resetCompose() {
  state.activeId = null;
  $('titleInput').value = '';
  $('dateInput').valueAsDate = new Date();
  $('typeInput').value = 'thought';
  $('featuredInput').checked = false;
  $('mdInput').value = '';
  renderMdInto($('preview'), '');
  $('editHint').textContent = '';
  state.dirty = false;
}

function currentEntry() {
  const title = $('titleInput').value.trim() || 'Untitled';
  const date = $('dateInput').value;
  const type = $('typeInput').value;
  const id = state.activeId || `${date}-${type}-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return { id, title, date, type, featured: $('featuredInput').checked, content: $('mdInput').value, lastEdited: new Date().toISOString() };
}

function saveEntry() {
  const e = currentEntry();
  const i = state.entries.findIndex((x) => x.id === e.id);
  if (i >= 0) state.entries[i] = e; else state.entries.push(e);
  state.activeId = e.id;
  state.dirty = false;
  persist();
  $('status').textContent = `保存成功：${e.title}`;
  $('editHint').textContent = `编辑中：${e.title}`;
  renderDocs(); renderFeatured();
}

function editEntry(e) {
  state.activeId = e.id;
  $('titleInput').value = e.title; $('dateInput').value = e.date; $('typeInput').value = e.type; $('featuredInput').checked = !!e.featured; $('mdInput').value = e.content;
  renderMdInto($('preview'), e.content);
  state.dirty = false;
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'compose'));
}
function browseEntry(e) { renderMdInto($('readerContent'), `# ${e.title}\n\n${e.content}`); document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'reader')); }
function deleteEntry(id) { if (!window.confirm('是否删除该文档？')) return; state.entries = state.entries.filter((e) => e.id !== id); persist(); renderDocs(); renderFeatured(); $('status').textContent = '已删除文档'; }

function renderDocs() {
  const filter = $('filterType').value; const byMonth = {}; const target = $('timeline'); target.innerHTML = '';
  state.entries.filter((e) => filter === 'all' || e.type === filter).sort((a,b)=>a.date<b.date?1:-1).forEach((e)=>{const m=e.date.slice(0,7);(byMonth[m] ||= []).push(e);});
  Object.keys(byMonth).sort((a,b)=>a<b?1:-1).forEach((m)=>{const c=document.createElement('div');c.className='card';c.innerHTML=`<h3>${m}</h3>`;byMonth[m].forEach((e)=>{const row=document.createElement('div');row.className='form-row';row.innerHTML=`<span>${e.date} · ${e.title}</span><button class="browse-btn">浏览</button><button class="edit-btn">编辑</button><button class="delete-btn">删除</button>`;row.querySelector('.browse-btn').onclick=()=>browseEntry(e);row.querySelector('.edit-btn').onclick=()=>editEntry(e);row.querySelector('.delete-btn').onclick=()=>deleteEntry(e.id);c.appendChild(row)});target.appendChild(c);});
}
function renderFeatured() {
  const t = $('featuredPanel'); t.innerHTML = '';
  state.entries.filter((e)=>e.featured).forEach((e)=>{const c=document.createElement('div');c.className='card';c.innerHTML=`<h3>${e.title}</h3><div class="form-row"><button class="browse-btn">浏览</button><button class="edit-btn">编辑</button><button class="delete-btn">删除</button></div>`;c.querySelector('.browse-btn').onclick=()=>browseEntry(e);c.querySelector('.edit-btn').onclick=()=>editEntry(e);c.querySelector('.delete-btn').onclick=()=>deleteEntry(e.id);t.appendChild(c);});
}

function saveUploadAsEntry(file) {
  const type = $('uploadType').value;
  const featured = $('uploadFeatured').checked;
  if (file.kind !== 'md') return;
  const now = new Date();
  const date = now.toISOString().slice(0,10);
  const title = file.name.replace(/\.md$/i,'');
  const id = `${date}-${type}-${title.toLowerCase().replace(/\s+/g,'-')}`;
  const e = { id, title, date, type, featured, content: file.content, lastEdited: now.toISOString() };
  const i = state.entries.findIndex((x)=>x.id===id);
  if(i>=0) state.entries[i]=e; else state.entries.push(e);
  persist(); renderDocs(); renderFeatured();
}

function renderUploads() {
  const list = $('uploadList'); list.innerHTML = '';
  state.uploads.forEach((f, idx) => {
    const row = document.createElement('div'); row.className = 'form-row card';
    row.innerHTML = `<span>${f.name} (${f.kind})</span><button class="open-u">浏览</button><button class="save-u">保存到文档</button><button class="del-u">删除</button>`;
    row.querySelector('.open-u').onclick = () => openUpload(idx);
    row.querySelector('.save-u').onclick = () => { saveUploadAsEntry(f); $('status').textContent = `已保存上传文件：${f.name}`; };
    row.querySelector('.del-u').onclick = () => { if(window.confirm('是否删除该上传文件？')){ state.uploads.splice(idx,1); persist(); renderUploads(); $('filePreview').innerHTML=''; } };
    if (f.kind !== 'md') row.querySelector('.save-u').disabled = true;
    list.appendChild(row);
  });
}

function openUpload(idx) {
  const f = state.uploads[idx];
  if (f.kind === 'md') {
    $('filePreview').innerHTML = `<h3>${f.name}</h3><p>最后编辑：${new Date(f.lastEdited).toLocaleString()}</p><button id="importMd">导入到编辑器</button><div id="mdUploaded"></div>`;
    renderMdInto($('mdUploaded'), f.content);
    $('importMd').onclick = () => { $('titleInput').value = f.name.replace(/\.md$/i,''); $('mdInput').value = f.content; renderMdInto($('preview'), f.content); document.querySelectorAll('.view').forEach((v)=>v.classList.toggle('active', v.id==='compose')); state.dirty = true; };
  } else {
    $('filePreview').innerHTML = `<h3>${f.name}</h3><iframe src="${f.content}" class="pdf-frame"></iframe>`;
  }
}

async function handleUploads(files) {
  for (const file of files) {
    if (/\.md$/i.test(file.name)) state.uploads.push({ name:file.name, kind:'md', content: await file.text(), lastEdited:new Date().toISOString() });
    else if (/\.pdf$/i.test(file.name)) {
      const data = await new Promise((res)=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(file);});
      state.uploads.push({ name:file.name, kind:'pdf', content:data, lastEdited:new Date().toISOString() });
    }
  }
  persist(); renderUploads();
}

function init() {
  state.entries = JSON.parse(localStorage.getItem(STORE) || '[]');
  state.uploads = JSON.parse(localStorage.getItem(UPLOAD_STORE) || '[]');
  $('dateInput').valueAsDate = new Date();
  renderDocs(); renderFeatured(); renderUploads(); renderMdInto($('preview'), '');
}

$('mdInput').addEventListener('input', ()=>{ renderMdInto($('preview'), $('mdInput').value); state.dirty=true; });
$('titleInput').addEventListener('input', ()=>state.dirty=true);
$('typeInput').addEventListener('change', ()=>state.dirty=true);
$('featuredInput').addEventListener('change', ()=>state.dirty=true);
$('filterType').addEventListener('change', renderDocs);
$('saveBtn').addEventListener('click', saveEntry);
$('uploadInput').addEventListener('change', (e)=>handleUploads(e.target.files));
$('backBtn').addEventListener('click', ()=>setView('docs'));
document.querySelectorAll('.nav-btn').forEach((b)=>b.addEventListener('click', ()=>setView(b.dataset.view)));
$('langBtn').addEventListener('click', ()=>{ state.lang = state.lang==='zh'?'en':'zh'; $('langBtn').textContent = state.lang==='zh'?'EN':'中'; });
$('themeBtn').addEventListener('click', ()=>{ document.body.dataset.theme = document.body.dataset.theme==='dark'?'light':'dark'; });

init();
