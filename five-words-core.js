/* The five-word loop runs beside the older Stage flow used by weekly-test review. */
(function(){
'use strict';
function create(d){
 const {state,root}=d;
 const run={lane:d.lane,ids:[...d.ids],index:0,phase:'',answer:'',attempt:'',tracePaths:[],traced:false,audioPhase:'',finished:false};
 const word=()=>state.lib[run.ids[run.index]];
 function record(w){const l=w.learn;if(!l.five)l.five={introduced:!!((l.loops||0)>0||(l.stageMist?.[4]||0)>0),recallSuccess:0,needsRecall:false};return l.five}
 function message(s){const el=root.querySelector('#fiveMessage');if(el)el.textContent=s}
 function enter(phase){run.phase=phase;run.answer='';run.audioPhase='';render()}
 function startWord(){const w=word();if(!w)return finish();run.tracePaths=[];run.traced=false;enter(record(w).introduced?'hidden':'look')}
 function finish(){if(!run.finished){state.stats.sessions=(state.stats.sessions||0)+1;d.save();run.finished=true}run.phase='done';render()}
 function next(){run.index++;if(run.index>=run.ids.length)finish();else startWord()}
 function advance(){
  if(run.phase==='look')return enter('guided');
  if(run.phase==='guided'){if(!run.answer)return message('Write the word first.');return enter('hidden')}
  if(run.phase==='mistake')return enter('padTrace');
  if(run.phase==='padTrace'){if(!run.traced)return message('Trace the word first.');return enter('padCopy')}
  if(run.phase==='padCopy'){if(!run.answer)return message('Write the word first.');return enter('padHidden')}
  if(run.phase==='result')return next();
 }
 function check(raw=run.answer){
  if(!['hidden','padHidden'].includes(run.phase))return;
  const w=word(),attempt=d.normalize(raw,w.word);if(!attempt)return message('Write the word first.');
  run.answer=attempt;run.attempt=attempt;
  const l=w.learn,f=record(w),correct=attempt===w.word,firstTry=run.phase==='hidden';
  l.attempts++;state.stats.answers=(state.stats.answers||0)+1;l.last=new Date().toISOString().slice(0,10);
  if(correct){l.correct++;if(firstTry){l.first++;l.loops=(l.loops||0)+1;f.recallSuccess++;f.needsRecall=false;state.recentWords=[{id:w.id,date:l.last},...(state.recentWords||[]).filter(x=>x.id!==w.id)].slice(0,8);d.onRemembered(w);d.sfx('finish')}else d.sfx('correct')}
  else{l.mistakes++;l.stageMist[4]=(l.stageMist[4]||0)+1;l.lastWrong=attempt;f.needsRecall=true;d.sfx('wrong')}
  f.introduced=true;f.lastAt=new Date().toISOString();d.save();
  if(firstTry&&!correct)run.phase='mistake';else{run.phase='result';run.padCorrect=!firstTry&&correct;run.resultCorrect=correct}
  run.audioPhase='';render()
 }
 function bindWriting(){
  const input=root.querySelector('#fiveInput');if(!input)return;
  const update=e=>{if(e?.isComposing)return;run.answer=d.normalize(input.value,word().word);if(input.value!==run.answer)input.value=run.answer;message('');try{navigator.virtualKeyboard?.hide?.()}catch{}};
  input.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){e.preventDefault();input.blur();return}if(e.pointerType==='pen'){try{input.focus({preventScroll:true});navigator.virtualKeyboard?.hide?.()}catch{}}},true);
  input.addEventListener('input',update);input.addEventListener('compositionend',update);input.addEventListener('change',update);
  input.addEventListener('focus',()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}});
  root.querySelector('#fiveClear')?.addEventListener('click',()=>{input.value='';run.answer='';message('')});
 }
 function bindTrace(){
  const pad=root.querySelector('#fiveTracePad'),ink=pad?.querySelector('.five-trace-ink');if(!pad||!ink)return;
  let drawing=null;
  const point=e=>{const r=pad.getBoundingClientRect();return{x:Math.max(0,Math.min(600,Math.round((e.clientX-r.left)*600/r.width))),y:Math.max(0,Math.min(120,Math.round((e.clientY-r.top)*120/r.height)))}};
  pad.addEventListener('pointerdown',e=>{if(!['pen','mouse'].includes(e.pointerType))return;e.preventDefault();const p=point(e),path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M'+p.x+' '+p.y);ink.appendChild(path);drawing={id:e.pointerId,path,points:[p],distance:0};pad.setPointerCapture?.(e.pointerId)});
  pad.addEventListener('pointermove',e=>{if(!drawing||drawing.id!==e.pointerId)return;const p=point(e),last=drawing.points.at(-1);drawing.distance+=Math.hypot(p.x-last.x,p.y-last.y);drawing.points.push(p);drawing.path.setAttribute('d',drawing.points.map((v,i)=>(i?'L':'M')+v.x+' '+v.y).join(' '))});
  pad.addEventListener('pointerup',e=>{if(!drawing||drawing.id!==e.pointerId)return;const stroke=drawing;drawing=null;if(stroke.distance<8){stroke.path.remove();return}run.tracePaths.push(stroke.path.getAttribute('d'));run.traced=true;message('')});
  pad.addEventListener('pointercancel',()=>{drawing?.path.remove();drawing=null});
 }
 function render(){
  const e=d.escape;
  if(run.phase==='done'){
   root.innerHTML='<div class="play-view five-words-view"><div class="five-done"><div class="five-sparkle">🐰 ✦</div><h1>'+run.ids.length+' words done!</h1><div class="five-actions"><button id="fiveFinish" class="primary-btn">Finish</button><button id="fiveMore" class="secondary-btn">5 more</button></div></div></div>';
   root.querySelector('#fiveFinish').onclick=d.home;root.querySelector('#fiveMore').onclick=d.more;return
  }
  const w=word();if(!w)return finish();
  const phase=run.phase,visible=['look','guided','padTrace','padCopy','mistake','result'].includes(phase);
  const title=({look:'Look & Listen',guided:'Look & Write',hidden:'Listen & Write',mistake:'Let’s practice',padTrace:'Trace',padCopy:'Copy',padHidden:'Listen & Write',result:run.resultCorrect?'Nice work!':'Keep growing ✦'})[phase];
  const write=['guided','hidden','padCopy','padHidden'].includes(phase),trace=phase==='padTrace';
  const guide=visible?'<div class="five-guide"><strong class="five-target">'+e(w.word)+'</strong></div>':'';
  const writing=write?'<div class="five-writing"><label for="fiveInput">'+(phase==='guided'||phase==='padCopy'?'Write it here':'Write what you hear')+'</label><input id="fiveInput" class="flow-word-input" type="text" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Write with Apple Pencil" aria-label="Write the whole word" value="'+e(run.answer)+'"><div class="five-actions"><button id="fiveClear" class="secondary-btn" type="button">Clear ✎</button><button id="fiveAction" class="primary-btn" type="button">'+(phase==='guided'||phase==='padCopy'?'Next':'Check')+'</button></div></div>':'';
  const font=Math.min(74,Math.max(29,620/(w.word.length*.74)));
  const tracing=trace?'<div class="five-trace-pad" id="fiveTracePad" aria-label="Trace '+e(w.word)+' with Apple Pencil"><svg class="five-trace-guide" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><text x="300" y="85" text-anchor="middle" style="font-size:'+font+'px">'+e(w.word)+'</text></svg><svg class="five-trace-ink" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">'+run.tracePaths.map(path=>'<path d="'+e(path)+'"/>').join('')+'</svg></div><div class="five-actions"><button id="fiveAction" class="primary-btn" type="button">Copy →</button></div>':'';
  const comparison=phase==='mistake'||phase==='result'&&!run.resultCorrect?'<div class="flow-word-diff">'+d.diff(run.attempt,w.word)+'</div>':'';
  const response=phase==='mistake'?'<div class="five-actions"><button id="fiveAction" class="primary-btn">Practice Pad →</button></div>':phase==='result'?'<div class="five-actions"><button id="fiveAction" class="primary-btn">Next word →</button></div>':phase==='look'?'<div class="five-actions"><button id="fiveAction" class="primary-btn">Write →</button></div>':'';
  const sub=phase==='look'?'Look at the word and listen.':phase==='guided'?'Keep the word in view as you write.':phase==='hidden'||phase==='padHidden'?'Listen, then write the whole word.':trace?'Follow the light letters with your Pencil.':phase==='padCopy'?'Look, then write it underneath.':phase==='mistake'?'See the spelling, then try three small steps.':run.padCorrect?'We’ll remember it again later.':run.resultCorrect?'You remembered it!':'We’ll try it again later.';
  root.innerHTML='<div class="play-view five-words-view"><div class="five-top"><button id="fiveExit" class="icon-btn" aria-label="Exit practice">×</button><span>'+(run.lane==='week'?'THIS WEEK':'MY WORDS')+' · '+(run.index+1)+' / '+run.ids.length+'</span><div class="five-progress"><i style="width:'+run.index/run.ids.length*100+'%"></i></div></div><div class="five-card"><p class="eyebrow">'+(phase.startsWith('pad')?'PRACTICE PAD':'5 WORDS')+'</p><h1>'+title+'</h1><p class="five-sub">'+sub+'</p><button id="fiveAudio" class="audio-orb word-sound-button" type="button" aria-label="Listen to the word">🔊 <small>Listen</small></button>'+guide+tracing+writing+comparison+response+'<p id="fiveMessage" class="five-message" role="status"></p></div></div>';
  root.querySelector('#fiveExit').onclick=d.home;
  root.querySelector('#fiveAudio').onclick=()=>d.audio(w,true);
  root.querySelector('#fiveAction')?.addEventListener('click',()=>write&&['hidden','padHidden'].includes(phase)?check(root.querySelector('#fiveInput')?.value):advance());
  bindWriting();if(trace)bindTrace();
  if(run.audioPhase!==phase&&['look','hidden','padHidden'].includes(phase)){run.audioPhase=phase;setTimeout(()=>{if(run.phase===phase)d.audio(w,false)},100)}
  if(!w.pronunciationUrl&&!w.audioTried)d.resolveAudio(w).catch(()=>{});
 }
 startWord();
 return{run,render,advance,check,next,finish,startWord};
}
window.FiveWordsCore={create};
})();
