'use strict';
(() => {
 const header=document.querySelector('.study-header');
 if(!header)return;
 const follow=document.createElement('dialog');follow.id='communityDialog';follow.className='study-dialog community-dialog';follow.setAttribute('aria-labelledby','communityDialogTitle');
 follow.innerHTML=`
  <div class="study-dialog-head">
   <h2 id="communityDialogTitle">联系魔盒半开</h2>
   <button type="button" class="community-close study-dialog-close" aria-label="关闭联系方式">×</button>
  </div>
  <div class="study-dialog-body">
   <div class="community-channels">
    <figure class="community-channel">
     <figcaption><b>抖音</b><span>复习演示 · 粉丝群</span></figcaption>
     <img src="assets/community/qr_douyin.png" width="520" height="520" alt="魔盒半开抖音二维码" loading="lazy">
     <a class="community-save" href="assets/community/qr_douyin.png" download="魔盒半开-抖音二维码.png" aria-label="保存抖音二维码">保存二维码 ↓</a>
    </figure>
    <figure class="community-channel">
     <figcaption><b>微信公众号</b><span>关注更新 · 留言联系</span></figcaption>
     <img src="assets/community/qr_wechat.jpg" width="258" height="258" alt="魔盒半开微信公众号二维码" loading="lazy">
     <a class="community-save" href="assets/community/qr_wechat.jpg" download="魔盒半开-微信公众号二维码.jpg" aria-label="保存微信公众号二维码">保存二维码 ↓</a>
    </figure>
   </div>
   <div class="community-contact-details">
    <p>扫一扫关注，也可保存二维码后在对应 App 识别。</p>
    <div class="community-contact-actions">
     <button type="button" data-copy-account>复制抖音号 <span>kanshanba</span></button>
     <button type="button" data-community="roadmap">功能进展 →</button>
    </div>
    <p class="community-feedback" role="status"></p>
   </div>
   <div class="community-group-guide" hidden>
    <p>从抖音主页进入「粉丝群」，看资料更新、交流刷题问题或提功能建议。</p>
    <p class="community-request-text"></p>
    <button type="button" data-copy-request>复制这条需求</button>
    <p class="community-request-feedback" role="status"></p>
   </div>
  </div>`;
 document.body.append(follow);
 const requestText={
  '毛选':'希望增加《毛选》专题，按篇目梳理背景、核心观点和阅读线索。',
  '考研英语':'希望增加考研英语模块，想先交流词汇、长难句或阅读训练的具体需求。',
  '沙盘路线':'想给现有沙盘增加路线或节点，我会补充具体历史阶段和希望改进的地方。',
  '功能建议':'有一个网站功能建议，想说明复习时遇到的问题和希望改进的地方。',
  '复习问题':'复习时有一个卡点，想带着题目或截图在群里交流。'
 };
 let selectedRequest='';
 function prepareFollow(trigger){
  const group=trigger?.dataset.community==='group';
  follow.querySelector('#communityDialogTitle').textContent=group?'加入抖音群':'联系魔盒半开';
  follow.querySelector('.community-close').setAttribute('aria-label',group?'关闭抖音群说明':'关闭联系方式');
  follow.querySelector('.community-group-guide').hidden=!group;
  selectedRequest=requestText[trigger?.dataset.requestTopic]||'';
  follow.querySelector('.community-request-text').textContent=selectedRequest;
  follow.querySelector('[data-copy-request]').hidden=!selectedRequest;
  follow.querySelector('.community-request-feedback').textContent='';
 }
 const options=[{id:1,title:'挖空背诵',short:'挖空背诵',description:'先回忆，再点开关键词核对。',status:'开发中'},{id:2,title:'会议对比',short:'会议对比',description:'并排比较时间、决议与易混点。',status:'已上线'},{id:3,title:'肖八肖四考点高亮',short:'肖八肖四考点高亮',description:'核对卷次与题号后，再标注关联考点。',status:'待上线'}];
 const roadmap=document.createElement('dialog');roadmap.id='roadmapDialog';roadmap.className='study-dialog community-dialog roadmap-dialog';roadmap.setAttribute('aria-labelledby','roadmapTitle');
 roadmap.innerHTML=`<div class="study-dialog-head"><h2 id="roadmapTitle">复习工具，持续完善</h2><button type="button" class="community-close study-dialog-close" aria-label="关闭功能预告">×</button></div><div class="study-dialog-body"><p class="community-kicker">工具进展 · 持续更新</p><p class="community-intro">会议对比已上线。其余功能可选择后到最新视频评论区反馈。</p><div class="community-options">${options.map(o=>o.id===2?`<a href="meetings.html" class="community-feature-link"><span class="community-option-no">02</span><span><b>会议对比</b><small>24 场会议，时间、决议与易混点并排看。</small></span><em>打开 →</em></a>`:`<button type="button" data-community-vote="${o.id}" aria-pressed="false"><span class="community-option-no">0${o.id}</span><span><b>${o.title}</b><small>${o.description}</small></span><em>${o.status}</em></button>`).join('')}</div><div class="community-vote-footer"><span>抖音 <b>@魔盒半开</b></span><button type="button" data-copy-vote>复制留言</button></div><p class="community-vote-status" aria-live="polite">这里只保存你的选择，不统计全网票数。</p><div class="community-actions"><button type="button" data-community="follow">查看二维码 · 关注更新 ↗</button></div></div>`;
 document.body.append(roadmap);
 let choice=0,returnFocus=null,activeDialog=null;
 try{const value=Number(localStorage.getItem('kaoyan.vote.v1'));if(value!==2&&options.some(o=>o.id===value))choice=value}catch{}
 function paint(){
  roadmap.querySelectorAll('[data-community-vote]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.communityVote)===choice));
  document.querySelectorAll('[data-roadmap-choice]').forEach(b=>b.dataset.voted=String(Number(b.dataset.roadmapChoice)===choice));
  roadmap.querySelector('[data-copy-vote]').disabled=!choice;
  roadmap.querySelector('.community-vote-status').textContent=choice?`已选 ${choice} · ${options[choice-1].short}。复制后到抖音评论区留言。`:'这里只保存你的选择，不统计全网票数。';
 }
 function selectChoice(id){if(id===2||!options.some(o=>o.id===id))return;choice=id;try{localStorage.setItem('kaoyan.vote.v1',String(choice))}catch{}paint()}
 function open(dialog,trigger){
  document.querySelector('audio')?.pause();
  if(dialog===follow)prepareFollow(trigger);
  if(activeDialog?.open){const previous=activeDialog;activeDialog=dialog;previous.close()}
  else {returnFocus=trigger||document.activeElement;activeDialog=dialog}
  follow.querySelector('.community-feedback').textContent='';paint();dialog.showModal();
  dialog.querySelector('.study-dialog-body').scrollTop=0;
  dialog.querySelector('.community-close').focus({preventScroll:true});
 }
 for(const dialog of [follow,roadmap]){
  dialog.querySelector('.community-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{if(activeDialog===dialog&&!dialog.open){activeDialog=null;if(returnFocus?.isConnected)returnFocus.focus()}});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-community],[data-roadmap-choice]');if(!trigger)return;
  if(trigger.hasAttribute('data-roadmap-choice')){selectChoice(Number(trigger.dataset.roadmapChoice));open(roadmap,trigger)}
  else open(['follow','group'].includes(trigger.dataset.community)?follow:roadmap,trigger);
 });
 roadmap.querySelectorAll('[data-community-vote]').forEach(b=>b.onclick=()=>selectChoice(Number(b.dataset.communityVote)));
 follow.querySelector('[data-copy-account]').onclick=async()=>{const status=follow.querySelector('.community-feedback');try{await navigator.clipboard.writeText('kanshanba');status.textContent='已复制抖音号，打开抖音搜索即可。'}catch{status.textContent='请长按或选中上方抖音号 kanshanba 复制。'}};
 follow.querySelector('[data-copy-request]').onclick=async()=>{if(!selectedRequest)return;const status=follow.querySelector('.community-request-feedback');try{await navigator.clipboard.writeText(selectedRequest);status.textContent='已复制，可补充细节后发到群里或抖音私信。'}catch{status.textContent='请长按或选中上方需求文字复制。'}};
 roadmap.querySelector('[data-copy-vote]').onclick=async()=>{if(!choice)return;const text=choice+'，想先用'+options[choice-1].short;try{await navigator.clipboard.writeText(text);roadmap.querySelector('.community-vote-status').textContent='已复制：'+text+'。请到抖音评论区粘贴。'}catch{roadmap.querySelector('.community-vote-status').textContent='请手动复制：'+text}};
 paint();
})();
