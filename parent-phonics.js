/* Parent paper-study spelling guide: this is visual spelling grouping, not audio slicing. */
(function(){
'use strict';
function validParts(word,raw){
 if(!Array.isArray(raw)||!raw.length||raw.length>12)return null;
 const parts=raw.map(x=>String(x));
 return parts.every(x=>/^[A-Za-z]+$/.test(x))&&parts.join('').toLowerCase()===word?parts:null;
}
function display(w,escape){
 const word=String(w?.word||'');
 const shown=typeof w?.displayWord==='string'&&w.displayWord.toLowerCase().replace(/[^a-z]/g,'')===word?w.displayWord:word;
 const parts=validParts(word,w?.phonicsChunks)||validParts(word,w?.chunks);
 if(!parts)return escape(shown);
 const letters=shown.replace(/[^a-z]/gi,'');
 const gaps={},silent=new Set(Array.isArray(w?.phonicsSilent)?w.phonicsSilent.filter(i=>Number.isInteger(i)&&i>=0&&i<word.length):[]);
 let letterCount=0;
 for(const char of shown){
  if(/[a-z]/i.test(char))letterCount++;
  else gaps[letterCount]=(gaps[letterCount]||'')+char;
 }
 let pos=0;
 const output=parts.map(part=>{
  const start=pos;pos+=part.length;
  let text='';
  for(let i=start;i<pos;i++){
   const char=escape(letters[i]);
   text+=silent.has(i)?'<span class="parent-phonics-silent" title="Silent letter">'+char+'</span>':char;
  }
  return '<span class="parent-phonics-chunk">'+text+'</span>'+(gaps[pos]?'<span class="parent-phonics-gap">'+escape(gaps[pos])+'</span>':'');
 }).join('');
 return '<span class="parent-phonics-spelling">'+output+'</span>';
}
window.ParentPhonics=Object.freeze({display,validParts});
})();