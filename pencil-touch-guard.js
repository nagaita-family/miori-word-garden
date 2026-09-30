(()=>{
'use strict';
let fingerContacts=0;

const writingStage=()=>!!document.querySelector([
  '#playView .letter-row .letter-box',
  '#playView .letter-row .trace-pad',
  '#playView .stage3-gap-flow',
  '#playView #stage4WordInput',
  '#playView .five-words-view .flow-word-input',
  '#playView .five-words-view .five-trace-pad',
  '#playView .weekly-test-view .weekly-answer'
].join(','));

const writingInputSelector='input.letter-box,.stage3-gap-flow,#stage4WordInput,.five-words-view .flow-word-input,.weekly-test-view .weekly-answer';
const activeWritingInput=()=>document.activeElement?.matches?.(writingInputSelector)?document.activeElement:null;
const isActionTarget=target=>!!target?.closest?.('button,a,label,select,textarea,[role="button"],[data-nav],#exitPlayBtn,#checkAnswerBtn,.help-btn,.mode-btn,.hint-choice,.audio-orb,.listen-card,.cue-picture-tile');
const isWritingSurface=target=>!!target?.closest?.('.letter-row,.letter-box,.trace-cell,.trace-pad,.stage3-gap-flow,#stage4WordInput,.five-writing .flow-word-input,.five-trace-pad,.weekly-answer');
const isLegacyPalmZone=target=>!!target?.closest?.('.game-card,.question-area,.spell-wrap');
const isSelectionZone=target=>!!target?.closest?.('.game-card,.question-area,.spell-wrap,.five-card,.five-writing,.five-trace-pad,.weekly-sheet,.weekly-answer-sheet,.weekly-question');

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
  // Finger/palm contact on the actual Pencil surface must never become an edit
  // gesture. Keep the broader preventDefault behavior only on the legacy
  // Stage 3/4 card; newer 5 Words / Weekly Test cards still need finger scroll.
  return isWritingSurface(target) || (!!activeWritingInput() && isLegacyPalmZone(target));
}

// Suppress accidental palm/finger editing on every current Apple Pencil surface.
// Do not pin the viewport or set touch-action:none on native Scribble inputs.
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

// Native text-selection handles/callouts are never useful inside a spelling
// writing card. Blocking selection here does not block finger scrolling.
document.addEventListener('contextmenu',e=>{
  if(writingStage()&&!isActionTarget(e.target)&&isSelectionZone(e.target)) e.preventDefault();
},true);

document.addEventListener('selectstart',e=>{
  if(!writingStage()||isActionTarget(e.target)) return;
  if(isSelectionZone(e.target)) e.preventDefault();
},true);

document.addEventListener('selectionchange',()=>{
  if(writingStage()&&fingerContacts>0) collapseNativeSelection();
});

document.addEventListener('select',e=>{
  if(!writingStage()||!e.target.matches?.(writingInputSelector)) return;
  if(fingerContacts>0) collapseNativeSelection();
},true);

for(const type of ['copy','cut','paste','dragstart']){
  document.addEventListener(type,e=>{
    if(writingStage()&&e.target.matches?.(writingInputSelector)) e.preventDefault();
  },true);
}

for(const type of ['gesturestart','gesturechange','gestureend']){
  document.addEventListener(type,e=>{
    if(writingStage()&&!isActionTarget(e.target)&&isSelectionZone(e.target)) e.preventDefault();
  },{capture:true,passive:false});
}
})();
