(()=>{
'use strict';
const STORAGE_KEY='mwg-v2-rebuild';
const LEVEL_XP=100;
const GOAL=10;
const STAGE_NAMES=['','Listen & Choose','Fill the Gap','Write the Gap','Full Spelling'];
const STAGE_PROMPTS=['','Listen. Which spelling is right?','Which letters fit here?','Trace the word. Fill the blank.','Write the whole word.'];
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
{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:53,y:68},
{id:'bench',xp:90,type:'treasure',label:'Cozy garden bench',icon:'🩷',x:57,y:76},
{id:'picnic',xp:180,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:77},
{id:'mail',xp:270,type:'treasure',label:'Heart mailbox',icon:'💌',x:48,y:58},
{id:'cat',xp:360,type:'friend',label:'Garden cat',icon:'🐱',x:71,y:65},
{id:'birdbath',xp:450,type:'treasure',label:'Bird bath',icon:'🐦',x:88,y:57},
{id:'seedcrate',xp:540,type:'treasure',label:'Seed crate',icon:'🌼',x:48,y:78},
{id:'arch',xp:630,type:'treasure',label:'Flower arch',icon:'🌸',x:64,y:49},
{id:'shed',xp:720,type:'treasure',label:'Little garden shed',icon:'🏡',x:89,y:36}
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
let weeklyTest=null;
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

function learning(word){return{attempts:0,correct:0,first:0,mistakes:0,stageMist:{1:0,2:0,3:0,4:0},weak:Array(word.length).fill(0),lastWrong:'',last:'',hints:0,peeks:0,loops:0,feeling:'',feelingDate:''}}
function defaultState(){return{version:3,xp:0,week:{id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids:[]},lib:{},garden:{growth:0,pos:{},bunnySeated:false,stored:[]},settings:{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true},stats:{answers:0,sessions:0},recentWords:[]}}
function emojiFor(word){return({beetle:'🪲',butterfly:'🦋',cricket:'🦗',grasshopper:'🦗',honeybee:'🐝',insect:'🔎',ladybug:'🐞',raisin:'🍇',riding:'🚲',thicket:'🌿'})[word]||'✦'}
function normalizeWord(raw={},old=null){
  const word=norm(raw.word||old?.word||'');
  const learn=old?.learn||raw.learn||learning(word);
  learn.stageMist=learn.stageMist||{1:0,2:0,3:0,4:0};
  learn.weak=Array.isArray(learn.weak)?learn.weak:Array(word.length).fill(0);
  while(learn.weak.length<word.length)learn.weak.push(0);
  learn.hints=learn.hints||0;learn.peeks=learn.peeks||0;learn.loops=learn.loops||0;learn.feeling=learn.feeling||'';learn.feelingDate=learn.feelingDate||'';
  return{id:word,word,
    meaningEn:raw.meaningEn??old?.meaningEn??'',meaningJa:raw.meaningJa??old?.meaningJa??'',example:raw.example??old?.example??'',
    phonicsFocus:norm(raw.phonicsFocus??old?.phonicsFocus??''),pictureCue:raw.pictureCue??old?.pictureCue??'',pictureEmoji:raw.pictureEmoji??old?.pictureEmoji??emojiFor(word),
    mioriSpelling:norm(raw.mioriSpelling??old?.mioriSpelling??''),pronunciationUrl:raw.pronunciationUrl??old?.pronunciationUrl??'',
    pronunciationSource:raw.pronunciationSource??old?.pronunciationSource??'',audioTried:old?.audioTried||raw.audioTried||false,parentPriority:!!(raw.parentPriority??old?.parentPriority??false),learn};
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
  s.lib=s.lib||{};s.stats=s.stats||{answers:0,sessions:0};s.garden=s.garden||{growth:0,pos:{},bunnySeated:false,stored:[]};s.garden.pos=s.garden.pos||{};if(typeof s.garden.bunnySeated!=='boolean')s.garden.bunnySeated=false;if(!Array.isArray(s.garden.stored))s.garden.stored=[];s.settings=s.settings||{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true};if(typeof s.settings.sound!=='boolean')s.settings.sound=true;if(typeof s.settings.music!=='boolean')s.settings.music=true;if(!s.settings.audioDefaultV17){s.settings.sound=true;s.settings.music=true;s.settings.audioDefaultV17=true}s.settings.musicV2=true;
  s.recentWords=Array.isArray(s.recentWords)?s.recentWords:[];seedSchoolWords(s);localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s;
}
let state=loadState();
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderTopbar()}
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
function setView(name){const changing=currentView!==name;currentView=name;if(changing&&audioUnlocked)playSfx('transition');$$('.view').forEach(v=>v.classList.remove('active-view'));$(`#${name}View`).classList.add('active-view');$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='garden')renderGarden();if(name==='play'){if(session){if(session.count>=session.goal)finishSession();else renderTask()}else renderPlayHome()}if(name==='parent')renderParent();renderTopbar();syncBgm()}

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
function gardenUnlocked(id){const r=rewards.find(x=>x.id===id);return!!r&&state.xp>=r.xp}
function gardenPlaced(id){return gardenUnlocked(id)&&!(state.garden.stored||[]).includes(id)}
function bunnyDisplayPos(){const bench=gardenPos('bench');return state.garden.bunnySeated&&gardenPlaced('bench')?{x:bench.x,y:bench.y-8}:gardenPos('bunny')}
function interactionItem(type){return({seat:'bench',picnic:'picnic',mail:'mail',friends:'cat',birds:'birdbath',seeds:'seedcrate',arch:'arch',shed:'shed'})[type]||''}
function gardenDistance(a,b){return Math.hypot((a?.x??0)-(b?.x??0),(a?.y??0)-(b?.y??0))}
function triggerGardenInteraction(type,actor='bunny'){
  const token=Date.now();gardenInteraction={type,actor,token};const sound={seat:'seat',picnic:'sparkle',mail:'sparkle',friends:'friend',birds:'chirp',seeds:'grow',arch:'sparkle',shed:'drop'}[type]||'sparkle';playSfx(sound);
  setTimeout(()=>{if(gardenInteraction?.token===token){gardenInteraction=null;if(currentView==='garden'&&!gardenCelebration)renderGarden()}},2200)
}
function gardenReactionHtml(){
  if(!gardenInteraction)return'';const type=gardenInteraction.type;
  const data={seat:['bench','♡','Cozy!'],picnic:['picnic','🍓','Snack time!'],mail:['mail','💌','A letter!'],friends:['cat','♡','New friend!'],birds:['birdbath','🐦','Bird visitors!'],seeds:['seedcrate','🌼','Planting time!'],arch:['arch','✦','Pretty!'],shed:['shed','🧤','Garden tools!']}[type];if(!data||!gardenPlaced(data[0])){gardenInteraction=null;return''}
  const p=gardenPos(data[0]);return`<div class="garden-reaction ${type}" style="left:${p.x}%;top:${Math.max(12,p.y-14)}%"><span>${data[1]}</span><b>${data[2]}</b></div>`
}
function growthJourneyHtml(target){if(!target)return'';return`<div class="growth-journey ${target}"><i class="journey-stem"></i><i class="journey-leaf l"></i><i class="journey-leaf r"></i><i class="journey-bud"></i><i class="journey-bloom"></i></div>`}
function renderGarden(){
  const a=Math.min(5,Math.max(0,state.garden.growth));const b=Math.min(5,Math.max(0,state.garden.growth-5));
  const next=rewards.find(r=>state.xp<r.xp);const wordsAway=next?Math.max(1,Math.ceil((next.xp-state.xp)/30)):0;const nextText=next?`${next.icon||'✦'} Next: ${next.label} · ${wordsAway} ${wordsAway===1?'word':'words'} away`:'✨ All current garden surprises unlocked!';
  const seatText=state.xp<90?'Keep growing — Bunny’s cozy bench is coming!':state.garden.bunnySeated?'🐰 Bunny is cozy on the bench ♡':'Drag Bunny around the backyard — every special spot has its own little reaction.';
  const celebration=gardenCelebration;let target='',beforeStage=0,afterStage=0;
  if(celebration){const step=celebration.beforeGrowth<10?celebration.beforeGrowth:(celebration.beforeGrowth%10);target=step<5?'left':'right';beforeStage=step<5?step:step-5;afterStage=Math.min(5,beforeStage+1)}
  const displayA=celebration&&target==='left'?beforeStage:a,displayB=celebration&&target==='right'?beforeStage:b;
  const storedCount=(state.garden.stored||[]).length;const unlockedTreasureCount=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp).length;
  const stageNames=['Seed','Tiny sprout','Growing stem','Leafy plant','Flower bud','Bloom!'];const growthCopy=celebration?`${stageNames[beforeStage]} → ${stageNames[afterStage]}`:'';
  const unlockReward=celebration?.unlock&&!celebration.unlockShown?rewards.find(r=>r.id===celebration.unlock.id):null;
  if(unlockReward)celebration.unlockShown=true;
  const feelingPrompt=celebration?.askFeeling?`<div class="feel-check"><small>How did that feel?</small><button class="feel-btn" data-word="${esc(celebration.word)}" data-feel="easy">😊 Easy</button><button class="feel-btn" data-word="${esc(celebration.word)}" data-feel="almost">🙂 Almost</button><button class="feel-btn" data-word="${esc(celebration.word)}" data-feel="tricky">😵 Tricky</button></div>`:'';
  const rewardCard=celebration?`<div class="reward-garden-card"><div class="reward-emoji">${esc(celebration.emoji||'🌱')}</div><div class="copy"><b>${esc(celebration.word)} made THIS plant grow! ✦</b><span>Word complete · ${growthCopy}</span>${feelingPrompt}</div><button id="gardenNextWordBtn">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const unlockReveal=unlockReward?`<div class="treasure-unlock-reveal" id="treasureUnlockReveal"><div class="treasure-unlock-rays"></div><div class="treasure-unlock-copy"><small>NEW TREASURE! ✦</small><h2>${esc(unlockReward.label)}</h2><p>You got it! It’s going into your Treasure Box.</p></div><div class="treasure-unlock-fly ${unlockReward.id}" id="treasureUnlockFly">${gardenObjectArt(unlockReward)}</div><div class="treasure-unlock-stars">✦　✧　✦</div></div>`:'';
  const burst=celebration?`<div class="growth-burst ${target}"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';
  const growthBadge=celebration?`<div class="growth-target-badge ${target}"><b>LOOK! THIS ONE ✦</b><span>${growthCopy}</span></div>`:'';
  const sparkRing=celebration?`<div class="growth-spark-ring ${target}"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>`:'';
  $('#gardenView').innerHTML=`<div class="garden-view">${unlockReveal}<div class="garden-head"><div><p class="eyebrow">YOUR GARDEN</p><h1>Miori’s little spell world ✦</h1><p class="sub">${esc(state.week.title)} · ${state.garden.growth} growth moments</p></div><div class="garden-head-actions"><button class="secondary-btn treasure-open" id="treasureChestBtn">🧺 Treasure Box <span>${storedCount}/${unlockedTreasureCount}</span></button><button class="primary-btn garden-play" id="gardenPlayBtn">${celebration?'Keep going ✦':'Play! ✦'}</button></div></div><div class="garden-scene ${celebration?'reward-moment':''}" id="gardenScene">${rewardCard}<div class="garden-update"><b>NEW ✦</b><span>Sunny backyard edition · collect, decorate, and grow</span></div><div class="next-surprise">${esc(nextText)}</div><div class="garden-spark s1">✦</div><div class="garden-spark s2">✧</div><div class="garden-spark s3">✦</div><div class="garden-butterfly b1">🦋</div><div class="garden-butterfly b2">🦋</div><div class="sun"></div><div class="cloud a"></div><div class="cloud b"></div><div class="hill back"></div><div class="hill front"></div><div class="ca-house"></div><div class="white-fence"></div><div class="citrus-tree"></div><div class="patio-lights"></div><div class="lavender-edge left"></div><div class="lavender-edge right"></div><div class="path"></div><div class="pond"></div><div class="plot left ${target==='left'?'growth-target':''}" data-growth-plot="left">${plant(displayA)}</div><div class="plot right ${target==='right'?'growth-target':''}" data-growth-plot="right">${plant(displayB)}</div>${burst}${growthBadge}${sparkRing}${gardenReactionHtml()}<div id="gardenObjects"></div><div class="garden-tip">${celebration?'🌱 Look — stem, leaves, bud, bloom!':seatText}</div></div></div>`;
  const continuePlay=()=>{playSfx('tap');gardenCelebration=null;setView('play')};
  $('#gardenPlayBtn').onclick=()=>celebration?continuePlay():(playSfx('tap'),setView('play'));$('#treasureChestBtn')?.addEventListener('click',()=>{playSfx('tap');openTreasureChest()});
  $('#gardenNextWordBtn')?.addEventListener('click',continuePlay);$$('.feel-btn').forEach(btn=>btn.addEventListener('click',()=>{const w=state.lib[btn.dataset.word];if(!w)return;w.learn.feeling=btn.dataset.feel;w.learn.feelingDate=today();save();const wrap=btn.closest('.feel-check');$$('.feel-btn',wrap).forEach(x=>x.classList.toggle('selected',x===btn));if(!$('.feel-thanks',wrap))wrap?.insertAdjacentHTML('beforeend','<span class="feel-thanks">Thanks ♡</span>');playSfx('tap')}));
  const root=$('#gardenObjects');rewards.filter(r=>state.xp>=r.xp&&!(state.garden.stored||[]).includes(r.id)).forEach(r=>{const p=r.id==='bunny'?bunnyDisplayPos():gardenPos(r.id);const el=document.createElement('div');el.className=`garden-object ${r.type} ${r.id}${r.id==='bunny'&&state.garden.bunnySeated?' seated':''}`;el.dataset.id=r.id;el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;el.style.zIndex=r.id==='bunny'||r.id==='cat'?'18':'8';el.innerHTML=gardenObjectArt(r);root.appendChild(el);makeDraggable(el)});
  if(celebration){
    const targetPlot=$(`.plot[data-growth-plot="${target}"]`),bunny=root.querySelector('[data-id="bunny"]'),scene=$('#gardenScene');
    if(bunny)bunny.classList.add('garden-cheer');
    const bp=bunnyDisplayPos();scene?.insertAdjacentHTML('beforeend',`<div class="bunny-cheer-bubble" style="left:${bp.x}%;top:${Math.max(12,bp.y-16)}%">Yay! <span>♡</span></div>`);
    setTimeout(()=>{if(!gardenCelebration||!targetPlot)return;targetPlot.innerHTML=plant(afterStage);targetPlot.classList.add('growth-change');playSfx('grow')},720);
    if(unlockReward){
      const reveal=$('#treasureUnlockReveal'),fly=$('#treasureUnlockFly'),chest=$('#treasureChestBtn');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!reveal||!fly||!chest)return;
        const fr=fly.getBoundingClientRect(),cr=chest.getBoundingClientRect();
        fly.style.setProperty('--treasure-fly-x',`${cr.left+cr.width/2-(fr.left+fr.width/2)}px`);
        fly.style.setProperty('--treasure-fly-y',`${cr.top+cr.height/2-(fr.top+fr.height/2)}px`);
        const nextBtn=$('#gardenNextWordBtn'),playBtn=$('#gardenPlayBtn');if(nextBtn)nextBtn.disabled=true;if(playBtn)playBtn.disabled=true;
        setTimeout(()=>{if(!gardenCelebration)return;reveal.classList.add('show');playSfx('unlock')},1900);
        setTimeout(()=>{if(!gardenCelebration)return;reveal.classList.add('flying');chest.classList.add('treasure-catch')},3550);
        setTimeout(()=>{reveal.classList.add('done');chest.classList.remove('treasure-catch');playSfx('store');if(nextBtn)nextBtn.disabled=false;if(playBtn)playBtn.disabled=false},4600)
      }))
    }
  }
}
function openTreasureChest(){
  const unlocked=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp);const stored=state.garden.stored||[];
  const cards=unlocked.length?unlocked.map(r=>{const away=stored.includes(r.id);return`<div class="treasure-card ${away?'stored':''}" data-treasure="${r.id}"><div class="treasure-art">${gardenObjectArt(r)}</div><div class="treasure-copy"><b>${esc(r.label)}</b><span>${away?'In Treasure Box':'In the garden'}</span></div><button class="${away?'place-item':'store-item'}" data-id="${r.id}">${away?'Place in garden':'Put away'}</button></div>`}).join(''):`<div class="treasure-empty">Keep spelling — your first garden treasure will unlock soon ✦</div>`;
  $('#modalRoot').innerHTML=`<div class="modal treasure-modal"><div class="modal-card treasure-panel"><div class="modal-head"><div><p class="eyebrow">MY COLLECTION</p><h2>🧺 Treasure Box</h2><p>Keep special items here, then bring them back whenever you want.</p></div><button id="closeTreasure" class="icon-btn">×</button></div><div class="treasure-grid">${cards}</div></div></div>`;
  $('#closeTreasure').onclick=()=>$('#modalRoot').innerHTML='';
  $$('.store-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}if(gardenInteraction&&interactionItem(gardenInteraction.type)===id)gardenInteraction=null;if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();openTreasureChest();playSfx('store')});
  $$('.place-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;state.garden.stored=state.garden.stored.filter(x=>x!==id);state.garden.pos[id]=gardenDefaultPos(id);save();renderGarden();openTreasureChest();playSfx('place')});
}

function releaseBunnyHere(pos){if(state.garden.bunnySeated){state.garden.pos.bunny={x:pos.x,y:pos.y};state.garden.bunnySeated=false}}
function reactToGardenDrop(id,p){
  const bp=id==='bunny'?p:bunnyDisplayPos();
  if(id==='bunny'){
    state.garden.bunnySeated=false;
    const options=[['bench','seat',16],['picnic','picnic',17],['mail','mail',17],['cat','friends',16],['birdbath','birds',16],['seedcrate','seeds',16],['arch','arch',18],['shed','shed',17]].filter(([key])=>gardenPlaced(key));
    const hit=options.map(x=>({x,d:gardenDistance(p,gardenPos(x[0]))})).filter(o=>o.d<o.x[2]).sort((a,b)=>a.d-b.d)[0];
    if(!hit)return false;const [key,type]=hit.x;
    if(type==='seat'){state.garden.bunnySeated=true;delete state.garden.pos.bunny}else state.garden.pos.bunny={x:p.x,y:p.y};
    triggerGardenInteraction(type,'bunny');return true
  }
  if(id==='bench'&&gardenPlaced('bench')&&gardenDistance(p,bp)<16){releaseBunnyHere(bp);state.garden.bunnySeated=true;delete state.garden.pos.bunny;triggerGardenInteraction('seat','bunny');return true}
  if(id==='picnic'&&gardenPlaced('picnic')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('picnic','bunny');return true}
  if(id==='mail'&&gardenPlaced('mail')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('mail','bunny');return true}
  if(id==='cat'&&gardenPlaced('cat')&&gardenDistance(p,bp)<16){triggerGardenInteraction('friends','bunny');return true}
  if(id==='birdbath'&&gardenPlaced('birdbath')&&gardenDistance(p,bp)<16){triggerGardenInteraction('birds','bunny');return true}
  if(id==='seedcrate'&&gardenPlaced('seedcrate')&&gardenDistance(p,bp)<16){triggerGardenInteraction('seeds','bunny');return true}
  if(id==='arch'&&gardenPlaced('arch')&&gardenDistance(p,bp)<18){triggerGardenInteraction('arch','bunny');return true}
  if(id==='shed'&&gardenPlaced('shed')&&gardenDistance(p,bp)<17){triggerGardenInteraction('shed','bunny');return true}
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
function treasureDropHit(x,y){const chest=$('#treasureChestBtn');if(!chest)return false;const r=chest.getBoundingClientRect();return x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12}
function makeDraggable(el){
  let pid=null;const scene=$('#gardenScene');
  el.onpointerdown=e=>{pid=e.pointerId;el._p=null;el._start={x:e.clientX,y:e.clientY};el.setPointerCapture?.(pid);el.classList.add('dragging');playSfx('pickup')};
  el.onpointermove=e=>{if(e.pointerId!==pid)return;const r=scene.getBoundingClientRect();const x=Math.max(4,Math.min(96,(e.clientX-r.left)/r.width*100));const y=Math.max(10,Math.min(91,(e.clientY-r.top)/r.height*100));el.style.left=`${x}%`;el.style.top=`${y}%`;el._p={x,y};const over=el.dataset.id!=='bunny'&&treasureDropHit(e.clientX,e.clientY);$('#treasureChestBtn')?.classList.toggle('drop-ready',over);el.classList.toggle('over-treasure',over)};
  el.onpointerup=e=>{if(e.pointerId!==pid)return;const id=el.dataset.id,p=el._p,start=el._start,dropToTreasure=id!=='bunny'&&treasureDropHit(e.clientX,e.clientY);pid=null;el.classList.remove('dragging','over-treasure');$('#treasureChestBtn')?.classList.remove('drop-ready');
    if(dropToTreasure){
      if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}
      if(gardenInteraction&&interactionItem(gardenInteraction.type)===id)gardenInteraction=null;
      if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();const chest=$('#treasureChestBtn');chest?.classList.add('treasure-catch');setTimeout(()=>chest?.classList.remove('treasure-catch'),650);playSfx('store');toast('Into the Treasure Box! ✦');return
    }
    if(!p||Math.hypot(e.clientX-(start?.x||e.clientX),e.clientY-(start?.y||e.clientY))<5){tapGardenObject(id);return}
    if(id==='bunny')state.garden.bunnySeated=false;
    state.garden.pos[id]=p;const reacted=reactToGardenDrop(id,p);save();if(!reacted)playSfx('drop');
    if(reacted||id==='bench'||id==='picnic'||id==='mail'||id==='cat'||id==='bunny')renderGarden();
  }
  el.onpointercancel=()=>{$('#treasureChestBtn')?.classList.remove('drop-ready');el.classList.remove('dragging','over-treasure');pid=null}
}

function renderPlayHome(){session=null;helpKind='';const draft=state.weekTestDraft?.weekId===state.week.id;const previous=state.weekTestResult?.weekId===state.week.id;$('#playView').innerHTML=`<div class="play-view"><div class="play-home"><div class="play-hero-card"><div><div class="play-new">TODAY’S SPELL ADVENTURE ✦</div><p class="eyebrow">READY WHEN YOU ARE</p><h1>Let’s make some words bloom.</h1><p>Listen, look at the picture clue, then spell with Apple Pencil. Every finished word makes your garden grow.</p><button class="giant" id="startSessionBtn">Start! ✦</button><section class="weekly-test-entry"><span class="weekly-entry-kicker">📝 THIS WEEK TEST</span><h2>Ready for the spelling test?</h2><p>Hear each word. Write on one answer sheet. Check all your answers at the end.</p><div class="weekly-entry-actions"><button id="startWeeklyTestBtn" class="primary-btn" type="button">${draft?'Resume this week’s test':'Start this week’s test'}</button>${draft?'<button id="newWeeklyTestBtn" class="secondary-btn" type="button">Start over</button>':''}${previous?'<button id="weeklyLastResultBtn" class="secondary-btn" type="button">Last test results</button>':''}</div></section><div class="play-meta"><span>${esc(state.week.title)}</span><span>${practiceIds().length} words</span><span>Real human pronunciation when available</span><span>Hints are always okay ♡</span></div></div><div class="play-mascot"><div class="mascot-bubble">🐰</div></div></div></div></div>`;$('#startSessionBtn').onclick=startSession;$('#startWeeklyTestBtn').onclick=()=>startWeeklyTest();$('#newWeeklyTestBtn')?.addEventListener('click',()=>startWeeklyTest(true));$('#weeklyLastResultBtn')?.addEventListener('click',renderWeeklyResult);syncBgm()}
// A weekly exam is a separate assessment, not a four-stage learning attempt.
// The same local state store is used, so the existing Parent Test Mode remains isolated.
function weeklyTestIds(){return[...new Set(state.week.ids)].filter(id=>!!state.lib[id]).slice(0,10)}
// Scribble can read a handwritten lower-case l as 1. Keep it as l only when
// that one recognition fix fits the expected spelling better than discarding it.
// Never alter actual alphabetic spelling mistakes or reveal the correct word.
function weeklyLetterDistance(a,b){
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const next=[i];
    for(let j=1;j<=b.length;j++)next[j]=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    prev=next;
  }
  return prev[b.length]
}
function weeklyAnswerText(raw,expected=''){
  let text=String(raw??'').normalize('NFKC').toLowerCase().replace(/[^a-z1]/g,'');
  while(text.includes('1')){
    const i=text.indexOf('1'),asL=text.slice(0,i)+'l'+text.slice(i+1),without=text.slice(0,i)+text.slice(i+1);
    text=expected.includes('l')&&weeklyLetterDistance(asL,expected)<weeklyLetterDistance(without,expected)?asL:without;
  }
  return text
}
function weeklyScore(ids,answers,lib){return ids.map(id=>{const answer=weeklyAnswerText(answers[id],lib[id].word);return{id,answer,correct:answer===lib[id].word}})}
function saveWeeklyDraft(){
  if(!weeklyTest)return;
  state.weekTestDraft={weekId:state.week.id,weekTitle:state.week.title,ids:[...weeklyTest.ids],answers:{...weeklyTest.answers},active:weeklyTest.active,startedAt:weeklyTest.startedAt};
  save()
}
function startWeeklyTest(fresh=false){
  const current=weeklyTestIds();if(!current.length)return toast('Add this week’s words in Parent first.');
  const draft=state.weekTestDraft;
  if(fresh&&draft?.weekId===state.week.id&&!confirm('Start a new test? Your unfinished answer sheet will be discarded.'))return;
  const resume=!fresh&&draft?.weekId===state.week.id&&Array.isArray(draft.ids)&&draft.ids.length===current.length&&draft.ids.every(id=>current.includes(id));
  const ids=resume?[...draft.ids]:shuffle(current);
  weeklyTest={ids,answers:Object.fromEntries(ids.map(id=>[id,resume&&typeof draft.answers?.[id]==='string'?weeklyAnswerText(draft.answers[id],state.lib[id].word):''])),active:resume?Math.max(0,Math.min(ids.length-1,Number(draft.active)||0)):0,startedAt:resume?draft.startedAt:new Date().toISOString()};
  session=null;helpKind='';saveWeeklyDraft();renderWeeklyTest();
  // The start button is a user gesture, so reading the first/current word can begin here.
  playWordAudio(state.lib[weeklyTest.ids[weeklyTest.active]],false,{userInitiated:true})
}
function setWeeklyActive(next,readAloud=false){
  if(!weeklyTest)return;
  weeklyTest.active=Math.max(0,Math.min(weeklyTest.ids.length-1,next));saveWeeklyDraft();
  $$('.weekly-question').forEach((row,i)=>row.classList.toggle('active',i===weeklyTest.active));
  const label=$('#weeklyNow');if(label)label.textContent=`Question ${weeklyTest.active+1} of ${weeklyTest.ids.length}`;
  const nextBtn=$('#weeklyNextBtn');if(nextBtn)nextBtn.textContent=weeklyTest.active===weeklyTest.ids.length-1?'Back to question 1 ↻':'Next word →';
  if(readAloud)playWordAudio(state.lib[weeklyTest.ids[weeklyTest.active]],false,{userInitiated:true})
}
function renderWeeklyTest(){
  if(!weeklyTest)return renderPlayHome();
  const total=weeklyTest.ids.length,answered=weeklyTest.ids.filter(id=>norm(weeklyTest.answers[id])).length;
  $('#playView').innerHTML=`<div class="play-view weekly-test-view"><div class="weekly-sheet"><header class="weekly-sheet-head"><div><span class="weekly-entry-kicker">📝 THIS WEEK TEST</span><h1>My spelling test</h1><p>${esc(state.week.title)} · Listen and write. Answers stay hidden until you finish.</p></div><div class="weekly-header-actions"><button id="weeklyLeaveBtn" class="secondary-btn" type="button">Save & exit</button><button id="weeklyGradeTopBtn" class="primary-btn" type="button">Check answers ✓</button></div></header><div class="weekly-instructions"><b id="weeklyNow">Question ${weeklyTest.active+1} of ${total}</b><span id="weeklyAnswered">${answered} / ${total} answered</span><span>Tap 🔊 to hear a word again. You can change any answer.</span></div><div class="weekly-answer-sheet">${weeklyTest.ids.map((id,i)=>`<div class="weekly-question ${i===weeklyTest.active?'active':''}" data-id="${esc(id)}" data-index="${i}"><div class="weekly-question-head"><span class="weekly-number">${i+1}.</span><button type="button" class="weekly-hear" aria-label="Hear question ${i+1}" data-index="${i}">🔊 <span>Listen</span></button></div><input type="text" class="weekly-answer" inputmode="none" virtualkeyboardpolicy="manual" data-id="${esc(id)}" data-index="${i}" value="${esc(weeklyTest.answers[id])}" aria-label="Spelling answer for question ${i+1}" placeholder="Write with Apple Pencil" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done"></div>`).join('')}</div><footer class="weekly-sheet-actions"><button id="weeklyNextBtn" class="secondary-btn" type="button">${weeklyTest.active===total-1?'Back to question 1 ↻':'Next word →'}</button><button id="weeklyGradeBtn" class="primary-btn" type="button">Check all ${total} answers ✓</button></footer><p class="weekly-sheet-note">No hints, no answer checks yet. This test does not change your Garden, XP, or spelling mastery. Practice after grading can grow the Garden.</p></div></div>`;
  $('#weeklyLeaveBtn').onclick=()=>{saveWeeklyDraft();renderPlayHome()};
  $$('.weekly-hear').forEach(button=>button.onclick=()=>setWeeklyActive(Number(button.dataset.index),true));
  $$('.weekly-answer').forEach(input=>{
    const id=input.dataset.id,index=Number(input.dataset.index);
    // A finger should scroll/tap controls, not raise an on-screen keyboard. Let Pencil Scribble own the field.
    input.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'){e.preventDefault();input.blur();return}
      if(e.pointerType==='pen'){
        try{if(document.activeElement!==input)input.focus({preventScroll:true})}catch{}
        try{navigator.virtualKeyboard?.hide?.()}catch{}
      }
    },true);
    input.addEventListener('focus',()=>{setWeeklyActive(index,false);try{navigator.virtualKeyboard?.hide?.()}catch{}});
    const storeWeeklyAnswer=(cleanField=true)=>{
      const cleaned=weeklyAnswerText(input.value,state.lib[id].word);
      // Scribble sometimes inserts a space while the Pencil pauses between parts of a compound word.
      // Leave IME composition alone until it commits, then remove spaces from the visible text and saved answer.
      if(cleanField&&input.value!==cleaned)input.value=cleaned;
      weeklyTest.answers[id]=cleaned;saveWeeklyDraft();
      const answered=weeklyTest.ids.filter(x=>norm(weeklyTest.answers[x])).length;
      const n=$('#weeklyAnswered');if(n)n.textContent=`${answered} / ${weeklyTest.ids.length} answered`;
      try{navigator.virtualKeyboard?.hide?.()}catch{}
    };
    input.addEventListener('input',e=>storeWeeklyAnswer(!e.isComposing));
    input.addEventListener('compositionend',()=>storeWeeklyAnswer(true));
    input.addEventListener('change',()=>storeWeeklyAnswer(true));
  });
  $('#weeklyNextBtn').onclick=()=>setWeeklyActive((weeklyTest.active+1)%total,true);
  $('#weeklyGradeBtn').onclick=gradeWeeklyTest;
  $('#weeklyGradeTopBtn').onclick=gradeWeeklyTest;
  syncBgm()
}
function gradeWeeklyTest(){
  if(!weeklyTest)return;
  // Grab the actual field contents before grading; Scribble may commit its final input on blur.
  document.activeElement?.blur?.();
  $$('.weekly-answer').forEach(input=>weeklyTest.answers[input.dataset.id]=weeklyAnswerText(input.value,state.lib[input.dataset.id].word));
  const blank=weeklyTest.ids.filter(id=>!norm(weeklyTest.answers[id])).length;
  const message=blank?`${blank} ${blank===1?'answer is':'answers are'} blank. Finish and grade all ${weeklyTest.ids.length} answers anyway?`:`Finished writing? Grade all ${weeklyTest.ids.length} answers now?`;
  if(!confirm(message))return;
  const items=weeklyScore(weeklyTest.ids,weeklyTest.answers,state.lib);
  state.weekTestResult={weekId:state.week.id,weekTitle:state.week.title,gradedAt:new Date().toISOString(),items};
  delete state.weekTestDraft;weeklyTest=null;save();playSfx(items.every(x=>x.correct)?'finish':'correct');renderWeeklyResult()
}
function renderWeeklyResult(){
  const result=state.weekTestResult;
  if(!result||result.weekId!==state.week.id)return renderPlayHome();
  const items=result.items||[],correct=items.filter(item=>item.correct).length,wrong=items.filter(item=>!item.correct&&state.lib[item.id]);
  $('#playView').innerHTML=`<div class="play-view weekly-test-view"><div class="weekly-sheet weekly-results"><div class="weekly-results-head"><span class="weekly-entry-kicker">📝 THIS WEEK TEST · RESULTS</span><h1>${correct} / ${items.length} correct</h1><p>${esc(result.weekTitle||state.week.title)} · You finished your answer sheet!</p><p class="weekly-results-note">${wrong.length?'Check the words below, then practice just the ones you missed.':'All correct! Your Garden is ready when you are.'}</p></div><div class="weekly-result-list">${items.map((item,i)=>{const word=state.lib[item.id]?.word||item.id;return`<div class="weekly-result-row ${item.correct?'is-correct':'needs-review'}"><span class="weekly-result-number">${i+1}.</span><span class="weekly-result-status">${item.correct?'✓':'↻'}</span><div>${item.correct?`<b>${esc(item.answer)}</b>`:(window.WordGardenWeeklyDiff?.render(item.answer,word)||`<b>${item.answer?esc(item.answer):'<i>No answer</i>'}</b><small>Correct spelling: <strong>${esc(word)}</strong></small>`)}</div><button class="weekly-result-hear" type="button" data-id="${esc(item.id)}" aria-label="Hear question ${i+1}">🔊</button></div>`}).join('')}</div><div class="weekly-result-actions">${wrong.length?`<button id="weeklyPracticeWrongBtn" class="primary-btn" type="button">Practice ${wrong.length} missed ${wrong.length===1?'word':'words'} · Stage 3 → 4</button>`:''}<button id="weeklyRetakeBtn" class="secondary-btn" type="button">Try the test again</button><button id="weeklyResultDoneBtn" class="secondary-btn" type="button">Back to Play</button></div><p class="weekly-sheet-note">The test score is saved separately. Only the optional Stage 3 → Stage 4 review gives garden growth and updates learning data.</p></div></div>`;
  $$('.weekly-result-hear').forEach(b=>b.onclick=()=>{const w=state.lib[b.dataset.id];if(w)playWordAudio(w,false,{userInitiated:true})});
  $('#weeklyPracticeWrongBtn')?.addEventListener('click',()=>{
    const ids=[...new Set(wrong.map(x=>x.id))];if(!ids.length)return;
    weeklyTest=null;session={count:0,goal:ids.length,ids,doneIds:[],last:'',q:null,xp:0,reviewMissed:true};helpKind='';renderTask()
  });
  $('#weeklyRetakeBtn').onclick=()=>startWeeklyTest(true);
  $('#weeklyResultDoneBtn').onclick=renderPlayHome;
  syncBgm()
}
function practiceIds(){return[...new Set([...state.week.ids,...Object.values(state.lib).filter(w=>w.parentPriority).map(w=>w.id)])].filter(id=>!!state.lib[id])}
function startSession(){const ids=practiceIds();if(!ids.length)return toast('Add words in Parent first.');playSfx('start');syncBgm();session={count:0,goal:Math.min(GOAL,ids.length),ids,doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()}
function chooseWord(){let pool=(session.ids||practiceIds()).filter(id=>!session.doneIds.includes(id)).map(id=>state.lib[id]).filter(Boolean);if(pool.length>1)pool=pool.filter(w=>w.id!==session.last);const scored=pool.map(w=>{const l=w.learn,max=Math.max(0,...l.weak),rate=l.attempts?l.mistakes/l.attempts:0;return{w,score:(w.mioriSpelling&&w.mioriSpelling!==w.word?5:0)+max*.7+rate*5+Math.random()}}).sort((a,b)=>Number(!!b.w.parentPriority)-Number(!!a.w.parentPriority)||b.score-a.score);return scored[0]?.w}
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
function newQuestion(w,stage=1,range=null){range=range||focusRange(w);const n=stage===3?range.end-range.start:w.word.length;const q={id:w.id,stage,range,first:true,wrong:[],letters:stage>=3?Array(n).fill(''):[],fullAnswer:'',traceLetters:stage===3?Array(w.word.length).fill(''):[],feedback:null,hint:null,mode:'write'};if(stage===1)q.choices=wholeChoices(w,range);if(stage===2)q.choices=gapChoices(w,range);return q}
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
  if(!session)return renderPlayHome();syncBgm();if(session.count>=session.goal)return finishSession();if(!session.q){const w=chooseWord();if(!w)return finishSession();session.last=w.id;session.q=newQuestion(w,session.reviewMissed?3:1)}
  const q=session.q,w=state.lib[q.id];
  $('#playView').innerHTML=`<div class="play-view"><div class="game-topline"><button id="exitPlayBtn" class="icon-btn">×</button><div><div class="stage-labels"><span>Stage ${q.stage} · ${STAGE_NAMES[q.stage]}</span><span>${session.count+1} / ${session.goal}</span></div><div class="stage-track"><div class="stage-fill" style="width:${((q.stage-1)/4)*100}%"></div></div></div><div class="session-xp">${treasureStatusText()}</div></div><div class="game-card"><div class="word-audio-row"><button id="audioBtn" class="audio-orb word-sound-button" aria-label="Hear the spelling word"><span class="speaker-glyph">🔊</span><small>WORD</small></button><div><p class="task-prompt">${STAGE_PROMPTS[q.stage]}</p><p class="task-subprompt">${q.stage===3?'Trace the dotted letters, then write the empty boxes.':q.stage===4?'Write the whole word in one smooth motion. Tap Clear to try again.':'You can play the sound again.'}</p><span id="voicePill" class="voice-pill">${w.pronunciationUrl?'● Human recording':'○ Device voice while human audio loads'}</span></div></div>${clueHtml(w)}<div id="questionArea" class="question-area">${questionHtml(w,q)}</div><div id="feedback" class="feedback ${q.feedback?.bad?'bad':q.feedback?.good?'good':''}">${feedbackText(q)}</div><div class="help-row assist-dock"><button id="hintBtn" class="help-btn hint assist-btn"><span class="assist-icon">✦</span><span><b>Hint</b><small>Give me a clue</small></span></button><button id="peekBtn" class="help-btn peek assist-btn"><span class="assist-icon">◉</span><span><b>Peek</b><small>Show the word</small></span></button></div></div></div>`;
  $('#exitPlayBtn').onclick=renderPlayHome;$('#audioBtn').onclick=()=>playWordAudio(w,false,{userInitiated:true});$('#pictureWordAudioBtn')?.addEventListener('click',()=>playWordAudio(w,false,{userInitiated:true}));$('#meaningEnAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningEn||w.pictureCue||'',{lang:'en-US',button:e.currentTarget}));$('#meaningJaAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningJa||'',{lang:'ja-JP',button:e.currentTarget}));$('#exampleAudioBtn')?.addEventListener('click',e=>speakLearningText(w.example||'',{lang:'en-US',button:e.currentTarget}));$('#hintBtn').onclick=()=>showHint(w,q);$('#peekBtn').onclick=()=>showPeek(w);bindQuestion(w,q);setTimeout(()=>playWordAudio(w,false,{auto:true}),120);if(!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w).then(found=>{if(found&&session?.q?.id===w.id){const pill=$('#voicePill');if(pill)pill.textContent='● Human recording'}});
}
function questionHtml(w,q){
  const r=q.range;if(q.stage===1)return`<div class="choice-grid">${q.choices.map(c=>`<button class="choice-btn ${q.wrong.includes(c)?'wrong':''}" data-choice="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
  if(q.stage===2)return`<div style="width:100%"><div class="gap-word">${esc(w.word.slice(0,r.start))}<span class="gap-slot">?</span>${esc(w.word.slice(r.end))}</div><div class="choice-grid" style="margin:20px auto 0">${q.choices.map(c=>`<button class="choice-btn ${q.wrong.includes(c)?'wrong':''}" data-choice="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`;
  return handwritingHtml(w,q);
}
function flowComparisonHtml(attempt,correct){
  return window.WordGardenWeeklyDiff?.render(attempt,correct)||`<small>Correct spelling: ${esc(correct)}</small>`
}
function fullWordHandwritingHtml(w,q){
  const answer=q.fullAnswer||'';
  return `<div class="spell-wrap flow-word-wrap"><p class="flow-word-note">Listen, then write the whole word without stopping between letters.</p><label class="flow-word-label" for="stage4WordInput">MY SPELLING</label><input id="stage4WordInput" class="flow-word-input" type="text" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Write the word with Apple Pencil" aria-label="Write the entire spelling word" value="${esc(answer)}"><div class="flow-word-controls"><button type="button" id="clearFlowBtn" class="secondary-btn">Clear ✎</button><button id="checkAnswerBtn" class="check-answer">Check</button></div>${q.feedback?.bad?`<div class="flow-word-diff">${flowComparisonHtml(answer,w.word)}</div>`:''}${hintHtml(q)}</div>`
}
function handwritingHtml(w,q){
  if(q.stage===4)return fullWordHandwritingHtml(w,q);
  const expected=expectedText(w,q);const r=q.stage===3?q.range:{start:0,end:w.word.length};let boxes=[];
  if(q.stage===3&&!Array.isArray(q.traceLetters))q.traceLetters=Array(w.word.length).fill('');
  for(let full=0;full<w.word.length;full++){
    if(q.stage===3&&(full<r.start||full>=r.end)){
      const guide=esc(w.word[full]),traced=q.traceLetters[full]||'';
      boxes.push(`<div class="trace-cell ${traced?'traced':''}" data-guide-full="${full}"><svg class="trace-guide" viewBox="0 0 72 72" aria-hidden="true"><text x="36" y="53" text-anchor="middle">${guide}</text></svg>${traced?`<div class="trace-written" data-trace-full="${full}" aria-label="Traced letter ${guide}">${esc(traced)}</div>`:`<input class="trace-input" data-trace-full="${full}" value="" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Trace letter ${guide}">`}</div>`);continue
    }
    if(q.stage===3&&full>=r.start&&full<r.end){
      if(full===r.start){
        const attempt=q.letters.join('');
        boxes.push(`<input id="stage3GapInput" class="stage3-gap-flow ${q.feedback?.bad?'flow-needs-fix':''} ${q.hint?'hint-target':''}" style="grid-column:span ${r.end-r.start};--gap-count:${r.end-r.start}" type="text" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" value="${esc(attempt)}" placeholder="Write ${r.end-r.start===1?'letter':'letters'}" aria-label="Write the missing letters together">`);
      }
      continue;
    }
    const local=full-r.start;const value=q.letters[local]||'';let cls=value?'filled':'';
    if(q.feedback?.bad){if(!value)cls='missing';else cls=value===expected[local]?'ok':'bad'}
    if(q.hint?.local===local)cls+=' hint-target';
    if(value){
      boxes.push(`<div class="letter-box written-box ${cls.trim()}" data-local="${local}" data-full="${full}" role="button" aria-label="Letter ${full+1}: ${esc(value)}. Scratch to erase.">${esc(value)}</div>`);
    }else{
      boxes.push(`<input class="letter-box empty-box ${cls.trim()}" data-local="${local}" data-full="${full}" value="" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder=" " aria-label="Letter ${full+1}">`);
    }
  }
  const stage3=q.stage===3;
  const note=stage3?`<div class="stage3-bridge-note"><b>Trace → remember.</b> Follow the dotted letters, then write the missing letters together in the purple area.</div>`:`<div class="box-note">Write the whole word from memory.</div>`;
  return`<div class="spell-wrap"><div class="pencil-modebar"><button id="writeModeBtn" class="mode-btn write ${q.mode==='write'?'on':''}">✎ Write</button><button id="eraseModeBtn" class="mode-btn erase ${q.mode==='erase'?'on':''}">⌫ Eraser</button></div>${note}<div id="letterRow" class="letter-row ${stage3?'stage3-trace-row':''} ${q.mode==='erase'?'erase-mode':''}" style="--letters:${w.word.length}">${boxes.join('')}</div>${q.feedback?.bad?`<div class="flow-word-diff">${flowComparisonHtml(q.letters.join(''),expected)}</div>`:''}${hintHtml(q)}<button id="checkAnswerBtn" class="check-answer">Check</button></div>`;
}
function hintHtml(q){if(!q.hint)return'';if(q.hint.stage4)return`<div class="hint-strip flow-hint"><span>Remember this part: <b>${esc(q.hint.text)}</b></span><button id="hintCloseBtn" class="tiny-audio" type="button" aria-label="Close hint">×</button></div>`;return`<div class="hint-strip"><button id="hintAudioBtn" class="tiny-audio">🔊</button><span>Fix the purple box:</span>${q.hint.options.map(c=>`<button class="hint-choice" data-hint="${c}">${c}</button>`).join('')}<button id="hintCloseBtn" class="tiny-audio">×</button></div>`}
function feedbackText(q){if(q.feedback?.good)return q.first?'Perfect — you remembered it! ✦':'Yes! You fixed it. That counts. ♡';if(q.feedback?.bad)return q.stage===4?'Almost! Compare your letters below, then change your answer.':q.stage===3?'Almost! Check the missing letters below and try again.':'Almost. Green is right. Red or dotted boxes need a fix — stay on this stage.';return''}
function bindQuestion(w,q){
  if(q.stage<3){$$('[data-choice]').forEach(b=>b.onclick=()=>pickChoice(b,w,q));return}
  if(q.stage===4){$('#checkAnswerBtn').onclick=()=>checkHandwriting(w,q);$('#clearFlowBtn').onclick=()=>{q.fullAnswer='';q.feedback=null;q.hint=null;renderTask()};bindFlowWriting($('#stage4WordInput'),w,q);$('#hintCloseBtn')?.addEventListener('click',()=>{q.hint=null;renderTask()});return}
  $('#writeModeBtn').onclick=()=>{q.mode='write';renderTask()};$('#eraseModeBtn').onclick=()=>{q.mode='erase';renderTask()};$('#checkAnswerBtn').onclick=()=>checkHandwriting(w,q);$('#hintAudioBtn')?.addEventListener('click',()=>playWordAudio(w,true,{userInitiated:true}));$('#hintCloseBtn')?.addEventListener('click',()=>{q.hint=null;renderTask()});$$('[data-hint]').forEach(b=>b.onclick=()=>chooseHint(b,w,q));
  bindFlowWriting($('#stage3GapInput'),w,q);const boxes=$$('.letter-box[data-local]');boxes.forEach((box,index)=>bindLetterBox(box,index,w,q));$$('.trace-input[data-trace-full]').forEach(input=>bindTraceBox(input,Number(input.dataset.traceFull),w,q));
  // Never pre-focus a writing field. On iPad that can open the software keyboard and it also races with fast Pencil movement.
  document.activeElement?.blur?.();
}
function bindFlowWriting(input,w,q){
  if(!input)return;
  const update=(finishComposition=true)=>{
    if(!finishComposition)return;
    const cleaned=weeklyAnswerText(input.value,expectedText(w,q));
    if(input.value!==cleaned)input.value=cleaned;
    if(q.stage===4)q.fullAnswer=cleaned;else q.letters=[...cleaned];
    q.feedback=null;q.hint=null;
    const fb=$('#feedback');if(fb){fb.textContent='';fb.className='feedback'}
    $('.flow-word-diff')?.remove();$('.hint-strip')?.remove();
    try{navigator.virtualKeyboard?.hide?.()}catch{}
  };
  input.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'){e.preventDefault();input.blur();return}
    if(e.pointerType==='pen'){
      try{if(document.activeElement!==input)input.focus({preventScroll:true})}catch{}
      try{navigator.virtualKeyboard?.hide?.()}catch{}
    }
  },true);
  input.addEventListener('input',e=>update(!e.isComposing));
  input.addEventListener('compositionend',()=>update(true));
  input.addEventListener('change',()=>update(true));
  input.addEventListener('focus',()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}});
}
function bindTraceBox(input,full,w,q){
  const expected=w.word[full]||'';
  input.addEventListener('pointerdown',e=>{
    const pointer=e.pointerType||'';
    if(pointer==='touch'){e.preventDefault();input.blur();return}
    if(q.mode==='erase'){e.preventDefault();e.stopPropagation();input.value='';return}
    if(q.mode==='write'&&pointer==='pen'){
      input.setAttribute('inputmode','none');
      try{if(document.activeElement!==input)input.focus({preventScroll:true})}catch{}
      setTimeout(()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}},0)
    }
  },true);
  input.addEventListener('touchstart',e=>{e.preventDefault();input.blur()},{passive:false});
  input.addEventListener('contextmenu',e=>e.preventDefault());input.addEventListener('dragstart',e=>e.preventDefault());
  input.addEventListener('keydown',e=>e.preventDefault());
  input.addEventListener('beforeinput',e=>{const t=String(e.inputType||'');if(t.startsWith('delete'))e.preventDefault()});
  input.addEventListener('input',e=>{
    if(q.mode==='erase'){e.target.value='';return}
    const cleaned=normalizeScribbleLetter(e.target.value,expected);if(!cleaned){e.target.value='';return}
    const cell=e.target.closest('.trace-cell');
    if(cleaned!==expected){e.target.value='';cell?.classList.add('trace-retry');setTimeout(()=>cell?.classList.remove('trace-retry'),320);return}
    if(!Array.isArray(q.traceLetters))q.traceLetters=Array(w.word.length).fill('');q.traceLetters[full]=cleaned;
    if(cell){cell.classList.add('traced');const done=document.createElement('div');done.className='trace-written';done.dataset.traceFull=String(full);done.setAttribute('aria-label',`Traced letter ${expected}`);done.textContent=cleaned;e.target.replaceWith(done)}
    try{navigator.virtualKeyboard?.hide?.()}catch{}
  });
  input.addEventListener('focus',()=>{try{input.setSelectionRange(0,0)}catch{};try{navigator.virtualKeyboard?.hide?.()}catch{}})
}
function startFilledBoxScratch(e,index,w,q,input){
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
function checkHandwriting(w,q){const field=q.stage===4?$('#stage4WordInput'):q.stage===3?$('#stage3GapInput'):null;if(field){field.blur?.();const clean=weeklyAnswerText(field.value,expectedText(w,q));if(q.stage===4)q.fullAnswer=clean;else q.letters=[...clean]}const attempt=q.stage===4?q.fullAnswer:q.letters.join(''),correct=expectedText(w,q);if(attempt===correct)right(w,q);else{wrong(w,q,attempt,correct);q.feedback={bad:true};q.hint=null;renderTask();playSfx('wrong')}}
function wrong(w,q,attempt,correct){const l=w.learn;l.attempts++;l.mistakes++;l.stageMist[q.stage]=(l.stageMist[q.stage]||0)+1;l.lastWrong=q.stage===3?w.word.slice(0,q.range.start)+attempt+w.word.slice(q.range.end):attempt;l.last=today();q.first=false;state.stats.answers=(state.stats.answers||0)+1;if(q.stage>1){const aligned=alignChars(correct,attempt);aligned.slots.forEach((slot,i)=>{if(!slot||slot.state!=='ok'){const full=(q.stage===3?q.range.start:0)+i;l.weak[full]=(l.weak[full]||0)+2}})}save()}
function right(w,q){
  const l=w.learn;l.attempts++;l.correct++;if(q.first)l.first++;l.last=today();state.stats.answers=(state.stats.answers||0)+1;for(let i=q.range.start;i<q.range.end;i++)l.weak[i]=Math.max(0,(l.weak[i]||0)-1);playSfx(q.stage===4?'finish':'correct');q.feedback={good:true};
  if(q.stage<4){save();renderTask();const stage=q.stage;setTimeout(()=>{if(!session?.q||session.q.id!==w.id||session.q.stage!==stage)return;session.q=newQuestion(w,stage+1,q.range);helpKind='';renderTask()},520);return}
  const gain=30,beforeGrowth=state.garden.growth,beforeXp=state.xp;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;session.xp+=gain;session.count++;if(!session.doneIds.includes(w.id))session.doneIds.push(w.id);state.recentWords=[{id:w.id,date:today()},...(state.recentWords||[]).filter(x=>x.id!==w.id)].slice(0,8);const askFeeling=(Math.floor(state.xp/30)%3===0);
  const unlockedReward=rewards.find(r=>r.id!=='bunny'&&beforeXp<r.xp&&state.xp>=r.xp)||null;
  if(unlockedReward&&!state.garden.stored.includes(unlockedReward.id))state.garden.stored.push(unlockedReward.id);
  const finished=session.count>=session.goal;gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,beforeGrowth,growth:state.garden.growth,finished,askFeeling,unlock:unlockedReward?{id:unlockedReward.id,label:unlockedReward.label,icon:unlockedReward.icon}:null};session.q=null;save();
  setTimeout(()=>setView('garden'),360)
}
function renderReward(w,gain){const finished=session.count>=session.goal;$('#playView').innerHTML=`<div class="play-view"><div class="reward-screen"><div class="reward-card"><div class="big">${esc(w.pictureEmoji||'🌱')}</div><p class="eyebrow">WORD COMPLETE ✦</p><h1>${esc(w.word)}</h1><p class="muted">You finished Stage 1 → 2 → 3 → 4.</p><div class="reward-chips"><span>🎁 Treasure progress +1</span><span>🌱 Garden grew</span><span>✎ Pencil practice saved</span></div><button id="nextWordBtn" class="primary-btn">${finished?'Finish & see Garden':'Next word →'}</button></div></div></div>`;$('#nextWordBtn').onclick=()=>{if(finished)finishSession();else{session.q=null;helpKind='';renderTask()}}}
function finishSession(){const doneCount=session?.count||0,earned=session?.xp||0;state.stats.sessions=(state.stats.sessions||0)+1;save();session=null;gardenCelebration=null;$('#playView').innerHTML=`<div class="play-view"><div class="reward-screen"><div class="reward-card"><div class="big">🌷</div><p class="eyebrow">PLAY COMPLETE</p><h1>You made the garden grow!</h1><p class="muted">${doneCount} finished words made your garden grow.</p><div class="reward-chips"><span>${doneCount} words complete</span><span>🎁 Every 3 words unlocks a treasure</span></div><button id="seeGardenBtn" class="primary-btn">See Garden</button></div></div></div>`;$('#seeGardenBtn').onclick=()=>setView('garden')}
function showHint(w,q){playSfx('hint');if(q.stage<3){playWordAudio(w,true);toast('Listen slowly, then try again.');return}w.learn.hints++;save();if(q.stage===4){q.hint={stage4:true,text:w.word.slice(q.range.start,q.range.end)};renderTask();setTimeout(()=>playWordAudio(w,true),70);return}const exp=expectedText(w,q);let local=q.letters.findIndex((x,i)=>x!==exp[i]);if(local<0)local=firstEmptyIndex(q);const correct=exp[local];let alts=[...(CONF[correct]||['a','e','i'])].filter(x=>x!==correct);while(alts.length<2){const c='abcdefghijklmnopqrstuvwxyz'[(local+alts.length*7)%26];if(c!==correct&&!alts.includes(c))alts.push(c)}q.hint={local,correct,options:shuffle([correct,...alts.slice(0,2)])};q.mode='write';renderTask();setTimeout(()=>playWordAudio(w,true),70)}
function chooseHint(button,w,q){if(button.dataset.hint!==q.hint?.correct){button.classList.add('nope');setTimeout(()=>button.classList.remove('nope'),380);playSfx('wrong');return}button.classList.add('yes');q.letters[q.hint.local]=q.hint.correct;q.hint=null;q.feedback=null;playSfx('correct');setTimeout(()=>renderTask(),240)}
function showPeek(w){playSfx('peek');w.learn.peeks++;save();playWordAudio(w);const el=document.createElement('div');el.className='peek-overlay';el.innerHTML=`<b>${esc(w.word)}</b>`;document.body.appendChild(el);setTimeout(()=>el.remove(),2200)}
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
  if(word.pronunciationUrl&&!storedHumanAudioLooksSafe(word)){
    word.pronunciationUrl='';word.pronunciationSource='';word.audioTried=false;save();setPill('○ Finding a word-only recording…','human-wait');
    const found=await resolveHumanAudioForWord(word);if(found)return playWordAudio(word,slow,{auto,userInitiated})
  }
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
function humanAudioTokens(text){
  try{text=decodeURIComponent(String(text||''))}catch{text=String(text||'')}
  text=text.replace(/^File:/i,'').replace(/\.(ogg|oga|mp3|wav|m4a)(?:\?.*)?$/i,'').replace(/[_+()\[\],.-]+/g,' ').toLowerCase();
  return text.match(/[a-z]+/g)||[]
}
function isWordOnlyHumanAudio(word,title='',url=''){
  word=norm(word);if(!word)return false;
  const source=title||String(url||'').split('/').pop()||'';const tokens=humanAudioTokens(source);
  const meta=new Set(['en','eng','english','us','usa','uk','gb','au','ca','american','british','pronunciation','pronounce','audio','voice','spoken','male','female','wiktionary','commons','file']);
  const meaningful=tokens.filter(t=>!meta.has(t));
  return meaningful.length===1&&meaningful[0]===word
}
function storedHumanAudioLooksSafe(w){
  if(!w?.pronunciationUrl)return false;
  const auto=String(w.pronunciationSource||'').toLowerCase().includes('wikimedia')||/wikimedia\.org|upload\.wikimedia\.org/i.test(w.pronunciationUrl);
  return !auto||isWordOnlyHumanAudio(w.word,'',w.pronunciationUrl)
}
async function findHumanAudio(wordText){
  const word=norm(wordText);if(!word)return'';
  try{
    const q=encodeURIComponent(`${word} pronunciation`);
    const url=`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);const res=await fetch(url,{signal:controller.signal});clearTimeout(timer);if(!res.ok)return'';
    const data=await res.json();const pages=Object.values(data.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.url);
    const scored=pages.map(p=>{const title=String(p.title||''),low=title.toLowerCase(),info=p.imageinfo[0],audioUrl=info.url||'';
      if(!isWordOnlyHumanAudio(word,title,audioUrl))return null;
      let score=20;if(low.includes(word))score+=8;if(/en[-_ ]?(us|uk|gb)|english|american|british/i.test(title))score+=5;if(/pronunciation|pronounce/i.test(title))score+=3;
      if(/\.mp3(?:$|\?)/i.test(audioUrl))score+=8;else if(/\.(m4a|wav)(?:$|\?)/i.test(audioUrl))score+=6;else if(/\.(ogg|oga)(?:$|\?)/i.test(audioUrl))score+=4;
      return{url:audioUrl,score,title}
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    return scored[0]?.url||''
  }catch{return''}
}
async function resolveHumanAudioForWord(w,{announce=false}={}){if(!w||w.pronunciationUrl)return false;w.audioTried=true;const found=await findHumanAudio(w.word);if(!found){save();if(announce)toast('No clear human recording found. Device voice will be used.');return false}w.pronunciationUrl=found;w.pronunciationSource='Wikimedia Commons';save();if(announce)toast('Human pronunciation found.');return true}
function ensureAudioCtx(){
  if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;audioCtx=new C()}
  if(audioCtx.state==='suspended')audioCtx.resume?.();return audioCtx
}
function tone(ctx,f,start,dur,gain=.035,type='sine',dest=null){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(gain,start+.018);g.gain.exponentialRampToValueAtTime(.0001,start+dur);o.connect(g);g.connect(dest||ctx.destination);o.start(start);o.stop(start+dur+.03)}
function playSfx(type){
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
function scheduleBgmBar(){
  if(currentView!=='garden'||!audioUnlocked||!state.settings.music||bgmTimer===null)return;const ctx=ensureAudioCtx();if(!ctx||!musicGain)return;const now=ctx.currentTime+.05,isPlay=currentView==='play';
  const gardenPhrases=[[[659,0],[784,.82],[880,1.78],[784,3.15]],[[587,0],[659,.9],[784,1.95],[659,3.25]],[[659,0],[880,1.05],[988,2.2],[784,3.45]]];
  const playPhrases=[[[523,0],[659,1.12],[587,2.3],[659,3.65]],[[494,0],[587,1.08],[659,2.28],[587,3.62]],[[523,0],[587,1.14],[698,2.35],[659,3.68]]];
  const phrases=isPlay?playPhrases:gardenPhrases,phrase=phrases[Math.floor(Date.now()/5600)%phrases.length];phrase.forEach(([f,t],i)=>tone(ctx,f,now+t,.58,i===0?.0065:.005,'sine',musicGain));
  tone(ctx,isPlay?261.6:329.6,now+.18,1.05,isPlay?.0018:.0025,'sine',musicGain)
}
function startBgm(){
  if(!audioUnlocked||!state.settings.music||bgmTimer!==null||currentView!=='garden')return;const ctx=ensureAudioCtx();if(!ctx)return;musicGain=ctx.createGain();musicGain.gain.setValueAtTime(.0001,ctx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.2,ctx.currentTime+.5);musicGain.connect(ctx.destination);bgmTimer=setInterval(scheduleBgmBar,5600);scheduleBgmBar();renderTopbar()
}
function stopBgm(){
  if(bgmTimer!==null){clearInterval(bgmTimer);bgmTimer=null}if(musicGain&&audioCtx){try{musicGain.gain.cancelScheduledValues(audioCtx.currentTime);musicGain.gain.setValueAtTime(Math.max(.0001,musicGain.gain.value),audioCtx.currentTime);musicGain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.18)}catch{};const old=musicGain;setTimeout(()=>{try{old.disconnect()}catch{}},260)}musicGain=null;renderTopbar()
}
function syncBgm(){const should=state.settings.music&&currentView==='garden';if(should)startBgm();else stopBgm()}


function alignChars(target,typed){target=norm(target);typed=norm(typed);const n=target.length,m=typed.length,d=Array.from({length:n+1},()=>Array(m+1).fill(0));for(let i=0;i<=n;i++)d[i][0]=i;for(let j=0;j<=m;j++)d[0][j]=j;for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)d[i][j]=Math.min(d[i-1][j-1]+(target[i-1]===typed[j-1]?0:1),d[i-1][j]+1,d[i][j-1]+1);const slots=Array(n);let i=n,j=m;while(i||j){const diag=i&&j?d[i-1][j-1]+(target[i-1]===typed[j-1]?0:1):1e9;if(i&&j&&d[i][j]===diag){slots[i-1]={expected:target[i-1],typed:typed[j-1],state:target[i-1]===typed[j-1]?'ok':'bad'};i--;j--;continue}if(i&&d[i][j]===d[i-1][j]+1){slots[i-1]={expected:target[i-1],typed:'',state:'missing'};i--;continue}j--}return{slots}}

function resetOneLearning(id){const w=state.lib[id];if(!w)return;if(confirm(`Reset learning data for “${w.word}” only?`)){w.learn=learning(w.word);save();renderParent();toast(`${w.word}: learning data reset.`)}}
function resetAllLearning(){if(!confirm('Reset learning data for ALL words? Garden items and XP will stay.'))return;Object.values(state.lib).forEach(w=>w.learn=learning(w.word));save();renderParent();toast('All learning data reset.')}
function resetGardenLayout(){if(!confirm('Reset garden positions? Items in the Treasure Box will stay there.'))return;state.garden.pos={};state.garden.bunnySeated=false;save();renderParent();toast('Garden layout reset.')}
function resetGardenProgress(){if(!confirm('Reset the whole garden? This resets plant growth, treasure progress, item positions, and the Treasure Box. Word learning data will NOT be deleted.'))return;state.xp=0;state.garden={growth:0,pos:{},bunnySeated:false,stored:[]};save();renderParent();toast('Garden reset. Learning data kept.')}
function masteryInfo(w){
  const l=w.learn||learning(w.word),vals=l.weak||[],maxWeak=Math.max(0,...vals),wi=maxWeak?vals.indexOf(maxWeak):-1,loops=l.loops||0,stage4=l.stageMist?.[4]||0,practiced=loops>0||(l.correct||0)>0||(l.mistakes||0)>0,feeling=l.feeling||'';
  const weakText=maxWeak>=2&&wi>=0?w.word.slice(wi,Math.min(w.word.length,wi+2)):'';
  const repeated=loops>=2&&(maxWeak>=4||(stage4>=2&&maxWeak>=2));
  const ready=loops>=2&&maxWeak<=1&&stage4<=1&&(l.mistakes||0)<=Math.max(3,loops*2);
  let key='growing',label='🌱 Growing',reason='Still settling in — no need to push it.';
  if(!practiced)reason='Not explored yet. It can wait until Play brings it up.';
  else if(repeated){key='help';label='✨ Needs a little help';reason=weakText?`She has paused around “${weakText}” more than once.`:'Whole-word spelling is still taking a little extra thought.'}
  else if(ready){key='ready';label='🌼 Ready';reason='This word is looking steady. Extra practice is not needed right now.'}
  else if(feeling==='tricky')reason='Miori said this one felt tricky. That feeling matters even if the answers are improving.';
  else if(weakText)reason=`The “${weakText}” part is still becoming familiar.`;
  return{key,label,reason,weakText,feeling,loops,last:l.last||'',practiced,maxWeak,stage4}
}
function feelingLabel(feel){return({easy:'😊 Easy',almost:'🙂 Almost',tricky:'😵 Tricky'})[feel]||''}
function adviceForWord(w,m){
  if(w.parentPriority)return{jp:'紙で気になった単語。次のPlayで先に出ます。できたら回数を増やさず、親が必要と感じなくなった時に★を外せます。',en:`Let's try “${w.word}” together.`};
  if(m.key==='help'&&m.weakText)return{jp:`「${m.weakText}」のところだけ、書かせずに一緒に見つけたり声に出したりするくらいで十分。`,en:`Can you find “${m.weakText}” in “${w.word}”?`};
  if(m.feeling==='tricky')return{jp:'本人がTrickyと感じた単語。書き取りを増やすより、一緒にゆっくり言ってみるくらいがおすすめ。',en:`Want to say “${w.word}” slowly with me?`};
  if(m.key==='ready')return{jp:'追加練習はなしでOK。できた時に、考えたことや覚えていたことを一言ほめる。',en:`You remembered “${w.word}”!`};
  if(!m.practiced)return{jp:'まだ触らなくてOK。Playが自然に出してくれるのを待つ。',en:'No need to practice this one yet.'};
  return{jp:'次にPlayで出た時に見守るだけでOK。答えを先に教えず、自分で思い出す時間を残す。',en:`Take your time with “${w.word}”.`}
}
function priorityButtonHtml(w){const selected=!!w.parentPriority;return`<button type="button" class="parent-priority-toggle ${selected?'selected':''}" aria-pressed="${selected}" aria-label="${selected?'Remove':'Add'} ${esc(w.word)} ${selected?'from':'to'} priority practice" title="紙で気になった単語を優先">${selected?'★ 練習する':'☆ 練習したい'}</button>`}
function guidanceWordCardHtml(w){
  const m=masteryInfo(w),a=adviceForWord(w,m),feel=m.feeling?`<span class="miori-feel">Miori: ${feelingLabel(m.feeling)}</span>`:'',weak=m.weakText?`<span>focus: ${esc(m.weakText)}</span>`:'';
  return`<div class="word-row guidance-word-card status-${m.key} ${w.parentPriority?'parent-priority':''}" data-id="${w.id}"><div><div class="mastery-word-head"><strong>${esc(w.word)}</strong>${w.parentPriority?'<span class="parent-star-badge">★ Parent pick</span>':''}<span class="mastery-status">${m.label}</span></div></div><div class="guidance-actions">${priorityButtonHtml(w)}<button class="audio-preview" aria-label="Hear ${esc(w.word)}">🔊</button><button class="edit-word" aria-label="Edit ${esc(w.word)}">✎</button></div><div class="mastery-meta">${feel}${weak}${m.last?`<span>last: ${esc(m.last)}</span>`:''}</div><p class="mastery-reason">${esc(w.parentPriority&&m.key==='ready'?'アプリではReady。紙の練習で気になったため、親がもう一度試す単語に選んでいます。':m.reason)}</p><div class="try-this"><b>Dad can try</b>${esc(a.jp)}<br><em>“${esc(a.en)}”</em></div></div>`
}
function parentGuidanceCards(week){
  const rows=week.map(w=>({w,m:masteryInfo(w)})),used=new Set(),cards=[];
  const add=(row,kind,icon,title,text,small='')=>{if(!row||used.has(row.w.id)||cards.length>=3)return;used.add(row.w.id);cards.push(`<div class="guidance-card ${kind}"><div class="guidance-icon">${icon}</div><b>${esc(title)}</b><p>${esc(text)}</p>${small?`<small>${esc(small)}</small>`:''}</div>`)};
  const picked=rows.find(x=>x.w.parentPriority);if(picked)add(picked,'support','⭐',`${picked.w.word}: 紙での気づき`,'親が練習に選んだ単語。次のPlayで優先されます。','Parent-selected practice');
  const need=rows.filter(x=>x.m.key==='help').sort((a,b)=>b.m.maxWeak-a.m.maxWeak)[0];
  if(need){const a=adviceForWord(need.w,need.m);add(need,'support','✨',`${need.w.word}: ここだけ少し助ける`,a.jp,a.en)}
  const tricky=rows.find(x=>x.m.feeling==='tricky'&&!used.has(x.w.id));
  if(tricky){const a=adviceForWord(tricky.w,tricky.m);add(tricky,'support','💭',`${tricky.w.word}: 本人はTricky`,a.jp,a.en)}
  const ready=rows.find(x=>x.m.key==='ready'&&!used.has(x.w.id));
  if(ready){const a=adviceForWord(ready.w,ready.m);add(ready,'celebrate','🌼',`${ready.w.word}: もう十分育ってる`,a.jp,a.en)}
  if(cards.length<3)cards.push(`<div class="guidance-card pace"><div class="guidance-icon">🌿</div><b>ペースは美織に任せてOK</b><p>量や時間を増やすより、「どの単語がおもしろかった？」くらいの会話で十分。</p><small>No need to turn it into homework.</small></div>`);
  if(cards.length<3)cards.push(`<div class="guidance-card celebrate"><div class="guidance-icon">♡</div><b>結果より、考えたことをほめる</b><p>正解そのものより「自分で思い出したね」「最後まで考えたね」の方を拾う。</p><small>Notice effort, not just accuracy.</small></div>`);
  if(cards.length<3)cards.push(`<div class="guidance-card pace"><div class="guidance-icon">☁️</div><b>何もしない日も大丈夫</b><p>このページに「要サポート」がなければ、追加練習を作らなくてOK。</p><small>Sometimes the best help is space.</small></div>`);
  return cards.slice(0,3).join('')
}
function recentWordsHtml(){
  const rows=(state.recentWords||[]).slice(0,6).map(x=>({x,w:state.lib[x.id]})).filter(x=>x.w);if(!rows.length)return'<p class="recent-empty">まだ最近の記録はありません。ここでは時間や回数は追いません。</p>';
  return`<div class="recent-word-chips">${rows.map(({x,w})=>`<span class="recent-word-chip">${esc(w.word)} <small>${x.date===today()?'today':'recent'}</small></span>`).join('')}</div>`
}
function learningSummary(w){const l=w.learn||learning(w.word),weak=Math.max(0,...(l.weak||[])),wi=weak?(l.weak||[]).indexOf(weak):-1;return{loops:l.loops||0,correct:l.correct||0,mistakes:l.mistakes||0,weak:wi>=0?w.word.slice(wi,Math.min(w.word.length,wi+2)):'—',last:l.last||'Not practiced yet'}}
function renderParent(){
  const week=state.week.ids.map(id=>state.lib[id]).filter(Boolean),all=Object.values(state.lib).sort((a,b)=>a.word.localeCompare(b.word));
  $('#parentView').innerHTML=`<div class="parent-view parent-v4 parent-v19"><div class="parent-head"><div><p class="eyebrow">DAD SPACE</p><h1>Parent · Gentle Support</h1><p>美織のペースはそのまま。ここは「どれだけやったか」を管理する場所ではなく、「今どこを少し助けるとよさそうか」を見る場所です。</p></div><div class="parent-actions"><label class="secondary-btn file-btn">Import Word Pack<input id="parentImport" type="file" accept="application/json,.json"></label><button id="exportBtn" class="secondary-btn">Export Backup</button><button id="addWordBtn" class="primary-btn">+ Add Word</button></div></div><div class="parent-principle"><b>目安：</b> 1回の間違いでは「苦手」にしません。同じところで繰り返し迷った時だけサポート候補に上げます。Readyなら、追加練習を作らないことも大切です。</div><section class="panel guidance-panel"><div class="panel-head"><div><p class="eyebrow">HOW TO HELP MIORI</p><h2>今できる、小さなサポート</h2></div><span>up to 3 ideas</span></div><div class="guidance-cards">${parentGuidanceCards(week)}</div></section><section class="panel recent-panel"><div class="panel-head"><div><p class="eyebrow">RECENTLY EXPLORED</p><h2>最近ふれた単語</h2><p>会話のきっかけ用。何分やった・何問やった、は表示しません。</p></div></div>${recentWordsHtml()}</section><section class="panel mastery-panel"><div class="panel-head"><div><p class="eyebrow">THIS WEEK</p><h2>${esc(state.week.title)}</h2></div><div class="mastery-legend"><span class="ready">🌼 Ready</span><span class="growing">🌱 Growing</span><span class="help">✨ Little help</span><span class="parent-priority-legend">★ Parent pick</span></div></div><div class="mastery-grid">${week.map(guidanceWordCardHtml).join('')}</div></section><aside class="panel settings parent-audio-panel"><p class="eyebrow">PRONUNCIATION</p><h2>English voice & audio</h2><select id="voiceSelect"><option value="">Best available</option>${voices.filter(v=>/^en/i.test(v.lang)).map(v=>`<option value="${esc(v.voiceURI)}" ${v.voiceURI===state.settings.voice?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><p>Human recordings are used first when available. Device voice is the fallback.</p><button id="testVoiceBtn" class="parent-big-button">🔊 Test voice</button></aside><section class="panel library-panel"><div class="panel-head"><div><p class="eyebrow">WORD LIBRARY</p><h2>Technical word details</h2></div><input id="librarySearch" class="search-input" placeholder="Search words…"></div><div id="libraryList" class="library-list word-card-list">${all.map(wordRowHtml).join('')}</div></section><section class="panel maintenance-panel"><div><p class="eyebrow">MAINTENANCE</p><h2>Reset & maintenance</h2><p>These controls are intentionally down here because you probably will not need them often.</p></div><div class="maintenance-actions"><button id="resetAllLearningBtn" class="maintenance-btn learning">↻ Reset all learning data<span>Keeps garden progress</span></button><button id="resetGardenLayoutBtn" class="maintenance-btn layout">▦ Reset garden layout<span>Keeps growth and unlocked items</span></button><button id="resetGardenProgressBtn" class="maintenance-btn danger-soft">Reset whole garden<span>Keeps word learning data</span></button></div></section></div>`;
  $('#parentImport').onchange=e=>importWordPack(e.target.files?.[0]);$('#exportBtn').onclick=exportBackup;$('#addWordBtn').onclick=()=>openWordModal();$('#voiceSelect').onchange=e=>{state.settings.voice=e.target.value;save()};$('#testVoiceBtn').onclick=()=>speak('Hello Miori. Let’s practice spelling together.');$('#librarySearch').oninput=e=>{const q=e.target.value.toLowerCase();$('#libraryList').innerHTML=all.filter(w=>!q||w.word.includes(q)||(w.meaningEn||'').toLowerCase().includes(q)).map(wordRowHtml).join('');bindParentRows()};$('#resetAllLearningBtn').onclick=resetAllLearning;$('#resetGardenLayoutBtn').onclick=resetGardenLayout;$('#resetGardenProgressBtn').onclick=resetGardenProgress;bindParentRows()
}
function wordRowHtml(w){const m=learningSummary(w);return`<div class="word-row parent-word-card ${w.parentPriority?'parent-priority':''}" data-id="${w.id}"><div class="word-main"><strong>${esc(w.word)}</strong>${w.parentPriority?'<span class="parent-star-badge">★ Parent pick</span>':''}<span class="audio-status">${w.pronunciationUrl?'● Human audio':'○ Device voice'}</span><p>${esc(w.meaningEn||'No meaning saved')}</p></div><div class="learning-mini"><span><b>${m.loops}</b> full loops</span><span><b>${m.correct}</b> correct</span><span><b>${m.mistakes}</b> mistakes</span><span>weak: <b>${esc(m.weak)}</b></span><small>${esc(m.last)}</small></div><div class="word-actions">${priorityButtonHtml(w)}<button class="parent-row-btn audio-preview">🔊 Audio</button><button class="parent-row-btn edit-word">✎ Edit</button><button class="parent-row-btn reset-word">↻ Reset learning</button></div></div>`}
function toggleParentPriority(id){const w=state.lib[id];if(!w)return;const query=$('#librarySearch')?.value||'';w.parentPriority=!w.parentPriority;save();renderParent();if(query){const input=$('#librarySearch');input.value=query;input.dispatchEvent(new Event('input'))}toast(w.parentPriority?`${w.word}: ★ 次のPlayで優先します。`:`${w.word}: ★ を外しました。`)}
function bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];if(!w)return;$('.parent-priority-toggle',row)?.addEventListener('click',()=>toggleParentPriority(row.dataset.id));$('.audio-preview',row)?.addEventListener('click',()=>playWordAudio(w));$('.edit-word',row)?.addEventListener('click',()=>openWordModal(w.id));$('.reset-word',row)?.addEventListener('click',()=>resetOneLearning(w.id))})}
function openWordModal(id=null){const w=id?state.lib[id]:null;$('#modalRoot').innerHTML=`<div class="modal"><div class="modal-card"><div class="modal-head"><div><p class="eyebrow">WORD DETAILS</p><h2>${w?'Edit Word':'Add Word'}</h2></div><button id="closeModal" class="icon-btn">×</button></div><form id="wordForm" class="word-form"><label>Word<input id="wordInput" value="${esc(w?.word||'')}" ${w?'readonly':''} required></label><label>English meaning<textarea id="meaningEnInput" rows="2">${esc(w?.meaningEn||'')}</textarea></label><label>Japanese meaning<textarea id="meaningJaInput" rows="2">${esc(w?.meaningJa||'')}</textarea></label><label>Example sentence<textarea id="exampleInput" rows="2">${esc(w?.example||'')}</textarea></label><div class="form-two"><label>Phonics focus<input id="phonicsInput" value="${esc(w?.phonicsFocus||'')}"></label><label>Picture cue<input id="pictureCueInput" value="${esc(w?.pictureCue||'')}"></label></div><label>Picture emoji<input id="pictureEmojiInput" value="${esc(w?.pictureEmoji||'')}"></label><label>Miori's spelling<input id="mioriSpellingInput" value="${esc(w?.mioriSpelling||'')}" placeholder="e.g. responsibol"></label><label>Human pronunciation URL<input id="pronunciationUrlInput" value="${esc(w?.pronunciationUrl||'')}"></label><div class="modal-actions">${w?'<button type="button" id="resetLearningBtn" class="danger">Reset learning</button>':''}<button type="button" id="findAudioBtn" class="secondary-btn">Find Human Audio</button><button type="button" id="cancelModal" class="secondary-btn">Cancel</button><button type="submit" class="primary-btn">Save</button></div></form></div></div>`;$('#closeModal').onclick=$('#cancelModal').onclick=()=>$('#modalRoot').innerHTML='';$('#findAudioBtn').onclick=async()=>{const word=norm($('#wordInput').value);if(!word)return;const btn=$('#findAudioBtn');btn.disabled=true;btn.textContent='Searching…';const url=await findHumanAudio(word);btn.disabled=false;btn.textContent='Find Human Audio';if(url){$('#pronunciationUrlInput').value=url;toast('Human pronunciation found.')}else toast('No clear human recording found.')};$('#resetLearningBtn')?.addEventListener('click',()=>{if(confirm(`Reset learning data for “${w.word}” only?`)){w.learn=learning(w.word);save();$('#modalRoot').innerHTML='';renderParent()}});$('#wordForm').onsubmit=e=>{e.preventDefault();const word=norm($('#wordInput').value);if(!word)return;const old=state.lib[word];const raw={word,meaningEn:$('#meaningEnInput').value.trim(),meaningJa:$('#meaningJaInput').value.trim(),example:$('#exampleInput').value.trim(),phonicsFocus:$('#phonicsInput').value.trim(),pictureCue:$('#pictureCueInput').value.trim(),pictureEmoji:$('#pictureEmojiInput').value.trim(),mioriSpelling:$('#mioriSpellingInput').value.trim(),pronunciationUrl:$('#pronunciationUrlInput').value.trim(),pronunciationSource:$('#pronunciationUrlInput').value.trim()?'manual':''};state.lib[word]=normalizeWord(raw,old);if(!state.week.ids.includes(word))state.week.ids.push(word);save();$('#modalRoot').innerHTML='';renderParent();toast('Saved.')};setTimeout(()=>$('#wordInput')?.focus(),40)}
async function importWordPack(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.version&&data.lib){state=data;state.version=3;save();renderParent();toast('Backup restored.');return}const words=Array.isArray(data)?data:data.words;if(!Array.isArray(words)||!words.length)throw new Error('no words');if(data.weekName||data.title)state.week.title=data.weekName||data.title;const ids=[];for(const raw of words){if(!raw.word)continue;const key=norm(raw.word),old=state.lib[key];state.lib[key]=normalizeWord(raw,old);ids.push(key)}state.week.ids=[...new Set(ids)];save();renderParent();toast(`Imported ${ids.length} words.`);for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}}catch(e){console.error(e);toast('Could not import this Word Pack.')}}
function exportBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`miori-word-garden-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),800)}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2200)}

function init(){
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.nav)));
  document.addEventListener('click',e=>{const btn=e.target.closest?.('button');if(btn&&!btn.disabled&&btn.id!=='musicToggle')playSfx('tap')},true);
  $('#musicToggle')?.addEventListener('click',()=>{audioUnlocked=true;const on=!(state.settings.music&&state.settings.sound);state.settings.music=on;state.settings.sound=on;state.settings.audioDefaultV17=true;save();if(on){playSfx('sparkle');syncBgm()}else stopBgm()});
  document.addEventListener('pointerdown',()=>{audioUnlocked=true;ensureAudioCtx();syncBgm()},{once:true,capture:true});
  renderTopbar();loadVoices();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=loadVoices;setView('garden');for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
