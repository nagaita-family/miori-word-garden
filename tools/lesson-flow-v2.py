from pathlib import Path

APP=Path('app.js')
INDEX=Path('index.html')
app=APP.read_text()
index=INDEX.read_text()


def replace_once(text, old, new, label):
    if new in text:
        return text
    n=text.count(old)
    if n!=1:
        raise SystemExit(f'{label}: expected 1 match, found {n}')
    return text.replace(old,new,1)

# Global celebration state.
app=replace_once(app,"let audioUnlocked=false;","let audioUnlocked=false;\nlet gardenCelebration=null;","celebration global")

# Resume a live session when Play is opened from the reward garden.
old_set="function setView(name){currentView=name;$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play')renderPlayHome();if(name==='parent')renderParent();renderTopbar();syncBgm()}"
new_set="function setView(name){currentView=name;$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play'){if(session){if(session.count>=session.goal)finishSession();else renderTask()}else renderPlayHome()}if(name==='parent')renderParent();renderTopbar();syncBgm()}"
app=replace_once(app,old_set,new_set,'setView session resume')

# Garden: animate every completed word, even when the plant visual stage does not change.
start=app.index('function renderGarden(){')
end=app.index('\nfunction makeDraggable',start)
new_garden=r'''function renderGarden(){
  const a=Math.min(4,Math.floor(state.garden.growth/2));const b=Math.min(4,Math.floor(Math.max(0,state.garden.growth-4)/2));
  const next=rewards.find(r=>state.xp<r.xp);const nextText=next?`${next.emoji||'🐰'} next surprise at ${next.xp} XP`:'✨ All current garden friends unlocked!';
  const seatText=state.xp<70?'Keep growing — a chair surprise is coming!':state.garden.bunnySeated?'🐰 Bunny loves her chair! ♡':'🐰 Try putting Bunny on the chair!';
  const celebration=gardenCelebration;const target=celebration?(celebration.growth<=4?'left':'right'):'';
  const rewardCard=celebration?`<div class="reward-garden-card"><div class="reward-emoji">${esc(celebration.emoji||'🌱')}</div><div class="copy"><b>${esc(celebration.word)} made the garden grow! ✦</b><span>+${celebration.gain} XP · Watch it bloom, then keep going.</span></div><button id="gardenNextWordBtn">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const burst=celebration?`<div class="growth-burst ${target}"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';
  $('#gardenView').innerHTML=`<div class="garden-view"><div class="garden-head"><div><p class="eyebrow">YOUR GARDEN</p><h1>Miori’s little spell world ✦</h1><p class="sub">${esc(state.week.title)} · ${state.garden.growth} growth moments</p></div><button class="primary-btn garden-play" id="gardenPlayBtn">${celebration?'Keep going ✦':'Play! ✦'}</button></div><div class="garden-scene ${celebration?'reward-moment':''}" id="gardenScene">${rewardCard}<div class="garden-update"><b>NEW ✦</b><span>Smoother Pencil Play · happy sounds · more garden magic</span></div><div class="next-surprise">${esc(nextText)}</div><div class="garden-spark s1">✦</div><div class="garden-spark s2">✧</div><div class="garden-spark s3">✦</div><div class="garden-butterfly b1">🦋</div><div class="garden-butterfly b2">🦋</div><div class="sun"></div><div class="cloud a"></div><div class="cloud b"></div><div class="hill back"></div><div class="hill front"></div><div class="path"></div><div class="pond"></div><div class="plot left ${target==='left'?'growth-now':''}">${plant(a)}</div><div class="plot right ${target==='right'?'growth-now':''}">${plant(b)}</div>${burst}<div id="gardenObjects"></div><div class="garden-tip">${celebration?'✨ A word became garden growth!':seatText+' &nbsp;·&nbsp; Drag friends and treasures anywhere.'}</div></div></div>`;
  const continuePlay=()=>{playSfx('tap');gardenCelebration=null;setView('play')};
  $('#gardenPlayBtn').onclick=()=>celebration?continuePlay():(playSfx('tap'),setView('play'));
  $('#gardenNextWordBtn')?.addEventListener('click',continuePlay);
  const root=$('#gardenObjects');rewards.filter(r=>state.xp>=r.xp).forEach(r=>{const p=r.id==='bunny'?bunnyDisplayPos():gardenPos(r.id);const el=document.createElement('div');el.className=`garden-object ${r.type}${r.id==='bunny'&&state.garden.bunnySeated?' seated':''}`;el.dataset.id=r.id;el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;el.style.zIndex=r.id==='bunny'?'18':'8';el.innerHTML=r.type==='rabbit'?rabbitSvg():r.emoji;root.appendChild(el);makeDraggable(el)});
  if(celebration){setTimeout(()=>playSfx('sparkle'),90)}
}'''
app=app[:start]+new_garden+app[end:]

# Direct Pencil focus on the field touched: no need to wait for previous Scribble recognition to finish.
old_pen="""    if(q.mode==='write'&&pointer==='pen'&&isInput&&!q.letters[index]){
      // Intentionally DO NOT focus here. Native Scribble sees an already-editable field and owns this very first stroke.
      box.setAttribute('inputmode','none');setTimeout(()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}},0);
    }"""
new_pen="""    if(q.mode==='write'&&pointer==='pen'&&isInput&&!q.letters[index]){
      // Focus the exact box at Pencil-down, but do not preventDefault: Scribble still owns this first stroke.
      // This pipelines fast writing: Miori can move to the next box before iPad finishes recognizing the previous letter.
      box.setAttribute('inputmode','none');
      try{if(document.activeElement!==box)box.focus({preventScroll:true})}catch{}
      setTimeout(()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}},0);
    }"""
app=replace_once(app,old_pen,new_pen,'direct Pencil focus')

# Word completion now goes to Garden first so growth is visible.
start=app.index('function right(w,q){')
end=app.index('\nfunction renderReward',start)
new_right=r'''function right(w,q){
  const l=w.learn;l.attempts++;l.correct++;if(q.first)l.first++;l.last=today();state.stats.answers=(state.stats.answers||0)+1;for(let i=q.range.start;i<q.range.end;i++)l.weak[i]=Math.max(0,(l.weak[i]||0)-1);playSfx('correct');q.feedback={good:true};
  if(q.stage<4){save();renderTask();const stage=q.stage;setTimeout(()=>{if(!session?.q||session.q.id!==w.id||session.q.stage!==stage)return;session.q=newQuestion(w,stage+1,q.range);helpKind='';renderTask()},520);return}
  const gain=30;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;session.xp+=gain;session.count++;if(!session.doneIds.includes(w.id))session.doneIds.push(w.id);
  const finished=session.count>=session.goal;gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,growth:state.garden.growth,finished};session.q=null;save();
  setTimeout(()=>setView('garden'),360)
}'''
app=app[:start]+new_right+app[end:]

# A finished session must release the old session so Play can start fresh next time.
start=app.index('function finishSession(){')
end=app.index('\nfunction showHint',start)
old_block=app[start:end]
# preserve existing summary wording but safely snapshot then clear session
new_finish=r'''function finishSession(){const doneCount=session?.count||0,earned=session?.xp||0;state.stats.sessions=(state.stats.sessions||0)+1;save();session=null;gardenCelebration=null;$('#playView').innerHTML=`<div class="play-view"><div class="reward-screen"><div class="reward-card"><div class="big">🌷</div><p class="eyebrow">PLAY COMPLETE</p><h1>You made the garden grow!</h1><p class="muted">You earned ${earned} XP this session.</p><div class="reward-chips"><span>${doneCount} words complete</span><span>XP stays forever</span></div><button id="seeGardenBtn" class="primary-btn">See Garden</button></div></div></div>`;$('#seeGardenBtn').onclick=()=>setView('garden')}'''
app=app[:start]+new_finish+app[end:]

# Human-audio failures now always fall back in the same attempt instead of silently producing no sound.
start=app.index('async function playWordAudio(')
end=app.index('\nasync function findHumanAudio',start)
new_audio=r'''async function playWordAudio(word,slow=false){
  if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}
  if(word.pronunciationUrl){
    let failed=false,timer=null;const btn=$('#audioBtn');
    const fallback=()=>{if(failed)return;failed=true;if(timer)clearTimeout(timer);btn?.classList.remove('playing');if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}word.pronunciationUrl='';word.audioTried=true;save();const pill=$('#voicePill');if(pill)pill.textContent='○ Device voice fallback';speak(word.word,{slow})};
    try{
      const audio=new Audio();currentAudio=audio;audio.preload='auto';audio.playbackRate=slow?.82:1;btn?.classList.add('playing');audio.onended=()=>{if(timer)clearTimeout(timer);btn?.classList.remove('playing');if(currentAudio===audio)currentAudio=null};audio.onerror=fallback;audio.onabort=fallback;audio.src=word.pronunciationUrl;
      timer=setTimeout(()=>{if(audio.readyState<2)fallback()},2200);
      await audio.play();return
    }catch(e){console.warn('Human audio failed, using device voice',e);fallback();return}
  }
  speak(word.word,{slow})
}'''
app=app[:start]+new_audio+app[end:]

# Fresh assets.
if 'lesson-flow-v2.css' not in index:
    index=index.replace('  <link rel="stylesheet" href="final-polish-v1.css?v=20260914-final-v1a">','  <link rel="stylesheet" href="final-polish-v1.css?v=20260914-final-v1a">\n  <link rel="stylesheet" href="lesson-flow-v2.css?v=20260914-lesson-v2">')
index=index.replace('app.js?v=20260914-final-v1a','app.js?v=20260914-lesson-v2')

APP.write_text(app)
INDEX.write_text(index)
print('LESSON_FLOW_V2_20260914 applied')
