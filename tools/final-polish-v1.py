from pathlib import Path

APP=Path('app.js')
INDEX=Path('index.html')
CSS=Path('final-polish-v1.css')

app=APP.read_text()
index=INDEX.read_text()


def replace_once(text, old, new, label):
    if new in text:
        return text
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old,new,1)

# ---------- state / audio settings ----------
app=replace_once(
    app,
    "function defaultState(){return{version:3,xp:0,week:{id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids:[]},lib:{},garden:{growth:0,pos:{}},settings:{sound:true,voice:''},stats:{answers:0,sessions:0}}}",
    "function defaultState(){return{version:3,xp:0,week:{id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids:[]},lib:{},garden:{growth:0,pos:{},bunnySeated:false},settings:{sound:true,music:true,voice:''},stats:{answers:0,sessions:0}}}",
    'defaultState')
app=replace_once(
    app,
    "s.lib=s.lib||{};s.stats=s.stats||{answers:0,sessions:0};s.garden=s.garden||{growth:0,pos:{}};s.settings=s.settings||{sound:true,voice:''};",
    "s.lib=s.lib||{};s.stats=s.stats||{answers:0,sessions:0};s.garden=s.garden||{growth:0,pos:{},bunnySeated:false};s.garden.pos=s.garden.pos||{};if(typeof s.garden.bunnySeated!=='boolean')s.garden.bunnySeated=false;s.settings=s.settings||{sound:true,music:true,voice:''};if(typeof s.settings.music!=='boolean')s.settings.music=true;",
    'state migration')
app=replace_once(
    app,
    "let focusTimer=null;",
    "let focusTimer=null;\nlet audioCtx=null;\nlet musicGain=null;\nlet bgmTimer=null;\nlet audioUnlocked=false;",
    'audio globals')

old_top="function renderTopbar(){const level=Math.floor(state.xp/LEVEL_XP)+1,p=state.xp%LEVEL_XP;$('#levelLabel').textContent=`Level ${level}`;$('#xpLabel').textContent=`${p} / ${LEVEL_XP} XP`;$('#xpFill').style.width=`${p}%`}"
new_top="""function renderTopbar(){
  const level=Math.floor(state.xp/LEVEL_XP)+1,p=state.xp%LEVEL_XP;
  $('#levelLabel').textContent=`Level ${level}`;$('#xpLabel').textContent=`${p} / ${LEVEL_XP} XP`;$('#xpFill').style.width=`${p}%`;
  const music=$('#musicToggle');if(music){music.textContent=state.settings.music?'♫':'♪';music.classList.toggle('off',!state.settings.music);music.setAttribute('aria-label',state.settings.music?'Turn garden music off':'Turn garden music on');music.title=state.settings.music?'Garden music on':'Garden music off'}
}"""
app=replace_once(app,old_top,new_top,'renderTopbar')
app=replace_once(
    app,
    "function setView(name){currentView=name;$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play')renderPlayHome();if(name==='parent')renderParent();renderTopbar()}",
    "function setView(name){currentView=name;$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play')renderPlayHome();if(name==='parent')renderParent();renderTopbar();syncBgm()}",
    'setView music sync')

# ---------- garden final polish + bunny chair snapping ----------
start=app.index('function renderGarden(){')
end=app.index('\nfunction renderPlayHome(){', start)
new_garden=r'''function gardenDefaultPos(id){const r=rewards.find(x=>x.id===id);return{x:r?.x??50,y:r?.y??60}}
function gardenPos(id){return state.garden.pos[id]||gardenDefaultPos(id)}
function bunnyDisplayPos(){const bench=gardenPos('bench');return state.garden.bunnySeated&&state.xp>=70?{x:bench.x,y:bench.y-8}:gardenPos('bunny')}
function renderGarden(){
  const a=Math.min(4,Math.floor(state.garden.growth/2));const b=Math.min(4,Math.floor(Math.max(0,state.garden.growth-4)/2));
  const next=rewards.find(r=>state.xp<r.xp);const nextText=next?`${next.emoji||'🐰'} next surprise at ${next.xp} XP`:'✨ All current garden friends unlocked!';
  const seatText=state.xp<70?'Keep growing — a chair surprise is coming!':state.garden.bunnySeated?'🐰 Bunny loves her chair! ♡':'🐰 Try putting Bunny on the chair!';
  $('#gardenView').innerHTML=`<div class="garden-view"><div class="garden-head"><div><p class="eyebrow">YOUR GARDEN</p><h1>Miori’s little spell world ✦</h1><p class="sub">${esc(state.week.title)} · ${state.garden.growth} growth moments</p></div><button class="primary-btn garden-play" id="gardenPlayBtn">Play! ✦</button></div><div class="garden-scene" id="gardenScene"><div class="garden-update"><b>NEW ✦</b><span>Smoother Pencil Play · happy sounds · more garden magic</span></div><div class="next-surprise">${esc(nextText)}</div><div class="garden-spark s1">✦</div><div class="garden-spark s2">✧</div><div class="garden-spark s3">✦</div><div class="garden-butterfly b1">🦋</div><div class="garden-butterfly b2">🦋</div><div class="sun"></div><div class="cloud a"></div><div class="cloud b"></div><div class="hill back"></div><div class="hill front"></div><div class="path"></div><div class="pond"></div><div class="plot left">${plant(a)}</div><div class="plot right">${plant(b)}</div><div id="gardenObjects"></div><div class="garden-tip">${seatText} &nbsp;·&nbsp; Drag friends and treasures anywhere.</div></div></div>`;
  $('#gardenPlayBtn').onclick=()=>{playSfx('tap');setView('play')};
  const root=$('#gardenObjects');rewards.filter(r=>state.xp>=r.xp).forEach(r=>{const p=r.id==='bunny'?bunnyDisplayPos():gardenPos(r.id);const el=document.createElement('div');el.className=`garden-object ${r.type}${r.id==='bunny'&&state.garden.bunnySeated?' seated':''}`;el.dataset.id=r.id;el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;el.style.zIndex=r.id==='bunny'?'18':'8';el.innerHTML=r.type==='rabbit'?rabbitSvg():r.emoji;root.appendChild(el);makeDraggable(el)});
}
function makeDraggable(el){
  let pid=null;const scene=$('#gardenScene');
  el.onpointerdown=e=>{pid=e.pointerId;el._p=null;el.setPointerCapture?.(pid);el.classList.add('dragging')};
  el.onpointermove=e=>{if(e.pointerId!==pid)return;const r=scene.getBoundingClientRect();const x=Math.max(4,Math.min(96,(e.clientX-r.left)/r.width*100));const y=Math.max(10,Math.min(91,(e.clientY-r.top)/r.height*100));el.style.left=`${x}%`;el.style.top=`${y}%`;el._p={x,y}};
  el.onpointerup=e=>{if(e.pointerId!==pid)return;el.classList.remove('dragging');const id=el.dataset.id,p=el._p;pid=null;if(!p)return;
    if(id==='bunny'&&state.xp>=70){const bench=gardenPos('bench'),d=Math.hypot(p.x-bench.x,p.y-bench.y);if(d<17){state.garden.bunnySeated=true;delete state.garden.pos.bunny;save();playSfx('sparkle');toast('Bunny found her chair! ♡');renderGarden();return}state.garden.bunnySeated=false}
    state.garden.pos[id]=p;save();
    if(id==='bench'&&state.garden.bunnySeated)renderGarden();
  }
}
'''
app=app[:start]+new_garden+app[end:]

# ---------- Play home / start sound ----------
old_home="function renderPlayHome(){session=null;helpKind='';$('#playView').innerHTML=`<div class=\"play-view\"><div class=\"play-home\"><div class=\"play-hero-card\"><div><p class=\"eyebrow\">READY WHEN YOU ARE</p><h1>Let’s make some words bloom.</h1><p>A short practice picked from this week. The picture clue and meaning stay on screen, and the writing boxes are made for Apple Pencil one letter at a time.</p><button class=\"giant\" id=\"startSessionBtn\">Start Play →</button><div class=\"play-meta\"><span>${esc(state.week.title)}</span><span>${state.week.ids.length} words</span><span>Human pronunciation when available</span><span>Hints are always okay ♡</span></div></div><div class=\"play-mascot\"><div class=\"mascot-bubble\">🐰</div></div></div></div></div>`;$('#startSessionBtn').onclick=startSession}"
new_home="""function renderPlayHome(){session=null;helpKind='';$('#playView').innerHTML=`<div class="play-view"><div class="play-home"><div class="play-hero-card"><div><div class="play-new">TODAY’S SPELL ADVENTURE ✦</div><p class="eyebrow">READY WHEN YOU ARE</p><h1>Let’s make some words bloom.</h1><p>Listen, look at the picture clue, then spell with Apple Pencil. Every finished word makes your garden grow.</p><button class="giant" id="startSessionBtn">Start! ✦</button><div class="play-meta"><span>${esc(state.week.title)}</span><span>${state.week.ids.length} words</span><span>Real human pronunciation when available</span><span>Hints are always okay ♡</span></div></div><div class="play-mascot"><div class="mascot-bubble">🐰</div></div></div></div></div>`;$('#startSessionBtn').onclick=startSession;syncBgm()}"""
app=replace_once(app,old_home,new_home,'renderPlayHome')
app=replace_once(
    app,
    "function startSession(){if(!state.week.ids.length)return toast('Add words in Parent first.');session={count:0,goal:Math.min(GOAL,state.week.ids.length),doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()}",
    "function startSession(){if(!state.week.ids.length)return toast('Add words in Parent first.');playSfx('start');stopBgm();session={count:0,goal:Math.min(GOAL,state.week.ids.length),doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()}",
    'startSession sound')

# ---------- Stage 1: only show correctly-spelled real words ----------
old_choices="function wholeChoices(w,r){let out=[w.word];if(w.mioriSpelling&&w.mioriSpelling!==w.word)out.push(w.mioriSpelling);if(w.learn.lastWrong&&w.learn.lastWrong!==w.word)out.push(w.learn.lastWrong);for(const alt of confusions(w.word.slice(r.start,r.end)))out.push(w.word.slice(0,r.start)+alt+w.word.slice(r.end));while(out.length<3)out.push(w.word+'e');return shuffle([...new Set(out)].slice(0,3))}"
new_choices="""const SAFE_STAGE1_WORDS=['window','rocket','pencil','banana','tiger','garden','music','school','purple','cookie','ocean','rabbit'];
function stage1DistanceScore(target,candidate){
  target=norm(target);candidate=norm(candidate);let score=0;if(!target||!candidate||target===candidate)return-999;
  if(target[0]!==candidate[0])score+=4;score+=Math.min(4,Math.abs(target.length-candidate.length));
  let prefix=0;while(prefix<Math.min(target.length,candidate.length)&&target[prefix]===candidate[prefix])prefix++;score-=prefix*2;
  const tail=target.slice(-3);if(tail.length===3&&candidate.endsWith(tail))score-=5;
  const set=new Set(target);const overlap=[...new Set(candidate)].filter(c=>set.has(c)).length;score-=overlap*.22;
  return score+Math.random()*.8;
}
function wholeChoices(w,r){
  // Stage 1 is sound-to-word recognition, not a "spot the fake spelling" trap.
  // Every distractor is a correctly-spelled real word so Miori never studies a false form by accident.
  const week=state.week.ids.map(id=>state.lib[id]?.word).filter(Boolean);let pool=[...week,...SAFE_STAGE1_WORDS].filter(x=>norm(x)!==w.word);
  pool=[...new Set(pool.map(norm).filter(Boolean))].sort((a,b)=>stage1DistanceScore(w.word,b)-stage1DistanceScore(w.word,a));
  const broad=pool.slice(0,Math.min(6,pool.length));const picked=shuffle(broad).slice(0,2);return shuffle([w.word,...picked])
}"""
app=replace_once(app,old_choices,new_choices,'Stage 1 choices')

# Stage 1 wrong taps should not create fake "weak letter" data because the distractor is another real word.
old_wrong="function wrong(w,q,attempt,correct){const l=w.learn;l.attempts++;l.mistakes++;l.stageMist[q.stage]=(l.stageMist[q.stage]||0)+1;l.lastWrong=q.stage===3?w.word.slice(0,q.range.start)+attempt+w.word.slice(q.range.end):attempt;l.last=today();q.first=false;state.stats.answers=(state.stats.answers||0)+1;const aligned=alignChars(correct,attempt);aligned.slots.forEach((slot,i)=>{if(!slot||slot.state!=='ok'){const full=(q.stage===3?q.range.start:0)+i;l.weak[full]=(l.weak[full]||0)+2}});save()}"
new_wrong="function wrong(w,q,attempt,correct){const l=w.learn;l.attempts++;l.mistakes++;l.stageMist[q.stage]=(l.stageMist[q.stage]||0)+1;l.lastWrong=q.stage===3?w.word.slice(0,q.range.start)+attempt+w.word.slice(q.range.end):attempt;l.last=today();q.first=false;state.stats.answers=(state.stats.answers||0)+1;if(q.stage>1){const aligned=alignChars(correct,attempt);aligned.slots.forEach((slot,i)=>{if(!slot||slot.state!=='ok'){const full=(q.stage===3?q.range.start:0)+i;l.weak[full]=(l.weak[full]||0)+2}})}save()}"
app=replace_once(app,old_wrong,new_wrong,'Stage 1 weak-letter protection')

# ---------- Pencil: direct Scribble in an empty box, no first tap / focus hop ----------
app=replace_once(
    app,
    "      // Empty boxes start read-only. A Pencil-down event arms only the box being written, so taps/focus cannot summon the keyboard.\n      boxes.push(`<input class=\"letter-box empty-box ${cls.trim()}\" data-local=\"${local}\" data-full=\"${full}\" value=\"\" readonly maxlength=\"1\" inputmode=\"none\" virtualkeyboardpolicy=\"manual\" autocomplete=\"off\" autocapitalize=\"none\" autocorrect=\"off\" spellcheck=\"false\" placeholder=\" \" aria-label=\"Letter ${full+1}\">`);",
    "      // Empty boxes stay genuine editable Scribble targets. Apple Pencil can begin writing immediately — no first tap is required.\n      boxes.push(`<input class=\"letter-box empty-box ${cls.trim()}\" data-local=\"${local}\" data-full=\"${full}\" value=\"\" maxlength=\"1\" inputmode=\"none\" virtualkeyboardpolicy=\"manual\" autocomplete=\"off\" autocapitalize=\"none\" autocorrect=\"off\" spellcheck=\"false\" placeholder=\" \" aria-label=\"Letter ${full+1}\">`);",
    'empty box direct Scribble')
app=replace_once(
    app,
    "return`<div class=\"spell-wrap\"><div class=\"pencil-modebar\"><button id=\"writeModeBtn\" class=\"mode-btn write ${q.mode==='write'?'on':''}\">✎ Write</button><button id=\"eraseModeBtn\" class=\"mode-btn erase ${q.mode==='erase'?'on':''}\">⌫ Eraser</button></div><div class=\"box-note\">Each letter has its own box. Write directly in an empty box. Scratch one written box to erase only that letter; Eraser is the backup.</div>",
    "return`<div class=\"spell-wrap\"><div class=\"pencil-modebar\"><button id=\"writeModeBtn\" class=\"mode-btn write ${q.mode==='write'?'on':''}\">✎ Write</button><button id=\"eraseModeBtn\" class=\"mode-btn erase ${q.mode==='erase'?'on':''}\">⌫ Eraser</button></div><div class=\"box-note\">Just write in the next empty box — no tap first. Scratch one written box to erase only that letter.</div>",
    'Pencil help text')

bind_start=app.index('function bindLetterBox(box,index,w,q){')
bind_end=app.index('\nfunction focusLetter(input){', bind_start)
new_bind=r'''function bindLetterBox(box,index,w,q){
  const isInput=box.tagName==='INPUT';
  box.addEventListener('pointerdown',e=>{
    const pointer=e.pointerType||'';
    if(pointer==='touch'){
      // Finger/palm never owns a writing box. Buttons elsewhere still work normally.
      e.preventDefault();if(isInput)box.blur();return;
    }
    if(q.mode==='erase'&&(pointer==='pen'||pointer==='mouse')){
      e.preventDefault();e.stopPropagation();clearOneBox(index,w,q,true);return;
    }
    if(q.mode==='write'&&pointer==='pen'&&q.letters[index]){
      // Written letters are display boxes, so this gesture can only mean scratch-to-erase.
      startFilledBoxScratch(e,index,w,q,box);return;
    }
    if(q.mode==='write'&&pointer==='pen'&&isInput&&!q.letters[index]){
      // Intentionally DO NOT focus here. Native Scribble sees an already-editable field and owns this very first stroke.
      box.setAttribute('inputmode','none');setTimeout(()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}},0);
    }
  },true);
  box.addEventListener('touchstart',e=>{if(isInput){e.preventDefault();box.blur()}},{passive:false});
  box.addEventListener('contextmenu',e=>e.preventDefault());box.addEventListener('dragstart',e=>e.preventDefault());
  if(!isInput)return;
  box.addEventListener('keydown',e=>e.preventDefault());
  box.addEventListener('beforeinput',e=>{const t=String(e.inputType||'');if(t.startsWith('delete')){e.preventDefault();return}});
  box.addEventListener('input',e=>{
    if(q.mode==='erase'){e.target.value='';return}
    const cleaned=norm(e.target.value).slice(-1);if(!cleaned){e.target.value='';return}
    q.letters[index]=cleaned;q.feedback=null;q.hint=null;
    // Convert only this field into a non-text display box immediately. Other empty inputs stay ready for the next fast Pencil stroke.
    const written=document.createElement('div');written.className='letter-box written-box filled';written.dataset.local=String(index);written.dataset.full=e.target.dataset.full||String(index);written.setAttribute('role','button');written.setAttribute('aria-label',`Letter ${Number(written.dataset.full)+1}: ${cleaned}. Scratch to erase.`);written.textContent=cleaned;
    e.target.replaceWith(written);bindLetterBox(written,index,w,q);
    $$('.letter-box').forEach(el=>el.classList.remove('ok','bad','missing','hint-target'));const fb=$('#feedback');if(fb){fb.textContent='';fb.className='feedback'};$('.hint-strip')?.remove();
    try{navigator.virtualKeyboard?.hide?.()}catch{}
  });
  box.addEventListener('focus',()=>{try{box.setSelectionRange(0,0)}catch{};try{navigator.virtualKeyboard?.hide?.()}catch{}});
}'''
app=app[:bind_start]+new_bind+app[bind_end:]

# ---------- audio engine: light garden BGM + richer start/tap effects ----------
old_sfx_start=app.index('function playSfx(type){')
old_sfx_end=app.index('\n\nfunction alignChars(',old_sfx_start)
new_audio=r'''function ensureAudioCtx(){
  if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;audioCtx=new C()}
  if(audioCtx.state==='suspended')audioCtx.resume?.();return audioCtx
}
function tone(ctx,f,start,dur,gain=.035,type='sine',dest=null){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(gain,start+.018);g.gain.exponentialRampToValueAtTime(.0001,start+dur);o.connect(g);g.connect(dest||ctx.destination);o.start(start);o.stop(start+dur+.03)}
function playSfx(type){
  if(!state.settings.sound)return;try{const ctx=ensureAudioCtx();if(!ctx)return;const now=ctx.currentTime+.01;let notes=[220,196],kind='triangle',gain=.035,step=.07,dur=.15;
    if(type==='correct'){notes=[523,659];kind='sine';gain=.045}
    if(type==='level'){notes=[523,659,784,1047];kind='sine';gain=.05;step=.075}
    if(type==='start'){notes=[392,523,659,784];kind='sine';gain=.055;step=.065;dur=.18}
    if(type==='tap'){notes=[659];kind='sine';gain=.025;dur=.09}
    if(type==='sparkle'){notes=[784,988,1175];kind='sine';gain=.038;step=.055;dur=.14}
    notes.forEach((f,i)=>tone(ctx,f,now+i*step,dur,gain,kind));
  }catch{}
}
function scheduleBgmBar(){
  if(!audioUnlocked||!state.settings.music||bgmTimer===null)return;const ctx=ensureAudioCtx();if(!ctx||!musicGain)return;const now=ctx.currentTime+.04;
  const bars=[[659,784,880,784,659,587,659,523],[587,659,784,659,587,523,587,659],[659,784,988,880,784,659,587,659]];const melody=bars[(Math.floor(Date.now()/2400))%bars.length];
  melody.forEach((f,i)=>tone(ctx,f,now+i*.28,.20,.016,i%2?'sine':'triangle',musicGain));
  [261.6,293.7,329.6,293.7].forEach((f,i)=>tone(ctx,f,now+i*.56,.36,.006,'sine',musicGain));
}
function startBgm(){
  if(!audioUnlocked||!state.settings.music||bgmTimer!==null)return;const ctx=ensureAudioCtx();if(!ctx)return;musicGain=ctx.createGain();musicGain.gain.setValueAtTime(.0001,ctx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.42,ctx.currentTime+.35);musicGain.connect(ctx.destination);bgmTimer=setInterval(scheduleBgmBar,2240);scheduleBgmBar();renderTopbar()
}
function stopBgm(){
  if(bgmTimer!==null){clearInterval(bgmTimer);bgmTimer=null}if(musicGain&&audioCtx){try{musicGain.gain.cancelScheduledValues(audioCtx.currentTime);musicGain.gain.setValueAtTime(Math.max(.0001,musicGain.gain.value),audioCtx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.18)}catch{};const old=musicGain;setTimeout(()=>{try{old.disconnect()}catch{}},260)}musicGain=null;renderTopbar()
}
function syncBgm(){const should=state.settings.music&&(currentView==='garden'||(currentView==='play'&&!session));if(should)startBgm();else stopBgm()}
'''
app=app[:old_sfx_start]+new_audio+app[old_sfx_end:]

# Stop music while the spelling task is running so pronunciation stays clear.
app=replace_once(app,"function renderTask(){\n  if(!session)return renderPlayHome();","function renderTask(){\n  if(!session)return renderPlayHome();stopBgm();",'renderTask BGM duck')

# ---------- init / toggle ----------
old_init="function init(){$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.nav)));renderTopbar();loadVoices();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=loadVoices;setView('garden');for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}}"
new_init="""function init(){
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>{playSfx('tap');setView(b.dataset.nav)}));
  $('#musicToggle')?.addEventListener('click',()=>{audioUnlocked=true;state.settings.music=!state.settings.music;save();if(state.settings.music){playSfx('sparkle');syncBgm()}else stopBgm()});
  document.addEventListener('pointerdown',()=>{audioUnlocked=true;ensureAudioCtx();syncBgm()},{once:true,capture:true});
  renderTopbar();loadVoices();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=loadVoices;setView('garden');for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}
}"""
app=replace_once(app,old_init,new_init,'init music controls')

# ---------- index ----------
index=replace_once(
    index,
    '      <nav class="main-nav" aria-label="Main navigation">',
    '      <button id="musicToggle" class="music-toggle" aria-label="Turn garden music off" title="Garden music">♫</button>\n      <nav class="main-nav" aria-label="Main navigation">',
    'music toggle markup')
index=replace_once(
    index,
    '  <link rel="stylesheet" href="pencil-touch-guard.css?v=20260914-palm-v4">',
    '  <link rel="stylesheet" href="pencil-touch-guard.css?v=20260914-palm-v4">\n  <link rel="stylesheet" href="final-polish-v1.css?v=20260914-final-v1">',
    'final CSS include')
index=index.replace('app.js?v=20260914-pencil-box-v4','app.js?v=20260914-final-v1')

final_css=r'''/* Final launch polish — 2026-09-14 */
.music-toggle{width:40px;height:40px;flex:0 0 40px;border:1px solid rgba(157,135,171,.16);border-radius:14px;background:linear-gradient(145deg,#fff,#f5edff);box-shadow:0 6px 15px rgba(87,68,115,.08);color:#705a83;font-size:18px;font-weight:900;transition:.18s transform,.18s opacity}
.music-toggle:active{transform:scale(.92)}.music-toggle.off{opacity:.48;background:#f3f0f2;color:#8e858e}
.garden-play{position:relative;overflow:hidden;min-width:150px;font-size:16px!important}.garden-play:after{content:'✦';position:absolute;right:12px;top:5px;animation:polishTwinkle 1.5s ease-in-out infinite}
.garden-update{position:absolute;z-index:7;left:18px;top:16px;display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:17px;background:rgba(255,253,251,.87);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 8px 20px rgba(74,58,85,.10);font-size:10px;color:#736877;pointer-events:none}.garden-update b{padding:4px 7px;border-radius:9px;background:linear-gradient(135deg,#f0a8c2,#bba5ef);color:white;font-size:9px;letter-spacing:.08em}.garden-update span{font-weight:800}
.next-surprise{position:absolute;z-index:7;right:18px;top:17px;background:rgba(244,252,240,.9);border:1px solid rgba(127,166,134,.18);border-radius:99px;padding:8px 12px;font-size:9.5px;font-weight:900;color:#607565;pointer-events:none}
.garden-spark,.garden-butterfly{position:absolute;z-index:6;pointer-events:none;user-select:none}.garden-spark{color:#fff7bd;text-shadow:0 2px 8px rgba(150,118,70,.22);animation:polishTwinkle 2s ease-in-out infinite}.garden-spark.s1{left:7%;top:30%;font-size:26px}.garden-spark.s2{right:31%;top:11%;font-size:18px;animation-delay:.55s}.garden-spark.s3{right:8%;top:43%;font-size:22px;animation-delay:1s}.garden-butterfly{font-size:22px;filter:drop-shadow(0 5px 5px rgba(61,50,75,.12));animation:butterflyFloat 5.2s ease-in-out infinite}.garden-butterfly.b1{left:31%;top:27%}.garden-butterfly.b2{right:20%;top:35%;font-size:18px;animation-delay:1.7s}
.garden-object.rabbit{z-index:18!important}.garden-object.rabbit.seated{transform:translate(-50%,-50%) scale(.82);filter:drop-shadow(0 7px 7px rgba(68,55,39,.16))}.garden-object.rabbit.seated svg{transform:translateY(4px)}
.play-new{display:inline-flex;margin:0 0 11px;padding:7px 10px;border-radius:99px;background:linear-gradient(135deg,#fff0f6,#f1ebff);color:#8b678d;font-size:9.5px;font-weight:950;letter-spacing:.09em;box-shadow:inset 0 0 0 1px rgba(177,145,190,.1)}
.giant{position:relative;overflow:hidden;transition:transform .16s,box-shadow .16s}.giant:before{content:'✦';position:absolute;right:18px;top:8px;color:rgba(255,255,255,.75);animation:polishTwinkle 1.35s ease-in-out infinite}.giant:active{transform:scale(.97);box-shadow:0 6px 16px rgba(148,107,180,.18)}
/* Empty handwriting boxes are live Scribble targets from the first Pencil stroke. Finger touches are filtered in JS. */
.letter-box.empty-box{caret-color:transparent!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;cursor:crosshair;background:linear-gradient(180deg,#fff,#fffcf7)}
.letter-box.empty-box:focus{caret-color:transparent!important;-webkit-user-select:none!important;user-select:none!important}
.letter-box.written-box{display:grid;place-items:center;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;cursor:default}
@keyframes polishTwinkle{0%,100%{opacity:.35;transform:scale(.8) rotate(-8deg)}50%{opacity:1;transform:scale(1.16) rotate(8deg)}}
@keyframes butterflyFloat{0%,100%{transform:translate(0,0) rotate(-8deg)}35%{transform:translate(14px,-8px) rotate(7deg)}70%{transform:translate(-8px,6px) rotate(-3deg)}}
@media(max-width:900px){.garden-update span{display:none}.garden-update{padding:8px 9px}.next-surprise{max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.music-toggle{width:36px;height:36px;flex-basis:36px}.garden-tip{max-width:82%;overflow:hidden;text-overflow:ellipsis}}
'''

APP.write_text(app)
INDEX.write_text(index)
CSS.write_text(final_css)
print('final polish patch applied')
