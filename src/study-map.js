'use strict';
// Shared, complete island layers for all three interactive map surfaces.
window.StudyMap=(()=>{
 const NS='http://www.w3.org/2000/svg';
 function svg(tag,attrs,parent,text){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs||{}))e.setAttribute(k,v);if(text)e.textContent=text;parent.append(e);return e}
 function landmarks(parent,scale=1){
  const g=svg('g',{class:'territory-landmarks','aria-label':'钓鱼岛、赤尾屿'},parent);
  MAP_ISLANDS.forEach((it,i)=>{const[x,y]=it.point;svg('circle',{cx:x,cy:y,r:1.8*scale,'data-island':it.name},g);const dx=i?7:-7,dy=i?-10:15;svg('path',{d:`M${x},${y}l${dx*scale},${dy*scale}`,class:'island-leader'},g);svg('text',{x:x+dx*scale,y:y+dy*scale+(i?0:5)*scale,'text-anchor':i?'start':'end','font-size':11*scale},g,it.name)});
  return g;
 }
 function refreshLabels(parent,units){
  if(!Number.isFinite(units)||units<=0)return;
  const g=parent.querySelector('.territory-landmarks');if(!g)return;
  const box=parent.tagName.toLowerCase()==='svg'?parent.viewBox.baseVal:null;
  const right=box?box.x+box.width+Math.max(0,parent.clientWidth*units-box.width)/2-8*units:Infinity;
  MAP_ISLANDS.forEach((it,i)=>{
   const[x,y]=it.point,[dot,line,text]=[...g.children].slice(i*3,i*3+3),dy=(i?-10:15)*units;
   let dx=(i?7:-7)*units,anchor=i?'start':'end';
   // On narrow maps place the eastern label inward, without shrinking the text.
   if(i&&x+dx+33*units>right){dx=-7*units;anchor='end'}
   dot.setAttribute('r',1.8*units);line.setAttribute('d',`M${x},${y}l${dx},${dy}`);
   text.setAttribute('x',x+dx);text.setAttribute('y',y+dy+(i?0:5)*units);
   text.setAttribute('text-anchor',anchor);text.setAttribute('font-size',11*units);
  });
 }
 function overlay(parent){const g=svg('g',{class:'territory-overlay','pointer-events':'none'},parent);svg('path',{d:MAP_SEA_LINES,class:'territory-sea-lines'},g);landmarks(g);if(parent.tagName.toLowerCase()==='svg'){new ResizeObserver(()=>{const b=parent.viewBox.baseVal;refreshLabels(parent,1/Math.min(parent.clientWidth/b.width,parent.clientHeight/b.height))}).observe(parent)}return g}
 function insetFigure(kind, title){
  const data=MAP_INSETS[kind];
  const figure=document.createElement('figure');
  figure.className='territory-inset territory-'+kind;
  const map=svg('svg',{viewBox:`0 0 ${data.width} ${data.height}`,role:'img','aria-label':title},figure);
  svg('path',{d:data.land,class:'territory-land'},map);
  svg('path',{d:data.lines,class:'territory-sea-lines'},map);
  data.labels.forEach((item,i)=>{
   const [x,y]=item.point;
   if(item.plain){
    svg('text',{x:Math.max(28,Math.min(data.width-30,x)),y:Math.min(data.height-8,y),'text-anchor':item.anchor||'middle','font-size':9},map,item.name);
    return;
   }
   const labelX=i?228:102, labelY=i?28:89;
   svg('circle',{cx:x,cy:y,r:2.3,class:'territory-island-point','data-island':item.name},map);
   svg('path',{d:`M${x},${y}L${labelX},${labelY+(i?5:-12)}`,class:'island-leader'},map);
   svg('text',{x:labelX,y:labelY,'text-anchor':i?'end':'middle','font-size':10,class:'territory-island-label'},map,item.name);
  });
  return figure;
 }
 function showInset(kind,opener){
  let dialog=document.getElementById('territoryDetailDialog');
  if(!dialog){
   dialog=document.createElement('dialog');
   dialog.id='territoryDetailDialog';
   dialog.className='study-dialog map-source-dialog territory-detail-dialog';
   dialog.setAttribute('aria-labelledby','territoryDetailTitle');
   dialog.innerHTML=`<div class="study-dialog-head">
    <h2 id="territoryDetailTitle"></h2>
    <button type="button" class="study-dialog-close" aria-label="关闭附图">×</button>
   </div><div class="study-dialog-body"></div>
   <div class="study-dialog-footer territory-detail-footer"><p>与主地图共用同一份完整底图数据。</p><button type="button" class="map-source-button">地图来源</button></div>`;
   document.body.append(dialog);
   dialog.querySelector('.study-dialog-close').onclick=()=>dialog.close();
   dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
   const sourceButton=dialog.querySelector('.map-source-button');
   sourceButton.onclick=()=>showSource(sourceButton);
  }
  const title=kind==='south'?'南海诸岛':'钓鱼岛及其附属岛屿';
  dialog.querySelector('h2').textContent=title;
  dialog.dataset.inset=kind;
  const figure=insetFigure(kind,title);
  dialog.querySelector('.study-dialog-body').replaceChildren(figure);
  const map=figure.querySelector('svg');
  const labels=[...map.querySelectorAll('text')];
  // Keep the text at a readable screen size as the SVG scales.
  const observer=new ResizeObserver(()=>{
   const box=map.viewBox.baseVal;
   const scale=Math.min(map.clientWidth/box.width,map.clientHeight/box.height);
   if(scale>0)labels.forEach(label=>{
    const pixels=label.classList.contains('territory-island-label')?12:11;
    label.setAttribute('font-size',pixels/scale);
   });
  });
  observer.observe(map);
  dialog.addEventListener('close',()=>{observer.disconnect();opener?.focus({preventScroll:true})},{once:true});
  document.dispatchEvent(new CustomEvent('study:dialogopen'));
  dialog.showModal();
  dialog.querySelector('.study-dialog-close').focus();
 }
 function mountInsets(host){
  host.replaceChildren();host.className='territory-insets';host.setAttribute('aria-label','重要岛屿附图');
  for(const [kind,label,name] of [['south','南海','南海诸岛'],['east','钓鱼岛','钓鱼岛及其附属岛屿']]){
   const button=document.createElement('button');button.type='button';button.className='territory-trigger territory-preview-'+kind;button.title='查看'+name;button.setAttribute('aria-label','查看'+name);button.setAttribute('aria-haspopup','dialog');
   // Trim unused canvas only; preserve the original coastline proportions and clipping.
   const d=MAP_INSETS[kind],frame=kind==='south'?'0 2 120 172':'0 2 168 118';
   const preview=svg('svg',{viewBox:frame,'aria-hidden':'true',focusable:'false',class:'territory-preview-map'},button);
   svg('path',{d:d.land,class:'territory-preview-land'},preview);
   if(d.lines)svg('path',{d:d.lines,class:'territory-preview-sea'},preview);
   d.labels.filter(item=>!item.plain).forEach(item=>svg('circle',{cx:item.point[0],cy:item.point[1],r:2.5,class:'territory-preview-island'},preview));
   const caption=document.createElement('span');caption.className='territory-preview-label';caption.textContent=kind==='south'?'南海诸岛':label;button.append(caption);
   button.addEventListener('click',()=>showInset(kind,button));host.append(button);
  }
 }
 function showSource(opener){
  let dialog=document.getElementById('mapSourceDialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='mapSourceDialog';dialog.className='study-dialog map-source-dialog';dialog.setAttribute('aria-labelledby','mapSourceTitle');dialog.innerHTML=`<div class="study-dialog-head"><h2 id="mapSourceTitle">地图来源</h2><button type="button" class="study-dialog-close" aria-label="关闭地图来源">×</button></div><div class="study-dialog-body"><p>互动底图：DataV.GeoAtlas（高德开放平台数据）。地图用于定位历史事件，路线与区域着色为学习示意。</p><p>下方为外交部公开的中国地图原图，原图审图号 <b>${MAP_SOURCE.referenceReviewNumber}</b>。该编号仅对应官方原图。</p><div class="map-source-links"><a href="${MAP_SOURCE.referencePage}" target="_blank" rel="noopener">官方发布页 ↗</a><a href="${MAP_SOURCE.referenceImage}" target="_blank" rel="noopener">查看高清原图 ↗</a><a href="${MAP_SOURCE.geometryDocumentation}" target="_blank" rel="noopener">互动底图说明 ↗</a></div><a href="${MAP_SOURCE.referenceImage}" target="_blank" rel="noopener" class="official-map-preview"><img src="${MAP_SOURCE.referenceImage}" alt="外交部公布的中国地图原图，含钓鱼岛、赤尾屿及南海诸岛附图，原图审图号 GS（2021）5448号" width="10336" height="7257"></a></div>`;document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}})}
  dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}),{once:true});dialog.showModal();dialog.querySelector('button').focus();
 }
 function actorOffset(point,scale){
  // Keep artwork out of Taiwan, Hainan and the labelled East China Sea islands.
  const protectedAreas=[[743,555,824,650],[546,673,598,733],[782,548,848,608]];
  let[x,y]=point;const hits=protectedAreas.filter(([a,b,c,d])=>x-90*scale<c&&x+75*scale>a&&y-125*scale<d&&y-7*scale>b);
  if(hits.length)x-=Math.max(...hits.map(([a])=>x+75*scale-a+5*scale));return[x,y];
 }
 return{overlay,landmarks,refreshLabels,mountInsets,showSource,actorOffset};
})();
