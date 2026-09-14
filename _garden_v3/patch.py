from pathlib import Path
import re

APP = Path('app.js')
INDEX = Path('index.html')
CSS = Path('garden-delight-v3.css')

app = APP.read_text()
idx = INDEX.read_text()


def sub_once(pattern, repl, text, flags=0, label='pattern'):
    new, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'Expected one {label}, found {n}')
    return new

# 1) Make the reward collection feel more like a cute interactive world.
app = sub_once(
    r"const rewards=\[\n.*?\n\];",
    """const rewards=[
{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:51,y:64},
{id:'bench',xp:70,type:'treasure',label:'Cozy heart bench',icon:'🩷',x:25,y:72},
{id:'picnic',xp:140,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:70},
{id:'mail',xp:220,type:'treasure',label:'Heart mailbox',icon:'💌',x:17,y:55},
{id:'cat',xp:310,type:'friend',label:'Garden cat',icon:'🐱',x:69,y:62}
];""",
    app, re.S, 'rewards block'
)

app = app.replace("let gardenCelebration=null;", "let gardenCelebration=null;\nlet gardenInteraction=null;")

# 2) BGM becomes opt-in and the old preference is migrated once.
app = app.replace(
    "settings:{sound:true,music:true,voice:''}",
    "settings:{sound:true,music:false,musicV2:true,voice:''}"
)
app = app.replace(
    "s.settings=s.settings||{sound:true,music:true,voice:''};if(typeof s.settings.music!=='boolean')s.settings.music=true;",
    "s.settings=s.settings||{sound:true,music:false,musicV2:true,voice:''};if(typeof s.settings.music!=='boolean')s.settings.music=false;if(!s.settings.musicV2){s.settings.musicV2=true;s.settings.music=false;}"
)
app = app.replace(
    "music.title=state.settings.music?'Garden music on':'Garden music off'",
    "music.title=state.settings.music?'Soft garden ambience on':'Soft garden ambience off'"
)

# 3) Richer illustrated objects and a six-step plant.
app = sub_once(
    r"function plant\(stage\)\{.*?\}\nfunction gardenDefaultPos",
    r'''function plant(stage){return`<div class="plant p${stage}"><i class="stem"></i><i class="leaf"></i><i class="leaf r"></i><i class="bud"></i><i class="flower"></i><i class="flower mini"></i></div>`}
function benchSvg(){return`<svg viewBox="0 0 130 100" aria-hidden="true"><rect x="18" y="48" width="94" height="16" rx="8" fill="#c88f72"/><rect x="24" y="23" width="82" height="30" rx="14" fill="#f2c1d1" stroke="#fff7" stroke-width="4"/><rect x="28" y="60" width="10" height="30" rx="5" fill="#8e6b58"/><rect x="93" y="60" width="10" height="30" rx="5" fill="#8e6b58"/><path d="M65 31c-7-9-18-1-13 7 4 6 13 11 13 11s9-5 13-11c5-8-6-16-13-7z" fill="#fff1f5"/></svg>`}
function picnicSvg(){return`<svg viewBox="0 0 130 105" aria-hidden="true"><path d="M12 62h106l-13 34H25z" fill="#f7d6df"/><path d="M26 62l15 34M51 62l10 34M78 62l-8 34M102 62L88 96" stroke="#fff" stroke-width="5" opacity=".75"/><rect x="41" y="34" width="52" height="42" rx="12" fill="#c89467"/><path d="M50 39q15-30 34 0" fill="none" stroke="#9d6f4e" stroke-width="6" stroke-linecap="round"/><circle cx="48" cy="32" r="9" fill="#e96b78"/><circle cx="66" cy="28" r="9" fill="#ef7d86"/><circle cx="83" cy="34" r="9" fill="#e96776"/><path d="M45 23l4 8 5-8M63 19l4 8 5-8M80 25l4 8 5-8" stroke="#5f9567" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`}
function mailboxSvg(){return`<svg viewBox="0 0 120 125" aria-hidden="true"><rect x="53" y="69" width="13" height="48" rx="6" fill="#8c6b63"/><path d="M28 32q0-22 24-22h25q24 0 24 22v44H28z" fill="#e6a7bd" stroke="#fff8" stroke-width="4"/><path d="M28 38h73" stroke="#c7859d" stroke-width="4"/><rect x="39" y="43" width="51" height="26" rx="7" fill="#fff8ef"/><path d="M40 44l25 16 25-16" fill="none" stroke="#d39ab0" stroke-width="4"/><path d="M94 18v28" stroke="#9b6578" stroke-width="5" stroke-linecap="round"/><path d="M94 18h15l-5 10 5 10H94" fill="#f6d66f"/><path d="M64 19c-6-7-14-1-10 5 3 5 10 9 10 9s7-4 10-9c4-6-4-12-10-5z" fill="#fff2f6"/></svg>`}
function catSvg(){return`<svg viewBox="0 0 125 145" aria-hidden="true"><path d="M92 107q29-5 18-35" fill="none" stroke="#d9a273" stroke-width="12" stroke-linecap="round"/><ellipse cx="64" cy="105" rx="38" ry="31" fill="#f0bb8c"/><path d="M34 48l5-28 22 17M91 48l-5-28-22 17" fill="#e8ad7d"/><circle cx="63" cy="61" r="40" fill="#f2bd8e"/><path d="M41 58h10M76 58h10" stroke="#493f3e" stroke-width="5" stroke-linecap="round"/><path d="M58 70l5 4 5-4" fill="none" stroke="#9b6970" stroke-width="4" stroke-linecap="round"/><circle cx="39" cy="72" r="6" fill="#ef9fa7" opacity=".55"/><circle cx="87" cy="72" r="6" fill="#ef9fa7" opacity=".55"/><path d="M45 87q18 13 37 0" fill="none" stroke="#d99f74" stroke-width="5" stroke-linecap="round"/></svg>`}
function gardenObjectArt(r){if(r.id==='bunny')return rabbitSvg();if(r.id==='bench')return benchSvg();if(r.id==='picnic')return picnicSvg();if(r.id==='mail')return mailboxSvg();if(r.id==='cat')return catSvg();return r.icon||'✦'}
function gardenDefaultPos''',
    app, re.S, 'plant/object helpers'
)

# 4) Garden rendering: every completed word shows an actual shoot -> leaf -> bud -> bloom journey.
app = sub_once(
    r"function renderGarden\(\)\{.*?\n\}\nfunction makeDraggable",
    r'''function gardenUnlocked(id){const r=rewards.find(x=>x.id===id);return!!r&&state.xp>=r.xp}
function gardenDistance(a,b){return Math.hypot((a?.x??0)-(b?.x??0),(a?.y??0)-(b?.y??0))}
function triggerGardenInteraction(type,actor='bunny'){
  const token=Date.now();gardenInteraction={type,actor,token};playSfx(type==='friends'?'correct':'sparkle');
  setTimeout(()=>{if(gardenInteraction?.token===token){gardenInteraction=null;if(currentView==='garden'&&!gardenCelebration)renderGarden()}},2200)
}
function gardenReactionHtml(){
  if(!gardenInteraction)return'';const type=gardenInteraction.type;
  const data={seat:['bench','♡','Cozy!'],picnic:['picnic','🍓','Snack time!'],mail:['mail','💌','A letter!'],friends:['cat','♡','New friend!']}[type];if(!data)return'';
  const p=gardenPos(data[0]);return`<div class="garden-reaction ${type}" style="left:${p.x}%;top:${Math.max(12,p.y-14)}%"><span>${data[1]}</span><b>${data[2]}</b></div>`
}
function growthJourneyHtml(target){if(!target)return'';return`<div class="growth-journey ${target}"><i class="journey-stem"></i><i class="journey-leaf l"></i><i class="journey-leaf r"></i><i class="journey-bud"></i><i class="journey-bloom"></i></div>`}
function renderGarden(){
  const a=Math.min(5,Math.max(0,state.garden.growth));const b=Math.min(5,Math.max(0,state.garden.growth-5));
  const next=rewards.find(r=>state.xp<r.xp);const nextText=next?`${next.icon||'✦'} ${next.label} at ${next.xp} XP`:'✨ All current garden surprises unlocked!';
  const seatText=state.xp<70?'Keep growing — Bunny’s cozy bench is coming!':state.garden.bunnySeated?'🐰 Bunny is cozy on the bench ♡':'Drag Bunny to the bench, picnic, mailbox, or cat — each one reacts differently.';
  const celebration=gardenCelebration;const target=celebration?(celebration.growth<=5?'left':'right'):'';
  const rewardCard=celebration?`<div class="reward-garden-card"><div class="reward-emoji">${esc(celebration.emoji||'🌱')}</div><div class="copy"><b>${esc(celebration.word)} made the garden grow! ✦</b><span>+${celebration.gain} XP · Watch the shoot grow, then bloom.</span></div><button id="gardenNextWordBtn">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const burst=celebration?`<div class="growth-burst ${target}"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';
  $('#gardenView').innerHTML=`<div class="garden-view"><div class="garden-head"><div><p class="eyebrow">YOUR GARDEN</p><h1>Miori’s little spell world ✦</h1><p class="sub">${esc(state.week.title)} · ${state.garden.growth} growth moments</p></div><button class="primary-btn garden-play" id="gardenPlayBtn">${celebration?'Keep going ✦':'Play! ✦'}</button></div><div class="garden-scene ${celebration?'reward-moment':''}" id="gardenScene">${rewardCard}<div class="garden-update"><b>NEW ✦</b><span>Interactive treasures · visible plant growth · softer sound</span></div><div class="next-surprise">${esc(nextText)}</div><div class="garden-spark s1">✦</div><div class="garden-spark s2">✧</div><div class="garden-spark s3">✦</div><div class="garden-butterfly b1">🦋</div><div class="garden-butterfly b2">🦋</div><div class="sun"></div><div class="cloud a"></div><div class="cloud b"></div><div class="hill back"></div><div class="hill front"></div><div class="path"></div><div class="pond"></div><div class="plot left ${target==='left'?'growth-now':''}">${plant(a)}</div><div class="plot right ${target==='right'?'growth-now':''}">${plant(b)}</div>${growthJourneyHtml(target)}${burst}${gardenReactionHtml()}<div id="gardenObjects"></div><div class="garden-tip">${celebration?'🌱 Look — stem, leaves, bud, bloom!':seatText}</div></div></div>`;
  const continuePlay=()=>{playSfx('tap');gardenCelebration=null;setView('play')};
  $('#gardenPlayBtn').onclick=()=>celebration?continuePlay():(playSfx('tap'),setView('play'));
  $('#gardenNextWordBtn')?.addEventListener('click',continuePlay);
  const root=$('#gardenObjects');rewards.filter(r=>state.xp>=r.xp).forEach(r=>{const p=r.id==='bunny'?bunnyDisplayPos():gardenPos(r.id);const el=document.createElement('div');el.className=`garden-object ${r.type} ${r.id}${r.id==='bunny'&&state.garden.bunnySeated?' seated':''}`;el.dataset.id=r.id;el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;el.style.zIndex=r.id==='bunny'||r.id==='cat'?'18':'8';el.innerHTML=gardenObjectArt(r);root.appendChild(el);makeDraggable(el)});
  if(celebration){setTimeout(()=>playSfx('sparkle'),180)}
}
function makeDraggable''',
    app, re.S, 'renderGarden block'
)

# 5) Each special item gets its own interaction. Mailbox/picnic explicitly unseat Bunny.
app = sub_once(
    r"function makeDraggable\(el\)\{.*?\n\}\n\nfunction renderPlayHome",
    r'''function releaseBunnyHere(pos){if(state.garden.bunnySeated){state.garden.pos.bunny={x:pos.x,y:pos.y};state.garden.bunnySeated=false}}
function reactToGardenDrop(id,p){
  const bp=id==='bunny'?p:bunnyDisplayPos();
  if(id==='bunny'){
    state.garden.bunnySeated=false;
    const options=[['bench','seat',16],['picnic','picnic',17],['mail','mail',17],['cat','friends',16]].filter(([key])=>gardenUnlocked(key));
    const hit=options.map(x=>({x,d:gardenDistance(p,gardenPos(x[0]))})).filter(o=>o.d<o.x[2]).sort((a,b)=>a.d-b.d)[0];
    if(!hit)return false;const [key,type]=hit.x;
    if(type==='seat'){state.garden.bunnySeated=true;delete state.garden.pos.bunny}else state.garden.pos.bunny={x:p.x,y:p.y};
    triggerGardenInteraction(type,'bunny');return true
  }
  if(id==='bench'&&gardenUnlocked('bench')&&gardenDistance(p,bp)<16){releaseBunnyHere(bp);state.garden.bunnySeated=true;delete state.garden.pos.bunny;triggerGardenInteraction('seat','bunny');return true}
  if(id==='picnic'&&gardenUnlocked('picnic')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('picnic','bunny');return true}
  if(id==='mail'&&gardenUnlocked('mail')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('mail','bunny');return true}
  if(id==='cat'&&gardenUnlocked('cat')&&gardenDistance(p,bp)<16){triggerGardenInteraction('friends','bunny');return true}
  return false
}
function tapGardenObject(id){
  if(id==='picnic'){triggerGardenInteraction('picnic',id);renderGarden();return}
  if(id==='mail'){triggerGardenInteraction('mail',id);renderGarden();return}
  if(id==='cat'){triggerGardenInteraction('friends',id);renderGarden();return}
  if(id==='bench'&&state.garden.bunnySeated){triggerGardenInteraction('seat','bunny');renderGarden()}
}
function makeDraggable(el){
  let pid=null;const scene=$('#gardenScene');
  el.onpointerdown=e=>{pid=e.pointerId;el._p=null;el._start={x:e.clientX,y:e.clientY};el.setPointerCapture?.(pid);el.classList.add('dragging')};
  el.onpointermove=e=>{if(e.pointerId!==pid)return;const r=scene.getBoundingClientRect();const x=Math.max(4,Math.min(96,(e.clientX-r.left)/r.width*100));const y=Math.max(10,Math.min(91,(e.clientY-r.top)/r.height*100));el.style.left=`${x}%`;el.style.top=`${y}%`;el._p={x,y}};
  el.onpointerup=e=>{if(e.pointerId!==pid)return;el.classList.remove('dragging');const id=el.dataset.id,p=el._p,start=el._start;pid=null;
    if(!p||Math.hypot(e.clientX-(start?.x||e.clientX),e.clientY-(start?.y||e.clientY))<5){tapGardenObject(id);return}
    if(id==='bunny')state.garden.bunnySeated=false;
    state.garden.pos[id]=p;const reacted=reactToGardenDrop(id,p);save();
    if(reacted||id==='bench'||id==='picnic'||id==='mail'||id==='cat'||id==='bunny')renderGarden();
  }
}

function renderPlayHome''',
    app, re.S, 'makeDraggable block'
)

# 6) Store previous growth so the reward animation has a clean semantic transition.
app = app.replace(
    "const gain=30;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;",
    "const gain=30,beforeGrowth=state.garden.growth;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;"
)
app = app.replace(
    "gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,growth:state.garden.growth,finished};",
    "gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,beforeGrowth,growth:state.garden.growth,finished};"
)

# 7) Replace the old busy loop with sparse, gentle, opt-in garden ambience.
app = sub_once(
    r"function scheduleBgmBar\(\)\{.*?\n\}\nfunction startBgm\(\)\{.*?\n\}\nfunction stopBgm",
    r'''function scheduleBgmBar(){
  if(!audioUnlocked||!state.settings.music||bgmTimer===null)return;const ctx=ensureAudioCtx();if(!ctx||!musicGain)return;const now=ctx.currentTime+.05;
  const phrases=[[[659,0],[784,.82],[880,1.78],[784,3.15]],[[587,0],[659,.9],[784,1.95],[659,3.25]],[[659,0],[880,1.05],[988,2.2],[784,3.45]]];
  const phrase=phrases[Math.floor(Date.now()/5600)%phrases.length];phrase.forEach(([f,t],i)=>tone(ctx,f,now+t,.58,i===0?.008:.0065,'sine',musicGain));
  tone(ctx,329.6,now+.18,1.05,.0028,'sine',musicGain)
}
function startBgm(){
  if(!audioUnlocked||!state.settings.music||bgmTimer!==null||currentView!=='garden')return;const ctx=ensureAudioCtx();if(!ctx)return;musicGain=ctx.createGain();musicGain.gain.setValueAtTime(.0001,ctx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.22,ctx.currentTime+.5);musicGain.connect(ctx.destination);bgmTimer=setInterval(scheduleBgmBar,5600);scheduleBgmBar();renderTopbar()
}
function stopBgm''',
    app, re.S, 'BGM functions'
)
app = app.replace(
    "function syncBgm(){const should=state.settings.music&&(currentView==='garden'||(currentView==='play'&&!session));if(should)startBgm();else stopBgm()}",
    "function syncBgm(){const should=state.settings.music&&currentView==='garden';if(should)startBgm();else stopBgm()}"
)

# 8) New CSS layer and fresh cache tags.
css = r'''/* GARDEN_DELIGHT_V3_20260914 */
.garden-object svg{width:100%;height:100%;overflow:visible}
.garden-object.treasure{width:104px;height:92px;font-size:0}.garden-object.friend{width:102px;height:118px}.garden-object.cat{filter:drop-shadow(0 10px 8px #6f4d3526)}
.garden-object.bench{width:112px}.garden-object.picnic{width:114px}.garden-object.mail{width:98px;height:108px}
.garden-object.picnic:hover,.garden-object.mail:hover,.garden-object.cat:hover{transform:translate(-50%,-50%) scale(1.04)}
.garden-reaction{position:absolute;z-index:32;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;animation:reactionFloat 2s ease both}
.garden-reaction span{font-size:34px;filter:drop-shadow(0 6px 8px #57435325)}.garden-reaction b{font-size:11px;background:#fffdfbe8;border-radius:999px;padding:5px 9px;box-shadow:0 6px 16px #4f42521d}
.garden-reaction.mail span{animation:letterFly 1.4s cubic-bezier(.2,.9,.2,1) both}.garden-reaction.picnic span{animation:snackPop .75s ease both}.garden-reaction.friends span{animation:heartBeat .7s ease 2}
.growth-journey{position:absolute;z-index:18;bottom:15.5%;width:100px;height:132px;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 7px 8px #38593622)}
.growth-journey.left{left:23.5%}.growth-journey.right{left:51.5%}
.growth-journey .journey-stem{position:absolute;left:48%;bottom:0;width:8px;height:86px;border-radius:8px;background:#70a16f;transform-origin:bottom;animation:journeyStem 1.55s cubic-bezier(.18,.86,.25,1) both}
.growth-journey .journey-leaf{position:absolute;width:38px;height:20px;background:#8db58a;border-radius:100% 0 100% 0;bottom:38px;left:18px;transform-origin:100% 100%;animation:journeyLeaf .55s ease .48s both}.growth-journey .journey-leaf.r{left:49px;bottom:57px;transform:scaleX(-1);animation-delay:.68s}
.growth-journey .journey-bud{position:absolute;left:41px;top:27px;width:22px;height:25px;border-radius:50% 50% 45% 45%;background:#e8a9bf;transform-origin:50% 100%;animation:journeyBud .42s ease .82s both}
.growth-journey .journey-bloom{position:absolute;left:18px;top:1px;width:68px;height:68px;border-radius:50%;background:radial-gradient(circle,#f0d271 0 22%,transparent 24%),conic-gradient(#efb8cc 0 12.5%,#f9dbe5 0 25%,#efb8cc 0 37.5%,#f9dbe5 0 50%,#efb8cc 0 62.5%,#f9dbe5 0 75%,#efb8cc 0 87.5%,#f9dbe5 0);transform-origin:50% 70%;animation:journeyBloom .72s cubic-bezier(.15,.9,.2,1.2) 1.05s both}
.plant .bud{position:absolute;left:41px;top:23px;width:22px;height:26px;border-radius:50%;background:#e7a9bf}.plant .flower.mini{width:32px;height:32px;left:74px;top:35px;background:radial-gradient(circle,#f0d271 0 20%,transparent 23%),conic-gradient(#eeb7ca 0 25%,#f8dce5 0 50%,#eeb7ca 0 75%,#f8dce5 0)}
.plant.p0 .stem,.plant.p0 .leaf,.plant.p0 .bud,.plant.p0 .flower{display:none}.plant.p1 .bud,.plant.p1 .flower{display:none}.plant.p1 .stem{height:26px}.plant.p1 .leaf{bottom:13px;transform:scale(.52) rotate(15deg)}.plant.p1 .leaf.r{display:none}.plant.p2 .bud,.plant.p2 .flower{display:none}.plant.p2 .stem{height:50px}.plant.p2 .leaf{transform:scale(.8) rotate(15deg)}.plant.p2 .leaf.r{transform:scaleX(-1) scale(.7) rotate(15deg)}.plant.p3 .flower{display:none}.plant.p3 .stem{height:76px}.plant.p4 .flower.mini{display:none}.plant.p4 .flower:not(.mini){transform:scale(.48);transform-origin:50% 75%;top:14px}.plant.p4 .bud{display:none}.plant.p5 .bud{display:none}.plant.p5 .flower{display:block}
.plot.growth-now .stem{animation:stemShoot 1.25s cubic-bezier(.18,.86,.25,1) both;transform-origin:bottom}.plot.growth-now .leaf{animation:leafUnfold .65s ease .42s both}.plot.growth-now .flower{animation:bloomOpen .7s cubic-bezier(.15,.9,.2,1.2) .75s both}.plot.growth-now .flower.mini{animation-delay:1.02s}
.reward-garden-card button{animation-delay:1.15s}
@keyframes journeyStem{0%{transform:scaleY(.05);opacity:.25}60%{opacity:1}100%{transform:scaleY(1);opacity:1}}@keyframes journeyLeaf{from{opacity:0;scale:.15;rotate:-35deg}to{opacity:1;scale:1;rotate:0deg}}@keyframes journeyBud{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}@keyframes journeyBloom{0%{opacity:0;transform:scale(.08) rotate(-18deg)}60%{opacity:1;transform:scale(1.12) rotate(3deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes stemShoot{from{scale:1 .42}to{scale:1 1}}@keyframes leafUnfold{from{opacity:.2;scale:.35}to{opacity:1;scale:1}}@keyframes bloomOpen{0%{opacity:.15;scale:.18;rotate:-10deg}70%{opacity:1;scale:1.14;rotate:3deg}100%{opacity:1;scale:1;rotate:0}}
@keyframes reactionFloat{0%{opacity:0;translate:0 12px;scale:.8}15%,72%{opacity:1;translate:0 0;scale:1}100%{opacity:0;translate:0 -18px;scale:.96}}@keyframes letterFly{0%{transform:translateY(28px) rotate(-10deg);opacity:0}45%{opacity:1}100%{transform:translateY(-16px) rotate(8deg);opacity:1}}@keyframes snackPop{0%{scale:.2;rotate:-15deg}70%{scale:1.18;rotate:5deg}100%{scale:1}}@keyframes heartBeat{50%{scale:1.3}}
@media(max-width:700px){.garden-object.bench,.garden-object.picnic{width:86px}.garden-object.mail{width:76px;height:84px}.garden-object.cat{width:82px;height:96px}.growth-journey{scale:.8;transform-origin:50% 100%}}
'''
CSS.write_text(css)

if 'garden-delight-v3.css' not in idx:
    idx = idx.replace('</head>', '  <link rel="stylesheet" href="garden-delight-v3.css?v=20260914-garden-v3">\n</head>')
idx = re.sub(r'app\.js\?v=[^\"]+', 'app.js?v=20260914-garden-v3', idx, count=1)

APP.write_text(app)
INDEX.write_text(idx)

# Guardrails for CI.
checks = [
    "id:'picnic'", 'function picnicSvg()', 'function gardenReactionHtml()',
    'function growthJourneyHtml', 'Soft garden ambience on', 'beforeGrowth',
    'const phrases=[', 'garden-delight-v3.css'
]
for marker in checks:
    hay = app if marker != 'garden-delight-v3.css' else idx
    if marker not in hay:
        raise SystemExit(f'Missing marker: {marker}')
print('garden delight v3 patch applied')
