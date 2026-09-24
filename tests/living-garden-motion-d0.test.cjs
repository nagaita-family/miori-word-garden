'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8'),css=fs.readFileSync('living-garden.css','utf8');
function fixture(){
 const timers=[],actors={},items={},message={style:{},textContent:''};
 function element(){const classes=new Set();return{style:{},classList:{add:(...x)=>x.forEach(v=>classes.add(v)),remove:(...x)=>x.forEach(v=>classes.delete(v)),contains:x=>classes.has(x)}}}
 for(const id of ['bunny','cat','bird'])actors[id]=element();
 for(const id of ['bench','arch','birdbath','tree'])items[id]=element();
 const document={querySelector(sel){if(sel==='#livingReaction')return message;if(sel.startsWith('[data-living-actor='))return actors[sel.match(/"(.*?)"/)[1]];if(sel.startsWith('[data-garden-item='))return items[sel.match(/"(.*?)"/)[1]];return null}};
 const sandbox={window:{},document,Date,Math,setTimeout:(fn,ms)=>{timers.push({fn,ms})},setInterval(){}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const api=sandbox.window.LivingGarden,state={xp:720,garden:api.fresh()},ctx={state,items:[{id:'bench',xp:90},{id:'arch',xp:630},{id:'birdbath',xp:450}],save(){}};
 state.garden.placed=['bench','arch','birdbath'];
 return{api,state,ctx,timers,actors,items,message};
}
test('Every resident visibly reacts to an item, then returns to idle without losing location',()=>{
 for(const [id,item,kind] of [['bunny','bench','sit'],['cat','bench','sit'],['bird','birdbath','bathe']]){
  const f=fixture();assert(f.api.dropCharacter(id,item,f.ctx));
  assert.equal(f.state.garden.commands[id].kind,kind);
  f.timers.shift().fn();assert(f.actors[id].classList.contains('reacting'));assert(f.actors[id].classList.contains(`reaction-${kind}`));
  assert(f.items[item].classList.contains('item-active'));
  f.timers.shift().fn();assert(!f.actors[id].classList.contains('reacting'));assert(!f.items[item].classList.contains('item-active'));
  assert.equal(f.state.garden.locations[id],'garden');assert(f.message.textContent.includes(id[0].toUpperCase()+id.slice(1)));
  if(kind==='sit')assert(f.actors[id].classList.contains('pose-sit'));
 }
});
test('Arch passage travels near, through, behind and past the movable arch',()=>{
 const f=fixture();assert(f.api.dropCharacter('bunny','arch',f.ctx));
 assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),{x:62,y:89});
 f.timers.shift().fn();assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),{x:62,y:75});assert(f.actors.bunny.classList.contains('arch-behind'));
 f.timers.shift().fn();assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),{x:64,y:64});
 f.timers.shift().fn();assert(!f.actors.bunny.classList.contains('arch-behind'));assert(f.actors.bunny.classList.contains('reaction-walkThrough'));
 f.timers.shift().fn();assert(!f.actors.bunny.classList.contains('reacting'));assert.equal(f.state.garden.locations.bunny,'garden');
 assert.equal(f.api.itemPlaced('arch',f.ctx),true);assert.match(css,/\.living-actor\.arch-behind\{z-index:6;transform:translate\(-50%,-50%\) scale\(\.7\)/);
});
test('User grab cancels pending reaction; existing artwork animates inside a stable hit area',()=>{
 const f=fixture();f.api.dropCharacter('cat','bench',f.ctx);f.api.placeActor('cat',{x:34,y:75},f.ctx);
 for(const timer of f.timers.splice(0))timer.fn();
 assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.cat)),{x:34,y:75});assert(!f.actors.cat.classList.contains('reacting'));
 assert.match(css,/\.living-actor svg\{transform-origin:50% 80%;animation:livingBreathe/);
 assert.match(css,/\.living-actor\.dragging svg,\.living-actor\.reacting svg\{animation:none\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.living-actor/);
 assert.equal(f.state.garden.locations.cat,'garden');
});
