const state = { lang: 'zh', entries: [] };

const i18n = {
  zh: { compose: '撰写', categories: '分类', featured: '精选', title: '标题', typeFilter: '类型筛选', all: '全部', thought: '随想', work: '工作日志' },
  en: { compose: 'Compose', categories: 'Categories', featured: 'Featured', title: 'Title', typeFilter: 'Type', all: 'All', thought: 'Thought', work: 'Work Log' }
};

const el = (id) => document.getElementById(id);

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === view));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
}

function applyLang() {
  const t = i18n[state.lang];
  const nav = document.querySelectorAll('.nav-btn');
  nav[0].textContent = t.compose; nav[1].textContent = t.categories; nav[2].textContent = t.featured;
  el('entryTitle').placeholder = t.title;
  el('filterLabel').textContent = t.typeFilter;
  document.querySelector('#filterType option[value="all"]').textContent = t.all;
  document.querySelector('#filterType option[value="thought"]').textContent = t.thought;
  document.querySelector('#filterType option[value="work"]').textContent = t.work;
}

function renderMarkdown() { el('markdownPreview').innerHTML = marked.parse(el('markdownInput').value || ''); }

function renderCategories() {
  const type = el('filterType').value;
  const timeline = el('timeline');
  timeline.innerHTML = '';
  const filtered = state.entries.filter(e => type === 'all' || e.type === type).sort((a, b) => a.date < b.date ? 1 : -1);
  const grouped = {};
  filtered.forEach(e => {
    const key = e.date.slice(0, 7);
    grouped[key] = grouped[key] || [];
    grouped[key].push(e);
  });
  Object.keys(grouped).sort((a, b) => a < b ? 1 : -1).forEach(month => {
    const block = document.createElement('div');
    block.className = 'card';
    block.innerHTML = `<h3>${month}</h3>`;
    grouped[month].forEach(e => {
      const item = document.createElement('button');
      item.className = 'entry-item';
      item.innerHTML = `<strong>${e.date}</strong> · ${e.title} <small>(${e.type})</small>`;
      item.onclick = () => loadEntryToComposer(e.id);
      block.appendChild(item);
    });
    timeline.appendChild(block);
  });
}

function renderFeatured() {
  const target = el('featuredList');
  target.innerHTML = '';
  state.entries.filter(e => e.featured).forEach(e => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${e.title}</h3><p>${e.date}</p><div>${marked.parse(e.content)}</div>`;
    target.appendChild(card);
  });
}

function getEditorEntry() {
  const date = el('entryDate').value;
  return {
    id: `${date}-${el('entryType').value}-${slugify(el('entryTitle').value || 'untitled')}`,
    title: el('entryTitle').value || 'Untitled',
    date,
    type: el('entryType').value,
    featured: el('entryFeatured').checked,
    lastEdited: new Date().toISOString(),
    content: el('markdownInput').value || ''
  };
}

function slugify(s) { return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, ''); }

function saveDraft() {
  const entry = getEditorEntry();
  const idx = state.entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) state.entries[idx] = entry; else state.entries.push(entry);
  renderCategories();
  renderFeatured();
  el('publishStatus').textContent = `已保存：${entry.title}`;
}

function loadEntryToComposer(id) {
  const e = state.entries.find(v => v.id === id);
  if (!e) return;
  switchView('compose');
  el('entryTitle').value = e.title;
  el('entryDate').value = e.date;
  el('entryType').value = e.type;
  el('entryFeatured').checked = e.featured;
  el('markdownInput').value = e.content;
  renderMarkdown();
}

async function publishToGitHub() {
  const owner = el('ghOwner').value.trim();
  const repo = el('ghRepo').value.trim();
  const branch = el('ghBranch').value.trim() || 'work';
  const token = el('ghToken').value.trim();
  if (!owner || !repo || !token) {
    el('publishStatus').textContent = '缺少 owner/repo/token';
    return;
  }
  saveDraft();
  const body = JSON.stringify(state.entries, null, 2) + '\n';
  const path = 'data/entries.json';

  let sha = undefined;
  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, { headers: { Authorization: `Bearer ${token}` } });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `chore: update entries (${new Date().toISOString()})`, content: btoa(unescape(encodeURIComponent(body))), branch, sha })
  });

  if (res.ok) el('publishStatus').textContent = '发布成功：data/entries.json 已更新';
  else el('publishStatus').textContent = `发布失败：${res.status}`;
}

async function init() {
  const res = await fetch('data/entries.json');
  state.entries = await res.json();
  applyLang(); renderCategories(); renderFeatured();
  el('entryDate').valueAsDate = new Date();
  renderMarkdown();
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
el('langToggle').addEventListener('click', () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; el('langToggle').textContent = state.lang === 'zh' ? 'EN' : '中'; applyLang(); });
el('themeToggle').addEventListener('click', () => { document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; });
el('markdownInput').addEventListener('input', renderMarkdown);
el('filterType').addEventListener('change', renderCategories);
el('saveDraftBtn').addEventListener('click', saveDraft);
el('publishBtn').addEventListener('click', publishToGitHub);

init();
