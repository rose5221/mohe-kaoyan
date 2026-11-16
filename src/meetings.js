'use strict';
(() => {
 const data=window.MEETING_DATA,core=window.MeetingCore,all=data.meetings;
 const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key='kaoyan.meeting.compare.v1';let saved;
 try{saved=JSON.parse(localStorage.getItem(key))}catch{}
 let state=core.read(location.hash,saved,data),query='',period='all',handledHash=null;
 const initialNotice=state.notice;
 const library=$('meetingLibrary'),dialog=$('libraryDialog'),home=library.parentElement,anchor=library.nextElementSibling;
 const note=$('libraryNotice'),librarySelection=$('librarySelection'),libraryBody=$('libraryBody');
 const get=id=>all.find(m=>m.id===id),chosen=()=>state.ids.map(get);
 const progress=core.createProgress(all,{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
 const progressButton=$('meetingRecords'),progressDialog=document.createElement('dialog');
 progressDialog.id='meetingProgressDialog';progressDialog.className='study-dialog meeting-progress-dialog';progressDialog.setAttribute('aria-labelledby','meetingProgressTitle');
 progressDialog.innerHTML='<div class="study-dialog-head"><h2 id="meetingProgressTitle">会议学习进度</h2><button type="button" class="study-dialog-close" aria-label="关闭会议进度">×</button></div><div class="study-dialog-body"><p class="meeting-progress-summary"></p><p class="meeting-progress-note"></p><div class="meeting-progress-list"></div></div>';document.body.append(progressDialog);
 function masteryButton(m){const done=!!progress.snapshot().learned[m.id];return `<button type="button" class="meeting-mastered" data-mastered="${m.id}" aria-pressed="${done}" aria-label="${done?'取消掌握':'标记掌握'}${esc(m.name)}">${done?'✓ 已掌握':'标记掌握'}</button>`}
 function renderProgress(){
  const saved=progress.snapshot();$('meetingProgressCount').textContent=saved.count+' / '+saved.total;
  $('meetingProgressRing').style.setProperty('--progress',saved.count/saved.total*100+'%');
  progressButton.setAttribute('aria-label',`会议学习进度，已掌握 ${saved.count} / ${saved.total} 场会议`);
  document.querySelectorAll('[data-mastered]').forEach(button=>{const m=get(button.dataset.mastered),done=!!saved.learned[m.id];button.textContent=done?'✓ 已掌握':'标记掌握';button.setAttribute('aria-pressed',String(done));button.setAttribute('aria-label',(done?'取消掌握':'标记掌握')+m.name)});
  progressDialog.querySelector('.meeting-progress-summary').textContent=`已掌握 ${saved.count} / ${saved.total} 场会议`;
  progressDialog.querySelector('.meeting-progress-note').textContent=saved.persistent?'在对比内容中标记掌握，进度自动保存在当前浏览器。':'当前浏览器限制了本地存储，本次学习期间仍可记录进度。';
  progressDialog.querySelector('.meeting-progress-list').innerHTML=all.filter(m=>saved.learned[m.id]).map(m=>`<div><span><small>${m.sortDate.slice(0,4)}</small>${esc(m.name)}</span><button type="button" data-unlearn="${m.id}" aria-label="取消掌握${esc(m.name)}">取消掌握</button></div>`).join('');
 }
 progressButton.onclick=()=>{progress.refresh();renderProgress();progressDialog.showModal();progressDialog.querySelector('.study-dialog-close').focus()};
 progressDialog.querySelector('.study-dialog-close').onclick=()=>progressDialog.close();
 progressDialog.addEventListener('close',()=>progressButton.focus({preventScroll:true}));
 progressDialog.addEventListener('click',e=>{if(e.target!==progressDialog)return;const r=progressDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)progressDialog.close()});
 addEventListener('storage',e=>{if(e.key===progress.key||e.key===null){progress.refresh();renderProgress()}});
 addEventListener('pageshow',()=>{progress.refresh();renderProgress()});
 const yearLabel=m=>m.id==='plenum6_7'?'1944—1945':m.sortDate.slice(0,4);
 const timeline=m=>'kaoyan-review.html#'+new URLSearchParams({y:m.sortDate.slice(0,4),e:m.name,view:'map',from:'meetings'});
 const lesson=m=>(window.LECTURE_DATA?.lessons||[]).find(x=>x.n===m.name);
 const lessonLink=m=>{const hit=lesson(m);return hit?`<a href="${esc(window.StudyUI.lectureHref(hit.id,false))}">地图讲堂 ↗</a>`:''};
 function notice(text='',origin='page'){$('selectionNotice').textContent=origin==='page'?text:'';$('libraryNoticeText').textContent=origin==='library'?text:'';note.hidden=origin!=='library'||!text}
 function persist(push=false){const hash=core.encode(state);try{if(hash!==location.hash)history[push?'pushState':'replaceState'](null,'',hash)}catch{}handledHash=location.hash;try{localStorage.setItem(key,JSON.stringify({ids:state.ids,mode:state.mode}))}catch{}}
 function renderList(){
  const active=document.activeElement?.dataset?.meetingId,scroll=libraryBody.scrollTop;
  const found=all.filter(m=>(period==='all'||m.period===period)&&[m.name,m.date,m.keyword,m.summary,m.background,m.trap,...m.decisions,...m.documents].join(' ').toLowerCase().includes(query.toLowerCase().trim()));
  $('libraryCount').textContent=`共 ${found.length} 场会议${found.length<all.length?' · 已筛选':''}`;
  $('meetingList').innerHTML=found.length?found.map(m=>`<button type="button" data-meeting-id="${m.id}" aria-pressed="${state.ids.includes(m.id)}" aria-label="${state.ids.includes(m.id)?'移除':'选择'}${esc(m.name)}"><time>${m.sortDate.slice(0,4)}</time><span><b>${esc(m.name)}</b><small>${esc(m.keyword)}</small></span><i aria-hidden="true">${state.ids.includes(m.id)?'✓':'+'}</i></button>`).join(''):'<div class="library-empty">没有找到符合条件的会议。<button type="button" data-reset-search>清除搜索与筛选 →</button></div>';
  libraryBody.scrollTop=scroll;
  if(active)$('meetingList').querySelector(`[data-meeting-id="${active}"]`)?.focus({preventScroll:true});
 }
 function renderSelection(){
  $('selectionCount').textContent=`已选 ${state.ids.length} / 3`;
  $('selectedMeetings').innerHTML=chosen().map(m=>`<button type="button" data-remove="${m.id}" aria-label="从对比中移除${esc(m.name)}">${esc(m.name)}<span aria-hidden="true">×</span></button>`).join('')||'<span>从会议库点选，或使用上方常见组合。</span>';
  librarySelection.innerHTML=chosen().map(m=>`<button type="button" data-remove="${m.id}" aria-label="移除已选会议${esc(m.name)}">${esc(m.name)}<span aria-hidden="true">×</span></button>`).join('');
  $('clearSelection').disabled=!state.ids.length;renderExportControl();
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===state.mode));
  document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',core.normalize(data.presets.find(p=>p.id===b.dataset.preset).ids,all).join()===state.ids.join()));
 }
 function renderTable(){
  const list=chosen(),preset=data.presets.find(p=>core.normalize(p.ids,all).join()===state.ids.join());
  $('compareHint').hidden=list.length<2;
  $('compareHint').innerHTML=`<span>分清这一点</span><p>${esc(preset?.hint||'先看时间与历史背景，再看核心内容。比较“提出、写入、确立”等动词，分清会议处理的问题与历史作用。')}</p>`;
  if(!list.length){$('comparisonContent').innerHTML='<div class="compare-empty"><h2>把会议放在一起看</h2><p>先选两场会议，开始比较它们的异同。</p><button type="button" data-use-default>试试“理论与指导思想” →</button></div>';return}
  const rows=[
   {label:'时间地点',cls:'date-cell',render:m=>`<time datetime="${m.sortDate}">${esc(m.date)}</time><small>${esc(m.place)}</small>`},
   ...(state.mode==='full'?[{label:'历史背景',render:m=>esc(m.background)}]:[]),
   {label:'核心记忆',render:m=>esc(m.summary)},
   {label:'主要内容',render:m=>'<ul>'+m.decisions.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>'},
   ...(state.mode==='full'?[{label:'历史意义',render:m=>esc(m.significance)}]:[]),
   {label:'易混辨析',cls:'trap-row',render:m=>esc(m.trap)},
   ...(state.mode==='full'?[{label:'相关文献',render:m=>'<ul>'+m.documents.map(x=>`<li>《${esc(x)}》</li>`).join('')+'</ul>'}]:[]),
   {label:'核对来源',render:m=>`<details><summary>查看 ${m.sources.length} 条资料 ↗</summary>${m.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.publisher)}</small>`).join('')}</details>`}
  ];
  $('comparisonContent').innerHTML=(list.length===1?'<div class="compare-single">已选 1 场。再选一场，即可并排比较；当前可先阅读单场内容。</div>':'')+`<table class="comparison-table" role="table"><caption>${state.mode==='full'?'8':'5'} 个维度 · ${innerWidth<=700?'逐项对照':'按时间排序'}</caption><colgroup><col>${list.map(()=>'<col>').join('')}</colgroup><thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">对照维度</th>${list.map(m=>`<th scope="col" role="columnheader"><span class="meeting-column-year">${yearLabel(m)}</span><h2 class="meeting-column-title">${esc(m.name)}</h2><span class="meeting-column-key">${esc(m.keyword)}</span>${masteryButton(m)}<div class="meeting-column-links"><a href="${esc(timeline(m))}" title="查看 ${m.sortDate.slice(0,4)} 年时间轴">时间轴 ↗</a>${lessonLink(m)}</div></th>`).join('')}</tr></thead><tbody role="rowgroup">${rows.map((row,index)=>`<tr role="row" class="${row.cls||''}"><th scope="row" role="rowheader">${row.label}</th>${list.map(m=>`<td role="cell"><span class="mobile-meeting">${esc(m.name)}<small>${yearLabel(m)}</small>${index===0?`<a href="${esc(timeline(m))}">时间轴 ↗</a>`:''}</span>${row.render(m)}${index===0?`<div class="mobile-meeting meeting-mobile-actions">${masteryButton(m)}${lessonLink(m)}</div>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 }
 function render(){renderSelection();renderList();renderTable()}
 function commit(message=''){persist(true);render();notice(message)}
 function toggle(id){const next=core.toggle(state.ids,id,all);if(next.error){notice(next.error,'library');return}state.ids=next.ids;commit()}
 function usePreset(id){const p=data.presets.find(p=>p.id===id);if(!p)return;state.ids=core.normalize(p.ids,all);query='';period='all';$('meetingSearch').value='';$('meetingPeriod').value='all';commit()}
 $('meetingPresets').innerHTML=data.presets.map(p=>`<button type="button" data-preset="${p.id}" aria-pressed="false" title="${esc(p.ids.map(id=>get(id).name).join(' / '))}">${esc(p.name)}</button>`).join('');
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mastered){const id=b.dataset.mastered;progress.set(id,!progress.snapshot().learned[id]);renderProgress();return}
  if(b.dataset.unlearn){progress.set(b.dataset.unlearn,false);renderProgress();progressDialog.querySelector('.study-dialog-close').focus();return}
  if(b.dataset.meetingId)toggle(b.dataset.meetingId);
  if(b.dataset.remove){const next=b.nextElementSibling?.dataset.remove||b.previousElementSibling?.dataset.remove;toggle(b.dataset.remove);(dialog.open?(librarySelection.querySelector(`[data-remove="${next}"]`)||$('meetingSearch')):(next?$('selectedMeetings').querySelector(`[data-remove="${next}"]`):$('openLibrary').offsetParent?$('openLibrary'):$('meetingSearch')))?.focus({preventScroll:true})}
  if(b.dataset.preset)usePreset(b.dataset.preset);
  if(b.dataset.mode){state.mode=b.dataset.mode;commit()}
  if(b.hasAttribute('data-use-default'))usePreset(data.presets[0].id);
  if(b.hasAttribute('data-reset-search')){query='';period='all';$('meetingSearch').value='';$('meetingPeriod').value='all';renderList();$('meetingSearch').focus()}
 });
 document.querySelector('.skip-compare').onclick=e=>{e.preventDefault();$('comparison').focus();$('comparison').scrollIntoView({block:'start'})};
 $('manageSelection').onclick=()=>{if(dialog.open){libraryBody.scrollTo({top:0});librarySelection.querySelector('button')?.focus({preventScroll:true})}else{$('selectedMeetings').scrollIntoView({block:'nearest'});$('selectedMeetings').querySelector('button')?.focus({preventScroll:true})}};
 $('meetingSearch').addEventListener('input',e=>{query=e.target.value;renderList()});
 $('meetingPeriod').addEventListener('change',e=>{period=e.target.value;renderList()});
 $('clearSelection').onclick=()=>{state.ids=[];commit('已清空。请选择会议或切换常见组合。');($('openLibrary').offsetParent?$('openLibrary'):$('meetingSearch')).focus()};
 $('openLibrary').onclick=()=>{dialog.append(library);dialog.showModal();$('closeLibrary').focus()};
 $('closeLibrary').onclick=$('finishSelection').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{home.insertBefore(library,anchor);notice();(getComputedStyle($('openLibrary')).display==='none'?$('meetingSearch'):$('openLibrary')).focus()});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 matchMedia('(min-width:1001px)').addEventListener('change',e=>{if(e.matches&&dialog.open)dialog.close()});
 $('copyComparisonLink').onclick=async()=>{const value=location.href;try{await navigator.clipboard.writeText(value);notice('已复制当前对比链接，包含所选会议与阅读模式。')}catch{$('copyLinkValue').value=value;$('copyLinkDialog').showModal();$('copyLinkValue').focus();$('copyLinkValue').select()}};
 $('closeCopyLink').onclick=()=>$('copyLinkDialog').close();$('copyLinkDialog').addEventListener('close',()=>$('copyComparisonLink').focus());
 const exportDialog=$('comparisonImageDialog'),exportStatus=$('comparisonImageStatus'),exportPreview=$('comparisonImagePreview'),exportDownload=$('downloadComparisonImage');
 let shareAccess,shareStore;
 let imageRenderer;
 let exportTicket=0,exporting=false,imageURL=null;
 let exportPhase='ready';
 const exportButton=$('exportComparison'),exportLabel=exportButton.querySelector('.export-label');
 function loadImageRenderer(){
  if(window.MeetingImage)return Promise.resolve(window.MeetingImage);
  if(!imageRenderer){
   // Classic scripts also load from a folder opened directly in the browser.
   const load=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;
    script.onload=resolve;
    script.onerror=()=>{script.remove();reject(new Error('导出素材加载失败，请点击重试。'))};
    document.head.append(script);
   });
   const assets=window.MeetingExportAssets?Promise.resolve():load('src/meeting-export-assets.js?v=39');
   imageRenderer=assets.then(()=>load('src/meeting-image.js?v=39'))
    .then(()=>{
     if(!window.MeetingImage)throw new Error('图片导出组件未能启动，请刷新后重试。');
     return window.MeetingImage;
    }).catch(error=>{imageRenderer=null;throw error});
  }
  return imageRenderer;
 }
 function getShareStore(){
  if(!shareStore&&window.MeetingShare)shareStore=window.MeetingShare.createStore({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
  return shareStore;
 }
 function renderExportControl(phase){
  if(phase)exportPhase=phase;
  const access=getShareStore()?.read(),locked=!!access?.firstImage&&!access.unlocked;
  const busy=exporting&&exportPhase!=='sharing';
  exportButton.dataset.state=busy?'loading':exportPhase==='error'?'error':locked?'locked':'ready';
  exportButton.dataset.frozen=String(locked);
  exportButton.disabled=exporting||!state.ids.length;
  exportButton.setAttribute('aria-busy',String(busy));
  exportButton.setAttribute('aria-label',busy?'正在生成对比图片':locked?'导出对比图片，分享后解锁':'导出对比图片');
  exportButton.setAttribute('aria-invalid',String(exportPhase==='error'));
  exportButton.title=locked?'分享给研友，解锁后续导出':exportPhase==='error'?'生成失败，点击重试':'生成并保存对比图片';
  exportLabel.textContent=busy?'正在生成图片':exportPhase==='error'?'重试导出图片':'导出对比图片';
 }
 addEventListener('storage',e=>{if(!exporting&&(e.key===getShareStore()?.key||e.key===null))renderExportControl('ready')});
 addEventListener('pageshow',()=>{if(!exporting)renderExportControl('ready')});
 $('exportComparison').onclick=async()=>{
  if(exporting||!state.ids.length)return;
  const selection={ids:[...state.ids],mode:state.mode};
  let ticket;exporting=true;renderExportControl('loading');
  try{
   if(!window.MeetingShare)throw new Error('导出组件未加载，请刷新页面后重试。');
   getShareStore();
   const imageKey=window.MeetingShare.signature(selection.ids,selection.mode);
   if(!shareStore.canExport(imageKey)){
    if(!shareAccess)shareAccess=window.MeetingShare.mount(document,shareStore);
    renderExportControl('sharing');
    if(!await shareAccess.request(imageKey))return;
   }
   ticket=++exportTicket;exportPreview.hidden=true;exportDownload.hidden=true;
   exportStatus.hidden=false;exportStatus.textContent='正在生成对比图片…';
   renderExportControl('loading');
   const renderer=await loadImageRenderer();
   const result=await renderer.render(selection.ids,selection.mode,data);
   if(ticket!==exportTicket)return;
   const previous=imageURL;imageURL=URL.createObjectURL(result.blob);
   const image=$('comparisonImage');image.src=imageURL;image.alt=result.alt;image.width=result.width;image.height=result.height;
   if(image.decode)await image.decode();
   if(ticket!==exportTicket)return;
   exportPreview.href=imageURL;exportDownload.href=imageURL;exportDownload.download=result.filename;
   exportPreview.hidden=false;exportDownload.hidden=false;exportStatus.hidden=true;
   $('comparisonImageMeta').textContent=`${result.width} × ${result.height} · PNG`;
   exportDialog.showModal();$('closeComparisonImage').focus();
   shareStore.recordGenerated(imageKey);
   exportPhase='ready';
   if(previous)URL.revokeObjectURL(previous);
  }catch(error){
   exportPhase='error';
   if(ticket===exportTicket&&exportDialog.open){exportStatus.textContent=error.message||'图片生成失败，请关闭后重试。';$('comparisonImageMeta').textContent='可关闭窗口后重新生成'}
   else notice(error.message||'图片生成失败，请刷新页面后重试。');
  }finally{exporting=false;renderExportControl();if(!exportDialog.open&&!$('comparisonShareDialog')?.open)$('exportComparison').focus({preventScroll:true})}
 };
 $('closeComparisonImage').onclick=()=>exportDialog.close();
 exportDialog.addEventListener('close',()=>{++exportTicket;$('exportComparison').focus({preventScroll:true})});
 exportDialog.addEventListener('click',event=>{if(event.target!==exportDialog)return;const r=exportDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)exportDialog.close()});
 function restore(){if(location.hash===handledHash)return;state=core.read(location.hash,null,data);render();notice(state.notice);persist()}
 addEventListener('popstate',restore);addEventListener('hashchange',restore);
 matchMedia('(max-width:700px)').addEventListener('change',renderTable);
 persist();render();renderProgress();notice(initialNotice);
 function headerLinks(){document.querySelectorAll('.comparison-table thead a,.comparison-table thead button').forEach(a=>a.tabIndex=innerWidth<=700?-1:0)}
 headerLinks();new MutationObserver(headerLinks).observe($('comparisonContent'),{childList:true});matchMedia('(max-width:700px)').addEventListener('change',headerLinks);
})();
