/* Local, self-confirmed sharing flow. It does not verify sends or Douyin follows. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;else root.MeetingShare=api;
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const storageKey='kaoyan.meeting.image-access.v1';
 const profileURL='https://v.douyin.com/2RkF8cvlGXw/';
 const websiteURL='https://mohe-kaoyan.pages.dev/';
 const originalShare='7- 长按复制此条消息，打开抖音搜索，查看TA的更多作品。 https://v.douyin.com/2RkF8cvlGXw/ 5@9.com :2pm';
 const shareText='考研政治地图＋时间轴＋会议对比，在线背诵、导出复习图。\n'+websiteURL+'\n\n关注抖音「魔盒半开」（kanshanba）看更新；进粉丝群领图册、看复习提醒、提需求。\n\n'+originalShare;
 const signature=(ids,mode)=>[...new Set(ids)].sort().join(',')+'|'+(mode==='full'?'full':'core');
 function normalize(raw){return {firstImage:typeof raw?.firstImage==='string'?raw.firstImage:'',unlocked:raw?.unlocked===true}}
 function createStore(storage){
  let memory=normalize();
  function read(){
   try{const raw=normalize(JSON.parse(storage.getItem(storageKey)));memory={firstImage:raw.firstImage||memory.firstImage,unlocked:raw.unlocked||memory.unlocked}}catch{}
   return {...memory};
  }
  function save(next){memory=normalize(next);try{storage.setItem(storageKey,JSON.stringify(memory))}catch{}return {...memory}}
  return {
   key:storageKey,
   read,
   canExport(){const current=read();return current.unlocked||!current.firstImage},
   recordGenerated(key){const current=read();if(!current.firstImage)save({...current,firstImage:key})},
   unlock(){return save({...read(),unlocked:true})}
  };
 }
 // This is a preparation delay, not evidence that a message was sent.
 function createShareWait(now=Date.now,delayMs=5000){
  let deadline=null;
  return {
   begin(){if(deadline===null)deadline=now()+delayMs},
   remaining(){return deadline===null?null:Math.max(0,Math.ceil((deadline-now())/1000))},
   ready(){return deadline!==null&&now()>=deadline}
  };
 }
 function mount(doc,accessStore){
  const dialog=doc.getElementById('comparisonShareDialog'),text=doc.getElementById('comparisonShareText'),status=doc.getElementById('comparisonShareStatus'),copy=doc.getElementById('copyComparisonShare');
  const confirm=doc.getElementById('confirmComparisonShare'),fallback=doc.getElementById('comparisonShareFallback'),wait=createShareWait();
  const store=accessStore||createStore({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
  dialog.hidden=true;
  text.value=shareText;fallback.hidden=false;doc.getElementById('comparisonShareProfile').href=profileURL;
  function fitShareText(){text.style.height='0px';text.style.height=Math.max(160,text.scrollHeight+2)+'px'}
  doc.defaultView?.addEventListener('resize',()=>{if(dialog.open)fitShareText()});
  doc.fonts?.ready.then(()=>{if(dialog.open)fitShareText()});
  let pending=null,copying=false,manualCopy=false,timer=null;
  const stopTimer=()=>{clearInterval(timer);timer=null};
  const settle=value=>{stopTimer();const done=pending;pending=null;done?.(value)};
  function refreshWait(){
   confirm.disabled=!wait.ready();
   confirm.textContent='分享后继续';
   if(wait.ready())stopTimer();
  }
  function beginWait(){
   wait.begin();fallback.hidden=false;manualCopy=false;
   copy.textContent='已复制';status.textContent='已复制，分享给研友后回来继续。';
   refreshWait();if(!wait.ready()&&!timer)timer=setInterval(refreshWait,250);
  }
  copy.addEventListener('click',async()=>{
   if(copying||!pending)return;
   if(manualCopy){beginWait();return}
   copying=true;const request=pending;
   try{await navigator.clipboard.writeText(shareText);if(pending===request&&dialog.open)beginWait()}
   catch{if(pending===request&&dialog.open){fallback.hidden=false;manualCopy=true;text.focus();text.select();copy.textContent='已手动复制';status.textContent='长按文案复制，再点「已手动复制」。'}}
   finally{copying=false}
  });
  confirm.addEventListener('click',()=>{if(!pending||!wait.ready())return;store.unlock();dialog.hidden=true;settle(true);dialog.close()});
  doc.addEventListener('visibilitychange',()=>{if(pending)refreshWait()});
  doc.getElementById('closeComparisonShare').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{dialog.hidden=true;settle(false)});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
  return {
   recordGenerated:key=>store.recordGenerated(key),
   request(key){
    if(store.canExport(key))return Promise.resolve(true);
    if(pending)return Promise.resolve(false);
    fallback.hidden=false;manualCopy=false;
    status.textContent=wait.remaining()===null?'把这份复习工具分享给研友。':'已复制，分享给研友后回来继续。';
    copy.textContent=wait.remaining()===null?'复制文案':'已复制';refreshWait();
    if(wait.remaining()!==null&&!wait.ready()&&!timer)timer=setInterval(refreshWait,250);
    const result=new Promise(resolve=>pending=resolve);
    dialog.hidden=false;dialog.showModal();fitShareText();doc.getElementById('closeComparisonShare').focus();
    return result;
   }
  };
 }
 return {signature,createStore,createShareWait,mount,profileURL,websiteURL,originalShare,shareText};
});
