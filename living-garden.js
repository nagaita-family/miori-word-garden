(()=>{
'use strict';
const VERSION=1;
function fresh(){return{livingGardenVersion:VERSION,growth:0,pos:{},stored:[],bunnySeated:false,locations:{bunny:'garden',cat:'garden',bird:'garden'},characterPos:{bunny:{x:46,y:73},cat:{x:68,y:78},bird:{x:31,y:35}},commands:{},fruit:{progress:0,eaten:0},houses:{main_house:{owned:true}},garage:[],placed:['arch'],moments:{}}}
function migrate(state){
 if(state.garden?.livingGardenVersion===VERSION){const g=state.garden;g.locations=g.locations||{};g.characterPos=g.characterPos||{};g.commands=g.commands||{};for(const id of ['bunny','cat','bird']){if(!g.locations[id])g.locations[id]='garden';if(!g.characterPos[id])g.characterPos[id]=({bunny:{x:46,y:73},cat:{x:68,y:78},bird:{x:31,y:35}})[id]}if(!Array.isArray(g.placed))g.placed=['arch'];if(!Number.isFinite(g.fruit?.progress))g.fruit={progress:Math.max(0,g.growth||0),eaten:0};g.moments=g.moments||{};return state;}
 // Replace only the Garden subtree. XP, learning history, words and test state remain untouched.
 state.garden=fresh();return state;
}
function daypart(date=new Date()){
 const hour=date.getHours();return hour<6||hour>=20?'night':hour<11?'morning':hour<17?'day':'evening';
}
const CHARACTERS=['bunny','cat','bird'];
const OBJECT_REACTIONS={arch:{bunny:'Bunny hops through the flower arch! ♡',cat:'Cat strolls through the flowers ✿',bird:'Bird rests on top of the arch ♫'}};
const DAY_MOMENTS={morning:'Good morning! The flowers open in the soft light 🌼',day:'A sunny little growing moment ☀️',evening:'The garden glows at sunset 🌅',night:'The patio lights welcome you home ✨'};
function onWordComplete(g,now=new Date()){
 if(!g.fruit||!Number.isFinite(g.fruit.progress))g.fruit={progress:0,eaten:0};
 g.fruit.progress++;
 const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const part=daypart(now);if(g.moments?.date!==date)g.moments={date,parts:[]};
 const moment=g.moments.parts.includes(part)?'':DAY_MOMENTS[part];
 if(moment)g.moments.parts.push(part);
 return{stage:Math.min(4,g.fruit.progress),moment};
}
function eatFruit(g){
 if((g.fruit?.progress||0)<4)return false;
 g.fruit.progress-=4;g.fruit.eaten=(g.fruit.eaten||0)+1;return true;
}

let active=null;const actionTokens={};
function characterAction(id,target,ctx=active){
 if(!ctx||!CHARACTERS.includes(id))return;
 const {state,save}=ctx,g=state.garden;
 if(target==='main_house'&&g.locations[id]!=='garden')return;
 if(target==='arch'&&(g.locations[id]!=='garden'||!g.placed.includes('arch')))return;
 g.commands[id]={until:Date.now()+20000,target};const token=actionTokens[id]=(actionTokens[id]||0)+1;
 if(target==='main_house'){
   if(g.locations[id]!=='garden')return;
   moveActor(id,{x:81,y:59},ctx);
   setTimeout(()=>{if(token!==actionTokens[id]||g.commands[id]?.target!==target)return;g.locations[id]='main_house';save();if(document.querySelector('#gardenView.active-view'))render(ctx)},950);
 }else if(target==='garden'){
   g.locations[id]='garden';moveActor(id,{x:76,y:66},ctx);if(document.querySelector('#gardenView.active-view'))render(ctx);
 }else if(OBJECT_REACTIONS[target]?.[id]&&g.locations[id]==='garden'&&g.placed.includes(target)){
   const position=target==='arch'?{x:59,y:id==='bird'?39:67}:{x:50,y:65};
   moveActor(id,position,ctx);
   setTimeout(()=>{if(token!==actionTokens[id]||g.commands[id]?.target!==target)return;const reaction=document.querySelector('#livingReaction');if(reaction)reaction.textContent=OBJECT_REACTIONS[target][id]},850);
 }
}
function moveActor(id,pos,ctx){
 const g=ctx.state.garden;g.characterPos[id]=pos;
 const el=document.querySelector(`[data-living-actor="${id}"]`);
 if(el){el.style.left=`${pos.x}%`;el.style.top=`${pos.y}%`}
 ctx.save();
}
function gentleWander(){
 const ctx=active,scene=document.querySelector('#gardenView.active-view .living-scene');if(!ctx||!scene)return;
 const g=ctx.state.garden;for(const id of CHARACTERS){
   if(g.locations[id]!=='garden'||g.commands[id]?.until>Date.now())continue;
   if(Math.random()<.48)continue; // Characters often rest instead of always moving.
   const old=g.characterPos[id]||{x:50,y:72};
   moveActor(id,{x:Math.max(30,Math.min(84,old.x+(Math.random()-.5)*12)),y:Math.max(48,Math.min(83,old.y+(Math.random()-.5)*9))},ctx);
 }
}
function render(ctx){
 active=ctx;const {state,celebration,play,art}=ctx;
 const part=daypart(),g=state.garden,view=document.querySelector('#gardenView');
 const titles={morning:'A gentle morning',day:'A sunny afternoon',evening:'A glowing evening',night:'A peaceful night'};
 const note=celebration?`<div class="living-moment">🌱 ${escapeText(celebration.word)} helped your garden grow!${celebration.moment?`<small>${escapeText(celebration.moment)}</small>`:''}</div>`:'';
 const fruitStage=Math.min(4,g.fruit?.progress||0),fruitLabel=['Resting branch','Flower','Tiny fruit','Growing fruit','Ripe fruit'][fruitStage];
 view.innerHTML=`<div class="living-garden garden-view"><header class="living-head"><div><p class="eyebrow">YOUR LIVING GARDEN</p><h1>Miori’s little world ✦</h1><p>${titles[part]} · ${g.growth} words grown</p></div><button id="livingPlay" class="primary-btn">${celebration?'Next word →':'Play! ✦'}</button></header><div class="living-scene ${part}" id="livingScene"><div class="living-sky"><i class="living-cloud first"></i><i class="living-cloud second"></i><i class="living-sun"></i><i class="living-moon"></i><i class="living-stars">✦　✧　✦</i></div><div class="living-hill far"></div><div class="living-hill near"></div><div class="living-shrub left"></div><div class="living-shrub right"></div><div class="living-oak"><i class="trunk"></i><i class="canopy"></i><button id="livingFruit" class="living-fruit stage-${fruitStage}" aria-label="${fruitStage===4?'Eat ripe fruit':fruitLabel}" ${fruitStage===4?'':'disabled'}>${fruitStage===1?'🌼':fruitStage>1?'🍊':''}</button></div><button class="living-house" id="livingHouse" aria-label="Main House"><i class="roof"></i><i class="window"></i><i class="door"></i></button><div class="living-path"></div><div class="living-lawn"></div><button class="living-arch" id="livingArch" aria-label="Visit Flower Arch">🌸<span>Flower Arch</span></button><div class="living-patio-lights">✦　✦　✦　✦</div><div id="livingActors">${CHARACTERS.filter(id=>g.locations[id]==='garden').map(id=>{const p=g.characterPos[id]||{x:50,y:70};return `<button class="living-actor ${id}" data-living-actor="${id}" style="left:${p.x}%;top:${p.y}%" aria-label="${id} options">${id==='bird'?'🐦':art?.(id)||escapeText(id)}</button>`}).join('')}</div>${note}<div id="livingReaction" class="living-reaction" aria-live="polite"></div><div class="living-scene-label">${titles[part]} · ${fruitLabel}</div></div><div id="livingActions" class="living-actions" aria-live="polite">Tap a friend or the flower arch ✦</div></div>`;
 view.querySelector('#livingPlay').addEventListener('click',play);
 view.querySelector('#livingFruit')?.addEventListener('click',e=>{
   const fruit=e.currentTarget;if(fruit.disabled||!g.fruit||g.fruit.progress<4)return;fruit.disabled=true;
   const eater=CHARACTERS.find(c=>g.locations[c]==='garden');
   if(eater)moveActor(eater,{x:31,y:eater==='bird'?37:60},ctx);
   const reaction=view.querySelector('#livingReaction');if(reaction)reaction.textContent=eater?`${eater==='bunny'?'Bunny':eater==='cat'?'Cat':'Bird'} enjoys the fruit! 🍊`:'A little snack is waiting for your friends 🍊';
   setTimeout(()=>{if(!eatFruit(g))return;ctx.save();if(document.querySelector('#gardenView.active-view'))render(ctx)},1250);
 });
 view.querySelectorAll('[data-living-actor]').forEach(el=>el.addEventListener('click',()=>{
   const id=el.dataset.livingActor,menu=view.querySelector('#livingActions');
   menu.innerHTML=`<strong>${id==='bunny'?'Bunny':id==='cat'?'Cat':'Bird'}</strong><button data-action="arch">Visit arch</button><button data-action="main_house">Go home</button>`;
   menu.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>characterAction(id,btn.dataset.action,{...ctx})));
 }));
 view.querySelector('#livingArch').addEventListener('click',()=>{
   const id=CHARACTERS.find(c=>g.locations[c]==='garden');if(id)characterAction(id,'arch',ctx);
 });
 view.querySelector('#livingHouse').addEventListener('click',()=>{
   const inside=CHARACTERS.filter(c=>g.locations[c]==='main_house');const menu=view.querySelector('#livingActions');
   menu.innerHTML=`<strong>Main House · ${inside.length} inside</strong>${inside.map(id=>`<button data-out="${id}">${id==='bunny'?'Bunny':id==='cat'?'Cat':'Bird'} come outside</button>`).join('')||'<span>Everyone is outside</span>'}`;
   menu.querySelectorAll('[data-out]').forEach(btn=>btn.addEventListener('click',()=>characterAction(btn.dataset.out,'garden',ctx)));
 });
}
function escapeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.LivingGarden={VERSION,fresh,migrate,daypart,render,characterAction,gentleWander,onWordComplete,eatFruit,OBJECT_REACTIONS};
setInterval(gentleWander,9500);
let lastPart=daypart();setInterval(()=>{const next=daypart();if(next!==lastPart){lastPart=next;if(document.querySelector('#gardenView.active-view .living-scene'))document.querySelector('[data-nav="garden"]')?.click()}},60000);
})();
