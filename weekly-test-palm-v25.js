/* v25 — protect weekly-test controls from stray palm contacts without blocking Pencil Scribble. */
(()=>{
'use strict';
const inExam=()=>!!document.querySelector('.weekly-test-view .weekly-answer-sheet');
const control=target=>target?.closest?.('.weekly-test-view button');
let penOnPaper=false;
let lastWritingAt=-Infinity;
let suppressClicksUntil=0;
const now=()=>Date.now();
const recentlyWriting=()=>penOnPaper||now()-lastWritingAt<650;
function suppress(event){
  suppressClicksUntil=Math.max(suppressClicksUntil,now()+1050);
  event.preventDefault();
  event.stopImmediatePropagation();
}
// Only a Pencil stroke in the actual answer-sheet area starts the palm-protection window.
// Tapping a button with the Pencil should remain possible.
document.addEventListener('pointerdown',event=>{
  if(!inExam())return;
  if(event.pointerType==='pen'){
    if(event.target?.closest?.('.weekly-answer-sheet')){
      penOnPaper=true;
      lastWritingAt=now();
    }
    return;
  }
  if(event.pointerType!=='touch'||!control(event.target))return;
  const broadContact=(event.width||0)>24||(event.height||0)>24;
  if(recentlyWriting()||event.isPrimary===false||broadContact)suppress(event);
},{capture:true,passive:false});
document.addEventListener('pointermove',event=>{
  if(penOnPaper&&event.pointerType==='pen'&&inExam())lastWritingAt=now();
},{capture:true,passive:true});
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,event=>{
  if(event.pointerType==='pen'&&penOnPaper){penOnPaper=false;lastWritingAt=now();}
},{capture:true,passive:true});
// On Safari, touchstart can report multiple fingers or a wide palm even when the
// pointer event reports a tiny contact. Block the synthetic click at capture too.
document.addEventListener('touchstart',event=>{
  if(!inExam()||!control(event.target))return;
  const contacts=event.touches?.length||0;
  const broad=[...(event.changedTouches||[])].some(t=>(t.radiusX||0)>17||(t.radiusY||0)>17);
  if(recentlyWriting()||contacts>1||broad)suppress(event);
},{capture:true,passive:false});
document.addEventListener('click',event=>{
  if(!inExam()||!control(event.target))return;
  if(now()<suppressClicksUntil||penOnPaper)suppress(event);
},true);
})();
