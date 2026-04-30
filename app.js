const state = {
  lang: 'zh',
  entries: []
};

const i18n = {
  zh: {
    compose: '撰写', categories: '分类', featured: '精选',
    title: '标题', typeFilter: '类型筛选', all: '全部', thought: '随想', work: '工作日志',
    note: '第一版暂不支持直接写入 GitHub 仓库，先用于内容草拟与预览。'
  },
  en: {
    compose: 'Compose', categories: 'Categories', featured: 'Featured',
    title: 'Title', typeFilter: 'Type', all: 'All', thought: 'Thought', work: 'Work Log',
    note: 'V1 does not write to GitHub directly yet. Use this page for drafting and preview.'
  }
};

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === view));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
}

function applyLang() {
  const t = i18n[state.lang];
  const nav = document.querySelectorAll('.nav-btn');
  nav[0].textContent = t.compose;
  nav[1].textContent = t.categories;
  nav[2].textContent = t.featured;
  document.getElementById('entryTitle').placeholder = t.title;
  document.getElementById('filterLabel').textContent = t.typeFilter;
  document.querySelector('#filterType option[value="all"]').textContent = t.all;
  document.querySelector('#filterType option[value="thought"]').textContent = t.thought;
  document.querySelector('#filterType option[value="work"]').textContent = t.work;
  document.querySelector('#entryType option[value="thought"]').textContent = t.thought;
  document.querySelector('#entryType option[value="work"]').textContent = t.work;
  document.getElementById('composeNote').textContent = t.note;
}

function renderMarkdown() {
  const md = document.getElementById('markdownInput').value || '';
  document.getElementById('markdownPreview').innerHTML = marked.parse(md);
}

function renderCategories() {
  const type = document.getElementById('filterType').value;
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';

  const filtered = state.entries
    .filter(e => type === 'all' || e.type === type)
    .sort((a, b) => a.date < b.date ? 1 : -1);

  const grouped = {};
  for (const e of filtered) {
    const [y, m] = e.date.split('-');
    const key = `${y}-${m}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(e);
  }

  Object.keys(grouped).sort((a, b) => a < b ? 1 : -1).forEach(month => {
    const block = document.createElement('div');
    block.className = 'card';
    block.innerHTML = `<h3>${month}</h3>`;
    grouped[month].forEach(e => {
      const item = document.createElement('div');
      item.innerHTML = `<strong>${e.date}</strong> · ${e.title} <br/><small>Last edited: ${new Date(e.lastEdited).toLocaleString()}</small>`;
      block.appendChild(item);
    });
    timeline.appendChild(block);
  });
}

function renderFeatured() {
  const target = document.getElementById('featuredList');
  target.innerHTML = '';
  state.entries.filter(e => e.featured).forEach(e => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${e.title}</h3><p>${e.date}</p><div>${marked.parse(e.content)}</div>`;
    target.appendChild(card);
  });
}

async function init() {
  const res = await fetch('data/entries.json');
  state.entries = await res.json();
  applyLang();
  renderCategories();
  renderFeatured();
  renderMarkdown();
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
document.getElementById('langToggle').addEventListener('click', () => {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  document.getElementById('langToggle').textContent = state.lang === 'zh' ? 'EN' : '中';
  applyLang();
});
document.getElementById('themeToggle').addEventListener('click', () => {
  const body = document.body;
  const dark = body.dataset.theme === 'dark';
  body.dataset.theme = dark ? 'light' : 'dark';
});
document.getElementById('markdownInput').addEventListener('input', renderMarkdown);
document.getElementById('filterType').addEventListener('change', renderCategories);
document.getElementById('entryDate').valueAsDate = new Date();

init();
