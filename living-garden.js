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
// Illustrated, open-centered trellis: the arch sits in front of residents while its opening remains touchable.
const FLOWER_ARCH=`<svg class="living-arch-art" viewBox="0 0 240 220" aria-hidden="true" focusable="false"><path d="M22 207V98C22 44 63 17 120 17s98 27 98 81v109" fill="none" stroke="#708f69" stroke-width="23" stroke-linecap="round"/><path d="M22 207V98C22 44 63 17 120 17s98 27 98 81v109" fill="none" stroke="#e1c7a0" stroke-width="14" stroke-linecap="round"/><path d="M22 207V98C22 44 63 17 120 17s98 27 98 81v109" fill="none" stroke="#74a672" stroke-width="5" stroke-linecap="round"/><path d="M32 107l-20 12m24 28-26 12m200-52 20 12m-24 28 26 12" stroke="#91785c" stroke-width="4" stroke-linecap="round"/><g fill="#6eaa72"><ellipse cx="30" cy="82" rx="8" ry="16" transform="rotate(-40 30 82)"/><ellipse cx="55" cy="46" rx="8" ry="15" transform="rotate(-55 55 46)"/><ellipse cx="88" cy="24" rx="8" ry="16" transform="rotate(-25 88 24)"/><ellipse cx="153" cy="24" rx="8" ry="16" transform="rotate(25 153 24)"/><ellipse cx="185" cy="46" rx="8" ry="15" transform="rotate(55 185 46)"/><ellipse cx="210" cy="82" rx="8" ry="16" transform="rotate(40 210 82)"/><ellipse cx="13" cy="164" rx="7" ry="14" transform="rotate(-44 13 164)"/><ellipse cx="227" cy="164" rx="7" ry="14" transform="rotate(44 227 164)"/></g><defs><g id="livingBlossom"><g fill="#f4a8ad" stroke="#e68ba0" stroke-width=".8"><circle cx="0" cy="-7" r="5"/><circle cx="7" cy="-2" r="5"/><circle cx="4" cy="6" r="5"/><circle cx="-4" cy="6" r="5"/><circle cx="-7" cy="-2" r="5"/></g><circle r="3.8" fill="#ffe2a0"/></g></defs><use href="#livingBlossom" transform="translate(35 70) scale(1)"/><use href="#livingBlossom" transform="translate(67 34) scale(0.95)"/><use href="#livingBlossom" transform="translate(119 16) scale(1.1)"/><use href="#livingBlossom" transform="translate(171 34) scale(0.95)"/><use href="#livingBlossom" transform="translate(205 71) scale(1)"/><use href="#livingBlossom" transform="translate(20 140) scale(0.8)"/><use href="#livingBlossom" transform="translate(220 140) scale(0.8)"/><path d="M6 210q16-8 34 0m160 0q17-8 34 0" fill="none" stroke="#acc186" stroke-width="7" stroke-linecap="round"/></svg>`;
const BIRD_ART=`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 51v8m14-8v8" stroke="#b88457" stroke-width="3" stroke-linecap="round"/><ellipse cx="31" cy="37" rx="23" ry="20" fill="#63b6cc"/><path d="M43 37l17-10-3 17-14 2" fill="#4c9eb2"/><ellipse cx="26" cy="40" rx="12" ry="8" fill="#83cbdb" transform="rotate(-27 26 40)"/><circle cx="22" cy="22" r="14" fill="#7ec6d6"/><circle cx="18" cy="20" r="2.4" fill="#384d55"/><path d="M9 26l-9 4 10 3" fill="#e8b36e"/><path d="M36 19q10-5 17 3" fill="none" stroke="#94d3dc" stroke-width="3" stroke-linecap="round"/></svg>`;
function fruitArt(stage){return stage===0?'':stage===1?`<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M28 41q8-20 3-31" fill="none" stroke="#557b54" stroke-width="3"/><g fill="#f5bac4"><ellipse cx="31" cy="17" rx="6" ry="12"/><ellipse cx="31" cy="17" rx="6" ry="12" transform="rotate(72 31 26)"/><ellipse cx="31" cy="17" rx="6" ry="12" transform="rotate(144 31 26)"/><ellipse cx="31" cy="17" rx="6" ry="12" transform="rotate(216 31 26)"/><ellipse cx="31" cy="17" rx="6" ry="12" transform="rotate(288 31 26)"/></g><circle cx="31" cy="26" r="5" fill="#ffd586"/></svg>`:`<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 21q0-9 7-13" fill="none" stroke="#657d46" stroke-width="3" stroke-linecap="round"/><path d="M32 13q7-9 17-5-2 11-17 10" fill="#6ca66d"/><circle cx="30" cy="36" r="${stage===2?10:stage===3?16:20}" fill="#f8b865" stroke="#dc8d59" stroke-width="2"/><path d="M17 35q6-12 16-12" fill="none" stroke="#ffe0a0" stroke-width="3" stroke-linecap="round"/></svg>`}
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
   if(target==='arch'&&id!=='bird'){
     moveActor(id,{x:55,y:74},ctx);
     setTimeout(()=>{if(token!==actionTokens[id]||g.locations[id]!=='garden')return;moveActor(id,{x:64,y:74},ctx)},1100);
   }else moveActor(id,target==='arch'?{x:63,y:43}:{x:50,y:65},ctx);
   setTimeout(()=>{if(token!==actionTokens[id]||g.commands[id]?.target!==target||g.locations[id]!=='garden')return;const reaction=document.querySelector('#livingReaction');if(reaction)reaction.textContent=OBJECT_REACTIONS[target][id]},target==='arch'&&id!=='bird'?2100:850);
 }
}
function moveActor(id,pos,ctx){
 const g=ctx.state.garden;g.characterPos[id]=pos;
 const el=document.querySelector(`[data-living-actor="${id}"]`);
 if(el){el.style.left=`${pos.x}%`;el.style.top=`${pos.y}%`}
 ctx.save();
}
function placeActor(id,pos,ctx){
 if(!ctx||ctx.state.garden.locations[id]!=='garden')return;
 actionTokens[id]=(actionTokens[id]||0)+1;
 ctx.state.garden.commands[id]={target:'placed',until:Date.now()+20000};
 moveActor(id,{x:Math.max(5,Math.min(95,pos.x)),y:Math.max(10,Math.min(90,pos.y))},ctx);
}
function dragActor(el,id,scene,ctx){
 let start=null,moved=false;
 el.addEventListener('pointerdown',e=>{
   if(e.button!==0&&e.pointerType==='mouse')return;
   start={id:e.pointerId,x:e.clientX,y:e.clientY};moved=false;el.setPointerCapture(e.pointerId);
 });
 el.addEventListener('pointermove',e=>{
   if(!start||e.pointerId!==start.id)return;
   if(!moved&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<6)return;
   moved=true;const box=scene.getBoundingClientRect();
   if(!box.width||!box.height)return;
   el.classList.add('dragging');
   el.style.left=`${Math.max(5,Math.min(95,(e.clientX-box.left)/box.width*100))}%`;
   el.style.top=`${Math.max(10,Math.min(90,(e.clientY-box.top)/box.height*100))}%`;
 });
 function end(e){
   if(!start||e.pointerId!==start.id)return;
   if(moved){
     if(e.type==='pointerup')placeActor(id,{x:parseFloat(el.style.left),y:parseFloat(el.style.top)},ctx);
     else {const old=ctx.state.garden.characterPos[id];el.style.left=`${old.x}%`;el.style.top=`${old.y}%`}
     el.dataset.dragged='true';setTimeout(()=>delete el.dataset.dragged,0);
   }
   el.classList.remove('dragging');start=null;
 }
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
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
 view.innerHTML=`<div class="living-garden garden-view"><header class="living-head"><div><p class="eyebrow">YOUR LIVING GARDEN</p><h1>Miori’s little world ✦</h1><p>${titles[part]} · ${g.growth} words grown</p></div><button id="livingPlay" class="primary-btn">${celebration?'Next word →':'Play! ✦'}</button></header><div class="living-scene ${part}" id="livingScene"><div class="living-sky"><i class="living-cloud first"></i><i class="living-cloud second"></i><i class="living-sun"></i><i class="living-moon"></i><i class="living-stars">✦　✧　✦</i></div><div class="living-hill far"></div><div class="living-hill near"></div><div class="living-shrub left"></div><div class="living-shrub right"></div><div class="living-oak"><i class="trunk"></i><i class="canopy"></i><button id="livingFruit" class="living-fruit stage-${fruitStage}" aria-label="${fruitStage===4?'Eat ripe fruit':fruitLabel}" ${fruitStage===4?'':'disabled'}>${fruitArt(fruitStage)}</button></div><button class="living-house" id="livingHouse" aria-label="Main House"><i class="roof"></i><i class="window"></i><i class="door"></i></button><div class="living-path"></div><div class="living-lawn"></div><button class="living-arch" id="livingArch" aria-label="Visit Flower Arch">${FLOWER_ARCH}</button><div class="living-patio-lights">✦　✦　✦　✦</div><div id="livingActors">${CHARACTERS.filter(id=>g.locations[id]==='garden').map(id=>{const p=g.characterPos[id]||{x:50,y:70};return `<button class="living-actor ${id}" data-living-actor="${id}" style="left:${p.x}%;top:${p.y}%" aria-label="${id} options">${id==='bird'?BIRD_ART:art?.(id)||escapeText(id)}</button>`}).join('')}</div>${note}<div id="livingReaction" class="living-reaction" aria-live="polite"></div><div class="living-scene-label">${titles[part]} · ${fruitLabel}</div></div><div id="livingActions" class="living-actions" aria-live="polite">Tap a friend or the flower arch ✦</div></div>`;
 view.querySelector('#livingPlay').addEventListener('click',play);
 view.querySelector('#livingFruit')?.addEventListener('click',e=>{
   const fruit=e.currentTarget;if(fruit.disabled||!g.fruit||g.fruit.progress<4)return;fruit.disabled=true;
   const eater=CHARACTERS.find(c=>g.locations[c]==='garden');
   if(eater)moveActor(eater,{x:31,y:eater==='bird'?37:60},ctx);
   const reaction=view.querySelector('#livingReaction');if(reaction)reaction.textContent=eater?`${eater==='bunny'?'Bunny':eater==='cat'?'Cat':'Bird'} enjoys the fruit! 🍊`:'A little snack is waiting for your friends 🍊';
   setTimeout(()=>{if(!eatFruit(g))return;ctx.save();if(document.querySelector('#gardenView.active-view'))render(ctx)},1250);
 });
 view.querySelectorAll('[data-living-actor]').forEach(el=>{dragActor(el,el.dataset.livingActor,view.querySelector('#livingScene'),ctx);el.addEventListener('click',()=>{
   if(el.dataset.dragged)return;
   const id=el.dataset.livingActor,menu=view.querySelector('#livingActions');
   menu.innerHTML=`<strong>${id==='bunny'?'Bunny':id==='cat'?'Cat':'Bird'}</strong><button data-action="arch">Visit arch</button><button data-action="main_house">Go home</button>`;
   menu.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>characterAction(id,btn.dataset.action,{...ctx})));
 });});
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
window.LivingGarden={VERSION,fresh,migrate,daypart,render,characterAction,placeActor,gentleWander,onWordComplete,eatFruit,OBJECT_REACTIONS};
setInterval(gentleWander,9500);
let lastPart=daypart();setInterval(()=>{const next=daypart();if(next!==lastPart){lastPart=next;if(document.querySelector('#gardenView.active-view .living-scene'))document.querySelector('[data-nav="garden"]')?.click()}},60000);
})();
