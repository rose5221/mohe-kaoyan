/* First-party, coarse Cloudflare location. Local files and unavailable location
 * use a generic welcome. This animation does not measure online presence.
 */
'use strict';
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else { root.StudyWelcome=api;api.mount(document); }
})(typeof window==='undefined'?globalThis:window,function(){
 const SESSION_KEY='kaoyan.study.welcome.v1';
 const activePlays=new WeakMap();
 function createVisit(storage){
  let claimed=false;
  return {claim(){
   if(claimed)return false;claimed=true;
   try{if(storage?.getItem(SESSION_KEY)==='1')return false;storage?.setItem(SESSION_KEY,'1')}catch(_){}
   return true;
  }};
 }
 function placeLabel(data){
  const clean=value=>typeof value==='string'&&/^[\u4e00-\u9fff]{2,14}$/.test(value)?value:'';
  const region=clean(data?.region),city=clean(data?.city);
  return [region,city!==region?city:''].filter(Boolean).join(' · ');
 }
 async function loadLocation(win,timeout=1200){
  if(!['https:','http:'].includes(win.location.protocol)||!win.fetch)return '';
  // A plain local static server has no edge metadata; don't make a failing request.
  if(['localhost','127.0.0.1','[::1]'].includes(win.location.hostname))return '';
  const controller=new win.AbortController();let timer;
  try{
   const expired=new Promise(resolve=>{timer=win.setTimeout(()=>{controller.abort();resolve('')},timeout)});
   const result=(async()=>{
    const response=await win.fetch('/api/study-location',{credentials:'omit',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return '';
    return placeLabel(await response.json());
   })().catch(()=>'');
   return await Promise.race([result,expired]);
  }catch(_){return ''}finally{win.clearTimeout(timer)}
 }
 // Sample one eased cubic curve for the type, comet and trail. All three use
 // the same positions and arc distances, so the handoff has no midpoint kink.
 function flightGeometry(from,to,steps=80){
  const dx=to.x-from.x,dy=to.y-from.y;
  const c1={x:dx*.07,y:dy*.7},c2={x:dx*.7,y:dy*.98};
  let distance=0,previous={x:0,y:0};
  const points=Array.from({length:steps+1},(_,i)=>{
   const t=i/steps,u=t*t*t*(t*(t*6-15)+10),v=1-u;
   const x=3*v*v*u*c1.x+3*v*u*u*c2.x+u*u*u*dx;
   const y=3*v*v*u*c1.y+3*v*u*u*c2.y+u*u*u*dy;
   distance+=Math.hypot(x-previous.x,y-previous.y);previous={x,y};
   return {t,x,y,distance};
  });
  return {points,length:distance,path:`M${from.x} ${from.y} C${from.x+c1.x} ${from.y+c1.y},${from.x+c2.x} ${from.y+c2.y},${to.x} ${to.y}`};
 }
 function play(doc,place,{audience=doc.defaultView.StudyTogether?.controller,reduced=doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches}={}){
  const win=doc.defaultView,target=doc.querySelector('.study-together-value');
  if(!target)return {finished:Promise.resolve(),cancel(){}};
  activePlays.get(doc)?.cancel();
  const layer=doc.createElement('div');layer.className='study-arrival';
  layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');
  layer.innerHTML='<div class="study-arrival-scene"><div class="study-arrival-mark" aria-hidden="true"><svg viewBox="0 0 260 110"><ellipse class="arrival-orbit-faint" cx="130" cy="55" rx="104" ry="30" transform="rotate(-15 130 55)"/><path class="arrival-orbit-main" d="M31 76C24 59 65 33 121 24S226 21 229 37C234 54 194 78 139 87"/><ellipse class="arrival-orbit-inner" cx="130" cy="55" rx="55" ry="21" transform="rotate(22 130 55)"/><path class="arrival-star" d="m130 37 4.5 13.5L148 55l-13.5 4.5L130 73l-4.5-13.5L112 55l13.5-4.5Z"/><path class="arrival-radiance" d="M130 23v7m0 50v7M98 55h7m50 0h7"/><circle class="arrival-satellite" cx="62" cy="45" r="2"/><circle class="arrival-satellite" cx="210" cy="62" r="1.6"/><circle class="arrival-satellite" cx="162" cy="26" r="1"/></svg></div><p class="study-arrival-kicker">欢迎入场</p><p class="study-arrival-place"></p><p class="study-arrival-caption"></p><i class="study-arrival-dust" aria-hidden="true"></i><i class="study-arrival-dust" aria-hidden="true"></i><i class="study-arrival-dust" aria-hidden="true"></i></div>';
  const card=layer.firstElementChild;
  layer.querySelector('.study-arrival-place').textContent=place||'欢迎你，研友';
  layer.querySelector('.study-arrival-caption').textContent=place?'的研友 · 一起同屏背诵':'一起同屏背诵';
  if(place.length>13)card.classList.add('study-arrival-long');
  doc.body.append(layer);
  // Stay inside the visible content area, below navigation and above playback controls.
  const header=doc.querySelector('.study-header')?.getBoundingClientRect();
  const toolbar=doc.querySelector('.workspace-toolbar,#top')?.getBoundingClientRect();
  const viewport=win.visualViewport;
  const height=viewport?.height||win.innerHeight,top=viewport?.offsetTop||0;
  let cardHeight=card.getBoundingClientRect().height;
  const player=doc.querySelector('.player')?.getBoundingClientRect();
  const lower=player&&player.top>0&&player.top<height?player.top-10:top+height-40;
  const upper=Math.max(header?.bottom||72,toolbar?.bottom||0)+8;
  if(cardHeight>lower-upper){layer.classList.add('study-arrival-compact');cardHeight=card.getBoundingClientRect().height;}
  const center=Math.max(upper+cardHeight/2,Math.min(top+height*.43,lower-cardHeight/2));
  layer.style.top=center+'px';
  audience?.beginArrival();
  let ended=false,landed=false,delayTimer,safetyTimer,resolveFinished;
  const motions=[],travelNodes=[];
  const finished=new Promise(resolve=>{resolveFinished=resolve});
  const animate=(element,frames,options)=>{
   if(!element.animate)return null;
   const motion=element.animate(frames,options);motions.push(motion);return motion;
  };
  const cleanup=()=>{
   win.clearTimeout(delayTimer);win.clearTimeout(safetyTimer);
   motions.forEach(motion=>motion.cancel());travelNodes.forEach(node=>node.remove());layer.remove();
   doc.removeEventListener('pointerdown',interact,true);doc.removeEventListener('keydown',interact,true);
   doc.removeEventListener('visibilitychange',hide);win.removeEventListener('pagehide',cancel);
   win.removeEventListener('resize',cancel);viewport?.removeEventListener('resize',cancel);
   observer.disconnect();
   activePlays.delete(doc);
  };
  const land=()=>{
   if(ended)return;ended=true;landed=true;
   const previous=target.textContent;cleanup();audience?.completeArrival();
   const countRect=target.getBoundingClientRect();
   const visible=countRect.width>0&&countRect.bottom>0&&countRect.top<height;
   if(visible&&!doc.hidden){
    const plus=doc.createElement('span');plus.className='study-arrival-plus';plus.textContent='+1';plus.setAttribute('aria-hidden','true');
    plus.style.left=(countRect.right+3)+'px';plus.style.top=Math.max(2,countRect.top-8)+'px';doc.body.append(plus);
    let ghost,ripple;const landingMotions=[];
    if(!reduced&&target.animate){
     ghost=doc.createElement('span');ghost.className='study-arrival-old';ghost.textContent=previous;ghost.setAttribute('aria-hidden','true');
     Object.assign(ghost.style,{left:countRect.left+'px',top:countRect.top+'px',width:countRect.width+'px',height:countRect.height+'px',font:win.getComputedStyle(target).font});doc.body.append(ghost);
     landingMotions.push(ghost.animate([{opacity:.8,transform:'translateY(0)'},{opacity:0,transform:'translateY(-9px)'}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'}));
     landingMotions.push(target.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(-1px)',color:'var(--paper)',offset:.7},{opacity:1,transform:'translateY(0)',color:'var(--gold)'}],{duration:520,easing:'cubic-bezier(.16,1,.3,1)'}));
     ripple=doc.createElement('i');ripple.className='study-arrival-ripple';ripple.setAttribute('aria-hidden','true');ripple.style.left=(countRect.left+countRect.width/2)+'px';ripple.style.top=(countRect.top+countRect.height/2)+'px';doc.body.append(ripple);
     landingMotions.push(ripple.animate([{opacity:.75,transform:'scale(.3)'},{opacity:0,transform:'scale(1.65)'}],{duration:650,easing:'ease-out',fill:'forwards'}));
     landingMotions.push(plus.animate([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)',offset:.22},{opacity:.8,offset:.65},{opacity:0,transform:'translateY(-7px)'}],{duration:1050,fill:'forwards'}));
    }
    win.setTimeout(()=>{plus.remove();ghost?.remove();ripple?.remove();landingMotions.forEach(motion=>motion.cancel())},1150);
   }
   resolveFinished({landed});
  };
  const cancel=()=>{if(ended)return;ended=true;cleanup();audience?.completeArrival();resolveFinished({landed:false})};
  const hide=()=>{if(doc.hidden)cancel()};
  const interact=event=>{if(event.type==='pointerdown'||['Escape','Tab','Enter',' '].includes(event.key))cancel()};
  const observer=new win.MutationObserver(()=>{if(doc.querySelector('dialog[open],#sand:not([hidden])'))cancel()});
  observer.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['open','hidden']});
  doc.addEventListener('pointerdown',interact,true);doc.addEventListener('keydown',interact,true);
  doc.addEventListener('visibilitychange',hide);win.addEventListener('pagehide',cancel);
  win.addEventListener('resize',cancel);viewport?.addEventListener('resize',cancel);
  const fly=()=>{
   if(ended)return;
   if(reduced){land();return}
   const box=card.getBoundingClientRect(),destination=target.getBoundingClientRect();
   if(destination.bottom<0||destination.top>height){land();return}
   const from={x:box.left+box.width/2,y:box.top+box.height/2},to={x:destination.left+destination.width/2,y:destination.top+destination.height/2};
   const route=flightGeometry(from,to),duration=1100;
   layer.dataset.phase='flying';
   const comet=doc.createElement('i');comet.className='study-arrival-comet';comet.setAttribute('aria-hidden','true');comet.style.left=from.x+'px';comet.style.top=from.y+'px';doc.body.append(comet);travelNodes.push(comet);
   const trail=doc.createElementNS('http://www.w3.org/2000/svg','svg');trail.setAttribute('class','study-arrival-trail');trail.setAttribute('aria-hidden','true');
   const path=doc.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',route.path);trail.append(path);doc.body.append(trail);travelNodes.push(trail);
   const length=path.getTotalLength(),tail=Math.min(86,length*.16);path.style.strokeDasharray=`${tail} ${length}`;
   animate(trail,[{opacity:0},{opacity:.65,offset:.28},{opacity:.5,offset:.8},{opacity:0}],{duration,fill:'forwards'});
   animate(path,route.points.map(p=>({offset:p.t,strokeDashoffset:tail-length*p.distance/Math.max(1,route.length)})),{duration,fill:'forwards'});
   animate(comet,route.points.map(p=>({offset:p.t,transform:`translate(${p.x}px,${p.y}px) scale(${.35+.8*Math.sin(Math.PI*p.t)})`,opacity:Math.min(1,p.t*5)})),{duration,fill:'forwards'});
   const motion=animate(card,route.points.map(p=>({offset:p.t,transform:`translate(${p.x}px,${p.y}px) scale(${Math.max(.018,1-p.t*1.25)})`,opacity:Math.max(0,1-p.t*2.5)})),{duration,fill:'forwards'});
   if(motion)motion.finished.then(land,()=>{});else land();
  };
  layer.dataset.phase='welcome';
  if(!reduced)animate(card,[{opacity:0,transform:'translateY(8px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
  else layer.dataset.reduced='true';
  delayTimer=win.setTimeout(fly,reduced?1100:1850);
  safetyTimer=win.setTimeout(cancel,4500);
  const handle={finished,cancel};activePlays.set(doc,handle);return handle;
 }
 async function mount(doc){
  const win=doc.defaultView;if(!doc.querySelector('[data-study-together]'))return;
  let storage;try{storage=win.sessionStorage}catch(_){}
  const audience=win.StudyTogether?.controller;
  if(!createVisit(storage).claim()){audience?.resumeJoined();return}
  let interacted=false;
  const interactedEarly=()=>{interacted=true};
  doc.addEventListener('pointerdown',interactedEarly,{once:true,capture:true});
  doc.addEventListener('keydown',interactedEarly,{once:true,capture:true});
  const place=await loadLocation(win);
  doc.removeEventListener('pointerdown',interactedEarly,true);doc.removeEventListener('keydown',interactedEarly,true);
  if(interacted||doc.querySelector('dialog[open],#sand:not([hidden])')){audience?.resumeJoined();return}
  if(doc.hidden){await new Promise(resolve=>{
   const ready=()=>{if(!doc.hidden){doc.removeEventListener('visibilitychange',ready);resolve()}};
   doc.addEventListener('visibilitychange',ready);
  })}
  return play(doc,place,{audience});
 }
 return {SESSION_KEY,createVisit,placeLabel,loadLocation,flightGeometry,play,mount};
});
