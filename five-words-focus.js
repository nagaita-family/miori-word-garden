(function(){
'use strict';
function chunks(word,raw){
 if(!Array.isArray(raw)||raw.length<1||raw.length>6)return null;
 const parts=raw.map(x=>String(x).toLowerCase().replace(/[^a-z]/g,''));
 return parts.every(x=>x.length>=1)&&parts.join('')===word?parts:null;
}
function focus(word,raw){
 if(!raw)return null;
 if(Array.isArray(raw.indices)){
  const indices=[...new Set(raw.indices.filter(Number.isInteger).filter(i=>i>=0&&i<word.length))].sort((a,b)=>a-b);
  return indices.length?{indices}:null;
 }
 if(!Number.isInteger(raw.start)||!Number.isInteger(raw.length))return null;
 return raw.start>=0&&raw.length>=1&&raw.start+raw.length<=word.length?{start:raw.start,length:raw.length}:null;
}
function positions(word,raw){
 const spot=focus(word,raw);if(!spot)return[];
 if(Array.isArray(spot.indices))return spot.indices;
 return Array.from({length:spot.length},(_,i)=>spot.start+i);
}
function mistake(word,raw,normalized){
 if(typeof raw!=='string'||!/^[a-z]+$/i.test(raw)||raw.toLowerCase()!==normalized||normalized===word)return null;
 if(normalized.length!==word.length)return null;
 const wrong=[];for(let i=0;i<word.length;i++)if(word[i]!==normalized[i])wrong.push(i);
 if(!wrong.length||wrong.length>2||wrong.at(-1)-wrong[0]+1!==wrong.length)return null;
 return{start:wrong[0],length:wrong.length};
}
function remember(f,spot){
 if(!spot)return;
 f.mistakeHits=f.mistakeHits||{};
 const key=spot.start+':'+spot.length;
 f.mistakeHits[key]=(f.mistakeHits[key]||0)+1;
 if(f.mistakeHits[key]>=2)f.mioriFocus={...spot};
}
function ensureFive(w){
 if(!w.learn)w.learn={};
 if(!w.learn.five)w.learn.five={introduced:!!((w.learn.loops||0)>0||(w.learn.stageMist?.[4]||0)>0),recallSuccess:0,needsRecall:false};
 return w.learn.five;
}
function setParent(w,raw){
 const f=ensureFive(w),spot=focus(w.word,raw);
 if(spot)f.parentFocus=Array.isArray(spot.indices)?{indices:[...spot.indices]}:{...spot};else delete f.parentFocus;
 return spot;
}
function active(w,temp){return focus(w.word,temp)||focus(w.word,w.learn?.five?.parentFocus)||focus(w.word,w.learn?.five?.mioriFocus)||focus(w.word,w.seedFocus)}
function markedSlice(word,start,end,spot,escape){
 const selected=new Set(positions(word,spot));
 if(!selected.size)return escape(word.slice(start,end));
 let out='',open=false;
 for(let i=start;i<end;i++){
  const on=selected.has(i);
  if(on&&!open){out+='<mark class="five-focus">';open=true}
  if(!on&&open){out+='</mark>';open=false}
  out+=escape(word[i]);
 }
 if(open)out+='</mark>';
 return out;
}
function display(w,temp,escape){
 const weekday=/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.test(w.word),word=weekday?w.word[0].toUpperCase()+w.word.slice(1):(typeof w.displayWord==='string'&&w.displayWord.toLowerCase()===w.word)?w.displayWord:w.word,spot=active(w,temp),parts=chunks(w.word,w.chunks);
 if(parts){
  let pos=0;
  return parts.map(part=>{
   const start=pos,end=pos+part.length;pos=end;
   return '<span class="five-chunk">'+markedSlice(word,start,end,spot,escape)+'</span>';
  }).join('');
 }
 if(spot)return markedSlice(word,0,word.length,spot,escape);
 return escape(word);
}
window.FiveWordsFocus={chunks,focus,positions,mistake,remember,setParent,active,display};
})();
