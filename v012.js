
/* Miori's Word Garden v0.12.5 — stable reward/session controller */
(function(){
const V11_VEGS=[
  {key:'carrot',emoji:'🥕',name:'Carrot'},
  {key:'tomato',emoji:'🍅',name:'Tomato'},
  {key:'pumpkin',emoji:'🎃',name:'Pumpkin'},
  {key:'corn',emoji:'🌽',name:'Corn'}
];
const V11_ANIMALS=['rabbit','cat','squirrel','duck','hedgehog','bird','dog'];
const V11_ANIMAL_LABEL={rabbit:'Bunny',cat:'Kitten',squirrel:'Squirrel',duck:'Duckling',hedgehog:'Hedgehog',bird:'Bluebird',dog:'Puppy'};
const V11_FLOWER_POS=[[31,72],[40,78],[50,74],[58,79],[41,49],[52,43],[29,55],[59,38],[23,68],[61,68]];
const V11_RESIDENT_POS=[[47,63],[57,65],[43,58],[61,55],[36,66],[54,48],[71,70],[30,48]];
const V11_PLOT_POS=[[76.8,54.7],[89.2,54.7],[76.8,68.3],[89.2,68.3]];
const V11_SPECIALS=['treehouse','bench','lantern','flowerArch','birdcage','mailbox'];
let v11PlantMode=null,v11SeedDrawerOpen=false,v11Busy=false,v11NoticeTimer=null;

function v11DefaultGarden(){return {objects:[],pending:null,rewardIndex:0,specialIndex:0,rewardQueue:[],seedHouse:{seeds:[],pending:0,earnedIndex:0},farmPlots:[null,null,null,null],flowerSpots:V11_FLOWER_POS.map((p,i)=>({id:'f'+i,x:p[0],y:p[1],stage:0,special:false,color:i%5})),residents:[{type:'rabbit',joinedAt:Date.now(),x:V11_RESIDENT_POS[0][0],y:V11_RESIDENT_POS[0][1]}],specialItems:[],gifts:[]}}
function v12Number(n,fallback=0){n=Number(n);return Number.isFinite(n)?n:fallback}
function v12Clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function v11NormalizeGarden(){
  // v0.12.4 migration is deliberately defensive. Older prototypes used several
  // different garden shapes; none of them should be able to stop the app booting.
  let raw=(state&&state.garden&&typeof state.garden==='object'&&!Array.isArray(state.garden))?state.garden:{};
  let g={...raw};
  let sh=(raw.seedHouse&&typeof raw.seedHouse==='object'&&!Array.isArray(raw.seedHouse))?raw.seedHouse:{};
  let validVeg=new Set(V11_VEGS.map(v=>v.key));
  g.seedHouse={
    seeds:(Array.isArray(sh.seeds)?sh.seeds:[]).filter(x=>validVeg.has(String(x))).slice(0,5),
    pending:v12Clamp(Math.floor(v12Number(sh.pending,0)),0,99),
    earnedIndex:v12Clamp(Math.floor(v12Number(sh.earnedIndex,0)),0,999999)
  };
  let rawPlots=Array.isArray(raw.farmPlots)?raw.farmPlots:[];
  g.farmPlots=[0,1,2,3].map(i=>{
    let q=rawPlots[i];
    if(!q||typeof q!=='object'||!validVeg.has(String(q.type)))return null;
    return {type:String(q.type),stage:v12Clamp(Math.floor(v12Number(q.stage,1)),1,4),plantedAt:v12Number(q.plantedAt,Date.now())};
  });
  let oldFlowers=Array.isArray(raw.flowerSpots)?raw.flowerSpots:[];
  g.flowerSpots=V11_FLOWER_POS.map((pos,i)=>{
    let f=oldFlowers[i];f=(f&&typeof f==='object')?f:{};
    return {id:'f'+i,x:v12Clamp(v12Number(f.x,pos[0]),0,100),y:v12Clamp(v12Number(f.y,pos[1]),0,100),stage:v12Clamp(Math.floor(v12Number(f.stage,0)),0,4),special:!!f.special,color:v12Clamp(Math.floor(v12Number(f.color,i%5)),0,4)};
  });
  let rawResidents=Array.isArray(raw.residents)?raw.residents:[];
  let residents=[];
  rawResidents.forEach((a,i)=>{
    let type=typeof a==='string'?a:(a&&typeof a==='object'?a.type:null),fallback=V11_RESIDENT_POS[residents.length%V11_RESIDENT_POS.length];
    if(V11_ANIMALS.includes(type)&&!residents.some(r=>r.type===type))residents.push({
      type,joinedAt:v12Number(a&&a.joinedAt,Date.now()+i),
      x:v12Clamp(v12Number(a&&a.x,fallback[0]),5,95),y:v12Clamp(v12Number(a&&a.y,fallback[1]),12,92)
    });
  });
  // Migrate animal rewards from older object-based gardens, but never duplicate them.
  if(Array.isArray(raw.objects))raw.objects.filter(o=>o&&o.kind==='animal').forEach((o,i)=>{
    let type=V11_ANIMALS[i+1],fallback=V11_RESIDENT_POS[residents.length%V11_RESIDENT_POS.length];if(type&&!residents.some(r=>r.type===type))residents.push({type,joinedAt:Date.now()+i,x:fallback[0],y:fallback[1]});
  });
  if(!residents.some(r=>r.type==='rabbit'))residents.unshift({type:'rabbit',joinedAt:Date.now(),x:V11_RESIDENT_POS[0][0],y:V11_RESIDENT_POS[0][1]});
  g.residents=residents.slice(0,V11_RESIDENT_POS.length);
  g.specialItems=(Array.isArray(raw.specialItems)?raw.specialItems:[]).filter(s=>s&&typeof s==='object'&&V11_SPECIALS.includes(s.type)).map((s,i)=>({id:s.id||('sp_'+i+'_'+v12Number(s.earnedAt,Date.now())),type:s.type,earnedAt:v12Number(s.earnedAt,Date.now()),x:Number.isFinite(Number(s.x))?v12Clamp(Number(s.x),5,95):null,y:Number.isFinite(Number(s.y))?v12Clamp(Number(s.y),12,92):null}));
  g.gifts=(Array.isArray(raw.gifts)?raw.gifts:[]).filter(x=>x&&typeof x==='object').map(x=>({id:x.id||id(),animalType:V11_ANIMALS.includes(x.animalType)?x.animalType:null,specialType:V11_SPECIALS.includes(x.specialType)?x.specialType:null,opened:!!x.opened,earnedAt:v12Number(x.earnedAt,Date.now())})).filter(x=>x.animalType||x.specialType);
  g.objects=Array.isArray(raw.objects)?raw.objects.filter(Boolean):[];
  g.pending=raw.pending&&typeof raw.pending==='object'?raw.pending:null;
  g.rewardIndex=v12Clamp(Math.floor(v12Number(raw.rewardIndex,0)),0,999999);
  g.specialIndex=v12Clamp(Math.floor(v12Number(raw.specialIndex,0)),0,999999);
  g.rewardQueue=Array.isArray(raw.rewardQueue)?raw.rewardQueue.filter(Boolean):[];
  state.garden=g;state.version=12;
}
function v12RepairDailyShape(){
  let wk=currentWeek();
  if(!wk)return null;
  let d=ensureDaily();
  let valid=new Set((wk.wordIds||[]).filter(wid=>wordById(wid)));
  if(!Array.isArray(d.focusIds))d.focusIds=[];
  d.focusIds=d.focusIds.filter(wid=>valid.has(wid)).slice(0,3);
  if(!d.focusIds.length)d.focusIds=selectFocusIds();
  if(!Array.isArray(d.focusCompleted))d.focusCompleted=[];
  d.focusCompleted=d.focusCompleted.filter(wid=>d.focusIds.includes(wid));
  d.focusIndex=v12Clamp(Math.floor(v12Number(d.focusIndex,d.focusCompleted.length)),0,d.focusIds.length);
  if(!Array.isArray(d.reviewIds))d.reviewIds=[];
  d.reviewIds=d.reviewIds.filter(wid=>valid.has(wid)).slice(0,3);
  if(!Array.isArray(d.reviewCompleted))d.reviewCompleted=[];
  d.reviewCompleted=d.reviewCompleted.filter(wid=>d.reviewIds.includes(wid));
  d.reviewIndex=v12Clamp(Math.floor(v12Number(d.reviewIndex,d.reviewCompleted.length)),0,d.reviewIds.length);
  if(!['focus','review','done','seed'].includes(d.phase))d.phase='focus';
  if(d.phase==='seed')d.phase='done';
  // Repair impossible legacy combinations instead of leaving a dead Garden route.
  if(d.phase==='focus'&&d.focusIds.length&&d.focusIndex>=d.focusIds.length){
    if(d.focusCompleted.length>=d.focusIds.length){d.phase='review';d.reviewIds=selectReviewIds();d.reviewIndex=0;d.reviewCompleted=[]}
    else d.focusIndex=Math.max(0,d.focusIds.length-1);
  }
  if(d.phase==='review'&&!d.reviewIds.length){
    d.reviewIds=selectReviewIds();d.reviewIndex=0;d.reviewCompleted=[];
    if(!d.reviewIds.length)d.phase=d.focusCompleted.length>=d.focusIds.length?'done':'focus';
  }
  if(d.phase==='review'&&d.reviewIds.length&&d.reviewIndex>=d.reviewIds.length)d.phase='done';
  d.ended=!!d.ended;
  if(d.seedRewarded===undefined)d.seedRewarded=!!(d.bonusSeedPlanted||d.bonusSeedId);
  if(d.bonusSunDone===undefined)d.bonusSunDone=!!d.bonusDone;
  return d;
}
v11NormalizeGarden();

const v11OldSave=save;
save=function(){state.version=12;try{MWG_STORAGE.setItem('mwg12_state',JSON.stringify(state))}catch(e){};v11OldSave()};
try{let saved12=JSON.parse(MWG_STORAGE.getItem('mwg12_state')||MWG_STORAGE.getItem('mwg11_state')||'null');if(saved12&&Array.isArray(saved12.words)){state=saved12;v11NormalizeGarden()}}catch(e){}

const v11FreshBase=freshDaily;
freshDaily=function(){let d=v11FreshBase();d.seedRewarded=false;d.bonusSunDone=false;d.bonusDone=false;return d};
const v11EnsureBase=ensureDaily;
ensureDaily=function(){let d=v11EnsureBase();if(d.seedRewarded===undefined)d.seedRewarded=!!(d.bonusSeedPlanted||d.bonusSeedId);if(d.phase==='seed')d.phase='done';return d};

function v12Art(){return window.MWG_ART||{}}
function v12Background(){return v12Art().background||'assets/background/garden-base-temp.webp'}
function v11AssetAnimal(type,pose='idle'){let t=V11_ANIMALS.includes(type)?type:'rabbit',a=v12Art().animals?.[t]||{};return a[pose]||a.idle||('assets/animal-'+t+'.svg')}
function v11Veg(key){return V11_VEGS.find(v=>v.key===key)||V11_VEGS[0]}
function v11Notice(html,ms=2600){let n=document.getElementById('v11Notice');if(!n)return;n.innerHTML=html;clearTimeout(v11NoticeTimer);if(ms)v11NoticeTimer=setTimeout(()=>{if(n)n.innerHTML=''},ms)}
function v11Chime(){ding();}
function v11AddSeed(){
  let sh=state.garden.seedHouse,veg=V11_VEGS[sh.earnedIndex%V11_VEGS.length];sh.earnedIndex++;
  if(sh.seeds.length<5){sh.seeds.push(veg.key);v11Notice('🌰 A <strong>'+veg.name+' seed</strong> went into the Seed House!',3000)}
  else{sh.pending++;v11Notice('🌰 Seed House is full! Your new seed is waiting safely. Plant one to make room.',4200)}
  save();
}
function v11MovePending(){let sh=state.garden.seedHouse;if(sh.pending>0&&sh.seeds.length<5){let veg=V11_VEGS[sh.earnedIndex%V11_VEGS.length];sh.earnedIndex++;sh.seeds.push(veg.key);sh.pending--;v11Notice('🌰 The waiting seed moved into the Seed House.',2500)}}
function v11WaterTarget(){
  let growing=[];state.garden.farmPlots.forEach((p,i)=>{if(p&&p.stage>0&&p.stage<4)growing.push({kind:'veg',index:i,stage:p.stage,plantedAt:p.plantedAt||0,x:V11_PLOT_POS[i][0],y:V11_PLOT_POS[i][1]})});
  if(growing.length){growing.sort((a,b)=>b.stage-a.stage||a.plantedAt-b.plantedAt);return growing[0]}
  let flowers=state.garden.flowerSpots.filter(f=>f.stage>0&&f.stage<4);if(flowers.length){let f=flowers[0];return{kind:'flower',id:f.id,x:f.x,y:f.y,stage:f.stage}}
  let empty=state.garden.flowerSpots.find(f=>f.stage===0);if(empty)return{kind:'flower',id:empty.id,x:empty.x,y:empty.y,stage:0};
  // Garden is full of flowers: pick a mature normal flower for a tiny sparkle instead of losing water.
  let f=state.garden.flowerSpots.find(f=>f.stage===4)||state.garden.flowerSpots[0];return{kind:'flowerFull',id:f.id,x:f.x,y:f.y,stage:4};
}
function v11CommitWater(t){
  if(t.kind==='veg'){let p=state.garden.farmPlots[t.index];if(p)p.stage=Math.min(4,p.stage+1);return p&&p.stage===4?`${v11Veg(p.type).name} is ready to harvest!`:`The ${v11Veg(p.type).name.toLowerCase()} grew!`}
  let f=state.garden.flowerSpots.find(x=>x.id===t.id);if(f&&t.kind==='flower')f.stage=Math.min(4,f.stage+1);return t.kind==='flowerFull'?'The flowers loved the extra water!':(f&&f.stage===4?'A flower bloomed!':'A flower grew a little!')
}
function v11PlantSVG(stage,type){
  if(type==='flower'){
    let palettes=[['#ff9fbd','#ffd75f'],['#a89cf2','#ffe07a'],['#ffbd73','#fff1a8'],['#f48d8f','#ffd86a'],['#fffdf3','#f1bd55']],i=Number(stage.color||0)%palettes.length,c=palettes[i];
    if(stage.stage===1)return `<svg viewBox="0 0 100 100"><path d="M50 88V57" stroke="#4b9d54" stroke-width="8" stroke-linecap="round"/><path d="M49 70Q25 58 25 78Q38 84 50 75M52 64Q75 50 76 69Q64 77 52 70" fill="#78bd62"/></svg>`;
    if(stage.stage===2)return `<svg viewBox="0 0 100 100"><path d="M50 90V40" stroke="#438f4d" stroke-width="8" stroke-linecap="round"/><path d="M48 72Q19 55 20 78Q34 88 49 78M52 64Q82 47 82 72Q67 82 52 73M48 53Q25 38 25 58Q37 67 50 61" fill="#72ba5e"/></svg>`;
    if(stage.stage===3)return `<svg viewBox="0 0 100 100"><path d="M50 91V39" stroke="#438f4d" stroke-width="7"/><path d="M48 72Q21 56 21 78Q35 87 49 78M52 64Q80 50 81 72Q66 82 52 73" fill="#72ba5e"/><path d="M50 42c-17-9-21-27-7-35 5 7 10 7 15 0 14 9 9 27-8 35z" fill="${c[0]}" stroke="#d36f8b" stroke-width="2"/></svg>`;
    let special=stage.special;return `<svg viewBox="0 0 100 100"><path d="M50 92V43" stroke="#438f4d" stroke-width="7"/><path d="M48 72Q20 56 20 80Q35 88 50 78M52 65Q81 49 82 73Q67 83 52 74" fill="#72ba5e"/><g transform="translate(50 34)">${[0,60,120,180,240,300].map(a=>`<ellipse rx="14" ry="26" fill="${special?'#ffd86f':c[0]}" transform="rotate(${a}) translate(0 -17)"/>`).join('')}<circle r="16" fill="${special?'#fff4a9':c[1]}"/><circle r="7" fill="${special?'#f4a83e':'#d99647'}"/></g>${special?'<path d="M18 20l4 8 9 2-7 6 2 9-8-5-8 5 2-9-7-6 9-2z" fill="#fff6a7"/>':''}</svg>`;
  }
  let p=stage,veg=v11Veg(p.type);
  if(p.stage===1)return `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="78" rx="34" ry="12" fill="#6d4935"/><ellipse cx="50" cy="68" rx="9" ry="6" fill="#c7975c"/><path d="M50 64l7-8" stroke="#f1d08b" stroke-width="3"/></svg>`;
  if(p.stage===2)return `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="82" rx="33" ry="10" fill="#6d4935" opacity=".7"/><path d="M50 78V48" stroke="#4c9852" stroke-width="7"/><path d="M49 62Q24 49 26 68Q38 76 50 68M52 58Q76 43 78 64Q65 73 52 67" fill="#77be61"/></svg>`;
  if(p.stage===3)return `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="84" rx="35" ry="10" fill="#6d4935" opacity=".7"/><path d="M50 80V38" stroke="#428d4b" stroke-width="7"/><g fill="#6eb459"><path d="M49 65Q17 47 20 72Q35 81 50 72"/><path d="M52 59Q84 41 83 69Q67 78 52 69"/><path d="M48 50Q27 35 27 55Q39 64 50 58"/></g><circle cx="50" cy="48" r="10" fill="${veg.key==='tomato'?'#ef6c59':veg.key==='pumpkin'?'#eea24a':'#8dc55f'}" opacity=".78"/></svg>`;
  return `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="84" rx="35" ry="10" fill="#6d4935" opacity=".55"/><path d="M50 73V31" stroke="#438e4b" stroke-width="7"/><path d="M49 55Q18 38 20 65Q35 75 50 65M52 49Q83 34 84 62Q68 73 52 64" fill="#70b75b"/><text x="50" y="66" font-size="47" text-anchor="middle">${veg.emoji}</text></svg>`;
}
function v11RenderPlants(stage){
  state.garden.flowerSpots.forEach(f=>{if(!f.stage)return;let el=document.createElement('div');el.className='v11-plant v11-flower'+(f.special?' special':'');el.style.left=f.x+'%';el.style.top=f.y+'%';el.innerHTML=v11PlantSVG(f,'flower');stage.appendChild(el)});
  state.garden.farmPlots.forEach((p,i)=>{if(!p)return;let pos=V11_PLOT_POS[i],el=document.createElement('div');el.className='v11-plant v11-veg'+(p.stage===4?' ready':'');el.style.left=pos[0]+'%';el.style.top=pos[1]+'%';el.innerHTML=v11PlantSVG(p,'veg')+(p.stage===4?'<span class="v11-ready-star">✨</span>':'');if(p.stage===4){el.onclick=e=>{e.stopPropagation();v11Harvest(i)}}stage.appendChild(el)});
}
function v11RenderResidents(stage){state.garden.residents.forEach((a,i)=>{if(i===0&&a.type==='rabbit'&&v12Art().backgroundHasRabbit)return;let pos=V11_RESIDENT_POS[i%V11_RESIDENT_POS.length],el=document.createElement('div');el.className='v11-resident';el.dataset.resident=i;el.dataset.type=a.type;el.style.left=pos[0]+'%';el.style.top=pos[1]+'%';el.style.animationDelay=(-i*.45)+'s';el.innerHTML=`<img alt="${V11_ANIMAL_LABEL[a.type]||'friend'}" src="${v11AssetAnimal(a.type,'idle')}">`;stage.appendChild(el)})}
function v11RenderSpecials(stage){state.garden.specialItems.forEach((s,i)=>{if(s.type==='treehouse'){let el=document.createElement('div');el.className='v11-treehouse';el.innerHTML='<div class="hut"></div><div class="roof"></div><div class="deck"></div>';stage.appendChild(el)}else{let el=document.createElement('div');el.className='v11-special-item';let pos=[[60,32],[76,36],[33,42],[62,72]][i%4];el.style.left=pos[0]+'%';el.style.top=pos[1]+'%';el.textContent=s.type==='bench'?'🪑':s.type==='lantern'?'🏮':'🌸';stage.appendChild(el)}})}
function v11CurrentGift(){return state.garden.gifts.find(g=>!g.opened)||null}
function v11RenderGift(stage){let g=v11CurrentGift();if(!g)return;let b=document.createElement('button');b.className='v11-gift';b.id='v11Gift';b.setAttribute('aria-label','Open weekly challenge gift');b.textContent='🎁';b.onclick=()=>v11OpenGift(g,b);stage.appendChild(b)}
function v11OpenGift(g,b){if(v11Busy)return;v11Busy=true;b.classList.add('opening');v11Chime();sparkle();setTimeout(()=>{g.opened=true;if(g.animalType)state.garden.residents.push({type:g.animalType,joinedAt:Date.now()});if(g.specialType&&!state.garden.specialItems.some(s=>s.type===g.specialType))state.garden.specialItems.push({type:g.specialType,earnedAt:Date.now()});save();renderGarden();let names=[];if(g.animalType)names.push('🐾 '+(V11_ANIMAL_LABEL[g.animalType]||'A new friend')+' joined the garden!');if(g.specialType)names.push('✨ A special garden gift appeared too!');v11Notice(names.join('<br>'),4300);let rs=[...document.querySelectorAll('.v11-resident')];rs.forEach(x=>x.classList.add('happy'));setTimeout(()=>rs.forEach(x=>x.classList.remove('happy')),2600);v11Busy=false},650)}
function v11Harvest(i){if(v11Busy)return;let p=state.garden.farmPlots[i];if(!p||p.stage<4)return;v11Busy=true;try{if(window.MWG_GROWTH_AWARD)window.MWG_GROWTH_AWARD(1,'harvest','Harvest')}catch(e){}let veg=v11Veg(p.type),stage=document.getElementById('world'),resident=stage.querySelector('.v11-resident');if(resident)resident.classList.add('eating');let pos=V11_PLOT_POS[i],bubble=document.createElement('div');bubble.className='v11-harvest-bubble';bubble.style.left=pos[0]+'%';bubble.style.top=(pos[1]-9)+'%';bubble.textContent='Yum! '+veg.emoji+' 💛';stage.appendChild(bubble);ding();setTimeout(()=>{state.garden.farmPlots[i]=null;save();renderGarden();v11Busy=false},1500)}
function v11ShowSeedDrawer(){v11SeedDrawerOpen=!v11SeedDrawerOpen;renderGarden()}
function v11SelectSeed(i){let sh=state.garden.seedHouse;if(!sh.seeds[i])return;if(!state.garden.farmPlots.some(p=>!p)){v11Notice('The veggie patch is full. Harvest a ready vegetable first!');return}v11PlantMode={seedIndex:i,type:sh.seeds[i]};v11SeedDrawerOpen=false;renderGarden();v11Notice('🌱 Choose an empty veggie plot for your '+v11Veg(v11PlantMode.type).name+' seed.',0)}
function v11PlantPlot(i){if(!v11PlantMode||state.garden.farmPlots[i])return;let sh=state.garden.seedHouse,idx=v11PlantMode.seedIndex,type=v11PlantMode.type;if(sh.seeds[idx]!==type){idx=sh.seeds.indexOf(type);if(idx<0){v11PlantMode=null;renderGarden();return}}sh.seeds.splice(idx,1);state.garden.farmPlots[i]={type,stage:1,plantedAt:Date.now()};v11PlantMode=null;v11MovePending();save();seedSound();sparkle();renderGarden();v11Notice('🌰 Seed planted! Focus Words will help it grow.',2700)}
function v11RenderSeedDrawer(stage){if(!v11SeedDrawerOpen)return;let d=document.createElement('div');d.className='v11-seed-drawer';let sh=state.garden.seedHouse;d.innerHTML='<h4>🌰 Seed House</h4><div class="v11-seed-grid">'+(sh.seeds.length?sh.seeds.map((k,i)=>`<button class="v11-seed-packet" data-seed="${i}" title="Plant ${v11Veg(k).name}">${v11Veg(k).emoji}</button>`).join(''):'<span class="tiny">No seeds yet. Finish Quick Review to earn one.</span>')+'</div><div class="v11-seed-note">Seeds: '+sh.seeds.length+'/5'+(sh.pending?` · ${sh.pending} waiting safely`:'')+'<br>Tap a seed, then tap an empty veggie plot.</div>';d.onclick=e=>e.stopPropagation();stage.appendChild(d);d.querySelectorAll('[data-seed]').forEach(b=>b.onclick=()=>v11SelectSeed(Number(b.dataset.seed)))}
function v11ChallengeData(){let wk=currentWeek();if(!wk||!wk.wordIds.length)return{wk,done:0,total:0,ready:false};let done=wk.wordIds.filter(wid=>Number(weeklyStat(wid,wk.id).fullLoops||0)>0).length;return{wk,done,total:wk.wordIds.length,ready:done===wk.wordIds.length}}
function v11StageMarkup(){return `<div class="v11-garden-head"><div><h2>Miori's little garden</h2><div class="subtitle">Learn words. Help your animal friends grow a tiny world.</div></div><div class="v11-week-chip" id="weekHint">This Week</div></div><div id="rewardArea"></div><div class="viewport v11-stage" id="viewport"><div class="world" id="world"><img class="v11-base" src="${v12Background()}" alt="Miori's garden"><div class="v11-flower-meadow"></div><div class="v11-farm-surface"><i class="v11-soil p1"></i><i class="v11-soil p2"></i><i class="v11-soil p3"></i><i class="v11-soil p4"></i><span>VEGGIE PATCH</span></div><div class="v11-fountain-glow"></div><button class="v11-hotspot v11-seed-house" id="v11SeedHouse" aria-label="Open Seed House"></button><div class="v11-seed-count" id="v11SeedCount">🌰 0 / 5</div><div class="v11-farm-label">Veggie Patch</div><button class="v11-plot p1" data-plot="0"></button><button class="v11-plot p2" data-plot="1"></button><button class="v11-plot p3" data-plot="2"></button><button class="v11-plot p4" data-plot="3"></button><button class="v11-challenge-sign locked" id="v11ChallengeSign"><span>🔒 Weekly Challenge</span><small id="v11ChallengeSmall">Finish Focus Words</small><div class="v11-progress"><i id="v11ChallengeProgress"></i></div></button><div class="v11-notice" id="v11Notice"></div><div class="v11-stage-dock"><button class="v11-stage-btn" id="v11Focus"><span class="ico">💧</span><span>Focus Words</span><small>Learn · water</small></button><button class="v11-stage-btn" id="v11Review"><span class="ico">🌰</span><span>Quick Review</span><small>Review · seed</small></button><button class="v11-stage-btn" id="v11Bonus"><span class="ico">☀️</span><span>Bonus Sun</span><small>My Words · sunshine</small></button><button class="v11-stage-btn" id="challengeBtn"><span class="ico">🔒</span><span>Weekly Challenge</span><small>Unlock a friend</small></button></div></div></div><div class="v11-under"><div class="v11-session"><div id="sessionBanner"></div><p id="todayText"></p></div><div class="v11-actions" id="gardenActions"></div></div><div id="challengeCard" style="display:none"><p id="challengeText"></p></div>`}

// Replace only the Garden screen; Play and Parent stay intact.
let gardenSection=document.getElementById('garden');gardenSection.innerHTML=v11StageMarkup();

renderGarden=function(){
  v11NormalizeGarden();let wk=currentWeek(),d=ensureDaily(),stage=document.getElementById('world');if(!stage)return;
  stage.querySelectorAll('.v11-plant,.v11-resident,.v11-water-actor,.v11-drops,.v11-grow-ring,.v11-treehouse,.v11-special-item,.v11-gift,.v11-seed-drawer,.v11-harvest-bubble').forEach(x=>x.remove());
  v11RenderPlants(stage);v11RenderResidents(stage);v11RenderSpecials(stage);v11RenderGift(stage);v11RenderSeedDrawer(stage);
  let sh=state.garden.seedHouse,sc=document.getElementById('v11SeedCount');sc.textContent='🌰 '+sh.seeds.length+' / 5'+(sh.pending?' +':'' );sc.classList.toggle('full',sh.seeds.length>=5);
  document.getElementById('v11SeedHouse').onclick=e=>{e.stopPropagation();v11ShowSeedDrawer()};
  document.querySelectorAll('.v11-plot').forEach((b,i)=>{b.classList.toggle('plant-target',!!v11PlantMode&&!state.garden.farmPlots[i]);b.onclick=e=>{e.stopPropagation();let p=state.garden.farmPlots[i];if(!p&&v11PlantMode)v11PlantPlot(i);else if(p&&p.stage===4)v11Harvest(i);else if(!p&&sh.seeds.length)v11Notice('🌰 Open the Seed House first and choose a seed.')}});
  let cd=v11ChallengeData(),sign=document.getElementById('v11ChallengeSign'),cp=document.getElementById('v11ChallengeProgress'),cs=document.getElementById('v11ChallengeSmall');
  document.getElementById('weekHint').textContent=wk?wk.title:'Add This Week words';
  sign.classList.toggle('locked',!cd.ready);cp.style.width=(cd.total?Math.round(cd.done/cd.total*100):0)+'%';
  if(!cd.total){sign.querySelector('span').textContent='🔒 Weekly Challenge';cs.textContent='Add weekly words';sign.onclick=()=>screen('parent')}
  else if(!cd.ready){sign.querySelector('span').textContent='🔒 Weekly Challenge';cs.textContent=cd.done+' / '+cd.total+' Focus Words';sign.onclick=()=>v11Notice('Finish every weekly word once in Focus Words to unlock the challenge.',3000)}
  else if(cd.wk.challengePassed){sign.querySelector('span').textContent='🐾 Weekly Challenge';cs.textContent='Cleared · play again';sign.onclick=startWeeklyChallenge}
  else{sign.querySelector('span').textContent='🔓 Weekly Challenge';cs.textContent='Prize: a new animal friend';sign.onclick=startWeeklyChallenge}
  let bf=document.getElementById('v11Focus'),br=document.getElementById('v11Review'),bb=document.getElementById('v11Bonus'),bc=document.getElementById('challengeBtn');[bf,br,bb,bc].forEach(b=>{b.classList.remove('current','done','challenge-ready');b.disabled=false});
  bc.querySelector('.ico').textContent=cd.ready?'🐾':'🔒';bc.disabled=!cd.ready;bc.classList.toggle('challenge-ready',cd.ready&&!cd.wk?.challengePassed);bc.onclick=()=>{if(cd.ready)startWeeklyChallenge()};
  let sb=document.getElementById('sessionBanner'),txt=document.getElementById('todayText'),acts=document.getElementById('gardenActions');acts.innerHTML='';
  if(!wk||!wk.wordIds.length){bf.disabled=br.disabled=bb.disabled=true;sb.innerHTML='<strong>🌱 Add this week’s spelling words to begin.</strong>';txt.textContent='Parent → This Week can hold up to 15 words.';let b=document.createElement('button');b.className='primary';b.textContent='Go to Parent';b.onclick=()=>screen('parent');acts.appendChild(b)}
  else if(d.ended){bf.disabled=br.disabled=bb.disabled=true;sb.innerHTML='<strong>Great work today, Miori!</strong>';txt.textContent='Today’s learning is saved. Do a little more starts again from Focus Word 1.';let more=document.createElement('button');more.className='v11-encore';more.textContent='Do a little more';more.onclick=resumeToday;acts.appendChild(more)}
  else if(growthRunning||v11Busy){sb.innerHTML='<strong>💧 Watch what happens in the garden…</strong>';txt.textContent='Your learning is helping something grow.';bf.disabled=br.disabled=bb.disabled=true}
  else if(d.phase==='focus'){bf.classList.add('current');br.disabled=true;bb.disabled=true;let done=d.focusCompleted.length;sb.innerHTML=`<strong>💧 Focus Words · ${done}/${d.focusIds.length}</strong>`;txt.textContent='Finish a word and your animal friend will water the garden.';bf.onclick=startDaily;bf.querySelector('span:nth-child(2)').textContent=done?'Continue Focus':'Focus Words'}
  else if(d.phase==='review'){bf.classList.add('done');br.classList.add('current');bb.disabled=true;let done=d.reviewCompleted.length;sb.innerHTML=`<strong>🌰 Quick Review · ${done}/${d.reviewIds.length}</strong>`;txt.textContent='Finish all 3 reviews and a new vegetable seed goes to the Seed House.';bf.disabled=true;br.onclick=startDaily}
  else{bf.classList.add('done');br.classList.add('done');if(d.bonusSunDone)bb.classList.add('done');sb.innerHTML='<strong>🌷 Today’s weekly practice is complete!</strong>';txt.textContent=sh.seeds.length?'You have seeds waiting. Plant one whenever you like. Encore gives one extra watering for each word.':'You can stop here, do an Encore for extra watering, or bring sunshine with a My Word.';bf.disabled=br.disabled=true;let bonus=selectBonusWord();if(bonus&&!d.bonusSunDone){bb.onclick=startBonus}else{bb.disabled=true}let encore=document.createElement('button');encore.className='v11-encore';encore.textContent='Encore · Today’s 3 Words';encore.onclick=startExtraWeekly;acts.appendChild(encore)}
  if(!d.ended&&!growthRunning&&!v11Busy){let finish=document.createElement('button');finish.className='v11-finish';finish.textContent='Finish for today';finish.onclick=finishToday;acts.appendChild(finish)}
  if(v11PlantMode)v11Notice('🌱 Tap an empty veggie plot to plant your '+v11Veg(v11PlantMode.type).name+' seed.',0);
  save();
};


// Stability boundary: Garden rendering is never allowed to take the rest of the game down.
const v12RenderGardenCore=renderGarden;
function v12EmergencyGarden(error){
  console.error('Garden render recovered',error);
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};
  window.MWG_DIAGNOSTICS.lastGardenError=String(error&&error.message||error);
  if(!document.getElementById('v11Focus'))gardenSection.innerHTML=v11StageMarkup();
  let wk=currentWeek(),d=null;
  try{d=v12RepairDailyShape()}catch(e){}
  let sb=document.getElementById('sessionBanner'),txt=document.getElementById('todayText'),acts=document.getElementById('gardenActions');
  if(sb)sb.innerHTML=wk&&wk.wordIds&&wk.wordIds.length?'<strong>💧 Focus Words</strong>':'<strong>🌱 Add this week’s spelling words to begin.</strong>';
  if(txt)txt.textContent=wk&&wk.wordIds&&wk.wordIds.length?'Start with today’s Focus Words.':'Open Parent → This Week to add words.';
  if(acts)acts.innerHTML='';
  ['v11Focus','v11Review','v11Bonus','challengeBtn'].forEach(id=>{let b=document.getElementById(id);if(b)b.disabled=false});
  let br=document.getElementById('v11Review'),bb=document.getElementById('v11Bonus');
  if(d&&d.phase==='focus'){if(br)br.disabled=true;if(bb)bb.disabled=true}
}
renderGarden=function(){
  try{
    v11NormalizeGarden();v12RepairDailyShape();
    return v12RenderGardenCore();
  }catch(e){
    // First repair only Garden/Daily shapes; never erase words, weekly stats, or Parent data.
    try{v11NormalizeGarden();v12RepairDailyShape()}catch(_e){}
    v12EmergencyGarden(e);
  }
};

// Delegated controls are a second safety layer. Garden markup is frequently rebuilt,
// so navigation must not depend on an onclick surviving a render.
gardenSection.addEventListener('click',function(e){
  let target=e.target.closest('button');if(!target||!gardenSection.contains(target))return;
  // When the normal render attached a handler, let that handler be the single source of truth.
  if(typeof target.onclick==='function')return;
  if(target.disabled)return;
  let idv=target.id;
  try{
    if(idv==='v11Focus'){let wk=currentWeek();if(!wk||!wk.wordIds.length){screen('parent');return}let d=v12RepairDailyShape();if(d&&d.ended){resumeToday();return}startDaily();return}
    if(idv==='v11Review'){let d=v12RepairDailyShape();if(d&&d.phase==='review')startDaily();return}
    if(idv==='v11Bonus'){if(selectBonusWord())startBonus();return}
    if(idv==='challengeBtn'||idv==='v11ChallengeSign'){let c=v11ChallengeData();if(c.ready)startWeeklyChallenge();else v11Notice('Finish every weekly word once in Focus Words to unlock the challenge.',2800);return}
    if(idv==='v11SeedHouse'){v11ShowSeedDrawer();return}
    if(target.matches('.v11-plot')){let i=Number(target.dataset.plot),p=state.garden.farmPlots[i];if(!p&&v11PlantMode)v11PlantPlot(i);else if(p&&p.stage===4)v11Harvest(i);else if(!p&&state.garden.seedHouse.seeds.length)v11Notice('🌰 Open the Seed House first and choose a seed.');return}
    if(target.classList.contains('v11-finish')){finishToday();return}
    if(target.classList.contains('v11-encore')){let d=v12RepairDailyShape();if(d&&d.ended)resumeToday();else startExtraWeekly();return}
  }catch(err){console.error('Garden control recovery',err);window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.lastControlError=String(err&&err.message||err)}
});

runGardenWatering=function(after){
  if(v11Busy)return;v11Busy=true;growthRunning=true;screen('garden');renderGarden();audioCtx();let t=v11WaterTarget(),stage=document.getElementById('world');if(!t){growthRunning=false;v11Busy=false;if(after)after();return}
  let mist=document.createElement('div');mist.className='v11-water-origin-mist';stage.appendChild(mist);let actor=document.createElement('div');actor.className='v11-water-actor';actor.innerHTML=`<img src="${v11AssetAnimal(state.garden.residents[0]?.type||'rabbit','water')}" alt="watering friend"><span class="v11-can">🪴</span>`;stage.appendChild(actor);
  let drops=document.createElement('div');drops.className='v11-drops';drops.innerHTML='<i></i><i></i><i></i>';stage.appendChild(drops);requestAnimationFrame(()=>requestAnimationFrame(()=>{actor.style.left=t.x+'%';actor.style.top=(t.y-4)+'%'}));
  setTimeout(()=>{drops.style.left=(t.x-1)+'%';drops.style.top=(t.y-8)+'%';drops.classList.add('show');waterSound()},1050);
  setTimeout(()=>{let msg=v11CommitWater(t),ring=document.createElement('div');ring.className='v11-grow-ring';ring.style.left=t.x+'%';ring.style.top=t.y+'%';stage.appendChild(ring);growSound();sparkle();save();v11Notice('💧 '+msg,2800)},1650);
  setTimeout(()=>{growthRunning=false;v11Busy=false;if(after)after();save();renderGarden()},3000)
};

// Quick Review now gives a Seed House reward and stays in Play for all three questions.
startQuickReview=function(){let d=ensureDaily();if(!d.reviewIds.length){d.reviewIds=selectReviewIds();d.reviewIndex=0}if(d.reviewIndex>=d.reviewIds.length){if(!d.seedRewarded){v11AddSeed();d.seedRewarded=true}d.phase='done';save();screen('garden');return}current=wordById(d.reviewIds[d.reviewIndex]);flowMode='review';showQuickWord(`Quick Review ${d.reviewIndex+1} of ${d.reviewIds.length}`,'Three quick spelling checks in a row. Finish all 3 to earn a vegetable seed.',()=>{let wk=currentWeek(),ws=weeklyStat(current.id,wk.id),ls=lifeStat(current.id);ws.quickReviews++;ls.quickReviews++;ws.lastPracticed=ls.lastPracticed=localDate();if(!d.reviewCompleted.includes(current.id))d.reviewCompleted.push(current.id);d.reviewIndex++;if(d.reviewIndex>=d.reviewIds.length){if(!d.seedRewarded){v11AddSeed();d.seedRewarded=true}d.phase='done';save();screen('garden')}else{save();startQuickReview()}})};

// Bonus Sun is a happy-world event. It does not advance normal growth.
runBonusSun=function(after){let d=ensureDaily();screen('garden');renderGarden();let stage=document.getElementById('world');stage.classList.remove('sunny');void stage.offsetWidth;stage.classList.add('sunny');sunSound();sparkle();document.querySelectorAll('.v11-resident').forEach(x=>x.classList.add('happy'));let changed=false;if(Math.random()<.20){let candidates=state.garden.flowerSpots.filter(f=>f.stage===4&&!f.special);if(candidates.length){let f=candidates[Math.floor(Math.random()*candidates.length)];f.special=true;changed=true}}setTimeout(()=>{d.bonusSunDone=true;d.bonusDone=true;stage.classList.remove('sunny');save();renderGarden();if(changed)v11Notice('✨ Sunshine surprise! One flower became a Special Flower!',4000);else v11Notice('☀️ The whole garden is happy in the sunshine!',2800);if(after)after()},2700)};
startBonus=function(){let wid=selectBonusWord();if(!wid)return;let d=ensureDaily();d.bonusWordId=wid;current=wordById(wid);if(lifeStat(wid).fullLoops===0){flowMode='bonus';step=0;showStep()}else{flowMode='bonusQuick';showQuickWord('☀️ Bonus Sun · My Words','Practice one My Word to bring sunshine to the whole garden. Sometimes sunshine makes a flower special!',()=>{let ls=lifeStat(current.id);ls.quickReviews++;ls.lastPracticed=localDate();save();runBonusSun()})}};
finishBonusLoop=function(){let d=ensureDaily(),ls=lifeStat(current.id);ls.fullLoops++;ls.lastPracticed=localDate();save();runBonusSun()};

// One-button typing flow: the same button checks the answer, then becomes Next/Continue.
function v12SyncActionButton(){
  let c=document.getElementById('continue');if(!c)return;
  c.classList.remove('v12-check','v12-next','v12-reward');
  let t=(c.textContent||'').trim().toLowerCase();
  if(t==='check')c.classList.add('v12-check');
  else if(/water the garden|bonus sun|present|result|garden/.test(t))c.classList.add('v12-reward');
  else c.classList.add('v12-next');
}
let v12ActionObserver=new MutationObserver(v12SyncActionButton);v12ActionObserver.observe(document.getElementById('continue'),{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['style']});
makeBoxes=function(a,{expected,prefix='',suffix='',testMode=false,onCorrect=null,onWrong=null}){
  let wrap=document.createElement('div');wrap.className='spell-line';
  if(prefix){let p=document.createElement('span');p.className='fixed-part';p.textContent=prefix;wrap.appendChild(p)}
  let boxes=[];for(let i=0;i<expected.length;i++){let b=document.createElement('span');b.className='letter-box';wrap.appendChild(b);boxes.push(b)}
  if(suffix){let x=document.createElement('span');x.className='fixed-part';x.textContent=suffix;wrap.appendChild(x)}
  let input=document.createElement('input');input.className='capture';input.autocomplete='off';input.autocapitalize='none';input.setAttribute('autocorrect','off');input.spellcheck=false;input.maxLength=expected.length;
  let help=document.createElement('div');help.className='typing-help';help.textContent='Type one letter in each box. Then press Check.';
  let c=document.getElementById('continue');c.style.display='';c.textContent='Check';c.disabled=true;v12SyncActionButton();
  function render(clear=true){let v=norm(input.value).replace(/[^a-z]/g,'').slice(0,expected.length);input.value=v;boxes.forEach((b,i)=>{b.textContent=v[i]||'';if(clear)b.classList.remove('good','bad');b.classList.toggle('active',i===v.length&&v.length<expected.length)});c.disabled=!v.length;return v}
  function mark(v){boxes.forEach((b,i)=>{b.classList.remove('active','good','bad');b.classList.add(v[i]===norm(expected)[i]?'good':'bad')})}
  function check(){if(answered)return;let v=render(false);if(!v)return;if(v===norm(expected)){c.disabled=false;if(onCorrect)onCorrect();else correct()}else{mark(v);if(onWrong)onWrong();else wrongTyped();c.textContent='Check';c.disabled=false;continueAction=check;v12SyncActionButton()}}
  continueAction=check;
  input.oninput=()=>{render(true);continueAction=check;c.textContent='Check';v12SyncActionButton();if(testMode)document.getElementById('feedback').textContent=''};
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();check()}};wrap.onclick=()=>input.focus();a.append(wrap,input,help);render(true);setTimeout(()=>input.focus(),80)
};
v12SyncActionButton();

// Weekly Challenge: clearing always earns an animal. Perfect also earns a special garden item.
showChallengeResult=function(){let wk=currentWeek(),perfect=testWrongWords.size===0,firstTry=test.length-testWrongWords.size;wk.challengeAttempts=(wk.challengeAttempts||0)+1;wk.bestFirstTry=Math.max(wk.bestFirstTry||0,firstTry);wk.challengePassed=true;let animalType=null,specialType=null;if(!wk.animalRewardGranted){let already=state.garden.residents.map(r=>r.type);animalType=V11_ANIMALS.find((a,i)=>i>0&&!already.includes(a))||V11_ANIMALS[(state.garden.residents.length)%V11_ANIMALS.length];wk.animalRewardGranted=true;wk.rewardGranted=true}if(perfect&&!wk.perfectRewardGranted){specialType=V11_SPECIALS.find(s=>!state.garden.specialItems.some(x=>x.type===s))||V11_SPECIALS[state.garden.specialItems.length%V11_SPECIALS.length];wk.perfectRewardGranted=true}if(animalType||specialType)state.garden.gifts.push({id:id(),animalType,specialType,opened:false,earnedAt:Date.now()});screen('play');document.getElementById('counter').textContent='Weekly Challenge complete';document.getElementById('mode').textContent=wk.title;document.getElementById('title').textContent=perfect?'Perfect Week! ✨':'Weekly Challenge cleared! 🐾';document.getElementById('hint').textContent=perfect?'A present is waiting in the garden — a new friend, plus a Perfect gift!':'A present is waiting in the garden. Open it to meet your new animal friend!';document.getElementById('area').innerHTML='<div class="summary"><div class="score">'+firstTry+'/'+test.length+'</div><div>first-try correct</div><div class="challenge-prize" style="justify-content:center;margin-top:12px"><span class="prize-chip">🐾 Clear → Animal friend</span>'+(perfect?'<span class="prize-chip">✨ Perfect → Special item</span>':'')+'</div></div>';document.getElementById('feedback').textContent='';let c=document.getElementById('continue');c.style.display='';c.textContent=(animalType||specialType)?'See my present':'Back to Garden';continueAction=()=>{save();screen('garden');if(animalType||specialType)v11Notice('🎁 Tap the present box to open it!',0)};save()};

// v0.12 daily-state contract: Finish closes today; resume/reset always creates a playable route from Focus Word 1.
function v12ClearPlayRuntime(){
  try{answered=false;step=0;gap=null;flowMode='focus';continueAction=null;currentHadWrong=false;quickHadWrong=false;current=null;reviewStep=3;encoreIds=[];encoreIndex=0}catch(e){}
  try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
  growthRunning=false;v11Busy=false;v11PlantMode=null;v11SeedDrawerOpen=false;
  // A hidden CHECK button may still be disabled from a previous typing step.
  // Always return the one physical action control to a neutral state.
  try{let c=document.getElementById('continue');if(c){c.disabled=false;c.style.display='none';c.textContent='Continue';c.classList.remove('v12-check','v12-next','v12-reward')}}catch(e){}
  try{document.getElementById('feedback').textContent='';document.getElementById('wrongActions').innerHTML=''}catch(e){}
}
function v12RestartDaily(existing,{preserveEarnedRewards=true}={}){
  let wk=currentWeek(),old=existing||state.daily||{},valid=new Set((wk?.wordIds||[]).filter(wid=>wordById(wid)));
  let focus=(old.focusIds||[]).filter(wid=>valid.has(wid)).slice(0,3);
  let desired=Math.min(3,(wk?.wordIds||[]).length);
  if(focus.length<desired){for(let wid of selectFocusIds()){if(!focus.includes(wid)&&valid.has(wid))focus.push(wid);if(focus.length>=desired)break}}
  if(!focus.length)focus=selectFocusIds();
  let nd={date:localDate(),weekId:state.currentWeekId,focusIds:focus,focusIndex:0,focusCompleted:[],reviewIds:[],reviewIndex:0,reviewCompleted:[],phase:'focus',awaitingNext:false,bonusDone:false,bonusWordId:null,bonusSeedId:null,bonusSeedPlanted:false,bonusSunDone:false,seedRewarded:false,ended:false};
  if(preserveEarnedRewards){nd.seedRewarded=!!old.seedRewarded;nd.bonusSunDone=!!old.bonusSunDone;nd.bonusDone=!!old.bonusDone}
  return nd;
}
let oldFinish=finishToday;finishToday=function(){let d=ensureDaily();if(d.ended)return;d.ended=true;d.endedAt=Date.now();save();screen('garden');setTimeout(()=>{finishFanfare();paperParty();document.querySelectorAll('.v11-resident').forEach(x=>x.classList.add('happy'));v11Notice('<strong>Great work today, Miori!</strong><br>The garden is happy you came. 🌷',3600)},100)};
resumeToday=function(){
  let old=ensureDaily();
  state.daily=v12RestartDaily(old,{preserveEarnedRewards:true});
  v12ClearPlayRuntime();save();
  // Atomic resume: Do a little more itself starts Focus Word 1.
  // There is no intermediate Garden state that can become stranded.
  startDaily();
};

// Parent resets are safe and deterministic: no half-finished play globals survive the reset.
let rd=document.getElementById('resetDay');if(rd)rd.onclick=()=>{if(confirm("Restart today's practice from Focus Word 1? Weekly learning history and garden rewards will stay.")){let old=ensureDaily();state.daily=v12RestartDaily(old,{preserveEarnedRewards:true});v12ClearPlayRuntime();save();renderParent();screen('garden');renderGarden();v11Notice('Today was reset. Start again from Focus Word 1.',3000)}};
let rg=document.getElementById('resetGarden');if(rg)rg.onclick=()=>{if(confirm('Reset the whole garden for prototype testing?')){state.garden=v11DefaultGarden();v12ClearPlayRuntime();save();renderGarden()}};

// v0.11 export/import.
let ex=document.getElementById('export');if(ex)ex.onclick=()=>{let b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='miori-word-garden-v012-data.json';a.click();URL.revokeObjectURL(u)};
let imp=document.getElementById('import');if(imp)imp.onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let d=JSON.parse(await f.text());if(!Array.isArray(d.words))throw new Error('bad');state=d;v11NormalizeGarden();state.daily=freshDaily();save();renderEntryRows();renderParent();renderGarden();loadVoices()}catch(err){alert('Could not import this file.')}};

// Play tab is an action route, not an empty screen. It always opens the correct playable state.
function v12OpenPlay(){
  let wk=currentWeek(),d=ensureDaily();
  if(!wk||!wk.wordIds.length){screen('parent');return}
  if(d.ended){screen('garden');renderGarden();v11Notice('Today is finished. Tap “Do a little more” if you want another round.',2800);return}
  if(d.phase==='focus'||d.phase==='review'){startDaily();return}
  screen('garden');renderGarden();v11Notice('Today’s required practice is complete. Choose Bonus Sun or Encore if you want more.',3000);
}
let playTab=document.querySelector('.tab[data-screen="play"]');if(playTab)playTab.onclick=v12OpenPlay;

// challenge button was recreated with Garden markup.
let v12ChallengeBtn=document.getElementById('challengeBtn');if(v12ChallengeBtn)v12ChallengeBtn.onclick=()=>{let c=v11ChallengeData();if(c.ready)startWeeklyChallenge()};




// ================= v0.12.5 session/reward contract =================
// Garden state is persistent. Daily/Encore state is disposable. Finish, Do a little more,
// and Parent Today's Reset are never allowed to rebuild or replace earned Garden progress.
function v125Clone(value){
  try{return structuredClone(value)}catch(e){try{return JSON.parse(JSON.stringify(value))}catch(_e){return value}}
}
function v125GardenSnapshot(){return v125Clone(state.garden||v11DefaultGarden())}
function v125RestoreGarden(snapshot){if(snapshot)state.garden=snapshot}
function v125RunId(){return 'run-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}

// Every practice cycle has its own review reward identity. Legacy seedRewarded booleans
// no longer suppress a new Quick Review seed.
const v125FreshDailyBase=freshDaily;
freshDaily=function(){
  let d=v125FreshDailyBase();
  d.runId=v125RunId();
  d.reviewRewardedRunId=null;
  d.seedRewarded=false;
  d.bonusSunDone=false;
  d.bonusDone=false;
  return d;
};
const v125EnsureDailyBase=ensureDaily;
ensureDaily=function(){
  let d=v125EnsureDailyBase();
  if(!d.runId)d.runId=v125RunId();
  if(!Object.prototype.hasOwnProperty.call(d,'reviewRewardedRunId'))d.reviewRewardedRunId=null;
  return d;
};

const v125RestartDailyBase=v12RestartDaily;
v12RestartDaily=function(existing,opts={}){
  // Daily flags are intentionally fresh. The actual earned items live in state.garden,
  // which is preserved separately and must not be represented by seedRewarded/bonus flags.
  let nd=v125RestartDailyBase(existing,{preserveEarnedRewards:false});
  nd.runId=v125RunId();
  nd.reviewRewardedRunId=null;
  nd.seedRewarded=false;
  nd.bonusSunDone=false;
  nd.bonusDone=false;
  nd.ended=false;
  delete nd.endedAt;
  return nd;
};

function v125AwardQuickReviewSeed(d){
  d= d||ensureDaily();
  if(!d.runId)d.runId=v125RunId();
  if(d.reviewRewardedRunId===d.runId)return false;
  v11AddSeed();
  d.reviewRewardedRunId=d.runId;
  d.seedRewarded=true; // compatibility only; runId is the source of truth.
  save();
  try{if(window.MWG_GROWTH_AWARD)window.MWG_GROWTH_AWARD(2,'quick-review','Quick Review')}catch(e){}
  return true;
}

// Quick Review is a 3-question uninterrupted set. Completing the set awards exactly
// one Seed House seed for this practice run, even when old data contains seedRewarded=true.
startQuickReview=function(){
  let d=ensureDaily();
  if(!d.reviewIds.length){d.reviewIds=selectReviewIds();d.reviewIndex=0;d.reviewCompleted=[]}
  if(!d.reviewIds.length){d.phase='done';save();screen('garden');v11Notice('Quick Review will appear after weekly words have been introduced.',2800);return}
  if(d.reviewIndex>=d.reviewIds.length){
    let got=v125AwardQuickReviewSeed(d);d.phase='done';save();screen('garden');
    if(got)v11Notice('🌰 Quick Review complete! A new vegetable seed is in the Seed House.',3600);
    return;
  }
  current=wordById(d.reviewIds[d.reviewIndex]);flowMode='review';
  showQuickWord(`Quick Review ${d.reviewIndex+1} of ${d.reviewIds.length}`,'Three quick spelling checks in a row. Finish the set to earn one vegetable seed.',()=>{
    let wk=currentWeek(),ws=weeklyStat(current.id,wk.id),ls=lifeStat(current.id);
    ws.quickReviews++;ls.quickReviews++;ws.lastPracticed=ls.lastPracticed=localDate();
    if(!d.reviewCompleted.includes(current.id))d.reviewCompleted.push(current.id);
    d.reviewIndex++;
    if(d.reviewIndex>=d.reviewIds.length){
      let got=v125AwardQuickReviewSeed(d);d.phase='done';save();screen('garden');
      if(got)v11Notice('🌰 Quick Review complete! A new vegetable seed is in the Seed House.',3600);
    }else{save();startQuickReview()}
  });
};

// Encore is optional extra effort, so each correctly completed Encore word earns one
// real Garden watering. The watering animation plays, then the next Encore word opens.
function v125FinishEncore(){
  let d=ensureDaily();d.encoreRuns=(d.encoreRuns||0)+1;save();try{if(window.MWG_GROWTH_AWARD)window.MWG_GROWTH_AWARD(2,'encore','Encore')}catch(e){}screen('garden');
  setTimeout(()=>{sparkle();ding();v11Notice('💧 Encore complete! Three extra words helped the garden grow.',3300)},80);
}
runEncoreWord=function(){
  if(encoreIndex>=encoreIds.length){v125FinishEncore();return}
  current=wordById(encoreIds[encoreIndex]);flowMode='extraWeekly';
  showQuickWord(`Encore Practice ${encoreIndex+1} of ${encoreIds.length}`,"Today's Focus Words, one more time. Each correct word earns one extra watering.",()=>{
    let wk=currentWeek(),ws=weeklyStat(current.id,wk.id),ls=lifeStat(current.id);
    ws.quickReviews++;ls.quickReviews++;ws.lastPracticed=ls.lastPracticed=localDate();
    encoreIndex++;save();
    runGardenWatering(()=>{if(encoreIndex>=encoreIds.length)v125FinishEncore();else runEncoreWord()});
  });
};
startExtraWeekly=function(){
  let d=ensureDaily(),wk=currentWeek();if(!wk||!wk.wordIds.length||d.ended)return;
  encoreIds=(d.focusIds||[]).filter(wid=>wordById(wid));
  if(!encoreIds.length)encoreIds=[...wk.wordIds].sort((a,b)=>hardScore(b,wk.id)-hardScore(a,wk.id)).slice(0,3);
  encoreIndex=0;runEncoreWord();
};

// Finish only closes the current route. It never edits Garden inventory/plants/residents.
finishToday=function(){
  let garden=v125GardenSnapshot(),d=ensureDaily();if(d.ended)return;
  d.ended=true;d.endedAt=Date.now();v125RestoreGarden(garden);save();screen('garden');
  setTimeout(()=>{finishFanfare();paperParty();document.querySelectorAll('.v11-resident').forEach(x=>x.classList.add('happy'));v11Notice('<strong>Great work today, Miori!</strong><br>Your garden progress is safely saved. 🌷',3600)},100);
};

// Do a little more starts a fresh practice cycle at Focus Word 1 while carrying the
// Garden forward byte-for-byte (apart from defensive normalization during rendering).
resumeToday=function(){
  let garden=v125GardenSnapshot(),old=ensureDaily();
  state.daily=v12RestartDaily(old);v125RestoreGarden(garden);v12ClearPlayRuntime();save();startDaily();
};

// Parent Today's Reset follows the same contract: practice resets, Garden does not.
let v125ResetDay=document.getElementById('resetDay');
if(v125ResetDay)v125ResetDay.onclick=()=>{
  if(confirm("Restart today's practice from Focus Word 1? Your Garden, weekly history, seeds, plants and animal friends will stay.")){
    let garden=v125GardenSnapshot(),old=ensureDaily();
    state.daily=v12RestartDaily(old);v125RestoreGarden(garden);v12ClearPlayRuntime();save();
    renderParent();screen('garden');renderGarden();v11Notice('Today’s practice was reset. Your Garden stayed exactly as it was.',3200);
  }
};

// ================= v0.12.5 Play controller =================
// Keep the practice screen deterministic: every new step resets the shared action
// button, Play opens at the top, and Enter advances after a correct answer.
function v123ResetActionForStep(){
  let c=document.getElementById('continue');if(!c)return;
  c.disabled=false;c.style.display='none';c.textContent='Continue';
  c.classList.remove('v12-check','v12-next','v12-reward');
  continueAction=null;
}
function v123EnterPlayMode(){
  document.body.classList.add('mwg-play-mode');
  requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
}
function v123LeavePlayMode(){document.body.classList.remove('mwg-play-mode')}

// Screen state owns the layout state. This avoids carrying Garden scroll position
// into Play, which was one reason the action button appeared below the fold.
const v123ScreenBase=screen;
screen=function(n){
  v123ScreenBase(n);
  if(n==='play'&&document.getElementById('play')?.classList.contains('active'))v123EnterPlayMode();
  else v123LeavePlayMode();
};

// Every new ordinary Focus/Bonus step starts from a known action-button state.
const v123ShowStepBase=showStep;
showStep=function(){v123ResetActionForStep();v123ShowStepBase();v123EnterPlayMode()};

// The review scaffold is also used by Quick Review, Bonus quick practice, and Encore.
const v123ReviewStepBase=renderReviewStep;
renderReviewStep=function(){v123ResetActionForStep();v123ReviewStepBase();v123EnterPlayMode()};

// Challenge spelling uses the same physical button, so clear stale disabled state here too.
const v123ChallengeWordBase=showChallengeWord;
showChallengeWord=function(){v123ResetActionForStep();v123ChallengeWordBase();v123EnterPlayMode()};

// Choice steps do not use CHECK. After a correct choice, the same action button must
// always be enabled as NEXT, even if the previous screen left CHECK disabled.
const v123CorrectBase=correct;
correct=function(){
  let c=document.getElementById('continue');if(c)c.disabled=false;
  v123CorrectBase();
  if(c)c.disabled=false;
  v12SyncActionButton();
};
const v123ReviewCorrectBase=reviewCorrect;
reviewCorrect=function(){
  let c=document.getElementById('continue');if(c)c.disabled=false;
  v123ReviewCorrectBase();
  if(c)c.disabled=false;
  v12SyncActionButton();
};

// Enter behavior:
// - Before an answer is correct, typing inputs keep their normal CHECK-on-Enter behavior.
// - After a correct answer (including Step 1/2 choices), Enter means NEXT.
// Capture phase prevents a focused choice button from firing a second default click.
document.addEventListener('keydown',function(e){
  if(e.key!=='Enter'||e.repeat)return;
  let play=document.getElementById('play');if(!play||!play.classList.contains('active'))return;
  if(!answered)return;
  let c=document.getElementById('continue');
  if(!c||c.style.display==='none'||c.disabled||typeof continueAction!=='function')return;
  e.preventDefault();e.stopImmediatePropagation();c.click();
},true);

// If this script loads while Play is already active (for example after recovery),
// normalize the layout immediately.
if(document.getElementById('play')?.classList.contains('active'))v123EnterPlayMode();



// ================= v0.12.6 route/state fixes =================
// 1) A word that has never completed a weekly 4-step Focus loop ALWAYS has priority.
//    This prevents the final weekly word from being starved by repeated high-error words.
selectFocusIds=function(){
  let w=currentWeek();if(!w)return[];
  let valid=(w.wordIds||[]).filter(wid=>wordById(wid));
  let never=valid.filter(wid=>Number(weeklyStat(wid,w.id).fullLoops||0)===0);
  let chosen=never.slice(0,3);
  if(chosen.length<Math.min(3,valid.length)){
    let rest=valid.filter(wid=>!chosen.includes(wid)&&Number(weeklyStat(wid,w.id).fullLoops||0)>0)
      .sort((a,b)=>hardScore(b,w.id)-hardScore(a,w.id));
    chosen.push(...rest.slice(0,Math.min(3,valid.length)-chosen.length));
  }
  return chosen;
};
selectReviewIds=function(){
  let w=currentWeek(),d=ensureDaily();if(!w)return[];
  let practiced=(w.wordIds||[]).filter(wid=>wordById(wid)&&Number(weeklyStat(wid,w.id).fullLoops||0)>0);
  let outside=practiced.filter(wid=>!d.focusIds.includes(wid)).sort((a,b)=>hardScore(b,w.id)-hardScore(a,w.id));
  let inside=practiced.filter(wid=>d.focusIds.includes(wid)).sort((a,b)=>hardScore(b,w.id)-hardScore(a,w.id));
  return [...outside,...inside].slice(0,Math.min(3,practiced.length));
};
weekReady=function(w=currentWeek()){
  return !!(w&&w.wordIds&&w.wordIds.length&&w.wordIds.every(wid=>wordById(wid)&&Number(weeklyStat(wid,w.id).fullLoops||0)>0));
};
v11ChallengeData=function(){
  let wk=currentWeek();if(!wk||!wk.wordIds||!wk.wordIds.length)return{wk,done:0,total:0,ready:false};
  let valid=wk.wordIds.filter(wid=>wordById(wid));
  let done=valid.filter(wid=>Number(weeklyStat(wid,wk.id).fullLoops||0)>0).length;
  return{wk,done,total:valid.length,ready:valid.length>0&&done===valid.length};
};

// 2) The stage menu belongs below the illustrated Garden, never on top of it.
v11StageMarkup=function(){return `<div class="v11-garden-head"><div><h2>Miori's little garden</h2><div class="subtitle">Learn words. Help your animal friends grow a tiny world.</div></div><div class="v11-week-chip" id="weekHint">This Week</div></div><div id="rewardArea"></div><div class="v11-stage-dock" id="v126GardenMenu"><button class="v11-stage-btn" id="v11Focus"><span class="ico">💧</span><span>Focus Words</span><small>Learn · water</small></button><button class="v11-stage-btn" id="v11Review"><span class="ico">🌰</span><span>Quick Review</span><small>Review · seed</small></button><button class="v11-stage-btn" id="v11Bonus"><span class="ico">☀️</span><span>Bonus Sun</span><small>My Words · sunshine</small></button><button class="v11-stage-btn" id="challengeBtn"><span class="ico">🔒</span><span>Weekly Challenge</span><small>Unlock a friend</small></button></div><div class="viewport v11-stage" id="viewport"><div class="world" id="world"><img class="v11-base" src="${v12Background()}" alt="Miori's garden"><div class="v11-flower-meadow"></div><div class="v11-farm-surface"><i class="v11-soil p1"></i><i class="v11-soil p2"></i><i class="v11-soil p3"></i><i class="v11-soil p4"></i><span>VEGGIE PATCH</span></div><div class="v11-fountain-glow"></div><button class="v11-hotspot v11-seed-house" id="v11SeedHouse" aria-label="Open Seed House"></button><div class="v11-seed-count" id="v11SeedCount">🌰 0 / 5</div><div class="v11-farm-label">Veggie Patch</div><button class="v11-plot p1" data-plot="0"></button><button class="v11-plot p2" data-plot="1"></button><button class="v11-plot p3" data-plot="2"></button><button class="v11-plot p4" data-plot="3"></button><button class="v11-challenge-sign locked" id="v11ChallengeSign"><span>🔒 Weekly Challenge</span><small id="v11ChallengeSmall">Finish Focus Words</small><div class="v11-progress"><i id="v11ChallengeProgress"></i></div></button><div class="v11-notice" id="v11Notice"></div></div></div><div class="v11-under"><div class="v11-session"><div id="sessionBanner"></div><p id="todayText"></p></div><div class="v11-actions" id="gardenActions"></div></div><div id="challengeCard" style="display:none"><p id="challengeText"></p></div>`};
// Rebuild once with the corrected hierarchy. Delegated listener stays on gardenSection.
gardenSection.innerHTML=v11StageMarkup();

function v126RestartPractice(existing,{keepFocus=false}={}){
  let old=existing||ensureDaily(),nd=v12RestartDaily(old),wk=currentWeek();
  let valid=new Set((wk?.wordIds||[]).filter(wid=>wordById(wid)));
  let focus=[];
  if(keepFocus)focus=(old.focusIds||[]).filter(wid=>valid.has(wid)).slice(0,3);
  if(!focus.length)focus=selectFocusIds();
  nd.focusIds=focus;nd.focusIndex=0;nd.focusCompleted=[];
  nd.reviewIds=[];nd.reviewIndex=0;nd.reviewCompleted=[];nd.phase='focus';
  nd.ended=false;delete nd.endedAt;nd.seedRewarded=false;nd.reviewRewardedRunId=null;
  nd.bonusSunDone=false;nd.bonusDone=false;nd.bonusWordId=null;nd.awaitingNext=false;
  nd.justCompletedEncore=false;nd.justCompletedReview=false;nd.resumedForMore=false;
  return nd;
}

// Do a little more creates the NEXT fair Focus batch, but returns to Garden first.
// Miori deliberately taps Focus Words to begin; this makes the route visible and reversible.
resumeToday=function(){
  let garden=v125GardenSnapshot(),old=ensureDaily();
  state.daily=v126RestartPractice(old,{keepFocus:false});state.daily.resumedForMore=true;
  v125RestoreGarden(garden);v12ClearPlayRuntime();save();screen('garden');renderGarden();
  setTimeout(()=>v11Notice('💧 Ready for another round. Tap Focus Words when you want to start.',3200),60);
};

// Parent Today's Reset means "restart this same daily set", not "rotate to the next set".
let v126ResetDay=document.getElementById('resetDay');
if(v126ResetDay)v126ResetDay.onclick=()=>{
  if(confirm("Restart today's practice from Focus Word 1? Your Garden and weekly learning history will stay.")){
    let garden=v125GardenSnapshot(),old=ensureDaily();
    state.daily=v126RestartPractice(old,{keepFocus:true});v125RestoreGarden(garden);v12ClearPlayRuntime();save();
    renderParent();screen('garden');renderGarden();v11Notice('Today’s 3 Focus Words were reset to Word 1. Your Garden stayed the same.',3200);
  }
};

// Clear route notes only when a new practice route actually starts.
const v126StartDailyBase=startDaily;
startDaily=function(){let d=ensureDaily();d.resumedForMore=false;d.justCompletedEncore=false;d.justCompletedReview=false;save();return v126StartDailyBase()};
const v126StartBonusBase=startBonus;
startBonus=function(){let d=ensureDaily();d.justCompletedEncore=false;d.justCompletedReview=false;save();return v126StartBonusBase()};
const v126StartExtraBase=startExtraWeekly;
startExtraWeekly=function(){let d=ensureDaily();d.justCompletedEncore=false;d.justCompletedReview=false;save();return v126StartExtraBase()};

// 3) Quick Review completion explicitly lands in a Bonus-Sun-ready Garden state.
startQuickReview=function(){
  let d=ensureDaily();
  if(!d.reviewIds.length){d.reviewIds=selectReviewIds();d.reviewIndex=0;d.reviewCompleted=[]}
  if(!d.reviewIds.length){d.phase='done';d.justCompletedReview=true;save();screen('garden');renderGarden();return}
  if(d.reviewIndex>=d.reviewIds.length){
    let got=v125AwardQuickReviewSeed(d);d.phase='done';d.justCompletedReview=true;save();screen('garden');renderGarden();
    if(got)setTimeout(()=>v11Notice('🌰 Quick Review complete! Your seed is in the Seed House. Bonus Sun is ready too.',3600),50);
    return;
  }
  current=wordById(d.reviewIds[d.reviewIndex]);flowMode='review';
  showQuickWord(`Quick Review ${d.reviewIndex+1} of ${d.reviewIds.length}`,'Three quick spelling checks in a row. Finish the set to earn one vegetable seed.',()=>{
    let wk=currentWeek(),ws=weeklyStat(current.id,wk.id),ls=lifeStat(current.id);
    ws.quickReviews++;ls.quickReviews++;ws.lastPracticed=ls.lastPracticed=localDate();
    if(!d.reviewCompleted.includes(current.id))d.reviewCompleted.push(current.id);
    d.reviewIndex++;
    if(d.reviewIndex>=d.reviewIds.length){
      let got=v125AwardQuickReviewSeed(d);d.phase='done';d.justCompletedReview=true;save();screen('garden');renderGarden();
      if(got)setTimeout(()=>v11Notice('🌰 Quick Review complete! Your seed is in the Seed House. Bonus Sun is ready too.',3600),50);
    }else{save();startQuickReview()}
  });
};

// 4) Harvest used to render while v11Busy was still true, permanently leaving the
//    Garden menu disabled. Release the lock BEFORE rendering the post-harvest state.
v11Harvest=function(i){
  if(v11Busy)return;let p=state.garden.farmPlots[i];if(!p||p.stage<4)return;
  v11Busy=true;let veg=v11Veg(p.type),stage=document.getElementById('world'),resident=stage?.querySelector('.v11-resident');
  if(resident)resident.classList.add('eating');let pos=V11_PLOT_POS[i],bubble=document.createElement('div');
  bubble.className='v11-harvest-bubble';bubble.style.left=pos[0]+'%';bubble.style.top=(pos[1]-9)+'%';bubble.textContent='Yum! '+veg.emoji+' 💛';if(stage)stage.appendChild(bubble);ding();
  setTimeout(()=>{state.garden.farmPlots[i]=null;v11Busy=false;save();renderGarden();v11Notice('😊 Yum! The veggie patch is ready for another seed.',2500)},1500);
};

// 5) Encore always returns with an explicit next route instead of a blank-feeling Garden.
v125FinishEncore=function(){
  let d=ensureDaily();d.encoreRuns=(d.encoreRuns||0)+1;d.justCompletedEncore=true;save();v11Busy=false;growthRunning=false;screen('garden');renderGarden();
  setTimeout(()=>{sparkle();ding();v11Notice('💧 Encore complete! Three extra waterings helped the garden.',3300)},60);
};

function v126PostRender(){
  let wk=currentWeek(),d=ensureDaily();if(!wk||!wk.wordIds?.length)return;
  let bf=document.getElementById('v11Focus'),br=document.getElementById('v11Review'),bb=document.getElementById('v11Bonus'),bc=document.getElementById('challengeBtn');
  if(!bf||!br||!bb||!bc)return;
  // Re-wire from state on every render. This is intentionally redundant: a render,
  // harvest, watering animation or mobile reflow can never strand a navigation button.
  [bf,br,bb].forEach(b=>{b.onclick=null;b.disabled=true});
  if(!d.ended&&!growthRunning&&!v11Busy){
    if(d.phase==='focus'){bf.disabled=false;bf.onclick=startDaily}
    if(d.phase==='review'){br.disabled=false;br.onclick=startDaily}
    if(d.phase==='done'&&!d.bonusSunDone){let bonus=selectBonusWord();if(bonus){bb.disabled=false;bb.onclick=startBonus}}
  }
  let cd=v11ChallengeData();bc.disabled=!cd.ready;bc.onclick=cd.ready?startWeeklyChallenge:null;
  let sb=document.getElementById('sessionBanner'),txt=document.getElementById('todayText');
  if(d.resumedForMore&&!d.ended&&d.phase==='focus'){
    sb.innerHTML='<strong>💧 Ready for another round</strong> <span class="v126-route-note">Start from Garden</span>';
    txt.textContent='Tap Focus Words when you’re ready. The next not-yet-finished weekly words are prioritized.';
  }else if(d.justCompletedEncore&&!d.ended&&d.phase==='done'){
    sb.innerHTML='<strong>💧 Encore complete!</strong>';
    txt.textContent=d.bonusSunDone?'Your extra water helped the garden. You can finish for today or do another Encore.':'Your extra water helped the garden. Bonus Sun is still available, or you can do another Encore.';
  }else if(d.justCompletedReview&&!d.ended&&d.phase==='done'){
    sb.innerHTML='<strong>🌰 Quick Review complete — Seed earned!</strong>';
    txt.textContent=selectBonusWord()&&!d.bonusSunDone?'The seed is safe in the Seed House. Bonus Sun is now available. Plant the seed whenever you like.':'The seed is safe in the Seed House. Plant it whenever you like.';
  }
}
const v126RenderGardenBase=renderGarden;
renderGarden=function(){let out=v126RenderGardenBase();try{v126PostRender()}catch(e){console.error('v0.12.6 post-render recovery',e)}return out};

// Re-render with v0.12.6 hierarchy and state rules.
window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
window.MWG_TEST_HOOKS.focusSelection=()=>selectFocusIds();
window.MWG_TEST_HOOKS.routeState=()=>{let d=ensureDaily(),c=v11ChallengeData();return{phase:d.phase,ended:d.ended,focusIds:[...(d.focusIds||[])],reviewIds:[...(d.reviewIds||[])],bonusReady:!!selectBonusWord()&&!d.bonusSunDone,challenge:c}};




// ================= v0.12.7 Garden route polish =================
// 1) Keep the learning menu BELOW the illustrated Garden on every screen size.
v11StageMarkup=function(){return `<div class="v11-garden-head"><div><h2>Miori's little garden</h2><div class="subtitle">Learn words. Help your animal friends grow a tiny world.</div></div><div class="v11-week-chip" id="weekHint">This Week</div></div><div id="rewardArea"></div><div class="viewport v11-stage" id="viewport"><div class="world" id="world"><img class="v11-base" src="${v12Background()}" alt="Miori's garden"><div class="v11-flower-meadow"></div><div class="v11-farm-surface"><i class="v11-soil p1"></i><i class="v11-soil p2"></i><i class="v11-soil p3"></i><i class="v11-soil p4"></i><span>VEGGIE PATCH</span></div><div class="v11-fountain-glow"></div><button class="v11-hotspot v11-seed-house" id="v11SeedHouse" aria-label="Open Seed House"></button><div class="v11-seed-count" id="v11SeedCount">🌰 0 / 5</div><div class="v11-farm-label">Veggie Patch</div><button class="v11-plot p1" data-plot="0"></button><button class="v11-plot p2" data-plot="1"></button><button class="v11-plot p3" data-plot="2"></button><button class="v11-plot p4" data-plot="3"></button><button class="v11-challenge-sign locked" id="v11ChallengeSign"><span>🔒 Weekly Challenge</span><small id="v11ChallengeSmall">Finish Focus Words</small><div class="v11-progress"><i id="v11ChallengeProgress"></i></div></button><div class="v11-notice" id="v11Notice"></div></div></div><div class="v11-stage-dock" id="v126GardenMenu"><button class="v11-stage-btn" id="v11Focus"><span class="ico">💧</span><span>Focus Words</span><small>Learn · water</small></button><button class="v11-stage-btn" id="v11Review"><span class="ico">🌰</span><span>Quick Review</span><small>Review · seed</small></button><button class="v11-stage-btn" id="v11Bonus"><span class="ico">☀️</span><span>Bonus Sun</span><small>My Words · sunshine</small></button><button class="v11-stage-btn" id="challengeBtn"><span class="ico">🔒</span><span>Weekly Challenge</span><small>Unlock a friend</small></button></div><div class="v11-under"><div class="v11-session"><div id="sessionBanner"></div><p id="todayText"></p></div><div class="v11-actions" id="gardenActions"></div></div><div id="challengeCard" style="display:none"><p id="challengeText"></p></div>`};
// v0.12.6 rebuilt this once above the Garden; rebuild once more with the final order.
gardenSection.innerHTML=v11StageMarkup();

// 2) Opening a Weekly gift must release the Garden lock BEFORE renderGarden().
//    Previously renderGarden() ran while v11Busy=true, so the freshly-rendered
//    Focus / Quick Review / Bonus Sun buttons were all left disabled until the
//    user manually pressed the Garden tab and caused another render.
v11OpenGift=function(g,b){
  if(v11Busy)return;
  v11Busy=true;
  if(b)b.classList.add('opening');
  v11Chime();sparkle();
  setTimeout(()=>{
    g.opened=true;
    if(g.animalType&&!state.garden.residents.some(r=>r.type===g.animalType))state.garden.residents.push({type:g.animalType,joinedAt:Date.now()});
    if(g.specialType&&!state.garden.specialItems.some(s=>s.type===g.specialType))state.garden.specialItems.push({type:g.specialType,earnedAt:Date.now()});
    save();
    // Critical order: unlock first, then render/re-wire the Garden routes.
    v11Busy=false;growthRunning=false;
    screen('garden');renderGarden();
    let names=[];
    if(g.animalType)names.push('🐾 '+(V11_ANIMAL_LABEL[g.animalType]||'A new friend')+' joined the garden!');
    if(g.specialType)names.push('✨ A special garden gift appeared too!');
    v11Notice(names.join('<br>'),4300);
    let rs=[...document.querySelectorAll('.v11-resident')];
    rs.forEach(x=>x.classList.add('happy'));
    setTimeout(()=>rs.forEach(x=>x.classList.remove('happy')),2600);
  },650)
};

window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
window.MWG_TEST_HOOKS.openGift=(g,b)=>v11OpenGift(g,b);


// Boot diagnostics are kept in the console only. Non-critical browser/resource
// errors must never cover the game or make a healthy Garden look broken.
window.MWG_TEST_HOOKS={challengeData:v11ChallengeData,defaultGarden:v11DefaultGarden,awardQuickReviewSeed:v125AwardQuickReviewSeed,gardenSnapshot:v125GardenSnapshot,focusSelection:()=>selectFocusIds(),harvest:(i)=>v11Harvest(i),finishEncore:()=>v125FinishEncore(),routeState:()=>{let d=ensureDaily(),c=v11ChallengeData();return{phase:d.phase,ended:d.ended,focusIds:[...(d.focusIds||[])],reviewIds:[...(d.reviewIds||[])],bonusReady:!!selectBonusWord()&&!d.bonusSunDone,challenge:c}}};


// ================= v0.12.8 Bonus Sun recovery + per-word reset =================
// Bonus Sun is a route belonging to the CURRENT practice run. Older builds only stored
// a boolean, so a stale `bonusSunDone=true` could permanently disable the route after a
// new run. Tie completion to runId and derive readiness from actual Focus/Review completion.
const v128FreshDailyBase=freshDaily;
freshDaily=function(){
  let d=v128FreshDailyBase();
  d.bonusSunRunId=null;
  return d;
};

function v128RequiredPracticeComplete(d){
  d=d||ensureDaily();
  if(d.phase==='done')return true;
  let fTotal=(d.focusIds||[]).length;
  let fDone=(d.focusCompleted||[]).length;
  let rTotal=(d.reviewIds||[]).length;
  let rDone=(d.reviewCompleted||[]).length;
  // A rewarded Quick Review is definitive proof that the required route finished.
  if(d.runId&&d.reviewRewardedRunId===d.runId)return true;
  return !!(fTotal&&fDone>=fTotal&&rTotal&&(rDone>=rTotal||Number(d.reviewIndex||0)>=rTotal));
}
function v128RepairBonusState(d){
  d=d||ensureDaily();
  if(!Object.prototype.hasOwnProperty.call(d,'bonusSunRunId')){
    // v0.12.7 and earlier could leave a stale true flag behind. Re-open Bonus Sun once
    // on migration rather than trapping the learner behind an invisible old flag.
    d.bonusSunRunId=null;
    if(d.bonusSunDone){d.bonusSunDone=false;d.bonusDone=false}
  }
  if(d.bonusSunRunId&&d.runId&&d.bonusSunRunId!==d.runId){
    d.bonusSunRunId=null;d.bonusSunDone=false;d.bonusDone=false;
  }
  if(d.bonusSunRunId&&d.bonusSunRunId===d.runId){d.bonusSunDone=true;d.bonusDone=true}
  if(!d.ended&&d.phase==='review'&&v128RequiredPracticeComplete(d))d.phase='done';
  return d;
}
const v128EnsureDailyBase=ensureDaily;
ensureDaily=function(){let d=v128EnsureDailyBase();return v128RepairBonusState(d)};

// Record which practice run actually earned the sunshine.
const v128RunBonusSunBase=runBonusSun;
runBonusSun=function(after){
  let run=ensureDaily().runId;
  return v128RunBonusSunBase(()=>{
    let d=ensureDaily();d.bonusSunRunId=run||d.runId;d.bonusSunDone=true;d.bonusDone=true;save();
    if(after)after();
  });
};

function v128OpenMyWords(){
  screen('parent');
  let tab=document.querySelector('.parent-tab[data-parent="myWords"]');
  if(tab){
    document.querySelectorAll('.parent-tab').forEach(x=>x.classList.toggle('active',x===tab));
    document.querySelectorAll('.parent-pane').forEach(p=>p.classList.toggle('active',p.id==='myWords'));
  }
  renderParent();
  setTimeout(()=>{let el=document.getElementById('myWord');if(el)el.focus()},50);
}

// Make the Bonus Sun menu deterministic and self-explanatory after every Garden render.
function v128ApplyBonusRoute(){
  let d=ensureDaily(),bb=document.getElementById('v11Bonus');if(!bb)return;
  let small=bb.querySelector('small'),word=selectBonusWord(),required=v128RequiredPracticeComplete(d);
  bb.classList.remove('current');
  if(d.bonusSunDone&&d.bonusSunRunId===d.runId){
    bb.disabled=true;bb.classList.add('done');bb.onclick=null;if(small)small.textContent='Sunshine done';return;
  }
  bb.classList.remove('done');
  if(d.ended||growthRunning||v11Busy){bb.disabled=true;bb.onclick=null;return}
  if(!required){bb.disabled=true;bb.onclick=null;if(small)small.textContent='After Quick Review';return}
  // Required practice is complete. Never leave the tile as a dead button.
  bb.disabled=false;bb.classList.add('current');
  if(word){bb.onclick=startBonus;if(small)small.textContent='My Words · sunshine'}
  else{bb.onclick=v128OpenMyWords;if(small)small.textContent='Add a My Word first'}
}

const v128StartBonusBase=startBonus;
startBonus=function(){
  let d=ensureDaily();
  if(d.ended){screen('garden');renderGarden();v11Notice('Today is finished. Choose “Do a little more” for another round.',2800);return}
  if(!v128RequiredPracticeComplete(d)){screen('garden');renderGarden();v11Notice('☀️ Bonus Sun opens after today’s Quick Review.',2800);return}
  if(d.bonusSunDone&&d.bonusSunRunId===d.runId){screen('garden');renderGarden();v11Notice('☀️ Bonus Sun is already complete for this round.',2400);return}
  if(!selectBonusWord()){v128OpenMyWords();return}
  return v128StartBonusBase();
};

// Re-apply after the older render wrappers have done their work. This intentionally wins
// over any stale disabled state created by a previous Garden render/animation.
const v128RenderGardenBase=renderGarden;
renderGarden=function(){
  let out=v128RenderGardenBase();
  try{v128ApplyBonusRoute()}catch(e){console.error('v0.12.8 Bonus Sun route recovery',e)}
  return out;
};

// ---------- Parent > Word Library: reset learning for one word ----------
function v128ResetWordLearning(wid){
  let w=wordById(wid);if(!w)return;
  if(!confirm(`Reset all learning progress for “${w.word}”?\n\nThe word, meaning, Miori's spelling, My Words / weekly memberships, and Garden will stay.`))return;
  let garden=v125GardenSnapshot();
  state.stats[wid]={life:emptyLife(),weekly:{}};
  // Recreate empty week records only where the word belongs; all prior counts/errors are gone.
  (state.weeks||[]).forEach(wk=>{if((wk.wordIds||[]).includes(wid))weeklyStat(wid,wk.id)});
  // If this word is in today's active route, refresh today's route so a completed copy of
  // the same word cannot survive the reset and immediately mark it learned again.
  let d=state.daily,routeRefreshed=false;
  if(d&&([...(d.focusIds||[]),...(d.reviewIds||[]),d.bonusWordId].filter(Boolean).includes(wid))){
    state.daily=null;routeRefreshed=true;
  }
  v125RestoreGarden(garden);v12ClearPlayRuntime();save();renderParent();renderGarden();
  setTimeout(()=>v11Notice(`↺ Learning progress for <strong>${esc(w.word)}</strong> was reset.${routeRefreshed?' Today’s route was refreshed too.':''}`,3600),40);
}

const v128ActionButtonsBase=actionButtons;
actionButtons=function(wid,context){
  let wrap=v128ActionButtonsBase(wid,context);
  if(context==='library'){
    let reset=document.createElement('button');reset.className='mini-action reset-learning';reset.textContent='Reset learning';
    reset.title='Reset practice counts, mistakes, and weekly learning progress for this word';
    reset.onclick=()=>v128ResetWordLearning(wid);
    // Reset is safer than Delete, so show it before destructive Delete.
    let del=wrap.querySelector('.remove');if(del)wrap.insertBefore(reset,del);else wrap.appendChild(reset);
  }
  return wrap;
};

// Force the Library to rebuild so the new button is visible immediately after upgrade.
try{renderLibrary()}catch(e){}

window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
window.MWG_TEST_HOOKS.bonusEligible=()=>{let d=ensureDaily();return {required:v128RequiredPracticeComplete(d),word:selectBonusWord(),done:!!d.bonusSunDone,runId:d.runId,bonusRunId:d.bonusSunRunId,phase:d.phase}};
window.MWG_TEST_HOOKS.resetWordLearning=(wid)=>{
  let w=wordById(wid);if(!w)return false;
  let garden=v125GardenSnapshot();state.stats[wid]={life:emptyLife(),weekly:{}};(state.weeks||[]).forEach(wk=>{if((wk.wordIds||[]).includes(wid))weeklyStat(wid,wk.id)});state.daily=null;v125RestoreGarden(garden);v12ClearPlayRuntime();save();renderParent();renderGarden();return true;
};

window.MWG_DIAGNOSTICS={version:'0.12.9',errors:window.__MWG_BOOT_ERRORS||[]};
state.version=12;
try{v11NormalizeGarden();v12RepairDailyShape();save();renderGarden();}catch(e){console.error('Garden boot recovery',e);window.MWG_DIAGNOSTICS.gardenBoot=String(e&&e.message||e);try{state.garden=v11DefaultGarden();save();renderGarden();}catch(e2){console.error('Garden fallback failed',e2)}}
try{renderParent();}catch(e){console.error('Parent boot recovery',e);window.MWG_DIAGNOSTICS.parentBoot=String(e&&e.message||e)}
try{let p=document.getElementById('parent');if(p&&!document.getElementById('mwgRuntimeBuild')){let d=document.createElement('div');d.id='mwgRuntimeBuild';d.className='tiny';d.style.cssText='text-align:right;opacity:.5;margin:4px 4px 12px';d.textContent='Build v0.12.9';p.appendChild(d)}}catch(e){}
window.MWG_READY=true;

// ================= v0.12.9 Weekly Challenge present recovery =================
// A Weekly Challenge clear must always have a visible, claimable Garden reward until it is opened.
// Older builds marked rewards as "granted" at challenge completion, before the present was actually opened.
// If that present was lost during a render/version transition, the week could become permanently reward-less.
// v0.12.9 separates "granted" from "delivered/opened" and can safely recover a missing present once.
function v129FindGiftById(gid){
  return gid ? (state.garden.gifts||[]).find(g=>g.id===gid) || null : null;
}
function v129UnopenedWeekGift(wk){
  let own=v129FindGiftById(wk&&wk.rewardGiftId);
  if(own&&!own.opened)return own;
  return null;
}
function v129LegacyAnimalLikelyDelivered(){
  let granted=(state.weeks||[]).filter(w=>w&&w.animalRewardGranted).length;
  let delivered=Math.max(0,(state.garden.residents||[]).length-1); // initial bunny is not a Weekly reward
  return delivered>=granted;
}
function v129LegacyPerfectLikelyDelivered(){
  let granted=(state.weeks||[]).filter(w=>w&&w.perfectRewardGranted).length;
  let delivered=(state.garden.specialItems||[]).length;
  return delivered>=granted;
}
function v129NextAnimal(){
  let owned=(state.garden.residents||[]).map(r=>r.type);
  return V11_ANIMALS.find((a,i)=>i>0&&!owned.includes(a)) || V11_ANIMALS[Math.max(1,(state.garden.residents||[]).length)%V11_ANIMALS.length] || 'cat';
}
function v129NextSpecial(){
  let owned=(state.garden.specialItems||[]).map(s=>s.type);
  return V11_SPECIALS.find(s=>!owned.includes(s)) || V11_SPECIALS[(state.garden.specialItems||[]).length%V11_SPECIALS.length] || 'bench';
}
function v129EnsureChallengePresent(wk,perfect){
  if(!wk)return null;
  let existing=v129UnopenedWeekGift(wk);
  if(existing)return existing;

  // If a v0.12.9+ reward was already opened, replaying the same week must not farm another animal.
  if(wk.rewardGiftOpened===true){
    // A newly-earned Perfect bonus is still allowed once if it was not previously delivered.
    if(perfect&&!wk.perfectRewardDeliveredV129){
      let specialType=v129NextSpecial();
      let g={id:id(),animalType:null,specialType,opened:false,earnedAt:Date.now()};
      state.garden.gifts.push(g);wk.rewardGiftId=g.id;wk.rewardSpecialType=specialType;wk.perfectRewardGranted=true;wk.perfectRewardDeliveredV129=false;
      return g;
    }
    return null;
  }

  let animalType=null,specialType=null;

  // Fresh week: earn the normal animal reward.
  if(!wk.animalRewardGranted){
    animalType=v129NextAnimal();
    wk.animalRewardGranted=true;wk.rewardGranted=true;wk.rewardAnimalType=animalType;
  }else if(wk.rewardAnimalDeliveredV129!==true && !v129LegacyAnimalLikelyDelivered() && !wk.rewardRecoveryV129){
    // Legacy recovery: reward was flagged as granted, but Garden evidence says one granted animal never arrived.
    animalType=wk.rewardAnimalType&&V11_ANIMALS.includes(wk.rewardAnimalType)?wk.rewardAnimalType:v129NextAnimal();
    wk.rewardAnimalType=animalType;wk.rewardRecoveryV129=true;
  }

  if(perfect){
    if(!wk.perfectRewardGranted){
      specialType=v129NextSpecial();
      wk.perfectRewardGranted=true;wk.rewardSpecialType=specialType;
    }else if(wk.perfectRewardDeliveredV129!==true && !v129LegacyPerfectLikelyDelivered() && !wk.perfectRecoveryV129){
      specialType=wk.rewardSpecialType&&V11_SPECIALS.includes(wk.rewardSpecialType)?wk.rewardSpecialType:v129NextSpecial();
      wk.rewardSpecialType=specialType;wk.perfectRecoveryV129=true;
    }
  }

  if(!animalType&&!specialType)return null;
  let g={id:id(),animalType,specialType,opened:false,earnedAt:Date.now()};
  state.garden.gifts.push(g);wk.rewardGiftId=g.id;wk.rewardGiftOpened=false;
  return g;
}

// Replace challenge result with an idempotent "challenge -> present -> open" transaction.
showChallengeResult=function(){
  let wk=currentWeek(),perfect=testWrongWords.size===0,firstTry=test.length-testWrongWords.size;
  wk.challengeAttempts=(wk.challengeAttempts||0)+1;
  wk.bestFirstTry=Math.max(wk.bestFirstTry||0,firstTry);
  wk.challengePassed=true;

  v11NormalizeGarden();
  let gift=v129EnsureChallengePresent(wk,perfect);
  save();

  screen('play');
  document.getElementById('counter').textContent='Weekly Challenge complete';
  document.getElementById('mode').textContent=wk.title;
  document.getElementById('title').textContent=perfect?'Perfect Week! ✨':'Weekly Challenge cleared! 🐾';
  document.getElementById('hint').textContent=gift
    ? (perfect?'A present is waiting in the garden. Open it to meet your reward!':'A present is waiting in the garden. Open it to meet your new animal friend!')
    : 'You already received this week’s reward. You can still replay the challenge for practice.';
  document.getElementById('area').innerHTML='<div class="summary"><div class="score">'+firstTry+'/'+test.length+'</div><div>first-try correct</div><div class="challenge-prize" style="justify-content:center;margin-top:12px"><span class="prize-chip">🐾 Clear → Animal friend</span>'+(perfect?'<span class="prize-chip">✨ Perfect → Special item</span>':'')+'</div></div>';
  document.getElementById('feedback').textContent='';
  let c=document.getElementById('continue');
  c.disabled=false;c.style.display='';c.textContent=gift?'See my present':'Back to Garden';
  continueAction=()=>{
    save();
    screen('garden');
    renderGarden();
    let waiting=v129UnopenedWeekGift(wk)||v11CurrentGift();
    if(waiting){
      // Explicitly render again after navigation. This also recovers from an older screen() wrapper
      // that happened to repaint before the newly-created gift reached saved state.
      renderGarden();
      setTimeout(()=>v11Notice('🎁 Your present is here! Tap the box to open it.',0),40);
    }
  };
};

// Mark the week reward as DELIVERED only when the box is actually opened.
v11OpenGift=function(g,b){
  if(v11Busy||!g)return;
  v11Busy=true;
  if(b)b.classList.add('opening');
  v11Chime();sparkle();
  setTimeout(()=>{
    g.opened=true;
    if(g.animalType&&!state.garden.residents.some(r=>r.type===g.animalType))state.garden.residents.push({type:g.animalType,joinedAt:Date.now()});
    if(g.specialType&&!state.garden.specialItems.some(s=>s.type===g.specialType))state.garden.specialItems.push({type:g.specialType,earnedAt:Date.now()});
    let wk=(state.weeks||[]).find(w=>w&&w.rewardGiftId===g.id);
    if(wk){
      wk.rewardGiftOpened=true;
      if(g.animalType)wk.rewardAnimalDeliveredV129=true;
      if(g.specialType)wk.perfectRewardDeliveredV129=true;
    }
    save();
    v11Busy=false;growthRunning=false;
    screen('garden');renderGarden();
    let names=[];
    if(g.animalType)names.push('🐾 '+(V11_ANIMAL_LABEL[g.animalType]||'A new friend')+' joined the garden!');
    if(g.specialType)names.push('✨ A special garden gift appeared too!');
    v11Notice(names.join('<br>'),4300);
    let rs=[...document.querySelectorAll('.v11-resident')];
    rs.forEach(x=>x.classList.add('happy'));
    setTimeout(()=>rs.forEach(x=>x.classList.remove('happy')),2600);
  },650);
};

// If a present exists in saved state, every Garden render must show it. This is a final safety net.
const v129RenderGardenBase=renderGarden;
renderGarden=function(){
  let out=v129RenderGardenBase();
  try{
    let stage=document.getElementById('world'),gift=v11CurrentGift();
    if(stage&&gift&&!document.getElementById('v11Gift'))v11RenderGift(stage);
  }catch(e){console.error('v0.12.9 present render recovery',e)}
  return out;
};

try{let el=document.getElementById('mwgRuntimeBuild');if(el)el.textContent='Build v0.12.9';}catch(e){}
window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
window.MWG_TEST_HOOKS.ensureChallengePresent=(wk,perfect)=>v129EnsureChallengePresent(wk,perfect);
window.MWG_TEST_HOOKS.currentGift=()=>v11CurrentGift();

// ================= v0.13.0 Weekly Challenge reward loop + keyboard navigation =================
// Design contract:
// - EVERY completed Weekly Challenge attempt creates one present box.
// - Clear and Perfect use the SAME mystery reward pool (Animal Friend OR Special Item).
// - Perfect changes only the celebration, never the prize value.
// - Replaying a cleared week therefore remains meaningful and never reuses an already-opened box.

if(!V11_ANIMALS.includes('dog'))V11_ANIMALS.push('dog');
V11_ANIMAL_LABEL.dog='Puppy';
['birdcage','mailbox'].forEach(x=>{if(!V11_SPECIALS.includes(x))V11_SPECIALS.push(x)});

const V130_REWARD_ANIMALS=['dog','cat','bird','squirrel','duck','hedgehog'];
const V130_SPECIAL_LABEL={treehouse:'Tree House',bench:'Bench',birdcage:'Bird Cage',mailbox:'Mailbox',lantern:'Garden Lantern',flowerArch:'Flower Arch'};
const V130_SPECIAL_POS=[[62,34],[71,41],[31,43],[65,72],[26,63],[53,37],[74,75],[40,73],[57,69]];
function v130Pick(list){return list[Math.floor(Math.random()*list.length)]}
function v130MysteryReward(){
  v11NormalizeGarden();
  let ownedAnimals=new Set((state.garden.residents||[]).map(r=>r.type));
  let availableAnimals=V130_REWARD_ANIMALS.filter(a=>!ownedAnimals.has(a));
  let ownedSpecials=new Set((state.garden.specialItems||[]).map(s=>s.type));
  let unseenSpecials=V11_SPECIALS.filter(s=>!ownedSpecials.has(s));
  // Keep the category genuinely random while both categories have something useful.
  // Animal duplicates are avoided; garden items can repeat only after the unique set is complete.
  let wantAnimal=Math.random()<.5;
  if(wantAnimal&&availableAnimals.length)return {animalType:v130Pick(availableAnimals),specialType:null};
  if(!wantAnimal&&unseenSpecials.length)return {animalType:null,specialType:v130Pick(unseenSpecials)};
  if(availableAnimals.length)return {animalType:v130Pick(availableAnimals),specialType:null};
  let repeatable=V11_SPECIALS.filter(s=>s!=='treehouse');
  return {animalType:null,specialType:v130Pick(unseenSpecials.length?unseenSpecials:(repeatable.length?repeatable:V11_SPECIALS))};
}
function v130CreateChallengePresent(wk,perfect){
  let reward=v130MysteryReward();
  let g={id:id(),animalType:reward.animalType||null,specialType:reward.specialType||null,opened:false,earnedAt:Date.now()};
  state.garden.gifts=state.garden.gifts||[];
  state.garden.gifts.push(g);
  wk.challengeRewardCount=(wk.challengeRewardCount||0)+1;
  wk.lastChallengeGiftId=g.id;
  wk.lastChallengePerfect=!!perfect;
  return g;
}
function v130ChallengeConfetti(perfect){
  let colors=perfect?['#ffd35c','#ff91b4','#fff3a6','#e2b84f','#f8c5df']:['#83d8c2','#69bde8','#b6e5cf','#9fc8f0','#d7f3e8'];
  let n=perfect?84:34;
  for(let i=0;i<n;i++){
    let x=document.createElement('i');x.className='mwg-challenge-fetti';x.style.left=(Math.random()*100)+'vw';x.style.background=colors[i%colors.length];x.style.setProperty('--drift',(Math.random()*220-110)+'px');x.style.setProperty('--spin',(Math.random()*1000-500)+'deg');x.style.setProperty('--dur',(perfect?2.6+Math.random()*2.3:2.0+Math.random()*1.8)+'s');x.style.animationDelay=(Math.random()*.45)+'s';document.body.appendChild(x);setTimeout(()=>x.remove(),5400);
  }
  if(perfect){finishFanfare();sparkle();setTimeout(sparkle,280)}else{ding();setTimeout(sparkle,100)}
}
function v130ShowChallengeBadge(perfect){
  let area=document.getElementById('area');if(!area)return;
  let badge=document.createElement('div');badge.className='challenge-result-badge '+(perfect?'perfect':'clear');
  badge.innerHTML=perfect?'<strong>PERFECT! ✨</strong><span>Every word was right on the first try!</span>':'<strong>Challenge Clear! 🌿</strong><span>You finished every word — great work!</span>';
  area.prepend(badge);v130ChallengeConfetti(perfect);
}

// Replace the one-reward-per-week transaction from v0.12.9.
showChallengeResult=function(){
  let wk=currentWeek(),perfect=testWrongWords.size===0,firstTry=test.length-testWrongWords.size;
  wk.challengeAttempts=(wk.challengeAttempts||0)+1;
  wk.bestFirstTry=Math.max(wk.bestFirstTry||0,firstTry);
  wk.challengePassed=true;
  v11NormalizeGarden();
  let gift=v130CreateChallengePresent(wk,perfect);
  save();

  screen('play');
  document.getElementById('counter').textContent='Weekly Challenge complete';
  document.getElementById('mode').textContent=wk.title;
  document.getElementById('title').textContent=perfect?'Perfect!':'Weekly Challenge Clear!';
  document.getElementById('hint').textContent='One mystery present is waiting in the garden. It can be an Animal Friend or a Special Garden Item.';
  document.getElementById('area').innerHTML='<div class="summary"><div class="score">'+firstTry+'/'+test.length+'</div><div>first-try correct</div><div class="challenge-prize" style="justify-content:center;margin-top:12px"><span class="prize-chip">🎁 Mystery prize · Animal Friend OR Special Item</span></div></div>';
  v130ShowChallengeBadge(perfect);
  document.getElementById('feedback').textContent='';
  let c=document.getElementById('continue');c.disabled=false;c.style.display='';c.textContent='See my present';
  continueAction=()=>{
    save();screen('garden');renderGarden();
    setTimeout(()=>v11Notice('🎁 A new present is waiting! Tap the box to open it.',0),40);
  };
};

// Open every box as a separate reward. Special items may repeat after the unique catalog
// is complete, so a replay can never silently collapse into an old Tree House animation.
v11OpenGift=function(g,b){
  if(v11Busy||!g)return;
  v11Busy=true;if(b)b.classList.add('opening');v11Chime();sparkle();
  setTimeout(()=>{
    g.opened=true;
    let message='';
    if(g.animalType){
      if(!state.garden.residents.some(r=>r.type===g.animalType))state.garden.residents.push({type:g.animalType,joinedAt:Date.now()});
      message='🐾 '+(V11_ANIMAL_LABEL[g.animalType]||'A new friend')+' joined the garden!';
    }
    if(g.specialType){
      state.garden.specialItems.push({type:g.specialType,earnedAt:Date.now()});
      message='✨ '+(V130_SPECIAL_LABEL[g.specialType]||'A special garden item')+' appeared!';
    }
    save();v11Busy=false;growthRunning=false;screen('garden');renderGarden();
    v11Notice(message,4200);
    document.querySelectorAll('.v11-resident').forEach(x=>x.classList.add('happy'));
    setTimeout(()=>document.querySelectorAll('.v11-resident').forEach(x=>x.classList.remove('happy')),2400);
  },650);
};

// Render the expanded item catalog. The Tree House stays a structural object; smaller
// rewards use separate positions so Bench / Bird Cage / Mailbox can all remain visible.
v11RenderSpecials=function(stage){
  let seenTree=false;
  (state.garden.specialItems||[]).forEach((s,i)=>{
    if(s.type==='treehouse'&&!seenTree){
      seenTree=true;let el=document.createElement('div');el.className='v11-treehouse';el.title='Tree House';el.innerHTML='<div class="hut"></div><div class="roof"></div><div class="deck"></div>';stage.appendChild(el);return;
    }
    let el=document.createElement('div'),pos=V130_SPECIAL_POS[i%V130_SPECIAL_POS.length];
    el.className='v11-special-item';el.style.left=pos[0]+'%';el.style.top=pos[1]+'%';el.title=V130_SPECIAL_LABEL[s.type]||'Garden gift';
    if(s.type==='bench'){el.classList.add('mwg-bench');el.textContent='🪑'}
    else if(s.type==='birdcage'){el.classList.add('mwg-birdcage');el.textContent='🐦'}
    else if(s.type==='mailbox'){el.classList.add('mwg-mailbox');el.textContent='📮'}
    else if(s.type==='lantern'){el.classList.add('mwg-lantern');el.textContent='🏮'}
    else if(s.type==='flowerArch'){el.classList.add('mwg-flowerarch');el.textContent='🌸'}
    else{el.textContent='🎀'}
    stage.appendChild(el);
  });
};

// Patch Garden copy so replaying a cleared challenge clearly promises another reward.
const v130RenderGardenBase=renderGarden;
renderGarden=function(){
  let out=v130RenderGardenBase();
  try{
    let cd=v11ChallengeData(),sign=document.getElementById('v11ChallengeSign'),btn=document.getElementById('challengeBtn');
    if(cd.ready&&sign){let small=document.getElementById('v11ChallengeSmall');if(small)small.textContent=cd.wk&&cd.wk.challengePassed?'Replay · another mystery present':'Prize: mystery present'}
    if(btn){let small=btn.querySelector('small');if(small)small.textContent=cd.ready?'Animal or garden gift':'Unlock a mystery gift'}
  }catch(e){console.error('v0.13 Garden challenge copy',e)}
  return out;
};

// Chromebook keyboard: Step 1 / Step 2 choice questions can be navigated with ↑ / ↓.
// Enter selects the highlighted choice; after a correct answer the existing Enter handler
// continues to the next step.
function v130ChoiceButtons(){
  let play=document.getElementById('play');if(!play||!play.classList.contains('active'))return[];
  if(answered||!(step===0||step===1))return[];
  return [...play.querySelectorAll('#area .choice-grid .choice:not(:disabled)')];
}
document.addEventListener('keydown',function(e){
  if(e.repeat)return;
  let choices=v130ChoiceButtons();if(!choices.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();e.stopPropagation();
    let idx=choices.indexOf(document.activeElement);
    if(idx<0)idx=e.key==='ArrowDown'?0:choices.length-1;
    else idx=(idx+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;
    choices.forEach(x=>x.classList.remove('mwg-key-choice'));
    choices[idx].classList.add('mwg-key-choice');choices[idx].focus({preventScroll:true});
    return;
  }
  if(e.key==='Enter'&&choices.includes(document.activeElement)){
    e.preventDefault();e.stopPropagation();document.activeElement.click();
  }
},true);

// Remove stale keyboard highlighting whenever a new normal step is drawn.
const v130ShowStepBase=showStep;
showStep=function(){let out=v130ShowStepBase();document.querySelectorAll('.choice.mwg-key-choice').forEach(x=>x.classList.remove('mwg-key-choice'));return out};

try{let el=document.getElementById('mwgRuntimeBuild');if(el)el.textContent='Build v0.13.1';}catch(e){}
window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
window.MWG_TEST_HOOKS.rewardCatalog=()=>({animals:[...V130_REWARD_ANIMALS],specials:[...V11_SPECIALS]});
window.MWG_TEST_HOOKS.createChallengePresent=(perfect=false)=>v130CreateChallengePresent(currentWeek(),perfect);

// ================= v0.13.1 movable rewards + richer achievement scenes =================
// Product rule: flowers and vegetables stay rooted. The starting bunny, Weekly animal
// friends, and Special Gift furniture can be repositioned by dragging them in the Garden.
// Achievement scenes are deliberately more celebratory, while preserving the underlying
// practice/reward state machine.

const V131_TREEHOUSE_POS=[82,27];
let v131PendingSeedCelebration=null;
let v131Drag=null;

function v131ResidentDefault(i){return V11_RESIDENT_POS[i%V11_RESIDENT_POS.length]||[50,62]}
function v131SpecialDefault(item,i){if(item&&item.type==='treehouse')return V131_TREEHOUSE_POS;return V130_SPECIAL_POS[i%V130_SPECIAL_POS.length]||[58,64]}
function v131EnsureMovablePositions(){
  v11NormalizeGarden();
  (state.garden.residents||[]).forEach((a,i)=>{let p=v131ResidentDefault(i);if(!Number.isFinite(Number(a.x)))a.x=p[0];if(!Number.isFinite(Number(a.y)))a.y=p[1];a.x=v12Clamp(Number(a.x),5,95);a.y=v12Clamp(Number(a.y),14,92)});
  (state.garden.specialItems||[]).forEach((it,i)=>{let p=v131SpecialDefault(it,i);if(!it.id)it.id='sp_'+id();if(!Number.isFinite(Number(it.x)))it.x=p[0];if(!Number.isFinite(Number(it.y)))it.y=p[1];it.x=v12Clamp(Number(it.x),5,95);it.y=v12Clamp(Number(it.y),14,92)});
}

v11RenderResidents=function(stage){
  v131EnsureMovablePositions();
  state.garden.residents.forEach((a,i)=>{
    if(i===0&&a.type==='rabbit'&&v12Art().backgroundHasRabbit)return;
    let el=document.createElement('div');el.className='v11-resident mwg-draggable-garden';
    el.dataset.gardenKind='resident';el.dataset.gardenIndex=i;el.dataset.type=a.type;
    el.style.left=a.x+'%';el.style.top=a.y+'%';el.style.animationDelay=(-i*.45)+'s';
    el.title='Drag to move '+(V11_ANIMAL_LABEL[a.type]||'friend');
    el.setAttribute('aria-label',(V11_ANIMAL_LABEL[a.type]||'Animal friend')+'. Drag to move.');
    el.innerHTML=`<img draggable="false" alt="${V11_ANIMAL_LABEL[a.type]||'friend'}" src="${v11AssetAnimal(a.type,'idle')}">`;
    stage.appendChild(el);
  });
};

v11RenderSpecials=function(stage){
  v131EnsureMovablePositions();
  (state.garden.specialItems||[]).forEach((s,i)=>{
    let el=document.createElement('div');el.dataset.gardenKind='special';el.dataset.gardenIndex=i;
    el.style.left=s.x+'%';el.style.top=s.y+'%';el.title=(V130_SPECIAL_LABEL[s.type]||'Garden gift')+' · drag to move';
    el.setAttribute('aria-label',(V130_SPECIAL_LABEL[s.type]||'Garden gift')+'. Drag to move.');
    if(s.type==='treehouse'){
      el.className='v11-treehouse mwg-draggable-garden';el.innerHTML='<div class="hut"></div><div class="roof"></div><div class="deck"></div>';
    }else{
      el.className='v11-special-item mwg-draggable-garden';
      if(s.type==='bench'){el.classList.add('mwg-bench');el.textContent='🪑'}
      else if(s.type==='birdcage'){el.classList.add('mwg-birdcage');el.textContent='🐦'}
      else if(s.type==='mailbox'){el.classList.add('mwg-mailbox');el.textContent='📮'}
      else if(s.type==='lantern'){el.classList.add('mwg-lantern');el.textContent='🏮'}
      else if(s.type==='flowerArch'){el.classList.add('mwg-flowerarch');el.textContent='🌸'}
      else{el.textContent='🎀'}
    }
    stage.appendChild(el);
  });
};

function v131GardenPointer(e){
  let el=e.target.closest&&e.target.closest('.mwg-draggable-garden');
  if(!el||v11Busy||growthRunning||v11PlantMode)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  let world=el.closest('#world');if(!world)return;
  e.preventDefault();e.stopPropagation();
  let r=world.getBoundingClientRect();
  v131Drag={el,world,rect:r,pointerId:e.pointerId,kind:el.dataset.gardenKind,index:Number(el.dataset.gardenIndex),moved:false,startX:e.clientX,startY:e.clientY};
  el.classList.add('mwg-dragging');
  try{el.setPointerCapture(e.pointerId)}catch(_e){}
}
function v131GardenMove(e){
  if(!v131Drag||e.pointerId!==v131Drag.pointerId)return;
  e.preventDefault();
  let d=v131Drag,r=d.world.getBoundingClientRect();d.rect=r;
  let x=v12Clamp((e.clientX-r.left)/r.width*100,5,95),y=v12Clamp((e.clientY-r.top)/r.height*100,14,92);
  if(Math.abs(e.clientX-d.startX)+Math.abs(e.clientY-d.startY)>4)d.moved=true;
  d.el.style.left=x+'%';d.el.style.top=y+'%';d.x=x;d.y=y;
}
function v131GardenUp(e){
  if(!v131Drag||e.pointerId!==v131Drag.pointerId)return;
  let d=v131Drag;d.el.classList.remove('mwg-dragging');
  if(d.moved&&Number.isFinite(d.x)&&Number.isFinite(d.y)){
    if(d.kind==='resident'&&state.garden.residents[d.index]){state.garden.residents[d.index].x=d.x;state.garden.residents[d.index].y=d.y}
    if(d.kind==='special'&&state.garden.specialItems[d.index]){state.garden.specialItems[d.index].x=d.x;state.garden.specialItems[d.index].y=d.y}
    save();
    v11Notice('✨ Nice spot! You can drag friends and gifts whenever you like.',1800);
  }
  v131Drag=null;
}
document.addEventListener('pointerdown',v131GardenPointer,true);
document.addEventListener('pointermove',v131GardenMove,true);
document.addEventListener('pointerup',v131GardenUp,true);
document.addEventListener('pointercancel',v131GardenUp,true);

function v131Osc(c,f,t,d,g=.06,type='sine'){
  let o=c.createOscillator(),a=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(g,t+.018);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(c.destination);o.start(t);o.stop(t+d+.03)
}
function v131Noise(c,t,d=.35,gain=.035,frequency=1300){
  let len=Math.max(1,Math.floor(c.sampleRate*d)),buf=c.createBuffer(1,len,c.sampleRate),arr=buf.getChannelData(0);for(let i=0;i<len;i++)arr[i]=(Math.random()*2-1)*(1-i/len);
  let src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=frequency;f.Q.value=.7;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);src.connect(f);f.connect(g);g.connect(c.destination);src.start(t);src.stop(t+d+.02)
}
function v131WaterRewardSound(){let c=audioCtx();if(!c)return;let n=c.currentTime;[[523,0,.14],[659,.11,.16],[784,.23,.18],[1046,.39,.28]].forEach(x=>v131Osc(c,x[0],n+x[1],x[2],.055,'sine'));v131Noise(c,n+.08,.55,.025,1600)}
function v131SeedRewardSound(){let c=audioCtx();if(!c)return;let n=c.currentTime;[[392,0,.11],[523,.11,.14],[659,.24,.17],[784,.40,.30]].forEach(x=>v131Osc(c,x[0],n+x[1],x[2],.06,x[0]<500?'triangle':'sine'));v131Noise(c,n+.32,.28,.018,2100)}
function v131SunRewardSound(){let c=audioCtx();if(!c)return;let n=c.currentTime;[[523,0,.32],[659,.03,.34],[784,.06,.38],[1046,.44,.30],[1318,.62,.42]].forEach(x=>v131Osc(c,x[0],n+x[1],x[2],.052,'sine'));v131Noise(c,n+.03,.7,.018,2800)}
function v131ChallengeSound(perfect){let c=audioCtx();if(!c)return;let n=c.currentTime,seq=perfect?[[523,0],[659,.09],[784,.18],[1046,.30],[1318,.46],[1568,.65]]:[[392,0],[523,.12],[659,.25],[784,.40],[1046,.60]];seq.forEach(([f,t],i)=>v131Osc(c,f,n+t,i===seq.length-1?.48:.18,perfect?.065:.055,i%2?'triangle':'sine'));v131Noise(c,n+.06,perfect?1.0:.65,perfect?.028:.02,2400)}
function v131GiftSound(){let c=audioCtx();if(!c)return;let n=c.currentTime;v131Noise(c,n,.42,.03,900);[[330,.02],[440,.16],[659,.34],[880,.50],[1175,.70]].forEach(([f,t],i)=>v131Osc(c,f,n+t,i===4?.46:.16,.06,i<2?'triangle':'sine'))}

function v131BurstParticles(host,icons,count=24,kind=''){
  if(!host)return;for(let i=0;i<count;i++){let p=document.createElement('i');p.className='mwg-achieve-particle '+kind;p.textContent=icons[i%icons.length];p.style.setProperty('--dx',(Math.random()*430-215)+'px');p.style.setProperty('--dy',(-70-Math.random()*250)+'px');p.style.setProperty('--rot',(Math.random()*800-400)+'deg');p.style.setProperty('--delay',(Math.random()*.16)+'s');p.style.left=(45+Math.random()*10)+'%';p.style.top=(50+Math.random()*12)+'%';host.appendChild(p);setTimeout(()=>p.remove(),2100)}
}
function v131StageCelebration({kind='water',emoji='✨',title='',subtitle='',duration=1600,count=22,icons=['✨','⭐']}){
  let stage=document.getElementById('world');if(!stage)return null;
  stage.querySelectorAll('.mwg-achievement-overlay[data-kind="'+kind+'"]').forEach(x=>x.remove());
  let o=document.createElement('div');o.className='mwg-achievement-overlay '+kind;o.dataset.kind=kind;o.innerHTML=`<div class="mwg-achievement-glow"></div><div class="mwg-achievement-card"><b>${emoji}</b><strong>${title}</strong>${subtitle?`<span>${subtitle}</span>`:''}</div>`;stage.appendChild(o);v131BurstParticles(stage,icons,count,kind);setTimeout(()=>o.classList.add('show'),20);setTimeout(()=>{o.classList.remove('show');setTimeout(()=>o.remove(),320)},duration);return o
}
function v131RewardFly(emoji,toX=21,toY=39){let stage=document.getElementById('world');if(!stage)return;let f=document.createElement('div');f.className='mwg-reward-fly';f.textContent=emoji;f.style.setProperty('--tx',(toX-50)+'vw');f.style.setProperty('--ty',(toY-52)+'vh');stage.appendChild(f);setTimeout(()=>f.remove(),1700)}
function v131BodyFlash(perfect){let f=document.createElement('div');f.className='mwg-result-flash '+(perfect?'perfect':'clear');document.body.appendChild(f);setTimeout(()=>f.classList.add('show'),10);setTimeout(()=>f.remove(),1450)}

// Focus/Encore water: keep the proven growth transaction, enrich the scene around it.
const v131WaterBase=runGardenWatering;
runGardenWatering=function(after){
  setTimeout(()=>{v131StageCelebration({kind:'water',emoji:'💧',title:'Word complete!',subtitle:'Let’s help the garden grow.',duration:1450,count:24,icons:['💧','✨','🌱']});v131WaterRewardSound()},70);
  return v131WaterBase(()=>{setTimeout(()=>v131StageCelebration({kind:'grow',emoji:'🌱',title:'It grew!',subtitle:'Your practice changed the garden.',duration:1250,count:18,icons:['✨','🌿','⭐']}),20);if(after)after()});
};

// Mark a Quick Review seed so the Garden can celebrate it immediately after routing back.
const v131AwardSeedBase=v125AwardQuickReviewSeed;
v125AwardQuickReviewSeed=function(d){let got=v131AwardSeedBase(d);if(got){let sh=state.garden.seedHouse,idx=Math.max(0,sh.earnedIndex-1),veg=V11_VEGS[idx%V11_VEGS.length];v131PendingSeedCelebration={emoji:veg.emoji,name:veg.name}}return got};
function v131CelebrateSeed(data){if(!data)return;v131SeedRewardSound();v131StageCelebration({kind:'seed',emoji:'🌰',title:'Seed earned!',subtitle:data.name+' is safe in the Seed House.',duration:2100,count:34,icons:['🌰','✨','🌱','⭐']});v131RewardFly(data.emoji||'🌰',22,39);let sh=document.getElementById('v11SeedHouse');if(sh){sh.classList.remove('mwg-seed-house-celebrate');void sh.offsetWidth;sh.classList.add('mwg-seed-house-celebrate');setTimeout(()=>sh.classList.remove('mwg-seed-house-celebrate'),1900)}}

// Bonus Sun: stronger light, richer sound, still NO normal growth progression.
const v131BonusBase=runBonusSun;
runBonusSun=function(after){
  setTimeout(()=>{v131SunRewardSound();v131StageCelebration({kind:'sun',emoji:'☀️',title:'Bonus Sun!',subtitle:'The whole garden is celebrating.',duration:2450,count:42,icons:['☀️','✨','🌼','💛']})},70);
  return v131BonusBase(()=>{setTimeout(()=>v131StageCelebration({kind:'sun-end',emoji:'✨',title:'Sunny garden!',subtitle:'Sometimes sunshine makes a flower extra special.',duration:1300,count:18,icons:['✨','🌸','⭐']}),30);if(after)after()});
};

// Challenge celebrations are distinct in intensity, but reward value stays identical.
v130ChallengeConfetti=function(perfect){
  let colors=perfect?['#ffd35c','#ff91b4','#fff3a6','#e2b84f','#f8c5df','#ffffff']:['#83d8c2','#69bde8','#b6e5cf','#9fc8f0','#d7f3e8','#ffffff'];
  let n=perfect?116:62;for(let i=0;i<n;i++){let x=document.createElement('i');x.className='mwg-challenge-fetti';x.style.left=(Math.random()*100)+'vw';x.style.background=colors[i%colors.length];x.style.setProperty('--drift',(Math.random()*270-135)+'px');x.style.setProperty('--spin',(Math.random()*1200-600)+'deg');x.style.setProperty('--dur',(perfect?2.9+Math.random()*2.5:2.2+Math.random()*2.0)+'s');x.style.animationDelay=(Math.random()*.5)+'s';document.body.appendChild(x);setTimeout(()=>x.remove(),6100)}
  v131BodyFlash(perfect);v131ChallengeSound(perfect);sparkle();setTimeout(sparkle,perfect?230:380);if(perfect)setTimeout(sparkle,520);
};

// Gift opening: a real reveal moment, then restore all Garden routes immediately.
v11OpenGift=function(g,b){
  if(v11Busy||!g)return;v11Busy=true;if(b)b.classList.add('opening','mwg-gift-super');v131GiftSound();v131StageCelebration({kind:'gift-open',emoji:'🎁',title:'Open the present!',subtitle:'Who—or what—is inside?',duration:1100,count:34,icons:['🎁','✨','⭐','💫']});
  setTimeout(()=>{
    g.opened=true;let message='',revealEmoji='✨',revealTitle='New Garden Gift!';
    if(g.animalType){
      if(!state.garden.residents.some(r=>r.type===g.animalType)){let p=v131ResidentDefault(state.garden.residents.length);state.garden.residents.push({type:g.animalType,joinedAt:Date.now(),x:p[0],y:p[1]})}
      revealEmoji='🐾';revealTitle=(V11_ANIMAL_LABEL[g.animalType]||'New friend')+' joined!';message='🐾 '+(V11_ANIMAL_LABEL[g.animalType]||'A new friend')+' joined the garden!';
    }
    if(g.specialType){
      let p=v131SpecialDefault({type:g.specialType},state.garden.specialItems.length);state.garden.specialItems.push({id:'sp_'+id(),type:g.specialType,earnedAt:Date.now(),x:p[0],y:p[1]});
      revealEmoji=g.specialType==='bench'?'🪑':g.specialType==='birdcage'?'🐦':g.specialType==='mailbox'?'📮':g.specialType==='lantern'?'🏮':g.specialType==='flowerArch'?'🌸':'🏡';
      revealTitle=(V130_SPECIAL_LABEL[g.specialType]||'Special item')+' unlocked!';message='✨ '+(V130_SPECIAL_LABEL[g.specialType]||'A special garden item')+' appeared!';
    }
    save();v11Busy=false;growthRunning=false;screen('garden');renderGarden();
    setTimeout(()=>{v131StageCelebration({kind:'gift-reveal',emoji:revealEmoji,title:revealTitle,subtitle:'Drag it anywhere you like in the garden.',duration:2450,count:54,icons:['✨','⭐','💫','🎀']});finishFanfare();document.querySelectorAll('.v11-resident').forEach(x=>x.classList.add('happy'));setTimeout(()=>document.querySelectorAll('.v11-resident').forEach(x=>x.classList.remove('happy')),2400);v11Notice(message,4200)},70);
  },1050);
};

// Run post-route visual celebrations only after the Garden has been rebuilt and unlocked.
const v131RenderGardenBase=renderGarden;
renderGarden=function(){let out=v131RenderGardenBase();try{v131EnsureMovablePositions();if(v131PendingSeedCelebration){let data=v131PendingSeedCelebration;v131PendingSeedCelebration=null;setTimeout(()=>v131CelebrateSeed(data),90)}}catch(e){console.error('v0.13.1 Garden celebration recovery',e)}return out};

try{let el=document.getElementById('mwgRuntimeBuild');if(el)el.textContent='Build v0.13.1';}catch(e){}
window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
window.MWG_TEST_HOOKS.movableSnapshot=()=>({residents:(state.garden.residents||[]).map(x=>({type:x.type,x:x.x,y:x.y})),specials:(state.garden.specialItems||[]).map(x=>({type:x.type,x:x.x,y:x.y}))});
window.MWG_TEST_HOOKS.awardQuickReviewSeedV131=()=>{let got=v125AwardQuickReviewSeed(ensureDaily());renderGarden();return got};
window.MWG_TEST_HOOKS.runWaterV131=()=>runGardenWatering(()=>{});
window.MWG_TEST_HOOKS.runBonusSunV131=()=>runBonusSun(()=>{});



// ================= v0.14.1 English meanings + bulk import + Garden fixes =================
(function(){
  state.settings=state.settings||{};
  if(!['word','meaningEn'].includes(state.settings.promptMode))state.settings.promptMode='word';
  (state.words||[]).forEach(w=>{if(typeof w.meaningEn!=='string')w.meaningEn=''});
  // Opened gifts are history, not visible inventory. Clean them once on upgrade.
  if(state.garden&&Array.isArray(state.garden.gifts))state.garden.gifts=state.garden.gifts.filter(g=>g&&!g.opened);
  save();

  function v141EnglishMeaning(w){return String((w&&w.meaningEn)||'').trim()}
  function v141JapaneseMeaning(w){return String((w&&w.meaning)||'').trim()}
  function v141PromptText(w){if(state.settings.promptMode==='meaningEn'){let m=v141EnglishMeaning(w);if(m)return m}return w&&w.word||''}
  function v141UpdateListenLabels(){let m=state.settings.promptMode==='meaningEn',a=document.getElementById('listen'),b=document.getElementById('listenSlow');if(a)a.textContent=m?'🔊 Hear meaning':'🔊 Listen';if(b)b.textContent=m?'🐢 Meaning slower':'🐢 Listen slower'}

  // Parent prompt mode setting.
  let promptSel=document.getElementById('promptModeSelect');
  if(promptSel){promptSel.value=state.settings.promptMode;promptSel.onchange=()=>{state.settings.promptMode=promptSel.value;save();v141UpdateListenLabels()}}

  // In English Meaning mode, any normal attempt to speak the current answer word is
  // redirected to the English definition, including retries after a wrong answer.
  const v141SpeakBase=speak;
  speak=function(t,slow=false){try{if(current&&norm(t)===norm(current.word)&&state.settings.promptMode==='meaningEn'){let m=v141EnglishMeaning(current);if(m)return v141SpeakBase(m,slow)}}catch(e){}return v141SpeakBase(t,slow)};
  let listen=document.getElementById('listen'),listenSlow=document.getElementById('listenSlow');
  if(listen)listen.onclick=()=>current&&speak(current.word,false);if(listenSlow)listenSlow.onclick=()=>current&&speak(current.word,true);v141UpdateListenLabels();
  const v141ShowStepBase=showStep;showStep=function(){let r=v141ShowStepBase();v141UpdateListenLabels();return r};
  const v141ShowQuickBase=showQuickWord;showQuickWord=function(title,hint,onFinish){let r=v141ShowQuickBase(title,hint,onFinish);v141UpdateListenLabels();return r};
  const v141ShowChallengeBase=showChallengeWord;showChallengeWord=function(){let r=v141ShowChallengeBase();v141UpdateListenLabels();return r};

  showMeaningAid=async function(){if(!current)return;let aid=document.getElementById('learningAid');aid.classList.add('show');let en=v141EnglishMeaning(current),ja=v141JapaneseMeaning(current);if(!en){await ensureAutoInfo(current);en=v141EnglishMeaning(current)||String(current.autoMeaning||'').trim()}aid.innerHTML='<div class="mwg-meaning-lines"><div><b>English</b> '+esc(en||'Not added yet')+'</div><div><b>日本語</b> '+esc(ja||'未登録')+'</div></div>';if(en)speakAny(en)};
  let mb=document.getElementById('meaningBtn');if(mb)mb.onclick=showMeaningAid;

  // Weekly rows: Word / English meaning / Japanese meaning / Miori spelling / phonics.
  renderEntryRows=function(){let box=document.getElementById('weeklyEntryRows');if(!box)return;let keep=[...box.querySelectorAll('.weekly-entry')].map(r=>({word:r.querySelector('.entry-word')?.value||'',en:r.querySelector('.entry-meaning-en')?.value||'',ja:r.querySelector('.entry-meaning-ja,.entry-meaning')?.value||'',mistake:r.querySelector('.entry-mistake')?.value||'',focus:r.querySelector('.entry-focus')?.value||''}));if(box.querySelectorAll('.entry-meaning-en').length===15)return;box.innerHTML='';for(let i=0;i<15;i++){let v=keep[i]||{},r=document.createElement('div');r.className='weekly-entry';r.innerHTML=`<div class="num">${i+1}</div><input class="entry-word" placeholder="word" value="${esc(v.word||'')}"><input class="entry-meaning-en" placeholder="meaning (English)" value="${esc(v.en||'')}"><input class="entry-meaning-ja" placeholder="meaning (日本語)" value="${esc(v.ja||'')}"><input class="entry-mistake" placeholder="Miori's spelling" value="${esc(v.mistake||'')}"><input class="entry-focus" placeholder="phonics" value="${esc(v.focus||'')}">`;box.appendChild(r)}};
  renderEntryRows();

  function v141UpsertWord(word,meaningJa='',meaningEn='',mistake='',focus='',example='',picture=''){
    let n=norm(word),existing=state.words.find(w=>norm(w.word)===n);if(existing){if(meaningJa)existing.meaning=meaningJa;if(meaningEn)existing.meaningEn=meaningEn;if(mistake)existing.mistake=mistake;if(focus)existing.focus=focus;if(example)existing.example=example;if(picture)existing.picture=picture;return existing}
    let w={id:id(),word:n,meaning:meaningJa,meaningEn,mistake,focus,example,picture,autoMeaning:'',autoExample:'',createdAt:Date.now()};state.words.push(w);state.stats[w.id]={life:emptyLife(),weekly:{}};return w
  }

  let addWeekly=document.getElementById('addWeeklyBtn');if(addWeekly)addWeekly.onclick=()=>{let wk=currentWeek(),rows=[...document.querySelectorAll('.weekly-entry')],added=0,fb=document.getElementById('weeklyFeedback');for(let r of rows){if(wk.wordIds.length>=15)break;let word=r.querySelector('.entry-word').value.trim();if(!word)continue;let en=r.querySelector('.entry-meaning-en').value.trim(),ja=r.querySelector('.entry-meaning-ja').value.trim(),mistake=r.querySelector('.entry-mistake').value.trim(),focus=r.querySelector('.entry-focus').value.trim(),w=v141UpsertWord(word,ja,en,mistake,focus);if(addToCurrentWeek(w))added++;r.querySelectorAll('input').forEach(x=>x.value='')}state.daily=freshDaily();save();fb.innerHTML=added?'<span class="ok">Added '+added+' word'+(added===1?'':'s')+' to This Week. 🌱</span>':'<span class="no">No new words were added. This Week may already contain them or be full.</span>';renderParent();renderGarden()};

  // My Words explicit English + Japanese meanings.
  let addMy=document.getElementById('addMyWordBtn');if(addMy)addMy.onclick=()=>{let word=document.getElementById('myWord').value.trim(),fb=document.getElementById('myFeedback');if(!word){fb.innerHTML='<span class="no">Please enter a word.</span>';return}let w=v141UpsertWord(word,document.getElementById('myMeaning').value.trim(),document.getElementById('myMeaningEn')?.value.trim()||'',document.getElementById('myMistake').value.trim(),document.getElementById('myFocus').value.trim(),document.getElementById('myExample').value.trim());if(!state.myWordIds.includes(w.id))state.myWordIds.push(w.id);['myWord','myMeaning','myMeaningEn','myMistake','myFocus','myExample'].forEach(q=>{let el=document.getElementById(q);if(el)el.value=''});save();fb.innerHTML='<span class="ok">Added to My Words. ✨</span>';renderParent()};

  // Editor explicit English + Japanese meanings.
  openWordEditor=function(wid){let w=wordById(wid);if(!w)return;document.getElementById('editWordId').value=wid;document.getElementById('editWord').value=w.word;document.getElementById('editMeaning').value=w.meaning||'';document.getElementById('editMeaningEn').value=w.meaningEn||'';document.getElementById('editExample').value=w.example||'';document.getElementById('editMistake').value=w.mistake||'';document.getElementById('editFocus').value=w.focus||'';document.getElementById('editPicture').value=w.picture||'';document.getElementById('editFeedback').textContent='';let auto=[];if(w.autoMeaning)auto.push('Auto English meaning: '+w.autoMeaning);if(w.autoExample)auto.push('Auto sentence: '+w.autoExample);document.getElementById('editAutoNote').textContent=auto.join(' · ')||'English Meaning is used by meaning-led spelling mode. Automatic dictionary text is only a fallback for the Meaning help button.';let m=document.getElementById('editModal');m.classList.add('show');m.setAttribute('aria-hidden','false')};
  let saveEdit=document.getElementById('editSave');if(saveEdit)saveEdit.onclick=()=>{let wid=document.getElementById('editWordId').value,w=wordById(wid);if(!w)return;let newWord=norm(document.getElementById('editWord').value),fb=document.getElementById('editFeedback');if(!newWord){fb.innerHTML='<span class="no">Word cannot be blank.</span>';return}let dupe=state.words.find(x=>x.id!==wid&&norm(x.word)===newWord);if(dupe){fb.innerHTML='<span class="no">That word already exists. Keep one Library entry and link it to groups instead.</span>';return}if(newWord!==norm(w.word)){w.word=newWord;w.autoMeaning='';w.autoExample=''}w.meaning=document.getElementById('editMeaning').value.trim();w.meaningEn=document.getElementById('editMeaningEn').value.trim();w.example=document.getElementById('editExample').value.trim();w.mistake=document.getElementById('editMistake').value.trim();w.focus=document.getElementById('editFocus').value.trim();w.picture=document.getElementById('editPicture').value.trim();save();closeWordEditor();renderParent();renderGarden()};
  detailsFor=function(w){let en=v141EnglishMeaning(w),ja=v141JapaneseMeaning(w),e=w.example||w.autoExample||'';return `<div class="tiny">${en?'<div><strong>EN:</strong> '+esc(en)+'</div>':''}${ja?'<div><strong>日本語:</strong> '+esc(ja)+'</div>':''}${!en&&!ja?'<div>No meaning yet</div>':''}</div>${w.mistake?'<div class="detail-line">Miori: <strong>'+esc(w.mistake)+'</strong></div>':''}${w.focus?'<div class="detail-line">Phonics: '+esc(w.focus)+'</div>':''}${e?'<div class="detail-line">Example: '+esc(e)+'</div>':''}`};

  // ----- Bulk import: paste `word | English meaning` -----
  let importRows=[];
  function v141ParseImport(text){let rows=[],seen=new Set();String(text||'').split(/\r?\n/).forEach((raw,lineNo)=>{let line=raw.trim();if(!line)return;line=line.replace(/^\s*\d+[.)]\s*/, '');let parts;if(line.includes('|'))parts=line.split('|');else if(line.includes('\t'))parts=line.split('\t');else{let m=line.match(/^([^:]{1,60})\s*:\s*(.+)$/);if(!m)m=line.match(/^([A-Za-z][A-Za-z'’\- ]{0,50})-\s+(.+)$/);parts=m?[m[1],m[2]]:[line,'']}let word=String(parts.shift()||'').trim(),meaning=parts.join('|').trim();word=word.replace(/^[-•]\s*/,'').trim();let key=norm(word);if(!key)return;if(seen.has(key)){rows.push({word:key,meaning,lineNo:lineNo+1,duplicate:true});return}seen.add(key);rows.push({word:key,meaning,lineNo:lineNo+1,duplicate:false})});return rows}
  function v141PreviewImport(){let txt=document.getElementById('bulkImportText'),area=document.getElementById('bulkImportPreviewArea'),fb=document.getElementById('bulkImportFeedback'),btn=document.getElementById('bulkImportAdd');if(!txt||!area||!btn)return;let parsed=v141ParseImport(txt.value),wk=currentWeek(),slots=Math.max(0,15-(wk?.wordIds?.length||0)),usable=0;importRows=parsed.map(r=>{let existing=state.words.find(w=>norm(w.word)===r.word),inWeek=existing&&wk.wordIds.includes(existing.id),status='new';if(r.duplicate)status='duplicate';else if(inWeek)status='inWeek';else if(usable>=slots)status='full';else{status=existing?'existing':'new';usable++}return {...r,existingId:existing?.id||null,status}});area.innerHTML='<div class="mwg-import-preview">'+importRows.map(r=>{let label=r.status==='new'?'New':r.status==='existing'?'Library → add':r.status==='inWeek'?'Already This Week':r.status==='duplicate'?'Duplicate line':'Week full';let cls=(r.status==='new'?'':r.status==='existing'?' update':' skip');return `<div class="mwg-import-row"><strong>${esc(r.word)}</strong><span>${esc(r.meaning||'No English meaning supplied')}</span><span class="mwg-import-status${cls}">${label}</span></div>`}).join('')+'</div>'+(parsed.length?`<div class="mwg-import-summary">${usable} word${usable===1?'':'s'} ready to add · ${slots} slot${slots===1?'':'s'} available before import</div>`:'');fb.innerHTML=parsed.length?'':'<span class="no">Paste at least one line. Recommended format: word | English meaning</span>';btn.disabled=!usable}
  function v141CommitImport(){let wk=currentWeek(),added=0,updated=0;for(let r of importRows){if(!['new','existing'].includes(r.status)||wk.wordIds.length>=15)continue;let before=state.words.find(w=>norm(w.word)===r.word),old=before?.meaningEn||'',w=v141UpsertWord(r.word,'',r.meaning);if(before&&r.meaning&&r.meaning!==old)updated++;if(addToCurrentWeek(w))added++}state.daily=freshDaily();save();let fb=document.getElementById('bulkImportFeedback');if(fb)fb.innerHTML='<span class="ok">Added '+added+' word'+(added===1?'':'s')+' to This Week'+(updated?' · updated '+updated+' English meaning'+(updated===1?'':'s'):'')+'. 🌱</span>';let txt=document.getElementById('bulkImportText');if(txt)txt.value='';let area=document.getElementById('bulkImportPreviewArea');if(area)area.innerHTML='';let btn=document.getElementById('bulkImportAdd');if(btn)btn.disabled=true;importRows=[];renderParent();renderGarden()}
  let preview=document.getElementById('bulkImportPreview'),commit=document.getElementById('bulkImportAdd');if(preview)preview.onclick=v141PreviewImport;if(commit)commit.onclick=v141CommitImport;

  // ----- Seed House close behavior -----
  v11RenderSeedDrawer=function(stage){if(!v11SeedDrawerOpen)return;let d=document.createElement('div');d.className='v11-seed-drawer';let sh=state.garden.seedHouse;d.innerHTML='<button class="v11-seed-drawer-close" type="button" aria-label="Close Seed House">×</button><h4>🌰 Seed House</h4><div class="v11-seed-grid">'+(sh.seeds.length?sh.seeds.map((k,i)=>`<button class="v11-seed-packet" data-seed="${i}" title="Plant ${v11Veg(k).name}">${v11Veg(k).emoji}</button>`).join(''):'<span class="tiny">No seeds yet. Finish Quick Review to earn one.</span>')+'</div><div class="v11-seed-note">Seeds: '+sh.seeds.length+'/5'+(sh.pending?` · ${sh.pending} waiting safely`:'')+'<br>Tap a seed, then tap an empty veggie plot.</div>';d.onclick=e=>e.stopPropagation();stage.appendChild(d);let close=d.querySelector('.v11-seed-drawer-close');if(close)close.onclick=e=>{e.stopPropagation();v11SeedDrawerOpen=false;renderGarden()};d.querySelectorAll('[data-seed]').forEach(b=>b.onclick=()=>v11SelectSeed(Number(b.dataset.seed)))};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&v11SeedDrawerOpen){v11SeedDrawerOpen=false;renderGarden()}},true);
  document.addEventListener('click',e=>{if(!v11SeedDrawerOpen)return;if(e.target.closest('.v11-seed-drawer')||e.target.closest('#v11SeedHouse'))return;v11SeedDrawerOpen=false;renderGarden()},false);

  // ----- Gift cleanup -----
  const v141GiftBase=v11OpenGift;
  v11OpenGift=function(g,b){if(b)b.style.pointerEvents='none';let r=v141GiftBase(g,b);setTimeout(()=>{if(g&&g.opened&&state.garden&&Array.isArray(state.garden.gifts)){state.garden.gifts=state.garden.gifts.filter(x=>x&&x.id!==g.id&&!x.opened);save();renderGarden()}},1500);return r};

  try{let build=document.getElementById('mwgRuntimeBuild');if(build)build.textContent='Build v0.14.1'}catch(e){}
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.version='0.14.1';
  window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
  window.MWG_TEST_HOOKS.promptText=wid=>{let w=wordById(wid);return w?v141PromptText(w):null};
  window.MWG_TEST_HOOKS.parseImport=v141ParseImport;
  window.MWG_TEST_HOOKS.cleanupOpenedGifts=()=>{state.garden.gifts=(state.garden.gifts||[]).filter(g=>g&&!g.opened);save();renderGarden();return state.garden.gifts.length};
  save();renderParent();renderGarden();v141UpdateListenLabels();
})();

})();

// ================= v0.14.2 Adaptive Spelling Practice =================
// Functional baseline stays v0.14.1. This update learns difficult letter positions
// separately for each word from Focus/Bonus Step 3 + Step 4 attempts.
(function(){
  const V142_MAX_SCORE=12;
  const V142_WRONG_GAIN=2;
  const V142_FIRST_TRY_DECAY=1;
  function v142Num(n,f=0){n=Number(n);return Number.isFinite(n)?n:f}
  function v142Clamp(n,min,max){return Math.max(min,Math.min(max,n))}
  function v142SyncActionButton(){
    let c=document.getElementById('continue');if(!c)return;
    c.classList.remove('v12-check','v12-next','v12-reward');
    let s=(c.textContent||'').trim().toLowerCase();
    if(s==='check')c.classList.add('v12-check');
    else if(/water the garden|bonus sun|present|result|garden/.test(s))c.classList.add('v12-reward');
    else c.classList.add('v12-next');
  }

  function v142Letters(s){return norm(s).replace(/[^a-z]/g,'')}
  function v142Profile(w){
    if(!w)return null;
    if(!state.stats[w.id])state.stats[w.id]={life:emptyLife(),weekly:{}};
    let holder=state.stats[w.id],word=v142Letters(w.word);
    let p=holder.adaptive;
    if(!p||p.word!==word||!Array.isArray(p.positions)){
      p={word,positions:[...word].map(()=>({score:0,wrong:0,firstTry:0,lastWrong:'',lastAt:0})),events:0,lastUpdated:0};
      holder.adaptive=p;
    }
    while(p.positions.length<word.length)p.positions.push({score:0,wrong:0,firstTry:0,lastWrong:'',lastAt:0});
    if(p.positions.length>word.length)p.positions=p.positions.slice(0,word.length);
    p.positions=p.positions.map(x=>({
      score:v142Clamp(v142Num(x&&x.score,0),0,V142_MAX_SCORE),
      wrong:Math.max(0,Math.floor(v142Num(x&&x.wrong,0))),
      firstTry:Math.max(0,Math.floor(v142Num(x&&x.firstTry,0))),
      lastWrong:typeof (x&&x.lastWrong)==='string'?x.lastWrong.slice(0,1):'',
      lastAt:v142Num(x&&x.lastAt,0)
    }));
    return p;
  }

  // Levenshtein backtrace. Returns mistakes against positions in the expected string.
  // Insertions are attached to the nearest expected position so they can influence the
  // next gap without leaking into other words.
  function v142Diff(expected,attempt){
    let a=v142Letters(expected),b=v142Letters(attempt),m=a.length,n=b.length;
    if(!m)return[];
    let dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
    for(let i=0;i<=m;i++)dp[i][0]=i;
    for(let j=0;j<=n;j++)dp[0][j]=j;
    for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
      let cost=a[i-1]===b[j-1]?0:1;
      dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost);
    }
    let i=m,j=n,out=[];
    while(i>0||j>0){
      if(i>0&&j>0&&a[i-1]===b[j-1]&&dp[i][j]===dp[i-1][j-1]){i--;j--;continue}
      if(i>0&&j>0&&dp[i][j]===dp[i-1][j-1]+1){out.push({index:i-1,wrong:b[j-1]||'',kind:'sub'});i--;j--;continue}
      if(i>0&&dp[i][j]===dp[i-1][j]+1){out.push({index:i-1,wrong:'',kind:'del'});i--;continue}
      if(j>0){let k=Math.max(0,Math.min(m-1,i<m?i:m-1));out.push({index:k,wrong:b[j-1]||'',kind:'ins'});j--;continue}
      break;
    }
    // Merge duplicate expected positions, preferring a concrete wrong character.
    let by=new Map();
    out.reverse().forEach(e=>{let old=by.get(e.index);if(!old||(e.wrong&&!old.wrong))by.set(e.index,e)});
    return [...by.values()].sort((x,y)=>x.index-y.index);
  }

  function v142RecordWrong(w,expected,attempt,offset=0){
    let p=v142Profile(w);if(!p)return[];
    let errors=v142Diff(expected,attempt),now=Date.now();
    errors.forEach(e=>{
      let idx=offset+e.index;if(idx<0||idx>=p.positions.length)return;
      let x=p.positions[idx];x.score=Math.min(V142_MAX_SCORE,x.score+V142_WRONG_GAIN);x.wrong++;x.lastAt=now;
      if(e.wrong&&/^[a-z]$/.test(e.wrong))x.lastWrong=e.wrong;
    });
    if(errors.length){p.events++;p.lastUpdated=now;save()}
    return errors;
  }

  function v142RecordFirstTry(w,offset,length,fullWord=false){
    let p=v142Profile(w);if(!p)return;
    let start=fullWord?0:Math.max(0,offset),end=fullWord?p.positions.length:Math.min(p.positions.length,start+length),changed=false,now=Date.now();
    for(let i=start;i<end;i++){
      let x=p.positions[i];x.firstTry++;
      if(x.score>0){x.score=Math.max(0,x.score-V142_FIRST_TRY_DECAY);changed=true}
      x.lastAt=now;
    }
    if(end>start){p.events++;p.lastUpdated=now;if(changed||fullWord)save()}
  }

  function v142ParentGap(w){
    if(!w||!w.mistake)return null;
    try{return spellingDiff(w.word,w.mistake)}catch(e){return null}
  }

  function v142AdaptiveGap(w){
    let p=v142Profile(w),word=v142Letters(w&&w.word);if(!p||!word)return null;
    let ranked=p.positions.map((x,i)=>({i,...x})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.wrong-a.wrong||a.lastAt-b.lastAt||a.i-b.i);
    if(!ranked.length)return null;
    let target=ranked[0].i;
    let near=ranked.filter(x=>Math.abs(x.i-target)<=2&&x.score>0).map(x=>x.i);
    let lo=Math.min(target,...near),hi=Math.max(target,...near);
    // Keep the exercise child-sized: 2–4 letters when possible, centered on the hard spot.
    let desired=word.length<=3?Math.min(2,word.length):3;
    if(hi-lo+1<desired){
      let need=desired-(hi-lo+1),left=Math.min(lo,Math.ceil(need/2));lo-=left;need-=left;hi=Math.min(word.length-1,hi+need);
      if(hi-lo+1<desired)lo=Math.max(0,hi-desired+1);
    }
    if(hi-lo+1>4){lo=Math.max(0,target-1);hi=Math.min(word.length-1,lo+3);lo=Math.max(0,hi-3)}
    let focus=word.slice(lo,hi+1),wrongChars=[...focus],changed=false;
    for(let i=lo;i<=hi;i++){
      let x=p.positions[i],local=i-lo;
      if(x.score>0&&x.lastWrong&&x.lastWrong!==word[i]){wrongChars[local]=x.lastWrong;changed=true}
    }
    return {focus,wrongPart:changed?wrongChars.join(''):'',idx:lo,prefix:w.word.slice(0,lo),suffix:w.word.slice(hi+1),fromMistake:false,fromAdaptive:true};
  }

  const v142GetGapBase=getGap;
  getGap=function(){
    // Parent-supplied Miori spelling is an explicit signal and always wins when it
    // actually differs from the correct word. Correct/blank parent spelling falls back
    // to the word's own gameplay history.
    let parent=v142ParentGap(current);if(parent)return parent;
    let learned=v142AdaptiveGap(current);if(learned)return learned;
    return v142GetGapBase();
  };

  // Rebuild the typing boxes so we can capture the actual letters entered before the
  // existing wrong/correct handlers run. Quick Review and Weekly Challenge remain
  // unchanged: only the numbered Step 3 / Step 4 loop teaches the adaptive profile.
  makeBoxes=function(a,{expected,prefix='',suffix='',testMode=false,onCorrect=null,onWrong=null}){
    let wrap=document.createElement('div');wrap.className='spell-line';
    if(prefix){let p=document.createElement('span');p.className='fixed-part';p.textContent=prefix;wrap.appendChild(p)}
    let boxes=[];for(let i=0;i<expected.length;i++){let b=document.createElement('span');b.className='letter-box';wrap.appendChild(b);boxes.push(b)}
    if(suffix){let x=document.createElement('span');x.className='fixed-part';x.textContent=suffix;wrap.appendChild(x)}
    let input=document.createElement('input');input.className='capture';input.autocomplete='off';input.autocapitalize='none';input.setAttribute('autocorrect','off');input.spellcheck=false;input.maxLength=expected.length;
    let help=document.createElement('div');help.className='typing-help';help.textContent='Type one letter in each box. Then press Check.';
    let c=document.getElementById('continue');c.style.display='';c.textContent='Check';c.disabled=true;v142SyncActionButton();
    let adaptive=!!(!testMode&&current&&(step===2||step===3)&&(flowMode==='focus'||flowMode==='bonus')),hadWrong=false;
    let offset=step===2?v142Letters(prefix).length:0;
    function render(clear=true){let v=v142Letters(input.value).slice(0,v142Letters(expected).length);input.value=v;boxes.forEach((b,i)=>{b.textContent=v[i]||'';if(clear)b.classList.remove('good','bad');b.classList.toggle('active',i===v.length&&v.length<v142Letters(expected).length)});c.disabled=!v.length;return v}
    function mark(v){let e=v142Letters(expected);boxes.forEach((b,i)=>{b.classList.remove('active','good','bad');b.classList.add(v[i]===e[i]?'good':'bad')})}
    function check(){
      if(answered)return;let v=render(false);if(!v)return;let e=v142Letters(expected);
      if(v===e){
        c.disabled=false;
        if(adaptive&&!hadWrong)v142RecordFirstTry(current,offset,e.length,step===3);
        if(onCorrect)onCorrect();else correct();
      }else{
        mark(v);
        if(adaptive){hadWrong=true;v142RecordWrong(current,e,v,offset)}
        if(onWrong)onWrong();else wrongTyped();
        c.textContent='Check';c.disabled=false;continueAction=check;v142SyncActionButton();
      }
    }
    continueAction=check;
    input.oninput=()=>{render(true);continueAction=check;c.textContent='Check';v142SyncActionButton();if(testMode)document.getElementById('feedback').textContent=''};
    input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();check()}};wrap.onclick=()=>input.focus();a.append(wrap,input,help);render(true);setTimeout(()=>input.focus(),80)
  };

  // Repair/adapt saved stats lazily without touching other words or the Garden.
  (state.words||[]).forEach(w=>v142Profile(w));
  save();

  try{let build=document.getElementById('mwgRuntimeBuild');if(build)build.textContent='Build v0.14.2 · Adaptive Spelling'}catch(e){}
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.version='0.14.2-adaptive-spelling';
  window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
  window.MWG_TEST_HOOKS.adaptiveDiff=v142Diff;
  window.MWG_TEST_HOOKS.adaptiveProfile=wid=>{let w=wordById(wid);return w?JSON.parse(JSON.stringify(v142Profile(w))):null};
  window.MWG_TEST_HOOKS.adaptiveRecordWrong=(wid,expected,attempt,offset=0)=>{let w=wordById(wid);return w?v142RecordWrong(w,expected,attempt,offset):[]};
  window.MWG_TEST_HOOKS.adaptiveFirstTry=(wid,offset=0,length=null,fullWord=false)=>{let w=wordById(wid);if(!w)return null;v142RecordFirstTry(w,offset,length==null?v142Letters(w.word).length:length,fullWord);return JSON.parse(JSON.stringify(v142Profile(w)))};
  window.MWG_TEST_HOOKS.adaptiveTarget=wid=>{let w=wordById(wid);if(!w)return null;let old=current;current=w;let g=getGap();current=old;return g};
  window.MWG_TEST_HOOKS.adaptiveClear=wid=>{if(state.stats[wid])delete state.stats[wid].adaptive;save();return true};
})();


// ================= v0.14.3 Step 3/4 Support Update =================
// Hint and Peek are always available in Focus/Bonus Step 3 + Step 4.
// They never auto-trigger on a timer. Wrong checks stay on the same step.
(function(){
  function v143Letters(s){return norm(s).replace(/[^a-z]/g,'')}
  function v143IsSupported(testMode){return !!(!testMode&&current&&(step===2||step===3)&&(flowMode==='focus'||flowMode==='bonus'))}
  function v143FirstProblem(expected,attempt){
    let e=v143Letters(expected),v=v143Letters(attempt),n=Math.min(e.length,v.length);
    for(let i=0;i<n;i++)if(v[i]!==e[i])return i;
    if(v.length<e.length)return v.length;
    if(v===e)return -1;
    return e.length?Math.max(0,e.length-1):0;
  }
  function v143AdaptiveHolder(w){
    if(!w)return null;
    if(!state.stats[w.id])state.stats[w.id]={life:emptyLife(),weekly:{}};
    let holder=state.stats[w.id],word=v143Letters(w.word),p=holder.adaptive;
    if(!p||p.word!==word||!Array.isArray(p.positions)){
      p={word,positions:[...word].map(()=>({score:0,wrong:0,firstTry:0,lastWrong:'',lastAt:0})),events:0,lastUpdated:0};
      holder.adaptive=p;
    }
    while(p.positions.length<word.length)p.positions.push({score:0,wrong:0,firstTry:0,lastWrong:'',lastAt:0});
    return p;
  }
  function v143RecordAssist(w,absIndex,kind){
    let p=v143AdaptiveHolder(w);if(!p||absIndex<0||absIndex>=p.positions.length)return;
    let x=p.positions[absIndex],now=Date.now();
    x.score=Math.min(12,Math.max(0,Number(x.score)||0)+1);x.lastAt=now;
    p.events=(Number(p.events)||0)+1;p.lastUpdated=now;
    if(kind==='hint')p.hintEvents=(Number(p.hintEvents)||0)+1;
    if(kind==='peek')p.peekEvents=(Number(p.peekEvents)||0)+1;
    save();
  }
  function v143Choices(answer,absIndex){
    answer=String(answer||'').toLowerCase();let out=[answer],p=current&&state.stats[current.id]&&state.stats[current.id].adaptive;
    let last=p&&p.positions&&p.positions[absIndex]&&p.positions[absIndex].lastWrong;
    if(last&&/^[a-z]$/.test(last)&&last!==answer)out.push(last);
    let vowels=['a','e','i','o','u','y'], consonants=['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w'];
    let bank=vowels.includes(answer)?vowels:consonants;
    for(let ch of shuffle(bank.filter(x=>x!==answer&&!out.includes(x)))){if(out.length>=3)break;out.push(ch)}
    for(let ch of 'abcdefghijklmnopqrstuvwxyz'){if(out.length>=3)break;if(ch!==answer&&!out.includes(ch))out.push(ch)}
    return shuffle(out.slice(0,3));
  }
  function v143SyncButton(){
    let c=document.getElementById('continue');if(!c)return;
    c.classList.remove('v12-check','v12-next','v12-reward');
    let s=(c.textContent||'').trim().toLowerCase();
    if(s==='check')c.classList.add('v12-check');
    else if(/water the garden|bonus sun|present|result|garden/.test(s))c.classList.add('v12-reward');
    else c.classList.add('v12-next');
  }

  const v143MakeBoxesBase=makeBoxes;
  makeBoxes=function(a,{expected,prefix='',suffix='',testMode=false,onCorrect=null,onWrong=null}){
    if(!v143IsSupported(testMode))return v143MakeBoxesBase(a,{expected,prefix,suffix,testMode,onCorrect,onWrong});

    let wrap=document.createElement('div');wrap.className='spell-line';
    if(prefix){let p=document.createElement('span');p.className='fixed-part';p.textContent=prefix;wrap.appendChild(p)}
    let boxes=[];for(let i=0;i<expected.length;i++){let b=document.createElement('span');b.className='letter-box';wrap.appendChild(b);boxes.push(b)}
    if(suffix){let x=document.createElement('span');x.className='fixed-part';x.textContent=suffix;wrap.appendChild(x)}

    let input=document.createElement('input');input.className='capture';input.autocomplete='off';input.autocapitalize='none';input.setAttribute('autocorrect','off');input.spellcheck=false;input.maxLength=expected.length;
    let help=document.createElement('div');help.className='typing-help';help.textContent='Type one letter in each box. Press Check when you are ready.';
    let support=document.createElement('div');support.className='v143-support-row';
    let hintBtn=document.createElement('button');hintBtn.type='button';hintBtn.className='v143-support-btn';hintBtn.textContent='Hint';hintBtn.setAttribute('aria-label','Show a one-letter hint');
    let peekBtn=document.createElement('button');peekBtn.type='button';peekBtn.className='v143-support-btn';peekBtn.textContent='Peek';peekBtn.setAttribute('aria-label','Show the whole word briefly');
    support.append(hintBtn,peekBtn);
    let hintPanel=document.createElement('div');hintPanel.className='v143-hint-panel';hintPanel.setAttribute('aria-live','polite');
    let peekCard=document.createElement('div');peekCard.className='v143-peek-card';peekCard.setAttribute('aria-live','polite');
    let supportNote=document.createElement('div');supportNote.className='v143-support-note';

    let c=document.getElementById('continue');c.style.display='';c.textContent='Check';c.disabled=true;v143SyncButton();
    let e=v143Letters(expected),offset=step===2?v143Letters(prefix).length:0,hadWrong=false,hadAssist=false;
    let hintSeen=new Set(),peekSeen=new Set(),peekTimer=null;

    function currentValue(){return v143Letters(input.value).slice(0,e.length)}
    function clearTarget(){boxes.forEach(b=>b.classList.remove('v143-hint-target'))}
    function render(clear=true){
      let v=currentValue();input.value=v;
      boxes.forEach((b,i)=>{b.textContent=v[i]||'';if(clear)b.classList.remove('good','bad');b.classList.toggle('active',i===v.length&&v.length<e.length)});
      c.disabled=!v.length;return v;
    }
    function mark(v){boxes.forEach((b,i)=>{b.classList.remove('active','good','bad');b.classList.add(v[i]===e[i]?'good':'bad')})}
    function target(){let i=v143FirstProblem(e,currentValue());return i<0?-1:Math.max(0,Math.min(e.length-1,i))}
    function record(kind,local){
      let key=local;if(kind==='hint'){if(hintSeen.has(key))return;hintSeen.add(key)}else{if(peekSeen.has(key))return;peekSeen.add(key)}
      hadAssist=true;v143RecordAssist(current,offset+local,kind);
    }
    function fillAt(i,ch){
      let v=currentValue().split('');
      while(v.length<i)v.push('');
      if(i<v.length)v[i]=ch;else v.push(ch);
      input.value=v.join('').slice(0,e.length);hintPanel.innerHTML='';supportNote.textContent='';clearTarget();render(true);input.focus();
    }

    hintBtn.onclick=()=>{
      if(!e.length)return;let i=target();if(i<0){hintPanel.innerHTML='';clearTarget();supportNote.textContent='Looks ready — press Check!';input.focus();return}let ans=e[i];record('hint',i);clearTarget();boxes[i]&&boxes[i].classList.add('v143-hint-target');hintPanel.innerHTML='';
      supportNote.textContent='Choose one letter.';
      v143Choices(ans,offset+i).forEach(ch=>{let b=document.createElement('button');b.type='button';b.className='v143-letter-choice';b.textContent=ch;b.setAttribute('aria-label','Letter '+ch);b.onclick=()=>{if(ch===ans)fillAt(i,ch);else{b.classList.add('v143-choice-wrong');setTimeout(()=>b.classList.remove('v143-choice-wrong'),260)}};hintPanel.appendChild(b)});
    };
    peekBtn.onclick=()=>{
      if(!e.length)return;let i=target();if(i<0){supportNote.textContent='Looks ready — press Check!';input.focus();return}record('peek',i);if(peekTimer)clearTimeout(peekTimer);
      peekCard.textContent=current.word;peekCard.classList.add('show');peekBtn.disabled=true;supportNote.textContent='Look, remember, then keep going.';
      peekTimer=setTimeout(()=>{peekCard.classList.remove('show');peekCard.textContent='';peekBtn.disabled=false;supportNote.textContent='';input.focus()},1800);
    };

    function check(){
      if(answered)return;let v=render(false);if(!v)return;
      if(v===e){
        c.disabled=false;
        if(!hadWrong&&!hadAssist&&window.MWG_TEST_HOOKS&&window.MWG_TEST_HOOKS.adaptiveFirstTry)window.MWG_TEST_HOOKS.adaptiveFirstTry(current.id,offset,e.length,step===3);
        if(onCorrect)onCorrect();else correct();
      }else{
        mark(v);hadWrong=true;
        if(window.MWG_TEST_HOOKS&&window.MWG_TEST_HOOKS.adaptiveRecordWrong)window.MWG_TEST_HOOKS.adaptiveRecordWrong(current.id,e,v,offset);
        recordWrong();oops();
        document.getElementById('feedback').innerHTML='<span class="no">Almost. Fix the red letters and keep going — you can use Hint or Peek.</span>';
        document.getElementById('wrongActions').innerHTML='';
        c.textContent='Check';c.disabled=false;continueAction=check;v143SyncButton();input.focus();
      }
    }
    continueAction=check;
    input.oninput=()=>{render(true);hintPanel.innerHTML='';supportNote.textContent='';clearTarget();continueAction=check;c.textContent='Check';v143SyncButton()};
    input.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();check()}};
    wrap.onclick=()=>input.focus();
    a.append(wrap,input,help,support,hintPanel,peekCard,supportNote);render(true);setTimeout(()=>input.focus(),80);
  };

  try{let build=document.getElementById('mwgRuntimeBuild');if(build)build.textContent='Build v0.14.3 · Step Support'}catch(e){}
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.version='0.14.3-step-support';
  window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
  window.MWG_TEST_HOOKS.supportFirstProblem=v143FirstProblem;
  window.MWG_TEST_HOOKS.supportRecordAssist=(wid,index,kind='hint')=>{let w=wordById(wid);if(!w)return null;v143RecordAssist(w,index,kind);return state.stats[wid].adaptive};
})();

// ================= v0.14.4 Quick Review Support =================
// Reuses the same quiet Hint / Peek UI from v0.14.3, but only for the typed
// Quick Review support steps (Type the Gap + Full Spelling). Choice steps stay clean.
(function(){
  function v144Letters(s){return norm(s).replace(/[^a-z]/g,'')}
  function v144QuickSupported(testMode){return !!(testMode&&current&&flowMode==='review'&&(reviewStep===2||reviewStep===3))}
  function v144FirstProblem(expected,attempt){
    if(window.MWG_TEST_HOOKS&&typeof window.MWG_TEST_HOOKS.supportFirstProblem==='function')return window.MWG_TEST_HOOKS.supportFirstProblem(expected,attempt);
    let e=v144Letters(expected),v=v144Letters(attempt),n=Math.min(e.length,v.length);
    for(let i=0;i<n;i++)if(v[i]!==e[i])return i;
    if(v.length<e.length)return v.length;
    if(v===e)return -1;
    return e.length?Math.max(0,e.length-1):0;
  }
  function v144RecordAssist(localIndex,offset,kind){
    if(!current||localIndex<0)return;
    let hook=window.MWG_TEST_HOOKS&&window.MWG_TEST_HOOKS.supportRecordAssist;
    if(typeof hook==='function')hook(current.id,offset+localIndex,kind);
  }
  function v144Choices(answer,absIndex){
    answer=String(answer||'').toLowerCase();let out=[answer];
    try{
      let hook=window.MWG_TEST_HOOKS&&window.MWG_TEST_HOOKS.adaptiveProfile,p=typeof hook==='function'?hook(current.id):null;
      let last=p&&p.positions&&p.positions[absIndex]&&p.positions[absIndex].lastWrong;
      if(last&&/^[a-z]$/.test(last)&&last!==answer)out.push(last);
    }catch(e){}
    let vowels=['a','e','i','o','u','y'],consonants=['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w'];
    let bank=vowels.includes(answer)?vowels:consonants;
    for(let ch of shuffle(bank.filter(x=>x!==answer&&!out.includes(x)))){if(out.length>=3)break;out.push(ch)}
    for(let ch of 'abcdefghijklmnopqrstuvwxyz'){if(out.length>=3)break;if(ch!==answer&&!out.includes(ch))out.push(ch)}
    return shuffle(out.slice(0,3));
  }
  function v144SyncButton(){
    if(typeof v12SyncActionButton==='function'){v12SyncActionButton();return}
    let c=document.getElementById('continue');if(!c)return;
    c.classList.remove('v12-check','v12-next','v12-reward');
    let s=(c.textContent||'').trim().toLowerCase();if(s==='check')c.classList.add('v12-check');else c.classList.add('v12-next');
  }

  const v144MakeBoxesBase=makeBoxes;
  makeBoxes=function(a,{expected,prefix='',suffix='',testMode=false,onCorrect=null,onWrong=null}){
    if(!v144QuickSupported(testMode))return v144MakeBoxesBase(a,{expected,prefix,suffix,testMode,onCorrect,onWrong});

    let wrap=document.createElement('div');wrap.className='spell-line';
    if(prefix){let p=document.createElement('span');p.className='fixed-part';p.textContent=prefix;wrap.appendChild(p)}
    let boxes=[];for(let i=0;i<expected.length;i++){let b=document.createElement('span');b.className='letter-box';wrap.appendChild(b);boxes.push(b)}
    if(suffix){let x=document.createElement('span');x.className='fixed-part';x.textContent=suffix;wrap.appendChild(x)}

    let input=document.createElement('input');input.className='capture';input.autocomplete='off';input.autocapitalize='none';input.setAttribute('autocorrect','off');input.spellcheck=false;input.maxLength=expected.length;
    let help=document.createElement('div');help.className='typing-help';help.textContent='Type the letters. Use Hint or Peek only if you need a little help.';
    let support=document.createElement('div');support.className='v143-support-row';
    let hintBtn=document.createElement('button');hintBtn.type='button';hintBtn.className='v143-support-btn';hintBtn.textContent='Hint';hintBtn.setAttribute('aria-label','Show a one-letter hint');
    let peekBtn=document.createElement('button');peekBtn.type='button';peekBtn.className='v143-support-btn';peekBtn.textContent='Peek';peekBtn.setAttribute('aria-label','Show the whole word briefly');
    support.append(hintBtn,peekBtn);
    let hintPanel=document.createElement('div');hintPanel.className='v143-hint-panel';hintPanel.setAttribute('aria-live','polite');
    let peekCard=document.createElement('div');peekCard.className='v143-peek-card';peekCard.setAttribute('aria-live','polite');
    let supportNote=document.createElement('div');supportNote.className='v143-support-note';

    let c=document.getElementById('continue');c.style.display='';c.textContent='Check';c.disabled=true;v144SyncButton();
    let e=v144Letters(expected),offset=reviewStep===2?v144Letters(prefix).length:0,hadWrong=false,hadAssist=false;
    let hintSeen=new Set(),peekSeen=new Set(),peekTimer=null;

    function currentValue(){return v144Letters(input.value).slice(0,e.length)}
    function clearTarget(){boxes.forEach(b=>b.classList.remove('v143-hint-target'))}
    function render(clear=true){
      let v=currentValue();input.value=v;
      boxes.forEach((b,i)=>{b.textContent=v[i]||'';if(clear)b.classList.remove('good','bad');b.classList.toggle('active',i===v.length&&v.length<e.length)});
      c.disabled=!v.length;return v;
    }
    function mark(v){boxes.forEach((b,i)=>{b.classList.remove('active','good','bad');b.classList.add(v[i]===e[i]?'good':'bad')})}
    function target(){let i=v144FirstProblem(e,currentValue());return i<0?-1:Math.max(0,Math.min(e.length-1,i))}
    function record(kind,local){
      let seen=kind==='hint'?hintSeen:peekSeen;if(seen.has(local))return;seen.add(local);hadAssist=true;v144RecordAssist(local,offset,kind);
    }
    function fillAt(i,ch){
      let v=currentValue().split('');while(v.length<i)v.push('');if(i<v.length)v[i]=ch;else v.push(ch);
      input.value=v.join('').slice(0,e.length);hintPanel.innerHTML='';supportNote.textContent='';clearTarget();render(true);input.focus();
    }
    function showPeekWord(){
      peekCard.innerHTML='';
      let word=document.createElement('span');word.className='v146-peek-word';word.textContent=current.word;peekCard.appendChild(word);
      ['a','b','c','d'].forEach((k,i)=>{let s=document.createElement('span');s.className='v146-peek-sparkle '+k;s.textContent=i%2?'✧':'✦';peekCard.appendChild(s)});
      peekCard.classList.remove('show');void peekCard.offsetWidth;peekCard.classList.add('show');
    }

    hintBtn.onclick=()=>{
      if(!e.length)return;let i=target();if(i<0){hintPanel.innerHTML='';clearTarget();supportNote.textContent='Looks ready — press Check!';input.focus();return}
      let ans=e[i];record('hint',i);clearTarget();boxes[i]&&boxes[i].classList.add('v143-hint-target');hintPanel.innerHTML='';supportNote.textContent='Choose one letter.';
      v144Choices(ans,offset+i).forEach(ch=>{let b=document.createElement('button');b.type='button';b.className='v143-letter-choice';b.textContent=ch;b.setAttribute('aria-label','Letter '+ch);b.onclick=()=>{if(ch===ans)fillAt(i,ch);else{b.classList.add('v143-choice-wrong');setTimeout(()=>b.classList.remove('v143-choice-wrong'),260)}};hintPanel.appendChild(b)});
    };
    peekBtn.onclick=()=>{
      if(!e.length)return;let i=target();if(i<0){supportNote.textContent='Looks ready — press Check!';input.focus();return}
      record('peek',i);if(peekTimer)clearTimeout(peekTimer);peekCard.textContent=current.word;peekCard.classList.add('show');peekBtn.disabled=true;supportNote.textContent='Look, remember, then keep going.';
      peekTimer=setTimeout(()=>{peekCard.classList.remove('show');peekCard.textContent='';peekBtn.disabled=false;supportNote.textContent='';input.focus()},1800);
    };

    function check(){
      if(answered)return;let v=render(false);if(!v)return;
      if(v===e){
        c.disabled=false;
        if(!hadWrong&&!hadAssist&&window.MWG_TEST_HOOKS&&typeof window.MWG_TEST_HOOKS.adaptiveFirstTry==='function')window.MWG_TEST_HOOKS.adaptiveFirstTry(current.id,offset,e.length,reviewStep===3);
        if(onCorrect)onCorrect();else correct();
      }else{
        mark(v);hadWrong=true;
        if(window.MWG_TEST_HOOKS&&typeof window.MWG_TEST_HOOKS.adaptiveRecordWrong==='function')window.MWG_TEST_HOOKS.adaptiveRecordWrong(current.id,e,v,offset);
        if(onWrong)onWrong();else wrongTyped();
        c.textContent='Check';c.disabled=false;continueAction=check;v144SyncButton();input.focus();
      }
    }
    continueAction=check;
    input.oninput=()=>{render(true);hintPanel.innerHTML='';supportNote.textContent='';clearTarget();continueAction=check;c.textContent='Check';v144SyncButton()};
    input.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();check()}};
    wrap.onclick=()=>input.focus();
    a.append(wrap,input,help,support,hintPanel,peekCard,supportNote);render(true);setTimeout(()=>input.focus(),80);
  };

  const v144RenderReviewBase=renderReviewStep;
  renderReviewStep=function(){
    v144RenderReviewBase();
    if(flowMode==='review'&&(reviewStep===2||reviewStep===3)){
      let h=document.getElementById('hint');if(h){let tag=h.querySelector('.review-support');if(tag)tag.textContent='Hint or Peek are available anytime.';}
    }
  };

  try{let build=document.getElementById('mwgRuntimeBuild');if(build)build.textContent='Build v0.14.4 · Quick Review Support'}catch(e){}
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.version='0.14.4-quick-review-support';
  window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
  window.MWG_TEST_HOOKS.quickReviewSupportEnabled=()=>true;
})();

// ================= v0.14.6 Help Experience Update =================
// Product rule: every Step 3 / Step 4 style typing activity keeps the same simple
// Hint / Peek UI. Hint now pairs slow word audio with phonics-aware letter choices;
// Peek uses a soft shimmering fade so the word is memorable without staying on screen.
(function(){
  function v145Letters(s){return norm(s).replace(/[^a-z]/g,'')}
  function v145CounterText(){let el=document.getElementById('counter');return String(el&&el.textContent||'')}
  function v145Context(testMode,prefix){
    if(!current)return null;
    if(!testMode){
      if((step===2||step===3)&&(flowMode==='focus'||flowMode==='bonus'))return {kind:flowMode,offset:step===2?v145Letters(prefix).length:0,full:step===3,normalLoop:true,challenge:false};
      return null;
    }
    if(/^Weekly Challenge/i.test(v145CounterText()))return {kind:'challenge',offset:0,full:true,normalLoop:false,challenge:true};
    // showQuickWord routes (Quick Review, Bonus Sun quick practice, Encore) all use
    // the same four-step review scaffold and only Steps 3 / 4 contain typing.
    if(reviewStep===2||reviewStep===3)return {kind:flowMode||'review',offset:reviewStep===2?v145Letters(prefix).length:0,full:reviewStep===3,normalLoop:false,challenge:false};
    return null;
  }
  function v145FirstProblem(expected,attempt){
    let hook=window.MWG_TEST_HOOKS&&window.MWG_TEST_HOOKS.supportFirstProblem;
    if(typeof hook==='function')return hook(expected,attempt);
    let e=v145Letters(expected),v=v145Letters(attempt),n=Math.min(e.length,v.length);
    for(let i=0;i<n;i++)if(v[i]!==e[i])return i;
    if(v.length<e.length)return v.length;
    if(v===e)return -1;
    return e.length?Math.max(0,e.length-1):0;
  }
  function v145RecordAssist(localIndex,offset,kind){
    if(!current||localIndex<0)return;
    let hook=window.MWG_TEST_HOOKS&&window.MWG_TEST_HOOKS.supportRecordAssist;
    if(typeof hook==='function')hook(current.id,offset+localIndex,kind);
  }
  function v145Choices(answer,absIndex){
    answer=String(answer||'').toLowerCase();
    let out=[answer],word=v145Letters(current&&current.word||''),prev=word[absIndex-1]||'',next=word[absIndex+1]||'';
    // First prefer Miori's own previous confusion for THIS word/position.
    try{
      let hook=window.MWG_TEST_HOOKS&&window.MWG_TEST_HOOKS.adaptiveProfile,p=typeof hook==='function'?hook(current.id):null;
      let last=p&&p.positions&&p.positions[absIndex]&&p.positions[absIndex].lastWrong;
      if(last&&/^[a-z]$/.test(last)&&last!==answer)out.push(last);
    }catch(e){}
    // Common English phonics/spelling confusions. These are intentionally plausible,
    // not random distractors, so Hint still asks Miori to listen and think.
    const near={
      a:['e','o','u'],e:['i','a','y'],i:['e','y','a'],o:['u','a','e'],u:['o','a','e'],y:['i','e','u'],
      b:['p','d','v'],p:['b','t','f'],d:['t','b','g'],t:['d','p','k'],
      c:['k','s','q'],k:['c','q','g'],q:['k','c','g'],g:['j','k','c'],j:['g','d','y'],
      f:['v','p','h'],v:['f','b','w'],s:['z','c','x'],z:['s','x','c'],x:['s','z','k'],
      m:['n','w','b'],n:['m','r','l'],l:['r','n','w'],r:['l','w','n'],h:['w','f','y'],w:['v','u','r']
    };
    let bank=(near[answer]||[]).slice();
    // A little context helps soft/hard C/G and final Y feel more natural.
    if(answer==='c')bank=(/[eiy]/.test(next)?['s','k','q']:['k','q','s']);
    if(answer==='g')bank=(/[eiy]/.test(next)?['j','k','c']:['k','c','j']);
    if(answer==='y'&&absIndex===word.length-1)bank=['i','e','a'];
    if(answer==='h'&&/[cstpw]/.test(prev))bank=['r','l','w'];
    for(let ch of bank){if(out.length>=3)break;if(ch!==answer&&!out.includes(ch))out.push(ch)}
    // Safe fallback for rare letters, still favoring same broad sound family first.
    let vowels=['a','e','i','o','u','y'],consonants=['b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','z'];
    let fallback=vowels.includes(answer)?vowels:consonants;
    for(let ch of fallback){if(out.length>=3)break;if(ch!==answer&&!out.includes(ch))out.push(ch)}
    return shuffle(out.slice(0,3));
  }
  function v146SpeakHintWord(){
    if(!current||!current.word)return;
    try{if(window.MWG_AUDIO&&window.MWG_AUDIO.playWord(current,'slow'))return}catch(e){}
    if(!("speechSynthesis" in window))return;
    try{
      speechSynthesis.cancel();
      let u=new SpeechSynthesisUtterance(current.word);u.lang='en-US';u.rate=.62;u.pitch=1;
      let v=typeof availableVoices!=='undefined'&&availableVoices.find(x=>(x.voiceURI||x.name)===state.settings.voiceURI);if(v)u.voice=v;
      speechSynthesis.speak(u);
    }catch(e){try{speak(current.word,true)}catch(_){} }
  }
  function v145SyncButton(){
    if(typeof v12SyncActionButton==='function'){v12SyncActionButton();return}
    let c=document.getElementById('continue');if(!c)return;
    c.classList.remove('v12-check','v12-next','v12-reward');
    let s=(c.textContent||'').trim().toLowerCase();if(s==='check')c.classList.add('v12-check');else c.classList.add('v12-next');
  }
  function v145MarkChallengeAssisted(){
    try{if(testWrongWords&&current)testWrongWords.add(current.id)}catch(e){}
  }

  const v145MakeBoxesBase=makeBoxes;
  makeBoxes=function(a,{expected,prefix='',suffix='',testMode=false,onCorrect=null,onWrong=null}){
    let ctx=v145Context(testMode,prefix);
    if(!ctx)return v145MakeBoxesBase(a,{expected,prefix,suffix,testMode,onCorrect,onWrong});

    let wrap=document.createElement('div');wrap.className='spell-line';
    if(prefix){let p=document.createElement('span');p.className='fixed-part';p.textContent=prefix;wrap.appendChild(p)}
    let boxes=[];for(let i=0;i<expected.length;i++){let b=document.createElement('span');b.className='letter-box';wrap.appendChild(b);boxes.push(b)}
    if(suffix){let x=document.createElement('span');x.className='fixed-part';x.textContent=suffix;wrap.appendChild(x)}

    let input=document.createElement('input');input.className='capture';input.autocomplete='off';input.autocapitalize='none';input.setAttribute('autocorrect','off');input.spellcheck=false;input.maxLength=expected.length;
    let help=document.createElement('div');help.className='typing-help';help.textContent='Type the letters. Use Hint or Peek if you need a little help.';
    let support=document.createElement('div');support.className='v143-support-row';
    let hintBtn=document.createElement('button');hintBtn.type='button';hintBtn.className='v143-support-btn';hintBtn.textContent='Hint';hintBtn.setAttribute('aria-label','Show a one-letter hint');
    let peekBtn=document.createElement('button');peekBtn.type='button';peekBtn.className='v143-support-btn';peekBtn.textContent='Peek';peekBtn.setAttribute('aria-label','Show the whole word briefly');
    support.append(hintBtn,peekBtn);
    let hintPanel=document.createElement('div');hintPanel.className='v143-hint-panel';hintPanel.setAttribute('aria-live','polite');
    let peekCard=document.createElement('div');peekCard.className='v143-peek-card';peekCard.setAttribute('aria-live','polite');
    let supportNote=document.createElement('div');supportNote.className='v143-support-note';

    let c=document.getElementById('continue');c.style.display='';c.textContent='Check';c.disabled=true;v145SyncButton();
    let e=v145Letters(expected),offset=ctx.offset,hadWrong=false,hadAssist=false;
    let hintSeen=new Set(),peekSeen=new Set(),peekTimer=null;

    function currentValue(){return v145Letters(input.value).slice(0,e.length)}
    function clearTarget(){boxes.forEach(b=>b.classList.remove('v143-hint-target'))}
    function render(clear=true){
      let v=currentValue();input.value=v;
      boxes.forEach((b,i)=>{b.textContent=v[i]||'';if(clear)b.classList.remove('good','bad');b.classList.toggle('active',i===v.length&&v.length<e.length)});
      c.disabled=!v.length;return v;
    }
    function mark(v){boxes.forEach((b,i)=>{b.classList.remove('active','good','bad');b.classList.add(v[i]===e[i]?'good':'bad')})}
    function target(){let i=v145FirstProblem(e,currentValue());return i<0?-1:Math.max(0,Math.min(e.length-1,i))}
    function record(kind,local){
      let seen=kind==='hint'?hintSeen:peekSeen;if(seen.has(local))return;seen.add(local);hadAssist=true;v145RecordAssist(local,offset,kind);
      if(ctx.challenge)v145MarkChallengeAssisted();
    }
    function fillAt(i,ch){
      let v=currentValue().split('');while(v.length<i)v.push('');if(i<v.length)v[i]=ch;else v.push(ch);
      input.value=v.join('').slice(0,e.length);hintPanel.innerHTML='';supportNote.textContent='';clearTarget();render(true);input.focus();
    }
    function showPeekWord(){
      peekCard.innerHTML='';
      let word=document.createElement('span');word.className='v146-peek-word';word.textContent=current.word;peekCard.appendChild(word);
      ['a','b','c','d'].forEach((k,i)=>{let s=document.createElement('span');s.className='v146-peek-sparkle '+k;s.textContent=i%2?'✧':'✦';peekCard.appendChild(s)});
      peekCard.classList.remove('show');void peekCard.offsetWidth;peekCard.classList.add('show');
    }

    hintBtn.onclick=()=>{
      if(!e.length)return;let i=target();if(i<0){hintPanel.innerHTML='';clearTarget();supportNote.textContent='Looks ready — press Check!';input.focus();return}
      let ans=e[i];record('hint',i);clearTarget();boxes[i]&&boxes[i].classList.add('v143-hint-target');hintPanel.innerHTML='';
      v146SpeakHintWord();
      supportNote.textContent=ctx.challenge?'Listen slowly and choose the letter. Help is okay, but this round will count as Clear rather than Perfect.':'Listen slowly. Which letter fits?';
      v145Choices(ans,offset+i).forEach(ch=>{let b=document.createElement('button');b.type='button';b.className='v143-letter-choice';b.textContent=ch;b.setAttribute('aria-label','Letter '+ch);b.onclick=()=>{if(ch===ans)fillAt(i,ch);else{b.classList.add('v143-choice-wrong');setTimeout(()=>b.classList.remove('v143-choice-wrong'),260)}};hintPanel.appendChild(b)});
    };
    peekBtn.onclick=()=>{
      if(!e.length)return;let i=target();if(i<0){supportNote.textContent='Looks ready — press Check!';input.focus();return}
      record('peek',i);if(peekTimer)clearTimeout(peekTimer);showPeekWord();peekBtn.disabled=true;
      supportNote.textContent=ctx.challenge?'Look, remember, then keep going. Help is okay, but this round will count as Clear rather than Perfect.':'Look, remember, then keep going.';
      peekTimer=setTimeout(()=>{peekCard.classList.remove('show');peekCard.innerHTML='';peekBtn.disabled=false;supportNote.textContent='';input.focus()},2300);
    };

    function check(){
      if(answered)return;let v=render(false);if(!v)return;
      if(v===e){
        c.disabled=false;
        if(!hadWrong&&!hadAssist&&window.MWG_TEST_HOOKS&&typeof window.MWG_TEST_HOOKS.adaptiveFirstTry==='function')window.MWG_TEST_HOOKS.adaptiveFirstTry(current.id,offset,e.length,ctx.full);
        if(onCorrect)onCorrect();else correct();
      }else{
        mark(v);hadWrong=true;
        if(window.MWG_TEST_HOOKS&&typeof window.MWG_TEST_HOOKS.adaptiveRecordWrong==='function')window.MWG_TEST_HOOKS.adaptiveRecordWrong(current.id,e,v,offset);
        if(ctx.normalLoop){
          recordWrong();oops();document.getElementById('feedback').innerHTML='<span class="no">Almost. Fix the red letters and keep going — you can use Hint or Peek.</span>';document.getElementById('wrongActions').innerHTML='';
        }else if(onWrong)onWrong();else wrongTyped();
        c.textContent='Check';c.disabled=false;continueAction=check;v145SyncButton();input.focus();
      }
    }
    continueAction=check;
    input.oninput=()=>{render(true);hintPanel.innerHTML='';supportNote.textContent='';clearTarget();continueAction=check;c.textContent='Check';v145SyncButton();if(testMode)document.getElementById('feedback').textContent=''};
    input.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();check()}};
    wrap.onclick=()=>input.focus();
    a.append(wrap,input,help,support,hintPanel,peekCard,supportNote);render(true);setTimeout(()=>input.focus(),80);
  };

  const v145RenderReviewBase=renderReviewStep;
  renderReviewStep=function(){
    v145RenderReviewBase();
    if(reviewStep===2||reviewStep===3){let h=document.getElementById('hint'),tag=h&&h.querySelector('.review-support');if(tag)tag.textContent='Hint or Peek are available anytime.'}
  };

  try{let build=document.getElementById('mwgRuntimeBuild');if(build)build.textContent='Build v0.14.6 · Help Experience'}catch(e){}
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.version='0.14.6-help-experience';
  window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
  window.MWG_TEST_HOOKS.universalTypingSupportEnabled=()=>true;
  window.MWG_TEST_HOOKS.phonicsHintChoices=(answer,absIndex=0)=>v145Choices(answer,absIndex);
  window.MWG_TEST_HOOKS.hintAudioRate=()=>.62;
  window.MWG_TEST_HOOKS.universalTypingSupportContext=(testMode=false,prefix='')=>v145Context(testMode,prefix);


// ================= v0.14.7 Growth Path Prototype =================
// A persistent, non-punitive Garden XP system. Help/Peek never reduce XP.
// The purpose is to make long-term progress visible even before final garden art exists.
(function(){
  const V147_LEVELS=[
    {xp:0,title:'Little Garden',icon:'🌱',unlock:'Leaf Badge 🍃'},
    {xp:5,title:'Sprout Explorer',icon:'🍃',unlock:'Flower Terrace 🌸'},
    {xp:12,title:'Flower Climber',icon:'🌸',unlock:'Golden Bud ✨'},
    {xp:20,title:'Garden Adventurer',icon:'✨',unlock:'Rainbow Lookout 🌈'},
    {xp:30,title:'Rainbow Gardener',icon:'🌈',unlock:'Sky Garden ☁️'},
    {xp:42,title:'Sky Garden Keeper',icon:'☁️',unlock:'Secret Garden ✨'}
  ];
  const V147_STOPS=[
    {xp:0,label:'Little Garden',icon:'🌱'},
    {xp:12,label:'Flower Terrace',icon:'🌸'},
    {xp:30,label:'Rainbow Lookout',icon:'🌈'},
    {xp:42,label:'Sky Garden',icon:'☁️'}
  ];
  function v147Growth(){
    if(!state.growth||typeof state.growth!=='object'){
      let full=0,quick=0;Object.values(state.stats||{}).forEach(s=>{full+=Number(s?.life?.fullLoops||0);quick+=Number(s?.life?.quickReviews||0)});
      let challenges=(state.weeks||[]).filter(w=>w&&w.challengePassed).length;
      let backfill=Math.max(0,Math.min(60,full+Math.floor(quick/3)*2+challenges*5));
      state.growth={xp:backfill,createdAt:Date.now(),migratedFromExisting:true,history:[],awarded:{challenges:{},bonus:{}}};
    }
    let g=state.growth;g.xp=Math.max(0,Math.floor(Number(g.xp)||0));if(!Array.isArray(g.history))g.history=[];if(!g.awarded||typeof g.awarded!=='object')g.awarded={};if(!g.awarded.challenges)g.awarded.challenges={};if(!g.awarded.bonus)g.awarded.bonus={};return g;
  }
  function v147LevelInfo(xp=v147Growth().xp){
    let idx=0;for(let i=0;i<V147_LEVELS.length;i++)if(xp>=V147_LEVELS[i].xp)idx=i;
    if(idx<V147_LEVELS.length-1){let cur=V147_LEVELS[idx],next=V147_LEVELS[idx+1];return{level:idx+1,cur,next,start:cur.xp,end:next.xp,progress:(xp-cur.xp)/(next.xp-cur.xp)}}
    let extra=Math.floor((xp-V147_LEVELS.at(-1).xp)/16),start=V147_LEVELS.at(-1).xp+extra*16,end=start+16;
    return{level:V147_LEVELS.length+extra,cur:{...V147_LEVELS.at(-1),title:extra?'Sky Garden '+(extra+1):V147_LEVELS.at(-1).title,unlock:'Secret Garden ✨'},next:{xp:end,title:'Higher Garden',icon:'⭐',unlock:'Secret Garden ✨'},start,end,progress:(xp-start)/(end-start)};
  }
  function v147NextUnlock(info){return info.next?info.cur.unlock:'Keep growing ✨'}
  function v147FlashXP(amount,label){
    let el=document.createElement('div');el.className='v147-xp-pop';el.textContent='+'+amount+' Garden XP'+(label?' · '+label:'');let card=document.querySelector('.v147-growth-card');let r=card?.getBoundingClientRect();el.style.left=((r?Math.min(window.innerWidth-190,r.left+24):24))+'px';el.style.top=((r?Math.max(18,r.top+24):80))+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),1400)
  }
  function v148XpSound(levelUp=false){
    try{
      let c=audioCtx();if(!c)return;let n=c.currentTime;
      let sweep=c.createOscillator(),sg=c.createGain();sweep.type='sine';sweep.frequency.setValueAtTime(260,n);sweep.frequency.exponentialRampToValueAtTime(levelUp?1500:950,n+.46);sg.gain.setValueAtTime(.0001,n);sg.gain.exponentialRampToValueAtTime(.07,n+.035);sg.gain.exponentialRampToValueAtTime(.0001,n+.5);sweep.connect(sg);sg.connect(c.destination);sweep.start(n);sweep.stop(n+.54);
      let notes=levelUp?[[659,.08,.18],[784,.20,.20],[1046,.34,.24],[1318,.50,.30],[1568,.70,.38]]:[[523,.08,.14],[659,.20,.16],[784,.34,.22]];
      notes.forEach(([f,t,l],i)=>{let o=c.createOscillator(),g=c.createGain();o.type=i%2?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,n+t);g.gain.exponentialRampToValueAtTime(levelUp?.095:.065,n+t+.018);g.gain.exponentialRampToValueAtTime(.0001,n+t+l);o.connect(g);g.connect(c.destination);o.start(n+t);o.stop(n+t+l+.03)});
    }catch(e){try{ding()}catch(_e){}}
  }
  function v148Particles(root,count=22){
    if(!root)return;let icons=['✦','✨','⭐','•'];for(let i=0;i<count;i++){let s=document.createElement('span');s.className='v148-xp-particle';s.textContent=icons[i%icons.length];s.style.left=(12+Math.random()*76)+'%';s.style.top=(18+Math.random()*60)+'%';s.style.setProperty('--dx',(Math.random()*180-90)+'px');s.style.setProperty('--dy',(-35-Math.random()*120)+'px');s.style.animationDelay=(Math.random()*.5)+'s';root.appendChild(s);setTimeout(()=>s.remove(),1850)}}
  function v148Count(el,from,to,duration=820){
    if(!el)return;from=Number(from)||0;to=Number(to)||0;let st=performance.now();function tick(now){let p=Math.min(1,(now-st)/duration),e=1-Math.pow(1-p,3);el.textContent=Math.round(from+(to-from)*e)+' XP';if(p<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)
  }
  function v148ShowXpGain(oldXp,newXp,amount,label,oldInfo,newInfo){
    document.querySelectorAll('.v148-xp-feedback').forEach(x=>x.remove());
    let levelChanged=newInfo.level>oldInfo.level,wrap=document.createElement('div');wrap.className='v148-xp-feedback';wrap.setAttribute('aria-live','polite');
    let oldPct=Math.round(Math.max(0,Math.min(1,oldInfo.progress))*100),newPct=Math.round(Math.max(0,Math.min(1,newInfo.progress))*100);
    let nextText=v147NextUnlock(newInfo);
    wrap.innerHTML=`<div class="v148-xp-card"><div class="v148-xp-flare"></div><div class="v148-gain">+${amount} XP</div><div class="v148-source">${label||'Garden progress'}</div><div class="v148-level-row"><span class="v148-level-icon">${oldInfo.cur.icon||'🌱'}</span><div><strong class="v148-level-name">Garden Lv. ${oldInfo.level}</strong><small class="v148-level-title">${oldInfo.cur.title}</small></div><span class="v148-xp-number">${oldXp} XP</span></div><div class="v148-track"><div class="v148-fill" style="width:${oldPct}%"><i></i></div><span class="v148-energy">✨</span></div><div class="v148-next-line">Next: <strong>${nextText}</strong></div></div>`;
    document.body.appendChild(wrap);v148Particles(wrap,levelChanged?34:22);v148XpSound(false);
    let card=wrap.querySelector('.v148-xp-card'),fill=wrap.querySelector('.v148-fill'),energy=wrap.querySelector('.v148-energy'),num=wrap.querySelector('.v148-xp-number');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{wrap.classList.add('show');energy.classList.add('fly');fill.style.width=(levelChanged?100:newPct)+'%';v148Count(num,oldXp,levelChanged?oldInfo.end:newXp,820)}));
    if(levelChanged){
      setTimeout(()=>{card.classList.add('level-cross');try{sparkle()}catch(e){}},760);
      setTimeout(()=>{
        let icon=wrap.querySelector('.v148-level-icon'),name=wrap.querySelector('.v148-level-name'),title=wrap.querySelector('.v148-level-title'),next=wrap.querySelector('.v148-next-line strong');
        if(icon)icon.textContent=newInfo.cur.icon||'✨';if(name)name.textContent='Garden Lv. '+newInfo.level;if(title)title.textContent=newInfo.cur.title;if(next)next.textContent=v147NextUnlock(newInfo);
        fill.style.transition='none';fill.style.width='0%';void fill.offsetWidth;fill.style.transition='width .7s cubic-bezier(.18,.9,.25,1)';fill.style.width=newPct+'%';num.textContent=newInfo.start+' XP';v148Count(num,newInfo.start,newXp,700);energy.classList.remove('fly');void energy.offsetWidth;energy.classList.add('fly');v148XpSound(true);v148Particles(wrap,28);try{sparkle();setTimeout(sparkle,260)}catch(e){}
      },1050);
      setTimeout(()=>wrap.classList.add('leaving'),1950);setTimeout(()=>{wrap.remove();v147ShowLevelUp(oldInfo,newInfo)},2250);
    }else{
      setTimeout(()=>{card.classList.add('settled');try{sparkle()}catch(e){}},800);setTimeout(()=>wrap.classList.add('leaving'),1700);setTimeout(()=>wrap.remove(),2050);
    }
  }
  function v147ShowLevelUp(oldInfo,newInfo){
    let old=document.querySelector('.v147-levelup-overlay');if(old)old.remove();let o=document.createElement('div');o.className='v147-levelup-overlay v148-levelup';
    let reached=newInfo.cur.title||('Level '+newInfo.level),unlock=v147NextUnlock(newInfo);
    let confetti=Array.from({length:28},(_,i)=>`<i class="v148-confetti" style="--x:${Math.round(Math.random()*360-180)}px;--y:${Math.round(Math.random()*260-130)}px;--r:${Math.round(Math.random()*300-150)}deg;--d:${(Math.random()*.45).toFixed(2)}s">${['✦','✨','⭐','🌟'][i%4]}</i>`).join('');
    o.innerHTML=`<div class="v147-levelup-card v148-levelup-card">${confetti}<span class="v147-levelup-spark a">✦</span><span class="v147-levelup-spark b">✨</span><span class="v147-levelup-spark c">✧</span><span class="v147-levelup-spark d">⭐</span><div class="v148-levelup-kicker">GARDEN LEVEL UP!</div><span class="sprout">${newInfo.cur.icon||'🌿'}</span><div class="lv">Lv. ${newInfo.level}</div><div class="title">${reached}</div><div class="v148-levelup-line"><span></span></div><div class="unlock">Next adventure: ${unlock}</div><div class="v148-levelup-msg">Your garden grew higher! ✨</div></div>`;
    document.body.appendChild(o);try{finishFanfare();paperParty();sparkle();setTimeout(sparkle,240);setTimeout(()=>{finishFanfare();sparkle()},620)}catch(e){try{ding()}catch(_e){}}
    setTimeout(()=>o.classList.add('leaving'),3150);setTimeout(()=>o.remove(),3550)
  }
  function v147AwardXP(amount,source,label){
    amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return false;let g=v147Growth(),oldXp=g.xp,old=v147LevelInfo(oldXp);g.xp+=amount;let newXp=g.xp;g.history.push({at:Date.now(),amount,source:source||'activity',label:label||''});g.history=g.history.slice(-80);let now=v147LevelInfo(newXp);save();try{v147RenderGrowthPath()}catch(e){};let delay=source==='focus'?1550:source==='harvest'?360:source==='quick-review'?320:240;setTimeout(()=>v148ShowXpGain(oldXp,newXp,amount,label,old,now),delay);return true
  }
  function v147RenderGrowthPath(){
    let viewport=document.getElementById('viewport');if(!viewport)return;let card=document.querySelector('.v147-growth-card');if(!card){card=document.createElement('section');card.className='v147-growth-card';card.setAttribute('aria-label','Garden Growth Path');viewport.insertAdjacentElement('afterend',card)}
    let g=v147Growth(),info=v147LevelInfo(g.xp),pct=Math.max(0,Math.min(1,info.progress)),worldPct=Math.max(0,Math.min(1,g.xp/42));
    let nodes=V147_STOPS.map((s,i)=>{let done=g.xp>=s.xp,next=V147_STOPS.find(x=>x.xp>g.xp),current=(!next&&i===V147_STOPS.length-1)||(next&&next.xp===s.xp);let cls=done?'done':'';if(current)cls+=' current';return `<div class="v147-node ${cls}" style="bottom:${i*(100/(V147_STOPS.length-1))}%"><span class="ico">${s.icon}</span><span>${s.label}</span><small>${s.xp} XP</small></div>`}).join('');
    let need=Math.max(0,info.end-g.xp),bar=Math.round(pct*100);card.innerHTML=`<div class="v147-growth-info"><div class="v147-level-line"><span class="v147-level-badge">${info.cur.icon} Garden Lv. ${info.level}</span><span class="v147-level-title">${info.cur.title}</span></div><div class="v147-xp-text">${g.xp} XP · ${need?need+' XP to next level':'Keep growing!'}</div><div class="v147-xp-track"><div class="v147-xp-fill" style="width:${bar}%"></div></div><div class="v147-next">Next: <strong>${v147NextUnlock(info)}</strong></div><div class="v147-growth-caption">Every practice helps the vine climb. Hint and Peek never reduce XP.</div></div><div class="v147-vine-map"><div class="v147-vine-track"><div class="v147-vine-fill" style="height:${Math.round(worldPct*100)}%"></div></div><div class="v147-rabbit-marker" style="bottom:${Math.round(worldPct*100)}%">🐰</div>${nodes}</div>`;
  }

  // Focus word: +1 when a full 4-step loop is completed.
  // Bridge older closure-scoped rewards into the Growth system without replacing them.
  window.MWG_GROWTH_AWARD=(amount,source,label)=>v147AwardXP(amount,source,label);

  const v147FinishFocusBase=finishFocusLoop;
  finishFocusLoop=function(){v147AwardXP(1,'focus','Focus word');return v147FinishFocusBase()};

  // Quick Review set: +2 only when its one-per-run seed is actually awarded.
  // Bonus Sun: +1 once per daily run.
  const v147BonusBase=runBonusSun;
  runBonusSun=function(after){let d=ensureDaily(),g=v147Growth(),key=(d.runId||d.date||localDate())+'|'+(d.bonusWordId||'bonus'),fresh=!g.awarded.bonus[key];return v147BonusBase(()=>{if(fresh){g.awarded.bonus[key]=true;v147AwardXP(1,'bonus-sun','Bonus Sun')}if(after)after()})};

  // Encore: +2 for completing the 3-word Encore set.
  // Harvest: +1 when a ripe vegetable is actually harvested.
  // Weekly Challenge: +5 for the first clear of each week only, so replaying cannot farm levels.
  const v147ChallengeResultBase=showChallengeResult;
  showChallengeResult=function(){let wk=currentWeek(),g=v147Growth(),key=wk?.id||'unknown',fresh=!!wk&&!g.awarded.challenges[key];if(fresh){g.awarded.challenges[key]=true;v147AwardXP(5,'weekly-challenge','Weekly Challenge')}return v147ChallengeResultBase()};

  // Keep the path visible whenever Garden redraws.
  const v147RenderGardenBase=renderGarden;
  renderGarden=function(){let out=v147RenderGardenBase();try{v147RenderGrowthPath()}catch(e){console.error('Growth Path render recovery',e)}return out};

  try{v147Growth();save();v147RenderGrowthPath();let build=document.getElementById('mwgRuntimeBuild');if(build)build.textContent='Build v0.14.8 · Growth Feedback Update'}catch(e){console.error('Growth Path boot recovery',e)}
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.version='0.14.8-growth-feedback';
  window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};
  window.MWG_TEST_HOOKS.growth=()=>({growth:JSON.parse(JSON.stringify(v147Growth())),level:v147LevelInfo()});
  window.MWG_TEST_HOOKS.awardGrowthXP=(n=1,label='Test XP')=>v147AwardXP(n,'test',label);
  window.MWG_TEST_HOOKS.renderGrowthPath=()=>v147RenderGrowthPath();
  window.MWG_TEST_HOOKS.growthFeedback=(n=1,label='Test XP')=>v147AwardXP(n,'test-feedback',label);
})();

})();

// ================= v0.15.0 Human Pronunciation Word Pack =================
(function(){
  const V15_COMMONS_API='https://commons.wikimedia.org/w/api.php';
  const V15_WIKT_API='https://en.wiktionary.org/w/api.php';
  const V15_ALLOWED_AUDIO_HOSTS=['upload.wikimedia.org','commons.wikimedia.org'];
  let v15Pack=null;
  let v15Audio=null;
  let v15LookupRun=0;

  function v15Now(){return Date.now()}
  function v15StripHtml(s){let d=document.createElement('div');d.innerHTML=String(s||'');return (d.textContent||'').trim()}
  function v15SafeUrl(url){
    try{let u=new URL(String(url||''));if(u.protocol!=='https:')return '';if(!V15_ALLOWED_AUDIO_HOSTS.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return '';return u.href}catch(e){return ''}
  }
  function v15MetaValue(meta,key){return v15StripHtml(meta&&meta[key]&&meta[key].value||'')}
  function v15SafePageUrl(url){try{let u=new URL(String(url||''));if(u.protocol!=='https:')return '';if(u.hostname!=='commons.wikimedia.org'&&!u.hostname.endsWith('.commons.wikimedia.org'))return '';return u.href}catch(e){return ''}}
  function v15WordKey(s){return String(s||'').trim().toLowerCase().replace(/[’']/g,"'")}
  function v15TitleWord(s){return String(s||'').trim().replace(/\s+/g,'-')}
  function v15CancelAudio(){try{if(v15Audio){v15Audio.pause();v15Audio.src='';v15Audio=null}}catch(e){}try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}}

  function v15BrowserSpeak(text,slow=false){
    if(!text||!('speechSynthesis' in window))return;
    v15CancelAudio();
    let u=new SpeechSynthesisUtterance(String(text));
    let ja=typeof isJapanese==='function'&&isJapanese(text);
    u.lang=ja?'ja-JP':'en-US';u.rate=ja?(slow?.75:.96):(slow?.72:.94);u.pitch=1;
    if(!ja&&typeof availableVoices!=='undefined'){
      let v=availableVoices.find(v=>(v.voiceURI||v.name)===state.settings.voiceURI)||availableVoices[0];if(v)u.voice=v;
    }
    speechSynthesis.speak(u);
  }

  function v15PlayHuman(meta,word,slow=false){
    let url=v15SafeUrl(meta&&meta.url);if(!url)return false;
    v15CancelAudio();
    try{
      let a=new Audio();v15Audio=a;a.preload='auto';a.src=url;a.playbackRate=slow?.82:1;
      try{a.preservesPitch=true;a.mozPreservesPitch=true;a.webkitPreservesPitch=true}catch(e){}
      a.onended=()=>{if(v15Audio===a)v15Audio=null};
      a.onerror=()=>{if(v15Audio===a)v15Audio=null;v15BrowserSpeak(word,slow)};
      let p=a.play();if(p&&p.catch)p.catch(()=>{if(v15Audio===a)v15Audio=null;v15BrowserSpeak(word,slow)});
      return true;
    }catch(e){v15BrowserSpeak(word,slow);return false}
  }

  async function v15FetchJson(base,params){
    let u=new URL(base);Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null)u.searchParams.set(k,String(v))});u.searchParams.set('origin','*');
    let r=await fetch(u.href,{mode:'cors',credentials:'omit',cache:'default'});if(!r.ok)throw new Error('Pronunciation lookup failed');return r.json();
  }

  function v15InfoFromPage(page,accentHint=''){
    if(!page||page.missing||!page.imageinfo||!page.imageinfo[0])return null;
    let ii=page.imageinfo[0],url=v15SafeUrl(ii.url);if(!url)return null;
    let em=ii.extmetadata||{},title=String(page.title||'').replace(/^File:/i,'');
    let lower=title.toLowerCase();let accent=/en-us-|us[-_ ]english|american/i.test(lower+' '+accentHint)?'US':(/en-uk-|british|uk[-_ ]english/i.test(lower+' '+accentHint)?'UK':'English');
    return {url,sourcePage:v15SafePageUrl(ii.descriptionurl)||('https://commons.wikimedia.org/wiki/'+encodeURIComponent(page.title||'')),source:'Wikimedia Commons',filename:title,license:v15MetaValue(em,'LicenseShortName')||v15MetaValue(em,'UsageTerms')||'',artist:v15MetaValue(em,'Artist')||'',accent};
  }

  async function v15CommonsInfo(titles,accentHints={}){
    if(!titles.length)return [];
    let d=await v15FetchJson(V15_COMMONS_API,{action:'query',format:'json',formatversion:2,prop:'imageinfo',iiprop:'url|mime|extmetadata',titles:titles.join('|')});
    return (d.query&&d.query.pages||[]).map(p=>v15InfoFromPage(p,accentHints[p.title]||'')).filter(Boolean);
  }

  function v15ScoreAudio(meta,word){
    let f=(meta.filename||'').toLowerCase(),w=v15TitleWord(word).toLowerCase();let s=0;
    if(meta.accent==='US')s+=100;else if(meta.accent==='English')s+=45;else if(meta.accent==='UK')s+=25;
    if(f===`en-us-${w}.ogg`)s+=80;if(f.includes(`-${w}.`))s+=45;if(f.includes(w))s+=20;
    if(/pronunciation|audio/.test(f))s+=2;return s;
  }

  async function v15ExactLookup(word){
    let w=v15TitleWord(word),low=w.toLowerCase(),cap=w.charAt(0).toUpperCase()+w.slice(1);let stems=[w,low,cap];let titles=[];
    for(let stem of [...new Set(stems)])for(let ext of ['ogg','oga','wav','mp3','webm'])titles.push(`File:En-us-${stem}.${ext}`);
    let infos=await v15CommonsInfo(titles);infos.sort((a,b)=>v15ScoreAudio(b,word)-v15ScoreAudio(a,word));return infos[0]||null;
  }

  function v15ExtractWiktionaryAudio(wikitext){
    let out=[],s=String(wikitext||''),m;
    let modern=/\{\{\s*audio\s*\|\s*en\s*\|\s*([^|}\n]+\.(?:ogg|oga|wav|mp3|webm))([^}]*)\}\}/gi;
    while((m=modern.exec(s)))out.push({file:m[1].trim(),tail:m[2]||''});
    let legacy=/\{\{\s*audio\s*\|\s*([^|}\n]+\.(?:ogg|oga|wav|mp3|webm))([^}]*)\}\}/gi;
    while((m=legacy.exec(s))){let tail=m[2]||'';if(/(?:^|\|)\s*lang\s*=\s*en(?:\||$)/i.test(tail))out.push({file:m[1].trim(),tail})}
    let seen=new Set();return out.filter(x=>{let k=x.file.toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
  }

  async function v15WiktionaryLookup(word){
    let d=await v15FetchJson(V15_WIKT_API,{action:'parse',format:'json',formatversion:2,page:word,prop:'wikitext'});let wt=d.parse&&d.parse.wikitext||'';let files=v15ExtractWiktionaryAudio(wt);if(!files.length)return null;
    files.sort((a,b)=>{let score=x=>/en-us-|\ba\s*=\s*US\b/i.test(x.file+' '+x.tail)?100:/en-(?:ca|au)-/i.test(x.file)?50:/en-uk-/i.test(x.file)?20:40;return score(b)-score(a)});
    let titles=files.slice(0,12).map(x=>'File:'+x.file);let hints={};files.slice(0,12).forEach(x=>hints['File:'+x.file]=x.tail);
    let infos=await v15CommonsInfo(titles,hints);infos.sort((a,b)=>v15ScoreAudio(b,word)-v15ScoreAudio(a,word));return infos[0]||null;
  }

  async function v15SearchLookup(word){
    let q=`\"${String(word).replace(/\"/g,'')}\" incategory:\"U.S. English pronunciation\"`;
    let d=await v15FetchJson(V15_COMMONS_API,{action:'query',format:'json',formatversion:2,list:'search',srnamespace:6,srlimit:10,srsearch:q});let results=d.query&&d.query.search||[];
    let titles=results.map(x=>x.title).filter(t=>/\.(ogg|oga|wav|mp3|webm)$/i.test(t));if(!titles.length)return null;
    let infos=await v15CommonsInfo(titles);infos=infos.filter(x=>(x.filename||'').toLowerCase().includes(v15TitleWord(word).toLowerCase()));infos.sort((a,b)=>v15ScoreAudio(b,word)-v15ScoreAudio(a,word));return infos[0]||null;
  }

  async function v15LookupHumanAudio(word){
    word=String(word||'').trim();if(!word)return null;
    try{let x=await v15ExactLookup(word);if(x)return x}catch(e){}
    try{let x=await v15WiktionaryLookup(word);if(x)return x}catch(e){}
    try{let x=await v15SearchLookup(word);if(x)return x}catch(e){}
    return null;
  }

  function v15MaybeLookupStateWord(w,force=false){
    if(!w||!w.word)return Promise.resolve(null);if(!force&&w.humanAudio&&v15SafeUrl(w.humanAudio.url))return Promise.resolve(w.humanAudio);
    if(!force&&w.humanAudioLookup&&w.humanAudioLookup.status==='missing')return Promise.resolve(null);
    if(w._v15LookupPromise)return w._v15LookupPromise;
    w._v15LookupPromise=v15LookupHumanAudio(w.word).then(meta=>{if(meta){w.humanAudio=meta;w.humanAudioLookup={status:'found',checkedAt:v15Now()}}else w.humanAudioLookup={status:'missing',checkedAt:v15Now()};delete w._v15LookupPromise;save();return meta}).catch(()=>{delete w._v15LookupPromise;return null});
    return w._v15LookupPromise;
  }

  function v15SpeakWord(w,slow=false){
    if(w&&w.humanAudio&&v15SafeUrl(w.humanAudio.url)){v15PlayHuman(w.humanAudio,w.word,slow);return true}
    if(w)v15MaybeLookupStateWord(w,false);v15BrowserSpeak(w&&w.word||'',slow);return false;
  }

  // Replace the v0.14.9 AI-audio preference: v0.15 never needs OpenAI audio.
  speak=function(t,slow=false){
    try{if(current){let tx=String(t||'').trim();if(v15WordKey(tx)===v15WordKey(current.word))return v15SpeakWord(current,slow);}}
    catch(e){}
    return v15BrowserSpeak(t,slow);
  };
  if(typeof speakAny==='function')speakAny=function(t,slow=false){
    try{if(current){let tx=String(t||'').trim();if(v15WordKey(tx)===v15WordKey(current.word))return v15SpeakWord(current,slow);}}
    catch(e){}
    return v15BrowserSpeak(t,slow);
  };

  // Improve fallback voice ranking while preserving a parent's explicit selection when possible.
  voiceScore=function(v){let s=0,n=(v.name||'').toLowerCase(),l=(v.lang||'').toLowerCase();if(l==='en-us')s+=50;else if(l.startsWith('en-us'))s+=46;else if(l.startsWith('en'))s+=20;if(v.default)s+=3;if(/natural|neural|enhanced|premium|online/.test(n))s+=25;if(/google us english|chrome os us english|samantha|ava|allison|aria|jenny/.test(n))s+=18;if(/compact|espeak/.test(n))s-=8;return s};
  loadVoices=function(){
    if(!('speechSynthesis' in window))return;availableVoices=speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith('en')).sort((a,b)=>voiceScore(b)-voiceScore(a));let sel=document.getElementById('voiceSelect');if(!sel)return;let previous=state.settings.voiceURI;sel.innerHTML='';if(!availableVoices.length){sel.innerHTML='<option value="">Default English voice</option>';return}availableVoices.forEach((v,i)=>{let o=document.createElement('option');o.value=v.voiceURI||v.name;o.textContent=(i===0?'⭐ Recommended · ':'')+v.name+' ('+v.lang+')'+(v.default?' · default':'');sel.appendChild(o)});let exists=availableVoices.some(v=>(v.voiceURI||v.name)===previous);if(!exists&&availableVoices[0])state.settings.voiceURI=availableVoices[0].voiceURI||availableVoices[0].name;sel.value=state.settings.voiceURI;save()};
  try{loadVoices();if('speechSynthesis' in window&&'onvoiceschanged' in speechSynthesis)speechSynthesis.onvoiceschanged=loadVoices}catch(e){}

  function v15NormalizePronunciation(p){
    if(!p)return null;let x=p.pronunciation||p.humanAudio||p.audio||null;if(!x||typeof x!=='object')return null;let url=v15SafeUrl(x.url||x.wordUrl||x.audioUrl);if(!url)return null;return {url,sourcePage:v15SafePageUrl(x.sourcePage||x.page||''),source:String(x.source||'Wikimedia Commons'),filename:String(x.filename||''),license:String(x.license||''),artist:String(x.artist||''),accent:String(x.accent||'US')};
  }
  function v15NormalizePack(raw){
    let words=Array.isArray(raw)?raw:(raw&&raw.words);if(!Array.isArray(words)||!words.length)throw new Error('This file does not contain a Word Pack word list.');
    let clean=words.slice(0,15).map(p=>({word:String(p.word||'').trim(),meaningEn:String(p.meaningEn||p.englishMeaning||'').trim(),meaningJa:String(p.meaningJa||p.meaning||'').trim(),example:String(p.example||'').trim(),phonicsFocus:String(p.phonicsFocus||p.focus||'').trim(),pictureCue:String(p.pictureCue||p.picture||'').trim(),humanAudio:v15NormalizePronunciation(p),humanAudioLookup:null})).filter(w=>w.word);
    if(!clean.length)throw new Error('No spelling words were found in this Word Pack.');
    clean.forEach(w=>{if(w.humanAudio)w.humanAudioLookup={status:'found',checkedAt:v15Now()}});
    return {format:'miori-word-garden-wordpack',version:Number(raw&&raw.version)||2,packTitle:String(raw&&raw.packTitle||raw&&raw.title||'ChatGPT Word Pack').trim(),words:clean};
  }

  function v15SetProgress(text,busy=false,bad=false){let el=document.getElementById('wordPackProgress');if(!el)return;el.textContent=text||'';el.classList.toggle('busy',!!busy);el.style.color=bad?'#a7535a':''}
  function v15Status(w){if(w.humanAudio&&v15SafeUrl(w.humanAudio.url))return {cls:'human',label:'🎙️ Human voice'};if(w._searching)return {cls:'searching',label:'Finding voice…'};return {cls:'fallback',label:'🔊 Device voice'} }
  function v15RenderPack(){
    let area=document.getElementById('wordPackPreview'),actions=document.getElementById('wordPackActions'),retry=document.getElementById('wordPackRetryHuman');if(!area||!actions)return;
    if(!v15Pack){area.innerHTML='';actions.style.display='none';if(retry)retry.style.display='none';return}
    let wk=currentWeek(),slots=Math.max(0,15-(wk&&wk.wordIds?wk.wordIds.length:0)),human=0,searching=0;
    let rows=v15Pack.words.map((w,i)=>{let st=v15Status(w);if(st.cls==='human')human++;if(st.cls==='searching')searching++;let existing=(state.words||[]).find(x=>v15WordKey(x.word)===v15WordKey(w.word)),inWeek=!!(existing&&wk&&wk.wordIds.includes(existing.id));let src='';if(w.humanAudio){let m=w.humanAudio,safePage=v15SafePageUrl(m.sourcePage),link=safePage?`<a href="${esc(safePage)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons ↗</a>`:'Wikimedia Commons';let bits=[m.accent?m.accent+' English':'',m.artist?('by '+m.artist):'',m.license||''].filter(Boolean).map(esc).join(' · ');src=`<div class="mwg-human-source"><span class="mwg-audio-source-chip">🎙️ ${link}</span>${bits?`<span>${bits}</span>`:''}</div>`}else src='<div class="mwg-human-note">No matching human recording found yet. Word Garden will use the selected device voice.</div>';
      return `<div class="mwg-wordpack-row"><div class="mwg-wordpack-row-top"><div><span class="mwg-wordpack-word">${esc(w.word)}</span>${w.pictureCue?`<span class="mwg-wordpack-picture">${esc(w.pictureCue)}</span>`:''}</div><span class="mwg-wordpack-audio ${st.cls}">${st.label}</span></div><div class="mwg-wordpack-field"><b>School EN:</b> ${esc(w.meaningEn||'—')}</div><div class="mwg-wordpack-field"><b>日本語:</b> ${esc(w.meaningJa||'—')}</div><div class="mwg-wordpack-field"><b>Example:</b> ${esc(w.example||'—')}</div>${w.phonicsFocus?`<span class="mwg-wordpack-phonics">Phonics: ${esc(w.phonicsFocus)}</span>`:''}<div class="btnrow" style="margin-top:8px"><button class="mini-action mwg-v15-play" data-i="${i}">▶ Word</button><button class="mini-action mwg-v15-slow" data-i="${i}">🐢 Slow</button></div>${src}<div class="tiny" style="margin-top:5px">${inWeek?'Already in This Week':existing?'Already in Library · will update/link':'New word'}</div></div>`}).join('');
    area.innerHTML=`<div class="mwg-wordpack-summary"><strong>${esc(v15Pack.packTitle)}</strong> · ${v15Pack.words.length} words · ${human} human recording${human===1?'':'s'}${searching?' · '+searching+' searching':''} · ${slots} open weekly slots</div><div class="mwg-wordpack-preview">${rows}</div>`;
    area.querySelectorAll('.mwg-v15-play').forEach(b=>b.onclick=()=>{let w=v15Pack.words[Number(b.dataset.i)];if(w.humanAudio)v15PlayHuman(w.humanAudio,w.word,false);else v15BrowserSpeak(w.word,false)});
    area.querySelectorAll('.mwg-v15-slow').forEach(b=>b.onclick=()=>{let w=v15Pack.words[Number(b.dataset.i)];if(w.humanAudio)v15PlayHuman(w.humanAudio,w.word,true);else v15BrowserSpeak(w.word,true)});
    actions.style.display='flex';if(retry)retry.style.display='';
  }

  async function v15RunPool(tasks,limit=3,onTick=()=>{}){let idx=0,done=0;async function worker(){while(true){let i=idx++;if(i>=tasks.length)return;try{await tasks[i]()}catch(e){}finally{done++;onTick(done,tasks.length)}}}await Promise.all(Array.from({length:Math.min(limit,tasks.length||1)},worker))}
  async function v15ResolvePackAudio(force=false){
    if(!v15Pack)return;let run=++v15LookupRun,tasks=[];for(let w of v15Pack.words){if(!force&&w.humanAudio)continue;w._searching=true;if(force){w.humanAudio=null;w.humanAudioLookup=null}tasks.push(async()=>{let meta=await v15LookupHumanAudio(w.word);if(run!==v15LookupRun)return;w._searching=false;if(meta){w.humanAudio=meta;w.humanAudioLookup={status:'found',checkedAt:v15Now()}}else w.humanAudioLookup={status:'missing',checkedAt:v15Now()}})}
    if(!tasks.length){v15SetProgress('Human pronunciation is ready for this Word Pack.');v15RenderPack();return}
    v15SetProgress(`Looking for real human pronunciations… 0 / ${tasks.length}`,true);v15RenderPack();
    await v15RunPool(tasks,3,(done,total)=>{if(run===v15LookupRun){v15SetProgress(`Looking for real human pronunciations… ${done} / ${total}`,done<total);v15RenderPack()}});
    if(run!==v15LookupRun)return;let n=v15Pack.words.filter(w=>w.humanAudio).length;v15SetProgress(`Ready! Found human pronunciation for ${n} of ${v15Pack.words.length} words. The rest will use the selected device voice.`);v15RenderPack();
  }

  function v15UpsertPackWord(p){
    let n=String(p.word||'').trim(),w=(state.words||[]).find(x=>v15WordKey(x.word)===v15WordKey(n));if(!w){w={id:id(),word:n,meaning:'',meaningEn:'',mistake:'',focus:'',example:'',picture:'',autoMeaning:'',autoExample:'',createdAt:Date.now()};state.words.push(w);state.stats[w.id]={life:emptyLife(),weekly:{}}}
    w.meaningEn=String(p.meaningEn||'').trim();w.meaning=String(p.meaningJa||'').trim();w.example=String(p.example||'').trim();w.focus=String(p.phonicsFocus||'').trim();if(p.pictureCue)w.picture=String(p.pictureCue).trim();if(p.humanAudio){w.humanAudio=p.humanAudio;w.humanAudioLookup={status:'found',checkedAt:v15Now()}}else if(!w.humanAudio&&p.humanAudioLookup)w.humanAudioLookup=p.humanAudioLookup;delete w.audioPack;w.wordPackSource={version:2,source:'chatgpt-wordpack',packTitle:v15Pack&&v15Pack.packTitle||'',importedAt:v15Now()};return w;
  }
  function v15CommitPack(){
    if(!v15Pack)return;let wk=currentWeek(),added=0,updated=0,human=0;for(let p of v15Pack.words){if(wk.wordIds.length>=15)break;let existed=(state.words||[]).find(w=>v15WordKey(w.word)===v15WordKey(p.word)),w=v15UpsertPackWord(p);if(existed)updated++;if(addToCurrentWeek(w))added++;if(w.humanAudio)human++}state.daily=freshDaily();save();renderParent();renderGarden();v15SetProgress(`Added ${added} word${added===1?'':'s'} to This Week${updated?' · updated '+updated+' Library word'+(updated===1?'':'s'):''} · ${human} human pronunciation${human===1?'':'s'} linked. 🌱`);let a=document.getElementById('wordPackActions');if(a)a.style.display='none';
  }
  function v15ClearPack(){v15LookupRun++;v15Pack=null;let inp=document.getElementById('wordPackJson');if(inp)inp.value='';let name=document.getElementById('wordPackFileName');if(name)name.textContent='No Word Pack selected';v15SetProgress('');v15RenderPack()}
  async function v15LoadFile(file){
    if(!file)return;if(file.size>700000){v15SetProgress('This Word Pack file is unexpectedly large.',false,true);return}
    try{v15SetProgress('Reading Word Pack…',true);let raw=JSON.parse(await file.text());v15Pack=v15NormalizePack(raw);let name=document.getElementById('wordPackFileName');if(name)name.textContent=file.name;v15RenderPack();await v15ResolvePackAudio(false)}catch(e){v15Pack=null;v15SetProgress(e.message||'Could not read this Word Pack.',false,true);v15RenderPack()}
  }

  let choose=document.getElementById('wordPackChoose'),inp=document.getElementById('wordPackJson'),add=document.getElementById('wordPackAdd'),clear=document.getElementById('wordPackClear'),retry=document.getElementById('wordPackRetryHuman');
  if(choose&&inp)choose.onclick=()=>inp.click();if(inp)inp.onchange=()=>v15LoadFile(inp.files&&inp.files[0]);if(add)add.onclick=v15CommitPack;if(clear)clear.onclick=v15ClearPack;if(retry)retry.onclick=()=>v15ResolvePackAudio(true);
  let drop=document.getElementById('wordPackDrop');if(drop){drop.ondragover=e=>{e.preventDefault();drop.classList.add('dragover')};drop.ondragleave=()=>drop.classList.remove('dragover');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('dragover');let f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)v15LoadFile(f)}}

  try{let build=document.getElementById('mwgRuntimeBuild');if(build)build.textContent='Build v0.15.0 · Human Voice Word Pack'}catch(e){}
  try{let d=document.getElementById('mwgAiVoiceDisclosure');if(d)d.textContent='🎙️ Human pronunciation from Wikimedia Commons is preferred when available.'}catch(e){}
  window.MWG_DIAGNOSTICS=window.MWG_DIAGNOSTICS||{};window.MWG_DIAGNOSTICS.version='0.15.0-human-voice-word-pack';window.MWG_DIAGNOSTICS.pronunciation='Wikimedia Commons → device voice fallback';
  window.MWG_TEST_HOOKS=window.MWG_TEST_HOOKS||{};window.MWG_TEST_HOOKS.v15NormalizePack=v15NormalizePack;window.MWG_TEST_HOOKS.v15LookupHumanAudio=v15LookupHumanAudio;window.MWG_TEST_HOOKS.v15Pack=()=>v15Pack;
})();
