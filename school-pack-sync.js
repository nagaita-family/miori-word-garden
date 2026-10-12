(function(){
'use strict';
// A single, static GitHub Pages Word Pack is the school curriculum source.
// No server/account is needed; personal learning stays in localStorage.
function readPack(data,norm){
 if(!data||typeof data!=='object'||Array.isArray(data)||data.version&&data.lib)throw Error('Not a school Word Pack');
 const weekId=String(data.weekId||'').trim(),title=String(data.weekName||'').trim();
 if(!/^[a-z0-9][a-z0-9-]{3,90}$/i.test(weekId)||!title||title.length>120)throw Error('Invalid school week');
 if(!Array.isArray(data.words)||data.words.length<1||data.words.length>30)throw Error('Invalid school words');
 const ids=[],seen=new Set();
 for(const w of data.words){
  if(!w||typeof w.word!=='string'||!/^[A-Za-z]+$/.test(w.word))throw Error('Invalid spelling');
  const id=norm(w.word);
  if(!id||seen.has(id))throw Error('Duplicate school word');
  if(w.chunks!=null&&(!Array.isArray(w.chunks)||w.chunks.length<1||w.chunks.length>6||w.chunks.some(c=>typeof c!=='string'||!c.length)||w.chunks.join('').toLowerCase()!==id))throw Error('Invalid chunks');
  const spot=w.seedFocus;
  if(spot!=null&&(!Number.isInteger(spot.start)||!Number.isInteger(spot.length)||spot.start<0||spot.length<1||spot.start+spot.length>id.length))throw Error('Invalid Focus');
  if(w.meaningEn!=null&&typeof w.meaningEn!=='string')throw Error('Invalid meaning');
  seen.add(id);ids.push(id);
 }
 return {weekId,title,ids,words:data.words,signature:JSON.stringify({weekId,title,words:data.words})};
}
function apply(state,data,deps){
 const {norm,normalizeWord,archiveWeek,ensureLearningGroups}=deps,pack=readPack(data,norm);
 const previous=state.schoolPackSync||{};
 if(previous.manualOverride&&previous.manualOverrideSourceWeekId===pack.weekId)return {status:'manual',weekId:pack.weekId};
 const current=state.week||{};
 const sameWeek=current.id===pack.weekId;
 const sameIds=sameWeek&&current.ids?.length===pack.ids.length&&pack.ids.every((id,i)=>current.ids[i]===id);
 if(previous.signature===pack.signature&&sameIds&&current.title===pack.title)return {status:'unchanged',weekId:pack.weekId};
 // Do not discard journal/reading entries or manually selected Focus / learning.
 const newWords={};
 for(let i=0;i<pack.ids.length;i++){
  const id=pack.ids[i],raw=pack.words[i],old=state.lib?.[id],myWord=!!state.myWords?.[id];
  const protectedRaw=myWord&&old?{
   ...raw,
   meaningEn:old.meaningEn||raw.meaningEn,
   meaningJa:old.meaningJa||raw.meaningJa,
   example:old.example||raw.example,
   pictureCue:old.pictureCue||raw.pictureCue,
   pictureEmoji:old.pictureEmoji||raw.pictureEmoji,
   displayWord:old.displayWord&&old.displayWord!==old.word?old.displayWord:raw.word
  }:raw;
  newWords[id]=normalizeWord(protectedRaw,old);
 }
 if(!sameWeek&&current.ids?.length)archiveWeek(state,current);
 state.lib=state.lib||{};Object.assign(state.lib,newWords);
 const schoolMeaningById={};
 for(let i=0;i<pack.ids.length;i++)schoolMeaningById[pack.ids[i]]=pack.words[i].meaningEn||'';
 state.week={id:pack.weekId,title:pack.title,ids:pack.ids,
  focusIds:sameWeek?(current.focusIds||[]).filter(id=>pack.ids.includes(id)):[],schoolMeaningById};
 ensureLearningGroups(state);
 if(!sameWeek)delete state.weekTestDraft;
 state.schoolPackSync={weekId:pack.weekId,signature:pack.signature};
 return {status:'updated',weekId:pack.weekId,changedWeek:!sameWeek,ids:pack.ids};
}
window.SchoolPackSync=Object.freeze({readPack,apply});
})();
