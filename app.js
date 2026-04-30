const state = { lang: 'zh', entries: [], uploads: [], activeId: null, dirty: false, settings: { theme:'light', fontZh:'kaiti', fontEn:'times', bgImage:'', previewOpacity:0.75 } };
const STORE='tristan_entries_v6', USTORE='tristan_uploads_v6', SSTORE='tristan_settings_v1';
const md=window.markdownit({html:true,linkify:true,breaks:true,typographer:true})
  .use(window.markdownitMark)
  .use(window.markdownitIns)
  .use(window.texmath,{engine:window.katex,delimiters:'dollars',katexOptions:{throwOnError:false}})
  .use(window.texmath,{engine:window.katex,delimiters:'brackets',katexOptions:{throwOnError:false}})
  .use(window.markdownitContainer,'comment',{render:(tokens,idx)=>tokens[idx].nesting===1?'<div class="md-comment">':'</div>'});
const $=(id)=>document.getElementById(id);
const dict={zh:{compose:'撰写',docs:'文档',featured:'精选',uploads:'上传文件',save:'保存',settings:'设置',language:'语言',theme:'主题',fontZh:'中文字体',fontEn:'英文字体',bgImage:'背景图片',resetBg:'重置背景',previewOpacity:'渲染区透明度',backDocs:'返回文档',setFeatured:'设为精选',thought:'随想',work:'工作日志',all:'全部',filter:'类型筛选',titlePH:'标题',mdPH:'开始写作（支持公式与代码）',unsaved:'检测到未保存内容，是否放弃并离开撰写页？',delDoc:'是否删除该文档？',delUpload:'是否删除该上传文件？',saved:'保存成功：',editing:'编辑中：',newStatus:'未保存',savedUpload:'已保存上传文件：',pdfSaved:'PDF 文档已保存'},en:{compose:'Compose',docs:'Documents',featured:'Featured',uploads:'Uploads',save:'Save',settings:'Settings',language:'Language',theme:'Theme',fontZh:'Chinese Font',fontEn:'English Font',bgImage:'Background Image',resetBg:'Reset Background',previewOpacity:'Preview Opacity',backDocs:'Back to Documents',setFeatured:'Set Featured',thought:'Thought',work:'Work Log',all:'All',filter:'Type Filter',titlePH:'Title',mdPH:'Start writing (math/code supported)',unsaved:'Unsaved changes detected. Discard and leave composer?',delDoc:'Delete this document?',delUpload:'Delete this upload?',saved:'Saved: ',editing:'Editing: ',newStatus:'Not saved',savedUpload:'Saved upload: ',pdfSaved:'PDF saved as document'}};

function t(k){return dict[state.lang][k]||k;}
function persist(){localStorage.setItem(STORE,JSON.stringify(state.entries));localStorage.setItem(USTORE,JSON.stringify(state.uploads));localStorage.setItem(SSTORE,JSON.stringify(state.settings));}
function preprocessMarkdown(text){
  let t=(text||'').replace(/\{\{u:([\s\S]*?)\}\}/g,'<u>$1</u>');
  t=t.replace(/\s*\$\$\s*\n?/g,'\n$$\n');
  t=t.replace(/\n{3,}/g,'\n\n');
  const lines=t.split('\n');
  const out=[]; let inComment=false;
  for(const line of lines){
    if(/^>.*/.test(line)){
      if(!inComment){out.push(':::comment'); inComment=true;}
      out.push(line.replace(/^\s*> ?/,'').replace(/ /g,' '));
    }else{
      if(inComment){out.push(':::'); inComment=false;}
      out.push(line);
    }
  }
  if(inComment) out.push(':::');
  return out.join('\n');
}
function renderMdInto(el,text){el.innerHTML=md.render(preprocessMarkdown(text));el.querySelectorAll('pre code').forEach(b=>window.hljs&&window.hljs.highlightElement(b));}
function applySettings(){document.body.dataset.theme=state.settings.theme;document.body.style.setProperty('--font-zh',state.settings.fontZh);document.body.style.setProperty('--font-en',state.settings.fontEn);document.body.style.backgroundImage=state.settings.bgImage?`linear-gradient(120deg,#f7ebd34d,#0000 45%),url('${state.settings.bgImage}')`:'none';document.body.style.backgroundColor='#efe2c8';
  document.documentElement.style.setProperty('--preview-opacity', String(state.settings.previewOpacity||0.75));}
function applyI18n(){document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));$('titleInput').placeholder=t('titlePH');$('mdInput').placeholder=t('mdPH');$('filterLabel').textContent=t('filter');$('status').textContent=t('newStatus');$('typeInput').options[0].text=t('thought');$('typeInput').options[1].text=t('work');$('filterType').options[0].text=t('all');$('filterType').options[1].text=t('thought');$('filterType').options[2].text=t('work');$('uploadType').options[0].text=t('thought');$('uploadType').options[1].text=t('work');}

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
  let weather='';
  try{
    const pos=await new Promise((res,rej)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000}):rej());
    const {latitude,longitude}=pos.coords;
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
    const j=await r.json();
    weather=`${Math.round(j.current.temperature_2m)}°C`;
  }catch{weather='天气获取失败';}
  $('metaLine').textContent=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 · ${lunar} · ${weather}`;
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

function init(){state.entries=JSON.parse(localStorage.getItem(STORE)||'[]');state.uploads=JSON.parse(localStorage.getItem(USTORE)||'[]');state.settings={...state.settings,...JSON.parse(localStorage.getItem(SSTORE)||'{}')};$('dateInput').valueAsDate=new Date();$('langSelect').value=state.lang;$('themeSelect').value=state.settings.theme;$('fontZhSelect').value=state.settings.fontZh;$('fontEnSelect').value=state.settings.fontEn; $('previewOpacity').value=state.settings.previewOpacity || 0.75;applySettings();applyI18n();renderDocs();renderFeatured();renderUploads();renderMdInto($('preview'),'');loadMetaLine();}

$('mdInput').addEventListener('input',()=>{renderMdInto($('preview'),$('mdInput').value);state.dirty=true;});$('titleInput').addEventListener('input',()=>state.dirty=true);$('typeInput').addEventListener('change',()=>state.dirty=true);$('featuredInput').addEventListener('change',()=>state.dirty=true);$('filterType').addEventListener('change',renderDocs);$('saveBtn').addEventListener('click',saveEntry);$('uploadInput').addEventListener('change',e=>handleUploads(e.target.files));$('backBtn').addEventListener('click',()=>setView('docs'));document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('settingsBtn').addEventListener('click',()=>$('settingsPanel').classList.toggle('hidden'));
$('langSelect').addEventListener('change',e=>{state.lang=e.target.value;applyI18n();renderDocs();renderFeatured();renderUploads();persist();});
$('themeSelect').addEventListener('change',e=>{state.settings.theme=e.target.value;applySettings();persist();});
$('fontZhSelect').addEventListener('change',e=>{state.settings.fontZh=e.target.value;applySettings();persist();});
$('fontEnSelect').addEventListener('change',e=>{state.settings.fontEn=e.target.value;applySettings();persist();});
$('bgUpload').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const data=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(f);});state.settings.bgImage=data;applySettings();persist();});
$('bgResetBtn').addEventListener('click',()=>{state.settings.bgImage='';applySettings();persist();});

init();

$('previewOpacity').addEventListener('input',e=>{state.settings.previewOpacity=parseFloat(e.target.value);applySettings();persist();});
$('mdInput').addEventListener('dblclick',syncPreviewFromEditor);
$('preview').addEventListener('dblclick',syncEditorFromPreview);
