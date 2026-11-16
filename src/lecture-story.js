'use strict';
// All motion is derived from narration time: pause, seek and speed stay in sync.
window.LectureStory = function ({map, layer, status, project, reduced}) {
  const NS='http://www.w3.org/2000/svg';
  let lesson, points=[], lengths=[], total=0, enabled=true, lastTime=0, lastDuration=1;
  let actor, figure, label, ring, companion, secondFigure, ripple;
  const routeScenes={
    s02:['广州 · 战争开始','定海 · 战事扩大','大沽 · 沿海战局','南京 · 战争结束'],
    s04:['金田起义','途经长沙','攻占武昌','定都天京'],
    s06:['广州 · 战争再起','天津 · 战事推进','北京 · 危机加深'],
    s17:['上海 · 新青年','北京 · 思想传播'],
    s18:['北京 · 学生先行','上海 · 运动发展'],
    s19:['上海 · 会议召开','嘉兴 · 会议继续'],
    s23:['广州 · 誓师北伐','长沙 · 向北推进','武汉 · 战局发展','南京 · 北伐进程'],
    s29:['瑞金 · 长征启程','于都 · 集结出发','湘江 · 艰难突破','遵义 · 历史转折','泸定 · 继续前进','吴起镇 · 抵达陕北'],
    s31:['吴起镇 · 中央红军先期到达','会宁 · 红一、四方面军会师','将台堡 · 红一、二方面军会师'],
    s42:['鲁西南 · 战略出击','大别山 · 战略进攻'],
    s45:['长江北岸 · 发起渡江','南京 · 解放南京']
  };
  const actions={s01:['抵达虎门','收缴鸦片','虎门销烟'],s15:['武昌起义','革命响应','历史转折'],s25:['南昌起义','武装反抗','新的起点'],s27:['走上井冈山','建立根据地','探索革命道路'],s30:['召开会议','总结经验','历史转折'],s31:['继续北上','主力会合','长征胜利'],s47:['齐聚北京','开国大典','新的篇章']};
  function svg(tag,attrs,parent,text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;parent.append(n);return n;}
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  function kind(e){return window.STUDY_SCENES.byId[e.id]?.asset||'meeting';}
  function makeActor(parent,asset,secondary=false){
    const group=svg('g',{class:'story-actor'+(secondary?' story-companion':'')},parent);
    svg('ellipse',{cx:-15,cy:-4,rx:20,ry:3,class:'story-shadow'},group);
    const moving=svg('g',{class:'story-figure'},group);
    svg('image',{href:'assets/lecture/scenes/'+asset+'.webp',x:-60,y:-82,width:110,height:75,preserveAspectRatio:'xMidYMax meet'},moving);
    return [group,moving];
  }
  function load(e){
    lesson=e;layer.replaceChildren();
    points=(e.route.length?e.route:e.markers||(e.p?[e.p]:[])).map(p=>project(p[0],p[1]));
    lengths=[0];total=0;for(let i=1;i<points.length;i++){total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(total)}
    ring=svg('circle',{r:14,class:'story-arrival'},layer);
    ripple=svg('circle',{r:20,class:'story-ripple'},layer);
    [actor,figure]=makeActor(layer,kind(e));
    label=svg('text',{x:-16,y:-86,'text-anchor':'middle',class:'story-action'},actor);
    companion=null;
    layer.dataset.lesson=e.id;layer.dataset.asset=kind(e);render(0,1);
  }
  function render(time,duration){
    if(!lesson)return 0;
    lastTime=time;lastDuration=duration;
    const progress=clamp(time/Math.max(1,duration));
    const units=map.viewBox.baseVal.width/Math.max(1,map.getBoundingClientRect().width);
    const scale=units*(map.clientWidth<500?.78:1);
    const v=map.viewBox.baseVal;const geographic=points.length>0;
    let p=points[0]||[v.x+125*units,v.y+v.height-105*units],routeProgress=progress,index=0,travelling=false,motion=0,short='';
    if(lesson.route.length>1){
      const step=progress/.92*(points.length-1),i=Math.min(points.length-2,Math.floor(step));
      const q=clamp(step-i),blend=smooth((q-.16)/.72);
      p=[points[i][0]+(points[i+1][0]-points[i][0])*blend,points[i][1]+(points[i+1][1]-points[i][1])*blend];
      index=blend<.999?i:i+1;travelling=blend>0&&blend<1;
      routeProgress=total?(lengths[i]+(lengths[i+1]-lengths[i])*blend)/total:progress;
      const destination=lesson.route[i+1][2];
      short=travelling?'前往'+destination:progress>.94?'抵达 · '+lesson.route.at(-1)[2]:index===0?'启程':lesson.route[index][2];
      status.textContent=(routeScenes[lesson.id]?.[index]||lesson.route[index][2])+(travelling?'　→ '+destination:'');
    } else if(lesson.markers){
      index=Math.min(points.length-1,Math.floor(progress*points.length));p=points[index];
      short=['辽沈战役','淮海战役','平津战役'][index];status.textContent='三大战役 · '+short;motion=Math.sin(time*2)*.5;
    } else {
      index=Math.min(2,Math.floor(progress*3));
      const a=actions[lesson.id]||(/会议|全会|一大|二大|七大|谈判/.test(lesson.n)?['相聚现场','交流讨论','形成决议']:['走进这一站','理解历史进程','记住关键考点']);
      short=a[index];status.textContent=lesson.n+' · '+short;
      motion=Math.sin(time*2)*.6;
    }
    const bounce=reduced?0:travelling?-Math.abs(Math.sin(time*7))*2.3:motion;
    const lean=reduced?0:travelling?Math.sin(time*7)*1.2:Math.sin(time*1.5)*.5;
    const actorPoint=window.StudyMap.actorOffset(p,scale*2/3);
    actor.setAttribute('transform',`translate(${actorPoint[0]} ${actorPoint[1]}) scale(${scale})`);
    figure.setAttribute('transform',`translate(0 ${bounce}) rotate(${lean} -20 -10)`);
    label.textContent=geographic?short:'情景 · '+lesson.place;const phaseAsset=lesson.id==='s29'&&index===3?'zunyi':lesson.id==='s19'?(index===0?'meeting':'redboat'):lesson.id==='s18'?(index===0?'mayfourth':'strike'):kind(lesson);const img=figure.querySelector('image');const href='assets/lecture/scenes/'+phaseAsset+'.webp';if(img.getAttribute('href')!==href)img.setAttribute('href',href);layer.dataset.asset=phaseAsset;
    ring.style.display=geographic?'':'none';ripple.style.display=geographic?'':'none';layer.dataset.geographic=String(geographic);
    ring.setAttribute('cx',p[0]);ring.setAttribute('cy',p[1]);ring.setAttribute('r',10*scale);
    ripple.setAttribute('cx',p[0]);ripple.setAttribute('cy',p[1]);ripple.setAttribute('r',(12+(time*5%10))*scale);ripple.style.opacity=reduced?'0':String(.22*(1-(time*5%10)/10));
    if(companion){const meet=smooth((progress-.3)*2);companion.setAttribute('transform',`translate(${p[0]+(145-55*meet)*scale} ${p[1]+5*scale}) scale(${-scale*.85} ${scale*.85})`);secondFigure.setAttribute('transform',`translate(0 ${bounce})`);companion.style.opacity=String(.25+.75*meet)}
    layer.style.display=enabled?'':'none';
    layer.dataset.stage=String(index);layer.dataset.progress=progress.toFixed(4);layer.dataset.routeProgress=routeProgress.toFixed(4);
    return routeProgress;
  }
  return {load,render,setEnabled(value){enabled=value;render(lastTime,lastDuration)},refresh(){render(lastTime,lastDuration)}};
};
