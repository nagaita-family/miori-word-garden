/* v27: protect only irreversible grading controls; Listen remains usable while writing. */
(()=>{
'use strict';
const inExam=()=>!!document.querySelector('.weekly-test-view .weekly-answer-sheet');
// The old selector covered every button, swallowing Listen after Pencil strokes.
// Grading needs palm protection; listening, navigating and saving must remain available.
const control=target=>target?.closest?.('#weeklyGradeBtn,#weeklyGradeTopBtn');
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
