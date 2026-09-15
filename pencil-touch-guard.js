(()=>{
'use strict';
let fingerContacts=0;

const writingStage=()=>!!document.querySelector('#playView .letter-row .letter-box,#playView .letter-row .trace-input');
const playActive=()=>!!document.querySelector('#playView.active-view .game-card');
const activeWritingInput=()=>document.activeElement?.matches?.('.letter-box,.trace-input')?document.activeElement:null;
const isActionTarget=target=>!!target?.closest?.('button,a,label,select,textarea,[role="button"],[data-nav],#exitPlayBtn,#checkAnswerBtn,.help-btn,.mode-btn,.hint-choice,.audio-orb,.listen-card,.cue-picture-tile');
const isLetterSurface=target=>!!target?.closest?.('.letter-row,.letter-box,.trace-cell,.trace-input');
const isPalmZone=target=>!!target?.closest?.('.game-card,.question-area,.spell-wrap,.letter-row');

function pinPlayViewport(){
  if(!playActive())return;
  try{window.scrollTo(0,0)}catch{}
  try{document.documentElement.scrollTop=0;document.documentElement.scrollLeft=0}catch{}
  try{document.body.scrollTop=0;document.body.scrollLeft=0}catch{}
  const main=document.querySelector('main'),play=document.querySelector('#playView');
  if(main){main.scrollTop=0;main.scrollLeft=0}
  if(play){play.scrollTop=0;play.scrollLeft=0}
}

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
  // Stage 3/4 are intentionally one-screen. Any finger/palm movement inside
  // the game card is treated as accidental panning, not as page scrolling.
  return isPalmZone(target);
}

for(const type of ['touchstart','touchmove','touchend','touchcancel']){
  document.addEventListener(type,e=>{
    if(!writingStage()) return;
    if(type==='touchstart') fingerContacts=e.touches?.length||1;
    if(type==='touchend'||type==='touchcancel') fingerContacts=e.touches?.length||0;

    if(isActionTarget(e.target)){
      collapseNativeSelection();
      pinPlayViewport();
      return;
    }

    if(shouldBlockFinger(e.target)){
      e.preventDefault();
      collapseNativeSelection();
      pinPlayViewport();
    }
  },{capture:true,passive:false});
}

document.addEventListener('pointerdown',e=>{
  if(!writingStage()) return;
  if(e.pointerType==='pen'&&isPalmZone(e.target)){
    // iPad may try to reveal the focused Scribble field by moving the viewport.
    // Pin it before and just after focus so the Pencil can write without the page jumping.
    pinPlayViewport();
    requestAnimationFrame(()=>pinPlayViewport());
    setTimeout(pinPlayViewport,60);
    return;
  }
  if(e.pointerType!=='touch') return;
  fingerContacts=Math.max(1,fingerContacts);
  if(isActionTarget(e.target)){
    collapseNativeSelection();
    pinPlayViewport();
    return;
  }
  if(shouldBlockFinger(e.target)){
    e.preventDefault();
    e.stopPropagation();
    collapseNativeSelection();
    pinPlayViewport();
  }
},{capture:true,passive:false});

document.addEventListener('focusin',e=>{
  if(!writingStage()||!e.target?.matches?.('.letter-box,.trace-input'))return;
  pinPlayViewport();
  requestAnimationFrame(()=>pinPlayViewport());
  setTimeout(pinPlayViewport,50);
},true);

document.addEventListener('pointerup',e=>{
  if(e.pointerType==='touch'){
    fingerContacts=0;
    if(writingStage()){collapseNativeSelection();pinPlayViewport()}
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
