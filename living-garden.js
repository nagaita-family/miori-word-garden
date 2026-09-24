(()=>{
'use strict';
const VERSION=2;
const DEFAULT_ITEMS={tree:{x:18,y:90},main_house:{x:84,y:72},bench:{x:52,y:80},picnic:{x:73,y:94},mail:{x:42,y:70},birdbath:{x:82,y:91},seedcrate:{x:36,y:91},arch:{x:62,y:84},shed:{x:92,y:93}};
function fresh(){return{livingGardenVersion:VERSION,growth:0,pos:{},stored:[],bunnySeated:false,locations:{bunny:'garden',cat:'garden',bird:'garden'},characterPos:{bunny:{x:46,y:73},cat:{x:68,y:78},bird:{x:31,y:35}},commands:{},fruit:{progress:0,eaten:0},houses:{main_house:{owned:true}},garage:[],placed:[],itemPos:{},moments:{}}}
function migrate(state){
 if(state.garden?.livingGardenVersion===VERSION||state.garden?.livingGardenVersion===1){const g=state.garden;
  if(g.livingGardenVersion===1){g.placed=[];g.livingGardenVersion=VERSION} // v1's arch was a free, fixed decoration, never an earned placement.
  g.locations=g.locations||{};g.characterPos=g.characterPos||{};g.commands=g.commands||{};g.itemPos=g.itemPos||{};
  for(const id of ['bunny','cat','bird']){if(!g.locations[id])g.locations[id]='garden';if(!g.characterPos[id])g.characterPos[id]=({bunny:{x:46,y:73},cat:{x:68,y:78},bird:{x:31,y:35}})[id]}
  if(!Array.isArray(g.placed))g.placed=[];if(!Number.isFinite(g.fruit?.progress))g.fruit={progress:Math.max(0,g.growth||0),eaten:0};g.moments=g.moments||{};return state;}
 // Replace only the Garden subtree. XP, learning history, words and test state remain untouched.
 state.garden=fresh();return state;
}
function daypart(date=new Date()){
 const hour=date.getHours();return hour<6||hour>=20?'night':hour<11?'morning':hour<17?'day':'evening';
}
const CHARACTERS=['bunny','cat','bird'];
const OBJECT_REACTIONS={arch:{bunny:'Bunny hops through the flower arch! ♡',cat:'Cat strolls through the flowers ✿',bird:'Bird rests on top of the arch ♫'}};
const ITEM_REACTIONS={bench:'sit',picnic:'eat',mail:'inspect',birdbath:'drink',seedcrate:'play',arch:'walkThrough',shed:'inspect',tree:'inspect',main_house:'enter'};
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

let active=null,garageOpen=false;const actionTokens={};
function itemPosition(g,id){return g.itemPos?.[id]||DEFAULT_ITEMS[id]||{x:50,y:75}}
function itemUnlocked(id,ctx){return id==='tree'||id==='main_house'||!!ctx?.items?.find(item=>item.id===id&&ctx.state.xp>=item.xp)}
function itemPlaced(id,ctx){return itemUnlocked(id,ctx)&&(id==='tree'||id==='main_house'||ctx.state.garden.placed.includes(id))}
function placeItem(id,ctx=active){if(!ctx||!itemUnlocked(id,ctx)||itemPlaced(id,ctx)||!DEFAULT_ITEMS[id]||id==='tree'||id==='main_house')return false;ctx.state.garden.placed.push(id);ctx.state.garden.itemPos[id]??={...DEFAULT_ITEMS[id]};ctx.save();render(ctx);return true}
function storeItem(id,ctx=active){if(!ctx||!ctx.state.garden.placed.includes(id)||id==='tree'||id==='main_house')return false;ctx.state.garden.placed=ctx.state.garden.placed.filter(x=>x!==id);for(const actor of CHARACTERS)if(ctx.state.garden.commands[actor]?.target===id){actionTokens[actor]=(actionTokens[actor]||0)+1;ctx.state.garden.commands[actor]={target:'placed',until:Date.now()+5000}}ctx.save();render(ctx);return true}
function moveItem(id,pos,ctx=active){if(!ctx||!itemPlaced(id,ctx))return false;ctx.state.garden.itemPos[id]={x:Math.max(8,Math.min(92,pos.x)),y:Math.max(40,Math.min(93,pos.y))};ctx.save();return true}
function reactionKind(id,item,g){if(!CHARACTERS.includes(id)||!ITEM_REACTIONS[item])return null;if(item==='arch'&&id==='bird')return'perch';if(item==='bench'&&id==='bird')return'perch';if(item==='birdbath')return id==='bird'?'bathe':'drink';if(item==='seedcrate')return id==='cat'?'inspect':id==='bird'?'perch':'play';if(item==='picnic'&&id==='cat')return'inspect';if(item==='tree')return(g.fruit?.progress||0)>=4?'eat':'inspect';return ITEM_REACTIONS[item]}
function reactionText(id,item,kind){if(item==='arch')return OBJECT_REACTIONS.arch[id];const who={bunny:'Bunny',cat:'Cat',bird:'Bird'}[id],what={bench:'the bench',picnic:'the strawberry picnic',mail:'the heart mailbox',birdbath:'the bird bath',seedcrate:'the seed crate',shed:'the little shed',tree:'the fruit tree',main_house:'the house'}[item];return `${who} ${({sit:'settles on',perch:'perches on',eat:'enjoys',inspect:'looks at',drink:'takes a sip at',bathe:'splashes in',play:'plays by',enter:'goes into'})[kind]} ${what}!`}
function showReaction(id,item,kind,ctx){const el=document.querySelector('#livingReaction');if(!el)return;const p=itemPosition(ctx.state.garden,item);el.style.left=`${p.x}%`;el.style.top=`${Math.max(12,p.y-(item==='tree'?46:23))}%`;el.textContent=reactionText(id,item,kind)}
function openHouseDoor(duration=1100){const house=document.querySelector('#livingHouse');house?.classList.add('door-open');setTimeout(()=>house?.classList.remove('door-open'),duration)}
function actorElement(id){return document.querySelector(`[data-living-actor="${id}"]`)}
function finishMotion(id,item,token,ctx){
 if(token!==actionTokens[id])return;
 const el=actorElement(id);el?.classList.remove('reacting','arch-behind','reaction-sit','reaction-eat','reaction-inspect','reaction-drink','reaction-bathe','reaction-perch','reaction-play','reaction-walkThrough');
 document.querySelector(`[data-garden-item="${item}"]`)?.classList.remove('item-active');
 if(el&&ctx.state.garden.commands[id]?.kind==='sit')el.classList.add('pose-sit');
 ctx.state.garden.commands[id].until=Date.now()+6000;
 const message=document.querySelector('#livingReaction');
 setTimeout(()=>{if(token===actionTokens[id]&&message)message.textContent=''},2200);
}
function visibleMotion(id,item,kind,token,ctx){
 if(token!==actionTokens[id]||ctx.state.garden.locations[id]!=='garden'||!itemPlaced(item,ctx))return;
 const el=actorElement(id);el?.classList.add('reacting',`reaction-${kind}`);
 document.querySelector(`[data-garden-item="${item}"]`)?.classList.add('item-active');
 const scene=document.querySelector('#gardenView.active-view .living-scene');
 if(scene&&typeof document.createElement==='function'){
   const fx=document.createElement('div'),p=itemPosition(ctx.state.garden,item);
   fx.className=`living-effect ${kind==='bathe'||kind==='drink'?'splash':kind==='eat'||kind==='sit'?'heart':'sparkle'}`;
   fx.setAttribute('aria-hidden','true');fx.style.left=`${p.x}%`;fx.style.top=`${Math.max(15,p.y-18)}%`;
   fx.innerHTML='<i>✦</i><i>✦</i><i>✦</i>';
   scene.appendChild(fx);setTimeout(()=>fx.remove(),1450);
 }
 setTimeout(()=>{if(token!==actionTokens[id])return;showReaction(id,item,kind,ctx);finishMotion(id,item,token,ctx);
   if(item==='tree'&&kind==='eat'&&eatFruit(ctx.state.garden)){ctx.save();if(document.querySelector('#gardenView.active-view'))render(ctx)}
 },1150);
}
function dropCharacter(id,item,ctx=active){
 if(!ctx||!CHARACTERS.includes(id)||id==='cat'&&ctx.state.xp<360||ctx.state.garden.locations[id]!=='garden'||!itemPlaced(item,ctx))return false;
 const g=ctx.state.garden,p=itemPosition(g,item),kind=reactionKind(id,item,g),token=actionTokens[id]=(actionTokens[id]||0)+1;
 g.commands[id]={target:item,kind,until:Date.now()+8000};
 const stillHere=()=>token===actionTokens[id]&&g.locations[id]==='garden'&&itemPlaced(item,ctx);
 actorElement(id)?.classList.remove('pose-sit','arch-behind','reacting','reaction-sit','reaction-eat','reaction-inspect','reaction-drink','reaction-bathe','reaction-perch','reaction-play','reaction-walkThrough');
 if(item==='arch'&&kind==='walkThrough'){
   moveActor(id,{x:p.x,y:Math.min(89,p.y+5)},ctx); // near side of the trellis
   setTimeout(()=>{if(!stillHere())return;actorElement(id)?.classList.add('arch-behind');moveActor(id,{x:p.x,y:p.y-9},ctx)},650);
   setTimeout(()=>{if(stillHere())moveActor(id,{x:p.x+2,y:p.y-20},ctx)},1300);
   setTimeout(()=>{if(!stillHere())return;actorElement(id)?.classList.remove('arch-behind');visibleMotion(id,item,kind,token,ctx)},1920);
 }else if(item==='main_house'){
   moveActor(id,{x:p.x+3,y:p.y+4},ctx);
   setTimeout(()=>{if(!stillHere())return;openHouseDoor();const el=actorElement(id);el?.classList.add('house-entering');moveActor(id,{x:p.x+3,y:p.y-9},ctx)},580);
   setTimeout(()=>{if(stillHere())actorElement(id)?.classList.add('house-behind')},1120);
   setTimeout(()=>{if(!stillHere())return;g.locations[id]='main_house';ctx.save();if(document.querySelector('#gardenView.active-view')){render(ctx);showReaction(id,item,kind,ctx);const actions=document.querySelector('#livingActions');if(actions){actions.innerHTML=`${id[0].toUpperCase()+id.slice(1)} is inside <button data-out="${id}">Come outside</button>`;actions.querySelector('[data-out]')?.addEventListener('click',()=>characterAction(id,'garden',ctx))}}},1530);
 }else{
   const pos=item==='tree'?{x:p.x+9,y:id==='bird'?p.y-37:p.y-14}:item==='arch'?{x:p.x,y:p.y-19}:{x:p.x,y:p.y-(kind==='perch'?13:7)};
   moveActor(id,pos,ctx);
   setTimeout(()=>{if(stillHere())visibleMotion(id,item,kind,token,ctx)},650);
 }
 return true;
}
function characterAction(id,target,ctx=active){
 if(!ctx||!CHARACTERS.includes(id))return false;
 if(target!=='garden')return dropCharacter(id,target,ctx);
 const g=ctx.state.garden;if(g.locations[id]!=='main_house')return false;
 const token=actionTokens[id]=(actionTokens[id]||0)+1,p=itemPosition(g,'main_house');
 g.commands[id]={target:'garden',kind:'exit',until:Date.now()+4000};
 if(!document.querySelector('#gardenView.active-view #livingHouse')){g.locations[id]='garden';moveActor(id,{x:p.x+3,y:p.y+4},ctx);if(document.querySelector('#gardenView.active-view'))render(ctx);return true}
 openHouseDoor(1450);
 setTimeout(()=>{
   if(token!==actionTokens[id]||g.locations[id]!=='main_house')return;
   g.locations[id]='garden';g.characterPos[id]={x:p.x+3,y:p.y-9};ctx.save();render(ctx);
   openHouseDoor(1200);const el=actorElement(id);el?.classList.add('house-emerging');
   setTimeout(()=>{if(token!==actionTokens[id]||g.locations[id]!=='garden')return;el?.classList.remove('house-emerging');moveActor(id,{x:p.x-4,y:p.y+6},ctx);const message=document.querySelector('#livingActions');if(message)message.textContent=`${id[0].toUpperCase()+id.slice(1)} came outside! ✦`},80);
 },350);
 return true;
}
function everyoneOutside(ctx=active){if(!ctx)return false;const inside=CHARACTERS.filter(id=>ctx.state.garden.locations[id]==='main_house'&&(id!=='cat'||ctx.state.xp>=360));inside.forEach((id,index)=>setTimeout(()=>characterAction(id,'garden',ctx),index*1400));return inside.length>0}
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
function itemAt(scene,x,y){let found=null,best=Infinity;for(const el of scene.querySelectorAll('[data-garden-item]')){const r=el.getBoundingClientRect(),gap=12;if(x<r.left-gap||x>r.right+gap||y<r.top-gap||y>r.bottom+gap)continue;const d=Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2));if(d<best){best=d;found=el}}return found}
function dragActor(el,id,scene,ctx){
 let start=null,moved=false;
 el.addEventListener('pointerdown',e=>{
   if(e.button!==0&&e.pointerType==='mouse')return;
   start={id:e.pointerId,x:e.clientX,y:e.clientY};moved=false;actionTokens[id]=(actionTokens[id]||0)+1;ctx.state.garden.commands[id]={target:'dragging',until:Date.now()+20000};el.classList.remove('pose-sit','reacting','arch-behind','house-entering','house-behind','house-emerging','reaction-sit','reaction-eat','reaction-inspect','reaction-drink','reaction-bathe','reaction-perch','reaction-play','reaction-walkThrough');el.setPointerCapture(e.pointerId);
 });
 el.addEventListener('pointermove',e=>{
   if(!start||e.pointerId!==start.id)return;
   if(!moved&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<6)return;
   moved=true;const box=scene.getBoundingClientRect();
   if(!box.width||!box.height)return;
   el.classList.add('dragging');
   el.style.left=`${Math.max(5,Math.min(95,(e.clientX-box.left)/box.width*100))}%`;
   el.style.top=`${Math.max(10,Math.min(90,(e.clientY-box.top)/box.height*100))}%`;
   scene.querySelectorAll('.drop-target').forEach(item=>item.classList.remove('drop-target'));
   itemAt(scene,e.clientX,e.clientY)?.classList.add('drop-target');
 });
 function end(e){
   if(!start||e.pointerId!==start.id)return;
   scene.querySelectorAll('.drop-target').forEach(item=>item.classList.remove('drop-target'));
   if(moved){
     if(e.type==='pointerup'){const hit=itemAt(scene,e.clientX,e.clientY);if(!hit||!dropCharacter(id,hit.dataset.gardenItem,ctx))placeActor(id,{x:parseFloat(el.style.left),y:parseFloat(el.style.top)},ctx)}
     else {const old=ctx.state.garden.characterPos[id];el.style.left=`${old.x}%`;el.style.top=`${old.y}%`}
     el.dataset.dragged='true';setTimeout(()=>delete el.dataset.dragged,0);
   }
   el.classList.remove('dragging');start=null;
 }
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}
function dragItem(el,id,scene,ctx){let start=null,moved=false;
 el.addEventListener('pointerdown',e=>{if(e.target.closest('#livingFruit')||e.button!==0&&e.pointerType==='mouse')return;const r=scene.getBoundingClientRect();start={id:e.pointerId,x:e.clientX,y:e.clientY,dx:r.width*parseFloat(el.style.left)/100+r.left-e.clientX,dy:r.height*parseFloat(el.style.top)/100+r.top-e.clientY};moved=false;el.setPointerCapture(e.pointerId)});
 el.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id)return;if(!moved&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<6)return;moved=true;const r=scene.getBoundingClientRect();el.classList.add('dragging');el.style.left=`${Math.max(8,Math.min(92,(e.clientX+start.dx-r.left)/r.width*100))}%`;el.style.top=`${Math.max(40,Math.min(93,(e.clientY+start.dy-r.top)/r.height*100))}%`});
 const end=e=>{if(!start||e.pointerId!==start.id)return;if(moved){if(e.type==='pointerup')moveItem(id,{x:parseFloat(el.style.left),y:parseFloat(el.style.top)},ctx);else{const p=itemPosition(ctx.state.garden,id);el.style.left=`${p.x}%`;el.style.top=`${p.y}%`}el.dataset.dragged='true';setTimeout(()=>delete el.dataset.dragged,0)}el.classList.remove('dragging');start=null};
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}
function gentleWander(){
 const ctx=active,scene=document.querySelector('#gardenView.active-view .living-scene');if(!ctx||!scene)return;
 const g=ctx.state.garden;for(const id of CHARACTERS){
   if(g.locations[id]!=='garden'||id==='cat'&&ctx.state.xp<360||g.commands[id]?.until>Date.now())continue;
   if(Math.random()<.48)continue; // Characters often rest instead of always moving.
   const old=g.characterPos[id]||{x:50,y:72};
   document.querySelector(`[data-living-actor="${id}"]`)?.classList.remove('pose-sit');
   moveActor(id,{x:Math.max(22,Math.min(83,old.x+(Math.random()-.5)*10)),y:Math.max(id==='bird'?34:53,Math.min(id==='bird'?71:84,old.y+(Math.random()-.5)*8))},ctx);
 }
}
function itemHtml(id,ctx,fruitStage,fruitLabel){
 const p=itemPosition(ctx.state.garden,id),style=`left:${p.x}%;top:${p.y}%`;
 if(id==='tree')return `<div class="living-oak living-item" data-garden-item="tree" style="${style}" aria-label="Fruit tree"><i class="trunk"></i><i class="canopy"></i><button id="livingFruit" class="living-fruit stage-${fruitStage}" aria-label="${fruitStage===4?'Eat ripe fruit':fruitLabel}" ${fruitStage===4?'':'disabled'}>${fruitArt(fruitStage)}</button></div>`;
 if(id==='main_house'){const inside=CHARACTERS.filter(c=>ctx.state.garden.locations[c]==='main_house'&&(c!=='cat'||ctx.state.xp>=360));return `<button class="living-house living-item" id="livingHouse" data-garden-item="main_house" style="${style}" aria-label="Main House, ${inside.length} inside"><i class="roof"></i><i class="window"></i><i class="door"></i>${inside.length?`<span class="house-friends" aria-hidden="true">${inside.map(c=>`<span class="house-face">${c==='bird'?BIRD_ART:ctx.art?.(c)||escapeText(c)}</span>`).join('')}</span>`:''}</button>`}
 if(id==='arch')return `<button class="living-arch living-item" id="livingArch" data-garden-item="arch" style="${style}" aria-label="Flower Arch">${FLOWER_ARCH}</button>`;
 const label=ctx.items?.find(item=>item.id===id)?.label||id;
 return `<button class="living-item living-prop ${id}" data-garden-item="${id}" style="${style}" aria-label="${escapeText(label)}">${ctx.art?.(id)||escapeText(label)}</button>`;
}
function render(ctx){
 active=ctx;const {state,celebration,play,art}=ctx;
 const part=daypart(),g=state.garden,view=document.querySelector('#gardenView');
 const titles={morning:'A gentle morning',day:'A sunny afternoon',evening:'A glowing evening',night:'A peaceful night'};
 const note=celebration?`<div class="living-moment">🌱 ${escapeText(celebration.word)} helped your garden grow!${celebration.moment?`<small>${escapeText(celebration.moment)}</small>`:''}</div>`:'';
 const fruitStage=Math.min(4,g.fruit?.progress||0),fruitLabel=['Resting branch','Flower','Tiny fruit','Growing fruit','Ripe fruit'][fruitStage];
 const available=(ctx.items||[]).filter(item=>state.xp>=item.xp);
 const onGround=['tree','main_house',...available.filter(item=>itemPlaced(item.id,ctx)).map(item=>item.id)];
 const inventory=available.length?available.map(item=>{const placed=itemPlaced(item.id,ctx);return `<div class="living-shelf-card"><span class="living-shelf-art">${art?.(item.id)||''}</span><span class="living-shelf-name">${escapeText(item.label)}<small>${placed?'In Garden':'In Garage'}</small></span><button data-${placed?'store':'place'}="${item.id}">${placed?'Put away':'Place'}</button></div>`}).join(''):'<p>Nothing here yet. Grow three words for your first Garden treasure ✦</p>';
 const garage=`<button id="livingGarage" class="living-garage${garageOpen?' open':''}" aria-label="Open Garden Garage" aria-expanded="${garageOpen}" aria-controls="livingGaragePanel"><i class="garage-roof"></i><i class="garage-wall"></i><i class="garage-door"></i><span>Garage · ${available.filter(item=>!itemPlaced(item.id,ctx)).length}</span></button>`;
 const panel=garageOpen?`<section id="livingGaragePanel" class="living-garage-panel" aria-label="Garden Garage contents"><header><strong>Garden Garage · ${available.length} owned</strong><button id="livingGarageClose" aria-label="Close Garage">×</button></header><div class="living-garage-list">${inventory}</div></section>`:'';
 view.innerHTML=`<div class="living-garden garden-view"><header class="living-head"><div><p class="eyebrow">YOUR LIVING GARDEN</p><h1>Miori’s little world ✦</h1><p>${titles[part]} · ${g.growth} words grown</p></div><button id="livingPlay" class="primary-btn">${celebration?'Next word →':'Play! ✦'}</button></header><div class="living-scene ${part}" id="livingScene"><div class="living-sky"><i class="living-cloud first"></i><i class="living-cloud second"></i><i class="living-sun"></i><i class="living-moon"></i><i class="living-stars">✦　✧　✦</i></div><div class="living-hill far"></div><div class="living-hill near"></div><div class="living-shrub left"></div><div class="living-shrub right"></div><div class="living-path"></div><div class="living-lawn"></div>${onGround.map(id=>itemHtml(id,ctx,fruitStage,fruitLabel)).join('')}${garage}<div class="living-patio-lights">✦　✦　✦　✦</div><div id="livingActors">${CHARACTERS.filter(id=>g.locations[id]==='garden'&&(id!=='cat'||state.xp>=360)).map(id=>{const p=g.characterPos[id]||{x:50,y:70};return `<button class="living-actor ${id}${g.commands[id]?.kind==='sit'&&g.commands[id].until>Date.now()?' pose-sit':''}" data-living-actor="${id}" style="left:${p.x}%;top:${p.y}%" aria-label="${id} options">${id==='bird'?BIRD_ART:art?.(id)||escapeText(id)}</button>`}).join('')}</div>${note}<div id="livingReaction" class="living-reaction" aria-live="polite"></div><div class="living-scene-label">${titles[part]} · ${fruitLabel}</div>${panel}</div><div id="livingActions" class="living-actions" aria-live="polite">Drag a friend onto something ✦</div></div>`;
 view.querySelector('#livingPlay').addEventListener('click',()=>{garageOpen=false;play()});
 view.querySelector('#livingGarage').addEventListener('click',()=>{garageOpen=!garageOpen;render(ctx);if(garageOpen)view.querySelector('#livingGarageClose')?.focus?.()});
 view.querySelector('#livingGarageClose')?.addEventListener('click',()=>{garageOpen=false;render(ctx);view.querySelector('#livingGarage')?.focus?.()});
 view.querySelector('#livingFruit').addEventListener('click',e=>{if(e.currentTarget.disabled)return;const eater=CHARACTERS.find(id=>g.locations[id]==='garden'&&(id!=='cat'||state.xp>=360));if(eater)dropCharacter(eater,'tree',ctx)});
 const scene=view.querySelector('#livingScene');
 view.querySelectorAll('[data-garden-item]').forEach(el=>{
   const id=el.dataset.gardenItem;dragItem(el,id,scene,ctx);
   el.addEventListener('click',()=>{if(el.dataset.dragged)return;
     const menu=view.querySelector('#livingActions');
     if(id==='main_house'){
       const inside=CHARACTERS.filter(c=>g.locations[c]==='main_house'&&(c!=='cat'||state.xp>=360));
       menu.innerHTML=`<strong>Main House · ${inside.length} inside</strong>${inside.map(c=>`<button data-out="${c}">${c==='bunny'?'Bunny':c==='cat'?'Cat':'Bird'} come outside</button>`).join('')||'<span>Drag a friend to the door</span>'}${inside.length>1?'<button data-out-all="true">Everyone come outside</button>':''}`;
       menu.querySelectorAll('[data-out]').forEach(btn=>btn.addEventListener('click',()=>characterAction(btn.dataset.out,'garden',ctx)));
       menu.querySelector('[data-out-all]')?.addEventListener('click',()=>everyoneOutside(ctx));
     }else if(id!=='tree'){
       menu.innerHTML=`<span>Drag a friend onto ${escapeText(ctx.items?.find(item=>item.id===id)?.label||id)} ✦</span> <button data-store="${id}">Put in Garage</button>`;
       menu.querySelector('[data-store]')?.addEventListener('click',()=>storeItem(id,ctx));
     }else menu.textContent='Drag a friend onto the fruit tree ✦';
   });
 });
 view.querySelectorAll('[data-living-actor]').forEach(el=>{dragActor(el,el.dataset.livingActor,scene,ctx);el.addEventListener('click',()=>{if(el.dataset.dragged)return;view.querySelector('#livingActions').textContent=`Drag ${el.dataset.livingActor==='bird'?'Bird':el.dataset.livingActor==='cat'?'Cat':'Bunny'} onto a Garden item ✦`})});
 view.querySelectorAll('[data-place]').forEach(el=>el.addEventListener('click',()=>placeItem(el.dataset.place,ctx)));
 view.querySelectorAll('[data-store]').forEach(el=>el.addEventListener('click',()=>storeItem(el.dataset.store,ctx)));
}
function escapeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.LivingGarden={VERSION,fresh,migrate,daypart,render,characterAction,everyoneOutside,placeActor,placeItem,storeItem,moveItem,itemPlaced,dropCharacter,reactionKind,gentleWander,onWordComplete,eatFruit,OBJECT_REACTIONS};
setInterval(gentleWander,9500);
let lastPart=daypart();setInterval(()=>{const next=daypart();if(next!==lastPart){lastPart=next;if(document.querySelector('#gardenView.active-view .living-scene'))document.querySelector('[data-nav="garden"]')?.click()}},60000);
})();
