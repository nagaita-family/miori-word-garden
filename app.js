(()=>{
'use strict';
const STORAGE_KEY='mwg-v2-rebuild';
const LEVEL_XP=100;
const GOAL=10;
const STAGE_NAMES=['','Listen & Choose','Fill the Gap','Write the Gap','Full Spelling'];
const STAGE_PROMPTS=['','Listen. Which spelling is right?','Which letters fit here?','Write the missing part.','Write the whole word.'];
const CONF={b:['p','d'],p:['b','d'],d:['b','t'],e:['i','a'],i:['e','y'],y:['i','e'],c:['k','s'],k:['c','g'],s:['c','z'],t:['d','f'],a:['e','o'],o:['a','u'],u:['o','a'],l:['r','i'],r:['l','n'],g:['j','c'],h:['w','n']};
const SCHOOL_WORDS=[
{word:'beetle',meaningEn:'an insect with hard wings and a shiny body',meaningJa:'甲虫（硬い羽と光沢のある体をもつ昆虫）',example:'A shiny beetle crawled across the leaf.',phonicsFocus:'ee',pictureCue:'a tiny shiny bug on a green leaf',pictureEmoji:'🪲'},
{word:'butterfly',meaningEn:'an insect with big beautiful wings',meaningJa:'チョウ',example:'A butterfly opened its colorful wings in the garden.',phonicsFocus:'er',pictureCue:'big colorful wings above a flower',pictureEmoji:'🦋'},
{word:'cricket',meaningEn:'a small, brown insect that jumps and makes a loud noise',meaningJa:'コオロギ',example:'We heard a cricket chirping near the grass.',phonicsFocus:'ck',pictureCue:'a small brown jumping insect in the grass',pictureEmoji:'🦗'},
{word:'grasshopper',meaningEn:'a green insect that can jump high in the air',meaningJa:'バッタ',example:'The grasshopper jumped high over the grass.',phonicsFocus:'pp',pictureCue:'a green jumping insect springing over tall grass',pictureEmoji:'🦗'},
{word:'honeybee',meaningEn:'a black and yellow insect that flies makes honey and can sting',meaningJa:'ミツバチ',example:'A honeybee flew from flower to flower.',phonicsFocus:'ey',pictureCue:'a black-and-yellow bee beside a honey pot and flowers',pictureEmoji:'🐝'},
{word:'insect',meaningEn:'a small animal with 6 legs',meaningJa:'昆虫',example:'An insect has six legs.',phonicsFocus:'in',pictureCue:'a tiny six-legged creature under a magnifying glass',pictureEmoji:'🔎'},
{word:'ladybug',meaningEn:'a small red insect with black spots on the shell',meaningJa:'テントウムシ',example:'A ladybug landed on my hand.',phonicsFocus:'dy',pictureCue:'a small red bug with round black spots on a leaf',pictureEmoji:'🐞'},
{word:'raisin',meaningEn:'a dried grape',meaningJa:'レーズン、干しぶどう',example:'I found a raisin in my cereal.',phonicsFocus:'ai',pictureCue:'a few wrinkly dried grapes beside fresh purple grapes',pictureEmoji:'🍇'},
{word:'riding',meaningEn:'on a bike, in a car, or other way to move right now',meaningJa:'乗り物などに乗って移動していること',example:'She is riding her bike to the park.',phonicsFocus:'i',pictureCue:'a child moving along on a bicycle',pictureEmoji:'🚲'},
{word:'thicket',meaningEn:'a group of bushes or small trees growing closely together',meaningJa:'やぶ、茂み',example:'A little bird hid inside the thicket.',phonicsFocus:'ck',pictureCue:'a dense cluster of bushes and small trees',pictureEmoji:'🌿'}
];
const WORD_CHUNKS={
  beetle:['bee','tle'],
  butterfly:['butter','fly'],
  cricket:['crick','et'],
  grasshopper:['grass','hopper'],
  honeybee:['honey','bee'],
  insect:['in','sect'],
  ladybug:['lady','bug'],
  raisin:['rai','sin'],
  riding:['rid','ing'],
  thicket:['thick','et']
};
const rewards=[
{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:50,y:66},
{id:'bench',xp:70,type:'treasure',label:'Cozy garden bench',icon:'🩷',x:25,y:73},
{id:'picnic',xp:140,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:72},
{id:'mail',xp:220,type:'treasure',label:'Heart mailbox',icon:'💌',x:17,y:57},
{id:'cat',xp:310,type:'friend',label:'Garden cat',icon:'🐱',x:69,y:64},
{id:'birdbath',xp:400,type:'treasure',label:'Bird bath',icon:'🐦',x:85,y:51},
{id:'seedcrate',xp:500,type:'treasure',label:'Seed crate',icon:'🌼',x:34,y:61},
{id:'arch',xp:620,type:'treasure',label:'Flower arch',icon:'🌸',x:57,y:51},
{id:'shed',xp:760,type:'treasure',label:'Little garden shed',icon:'🏡',x:90,y:34}
];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s??'').toLowerCase().replace(/[^a-z]/g,'');
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>new Date().toISOString().slice(0,10);
let voices=[];
let currentView='garden';
let session=null;
let helpKind='';
let currentAudio=null;
let toastTimer=null;
let focusTimer=null;
let audioCtx=null;
let musicGain=null;
let bgmTimer=null;
let audioUnlocked=false;
let gardenCelebration=null;
let gardenInteraction=null;

function learning(word){return{attempts:0,correct:0,first:0,mistakes:0,stageMist:{1:0,2:0,3:0,4:0},weak:Array(word.length).fill(0),lastWrong:'',last:'',hints:0,peeks:0,loops:0}}
function defaultState(){return{version:3,xp:0,week:{id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids:[]},lib:{},garden:{growth:0,pos:{},bunnySeated:false,stored:[]},settings:{sound:true,music:false,musicV2:true,voice:''},stats:{answers:0,sessions:0}}}
function emojiFor(word){return({beetle:'🪲',butterfly:'🦋',cricket:'🦗',grasshopper:'🦗',honeybee:'🐝',insect:'🔎',ladybug:'🐞',raisin:'🍇',riding:'🚲',thicket:'🌿'})[word]||'✦'}
function normalizeWord(raw={},old=null){
  const word=norm(raw.word||old?.word||'');
  const learn=old?.learn||raw.learn||learning(word);
  learn.stageMist=learn.stageMist||{1:0,2:0,3:0,4:0};
  learn.weak=Array.isArray(learn.weak)?learn.weak:Array(word.length).fill(0);
  while(learn.weak.length<word.length)learn.weak.push(0);
  learn.hints=learn.hints||0;learn.peeks=learn.peeks||0;learn.loops=learn.loops||0;
  return{id:word,word,
    meaningEn:raw.meaningEn??old?.meaningEn??'',meaningJa:raw.meaningJa??old?.meaningJa??'',example:raw.example??old?.example??'',
    phonicsFocus:norm(raw.phonicsFocus??old?.phonicsFocus??''),pictureCue:raw.pictureCue??old?.pictureCue??'',pictureEmoji:raw.pictureEmoji??old?.pictureEmoji??emojiFor(word),
    mioriSpelling:norm(raw.mioriSpelling??old?.mioriSpelling??''),pronunciationUrl:raw.pronunciationUrl??old?.pronunciationUrl??'',
    pronunciationSource:raw.pronunciationSource??old?.pronunciationSource??'',audioTried:old?.audioTried||raw.audioTried||false,learn};
}
function seedSchoolWords(s){
  const ids=[];
  for(const raw of SCHOOL_WORDS){const existing=s.lib?.[raw.word];const w=normalizeWord(raw,existing);s.lib[w.id]=w;ids.push(w.id)}
  if(!s.week?.ids?.length)s.week={id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids};
}
function loadState(){
  let s;try{s=JSON.parse(localStorage.getItem(STORAGE_KEY))}catch{}
  if(!s)s=defaultState();
  if(s.version===2){s.version=3;s.stats=s.stats||{answers:0,sessions:0};s.settings=s.settings||{sound:true,voice:''};s.garden=s.garden||{growth:0,pos:{}};s.week=s.week||{id:'',title:'This Week',ids:[]};const next={};for(const [id,w] of Object.entries(s.lib||{})){const n=normalizeWord(w,w);next[n.id||id]=n}s.lib=next}
  if(s.version!==3)s={...defaultState(),...s,version:3};
  s.lib=s.lib||{};s.stats=s.stats||{answers:0,sessions:0};s.garden=s.garden||{growth:0,pos:{},bunnySeated:false,stored:[]};s.garden.pos=s.garden.pos||{};if(typeof s.garden.bunnySeated!=='boolean')s.garden.bunnySeated=false;if(!Array.isArray(s.garden.stored))s.garden.stored=[];s.settings=s.settings||{sound:true,music:false,musicV2:true,voice:''};if(typeof s.settings.music!=='boolean')s.settings.music=false;if(!s.settings.musicV2){s.settings.musicV2=true;s.settings.music=false;}
  seedSchoolWords(s);localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s;
}
let state=loadState();
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderTopbar()}
function renderTopbar(){
  const level=Math.floor(state.xp/LEVEL_XP)+1,p=state.xp%LEVEL_XP;
  $('#levelLabel').textContent=`Level ${level}`;$('#xpLabel').textContent=`${p} / ${LEVEL_XP} XP`;$('#xpFill').style.width=`${p}%`;
  const music=$('#musicToggle');if(music){music.textContent=state.settings.music?'♫':'♪';music.classList.toggle('off',!state.settings.music);music.setAttribute('aria-label',state.settings.music?'Turn garden music off':'Turn garden music on');music.title=state.settings.music?'Soft garden ambience on':'Soft garden ambience off'}
}
function setView(name){currentView=name;$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play'){if(session){if(session.count>=session.goal)finishSession();else renderTask()}else renderPlayHome()}if(name==='parent')renderParent();renderTopbar();syncBgm()}

function rabbitSvg(){return`<svg viewBox="0 0 130 150"><ellipse cx="43" cy="38" rx="18" ry="42" fill="#f8eee9" transform="rotate(-16 43 38)"/><ellipse cx="87" cy="38" rx="18" ry="42" fill="#f8eee9" transform="rotate(16 87 38)"/><ellipse cx="43" cy="38" rx="7" ry="28" fill="#efc1cb" transform="rotate(-16 43 38)"/><ellipse cx="87" cy="38" rx="7" ry="28" fill="#efc1cb" transform="rotate(16 87 38)"/><ellipse cx="65" cy="84" rx="48" ry="43" fill="#fffaf5"/><ellipse cx="65" cy="124" rx="35" ry="23" fill="#fffaf5"/><circle cx="48" cy="80" r="5" fill="#493f3e"/><circle cx="82" cy="80" r="5" fill="#493f3e"/><ellipse cx="65" cy="94" rx="6" ry="4" fill="#db9299"/><path d="M65 98q-8 10-15 1M65 98q8 10 15 1" fill="none" stroke="#6d5750" stroke-width="3" stroke-linecap="round"/><circle cx="36" cy="96" r="8" fill="#f5d8da"/><circle cx="94" cy="96" r="8" fill="#f5d8da"/></svg>`}
function plant(stage){return`<div class="plant p${stage}"><i class="stem"></i><i class="leaf"></i><i class="leaf r"></i><i class="bud"></i><i class="flower"></i><i class="flower mini"></i></div>`}
function benchSvg(){return`<svg viewBox="0 0 130 100" aria-hidden="true"><rect x="18" y="48" width="94" height="16" rx="8" fill="#c88f72"/><rect x="24" y="23" width="82" height="30" rx="14" fill="#f2c1d1" stroke="#fff7" stroke-width="4"/><rect x="28" y="60" width="10" height="30" rx="5" fill="#8e6b58"/><rect x="93" y="60" width="10" height="30" rx="5" fill="#8e6b58"/><path d="M65 31c-7-9-18-1-13 7 4 6 13 11 13 11s9-5 13-11c5-8-6-16-13-7z" fill="#fff1f5"/></svg>`}
function picnicSvg(){return`<svg viewBox="0 0 130 105" aria-hidden="true"><path d="M12 62h106l-13 34H25z" fill="#f7d6df"/><path d="M26 62l15 34M51 62l10 34M78 62l-8 34M102 62L88 96" stroke="#fff" stroke-width="5" opacity=".75"/><rect x="41" y="34" width="52" height="42" rx="12" fill="#c89467"/><path d="M50 39q15-30 34 0" fill="none" stroke="#9d6f4e" stroke-width="6" stroke-linecap="round"/><circle cx="48" cy="32" r="9" fill="#e96b78"/><circle cx="66" cy="28" r="9" fill="#ef7d86"/><circle cx="83" cy="34" r="9" fill="#e96776"/><path d="M45 23l4 8 5-8M63 19l4 8 5-8M80 25l4 8 5-8" stroke="#5f9567" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`}
function mailboxSvg(){return`<svg viewBox="0 0 120 125" aria-hidden="true"><rect x="53" y="69" width="13" height="48" rx="6" fill="#8c6b63"/><path d="M28 32q0-22 24-22h25q24 0 24 22v44H28z" fill="#e6a7bd" stroke="#fff8" stroke-width="4"/><path d="M28 38h73" stroke="#c7859d" stroke-width="4"/><rect x="39" y="43" width="51" height="26" rx="7" fill="#fff8ef"/><path d="M40 44l25 16 25-16" fill="none" stroke="#d39ab0" stroke-width="4"/><path d="M94 18v28" stroke="#9b6578" stroke-width="5" stroke-linecap="round"/><path d="M94 18h15l-5 10 5 10H94" fill="#f6d66f"/><path d="M64 19c-6-7-14-1-10 5 3 5 10 9 10 9s7-4 10-9c4-6-4-12-10-5z" fill="#fff2f6"/></svg>`}
function catSvg(){return`<svg viewBox="0 0 125 145" aria-hidden="true"><path d="M92 107q29-5 18-35" fill="none" stroke="#d9a273" stroke-width="12" stroke-linecap="round"/><ellipse cx="64" cy="105" rx="38" ry="31" fill="#f0bb8c"/><path d="M34 48l5-28 22 17M91 48l-5-28-22 17" fill="#e8ad7d"/><circle cx="63" cy="61" r="40" fill="#f2bd8e"/><path d="M41 58h10M76 58h10" stroke="#493f3e" stroke-width="5" stroke-linecap="round"/><path d="M58 70l5 4 5-4" fill="none" stroke="#9b6970" stroke-width="4" stroke-linecap="round"/><circle cx="39" cy="72" r="6" fill="#ef9fa7" opacity=".55"/><circle cx="87" cy="72" r="6" fill="#ef9fa7" opacity=".55"/><path d="M45 87q18 13 37 0" fill="none" stroke="#d99f74" stroke-width="5" stroke-linecap="round"/></svg>`}
function birdBathSvg(){return`<svg viewBox="0 0 130 135" aria-hidden="true"><ellipse cx="65" cy="40" rx="48" ry="14" fill="#d7e3e5" stroke="#aabfc4" stroke-width="4"/><path d="M22 39q43 28 86 0" fill="#b9d7dc"/><rect x="58" y="48" width="14" height="58" rx="7" fill="#d8ddcf"/><ellipse cx="65" cy="112" rx="34" ry="10" fill="#c9cfbf"/><path d="M78 27q11-12 25-2-8 3-12 11-5-1-13-9z" fill="#5f8fb5"/><circle cx="98" cy="25" r="2.5" fill="#34363b"/><path d="M105 25l10 3-10 3z" fill="#e8a73d"/></svg>`}
function seedCrateSvg(){return`<svg viewBox="0 0 140 112" aria-hidden="true"><rect x="20" y="48" width="100" height="49" rx="8" fill="#c48b58" stroke="#9d6f47" stroke-width="4"/><path d="M27 61h86M27 79h86" stroke="#e5bb8f" stroke-width="5"/><rect x="35" y="29" width="26" height="36" rx="4" fill="#f7e7b7" transform="rotate(-8 48 47)"/><rect x="72" y="24" width="28" height="39" rx="4" fill="#dfe9c9" transform="rotate(8 86 44)"/><circle cx="48" cy="44" r="7" fill="#ef8a7e"/><path d="M86 35v17M78 44h16" stroke="#6e9b62" stroke-width="4" stroke-linecap="round"/><path d="M112 34l7-13M110 37l15-4" stroke="#8a6b54" stroke-width="5" stroke-linecap="round"/></svg>`}
function flowerArchSvg(){return`<svg viewBox="0 0 145 150" aria-hidden="true"><path d="M28 137V68q0-50 45-50t45 50v69" fill="none" stroke="#eef0e7" stroke-width="12" stroke-linecap="round"/><path d="M38 137V70q0-38 35-38t35 38v67" fill="none" stroke="#8daf7c" stroke-width="8" stroke-linecap="round"/><g fill="#ef8e91"><circle cx="39" cy="54" r="10"/><circle cx="57" cy="31" r="10"/><circle cx="84" cy="28" r="10"/><circle cx="106" cy="48" r="10"/></g><g fill="#f7c95f"><circle cx="33" cy="78" r="7"/><circle cx="73" cy="20" r="7"/><circle cx="113" cy="72" r="7"/></g></svg>`}
function gardenShedSvg(){return`<svg viewBox="0 0 150 135" aria-hidden="true"><path d="M20 57h110v68H20z" fill="#fff8ea" stroke="#d8c8b4" stroke-width="4"/><path d="M10 59L75 18l65 41z" fill="#c87855" stroke="#aa6448" stroke-width="4"/><rect x="62" y="75" width="30" height="50" rx="4" fill="#7f9f87"/><rect x="31" y="72" width="22" height="22" rx="4" fill="#b9d8e7" stroke="#fff" stroke-width="4"/><path d="M42 72v22M31 83h22" stroke="#fff" stroke-width="3"/><circle cx="85" cy="99" r="3" fill="#f2cc5b"/></svg>`}
function gardenObjectArt(r){if(r.id==='bunny')return rabbitSvg();if(r.id==='bench')return benchSvg();if(r.id==='picnic')return picnicSvg();if(r.id==='mail')return mailboxSvg();if(r.id==='cat')return catSvg();if(r.id==='birdbath')return birdBathSvg();if(r.id==='seedcrate')return seedCrateSvg();if(r.id==='arch')return flowerArchSvg();if(r.id==='shed')return gardenShedSvg();return r.icon||'✦'}
function gardenDefaultPos(id){const r=rewards.find(x=>x.id===id);return{x:r?.x??50,y:r?.y??60}}
function gardenPos(id){return state.garden.pos[id]||gardenDefaultPos(id)}
function bunnyDisplayPos(){const bench=gardenPos('bench');return state.garden.bunnySeated&&state.xp>=70?{x:bench.x,y:bench.y-8}:gardenPos('bunny')}
function gardenUnlocked(id){const r=rewards.find(x=>x.id===id);return!!r&&state.xp>=r.xp}
function gardenDistance(a,b){return Math.hypot((a?.x??0)-(b?.x??0),(a?.y??0)-(b?.y??0))}
function triggerGardenInteraction(type,actor='bunny'){
  const token=Date.now();gardenInteraction={type,actor,token};playSfx(type==='friends'?'correct':'sparkle');
  setTimeout(()=>{if(gardenInteraction?.token===token){gardenInteraction=null;if(currentView==='garden'&&!gardenCelebration)renderGarden()}},2200)
}
function gardenReactionHtml(){
  if(!gardenInteraction)return'';const type=gardenInteraction.type;
  const data={seat:['bench','♡','Cozy!'],picnic:['picnic','🍓','Snack time!'],mail:['mail','💌','A letter!'],friends:['cat','♡','New friend!'],birds:['birdbath','🐦','Bird visitors!'],seeds:['seedcrate','🌼','Planting time!'],arch:['arch','✦','Pretty!'],shed:['shed','🧤','Garden tools!']}[type];if(!data)return'';
  const p=gardenPos(data[0]);return`<div class="garden-reaction ${type}" style="left:${p.x}%;top:${Math.max(12,p.y-14)}%"><span>${data[1]}</span><b>${data[2]}</b></div>`
}
function growthJourneyHtml(target){if(!target)return'';return`<div class="growth-journey ${target}"><i class="journey-stem"></i><i class="journey-leaf l"></i><i class="journey-leaf r"></i><i class="journey-bud"></i><i class="journey-bloom"></i></div>`}
function renderGarden(){
  const a=Math.min(5,Math.max(0,state.garden.growth));const b=Math.min(5,Math.max(0,state.garden.growth-5));
  const next=rewards.find(r=>state.xp<r.xp);const nextText=next?`${next.icon||'✦'} ${next.label} at ${next.xp} XP`:'✨ All current garden surprises unlocked!';
  const seatText=state.xp<70?'Keep growing — Bunny’s cozy bench is coming!':state.garden.bunnySeated?'🐰 Bunny is cozy on the bench ♡':'Drag Bunny around the backyard — every special spot has its own little reaction.';
  const celebration=gardenCelebration;const target=celebration?(celebration.growth<=5?'left':'right'):'';const storedCount=(state.garden.stored||[]).length;const unlockedTreasureCount=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp).length;
  const rewardCard=celebration?`<div class="reward-garden-card"><div class="reward-emoji">${esc(celebration.emoji||'🌱')}</div><div class="copy"><b>${esc(celebration.word)} made the garden grow! ✦</b><span>+${celebration.gain} XP · Watch the shoot grow, then bloom.</span></div><button id="gardenNextWordBtn">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const burst=celebration?`<div class="growth-burst ${target}"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';
  $('#gardenView').innerHTML=`<div class="garden-view"><div class="garden-head"><div><p class="eyebrow">YOUR GARDEN</p><h1>Miori’s little spell world ✦</h1><p class="sub">${esc(state.week.title)} · ${state.garden.growth} growth moments</p></div><div class="garden-head-actions"><button class="secondary-btn treasure-open" id="treasureChestBtn">🧺 Treasure Box <span>${storedCount}/${unlockedTreasureCount}</span></button><button class="primary-btn garden-play" id="gardenPlayBtn">${celebration?'Keep going ✦':'Play! ✦'}</button></div></div><div class="garden-scene ${celebration?'reward-moment':''}" id="gardenScene">${rewardCard}<div class="garden-update"><b>NEW ✦</b><span>Sunny backyard edition · collect, decorate, and grow</span></div><div class="next-surprise">${esc(nextText)}</div><div class="garden-spark s1">✦</div><div class="garden-spark s2">✧</div><div class="garden-spark s3">✦</div><div class="garden-butterfly b1">🦋</div><div class="garden-butterfly b2">🦋</div><div class="sun"></div><div class="cloud a"></div><div class="cloud b"></div><div class="hill back"></div><div class="hill front"></div><div class="ca-house"></div><div class="white-fence"></div><div class="citrus-tree"></div><div class="patio-lights"></div><div class="lavender-edge left"></div><div class="lavender-edge right"></div><div class="path"></div><div class="pond"></div><div class="plot left ${target==='left'?'growth-now':''}">${plant(a)}</div><div class="plot right ${target==='right'?'growth-now':''}">${plant(b)}</div>${growthJourneyHtml(target)}${burst}${gardenReactionHtml()}<div id="gardenObjects"></div><div class="garden-tip">${celebration?'🌱 Look — stem, leaves, bud, bloom!':seatText}</div></div></div>`;
  const continuePlay=()=>{playSfx('tap');gardenCelebration=null;setView('play')};
  $('#gardenPlayBtn').onclick=()=>celebration?continuePlay():(playSfx('tap'),setView('play'));$('#treasureChestBtn')?.addEventListener('click',()=>{playSfx('tap');openTreasureChest()});
  $('#gardenNextWordBtn')?.addEventListener('click',continuePlay);
  const root=$('#gardenObjects');rewards.filter(r=>state.xp>=r.xp&&!(state.garden.stored||[]).includes(r.id)).forEach(r=>{const p=r.id==='bunny'?bunnyDisplayPos():gardenPos(r.id);const el=document.createElement('div');el.className=`garden-object ${r.type} ${r.id}${r.id==='bunny'&&state.garden.bunnySeated?' seated':''}`;el.dataset.id=r.id;el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;el.style.zIndex=r.id==='bunny'||r.id==='cat'?'18':'8';el.innerHTML=gardenObjectArt(r);root.appendChild(el);makeDraggable(el)});
  if(celebration){setTimeout(()=>playSfx('sparkle'),180)}
}
function openTreasureChest(){
  const unlocked=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp);const stored=state.garden.stored||[];
  const cards=unlocked.length?unlocked.map(r=>{const away=stored.includes(r.id);return`<div class="treasure-card ${away?'stored':''}" data-treasure="${r.id}"><div class="treasure-art">${gardenObjectArt(r)}</div><div class="treasure-copy"><b>${esc(r.label)}</b><span>${away?'In Treasure Box':'In the garden'}</span></div><button class="${away?'place-item':'store-item'}" data-id="${r.id}">${away?'Place in garden':'Put away'}</button></div>`}).join(''):`<div class="treasure-empty">Keep spelling — your first garden treasure will unlock soon ✦</div>`;
  $('#modalRoot').innerHTML=`<div class="modal treasure-modal"><div class="modal-card treasure-panel"><div class="modal-head"><div><p class="eyebrow">MY COLLECTION</p><h2>🧺 Treasure Box</h2><p>Keep special items here, then bring them back whenever you want.</p></div><button id="closeTreasure" class="icon-btn">×</button></div><div class="treasure-grid">${cards}</div></div></div>`;
  $('#closeTreasure').onclick=()=>$('#modalRoot').innerHTML='';
  $$('.store-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();openTreasureChest();playSfx('tap')});
  $$('.place-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;state.garden.stored=state.garden.stored.filter(x=>x!==id);if(!state.garden.pos[id])state.garden.pos[id]=gardenDefaultPos(id);save();renderGarden();openTreasureChest();playSfx('sparkle')});
}

function releaseBunnyHere(pos){if(state.garden.bunnySeated){state.garden.pos.bunny={x:pos.x,y:pos.y};state.garden.bunnySeated=false}}
function reactToGardenDrop(id,p){
  const bp=id==='bunny'?p:bunnyDisplayPos();
  if(id==='bunny'){
    state.garden.bunnySeated=false;
    const options=[['bench','seat',16],['picnic','picnic',17],['mail','mail',17],['cat','friends',16],['birdbath','birds',16],['seedcrate','seeds',16],['arch','arch',18],['shed','shed',17]].filter(([key])=>gardenUnlocked(key));
    const hit=options.map(x=>({x,d:gardenDistance(p,gardenPos(x[0]))})).filter(o=>o.d<o.x[2]).sort((a,b)=>a.d-b.d)[0];
    if(!hit)return false;const [key,type]=hit.x;
    if(type==='seat'){state.garden.bunnySeated=true;delete state.garden.pos.bunny}else state.garden.pos.bunny={x:p.x,y:p.y};
    triggerGardenInteraction(type,'bunny');return true
  }
  if(id==='bench'&&gardenUnlocked('bench')&&gardenDistance(p,bp)<16){releaseBunnyHere(bp);state.garden.bunnySeated=true;delete state.garden.pos.bunny;triggerGardenInteraction('seat','bunny');return true}
  if(id==='picnic'&&gardenUnlocked('picnic')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('picnic','bunny');return true}
  if(id==='mail'&&gardenUnlocked('mail')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('mail','bunny');return true}
  if(id==='cat'&&gardenUnlocked('cat')&&gardenDistance(p,bp)<16){triggerGardenInteraction('friends','bunny');return true}
  if(id==='birdbath'&&gardenUnlocked('birdbath')&&gardenDistance(p,bp)<16){triggerGardenInteraction('birds','bunny');return true}
  if(id==='seedcrate'&&gardenUnlocked('seedcrate')&&gardenDistance(p,bp)<16){triggerGardenInteraction('seeds','bunny');return true}
  if(id==='arch'&&gardenUnlocked('arch')&&gardenDistance(p,bp)<18){triggerGardenInteraction('arch','bunny');return true}
  if(id==='shed'&&gardenUnlocked('shed')&&gardenDistance(p,bp)<17){triggerGardenInteraction('shed','bunny');return true}
  return false
}
function tapGardenObject(id){
  if(id==='picnic'){triggerGardenInteraction('picnic',id);renderGarden();return}
  if(id==='mail'){triggerGardenInteraction('mail',id);renderGarden();return}
  if(id==='cat'){triggerGardenInteraction('friends',id);renderGarden();return}
  if(id==='birdbath'){triggerGardenInteraction('birds',id);renderGarden();return}
  if(id==='seedcrate'){triggerGardenInteraction('seeds',id);renderGarden();return}
  if(id==='arch'){triggerGardenInteraction('arch',id);renderGarden();return}
  if(id==='shed'){triggerGardenInteraction('shed',id);renderGarden();return}
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

function renderPlayHome(){session=null;helpKind='';$('#playView').innerHTML=`<div class="play-view"><div class="play-home"><div class="play-hero-card"><div><div class="play-new">TODAY’S SPELL ADVENTURE ✦</div><p class="eyebrow">READY WHEN YOU ARE</p><h1>Let’s make some words bloom.</h1><p>Listen, look at the picture clue, then spell with Apple Pencil. Every finished word makes your garden grow.</p><button class="giant" id="startSessionBtn">Start! ✦</button><div class="play-meta"><span>${esc(state.week.title)}</span><span>${state.week.ids.length} words</span><span>Real human pronunciation when available</span><span>Hints are always okay ♡</span></div></div><div class="play-mascot"><div class="mascot-bubble">🐰</div></div></div></div></div>`;$('#startSessionBtn').onclick=startSession;syncBgm()}
function startSession(){if(!state.week.ids.length)return toast('Add words in Parent first.');playSfx('start');stopBgm();session={count:0,goal:Math.min(GOAL,state.week.ids.length),doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()}
function chooseWord(){let pool=state.week.ids.filter(id=>!session.doneIds.includes(id)).map(id=>state.lib[id]).filter(Boolean);if(pool.length>1)pool=pool.filter(w=>w.id!==session.last);const scored=pool.map(w=>{const l=w.learn,max=Math.max(0,...l.weak),rate=l.attempts?l.mistakes/l.attempts:0;return{w,score:(w.mioriSpelling&&w.mioriSpelling!==w.word?5:0)+max*.7+rate*5+Math.random()}}).sort((a,b)=>b.score-a.score);return scored[0]?.w}
function chunkRanges(w){
  const parts=(WORD_CHUNKS[w.word]||[]).map(norm).filter(Boolean);
  if(!parts.length||parts.join('')!==w.word)return[{start:0,end:w.word.length}];
  let pos=0;return parts.map(text=>{const r={start:pos,end:pos+text.length};pos=r.end;return r});
}
function rangeInsideChunk(w,index,desired=2){
  const chunks=chunkRanges(w);const c=chunks.find(x=>index>=x.start&&index<x.end)||chunks[0]||{start:0,end:w.word.length};
  const len=Math.max(1,c.end-c.start);desired=Math.max(1,Math.min(desired,len));
  let start=Math.max(c.start,Math.min(index,c.end-desired));
  if(index>=start+desired)start=Math.max(c.start,index-desired+1);
  return{start,end:start+desired};
}
function focusRange(w){
  // First follow Miori's real misspelling, but keep the practice gap inside one meaningful chunk.
  if(w.mioriSpelling&&w.mioriSpelling!==w.word){
    const a=alignChars(w.word,w.mioriSpelling);const i=a.slots.findIndex(s=>!s||s.state!=='ok');
    if(i>=0)return rangeInsideChunk(w,i,Math.min(3,w.word.length));
  }
  // Then revisit weak letters without creating unnatural joins such as lady|bug -> "yb".
  const max=Math.max(0,...w.learn.weak);if(max){const i=w.learn.weak.indexOf(max);return rangeInsideChunk(w,i,2)}
  // Prefer the teacher/parent phonics focus when it stays inside the same learning chunk.
  const f=w.phonicsFocus,i=w.word.indexOf(f);if(f&&i>=0){
    const c=chunkRanges(w).find(x=>i>=x.start&&i<x.end);
    if(c&&i+f.length<=c.end)return{start:i,end:i+f.length};
    return rangeInsideChunk(w,i,Math.max(1,Math.min(f.length,3)));
  }
  // Fallback: choose a short piece from one chunk, never across a compound/syllable boundary.
  const chunks=chunkRanges(w);const c=chunks[Math.min(chunks.length-1,Math.floor(chunks.length/2))]||{start:0,end:w.word.length};
  const anchor=Math.floor((c.start+c.end-1)/2);return rangeInsideChunk(w,anchor,Math.min(2,c.end-c.start));
}
function newQuestion(w,stage=1,range=null){range=range||focusRange(w);const n=stage===3?range.end-range.start:w.word.length;const q={id:w.id,stage,range,first:true,wrong:[],letters:stage>=3?Array(n).fill(''):[],feedback:null,hint:null,mode:'write'};if(stage===1)q.choices=wholeChoices(w,range);if(stage===2)q.choices=gapChoices(w,range);return q}
function confusions(text){if(text.length===1)return CONF[text]||['e','a'];const swap=text.replace(/ee/g,'ea').replace(/ie/g,'ei');return[swap!==text?swap:[...text].reverse().join(''),text.slice(0,-1)+(text.at(-1)==='e'?'a':'e')]}
const SAFE_STAGE1_WORDS=['window','rocket','pencil','banana','tiger','garden','music','school','purple','cookie','ocean','rabbit'];
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
}
function gapChoices(w,r){const c=w.word.slice(r.start,r.end);let out=[c,...confusions(c)];while(out.length<3)out.push(c+'e');return shuffle([...new Set(out)].slice(0,3))}
function expectedText(w,q){return q.stage===3?w.word.slice(q.range.start,q.range.end):w.word}
function clueHtml(w){return`<div class="word-visual-cue audio-clue-panel"><button id="pictureWordAudioBtn" class="cue-picture-tile" type="button" aria-label="Hear the word again"><span class="cue-picture-emoji">${esc(w.pictureEmoji||emojiFor(w.word))}</span><span class="cue-picture-sound">🔊 WORD</span></button><div class="cue-listen-grid"><button id="meaningEnAudioBtn" class="listen-card english" type="button" aria-label="Hear the English meaning"><span class="listen-icon">🔊</span><span class="listen-copy"><small>ENGLISH</small><b>Meaning</b></span><span class="listen-action">Tap to hear <span class="sound-bars">▮▮▮</span></span></button><button id="meaningJaAudioBtn" class="listen-card japanese" type="button" aria-label="日本語の意味を聞く"><span class="listen-icon">🔊</span><span class="listen-copy"><small>日本語</small><b>いみ</b></span><span class="listen-action">タップして聞く <span class="sound-bars">▮▮▮</span></span></button><button id="exampleAudioBtn" class="listen-card example" type="button" aria-label="Hear the example sentence"><span class="listen-icon">💬</span><span class="listen-copy"><small>EXAMPLE</small><b>Sentence</b></span><span class="listen-action">Tap to hear <span class="sound-bars">▮▮▮</span></span></button></div></div>`}
function renderTask(){
  if(!session)return renderPlayHome();stopBgm();if(session.count>=session.goal)return finishSession();if(!session.q){const w=chooseWord();if(!w)return finishSession();session.last=w.id;session.q=newQuestion(w,1)}
  const q=session.q,w=state.lib[q.id];
  $('#playView').innerHTML=`<div class="play-view"><div class="game-topline"><button id="exitPlayBtn" class="icon-btn">×</button><div><div class="stage-labels"><span>Stage ${q.stage} · ${STAGE_NAMES[q.stage]}</span><span>${session.count+1} / ${session.goal}</span></div><div class="stage-track"><div class="stage-fill" style="width:${((q.stage-1)/4)*100}%"></div></div></div><div class="session-xp">+${session.xp} XP</div></div><div class="game-card"><div class="word-audio-row"><button id="audioBtn" class="audio-orb word-sound-button" aria-label="Hear the spelling word"><span class="speaker-glyph">🔊</span><small>WORD</small></button><div><p class="task-prompt">${STAGE_PROMPTS[q.stage]}</p><p class="task-subprompt">${q.stage>=3?'One box = one real writing field. Scratch only inside the letter you want to erase.':'You can play the sound again.'}</p><span id="voicePill" class="voice-pill">${w.pronunciationUrl?'● Human recording':'○ Device voice while human audio loads'}</span></div></div>${clueHtml(w)}<div id="questionArea" class="question-area">${questionHtml(w,q)}</div><div id="feedback" class="feedback ${q.feedback?.bad?'bad':q.feedback?.good?'good':''}">${feedbackText(q)}</div><div class="help-row assist-dock"><button id="hintBtn" class="help-btn hint assist-btn"><span class="assist-icon">✦</span><span><b>Hint</b><small>Give me a clue</small></span></button><button id="peekBtn" class="help-btn peek assist-btn"><span class="assist-icon">◉</span><span><b>Peek</b><small>Show the word</small></span></button></div></div></div>`;
  $('#exitPlayBtn').onclick=renderPlayHome;$('#audioBtn').onclick=()=>playWordAudio(w,false,{userInitiated:true});$('#pictureWordAudioBtn')?.addEventListener('click',()=>playWordAudio(w,false,{userInitiated:true}));$('#meaningEnAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningEn||w.pictureCue||'',{lang:'en-US',button:e.currentTarget}));$('#meaningJaAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningJa||'',{lang:'ja-JP',button:e.currentTarget}));$('#exampleAudioBtn')?.addEventListener('click',e=>speakLearningText(w.example||'',{lang:'en-US',button:e.currentTarget}));$('#hintBtn').onclick=()=>showHint(w,q);$('#peekBtn').onclick=()=>showPeek(w);bindQuestion(w,q);setTimeout(()=>playWordAudio(w,false,{auto:true}),120);if(!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w).then(found=>{if(found&&session?.q?.id===w.id){const pill=$('#voicePill');if(pill)pill.textContent='● Human recording'}});
}
function questionHtml(w,q){
  const r=q.range;if(q.stage===1)return`<div class="choice-grid">${q.choices.map(c=>`<button class="choice-btn ${q.wrong.includes(c)?'wrong':''}" data-choice="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
  if(q.stage===2)return`<div style="width:100%"><div class="gap-word">${esc(w.word.slice(0,r.start))}<span class="gap-slot">?</span>${esc(w.word.slice(r.end))}</div><div class="choice-grid" style="margin:20px auto 0">${q.choices.map(c=>`<button class="choice-btn ${q.wrong.includes(c)?'wrong':''}" data-choice="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`;
  return handwritingHtml(w,q);
}
function handwritingHtml(w,q){
  const expected=expectedText(w,q);const r=q.stage===3?q.range:{start:0,end:w.word.length};let boxes=[];
  for(let full=0;full<w.word.length;full++){
    if(q.stage===3&&(full<r.start||full>=r.end)){boxes.push(`<div class="fixed-box">${esc(w.word[full])}</div>`);continue}
    const local=full-r.start;const value=q.letters[local]||'';let cls=value?'filled':'';
    if(q.feedback?.bad){if(!value)cls='missing';else cls=value===expected[local]?'ok':'bad'}
    if(q.hint?.local===local)cls+=' hint-target';
    if(value){
      // Written letters are plain display boxes, not text inputs. That removes native caret/selection behavior completely.
      boxes.push(`<div class="letter-box written-box ${cls.trim()}" data-local="${local}" data-full="${full}" role="button" aria-label="Letter ${full+1}: ${esc(value)}. Scratch to erase.">${esc(value)}</div>`);
    }else{
      // Empty boxes stay genuine editable Scribble targets. Apple Pencil can begin writing immediately — no first tap is required.
      boxes.push(`<input class="letter-box empty-box ${cls.trim()}" data-local="${local}" data-full="${full}" value="" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder=" " aria-label="Letter ${full+1}">`);
    }
  }
  return`<div class="spell-wrap"><div class="pencil-modebar"><button id="writeModeBtn" class="mode-btn write ${q.mode==='write'?'on':''}">✎ Write</button><button id="eraseModeBtn" class="mode-btn erase ${q.mode==='erase'?'on':''}">⌫ Eraser</button></div><div class="box-note">Just write in the next empty box — no tap first. Scratch one written box to erase only that letter.</div><div id="letterRow" class="letter-row ${q.mode==='erase'?'erase-mode':''}" style="--letters:${w.word.length}">${boxes.join('')}</div>${hintHtml(q)}<button id="checkAnswerBtn" class="check-answer">Check</button></div>`;
}
function hintHtml(q){if(!q.hint)return'';return`<div class="hint-strip"><button id="hintAudioBtn" class="tiny-audio">🔊</button><span>Fix the purple box:</span>${q.hint.options.map(c=>`<button class="hint-choice" data-hint="${c}">${c}</button>`).join('')}<button id="hintCloseBtn" class="tiny-audio">×</button></div>`}
function feedbackText(q){if(q.feedback?.good)return q.first?'Perfect — you remembered it! ✦':'Yes! You fixed it. That counts. ♡';if(q.feedback?.bad)return'Almost. Green is right. Red or dotted boxes need a fix — stay on this stage.';return''}
function bindQuestion(w,q){
  if(q.stage<3){$$('[data-choice]').forEach(b=>b.onclick=()=>pickChoice(b,w,q));return}
  $('#writeModeBtn').onclick=()=>{q.mode='write';renderTask()};$('#eraseModeBtn').onclick=()=>{q.mode='erase';renderTask()};$('#checkAnswerBtn').onclick=()=>checkHandwriting(w,q);$('#hintAudioBtn')?.addEventListener('click',()=>playWordAudio(w,true,{userInitiated:true}));$('#hintCloseBtn')?.addEventListener('click',()=>{q.hint=null;renderTask()});$$('[data-hint]').forEach(b=>b.onclick=()=>chooseHint(b,w,q));
  const boxes=$$('.letter-box[data-local]');boxes.forEach((box,index)=>bindLetterBox(box,index,w,q));
  // Never pre-focus a writing field. On iPad that can open the software keyboard and it also races with fast Pencil movement.
  document.activeElement?.blur?.();
}
function startFilledBoxScratch(e,index,w,q,input){
  const pointerId=e.pointerId,rect=input.getBoundingClientRect(),points=[];let finished=false;
  const add=ev=>{const list=ev.getCoalescedEvents?.()||[ev];for(const p of list)points.push({x:p.clientX,y:p.clientY,t:performance.now()})};
  const cleanup=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',finish,true);window.removeEventListener('pointercancel',finish,true)};
  const move=ev=>{if(ev.pointerId!==pointerId)return;add(ev);ev.preventDefault()};
  const finish=ev=>{if(finished||ev.pointerId!==pointerId)return;finished=true;add(ev);cleanup();
    if(points.length<3)return;
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,path=0,reversals=0,lastSign=0;
    for(let i=0;i<points.length;i++){const p=points[i];minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);if(i){const dx=p.x-points[i-1].x,dy=p.y-points[i-1].y;path+=Math.hypot(dx,dy);if(Math.abs(dx)>2){const sign=Math.sign(dx);if(lastSign&&sign!==lastSign)reversals++;lastSign=sign}}}
    const width=maxX-minX,height=maxY-minY,duration=points.at(-1).t-points[0].t;
    const looksScratch=duration<2200&&height<=rect.height*1.65&&width>=Math.max(10,rect.width*.12)&&(reversals>=1||path>=Math.max(28,width*1.65));
    if(looksScratch)clearOneBox(index,w,q,false);
  };
  input.blur();e.preventDefault();e.stopPropagation();add(e);
  window.addEventListener('pointermove',move,{capture:true,passive:false});window.addEventListener('pointerup',finish,true);window.addEventListener('pointercancel',finish,true);
}
function normalizeScribbleLetter(raw,expected=''){
  const original=String(raw??'').trim();
  let cleaned=norm(original);
  if(!cleaned){
    if(expected==='l'&&['1','|','｜'].includes(original))return'l';
    if(expected==='t'&&['+','†'].includes(original))return't';
    return''
  }
  // Scribble occasionally commits a short candidate string before settling. If it already contains
  // the letter this box expects, keep that expected letter rather than throwing the whole attempt away.
  if(cleaned.length>1&&expected&&cleaned.includes(expected))return expected;
  // A handwritten lowercase l is sometimes interpreted as capital I on iPad. Preserve spelling intent here.
  if(expected==='l'&&original==='I')return'l';
  return cleaned.slice(-1)
}
function bindLetterBox(box,index,w,q){
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
      // Focus the exact box at Pencil-down, but do not preventDefault: Scribble still owns this first stroke.
      // This pipelines fast writing: Miori can move to the next box before iPad finishes recognizing the previous letter.
      box.setAttribute('inputmode','none');
      try{if(document.activeElement!==box)box.focus({preventScroll:true})}catch{}
      setTimeout(()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}},0);
    }
  },true);
  box.addEventListener('touchstart',e=>{if(isInput){e.preventDefault();box.blur()}},{passive:false});
  box.addEventListener('contextmenu',e=>e.preventDefault());box.addEventListener('dragstart',e=>e.preventDefault());
  if(!isInput)return;
  box.addEventListener('keydown',e=>e.preventDefault());
  box.addEventListener('beforeinput',e=>{const t=String(e.inputType||'');if(t.startsWith('delete')){e.preventDefault();return}});
  box.addEventListener('input',e=>{
    if(q.mode==='erase'){e.target.value='';return}
    const expected=expectedText(w,q)[index]||'';
    const cleaned=normalizeScribbleLetter(e.target.value,expected);if(!cleaned){e.target.value='';return}
    q.letters[index]=cleaned;q.feedback=null;q.hint=null;
    // Convert only this field into a non-text display box immediately. Other empty inputs stay ready for the next fast Pencil stroke.
    const written=document.createElement('div');written.className='letter-box written-box filled';written.dataset.local=String(index);written.dataset.full=e.target.dataset.full||String(index);written.setAttribute('role','button');written.setAttribute('aria-label',`Letter ${Number(written.dataset.full)+1}: ${cleaned}. Scratch to erase.`);written.textContent=cleaned;
    e.target.replaceWith(written);bindLetterBox(written,index,w,q);
    $$('.letter-box').forEach(el=>el.classList.remove('ok','bad','missing','hint-target'));const fb=$('#feedback');if(fb){fb.textContent='';fb.className='feedback'};$('.hint-strip')?.remove();
    try{navigator.virtualKeyboard?.hide?.()}catch{}
  });
  box.addEventListener('focus',()=>{try{box.setSelectionRange(0,0)}catch{};try{navigator.virtualKeyboard?.hide?.()}catch{}});
}
function focusLetter(input){
  // Kept only for backwards compatibility with older code paths; no automatic focus is used in Pencil mode.
  if(!input)return;
  input.blur?.();
}
function clearOneBox(index,w,q,fromEraser){
  q.letters[index]='';q.feedback=null;q.hint=null;q.mode='write';renderTask();
  setTimeout(()=>{$(`.letter-box[data-local="${index}"]`)?.classList.add('erase-flash')},35);
  if(fromEraser)navigator.vibrate?.(7)
}
function firstEmptyIndex(q){const i=q.letters.findIndex(x=>!x);return i<0?q.letters.length-1:i}
function firstWrongIndex(w,q){const exp=expectedText(w,q);let i=q.letters.findIndex((x,n)=>x!==exp[n]);return i<0?0:i}
function pickChoice(button,w,q){const val=button.dataset.choice;const correct=q.stage===1?w.word:w.word.slice(q.range.start,q.range.end);if(norm(val)===norm(correct)){button.classList.add('correct');right(w,q)}else{if(!q.wrong.includes(val))q.wrong.push(val);button.classList.add('wrong');wrong(w,q,val,correct);q.feedback={bad:true};renderTask();playSfx('wrong')}}
function checkHandwriting(w,q){const attempt=q.letters.join(''),correct=expectedText(w,q);if(attempt===correct)right(w,q);else{wrong(w,q,attempt,correct);q.feedback={bad:true};q.hint=null;renderTask();playSfx('wrong')}}
function wrong(w,q,attempt,correct){const l=w.learn;l.attempts++;l.mistakes++;l.stageMist[q.stage]=(l.stageMist[q.stage]||0)+1;l.lastWrong=q.stage===3?w.word.slice(0,q.range.start)+attempt+w.word.slice(q.range.end):attempt;l.last=today();q.first=false;state.stats.answers=(state.stats.answers||0)+1;if(q.stage>1){const aligned=alignChars(correct,attempt);aligned.slots.forEach((slot,i)=>{if(!slot||slot.state!=='ok'){const full=(q.stage===3?q.range.start:0)+i;l.weak[full]=(l.weak[full]||0)+2}})}save()}
function right(w,q){
  const l=w.learn;l.attempts++;l.correct++;if(q.first)l.first++;l.last=today();state.stats.answers=(state.stats.answers||0)+1;for(let i=q.range.start;i<q.range.end;i++)l.weak[i]=Math.max(0,(l.weak[i]||0)-1);playSfx('correct');q.feedback={good:true};
  if(q.stage<4){save();renderTask();const stage=q.stage;setTimeout(()=>{if(!session?.q||session.q.id!==w.id||session.q.stage!==stage)return;session.q=newQuestion(w,stage+1,q.range);helpKind='';renderTask()},520);return}
  const gain=30,beforeGrowth=state.garden.growth;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;session.xp+=gain;session.count++;if(!session.doneIds.includes(w.id))session.doneIds.push(w.id);
  const finished=session.count>=session.goal;gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,beforeGrowth,growth:state.garden.growth,finished};session.q=null;save();
  setTimeout(()=>setView('garden'),360)
}
function renderReward(w,gain){const finished=session.count>=session.goal;$('#playView').innerHTML=`<div class="play-view"><div class="reward-screen"><div class="reward-card"><div class="big">${esc(w.pictureEmoji||'🌱')}</div><p class="eyebrow">WORD COMPLETE ✦</p><h1>${esc(w.word)}</h1><p class="muted">You finished Stage 1 → 2 → 3 → 4.</p><div class="reward-chips"><span>＋${gain} XP</span><span>🌱 Garden grew</span><span>✎ Pencil practice saved</span></div><button id="nextWordBtn" class="primary-btn">${finished?'Finish & see Garden':'Next word →'}</button></div></div></div>`;$('#nextWordBtn').onclick=()=>{if(finished)finishSession();else{session.q=null;helpKind='';renderTask()}}}
function finishSession(){const doneCount=session?.count||0,earned=session?.xp||0;state.stats.sessions=(state.stats.sessions||0)+1;save();session=null;gardenCelebration=null;$('#playView').innerHTML=`<div class="play-view"><div class="reward-screen"><div class="reward-card"><div class="big">🌷</div><p class="eyebrow">PLAY COMPLETE</p><h1>You made the garden grow!</h1><p class="muted">You earned ${earned} XP this session.</p><div class="reward-chips"><span>${doneCount} words complete</span><span>XP stays forever</span></div><button id="seeGardenBtn" class="primary-btn">See Garden</button></div></div></div>`;$('#seeGardenBtn').onclick=()=>setView('garden')}
function showHint(w,q){if(q.stage<3){playWordAudio(w,true);toast('Listen slowly, then try again.');return}w.learn.hints++;save();const exp=expectedText(w,q);let local=q.letters.findIndex((x,i)=>x!==exp[i]);if(local<0)local=firstEmptyIndex(q);const correct=exp[local];let alts=[...(CONF[correct]||['a','e','i'])].filter(x=>x!==correct);while(alts.length<2){const c='abcdefghijklmnopqrstuvwxyz'[(local+alts.length*7)%26];if(c!==correct&&!alts.includes(c))alts.push(c)}q.hint={local,correct,options:shuffle([correct,...alts.slice(0,2)])};q.mode='write';renderTask();setTimeout(()=>playWordAudio(w,true),70)}
function chooseHint(button,w,q){if(button.dataset.hint!==q.hint?.correct){button.classList.add('nope');setTimeout(()=>button.classList.remove('nope'),380);playSfx('wrong');return}button.classList.add('yes');q.letters[q.hint.local]=q.hint.correct;q.hint=null;q.feedback=null;playSfx('correct');setTimeout(()=>renderTask(),240)}
function showPeek(w){w.learn.peeks++;save();playWordAudio(w);const el=document.createElement('div');el.className='peek-overlay';el.innerHTML=`<b>${esc(w.word)}</b>`;document.body.appendChild(el);setTimeout(()=>el.remove(),2200)}
function toggleHelp(kind,w){helpKind=helpKind===kind?'':kind;const panel=$('#helpPanel');if(panel){panel.classList.toggle('hidden',!helpKind);panel.innerHTML=helpPanelHtml(w)}}
function helpPanelHtml(w){if(helpKind==='meaning')return`<strong>Meaning</strong><br>${esc(w.meaningEn||'No meaning saved.')}${w.meaningJa?`<br><span class="muted">${esc(w.meaningJa)}</span>`:''}`;if(helpKind==='example')return`<strong>Example</strong><br>${esc(w.example||'No example saved.')}`;return''}

function loadVoices(){voices=('speechSynthesis'in window?speechSynthesis.getVoices():[])||[];if(currentView==='parent')renderParent()}
function chosenVoice(){const list=voices.filter(v=>/^en([-_]|$)/i.test(v.lang));return list.find(v=>v.voiceURI===state.settings.voice)||list.find(v=>/(Samantha|Ava|Google US English|Jenny|Aria|Emma)/i.test(v.name))||list[0]||voices[0]}
function chosenVoiceForLang(lang='en-US'){
  const code=String(lang).slice(0,2).toLowerCase();
  if(code==='en')return chosenVoice();
  const list=voices.filter(v=>String(v.lang||'').toLowerCase().startsWith(code));
  if(code==='ja')return list.find(v=>/(Kyoko|Otoya|Hattori|Haruka|Japanese|日本語)/i.test(v.name))||list[0]||null;
  return list[0]||null
}
function speakLearningText(text,{lang='en-US',button=null}={}){
  text=String(text||'').trim();if(!text)return toast(lang.startsWith('ja')?'説明がありません。':'No audio text saved.');
  if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}
  if(!('speechSynthesis'in window))return toast('Speech is not available on this device.');
  speechSynthesis.cancel();$$('.listen-card.speaking').forEach(b=>b.classList.remove('speaking'));
  const u=new SpeechSynthesisUtterance(text),v=chosenVoiceForLang(lang);if(v)u.voice=v;u.lang=v?.lang||lang;u.rate=lang.startsWith('ja')?.86:.9;u.pitch=1.02;
  button?.classList.add('speaking');const done=()=>button?.classList.remove('speaking');u.onend=done;u.onerror=done;speechSynthesis.speak(u)
}
function speak(text,{slow=false}={}){if(!text||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text),v=chosenVoice();if(v)u.voice=v;u.lang=v?.lang||'en-US';u.rate=slow?.62:.88;u.pitch=1.03;const btn=$('#audioBtn');btn?.classList.add('playing');u.onend=u.onerror=()=>btn?.classList.remove('playing');speechSynthesis.speak(u)}
async function playWordAudio(word,slow=false,{auto=false,userInitiated=false}={}){
  if('speechSynthesis'in window)speechSynthesis.cancel();$$('.listen-card.speaking').forEach(b=>b.classList.remove('speaking'));
  if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}
  const pill=$('#voicePill');
  const setPill=(text,cls='')=>{if(!pill)return;pill.textContent=text;pill.classList.remove('human-ready','human-wait','device-fallback');if(cls)pill.classList.add(cls)};
  if(word.pronunciationUrl){
    let finished=false,timer=null;const btn=$('#audioBtn');
    const cleanup=(audio)=>{if(timer)clearTimeout(timer);btn?.classList.remove('playing');if(currentAudio===audio)currentAudio=null};
    const fallback=(audio,reason='')=>{
      if(finished)return;finished=true;cleanup(audio);word.audioTried=true;save();
      // Never erase a stored human URL because of a transient iPad/network/autoplay failure.
      setPill('○ Human audio unavailable now · device voice','device-fallback');
      speak(word.word,{slow})
    };
    try{
      const audio=new Audio();currentAudio=audio;audio.preload='auto';audio.playbackRate=slow?.82:1;btn?.classList.add('playing');
      setPill('● Human recording','human-ready');
      audio.onplaying=()=>{if(timer)clearTimeout(timer);setPill('● Human recording','human-ready')};
      audio.onended=()=>{finished=true;cleanup(audio)};
      // abort is normally caused by us switching to another sound; it is not evidence that the human file is bad.
      audio.onabort=()=>{finished=true;cleanup(audio)};
      audio.onerror=()=>fallback(audio,'media');
      audio.src=word.pronunciationUrl;
      timer=setTimeout(()=>{
        if(audio.readyState>=2||finished)return;
        if(auto){finished=true;cleanup(audio);setPill('● Human recording · tap WORD','human-wait');return}
        fallback(audio,'timeout')
      },5000);
      await audio.play();return
    }catch(e){
      const blocked=e?.name==='NotAllowedError'||e?.name==='AbortError';
      const audio=currentAudio;
      if(blocked){
        finished=true;cleanup(audio);setPill('● Human recording · tap WORD','human-wait');return
      }
      console.warn('Human audio failed for this attempt, using device voice',e);fallback(audio,'play');return
    }
  }
  setPill('○ Device voice','');speak(word.word,{slow})
}
async function findHumanAudio(wordText){const word=norm(wordText);if(!word)return'';try{const q=encodeURIComponent(`${word} pronunciation`);const url=`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),4500);const res=await fetch(url,{signal:controller.signal});clearTimeout(timer);if(!res.ok)return'';const data=await res.json();const pages=Object.values(data.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.url);const scored=pages.map(p=>{const title=(p.title||'').toLowerCase(),info=p.imageinfo[0];let score=0;if(title.includes(word))score+=8;if(/en[-_ ]?(us|uk|gb)|english/.test(title))score+=5;if(/pronunciation|pronounce/.test(title))score+=3;if(/\.mp3(?:$|\?)/i.test(info.url||''))score+=7;else if(/\.(m4a|wav)(?:$|\?)/i.test(info.url||''))score+=5;else if(/\.(ogg|oga)(?:$|\?)/i.test(info.url||''))score+=3;if(/song|music|sentence|phrase/.test(title))score-=6;return{url:info.url,score}}).sort((a,b)=>b.score-a.score);return scored[0]?.score>=8?scored[0].url:''}catch{return''}}
async function resolveHumanAudioForWord(w,{announce=false}={}){if(!w||w.pronunciationUrl)return false;w.audioTried=true;const found=await findHumanAudio(w.word);if(!found){save();if(announce)toast('No clear human recording found. Device voice will be used.');return false}w.pronunciationUrl=found;w.pronunciationSource='Wikimedia Commons';save();if(announce)toast('Human pronunciation found.');return true}
function ensureAudioCtx(){
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
  if(!audioUnlocked||!state.settings.music||bgmTimer===null)return;const ctx=ensureAudioCtx();if(!ctx||!musicGain)return;const now=ctx.currentTime+.05;
  const phrases=[[[659,0],[784,.82],[880,1.78],[784,3.15]],[[587,0],[659,.9],[784,1.95],[659,3.25]],[[659,0],[880,1.05],[988,2.2],[784,3.45]]];
  const phrase=phrases[Math.floor(Date.now()/5600)%phrases.length];phrase.forEach(([f,t],i)=>tone(ctx,f,now+t,.58,i===0?.008:.0065,'sine',musicGain));
  tone(ctx,329.6,now+.18,1.05,.0028,'sine',musicGain)
}
function startBgm(){
  if(!audioUnlocked||!state.settings.music||bgmTimer!==null||currentView!=='garden')return;const ctx=ensureAudioCtx();if(!ctx)return;musicGain=ctx.createGain();musicGain.gain.setValueAtTime(.0001,ctx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.22,ctx.currentTime+.5);musicGain.connect(ctx.destination);bgmTimer=setInterval(scheduleBgmBar,5600);scheduleBgmBar();renderTopbar()
}
function stopBgm(){
  if(bgmTimer!==null){clearInterval(bgmTimer);bgmTimer=null}if(musicGain&&audioCtx){try{musicGain.gain.cancelScheduledValues(audioCtx.currentTime);musicGain.gain.setValueAtTime(Math.max(.0001,musicGain.gain.value),audioCtx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.18)}catch{};const old=musicGain;setTimeout(()=>{try{old.disconnect()}catch{}},260)}musicGain=null;renderTopbar()
}
function syncBgm(){const should=state.settings.music&&currentView==='garden';if(should)startBgm();else stopBgm()}


function alignChars(target,typed){target=norm(target);typed=norm(typed);const n=target.length,m=typed.length,d=Array.from({length:n+1},()=>Array(m+1).fill(0));for(let i=0;i<=n;i++)d[i][0]=i;for(let j=0;j<=m;j++)d[0][j]=j;for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)d[i][j]=Math.min(d[i-1][j-1]+(target[i-1]===typed[j-1]?0:1),d[i-1][j]+1,d[i][j-1]+1);const slots=Array(n);let i=n,j=m;while(i||j){const diag=i&&j?d[i-1][j-1]+(target[i-1]===typed[j-1]?0:1):1e9;if(i&&j&&d[i][j]===diag){slots[i-1]={expected:target[i-1],typed:typed[j-1],state:target[i-1]===typed[j-1]?'ok':'bad'};i--;j--;continue}if(i&&d[i][j]===d[i-1][j]+1){slots[i-1]={expected:target[i-1],typed:'',state:'missing'};i--;continue}j--}return{slots}}

function resetOneLearning(id){const w=state.lib[id];if(!w)return;if(confirm(`Reset learning data for “${w.word}” only?`)){w.learn=learning(w.word);save();renderParent();toast(`${w.word}: learning data reset.`)}}
function resetAllLearning(){if(!confirm('Reset learning data for ALL words? Garden items and XP will stay.'))return;Object.values(state.lib).forEach(w=>w.learn=learning(w.word));save();renderParent();toast('All learning data reset.')}
function resetGardenLayout(){if(!confirm('Reset garden positions? Items in the Treasure Box will stay there.'))return;state.garden.pos={};state.garden.bunnySeated=false;save();renderParent();toast('Garden layout reset.')}
function resetGardenProgress(){if(!confirm('Reset the whole garden? This resets XP, plant growth, item positions, and the Treasure Box. Word learning data will NOT be deleted.'))return;state.xp=0;state.garden={growth:0,pos:{},bunnySeated:false,stored:[]};save();renderParent();toast('Garden reset. Learning data kept.')}
function learningSummary(w){const l=w.learn||learning(w.word),weak=Math.max(0,...(l.weak||[])),wi=weak?(l.weak||[]).indexOf(weak):-1;return{loops:l.loops||0,correct:l.correct||0,mistakes:l.mistakes||0,weak:wi>=0?w.word.slice(wi,Math.min(w.word.length,wi+2)):'—',last:l.last||'Not practiced yet'}}
function renderParent(){
  const week=state.week.ids.map(id=>state.lib[id]).filter(Boolean),all=Object.values(state.lib).sort((a,b)=>a.word.localeCompare(b.word));
  $('#parentView').innerHTML=`<div class="parent-view parent-v4"><div class="parent-head"><div><p class="eyebrow">DAD SPACE</p><h1>Parent</h1><p>Everything Dad needs to maintain words, pronunciation, learning data, and the garden.</p></div><div class="parent-actions"><label class="secondary-btn file-btn">Import Word Pack<input id="parentImport" type="file" accept="application/json,.json"></label><button id="exportBtn" class="secondary-btn">Export Backup</button><button id="addWordBtn" class="primary-btn">+ Add Word</button></div></div><div class="parent-stats-row"><div><b>${week.length}</b><span>This week</span></div><div><b>${state.xp}</b><span>Total XP</span></div><div><b>${state.garden.growth||0}</b><span>Garden growth</span></div><div><b>${rewards.filter(r=>state.xp>=r.xp).length}</b><span>Unlocked friends & items</span></div></div><div class="parent-grid parent-main-grid"><section class="panel"><div class="panel-head"><div><p class="eyebrow">THIS WEEK</p><h2>${esc(state.week.title)}</h2></div><span>${week.length} words</span></div><div class="week-list word-card-list">${week.map(wordRowHtml).join('')}</div></section><aside class="panel settings parent-audio-panel"><p class="eyebrow">PRONUNCIATION</p><h2>English voice & audio</h2><select id="voiceSelect"><option value="">Best available</option>${voices.filter(v=>/^en/i.test(v.lang)).map(v=>`<option value="${esc(v.voiceURI)}" ${v.voiceURI===state.settings.voice?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><p>Human recordings are used first when available. Device voice is the fallback.</p><button id="testVoiceBtn" class="parent-big-button">🔊 Test voice</button></aside></div><section class="panel library-panel"><div class="panel-head"><div><p class="eyebrow">WORD LIBRARY</p><h2>All saved words</h2></div><input id="librarySearch" class="search-input" placeholder="Search words…"></div><div id="libraryList" class="library-list word-card-list">${all.map(wordRowHtml).join('')}</div></section><section class="panel maintenance-panel"><div><p class="eyebrow">MAINTENANCE</p><h2>Reset & maintenance</h2><p>These controls are intentionally down here because you probably will not need them often.</p></div><div class="maintenance-actions"><button id="resetAllLearningBtn" class="maintenance-btn learning">↻ Reset all learning data<span>Keeps XP and the garden</span></button><button id="resetGardenLayoutBtn" class="maintenance-btn layout">▦ Reset garden layout<span>Keeps growth and unlocked items</span></button><button id="resetGardenProgressBtn" class="maintenance-btn danger-soft">Reset whole garden<span>Keeps word learning data</span></button></div></section></div>`;
  $('#parentImport').onchange=e=>importWordPack(e.target.files?.[0]);$('#exportBtn').onclick=exportBackup;$('#addWordBtn').onclick=()=>openWordModal();$('#voiceSelect').onchange=e=>{state.settings.voice=e.target.value;save()};$('#testVoiceBtn').onclick=()=>speak('Hello Miori. Let’s practice spelling together.');$('#librarySearch').oninput=e=>{const q=e.target.value.toLowerCase();$('#libraryList').innerHTML=all.filter(w=>!q||w.word.includes(q)||(w.meaningEn||'').toLowerCase().includes(q)).map(wordRowHtml).join('');bindParentRows()};$('#resetAllLearningBtn').onclick=resetAllLearning;$('#resetGardenLayoutBtn').onclick=resetGardenLayout;$('#resetGardenProgressBtn').onclick=resetGardenProgress;bindParentRows()
}
function wordRowHtml(w){const m=learningSummary(w);return`<div class="word-row parent-word-card" data-id="${w.id}"><div class="word-main"><strong>${esc(w.word)}</strong><span class="audio-status">${w.pronunciationUrl?'● Human audio':'○ Device voice'}</span><p>${esc(w.meaningEn||'No meaning saved')}</p></div><div class="learning-mini"><span><b>${m.loops}</b> full loops</span><span><b>${m.correct}</b> correct</span><span><b>${m.mistakes}</b> mistakes</span><span>weak: <b>${esc(m.weak)}</b></span><small>${esc(m.last)}</small></div><div class="word-actions"><button class="parent-row-btn audio-preview">🔊 Audio</button><button class="parent-row-btn edit-word">✎ Edit</button><button class="parent-row-btn reset-word">↻ Reset learning</button></div></div>`}
function bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];$('.audio-preview',row).onclick=()=>playWordAudio(w);$('.edit-word',row).onclick=()=>openWordModal(w.id);$('.reset-word',row).onclick=()=>resetOneLearning(w.id)})}
function openWordModal(id=null){const w=id?state.lib[id]:null;$('#modalRoot').innerHTML=`<div class="modal"><div class="modal-card"><div class="modal-head"><div><p class="eyebrow">WORD DETAILS</p><h2>${w?'Edit Word':'Add Word'}</h2></div><button id="closeModal" class="icon-btn">×</button></div><form id="wordForm" class="word-form"><label>Word<input id="wordInput" value="${esc(w?.word||'')}" ${w?'readonly':''} required></label><label>English meaning<textarea id="meaningEnInput" rows="2">${esc(w?.meaningEn||'')}</textarea></label><label>Japanese meaning<textarea id="meaningJaInput" rows="2">${esc(w?.meaningJa||'')}</textarea></label><label>Example sentence<textarea id="exampleInput" rows="2">${esc(w?.example||'')}</textarea></label><div class="form-two"><label>Phonics focus<input id="phonicsInput" value="${esc(w?.phonicsFocus||'')}"></label><label>Picture cue<input id="pictureCueInput" value="${esc(w?.pictureCue||'')}"></label></div><label>Picture emoji<input id="pictureEmojiInput" value="${esc(w?.pictureEmoji||'')}"></label><label>Miori's spelling<input id="mioriSpellingInput" value="${esc(w?.mioriSpelling||'')}" placeholder="e.g. responsibol"></label><label>Human pronunciation URL<input id="pronunciationUrlInput" value="${esc(w?.pronunciationUrl||'')}"></label><div class="modal-actions">${w?'<button type="button" id="resetLearningBtn" class="danger">Reset learning</button>':''}<button type="button" id="findAudioBtn" class="secondary-btn">Find Human Audio</button><button type="button" id="cancelModal" class="secondary-btn">Cancel</button><button type="submit" class="primary-btn">Save</button></div></form></div></div>`;$('#closeModal').onclick=$('#cancelModal').onclick=()=>$('#modalRoot').innerHTML='';$('#findAudioBtn').onclick=async()=>{const word=norm($('#wordInput').value);if(!word)return;const btn=$('#findAudioBtn');btn.disabled=true;btn.textContent='Searching…';const url=await findHumanAudio(word);btn.disabled=false;btn.textContent='Find Human Audio';if(url){$('#pronunciationUrlInput').value=url;toast('Human pronunciation found.')}else toast('No clear human recording found.')};$('#resetLearningBtn')?.addEventListener('click',()=>{if(confirm(`Reset learning data for “${w.word}” only?`)){w.learn=learning(w.word);save();$('#modalRoot').innerHTML='';renderParent()}});$('#wordForm').onsubmit=e=>{e.preventDefault();const word=norm($('#wordInput').value);if(!word)return;const old=state.lib[word];const raw={word,meaningEn:$('#meaningEnInput').value.trim(),meaningJa:$('#meaningJaInput').value.trim(),example:$('#exampleInput').value.trim(),phonicsFocus:$('#phonicsInput').value.trim(),pictureCue:$('#pictureCueInput').value.trim(),pictureEmoji:$('#pictureEmojiInput').value.trim(),mioriSpelling:$('#mioriSpellingInput').value.trim(),pronunciationUrl:$('#pronunciationUrlInput').value.trim(),pronunciationSource:$('#pronunciationUrlInput').value.trim()?'manual':''};state.lib[word]=normalizeWord(raw,old);if(!state.week.ids.includes(word))state.week.ids.push(word);save();$('#modalRoot').innerHTML='';renderParent();toast('Saved.')};setTimeout(()=>$('#wordInput')?.focus(),40)}
async function importWordPack(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.version&&data.lib){state=data;state.version=3;save();renderParent();toast('Backup restored.');return}const words=Array.isArray(data)?data:data.words;if(!Array.isArray(words)||!words.length)throw new Error('no words');if(data.weekName||data.title)state.week.title=data.weekName||data.title;const ids=[];for(const raw of words){if(!raw.word)continue;const key=norm(raw.word),old=state.lib[key];state.lib[key]=normalizeWord(raw,old);ids.push(key)}state.week.ids=[...new Set(ids)];save();renderParent();toast(`Imported ${ids.length} words.`);for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}}catch(e){console.error(e);toast('Could not import this Word Pack.')}}
function exportBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`miori-word-garden-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),800)}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2200)}

function init(){
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>{playSfx('tap');setView(b.dataset.nav)}));
  $('#musicToggle')?.addEventListener('click',()=>{audioUnlocked=true;state.settings.music=!state.settings.music;save();if(state.settings.music){playSfx('sparkle');syncBgm()}else stopBgm()});
  document.addEventListener('pointerdown',()=>{audioUnlocked=true;ensureAudioCtx();syncBgm()},{once:true,capture:true});
  renderTopbar();loadVoices();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=loadVoices;setView('garden');for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
