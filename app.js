const state = { lang: 'zh', entries: [], uploads: [], activeId: null, dirty: false, settings: { theme:'desert', fontZh:'kaiti', fontEn:'times', previewOpacity:0.75 } };
const STORE='tristan_entries_v6', USTORE='tristan_uploads_v6', SSTORE='tristan_settings_v1';
const FONT_STACKS = {
  xingkai: '"STXingkai","KaiTi","Kaiti SC","DFKai-SB",cursive',
  kaiti: '"STKaiti","KaiTi","Kaiti SC",serif',
  song: '"Songti SC","SimSun","PMingLiU",serif',
  hei: '"PingFang SC","Microsoft YaHei","Heiti SC",sans-serif',
  times: '"Times New Roman",serif',
  georgia: 'Georgia,serif',
};
const THEMES = {
  desert: { quote: '大漠孤烟直，长河落日圆', bg: '#efe2c8', image: 'picture/bg_sand.png', bodyBg: 'linear-gradient(120deg,#f7ebd34d,#0000 45%)' },
  snow: { quote: '柴门闻犬吠，风雪夜归人', bg: '#eef3f8', image: 'picture/bg_ice.png', bodyBg: 'linear-gradient(120deg,#ffffff66,#d9e6f04d 45%)' },
  bamboo: { quote: '苍苍竹林寺，杳杳钟声晚', bg: '#e6f2e5', image: 'picture/bg_bamboo.png', bodyBg: 'linear-gradient(120deg,#f3fff34d,#c7e2cb4d 45%)' },
  smoke: { quote: '凭君莫话封侯事，一将功成万骨枯', bg: '#f3d9d4', image: 'picture/bg_cloud.png', bodyBg: 'linear-gradient(120deg,#e14b3e55,#f8d4d055 45%)' },
  rain: { quote: '雨急山溪涨，云迷岭树低', bg: '#d8e2f0', image: 'picture/bg_rain.png', bodyBg: 'linear-gradient(120deg,#1c355d55,#6b8ecb44 45%)' },
  thunder: { quote: '青海长云暗雪山，孤城遥望玉门关', bg: '#ece7f6', image: 'picture/bg_thunder.png', bodyBg: 'linear-gradient(120deg,#d8c7ff66,#f6f3ff55 45%)' },
};
const md=window.markdownit({html:true,linkify:true,breaks:true,typographer:true})
  .use(window.markdownitMark)
  .use(window.markdownitIns)
  .use(window.texmath,{engine:window.katex,delimiters:'dollars',katexOptions:{throwOnError:false}})
  .use(window.texmath,{engine:window.katex,delimiters:'brackets',katexOptions:{throwOnError:false}})
  .use(window.markdownitContainer,'quote',{render:(tokens,idx)=>tokens[idx].nesting===1?'<blockquote class="md-quote">':'</blockquote>'})
  .use(window.markdownitContainer,'comment',{render:(tokens,idx)=>tokens[idx].nesting===1?'<div class="md-comment">':'</div>'});

// Keep native blockquotes available, but render the quote container with the same look.
md.renderer.rules.blockquote_open = () => '<blockquote class="md-quote">';
md.renderer.rules.blockquote_close = () => '</blockquote>';

// Custom underline syntax: {{u:text}} -> <u>text</u>, token-safe on inline text tokens only
md.core.ruler.push('custom_underline', (state) => {
  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children) continue;
    const out = [];
    for (const child of token.children) {
      if (child.type !== 'text') { out.push(child); continue; }
      const src = child.content;
      let last = 0;
      const re = /\{\{u:([\s\S]*?)\}\}/g;
      let m;
      while ((m = re.exec(src)) !== null) {
        if (m.index > last) {
          const t = new state.Token('text', '', 0);
          t.content = src.slice(last, m.index);
          out.push(t);
        }
        const open = new state.Token('html_inline', '', 0); open.content = '<u>';
        const txt = new state.Token('text', '', 0); txt.content = m[1];
        const close = new state.Token('html_inline', '', 0); close.content = '</u>';
        out.push(open, txt, close);
        last = re.lastIndex;
      }
      if (last === 0) { out.push(child); }
      else if (last < src.length) {
        const tail = new state.Token('text', '', 0);
        tail.content = src.slice(last);
        out.push(tail);
      }
    }
    token.children = out;
  }
});
const $=(id)=>document.getElementById(id);
const dict={zh:{compose:'撰写',docs:'文档',featured:'精选',uploads:'上传文件',save:'保存',settings:'设置',language:'语言',theme:'主题',fontZh:'中文字体',fontEn:'英文字体',previewOpacity:'渲染区透明度',backDocs:'返回文档',setFeatured:'设为精选',thought:'随想',work:'工作日志',all:'全部',filter:'类型筛选',titlePH:'标题',mdPH:'开始写作（支持公式与代码）',unsaved:'检测到未保存内容，是否放弃并离开撰写页？',delDoc:'是否删除该文档？',delUpload:'是否删除该上传文件？',saved:'保存成功：',editing:'编辑中：',newStatus:'未保存',savedUpload:'已保存上传文件：',pdfSaved:'PDF 文档已保存'},en:{compose:'Compose',docs:'Documents',featured:'Featured',uploads:'Uploads',save:'Save',settings:'Settings',language:'Language',theme:'Theme',fontZh:'Chinese Font',fontEn:'English Font',previewOpacity:'Preview Opacity',backDocs:'Back to Documents',setFeatured:'Set Featured',thought:'Thought',work:'Work Log',all:'All',filter:'Type Filter',titlePH:'Title',mdPH:'Start writing (math/code supported)',unsaved:'Unsaved changes detected. Discard and leave composer?',delDoc:'Delete this document?',delUpload:'Delete this upload?',saved:'Saved: ',editing:'Editing: ',newStatus:'Not saved',savedUpload:'Saved upload: ',pdfSaved:'PDF saved as document'}};

function t(k){return dict[state.lang][k]||k;}
function persist(){localStorage.setItem(STORE,JSON.stringify(state.entries));localStorage.setItem(USTORE,JSON.stringify(state.uploads));localStorage.setItem(SSTORE,JSON.stringify(state.settings));}
function normalizeMarkdownSource(text){
  const lines=String(text||'').replace(/\r\n/g,'\n').split('\n');
  const output=[];
  let inFence=false;
  let fenceMarker='';
  let inQuote=false;
  let displayMode=null;
  let pendingBlank=false;

  const quotePrefix=(line)=>line.match(/^(\s*(?:>\s*)+)/)?.[1]||'';
  const stripQuotePrefix=(line)=>line.replace(/^(\s*(?:>\s*)+)/,'');
  const isBlank=(line)=>line.trim()==='';
  const fenceStart=(line)=>line.match(/^(\s*)(```|~~~)/);
  const isDollarLine=(content)=>/^\$\$\s*$/.test(content);
  const isBracketOpen=(content)=>/^\\\[\s*$/.test(content);
  const isBracketClose=(content)=>/^\\\]\s*$/.test(content);

  const openQuote=()=>{
    if(!inQuote){
      output.push(':::quote');
      inQuote=true;
    }
  };
  const closeQuote=()=>{
    if(inQuote){
      output.push(':::');
      inQuote=false;
    }
  };

  for(const line of lines){
    const fenceMatch=fenceStart(line);
    if(fenceMatch){
      closeQuote();
      if(!inFence){
        inFence=true;
        fenceMarker=fenceMatch[2];
      }else if(line.trimStart().startsWith(fenceMarker)){
        inFence=false;
        fenceMarker='';
      }
      output.push(line);
      continue;
    }

    if(inFence){
      output.push(line);
      continue;
    }

    const prefix=quotePrefix(line);
    const content=stripQuotePrefix(line).trim();
    const blankLine=isBlank(line);
    const quoteLine=prefix!=='' || (inQuote && !blankLine);
    const dollarLine=isDollarLine(content);
    const bracketOpen=isBracketOpen(content);
    const bracketClose=isBracketClose(content);

    if(quoteLine){
      openQuote();
      if(pendingBlank){
        output.push('');
        pendingBlank=false;
      }
      if(displayMode==='dollar' && dollarLine){
        output.push(stripQuotePrefix(line));
        displayMode=null;
        pendingBlank=true;
        continue;
      }
      if(displayMode==='bracket' && bracketClose){
        output.push(stripQuotePrefix(line));
        displayMode=null;
        pendingBlank=true;
        continue;
      }
      if(displayMode===null && dollarLine){
        if(output.length===0 || output[output.length-1] !== '') output.push('');
        output.push(stripQuotePrefix(line));
        displayMode='dollar';
        continue;
      }
      if(displayMode===null && bracketOpen){
        if(output.length===0 || output[output.length-1] !== '') output.push('');
        output.push(stripQuotePrefix(line));
        displayMode='bracket';
        continue;
      }
      output.push(stripQuotePrefix(line));
      continue;
    }

    if(blankLine){
      if(inQuote){
        output.push('');
        pendingBlank=false;
        continue;
      }
      if(pendingBlank){
        output.push('');
        pendingBlank=false;
        continue;
      }
      output.push('');
      continue;
    }

    closeQuote();

    if(displayMode===null){
      if(dollarLine){
        output.push('');
        output.push(line);
        displayMode='dollar';
        continue;
      }
      if(bracketOpen){
        output.push('');
        output.push(line);
        displayMode='bracket';
        continue;
      }
    }else if(displayMode==='dollar' && dollarLine){
      output.push(line);
      displayMode=null;
      pendingBlank=true;
      continue;
    }else if(displayMode==='bracket' && bracketClose){
      output.push(line);
      displayMode=null;
      pendingBlank=true;
      continue;
    }

    if(pendingBlank){
      output.push('');
      pendingBlank=false;
    }
    output.push(line);
  }

  closeQuote();

  return output.join('\n');
}
function renderMdInto(el,text){el.innerHTML=md.render(normalizeMarkdownSource(text));el.querySelectorAll('pre code').forEach(b=>window.hljs&&window.hljs.highlightElement(b));}
function hexToRgb(hex){
  const value = hex.replace('#','').trim();
  const normalized = value.length===3 ? value.split('').map(ch=>ch+ch).join('') : value;
  const num = Number.parseInt(normalized,16);
  return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
}
function applySettings(){const theme=THEMES[state.settings.theme]||THEMES.desert;state.settings.theme=THEMES[state.settings.theme]?state.settings.theme:'desert';document.body.dataset.theme=state.settings.theme;document.body.style.setProperty('--font-zh',FONT_STACKS[state.settings.fontZh]||FONT_STACKS.kaiti);document.body.style.setProperty('--font-en',FONT_STACKS[state.settings.fontEn]||FONT_STACKS.times);document.body.style.backgroundImage=`${theme.bodyBg},url('${theme.image}')`;document.body.style.backgroundColor=theme.bg;const quote=$('themeQuote');if(quote)quote.textContent=theme.quote;
  const {r,g,b}=hexToRgb(theme.bg);
  document.documentElement.style.setProperty('--editor-surface', `rgba(${r},${g},${b},${state.settings.previewOpacity||0.75})`);
  document.documentElement.style.setProperty('--preview-opacity', String(state.settings.previewOpacity||0.75));}
function applyI18n(){document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));$('titleInput').placeholder=t('titlePH');$('mdInput').placeholder=t('mdPH');$('filterLabel').textContent=t('filter');$('status').textContent=t('newStatus');$('typeInput').options[0].text=t('thought');$('typeInput').options[1].text=t('work');$('filterType').options[0].text=t('all');$('filterType').options[1].text=t('thought');$('filterType').options[2].text=t('work');$('uploadType').options[0].text=t('thought');$('uploadType').options[1].text=t('work');const quote=$('themeQuote');if(quote)quote.textContent=(THEMES[state.settings.theme]||THEMES.desert).quote;}

function weatherText(code){
  if(code===0) return '晴';
  if(code===1) return '大部晴朗';
  if(code===2) return '多云';
  if(code===3) return '阴';
  if(code===45 || code===48) return '雾';
  if(code===51 || code===53 || code===55) return '毛毛雨';
  if(code===56 || code===57) return '冻毛毛雨';
  if(code===61 || code===63 || code===65) return '雨';
  if(code===66 || code===67) return '冻雨';
  if(code===71 || code===73 || code===75) return '雪';
  if(code===77) return '阵雪';
  if(code===80 || code===81 || code===82) return '阵雨';
  if(code===85 || code===86) return '阵雪';
  if(code===95) return '雷暴';
  if(code===96 || code===99) return '雷暴伴冰雹';
  return '天气未知';
}

function cityText(place){
  return place?.city || place?.locality || place?.town || place?.village || place?.county || place?.principalSubdivision || '未知城市';
}

function setView(v){if($('compose').classList.contains('active')&&state.dirty&&!confirm(t('unsaved')))return;if(v!=='compose')resetCompose();document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===v));}
function resetCompose(){state.activeId=null;$('titleInput').value='';$('dateInput').valueAsDate=new Date();$('typeInput').value='thought';$('featuredInput').checked=false;$('mdInput').value='';renderMdInto($('preview'),'');$('editHint').textContent='';state.dirty=false;}
function currentEntry(){const title=$('titleInput').value.trim()||'Untitled';const date=$('dateInput').value;const type=$('typeInput').value;const id=state.activeId||`${date}-${type}-${title.toLowerCase().replace(/\s+/g,'-')}`;return{id,title,date,type,featured:$('featuredInput').checked,content:$('mdInput').value,lastEdited:new Date().toISOString()};}
function saveEntry(){const e=currentEntry();const i=state.entries.findIndex(x=>x.id===e.id);if(i>=0)state.entries[i]=e;else state.entries.push(e);state.activeId=e.id;state.dirty=false;persist();$('status').textContent=t('saved')+e.title;$('editHint').textContent=t('editing')+e.title;renderDocs();renderFeatured();}
function editEntry(e){state.activeId=e.id;$('titleInput').value=e.title;$('dateInput').value=e.date;$('typeInput').value=e.type;$('featuredInput').checked=!!e.featured;$('mdInput').value=e.content;renderMdInto($('preview'),e.content);state.dirty=false;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='compose'));}
function buildToc(){const toc=$('readerToc');toc.innerHTML='<h4>目录 / TOC</h4>';const heads=$('readerContent').querySelectorAll('h1,h2,h3');heads.forEach((h,i)=>{if(!h.id)h.id='toc-'+i;const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;a.className='toc-item '+h.tagName.toLowerCase();a.onclick=(ev)=>{ev.preventDefault();document.getElementById(h.id).scrollIntoView({behavior:'smooth',block:'start'});};toc.appendChild(a);});}
function browseEntry(e){renderMdInto($('readerContent'),`# ${e.title}\n\n${e.content}`);buildToc();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='reader'));}
function deleteEntry(id){if(!confirm(t('delDoc')))return;state.entries=state.entries.filter(e=>e.id!==id);persist();renderDocs();renderFeatured();}
function renderDocs(){const f=$('filterType').value,target=$('timeline');target.innerHTML='';const g={};state.entries.filter(e=>f==='all'||e.type===f).sort((a,b)=>a.date<b.date?1:-1).forEach(e=>{const m=e.date.slice(0,7);(g[m] ||= []).push(e)});Object.keys(g).sort((a,b)=>a<b?1:-1).forEach(m=>{const c=document.createElement('div');c.className='card';c.innerHTML=`<h3>${m}</h3>`;g[m].forEach(e=>{const r=document.createElement('div');r.className='form-row';r.innerHTML=`<span>${e.date} · ${e.title}</span><button class='browse-btn'>${state.lang==='zh'?'浏览':'Browse'}</button><button class='edit-btn'>${state.lang==='zh'?'编辑':'Edit'}</button><button class='delete-btn'>${state.lang==='zh'?'删除':'Delete'}</button>`;r.querySelector('.browse-btn').onclick=()=>browseEntry(e);r.querySelector('.edit-btn').onclick=()=>editEntry(e);r.querySelector('.delete-btn').onclick=()=>deleteEntry(e.id);c.appendChild(r)});target.appendChild(c)});}
function renderFeatured(){const t=$('featuredPanel');t.innerHTML='';state.entries.filter(e=>e.featured).forEach(e=>{const c=document.createElement('div');c.className='card';c.innerHTML=`<h3>${e.title}</h3><div class='form-row'><button class='browse-btn'>${state.lang==='zh'?'浏览':'Browse'}</button><button class='edit-btn'>${state.lang==='zh'?'编辑':'Edit'}</button><button class='delete-btn'>${state.lang==='zh'?'删除':'Delete'}</button></div>`;c.querySelector('.browse-btn').onclick=()=>browseEntry(e);c.querySelector('.edit-btn').onclick=()=>editEntry(e);c.querySelector('.delete-btn').onclick=()=>deleteEntry(e.id);t.appendChild(c)});}
function saveUploadAsEntry(f){const now=new Date(),date=now.toISOString().slice(0,10),type=$('uploadType').value,featured=$('uploadFeatured').checked,title=f.name.replace(/\.md$/i,'').replace(/\.pdf$/i,''),id=`${date}-${type}-${title.toLowerCase().replace(/\s+/g,'-')}`;const content=f.kind==='md'?f.content:`# ${title}\n\n> ${t('pdfSaved')}\n\n<iframe src="${f.content}" style="width:100%;height:70vh;border:1px solid #ccc;border-radius:8px;"></iframe>`;const e={id,title,date,type,featured,content,lastEdited:now.toISOString()};const i=state.entries.findIndex(x=>x.id===id);if(i>=0)state.entries[i]=e;else state.entries.push(e);persist();renderDocs();renderFeatured();}
function renderUploads(){const list=$('uploadList');list.innerHTML='';state.uploads.forEach((f,idx)=>{const row=document.createElement('div');row.className='form-row card';row.innerHTML=`<span>${f.name} (${f.kind})</span><button class='open-u'>${state.lang==='zh'?'浏览':'Browse'}</button><button class='save-u'>${state.lang==='zh'?'保存到文档':'Save as Doc'}</button><button class='del-u'>${state.lang==='zh'?'删除':'Delete'}</button>`;row.querySelector('.open-u').onclick=()=>openUpload(idx);row.querySelector('.save-u').onclick=()=>{saveUploadAsEntry(f);$('status').textContent=t('savedUpload')+f.name};row.querySelector('.del-u').onclick=()=>{if(confirm(t('delUpload'))){state.uploads.splice(idx,1);persist();renderUploads();$('filePreview').innerHTML='';}};list.appendChild(row);});}
function openUpload(idx){const f=state.uploads[idx];if(f.kind==='md'){$('filePreview').innerHTML=`<h3>${f.name}</h3><button id='importMd'>${state.lang==='zh'?'导入到编辑器':'Import to Composer'}</button><div id='mdUploaded'></div>`;renderMdInto($('mdUploaded'),f.content);$('importMd').onclick=()=>{$('titleInput').value=f.name.replace(/\.md$/i,'');$('mdInput').value=f.content;renderMdInto($('preview'),f.content);document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='compose'));state.dirty=true;};}else{$('filePreview').innerHTML=`<h3>${f.name}</h3><iframe src='${f.content}' class='pdf-frame'></iframe>`;}}
async function handleUploads(files){for(const file of files){if(/\.md$/i.test(file.name))state.uploads.push({name:file.name,kind:'md',content:await file.text(),lastEdited:new Date().toISOString()});else if(/\.pdf$/i.test(file.name)){const data=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(file);});state.uploads.push({name:file.name,kind:'pdf',content:data,lastEdited:new Date().toISOString()});}}persist();renderUploads();}


async function loadMetaLine(){
  const now=new Date();
  let lunar='';
  try{const l=window.solarlunar.solar2lunar(now.getFullYear(),now.getMonth()+1,now.getDate());lunar=`农历${l.monthCn}${l.dayCn}`;}catch{}
  let city='未知城市';
  let weather='';
  let latitude=null;
  let longitude=null;
  try{
    const pos=await new Promise((res,rej)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000}):rej());
    latitude=pos.coords.latitude;
    longitude=pos.coords.longitude;
  }catch{}
  if(latitude!==null && longitude!==null){
    try{
      const geoRes=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh-CN`);
      const geoJson=await geoRes.json();
      city=cityText(geoJson);
    }catch{}
    try{
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
      const j=await r.json();
      weather=`${weatherText(j.current.weather_code)} · ${Math.round(j.current.temperature_2m)}°C`;
    }catch{}
  }
  $('metaLine').textContent=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 · ${lunar} · 📍${city} · ${weather}`;
}


function syncPreviewFromEditor() {
  const ta = $('mdInput');
  const pv = $('preview');
  const ratio = ta.scrollTop / Math.max(1, ta.scrollHeight - ta.clientHeight);
  pv.scrollTop = ratio * Math.max(1, pv.scrollHeight - pv.clientHeight);
}
function syncEditorFromPreview() {
  const ta = $('mdInput');
  const pv = $('preview');
  const ratio = pv.scrollTop / Math.max(1, pv.scrollHeight - pv.clientHeight);
  ta.scrollTop = ratio * Math.max(1, ta.scrollHeight - ta.clientHeight);
}

function init(){state.entries=JSON.parse(localStorage.getItem(STORE)||'[]');state.uploads=JSON.parse(localStorage.getItem(USTORE)||'[]');state.settings={...state.settings,...JSON.parse(localStorage.getItem(SSTORE)||'{}')};if(state.settings.theme==='light'||state.settings.theme==='dark')state.settings.theme='desert';$('dateInput').valueAsDate=new Date();$('langSelect').value=state.lang;$('themeSelect').value=state.settings.theme;$('fontZhSelect').value=state.settings.fontZh;$('fontEnSelect').value=state.settings.fontEn; $('previewOpacity').value=state.settings.previewOpacity || 0.75;applySettings();applyI18n();renderDocs();renderFeatured();renderUploads();renderMdInto($('preview'),'');loadMetaLine();}

$('mdInput').addEventListener('input',()=>{renderMdInto($('preview'),$('mdInput').value);state.dirty=true;});$('titleInput').addEventListener('input',()=>state.dirty=true);$('typeInput').addEventListener('change',()=>state.dirty=true);$('featuredInput').addEventListener('change',()=>state.dirty=true);$('filterType').addEventListener('change',renderDocs);$('saveBtn').addEventListener('click',saveEntry);$('uploadInput').addEventListener('change',e=>handleUploads(e.target.files));$('backBtn').addEventListener('click',()=>setView('docs'));document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('settingsBtn').addEventListener('click',()=>$('settingsPanel').classList.toggle('hidden'));
$('langSelect').addEventListener('change',e=>{state.lang=e.target.value;applyI18n();renderDocs();renderFeatured();renderUploads();persist();});
$('themeSelect').addEventListener('change',e=>{state.settings.theme=e.target.value;applySettings();persist();});
$('fontZhSelect').addEventListener('change',e=>{state.settings.fontZh=e.target.value;applySettings();persist();});
$('fontEnSelect').addEventListener('change',e=>{state.settings.fontEn=e.target.value;applySettings();persist();});

init();

$('previewOpacity').addEventListener('input',e=>{state.settings.previewOpacity=parseFloat(e.target.value);applySettings();persist();});
$('mdInput').addEventListener('dblclick',syncPreviewFromEditor);
$('preview').addEventListener('dblclick',syncEditorFromPreview);
