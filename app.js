const state = { lang: 'zh', entries: [], activeId: null, dirty: false, uploads: [] };
const t = {
  zh: { compose: '撰写', docs: '文档', featured: '精选', uploads: '上传文件', title: '标题', all: '全部', thought: '随想', work: '工作日志', typeFilter: '类型筛选' },
  en: { compose: 'Compose', docs: 'Docs', featured: 'Featured', uploads: 'Uploads', title: 'Title', all: 'All', thought: 'Thought', work: 'Work Log', typeFilter: 'Type' }
};
const $ = (id) => document.getElementById(id);
const STORE = 'tristan_entries_v3';
const UPLOAD_STORE = 'tristan_uploads_v3';
const EDIT_VIEWS = new Set(['docs', 'featured', 'uploads', 'reader']);

function renderMdInto(el, md) {
  el.innerHTML = marked.parse(md || '');
  if (window.renderMathInElement) {
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ]
    });
  }
}

function resetComposer() {
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

function setView(view) {
  if (EDIT_VIEWS.has(view)) resetComposer();
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === view));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
}

function slug(s) { return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, ''); }
function applyI18n() {
  const lang = t[state.lang];
  const nav = document.querySelectorAll('.nav-btn');
  nav[0].textContent = lang.compose; nav[1].textContent = lang.docs; nav[2].textContent = lang.featured; nav[3].textContent = lang.uploads;
  $('titleInput').placeholder = lang.title; $('filterLabel').textContent = lang.typeFilter;
  document.querySelector('#filterType option[value="all"]').textContent = lang.all;
  document.querySelector('#filterType option[value="thought"]').textContent = lang.thought;
  document.querySelector('#filterType option[value="work"]').textContent = lang.work;
}
function persistEntries() { localStorage.setItem(STORE, JSON.stringify(state.entries)); }
function persistUploads() { localStorage.setItem(UPLOAD_STORE, JSON.stringify(state.uploads)); }

function currentEntryFromForm() {
  const title = $('titleInput').value.trim() || 'Untitled';
  const date = $('dateInput').value;
  const type = $('typeInput').value;
  const id = state.activeId || `${date}-${type}-${slug(title)}`;
  return { id, title, date, type, featured: $('featuredInput').checked, lastEdited: new Date().toISOString(), content: $('mdInput').value };
}

function editEntry(entry) {
  state.activeId = entry.id;
  $('titleInput').value = entry.title;
  $('dateInput').value = entry.date;
  $('typeInput').value = entry.type;
  $('featuredInput').checked = Boolean(entry.featured);
  $('mdInput').value = entry.content || '';
  $('editHint').textContent = `编辑中：${entry.title}`;
  renderMdInto($('preview'), entry.content || '');
  state.dirty = false;
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'compose'));
}

function browseEntry(entry) {
  renderMdInto($('readerContent'), `# ${entry.title}\n\n${entry.content || ''}`);
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'reader'));
}

function saveEntry() {
  const entry = currentEntryFromForm();
  const i = state.entries.findIndex((e) => e.id === entry.id);
  if (i === -1) state.entries.push(entry); else state.entries[i] = entry;
  state.activeId = entry.id; state.dirty = false;
  persistEntries(); renderDocs(); renderFeatured();
  $('status').textContent = `保存成功：${entry.title}`; $('editHint').textContent = `编辑中：${entry.title}`;
}

function renderDocs() {
  const filter = $('filterType').value, target = $('timeline'); target.innerHTML = '';
  const byMonth = {};
  state.entries.filter((e) => filter === 'all' || e.type === filter).sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((e) => { const m = e.date.slice(0, 7); (byMonth[m] ||= []).push(e); });
  Object.keys(byMonth).sort((a, b) => (a < b ? 1 : -1)).forEach((month) => {
    const card = document.createElement('div'); card.className = 'card'; card.innerHTML = `<h3>${month}</h3>`;
    byMonth[month].forEach((e) => {
      const row = document.createElement('div'); row.className = 'form-row';
      row.innerHTML = `<span>${e.date} · ${e.title} (${e.type})</span><button class="browse-btn">浏览</button><button class="edit-btn">编辑</button>`;
      row.querySelector('.browse-btn').addEventListener('click', () => browseEntry(e));
      row.querySelector('.edit-btn').addEventListener('click', () => editEntry(e));
      card.appendChild(row);
    });
    target.appendChild(card);
  });
}

function renderFeatured() {
  const target = $('featuredPanel'); target.innerHTML = '';
  state.entries.filter((e) => e.featured).forEach((e) => {
    const card = document.createElement('article'); card.className = 'card';
    card.innerHTML = `<h3>${e.title}</h3><p>${e.date}</p><div class="form-row"><button class="browse-btn">浏览</button><button class="edit-btn">编辑</button></div>`;
    card.querySelector('.browse-btn').addEventListener('click', () => browseEntry(e));
    card.querySelector('.edit-btn').addEventListener('click', () => editEntry(e));
    target.appendChild(card);
  });
}

function renderUploads() { const list = $('uploadList'); list.innerHTML = ''; state.uploads.forEach((f, idx) => { const btn = document.createElement('button'); btn.className = 'entry-link'; btn.textContent = `${f.name} (${f.kind})`; btn.addEventListener('click', () => openUpload(idx)); list.appendChild(btn); }); }
function openUpload(idx) {
  const f = state.uploads[idx], target = $('filePreview');
  if (f.kind === 'md') {
    target.innerHTML = `<h3>${f.name}</h3><p>最后编辑：${new Date(f.lastEdited).toLocaleString()}</p><button id="importMd">导入到编辑器</button><div id="mdUploaded"></div>`;
    renderMdInto($('mdUploaded'), f.content);
    $('importMd').addEventListener('click', () => { $('titleInput').value = f.name.replace(/\.md$/i, ''); $('mdInput').value = f.content; renderMdInto($('preview'), f.content); document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'compose')); });
  } else target.innerHTML = `<h3>${f.name}</h3><iframe src="${f.content}" class="pdf-frame"></iframe>`;
}
async function handleUploads(files) { for (const file of files) { if (file.name.toLowerCase().endsWith('.md')) { const content = await file.text(); state.uploads.push({ name: file.name, kind: 'md', content, lastEdited: new Date().toISOString() }); } else if (file.name.toLowerCase().endsWith('.pdf')) { const dataUrl = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); }); state.uploads.push({ name: file.name, kind: 'pdf', content: dataUrl, lastEdited: new Date().toISOString() }); } } persistUploads(); renderUploads(); }

function init() { state.entries = JSON.parse(localStorage.getItem(STORE) || '[]'); state.uploads = JSON.parse(localStorage.getItem(UPLOAD_STORE) || '[]'); $('dateInput').valueAsDate = new Date(); applyI18n(); renderDocs(); renderFeatured(); renderUploads(); }

$('mdInput').addEventListener('input', () => { renderMdInto($('preview'), $('mdInput').value); state.dirty = true; });
$('titleInput').addEventListener('input', () => state.dirty = true);
$('typeInput').addEventListener('change', () => state.dirty = true);
$('featuredInput').addEventListener('change', () => state.dirty = true);
$('filterType').addEventListener('change', renderDocs);
$('saveBtn').addEventListener('click', saveEntry);
$('uploadInput').addEventListener('change', (e) => handleUploads(e.target.files));
$('backBtn').addEventListener('click', () => setView('docs'));
$('langBtn').addEventListener('click', () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; $('langBtn').textContent = state.lang === 'zh' ? 'EN' : '中'; applyI18n(); });
$('themeBtn').addEventListener('click', () => { document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; });
document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));

init();
