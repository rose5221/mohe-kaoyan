'use strict';
window.StudyUI = (() => {
 const scenes=window.STUDY_SCENES,lessons=window.LECTURE_DATA?.lessons||[],key='kaoyan.study.return.v7';
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valid=id=>!!scenes.byId[id];
 function readReturn(){const requested=new URLSearchParams(location.hash.slice(1)).get('return');try{const x=JSON.parse(sessionStorage.getItem(key));if(valid(requested)&&requested!==x?.id)return{id:requested,time:0};if(valid(x?.id))return{id:x.id,time:Math.max(0,Math.min(300,Number(x.time)||0))}}catch{}if(valid(requested))return{id:requested,time:0};try{const x=JSON.parse(localStorage.getItem('kaoyan.lecture.v5'));if(valid(x?.current))return{id:x.current,time:0}}catch{}return{id:'s01',time:0}}
 function lectureHref(id,resume=true){const r=readReturn(),safe=valid(id)?id:r.id;return 'lecture.html#'+new URLSearchParams({node:safe,...(resume&&safe===r.id&&r.time>0?{t:r.time.toFixed(2)}:{})})}
 function timelineHref(id){const e=lessons.find(e=>e.id===id);return 'kaoyan-review.html'+(e?'#'+new URLSearchParams({y:e.d.slice(0,4),e:e.n,from:'lecture',return:id}):'')}
 function practiceHref(){
  const hash=page==='lecture'?lectureHref().split('#')[1]:location.hash.slice(1);
  return 'practice/index.html#'+new URLSearchParams({from:page,...(hash?{resume:hash}:{})});
 }
 const header=document.querySelector('.study-header'),page=header?.dataset.page;
 const progressIds=page==='lecture'?['progressBtn','progressRing','progressCount',47]:page==='meetings'?['meetingRecords','meetingProgressRing','meetingProgressCount',24]:['headerRecords','headerProgressRing','headerReadCount',86];
 if(header){header.innerHTML=`<a class="study-brand" href="lecture.html"><em></em><span><b>考研政治 · 时间轴</b><small class="study-together" data-study-together><i class="study-together-signal" aria-hidden="true"></i><span class="study-together-period">白天</span><span class="study-together-value">—</span><span class="study-together-copy">位研友和你一起背诵</span></small></span></a><nav aria-label="主导航"><a data-study-nav="lecture" href="${lectureHref()}" ${page==='lecture'?'aria-current="page"':''}>地图讲堂</a><a data-study-nav="timeline" href="kaoyan-review.html" ${page==='timeline'?'aria-current="page"':''}><span class="nav-full">完整时间轴</span><span class="nav-short">时间轴</span></a><a data-study-nav="meetings" href="meetings.html" ${page==='meetings'?'aria-current="page"':''}>会议对比</a><button type="button" id="atlasBtn" data-study-atlas aria-haspopup="dialog">配套图册</button></nav><button type="button" id="${progressIds[0]}" class="study-records" title="查看学习进度" aria-haspopup="dialog"><span class="study-records-dot" id="${progressIds[1]}" aria-hidden="true"></span><span><b id="${progressIds[2]}">0 / ${progressIds[3]}</b></span></button>`;
 if(page==='timeline'){document.getElementById('headerRecords').title='学习进度与使用说明';document.getElementById('headerRecords').setAttribute('aria-label','学习进度与使用说明');}}
 if(header){
  const practice=document.createElement('a');
  practice.dataset.studyNav='practice';practice.href=practiceHref();
  practice.innerHTML=`<svg class="study-practice-frame" viewBox="0 0 80 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
   <defs>
    <g id="studyPracticeFlame">
     <path fill="#bf7147" d="M-2.5 0C-3.5-1.3-1.5-2.4-1.8-3.7c.8.4 1.2 1 1.2 1.5C.7-3.3-.3-4.7 1-6.15c-.2 1.7 1.7 3.2 2 4.6C3.2-.7 2.5-.2 1.9 0Z"/>
     <path fill="#d18b59" d="M-.9 0C-1.3-1.1.5-2 .5-3.4c.6.9 1.3 2.4.7 3.4Z"/>
    </g>
   </defs>
   <rect class="study-practice-outline" x="4.5" y="5.3" width="71" height="21.4" rx="6" fill="#c65b38" fill-opacity=".08"/>
   <g transform="translate(18 5.3)"><use class="study-practice-flame" href="#studyPracticeFlame" style="--flame-delay:-.4s"/></g>
   <g transform="translate(54 5.3) scale(-.92 .92)"><use class="study-practice-flame" href="#studyPracticeFlame" style="--flame-delay:-1.2s;--flame-time:2.2s"/></g>
   <g transform="translate(4.5 17) rotate(-49) scale(.84)"><use class="study-practice-flame" href="#studyPracticeFlame" style="--flame-delay:-.9s;--flame-time:2.8s"/></g>
   <g transform="translate(75.5 13.5) rotate(51) scale(.8)"><use class="study-practice-flame" href="#studyPracticeFlame" style="--flame-delay:-1.5s"/></g>
   <g transform="translate(20 26.7) scale(.78)"><use class="study-practice-flame" href="#studyPracticeFlame" style="--flame-delay:-1.8s;--flame-time:2.5s"/></g>
   <g transform="translate(63 26.7) scale(-.82 .82)"><use class="study-practice-flame" href="#studyPracticeFlame" style="--flame-delay:-.6s;--flame-time:2.2s"/></g>
   <circle class="study-practice-spark" cx="18.8" cy="3.2" r=".65"/>
   <circle class="study-practice-spark" cx="76.5" cy="10.8" r=".52" style="--spark-delay:-.4s;--spark-drift:2px"/>
  </svg><span class="study-practice-label">刷题模式</span>`;
  const atlas=header.querySelector('[data-study-atlas]');
  atlas.before(practice);
  atlas.setAttribute('aria-label','配套图册');
  atlas.title='配套图册';
  atlas.innerHTML=`<svg class="study-atlas-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
   <path d="M12 6.5C9.2 4.6 6.3 4.4 3 5.3v13.2c3.3-.9 6.2-.7 9 1.2 2.8-1.9 5.7-2.1 9-1.2V5.3c-3.3-.9-6.2-.7-9 1.2Zm0 0v13.2"/>
   <path d="m5.8 14.8 2.1-3 1.7 2.5m5.1-4.3h3.5m-3.5 3.4h3.5"/>
  </svg>`;
  const contact=document.createElement('button');
  contact.type='button';contact.className='study-contact';contact.dataset.community='follow';
  contact.setAttribute('aria-haspopup','dialog');
  contact.setAttribute('aria-label','联系我');
  contact.title='联系我';
  contact.innerHTML=`<svg class="study-contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
   <path d="M8 4.5h8a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5h-5l-4.4 3v-3.2A5 5 0 0 1 3 12.5v-3a5 5 0 0 1 5-5Z"/>
   <circle class="study-contact-eye" cx="9.5" cy="11" r="1.1"/>
   <circle class="study-contact-eye" cx="14.5" cy="11" r="1.1"/>
  </svg>`;
  const progress=header.querySelector('.study-records');
  const tools=document.createElement('div');
  tools.className='study-header-tools';
  progress.before(tools);
  tools.append(atlas,contact,progress);
  const refreshPractice=()=>{practice.href=practiceHref()};
  for(const event of ['pointerdown','click','auxclick','focus','contextmenu'])practice.addEventListener(event,refreshPractice);
 }
 function refreshReturn(){if(page!=='timeline')return;const r=readReturn(),s=scenes.byId[r.id],a=header?.querySelector('[data-study-nav="lecture"]');if(a){a.href=lectureHref(r.id);a.title=s?'返回地图讲堂 · '+s.name:'地图讲堂'}}
 function remember(id,time){if(!valid(id))return;try{sessionStorage.setItem(key,JSON.stringify({id,time:Number(time)||0}))}catch{}}
 function lectureContext(id){const url=timelineHref(id);document.querySelectorAll('[data-study-nav="timeline"]').forEach(a=>a.href=url);const brand=header?.querySelector('.study-brand');if(brand)brand.href=lectureHref(id,false);if(page==='lecture')header.querySelector('[data-study-nav="lecture"]').href=lectureHref(id,false);}
 function sceneHTML(id){const s=scenes.byId[id];if(!s)return '';return `<figure class="event-scene" data-scene-id="${id}"><button class="event-scene-art" data-scene-open="${id}" aria-label="查看${escape(s.name)}场景插画"><img src="${s.image}" alt="${escape(s.title)}" width="560" height="350" decoding="async"><span>情景插画 <i>↗</i></span></button><figcaption><h3>${escape(s.title)}</h3><p>${escape(s.description)}</p></figcaption></figure>`}
 const dialog=document.createElement('dialog');dialog.className='study-dialog scene-dialog';dialog.id='sceneDialog';dialog.setAttribute('aria-labelledby','sceneDialogTitle');document.body.append(dialog);let opener;
 document.addEventListener('click',event=>{const b=event.target.closest('[data-scene-open]');if(!b)return;const s=scenes.byId[b.dataset.sceneOpen];if(!s)return;opener=b;document.querySelector('audio')?.pause();dialog.innerHTML=`<div class="study-dialog-head"><h2 id="sceneDialogTitle">${escape(s.title)}</h2><button type="button" class="study-dialog-close" aria-label="关闭场景插画">×</button></div><div class="study-dialog-body"><div class="scene-dialog-kicker">${escape(s.name)} · 历史现场</div><img src="${s.image}" alt="${escape(s.title)}"><p>${escape(s.description)}</p><small>情景插画 · 用于辅助理解，非史料照片</small></div>`;dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal()});
 dialog.addEventListener('close',()=>opener?.focus());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 refreshReturn();window.addEventListener('pageshow',refreshReturn);
 return {sceneHTML,readReturn,remember,lectureHref,timelineHref,lectureContext,refreshReturn};
})();
