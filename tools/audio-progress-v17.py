from pathlib import Path
import re

p=Path('app.js')
s=p.read_text()

def replace_once(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: source not found')
    s=s.replace(old,new,1)

def sub_once(pattern,repl,label):
    global s
    s2,n=re.subn(pattern,repl,s,count=1,flags=re.S)
    if n!=1:
        raise SystemExit(f'{label}: expected 1 replacement, got {n}')
    s=s2

# Audio is ON by default. Existing devices get a one-time v17 migration to ON,
# after which the user's mute choice is preserved.
replace_once(
    "settings:{sound:true,music:false,musicV2:true,voice:''}",
    "settings:{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true}",
    'default audio settings'
)
replace_once(
    "s.settings=s.settings||{sound:true,music:false,musicV2:true,voice:''};if(typeof s.settings.music!=='boolean')s.settings.music=false;if(!s.settings.musicV2){s.settings.musicV2=true;s.settings.music=false;}",
    "s.settings=s.settings||{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true};if(typeof s.settings.sound!=='boolean')s.settings.sound=true;if(typeof s.settings.music!=='boolean')s.settings.music=true;if(!s.settings.audioDefaultV17){s.settings.sound=true;s.settings.music=true;s.settings.audioDefaultV17=true}s.settings.musicV2=true;",
    'audio settings migration'
)

# Replace Level/100-XP UI with a simple 3-word-to-treasure meter. XP stays internal
# only so existing saved gardens and reward thresholds remain compatible.
sub_once(
    r"function save\(\)\{localStorage\.setItem\(STORAGE_KEY,JSON\.stringify\(state\)\);renderTopbar\(\)\}\nfunction renderTopbar\(\)\{.*?\n\}\nfunction setView",
    """function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderTopbar()}
function treasureProgress(){
  const collectible=rewards.filter(r=>r.id!=='bunny');
  const next=collectible.find(r=>state.xp<r.xp)||null;
  if(!next)return{done:true,next:null,doneWords:3,away:0,pct:100};
  const previous=[...collectible].reverse().find(r=>state.xp>=r.xp);const base=previous?.xp||0;
  const earned=Math.max(0,state.xp-base),doneWords=Math.max(0,Math.min(3,Math.floor((earned+0.001)/30))),away=Math.max(0,Math.ceil((next.xp-state.xp)/30));
  return{done:false,next,doneWords,away,pct:Math.max(0,Math.min(100,earned/90*100))}
}
function treasureStatusText(){const t=treasureProgress();return t.done?'🎁 Collection complete':`🎁 ${t.away} ${t.away===1?'word':'words'} to treasure`}
function renderTopbar(){
  const t=treasureProgress(),label=$('#levelLabel'),count=$('#xpLabel'),fill=$('#xpFill');
  if(t.done){if(label)label.textContent='✨ Garden collection complete';if(count)count.textContent='All treasures';if(fill)fill.style.width='100%'}
  else{if(label)label.textContent=`🎁 Next: ${t.next.label}`;if(count)count.textContent=`${t.doneWords} / 3 words`;if(fill)fill.style.width=`${t.pct}%`}
  const music=$('#musicToggle'),enabled=!!(state.settings.music&&state.settings.sound);if(music){music.textContent='♫';music.classList.toggle('off',!enabled);music.setAttribute('aria-label',enabled?'Mute music and sound effects':'Turn music and sound effects on');music.title=enabled?'Music + sound effects on':'Music + sound effects off'}
}
function setView""",
    'treasure topbar'
)

replace_once(
    "function setView(name){currentView=name;$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play'){if(session){if(session.count>=session.goal)finishSession();else renderTask()}else renderPlayHome()}if(name==='parent')renderParent();renderTopbar();syncBgm()}",
    "function setView(name){const changing=currentView!==name;currentView=name;if(changing&&audioUnlocked)playSfx('transition');$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play'){if(session){if(session.count>=session.goal)finishSession();else renderTask()}else renderPlayHome()}if(name==='parent')renderParent();renderTopbar();syncBgm()}",
    'view transition sound'
)
replace_once("state.garden.bunnySeated&&state.xp>=70", "state.garden.bunnySeated&&state.xp>=90", 'bench threshold consistency')

# Richer SFX palette, with a tap cooldown so delegated button feedback does not double-fire.
sub_once(
    r"function playSfx\(type\)\{.*?\n\}\nfunction scheduleBgmBar\(\)",
    """function playSfx(type){
  if(!state.settings.sound)return;try{const stamp=performance.now(),last=playSfx._last||{};playSfx._last=last;const cooldown=type==='tap'?75:type==='pickup'?90:0;if(cooldown&&stamp-(last[type]||0)<cooldown)return;last[type]=stamp;
    const ctx=ensureAudioCtx();if(!ctx)return;const now=ctx.currentTime+.008;let notes=[220,196],kind='triangle',gain=.032,step=.07,dur=.14;
    if(type==='tap'){notes=[740];kind='sine';gain=.021;dur=.065}
    if(type==='correct'){notes=[523,659];kind='sine';gain=.043;step=.07}
    if(type==='wrong'){notes=[247,196];kind='triangle';gain=.028;step=.085;dur=.13}
    if(type==='finish'){notes=[523,659,784,1047];kind='sine';gain=.052;step=.075;dur=.2}
    if(type==='level'||type==='unlock'){notes=[659,784,988,1319];kind='sine';gain=.052;step=.07;dur=.2}
    if(type==='start'){notes=[392,523,659,784];kind='sine';gain=.05;step=.065;dur=.17}
    if(type==='transition'){notes=[440,587];kind='sine';gain=.018;step=.065;dur=.08}
    if(type==='pickup'){notes=[392,523];kind='triangle';gain=.022;step=.045;dur=.075}
    if(type==='drop'){notes=[523,440];kind='triangle';gain=.024;step=.055;dur=.08}
    if(type==='store'){notes=[659,523,392];kind='sine';gain=.03;step=.055;dur=.105}
    if(type==='place'){notes=[392,523,659];kind='sine';gain=.032;step=.055;dur=.12}
    if(type==='seat'){notes=[330,440,523];kind='triangle';gain=.03;step=.065;dur=.13}
    if(type==='grow'){notes=[392,523,659,784];kind='sine';gain=.038;step=.065;dur=.16}
    if(type==='friend'){notes=[523,659,784];kind='sine';gain=.04;step=.065;dur=.15}
    if(type==='chirp'){notes=[1175,1568,1319];kind='sine';gain=.018;step=.05;dur=.09}
    if(type==='erase'){notes=[300,230];kind='triangle';gain=.02;step=.055;dur=.07}
    if(type==='hint'){notes=[659,784];kind='sine';gain=.025;step=.06;dur=.1}
    if(type==='peek'){notes=[784,659];kind='sine';gain=.024;step=.07;dur=.11}
    if(type==='sparkle'){notes=[784,988,1175];kind='sine';gain=.036;step=.055;dur=.14}
    notes.forEach((f,i)=>tone(ctx,f,now+i*step,dur,gain,kind));
  }catch{}
}
function scheduleBgmBar()""",
    'sfx palette'
)

# Soft BGM now continues in both Garden and Play, with a slightly calmer Play phrase.
sub_once(
    r"function scheduleBgmBar\(\)\{.*?function syncBgm\(\)\{.*?\}\n\n",
    """function scheduleBgmBar(){
  if(!audioUnlocked||!state.settings.music||bgmTimer===null)return;const ctx=ensureAudioCtx();if(!ctx||!musicGain)return;const now=ctx.currentTime+.05,isPlay=currentView==='play';
  const gardenPhrases=[[[659,0],[784,.82],[880,1.78],[784,3.15]],[[587,0],[659,.9],[784,1.95],[659,3.25]],[[659,0],[880,1.05],[988,2.2],[784,3.45]]];
  const playPhrases=[[[523,0],[659,1.12],[587,2.3],[659,3.65]],[[494,0],[587,1.08],[659,2.28],[587,3.62]],[[523,0],[587,1.14],[698,2.35],[659,3.68]]];
  const phrases=isPlay?playPhrases:gardenPhrases,phrase=phrases[Math.floor(Date.now()/5600)%phrases.length];phrase.forEach(([f,t],i)=>tone(ctx,f,now+t,.58,i===0?.0065:.005,'sine',musicGain));
  tone(ctx,isPlay?261.6:329.6,now+.18,1.05,isPlay?.0018:.0025,'sine',musicGain)
}
function startBgm(){
  if(!audioUnlocked||!state.settings.music||bgmTimer!==null||!['garden','play'].includes(currentView))return;const ctx=ensureAudioCtx();if(!ctx)return;musicGain=ctx.createGain();musicGain.gain.setValueAtTime(.0001,ctx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.2,ctx.currentTime+.5);musicGain.connect(ctx.destination);bgmTimer=setInterval(scheduleBgmBar,5600);scheduleBgmBar();renderTopbar()
}
function stopBgm(){
  if(bgmTimer!==null){clearInterval(bgmTimer);bgmTimer=null}if(musicGain&&audioCtx){try{musicGain.gain.cancelScheduledValues(audioCtx.currentTime);musicGain.gain.setValueAtTime(Math.max(.0001,musicGain.gain.value),audioCtx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.18)}catch{};const old=musicGain;setTimeout(()=>{try{old.disconnect()}catch{}},260)}musicGain=null;renderTopbar()
}
function syncBgm(){const should=state.settings.music&&['garden','play'].includes(currentView);if(should)startBgm();else stopBgm()}

""",
    'garden and play bgm'
)

# Play no longer shuts music off, and the in-play status shows treasure distance instead of XP.
replace_once("if(!session)return renderPlayHome();stopBgm();", "if(!session)return renderPlayHome();syncBgm();", 'play bgm')
replace_once("playSfx('start');stopBgm();session=", "playSfx('start');syncBgm();session=", 'session bgm')
replace_once('<div class="session-xp">+${session.xp} XP</div>', '<div class="session-xp">${treasureStatusText()}</div>', 'play treasure pill')

# Distinct success sounds and no child-facing XP language.
replace_once("for(let i=q.range.start;i<q.range.end;i++)l.weak[i]=Math.max(0,(l.weak[i]||0)-1);playSfx('correct');q.feedback={good:true};", "for(let i=q.range.start;i<q.range.end;i++)l.weak[i]=Math.max(0,(l.weak[i]||0)-1);playSfx(q.stage===4?'finish':'correct');q.feedback={good:true};", 'stage success sound')
replace_once('+${celebration.gain} XP · ${growthCopy}', 'Word complete · ${growthCopy}', 'garden reward copy')
replace_once('<span>＋${gain} XP</span><span>🌱 Garden grew</span>', '<span>🎁 Treasure progress +1</span><span>🌱 Garden grew</span>', 'legacy reward copy')
replace_once('<p class="muted">You earned ${earned} XP this session.</p><div class="reward-chips"><span>${doneCount} words complete</span><span>XP stays forever</span></div>', '<p class="muted">${doneCount} finished words made your garden grow.</p><div class="reward-chips"><span>${doneCount} words complete</span><span>🎁 Every 3 words unlocks a treasure</span></div>', 'finish session copy')
replace_once('<div><b>${state.xp}</b><span>Total XP</span></div>', '<div><b>${Math.floor(state.xp/30)}</b><span>Words completed</span></div>', 'parent progress stat')
s=s.replace('Keeps XP and the garden','Keeps garden progress')
s=s.replace('This resets XP, plant growth, item positions, and the Treasure Box.','This resets plant growth, treasure progress, item positions, and the Treasure Box.')

# Garden interactions get their own satisfying sounds.
replace_once("const token=Date.now();gardenInteraction={type,actor,token};playSfx(type==='friends'?'correct':'sparkle');", "const token=Date.now();gardenInteraction={type,actor,token};const sound={seat:'seat',picnic:'sparkle',mail:'sparkle',friends:'friend',birds:'chirp',seeds:'grow',arch:'sparkle',shed:'drop'}[type]||'sparkle';playSfx(sound);", 'garden reaction sounds')
replace_once("targetPlot.classList.add('growth-change');playSfx('sparkle')", "targetPlot.classList.add('growth-change');playSfx('grow')", 'growth sound')
# v16b reveal timing uses these exact lines.
replace_once("reveal.classList.add('show');playSfx('sparkle')", "reveal.classList.add('show');playSfx('unlock')", 'unlock sound')
replace_once("chest.classList.remove('treasure-catch');playSfx('sparkle');if(nextBtn)", "chest.classList.remove('treasure-catch');playSfx('store');if(nextBtn)", 'treasure store finish sound')

# Treasure Box buttons and drag/drop get pickup/place/store feedback.
s=s.replace("openTreasureChest();playSfx('tap')", "openTreasureChest();playSfx('store')", 1)
s=s.replace("openTreasureChest();playSfx('sparkle')", "openTreasureChest();playSfx('place')", 1)
replace_once("el.setPointerCapture?.(pid);el.classList.add('dragging')", "el.setPointerCapture?.(pid);el.classList.add('dragging');playSfx('pickup')", 'garden pickup sound')
replace_once("playSfx('sparkle');toast('Into the Treasure Box! ✦')", "playSfx('store');toast('Into the Treasure Box! ✦')", 'drag into treasure sound')
replace_once("state.garden.pos[id]=p;const reacted=reactToGardenDrop(id,p);save();\n    if(reacted", "state.garden.pos[id]=p;const reacted=reactToGardenDrop(id,p);save();if(!reacted)playSfx('drop');\n    if(reacted", 'garden drop sound')

# Hint/peek cues.
replace_once("function showHint(w,q){if(q.stage<3){playWordAudio", "function showHint(w,q){playSfx('hint');if(q.stage<3){playWordAudio", 'hint sound')
replace_once("function showPeek(w){w.learn.peeks++;", "function showPeek(w){playSfx('peek');w.learn.peeks++;", 'peek sound')

# Show the Pencil scratch-to-erase gesture as a real visible stroke while Miori slides.
sub_once(
    r"function startFilledBoxScratch\(e,index,w,q,input\)\{.*?\n\}\nfunction normalizeScribbleLetter",
    """function startFilledBoxScratch(e,index,w,q,input){
  const pointerId=e.pointerId,rect=input.getBoundingClientRect(),points=[];let finished=false;
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),line=document.createElementNS(ns,'polyline');svg.classList.add('scratch-trail');svg.setAttribute('viewBox',`0 0 ${Math.max(1,rect.width)} ${Math.max(1,rect.height)}`);svg.setAttribute('preserveAspectRatio','none');svg.appendChild(line);input.appendChild(svg);input.classList.add('scratch-active');
  const redraw=()=>{const visible=points.slice(-64).map(p=>`${(p.x-rect.left).toFixed(1)},${(p.y-rect.top).toFixed(1)}`).join(' ');line.setAttribute('points',visible)};
  const add=ev=>{const list=ev.getCoalescedEvents?.()||[ev];for(const p of list)points.push({x:p.clientX,y:p.clientY,t:performance.now()});redraw()};
  const endTrail=()=>{input.classList.remove('scratch-active');svg.style.opacity='0';setTimeout(()=>svg.remove(),120)};
  const cleanup=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',finish,true);window.removeEventListener('pointercancel',finish,true)};
  const move=ev=>{if(ev.pointerId!==pointerId)return;add(ev);ev.preventDefault()};
  const finish=ev=>{if(finished||ev.pointerId!==pointerId)return;finished=true;add(ev);cleanup();
    if(points.length<3){endTrail();return}
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,path=0,reversals=0,lastSign=0;
    for(let i=0;i<points.length;i++){const p=points[i];minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);if(i){const dx=p.x-points[i-1].x,dy=p.y-points[i-1].y;path+=Math.hypot(dx,dy);if(Math.abs(dx)>2){const sign=Math.sign(dx);if(lastSign&&sign!==lastSign)reversals++;lastSign=sign}}}
    const width=maxX-minX,height=maxY-minY,duration=points.at(-1).t-points[0].t;
    const looksScratch=duration<2200&&height<=rect.height*1.65&&width>=Math.max(10,rect.width*.12)&&(reversals>=1||path>=Math.max(28,width*1.65));
    if(looksScratch){playSfx('erase');endTrail();clearOneBox(index,w,q,false)}else endTrail()
  };
  input.blur();e.preventDefault();e.stopPropagation();add(e);window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',finish,true);window.addEventListener('pointercancel',finish,true)
}
function normalizeScribbleLetter""",
    'visible scratch trail'
)

# Master audio toggle, all buttons get a soft press sound, and iPad starts BGM on
# the first user gesture (required by Safari/WebAudio autoplay rules).
sub_once(
    r"function init\(\)\{.*?\n\}\nif\(document\.readyState==='loading'\)",
    """function init(){
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.nav)));
  document.addEventListener('click',e=>{const btn=e.target.closest?.('button');if(btn&&!btn.disabled&&btn.id!=='musicToggle')playSfx('tap')},true);
  $('#musicToggle')?.addEventListener('click',()=>{audioUnlocked=true;const on=!(state.settings.music&&state.settings.sound);state.settings.music=on;state.settings.sound=on;state.settings.audioDefaultV17=true;save();if(on){playSfx('sparkle');syncBgm()}else stopBgm()});
  document.addEventListener('pointerdown',()=>{audioUnlocked=true;ensureAudioCtx();syncBgm()},{once:true,capture:true});
  renderTopbar();loadVoices();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=loadVoices;setView('garden');for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}
}
if(document.readyState==='loading')""",
    'audio init'
)

p.write_text(s)
