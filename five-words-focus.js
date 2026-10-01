(function(){
'use strict';
function chunks(word,raw){
 if(!Array.isArray(raw)||raw.length<2||raw.length>4)return null;
 const parts=raw.map(x=>String(x).toLowerCase().replace(/[^a-z]/g,''));
 return parts.every(x=>x.length>=2)&&parts.join('')===word?parts:null;
}
function focus(word,raw){
 if(!raw||!Number.isInteger(raw.start)||!Number.isInteger(raw.length))return null;
 return raw.start>=0&&raw.length>=1&&raw.start+raw.length<=word.length?{start:raw.start,length:raw.length}:null;
}
function mistake(word,raw,normalized){
 // Scribble candidates altered by normalization or an ambiguous edit are display-only.
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
 if(spot)f.parentFocus={...spot};else delete f.parentFocus;
 return spot;
}
function active(w,temp){return focus(w.word,temp)||focus(w.word,w.learn?.five?.parentFocus)||focus(w.word,w.learn?.five?.mioriFocus)||focus(w.word,w.seedFocus)}
function display(w,temp,escape){
 const word=w.word,spot=active(w,temp);
 if(spot)return escape(word.slice(0,spot.start))+'<mark class="five-focus">'+escape(word.slice(spot.start,spot.start+spot.length))+'</mark>'+escape(word.slice(spot.start+spot.length));
 const parts=chunks(word,w.chunks);return parts?parts.map(x=>'<span class="five-chunk">'+escape(x)+'</span>').join(''):escape(word);
}
window.FiveWordsFocus={chunks,focus,mistake,remember,setParent,active,display};
})();
