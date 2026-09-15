(()=>{
'use strict';
let fingerContacts=0;

const writingStage=()=>!!document.querySelector('#playView .letter-row .letter-box,#playView .letter-row .trace-input');
const activeWritingInput=()=>document.activeElement?.matches?.('.letter-box,.trace-input')?document.activeElement:null;
const isActionTarget=target=>!!target?.closest?.('button,a,label,select,textarea,[role="button"],[data-nav],#exitPlayBtn,#checkAnswerBtn,.help-btn,.mode-btn,.hint-choice,.audio-orb,.listen-card,.cue-picture-tile');
const isLetterSurface=target=>!!target?.closest?.('.letter-row,.letter-box,.trace-cell,.trace-input');
const isPalmZone=target=>!!target?.closest?.('.game-card,.question-area,.spell-wrap');

function collapseNativeSelection(){
  const input=activeWritingInput();
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

function shouldBlockFinger(target){
  if(!writingStage()) return false;
  if(isActionTarget(target)) return false;
  return isLetterSurface(target) || (!!activeWritingInput() && isPalmZone(target));
}

// Suppress only accidental palm/finger editing on the handwriting surface.
// We deliberately do not pin or force the viewport: Stage 3/4 layout is sized
// so the writing row is already in the comfortable Scribble area before focus.
for(const type of ['touchstart','touchmove','touchend','touchcancel']){
  document.addEventListener(type,e=>{
    if(!writingStage()) return;
    if(type==='touchstart') fingerContacts=e.touches?.length||1;
    if(type==='touchend'||type==='touchcancel') fingerContacts=e.touches?.length||0;

    if(isActionTarget(e.target)){
      collapseNativeSelection();
      return;
    }

    if(shouldBlockFinger(e.target)){
      e.preventDefault();
      collapseNativeSelection();
    }
  },{capture:true,passive:false});
}

document.addEventListener('pointerdown',e=>{
  if(!writingStage()||e.pointerType!=='touch') return;
  fingerContacts=Math.max(1,fingerContacts);
  if(isActionTarget(e.target)){
    collapseNativeSelection();
    return;
  }
  if(shouldBlockFinger(e.target)){
    e.preventDefault();
    e.stopPropagation();
    collapseNativeSelection();
  }
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

document.addEventListener('contextmenu',e=>{
  if(writingStage()&&isLetterSurface(e.target)) e.preventDefault();
},true);

document.addEventListener('selectstart',e=>{
  if(!writingStage()) return;
  if(isLetterSurface(e.target) || (fingerContacts>0&&!isActionTarget(e.target)&&isPalmZone(e.target))) e.preventDefault();
},true);

document.addEventListener('selectionchange',()=>{
  if(writingStage()&&fingerContacts>0) collapseNativeSelection();
});

document.addEventListener('select',e=>{
  if(!writingStage()||!e.target.matches?.('.letter-box,.trace-input')) return;
  if(fingerContacts>0) collapseNativeSelection();
},true);

for(const type of ['copy','cut','paste']){
  document.addEventListener(type,e=>{
    if(writingStage()&&e.target.matches?.('.letter-box,.trace-input')) e.preventDefault();
  },true);
}

for(const type of ['gesturestart','gesturechange','gestureend']){
  document.addEventListener(type,e=>{
    if(writingStage()&&!isActionTarget(e.target)&&isPalmZone(e.target)) e.preventDefault();
  },{capture:true,passive:false});
}
})();
