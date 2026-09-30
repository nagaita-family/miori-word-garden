(function(){
'use strict';
function select({ids,lib,previous=[],now=Date.now(),count=5,manual=[],stars=[]}){
 const unique=[...new Set((ids||[]).filter(id=>lib[id]))],prior=new Set(previous),starred=new Set(stars);
 const learned=id=>{const l=lib[id].learn||{},f=l.five;return !!(f?.introduced||(l.loops||0)>0||(l.stageMist?.[4]||0)>0)};
 const due=id=>{const f=lib[id].learn?.five,l=lib[id].learn||{};return learned(id)&&(!f?.dueAt?!!(l.loops||l.stageMist?.[4]):new Date(f.dueAt).getTime()<=now)};
 const recentFailure=id=>{const f=lib[id].learn?.five,l=lib[id].learn||{};return !!(f?.needsRecall||(l.mistakes||0)>0&&(l.mistakes||0)>=(l.correct||0))};
 const chosen=[],add=id=>{if(unique.includes(id)&&!chosen.includes(id)&&chosen.length<count)chosen.push(id)};
 for(const id of manual)add(id);
 const unseen=unique.filter(id=>!learned(id)&&!chosen.includes(id));
 // Reserve one unseen word in every loop where possible, including after a loop full of corrections.
 if(unseen.length&&chosen.length<count)add(unseen.find(id=>!prior.has(id))||unseen[0]);
 const ranked=unique.filter(id=>!chosen.includes(id)).sort((a,b)=>{
  const score=id=>{
   const f=lib[id].learn?.five||{},l=lib[id].learn||{};
   return (due(id)?100:0)+(recentFailure(id)?45:0)+(starred.has(id)?20:0)+(!learned(id)?15:0)
    - (prior.has(id)&&unique.length>count?65:0)
    - (Number(f.lastAt?new Date(f.lastAt).getTime():0)||0)/1e14
    + Math.min(10,(l.mistakes||0)*.5);
  };
  return score(b)-score(a)||unique.indexOf(a)-unique.indexOf(b)
 });
 for(const id of ranked)add(id);
 return chosen;
}
function markResult(f,{correct,firstTry,now=Date.now()}){
 f.introduced=true;f.lastAt=new Date(now).toISOString();
 if(!correct){f.needsRecall=true;f.dueAt=new Date(now+20*60*1000).toISOString();return}
 if(!firstTry)return; // Copy/Pad success does not make a failed recall due later.
 f.needsRecall=false;
 const success=f.recallSuccess||1;
 const hours=success===1?4:success===2?24:success===3?60:Math.min(168,60+(success-3)*24);
 f.dueAt=new Date(now+hours*3600*1000).toISOString();
}
window.FiveWordsSelection={select,markResult};
})();
