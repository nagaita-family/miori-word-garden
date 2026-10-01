/* The five-word loop runs beside the older Stage flow used by weekly-test review. */
(function(){
'use strict';
function create(d){
 const {state,root}=d;
 const run={lane:d.lane,ids:[...d.ids],index:0,phase:'',answer:'',attempt:'',tempFocus:null,tracePaths:[],practicePaths:[[],[],[]],traceOpen:false,audioPhase:'',finished:false};
 const word=()=>state.lib[run.ids[run.index]];
 function record(w){const l=w.learn;if(!l.five)l.five={introduced:!!((l.loops||0)>0||(l.stageMist?.[4]||0)>0),recallSuccess:0,needsRecall:false};return l.five}
 function message(s){const el=root.querySelector('#fiveMessage');if(el)el.textContent=s}
 function enter(phase){run.phase=phase;run.answer='';run.audioPhase='';render()}
 function startWord(){const w=word();if(!w)return finish();run.tracePaths=[];run.practicePaths=[[],[],[]];run.traceOpen=false;run.tempFocus=null;run.padCorrect=false;enter(record(w).introduced?'hidden':'look')}
 function finish(){if(!run.finished){state.stats.sessions=(state.stats.sessions||0)+1;d.save();run.finished=true}run.phase='done';render()}
 function next(){run.index++;if(run.index>=run.ids.length)finish();else startWord()}
 function advance(){
  if(run.phase==='look')return enter('guided');
  if(run.phase==='guided'){if(!run.answer)return message('Write the word first.');return enter('hidden')}
  if(run.phase==='result')return next();
 }
 function completePractice(){
  if(run.phase!=='practice')return;
  if(!run.practicePaths.every(paths=>paths.length))return message('Write the word on all three lines first.');
  run.padCorrect=true;run.resultCorrect=false;run.phase='result';run.audioPhase='';d.sfx('correct');d.save();render();
 }
 function check(raw=run.answer){
  if(run.phase!=='hidden')return;
  const w=word(),attempt=d.normalize(raw,w.word);if(!attempt)return message('Write the word first.');
  run.answer=attempt;run.attempt=attempt;
  const l=w.learn,f=record(w),correct=attempt===w.word;
  l.attempts++;state.stats.answers=(state.stats.answers||0)+1;l.last=new Date().toISOString().slice(0,10);
  if(correct){
   l.correct++;l.first++;l.loops=(l.loops||0)+1;f.recallSuccess++;f.needsRecall=false;
   state.recentWords=[{id:w.id,date:l.last},...(state.recentWords||[]).filter(x=>x.id!==w.id)].slice(0,8);
   d.onRemembered(w);d.sfx('finish');
  }else{
   l.mistakes++;l.stageMist[4]=(l.stageMist[4]||0)+1;l.lastWrong=attempt;f.needsRecall=true;
   run.tempFocus=d.focus.mistake(w.word,raw,attempt);d.focus.remember(f,run.tempFocus);d.sfx('wrong');
  }
  d.markResult(f,{correct,firstTry:true});d.save();
  run.phase=correct?'result':'practice';run.resultCorrect=correct;run.audioPhase='';render();
 }
 function bindWriting(){
  const input=root.querySelector('#fiveInput');if(!input)return;
  const update=e=>{if(e?.isComposing)return;run.answer=d.normalize(input.value,word().word);if(input.value!==run.answer)input.value=run.answer;message('');try{navigator.virtualKeyboard?.hide?.()}catch{}};
  input.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){e.preventDefault();input.blur();return}if(e.pointerType==='pen'){try{input.focus({preventScroll:true});navigator.virtualKeyboard?.hide?.()}catch{}}},true);
  input.addEventListener('input',update);input.addEventListener('compositionend',update);input.addEventListener('change',update);
  input.addEventListener('focus',()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}});
  root.querySelector('#fiveClear')?.addEventListener('click',()=>{input.value='';run.answer='';message('')});
 }
 function bindInkPad(pad,ink,store,onStroke){
  if(!pad||!ink)return;
  let drawing=null;
  const point=e=>{const r=pad.getBoundingClientRect();return{x:Math.max(0,Math.min(600,Math.round((e.clientX-r.left)*600/r.width))),y:Math.max(0,Math.min(100,Math.round((e.clientY-r.top)*100/r.height)))}}; 
  pad.addEventListener('pointerdown',e=>{
   if(!['pen','mouse'].includes(e.pointerType))return;
   e.preventDefault();const p=point(e),path=document.createElementNS('http://www.w3.org/2000/svg','path');
   path.setAttribute('d','M'+p.x+' '+p.y);ink.appendChild(path);drawing={id:e.pointerId,path,points:[p],distance:0};pad.setPointerCapture?.(e.pointerId)
  });
  pad.addEventListener('pointermove',e=>{
   if(!drawing||drawing.id!==e.pointerId)return;
   const p=point(e),last=drawing.points.at(-1);drawing.distance+=Math.hypot(p.x-last.x,p.y-last.y);drawing.points.push(p);
   drawing.path.setAttribute('d',drawing.points.map((v,i)=>(i?'L':'M')+v.x+' '+v.y).join(' '))
  });
  pad.addEventListener('pointerup',e=>{
   if(!drawing||drawing.id!==e.pointerId)return;
   const stroke=drawing;drawing=null;if(stroke.distance<8){stroke.path.remove();return}
   store.push(stroke.path.getAttribute('d'));message('');onStroke?.()
  });
  pad.addEventListener('pointercancel',()=>{drawing?.path.remove();drawing=null});
 }
 function bindTrace(){
  const pad=root.querySelector('#fiveTracePad'),ink=pad?.querySelector('.five-trace-ink');
  bindInkPad(pad,ink,run.tracePaths);
 }
 function bindPracticeInk(){
  const pads=[...(root.querySelectorAll?.('.five-practice-line')||[])];
  pads.forEach(pad=>{
   const row=Number(pad.dataset.row),ink=pad.querySelector('.five-practice-ink');
   bindInkPad(pad,ink,run.practicePaths[row]||[]);
  });
  [...(root.querySelectorAll?.('[data-clear-practice]')||[])].forEach(btn=>btn.addEventListener('click',()=>{
   const row=Number(btn.dataset.clearPractice);run.practicePaths[row]=[];render();
  }));
  root.querySelector('#fiveTraceHelp')?.addEventListener('click',()=>{run.traceOpen=!run.traceOpen;render()});
  root.querySelector('#fivePracticeDone')?.addEventListener('click',completePractice);
 }
 function render(){
  const e=d.escape;
  if(run.phase==='done'){
   root.innerHTML='<div class="play-view five-words-view"><div class="five-done"><div class="five-sparkle">🐰 ✦</div><h1>'+run.ids.length+' words done!</h1><div class="five-actions"><button id="fiveFinish" class="primary-btn">Finish</button><button id="fiveMore" class="secondary-btn">5 more</button></div></div></div>';
   root.querySelector('#fiveFinish').onclick=d.home;root.querySelector('#fiveMore').onclick=d.more;return
  }
  const w=word();if(!w)return finish();
  const phase=run.phase,visible=['look','guided','result'].includes(phase);
  const title=({look:'Look & Listen',guided:'Look & Write',hidden:'Listen & Write',practice:'Practice Pad',result:run.padCorrect?'Good practice!':run.resultCorrect?'Nice work!':'Keep growing ✦'})[phase];
  const write=['guided','hidden'].includes(phase);
  const guide=visible?'<div class="five-guide"><strong class="five-target">'+d.focus.display(w,run.tempFocus,e)+'</strong></div>':'';
  const writing=write?'<div class="five-writing"><label for="fiveInput">'+(phase==='guided'?'Write it here':'Write what you hear')+'</label><input id="fiveInput" class="flow-word-input" type="text" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Write with Apple Pencil" aria-label="Write the whole word" value="'+e(run.answer)+'"><div class="five-actions"><button id="fiveClear" class="secondary-btn" type="button">Clear ✎</button><button id="fiveAction" class="primary-btn" type="button">'+(phase==='guided'?'Next':'Check')+'</button></div></div>':'';
  const font=Math.min(74,Math.max(29,620/(w.word.length*.74)));
  const traceHelp=run.traceOpen?'<div class="five-trace-help"><div class="five-trace-pad" id="fiveTracePad" aria-label="Trace '+e(w.word)+' with Apple Pencil"><svg class="five-trace-guide" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true"><text x="300" y="73" text-anchor="middle" style="font-size:'+font+'px">'+e(w.word)+'</text></svg><svg class="five-trace-ink" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true">'+run.tracePaths.map(path=>'<path d="'+e(path)+'"/>').join('')+'</svg></div></div>':'';
  const practice=phase==='practice'?'<div class="five-paper-pad"><div class="five-you-wrote"><small>You wrote</small><span>'+e(run.attempt)+'</span></div><div class="five-practice-model"><small>Look at the correct spelling</small><strong class="five-target">'+d.focus.display(w,run.tempFocus,e)+'</strong></div><div class="five-practice-sheet">'+run.practicePaths.map((paths,i)=>'<div class="five-practice-row"><span class="five-practice-number">'+(i+1)+'</span><div class="five-practice-line" data-row="'+i+'" aria-label="Practice '+e(w.word)+' line '+(i+1)+' with Apple Pencil"><svg class="five-practice-ink" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true">'+paths.map(path=>'<path d="'+e(path)+'"/>').join('')+'</svg></div><button class="five-row-clear" type="button" data-clear-practice="'+i+'" aria-label="Clear practice line '+(i+1)+'">×</button></div>').join('')+'</div><button id="fiveTraceHelp" class="five-trace-help-btn secondary-btn" type="button">'+(run.traceOpen?'Hide trace':'Need help? Trace once')+'</button>'+traceHelp+'<div class="five-actions"><button id="fivePracticeDone" class="primary-btn" type="button">Done →</button></div></div>':'';
  const comparison=phase==='result'&&!run.resultCorrect&&!run.padCorrect?'<div class="flow-word-diff">'+d.diff(run.attempt,w.word)+'</div>':'';
  const response=phase==='result'?'<div class="five-actions"><button id="fiveAction" class="primary-btn">Next word →</button></div>':phase==='look'?'<div class="five-actions"><button id="fiveAction" class="primary-btn">Write →</button></div>':'';
  const sub=phase==='look'?'Look at the word and listen.':phase==='guided'?'Keep the word in view as you write.':phase==='hidden'?'Listen, then write the whole word.':phase==='practice'?'Look at the spelling. Write it three times with your Pencil.':run.padCorrect?'Good. We’ll remember it again later.':run.resultCorrect?'You remembered it!':'We’ll try it again later.';
  root.innerHTML='<div class="play-view five-words-view"><div class="five-top"><button id="fiveExit" class="icon-btn" aria-label="Exit practice">×</button><span>'+(run.lane==='week'?'THIS WEEK':'MY WORDS')+' · '+(run.index+1)+' / '+run.ids.length+'</span><div class="five-progress"><i style="width:'+run.index/run.ids.length*100+'%"></i></div></div><div class="five-card"><p class="eyebrow">'+(phase==='practice'?'PRACTICE PAD':'5 WORDS')+'</p><h1>'+title+'</h1><p class="five-sub">'+sub+'</p><button id="fiveAudio" class="audio-orb word-sound-button" type="button" aria-label="Listen to the word">🔊 <small>Listen</small></button>'+guide+practice+writing+comparison+response+'<p id="fiveMessage" class="five-message" role="status"></p></div></div>';
  root.querySelector('#fiveExit').onclick=d.home;
  root.querySelector('#fiveAudio').onclick=()=>d.audio(w,true);
  root.querySelector('#fiveAction')?.addEventListener('click',()=>phase==='hidden'?check(root.querySelector('#fiveInput')?.value):advance());
  bindWriting();if(phase==='practice'){bindPracticeInk();if(run.traceOpen)bindTrace()}
  if(run.audioPhase!==phase&&['look','hidden'].includes(phase)){run.audioPhase=phase;setTimeout(()=>{if(run.phase===phase)d.audio(w,false)},100)}
  if(!w.pronunciationUrl&&!w.audioTried)d.resolveAudio(w).catch(()=>{});
 }
 startWord();
 return{run,render,advance,check,completePractice,next,finish,startWord};
}
window.FiveWordsCore={create};
})();
