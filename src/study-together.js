/* Owner-requested generated audience and regional activity ambience, not measured traffic or group events. */
'use strict';
(function (root, factory) {
 const api = factory();
 if (typeof module === 'object' && module.exports) module.exports = api;
 else { root.StudyTogether = api; api.controller = api.mount(document); }
})(typeof window === 'undefined' ? globalThis : window, function () {
 const rhythm = [[0,105],[1,78],[3,43],[5,40],[6,95],[8,280],[10,390],[12,315],[14,370],[17,340],[19,455],[21,480],[23,275],[24,105]];
 const locations=['山东','河南','江苏','四川','湖北','广东','河北','湖南','安徽','浙江','陕西','辽宁','福建','江西','山西','云南','贵州','广西','吉林','甘肃','济南','青岛','郑州','南京','苏州','成都','武汉','广州','深圳','长沙','合肥','杭州','西安','沈阳','福州','南昌','昆明','南宁','重庆','天津'];
 const activities = [
  {groupBenefit:false,kind:'group',phrases:['加入了抖音粉丝群','进群和大家一起复习'],short:'加入了抖音群',target:'group',action:'查看进群方式'},
  {groupBenefit:false,kind:'study',phrases:['回看了{subject}考点','又背了一遍{subject}'],subjects:['遵义会议','中共七大','八七会议','七届二中全会','十一届三中全会'],short:'复习了{subject}',target:'meetings',action:'打开会议对比'},
  {kind:'atlas',phrases:['在抖音粉丝群领取了{subject}','从抖音群保存了{subject}'],subjects:['时间轴图册','67页复习图册','配套PDF图册'],short:'在抖音群领了图册',target:'atlas',action:'查看配套图册'},
  {kind:'request',phrases:['在抖音粉丝群提了{subject}需求','在抖音群建议增加{subject}'],subjects:['毛选导读','毛选篇目解读','毛选逻辑梳理'],short:'在抖音群提了毛选需求',target:'group',topic:'毛选',action:'交流毛选专题需求'},
  {groupBenefit:false,kind:'study',phrases:['跟着沙盘复盘了{subject}','回看了一遍{subject}推演'],subjects:['长征路线','三大战役','渡江战役','抗美援朝'],short:'复盘了{subject}',target:'sandbox',action:'打开沙盘推演'},
  {kind:'group',phrases:['在抖音粉丝群查看了{subject}','在抖音群跟进了{subject}'],subjects:['图册修订说明','重要信息更新','新的工具进展','复习资料更新'],short:'查看了群内重要更新',target:'group',action:'查看进群方式'},
  {kind:'request',phrases:['在抖音粉丝群提了{subject}需求','在抖音群补充了{subject}建议'],subjects:['考研英语','英语长难句','英语阅读训练','考研词汇复习'],short:'在群里提了英语需求',target:'group',topic:'考研英语',action:'交流考研英语需求'},
  {kind:'atlas',phrases:['在抖音群领走图册准备离线背诵','从粉丝群保存图册准备明天复习'],short:'从抖音群保存了图册',target:'atlas',action:'查看配套图册'},
  {groupBenefit:false,kind:'study',phrases:['并排对照了{subject}','梳理了一遍{subject}的区别'],subjects:['遵义与延安','七大与七届二中全会','八七会议与遵义会议','三份历史决议'],short:'核对了会议易混点',target:'meetings',action:'打开会议对比'},
  {kind:'request',phrases:['在抖音粉丝群提交了{subject}建议','在抖音群讨论了{subject}需求'],subjects:['沙盘新路线','沙盘关键节点','沙盘战役讲解'],short:'在群里提了沙盘需求',target:'group',topic:'沙盘路线',action:'交流沙盘路线需求'},
  {groupBenefit:false,kind:'follow',phrases:['关注了主播，准备进群','从主播主页找到了粉丝群'],short:'关注了主播',target:'group',action:'查看进群方式'},
  {kind:'group',phrases:['在抖音粉丝群交流了{subject}','带着{subject}到抖音群讨论'],subjects:['一道易混题','一处时间线疑问','一道选择题思路','一个史纲卡点'],short:'在抖音群交流了错题',target:'group',topic:'复习问题',action:'查看进群方式'},
  {kind:'request',phrases:['在抖音粉丝群提出{subject}需求','在抖音群建议增加{subject}'],subjects:['背诵壁纸','手机速记卡','会议速记表','错题复盘工具'],short:'在群里提了新功能需求',target:'group',topic:'功能建议',action:'交流功能需求'},
  {groupBenefit:false,kind:'study',phrases:['顺着地图梳理了{subject}','又看了一遍{subject}的过程'],subjects:['长征','北伐战争','三大战役','渡江战役'],short:'学习了{subject}',target:'sandbox',action:'打开沙盘推演'},
  {groupBenefit:false,kind:'request',phrases:['私信主播反馈了复习卡点','私信主播补充了具体学习需求'],short:'私信主播反馈了需求',target:'group',topic:'复习问题',action:'交流复习问题'},
  {kind:'atlas',phrases:['把群里的PDF图册存到了平板','从抖音群领图册准备离线复习'],short:'从群里保存了PDF图册',target:'atlas',action:'查看配套图册'},
  {kind:'group',phrases:['进群和研友交流复习安排','在抖音群分享了背诵思路'],short:'在群里交流背诵思路',target:'group',action:'查看进群方式'},
  {kind:'request',phrases:['在抖音群建议增加{subject}','在抖音群反馈了{subject}需求'],subjects:['易混点对照','会议背景梳理','挖空背诵','时间线速记'],short:'在群里反馈了工具建议',target:'group',topic:'功能建议',action:'交流功能需求'},
  {groupBenefit:false,kind:'study',phrases:['用图册复习了{subject}','又梳理了一遍{subject}'],subjects:['土地改革','三大改造','改革开放','抗日战争'],short:'复习了{subject}',target:'atlas',action:'查看配套图册'},
  {groupBenefit:false,kind:'study',phrases:['重新核对了{subject}','把{subject}又记了一遍'],subjects:['重要会议时间','历史转折点','几组易混概念','史纲关键年份'],short:'复习了{subject}',target:'meetings',action:'打开会议对比'},
  {kind:'atlas',phrases:['在抖音群找到了图册下载入口','照着群内说明保存了配套图册'],short:'在群里找到了图册入口',target:'atlas',action:'查看配套图册'},
  {kind:'group',phrases:['在抖音群学会了{subject}','照着抖音群说明完成了{subject}'],subjects:['导出对比图','保存学习卡','切换对比组合'],short:'在群里学会了导出图片',target:'group',action:'查看进群方式'},
  {kind:'atlas',phrases:['在抖音群问清了图册打印方法','参考群内建议选好了图册打印页'],short:'在群里问清了打印方法',target:'group',action:'查看进群方式'},
  {kind:'group',phrases:['在抖音群看到了{subject}','通过抖音群跟进了{subject}'],subjects:['重要信息补充','工具使用说明','图册修订提醒'],short:'在群里看到了更新提醒',target:'group',action:'查看进群方式'},
  {kind:'group',phrases:['在抖音群和大家分清了{subject}','和抖音群研友核对了{subject}'],subjects:['提出与确立','两场会议差别','几个易混年份'],short:'在群里分清了易混考点',target:'group',topic:'复习问题',action:'交流复习问题'},
  {kind:'request',phrases:['在抖音群补充了{subject}使用场景','在抖音群说明了{subject}学习需求'],subjects:['毛选导读','考研英语','沙盘路线'],short:'在群里补充了学习需求',target:'group',topic:'功能建议',action:'交流功能需求'},
  {kind:'atlas',phrases:['在抖音群对照了图册修订内容','根据群内提醒重看了易混考点'],short:'在群里核对了图册修订',target:'group',action:'查看进群方式'},
  {kind:'group',phrases:['在抖音群问清了{subject}用法','跟着群内说明试会了{subject}'],subjects:['地图定位','沙盘播放','会议筛选'],short:'在群里问清了工具用法',target:'group',action:'查看进群方式'},
  {kind:'group',phrases:['在抖音群讨论后理清了错题思路','在抖音群交流后补上了遗漏考点'],short:'在群里理清了错题思路',target:'group',topic:'复习问题',action:'交流复习问题'},
  {kind:'atlas',phrases:['在抖音群学会把图册存到平板','参考抖音群说明备好了离线图册'],short:'在群里学会了离线保存',target:'atlas',action:'查看配套图册'},
  {kind:'group',phrases:['在抖音群交流了{subject}复习方法','从抖音群讨论里整理了{subject}思路'],subjects:['史纲','会议','时间线'],short:'从群里整理了复习思路',target:'group',action:'查看进群方式'},
  {kind:'request',phrases:['在抖音群反馈了工具使用问题','在抖音群给新功能补充了建议'],short:'在群里反馈了使用问题',target:'group',topic:'功能建议',action:'交流功能需求'}
 ];
 // Keep community benefits at 3:1 independently of how many templates each pool has.
 activities.forEach(item=>item.groupBenefit??=true);
 const activityPools=[true,false].map(groupBenefit=>activities.flatMap((item,index)=>item.groupBenefit===groupBenefit?[index]:[]));
 function activityAt(index, context = {}) {
  const position=((index % activities.length) + activities.length) % activities.length;
  const item = {...activities[position]};
  const random=context.random||Math.random;
  const choices=locations.filter(name=>name!==context.previousLocation);
  item.location=choices[Math.floor(random()*choices.length)];
  const subject=item.subjects?.[Math.floor(random()*item.subjects.length)]||'';
  const phrase=item.phrases[Math.floor(random()*item.phrases.length)].replace('{subject}',subject);
  item.secondsAgo=3+Math.floor(random()*57);
  const prefix=`${item.secondsAgo}秒前 · ${item.location}研友`;
  item.text=`${prefix}${phrase}`;
  item.compactText=`${prefix}${item.short.replace('{subject}',subject)}`;
  return item;
 }
 function createRotation({size,pools,render,schedule=setTimeout,cancel=clearTimeout,delay=()=>7000+Math.floor(Math.random()*2000),random=Math.random}) {
  const groups=pools||[Array.from({length:size},(_,i)=>i)],pattern=groups.length===1?[0]:[0,0,0,1];
  let index=-1,timer=null,step=Math.floor(random()*pattern.length);
  const bags=groups.map(()=>[]);
  const reasons=new Set();
  const draw=()=>{
   const pool=pattern[step++%pattern.length];let bag=bags[pool];
   if(!bag.length){
    bag=bags[pool]=[...groups[pool]];
    for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}
    if(bag.length>1&&bag.at(-1)===index)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
   }
   index=bag.pop();render(index);
  };
  const clear=()=>{if(timer!==null)cancel(timer);timer=null};
  const arm=()=>{if(timer===null&&!reasons.size)timer=schedule(()=>{timer=null;draw();arm()},typeof delay==='function'?delay():delay)};
  const setPaused=(reason,paused)=>{if(reasons.has(reason)===paused)return;paused?reasons.add(reason):reasons.delete(reason);clear();arm()};
  draw();arm();
  return {setPaused,destroy(){reasons.add('destroyed');clear()},get index(){return index}};
 }
 function at(time) {
  const date = new Date(time);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid study time');
  const beijing = new Date(date.getTime() + 8 * 3600000);
  const hour = beijing.getUTCHours(), minute = beijing.getUTCMinutes();
  const h = hour + minute / 60 + beijing.getUTCSeconds() / 3600;
  const next = rhythm.findIndex(([x]) => x > h);
  const [a, low] = rhythm[next - 1], [b, high] = rhythm[next];
  const t = (h - a) / (b - a), ease = t * t * (3 - 2 * t);
  // Consistent across tabs. No backend requests; these are generated display values.
  const phase = date.getTime() / 1000;
  const overnight = hour >= 1 && hour < 5;
  const ripple = (20 * Math.sin(phase / 3) + 13 * Math.sin(phase / 8) + 6 * Math.sin(phase / 27)) * (overnight ? .5 : 1);
  const value = Math.round(Math.max(35, Math.min(overnight ? 95 : 520, low + (high - low) * ease + ripple)));
  const clock = String(hour).padStart(2,'0') + ':' + String(minute).padStart(2,'0');
  const night = hour >= 23 || hour < 6;
  const period = night ? 'night' : hour < 12 ? 'day' : hour < 18 ? 'afternoon' : 'evening';
  const [periodLabel,message] = {
   day:['白天','位研友和你一起背诵'],
   afternoon:['下午','位研友正在一起复习'],
   evening:['晚上','位研友陪你温习考点'],
   night:['深夜','位研友还在陪你背诵']
  }[period];
  return { value, night, clock, period, periodLabel, message };
 }
 function paint(element, state) {
  element.dataset.period = state.period;
  element.querySelector('.study-together-period').textContent = state.periodLabel;
  element.querySelector('.study-together-value').textContent = state.value;
  element.querySelector('.study-together-copy').textContent = state.message;
 }
 function mount(doc) {
  const element = doc.querySelector('[data-study-together]');
  if (!element) return;
  const nav = doc.querySelector('.study-header nav');
  let rotation = null, interruptMotion=()=>{};
  if (nav && !doc.querySelector('.study-live-toast')) {
   const toast=doc.createElement('div');toast.className='study-live-toast study-activity';toast.setAttribute('role','region');toast.setAttribute('aria-label','研友动态');
   toast.innerHTML='<button type="button" class="study-activity-link"><svg viewBox="0 0 16 16" aria-hidden="true"><path/></svg><span class="study-activity-copy"><span class="study-activity-wide"></span><span class="study-activity-narrow"></span></span></button>';
   nav.insertAdjacentElement('afterend',toast);
   const link=toast.querySelector('.study-activity-link'),label=toast.querySelector('.study-activity-copy');
   const icons={study:'M2 3h5l1 1 1-1h5v10H9l-1 1-1-1H2ZM8 4v10',atlas:'M4 1h7l2 2v12H3V1Zm2 5h5M6 9h5M6 12h3',group:'M2 2h12v9H7l-4 3v-3H2ZM5 6h6',request:'m3 10 7-7 3 3-7 7-4 1ZM9 4l3 3',follow:'M8 13S1 9 2 5c1-4 5-3 6-1 1-2 5-3 6 1 1 4-6 8-6 8Z'};
   let current,motion=null;
   const pointerCanHover=()=>window.matchMedia('(hover:hover)').matches;
   const isReading=()=>pointerCanHover()&&toast.matches(':hover')||link.matches(':focus-visible');
   interruptMotion=()=>motion?.cancel();
   const render=index=>{
    current=activityAt(index,{previousLocation:current?.location});
    for(const key of ['studyAtlas','community','requestTopic'])delete link.dataset[key];
    if(current.target==='atlas')link.dataset.studyAtlas='';
    if(['group','follow'].includes(current.target))link.dataset.community=current.target;
    if(current.topic)link.dataset.requestTopic=current.topic;
    link.setAttribute('aria-label',`${current.text}，${current.action}`);link.title=current.action;
    link.querySelector('path').setAttribute('d',icons[current.kind]);label.querySelector('.study-activity-wide').textContent=current.text;label.querySelector('.study-activity-narrow').textContent=current.compactText;
    toast.dataset.kind=current.kind;
    interruptMotion();
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!isReading())motion=link.animate([{opacity:0,transform:'translateY(3px)',offset:0},{opacity:1,transform:'translateY(0)',offset:.08},{opacity:1,transform:'translateY(0)',offset:.9},{opacity:0,transform:'translateY(-2px)',offset:1}],{duration:5200,easing:'ease-out',fill:'forwards'});
   };
   rotation=createRotation({size:activities.length,pools:activityPools,render});
   toast.addEventListener('mouseenter',()=>{if(pointerCanHover()){interruptMotion();rotation.setPaused('hover',true)}});toast.addEventListener('mouseleave',()=>rotation.setPaused('hover',false));
   toast.addEventListener('focusin',()=>{const keyboard=link.matches(':focus-visible');if(keyboard)interruptMotion();rotation.setPaused('focus',keyboard)});toast.addEventListener('focusout',event=>{if(!toast.contains(event.relatedTarget))rotation.setPaused('focus',false)});
   link.addEventListener('click',()=>{
    if(current.target==='meetings')window.location.href='meetings.html';
    if(current.target==='sandbox'){const button=doc.getElementById('sandBtn');if(button)button.click();else window.location.href='kaoyan-review.html#view=map&tool=sandbox'}
   });
   new MutationObserver(()=>{const open=!!doc.querySelector('dialog[open],#sand:not([hidden])');if(open)interruptMotion();rotation.setPaused('overlay',open)}).observe(doc.body,{subtree:true,attributes:true,attributeFilter:['open','hidden']});
  }
  let timer = null, arrivalPending = false, joined = false, arrivalHoldUntil = 0;
  const update = () => {
   const time=Date.now();
   if (arrivalPending || time < arrivalHoldUntil) return;
   const state=at(time); if(joined)state.value+=1; paint(element,state);
  };
  const stop = () => { clearInterval(timer); timer = null;interruptMotion(); rotation?.setPaused('hidden',true); };
  const start = () => { clearInterval(timer);timer=null;update();rotation?.setPaused('hidden',doc.hidden);if (!doc.hidden)timer = setInterval(update, 1600); };
  doc.addEventListener('visibilitychange', () => doc.hidden ? stop() : start());
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
  start();
  return {
   beginArrival() { arrivalPending=true;interruptMotion();rotation?.setPaused('arrival',true); },
   completeArrival() {
    if(!joined){
     const count=element.querySelector('.study-together-value');
     const value=Number(count.textContent);if(Number.isFinite(value))count.textContent=value+1;
     joined=true;
    }
    arrivalPending=false;arrivalHoldUntil=Date.now()+2400;rotation?.setPaused('arrival',false);
   },
   resumeJoined() { joined=true;arrivalPending=false;update(); },
   cancelArrival() { arrivalPending=false;rotation?.setPaused('arrival',false);update(); }
  };
 }
 return { at, activityAt, activityCount:activities.length, activityPools, createRotation, paint, mount };
});
