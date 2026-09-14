(()=>{
'use strict';
let fingerContacts=0;

const writingStage=()=>!!document.querySelector('#playView .letter-row .letter-box');
const activeLetter=()=>document.activeElement?.classList?.contains('letter-box')?document.activeElement:null;

function collapseNativeSelection(){
  const input=activeLetter();
  if(input){
    try{
      const end=(input.value||'').length;
      if(input.selectionStart!==end||input.selectionEnd!==end) input.setSelectionRange(end,end);
    }catch{}
  }
  try{
    const sel=window.getSelection?.();
    if(sel&&!sel.isCollapsed) sel.removeAllRanges();
  }catch{}
}

function isFingerEvent(e){
  return e.pointerType==='touch' || (e.touches!==undefined);
}

// iPad can show Cut/Copy/Paste when a resting finger touches the screen while
// Scribble has a one-letter input focused. During Stage 3/4, finger touches are
// intentionally ignored; Apple Pencil remains the only input device.
for(const type of ['touchstart','touchmove','touchend','touchcancel']){
  document.addEventListener(type,e=>{
    if(!writingStage()) return;
    if(type==='touchstart') fingerContacts=Math.max(1,e.touches?.length||1);
    else if(type==='touchend'||type==='touchcancel') fingerContacts=e.touches?.length||0;
    e.preventDefault();
    collapseNativeSelection();
  },{capture:true,passive:false});
}

document.addEventListener('pointerdown',e=>{
  if(!writingStage()||e.pointerType!=='touch') return;
  fingerContacts=Math.max(1,fingerContacts);
  e.preventDefault();
  e.stopPropagation();
  collapseNativeSelection();
},{capture:true,passive:false});

document.addEventListener('pointerup',e=>{
  if(e.pointerType==='touch'){
    fingerContacts=0;
    if(writingStage()) collapseNativeSelection();
  }
},true);

document.addEventListener('pointercancel',e=>{
  if(e.pointerType==='touch') fingerContacts=0;
},true);

// Suppress the native edit callout in the handwriting area. Pencil buttons and
// Scribble still work; only browser text editing UI is blocked.
document.addEventListener('contextmenu',e=>{
  if(!writingStage()) return;
  if(e.target.closest?.('.spell-wrap')||activeLetter()) e.preventDefault();
},true);

document.addEventListener('selectstart',e=>{
  if(!writingStage()) return;
  if(fingerContacts>0 || e.target.closest?.('.letter-row')) e.preventDefault();
},true);

document.addEventListener('selectionchange',()=>{
  if(writingStage()&&fingerContacts>0) collapseNativeSelection();
});

document.addEventListener('select',e=>{
  if(!writingStage()||!e.target.classList?.contains('letter-box')) return;
  // Do not interfere with ordinary Scribble editing unless a finger/palm is down.
  if(fingerContacts>0) collapseNativeSelection();
},true);

for(const type of ['copy','cut','paste']){
  document.addEventListener(type,e=>{
    if(writingStage()&&e.target.classList?.contains('letter-box')) e.preventDefault();
  },true);
}

for(const type of ['gesturestart','gesturechange','gestureend']){
  document.addEventListener(type,e=>{
    if(writingStage()) e.preventDefault();
  },{capture:true,passive:false});
}
})();
