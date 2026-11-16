/* Pure state functions used by the page and the regression checks. */
(function(root){
 'use strict';
 const normalize=(ids,meetings)=>Array.from(new Set(Array.isArray(ids)?ids:[])).filter(id=>meetings.some(m=>m.id===id)).slice(0,3).sort((a,b)=>meetings.find(m=>m.id===a).sortDate.localeCompare(meetings.find(m=>m.id===b).sortDate));
 function read(hash,saved,data){
  const p=new URLSearchParams(hash.replace(/^#/,'')),explicit=p.has('compare');
  const raw=explicit?p.get('compare').split(',').filter(Boolean):(Array.isArray(saved?.ids)?saved.ids:data.presets[0].ids);
  const ids=normalize(raw,data.meetings), mode=(explicit?p.get('mode'):saved?.mode)==='full'?'full':'core';
  return {ids,mode,notice:explicit&&ids.length!==raw.length?'链接中重复、未收录或超出 3 场的会议已忽略。':''};
 }
 const encode=(state)=>'#'+new URLSearchParams({compare:state.ids.join(','),mode:state.mode}).toString();
 function toggle(ids,id,meetings){
  if(!meetings.some(m=>m.id===id))return{ids:normalize(ids,meetings),error:'未找到这场会议。'};
  if(ids.includes(id))return{ids:ids.filter(x=>x!==id),error:''};
  if(ids.length>=3)return{ids:[...ids],error:'最多同时比较 3 场，请先移除一场，或切换常见组合。'};
  return{ids:normalize([...ids,id],meetings),error:''};
 }
 function markdown(ids,data){
  const selected=normalize(ids,data.meetings).map(id=>data.meetings.find(m=>m.id===id));
  return '# 会议对比 · 复习卡\n\n'+selected.map(m=>`## ${m.name}\n\n- 时间：${m.date}\n- 地点：${m.place}\n- 关键词：${m.keyword}\n\n### 核心记忆\n${m.summary}\n\n### 历史背景\n${m.background}\n\n### 主要内容\n${m.decisions.map(x=>'- '+x).join('\n')}\n\n### 历史意义\n${m.significance}\n\n### 易混辨析\n${m.trap}\n\n### 相关文献\n${m.documents.map(x=>'- '+x).join('\n')}\n\n### 核对来源\n${m.sources.map(s=>`- [${s.title}](${s.url}) · ${s.publisher}`).join('\n')}`).join('\n\n---\n\n')+'\n\n记忆提示为编辑归纳，请结合原始资料复习。\n';
 }
 // Progress is explicit mastery of meetings, independent from the selected comparison.
 function createProgress(meetings,storage,key='kaoyan.meeting.progress.v1'){
  const valid=new Set(meetings.map(m=>m.id));let learned={},persistent=true;
  const sanitize=value=>Object.fromEntries(Object.entries(value&&typeof value==='object'&&!Array.isArray(value)?value:{}).filter(([id,done])=>valid.has(id)&&done===true));
  const snapshot=()=>({learned:{...learned},count:Object.keys(learned).length,total:valid.size,persistent});
  function refresh(){
   if(persistent){let raw;try{raw=storage.getItem(key)}catch{persistent=false;return snapshot()}
    try{learned=sanitize(JSON.parse(raw)?.learned)}catch{learned={}}
   }
   return snapshot();
  }
  function set(id,done){
   if(!valid.has(id))return snapshot();
   refresh();if(done)learned[id]=true;else delete learned[id];
   try{storage.setItem(key,JSON.stringify({learned}))}catch{persistent=false}
   return snapshot();
  }
  refresh();return {key,snapshot,refresh,set};
 }
 const api={normalize,read,encode,toggle,markdown,createProgress};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.MeetingCore=api;
})(typeof window!=='undefined'?window:globalThis);
