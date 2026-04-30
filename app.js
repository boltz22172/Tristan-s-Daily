const REPO_CONFIG = { owner: 'YOUR_GITHUB_OWNER', repo: 'Tristan-s-Daily', branch: 'work' };
const state = { lang: 'zh', entries: [], activeEntryId: null };
const i18n = {
  zh: { compose: '撰写', categories: '分类', featured: '精选', title: '标题', typeFilter: '类型筛选', all: '全部', thought: '随想', work: '工作日志' },
  en: { compose: 'Compose', categories: 'Categories', featured: 'Featured', title: 'Title', typeFilter: 'Type', all: 'All', thought: 'Thought', work: 'Work Log' }
};
const el = (id) => document.getElementById(id);
const b64 = (s) => btoa(unescape(encodeURIComponent(s)));

function switchView(view) { document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === view)); document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view)); }
function renderMarkdown() { el('markdownPreview').innerHTML = marked.parse(el('markdownInput').value || ''); }
function slugify(s) { return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, ''); }

function applyLang() {
  const t = i18n[state.lang], nav = document.querySelectorAll('.nav-btn');
  nav[0].textContent = t.compose; nav[1].textContent = t.categories; nav[2].textContent = t.featured;
  el('entryTitle').placeholder = t.title; el('filterLabel').textContent = t.typeFilter;
  document.querySelector('#filterType option[value="all"]').textContent = t.all;
  document.querySelector('#filterType option[value="thought"]').textContent = t.thought;
  document.querySelector('#filterType option[value="work"]').textContent = t.work;
}

function buildEntryFromEditor() {
  const date = el('entryDate').value;
  const title = el('entryTitle').value || 'Untitled';
  const type = el('entryType').value;
  const id = state.activeEntryId || `${date}-${type}-${slugify(title)}`;
  const [y, m] = date.split('-');
  const filePath = `entries/${y}/${m}/${slugify(title)}.md`;
  return { id, title, date, type, featured: el('entryFeatured').checked, lastEdited: new Date().toISOString(), filePath, content: el('markdownInput').value || '' };
}

function loadEntryToComposer(id) {
  const e = state.entries.find(v => v.id === id); if (!e) return;
  state.activeEntryId = e.id; switchView('compose');
  el('entryTitle').value = e.title; el('entryDate').value = e.date; el('entryType').value = e.type; el('entryFeatured').checked = e.featured; el('markdownInput').value = e.content || '';
  el('activeEntryHint').textContent = `编辑中：${e.title}`; renderMarkdown();
}

function renderCategories() {
  const type = el('filterType').value, timeline = el('timeline'); timeline.innerHTML = '';
  const filtered = state.entries.filter(e => type === 'all' || e.type === type).sort((a, b) => a.date < b.date ? 1 : -1);
  const grouped = {};
  filtered.forEach(e => { const key = e.date.slice(0, 7); (grouped[key] ||= []).push(e); });
  Object.keys(grouped).sort((a, b) => a < b ? 1 : -1).forEach(month => {
    const block = document.createElement('div'); block.className = 'card'; block.innerHTML = `<h3>${month}</h3>`;
    grouped[month].forEach(e => {
      const item = document.createElement('button'); item.className = 'entry-item';
      item.innerHTML = `<strong>${e.date}</strong> · ${e.title} <small>(${e.type})</small>`;
      item.addEventListener('click', () => loadEntryToComposer(e.id));
      block.appendChild(item);
    });
    timeline.appendChild(block);
  });
}

function renderFeatured() {
  const target = el('featuredList'); target.innerHTML = '';
  state.entries.filter(e => e.featured).forEach(e => {
    const card = document.createElement('article'); card.className = 'card';
    card.innerHTML = `<h3>${e.title}</h3><p>${e.date}</p><button class="entry-item">打开并编辑</button><div>${marked.parse(e.content || '')}</div>`;
    card.querySelector('button').addEventListener('click', () => loadEntryToComposer(e.id));
    target.appendChild(card);
  });
}

async function getContentSha(path, token) {
  const url = `https://api.github.com/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/contents/${path}?ref=${REPO_CONFIG.branch}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.sha;
}

async function putContent(path, raw, message, token) {
  const sha = await getContentSha(path, token);
  const url = `https://api.github.com/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: b64(raw), branch: REPO_CONFIG.branch, sha })
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

async function saveEntry() {
  try {
    if (REPO_CONFIG.owner === 'YOUR_GITHUB_OWNER') throw new Error('请先在 app.js 配置 REPO_CONFIG.owner');
    const token = localStorage.getItem('gh_pat') || window.prompt('请输入 GitHub PAT（repo 权限）');
    if (!token) throw new Error('未提供 token');
    localStorage.setItem('gh_pat', token);

    const entry = buildEntryFromEditor();
    const idx = state.entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) state.entries[idx] = entry; else state.entries.push(entry);
    state.activeEntryId = entry.id;

    await putContent(entry.filePath, entry.content.endsWith('\n') ? entry.content : `${entry.content}\n`, `feat: save entry ${entry.title}`, token);
    await putContent('data/entries.json', `${JSON.stringify(state.entries, null, 2)}\n`, `chore: update entries index (${entry.title})`, token);

    renderCategories(); renderFeatured();
    el('publishStatus').textContent = `保存成功：${entry.filePath}`;
    el('activeEntryHint').textContent = `编辑中：${entry.title}`;
  } catch (err) {
    el('publishStatus').textContent = `保存失败：${err.message}`;
  }
}

async function init() {
  const res = await fetch('data/entries.json');
  state.entries = await res.json();
  applyLang(); renderCategories(); renderFeatured(); renderMarkdown();
  el('entryDate').valueAsDate = new Date();
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
el('langToggle').addEventListener('click', () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; el('langToggle').textContent = state.lang === 'zh' ? 'EN' : '中'; applyLang(); });
el('themeToggle').addEventListener('click', () => { document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; });
el('markdownInput').addEventListener('input', renderMarkdown);
el('filterType').addEventListener('change', renderCategories);
el('saveBtn').addEventListener('click', saveEntry);

init();
