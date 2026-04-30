const CONFIG = { owner: 'boltz22172', repo: 'Tristan-s-Daily', branch: 'work', indexPath: 'data/entries.json' };
const state = { lang: 'zh', entries: [], activeId: null };
const t = {
  zh: { compose: '撰写', list: '分类', featured: '精选', title: '标题', all: '全部', thought: '随想', work: '工作日志', typeFilter: '类型筛选' },
  en: { compose: 'Compose', list: 'Categories', featured: 'Featured', title: 'Title', all: 'All', thought: 'Thought', work: 'Work Log', typeFilter: 'Type' }
};
const $ = (id) => document.getElementById(id);

function setView(view) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === view));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
}
function slug(s) { return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, ''); }
function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
function mdToHtml(md) { return marked.parse(md || ''); }

function applyI18n() {
  const lang = t[state.lang];
  const nav = document.querySelectorAll('.nav-btn');
  nav[0].textContent = lang.compose; nav[1].textContent = lang.list; nav[2].textContent = lang.featured;
  $('titleInput').placeholder = lang.title;
  $('filterLabel').textContent = lang.typeFilter;
  document.querySelector('#filterType option[value="all"]').textContent = lang.all;
  document.querySelector('#filterType option[value="thought"]').textContent = lang.thought;
  document.querySelector('#filterType option[value="work"]').textContent = lang.work;
}

function currentEntryFromForm() {
  const title = $('titleInput').value.trim() || 'Untitled';
  const date = $('dateInput').value;
  const type = $('typeInput').value;
  const content = $('mdInput').value;
  const id = state.activeId || `${date}-${type}-${slug(title)}`;
  const [y, m] = date.split('-');
  const filePath = `entries/${y}/${m}/${slug(title)}.md`;
  return { id, title, date, type, featured: $('featuredInput').checked, lastEdited: new Date().toISOString(), filePath, content };
}

function fillForm(entry) {
  state.activeId = entry.id;
  $('titleInput').value = entry.title;
  $('dateInput').value = entry.date;
  $('typeInput').value = entry.type;
  $('featuredInput').checked = Boolean(entry.featured);
  $('mdInput').value = entry.content || '';
  $('editHint').textContent = `编辑中：${entry.title}`;
  $('preview').innerHTML = mdToHtml(entry.content);
  setView('compose');
}

function renderTimeline() {
  const filter = $('filterType').value;
  const target = $('timeline');
  target.innerHTML = '';
  const byMonth = {};
  state.entries
    .filter((e) => filter === 'all' || e.type === filter)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach((e) => {
      const month = e.date.slice(0, 7);
      byMonth[month] ||= [];
      byMonth[month].push(e);
    });

  Object.keys(byMonth).sort((a, b) => (a < b ? 1 : -1)).forEach((month) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${month}</h3>`;
    byMonth[month].forEach((e) => {
      const btn = document.createElement('button');
      btn.className = 'entry-link';
      btn.textContent = `${e.date} · ${e.title} (${e.type})`;
      btn.addEventListener('click', () => fillForm(e));
      card.appendChild(btn);
    });
    target.appendChild(card);
  });
}

function renderFeatured() {
  const target = $('featuredPanel');
  target.innerHTML = '';
  state.entries.filter((e) => e.featured).forEach((e) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${e.title}</h3><p>${e.date}</p><button class="entry-link">打开并编辑</button><div>${mdToHtml(e.content)}</div>`;
    card.querySelector('button').addEventListener('click', () => fillForm(e));
    target.appendChild(card);
  });
}

async function getSha(path, token) {
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha || null;
}

async function putFile(path, content, message, token) {
  const sha = await getSha(path, token);
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`;
  const payload = { message, branch: CONFIG.branch, content: b64(content), sha: sha || undefined };
  const res = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
}

async function saveEntry() {
  try {
    const token = localStorage.getItem('tristan_pat') || window.prompt('请输入 GitHub PAT（需要 repo 权限）');
    if (!token) throw new Error('缺少 GitHub PAT');
    localStorage.setItem('tristan_pat', token);

    const entry = currentEntryFromForm();
    const i = state.entries.findIndex((e) => e.id === entry.id);
    if (i === -1) state.entries.push(entry); else state.entries[i] = entry;

    await putFile(entry.filePath, entry.content.endsWith('\n') ? entry.content : `${entry.content}\n`, `feat: save ${entry.title}`, token);
    await putFile(CONFIG.indexPath, `${JSON.stringify(state.entries, null, 2)}\n`, `chore: update index ${entry.title}`, token);

    state.activeId = entry.id;
    $('status').textContent = `保存成功：${entry.filePath}`;
    $('editHint').textContent = `编辑中：${entry.title}`;
    renderTimeline();
    renderFeatured();
  } catch (e) {
    $('status').textContent = `保存失败：${e.message}`;
  }
}

async function init() {
  const res = await fetch(CONFIG.indexPath);
  state.entries = await res.json();
  $('dateInput').valueAsDate = new Date();
  applyI18n();
  renderTimeline();
  renderFeatured();
  $('preview').innerHTML = mdToHtml('');
}

$('mdInput').addEventListener('input', () => { $('preview').innerHTML = mdToHtml($('mdInput').value); });
$('filterType').addEventListener('change', renderTimeline);
$('saveBtn').addEventListener('click', saveEntry);
$('langBtn').addEventListener('click', () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; $('langBtn').textContent = state.lang === 'zh' ? 'EN' : '中'; applyI18n(); });
$('themeBtn').addEventListener('click', () => { document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; });
document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));

init();
