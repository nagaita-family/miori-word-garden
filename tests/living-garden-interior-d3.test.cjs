'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8');
function fixture(){
 const timers=[],elements={};
 function element(){const classes=new Set();return{style:{},classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)},addEventListener(){},focus(){},querySelector(){return element()},querySelectorAll(){return[]}}}
 const view={innerHTML:'',querySelector(sel){return elements[sel]??=element()},querySelectorAll(){return[]}};
 const document={querySelector(sel){if(sel==='#gardenView'||sel==='#gardenView.active-view')return view;if(sel==='#livingHouse'||sel==='#gardenView.active-view #livingHouse')return elements.house??=element();if(sel==='#livingRoomClose')return elements.close??=element();if(sel.startsWith('[data-living-actor='))return elements[sel]??=element();return null}};
 const sandbox={window:{},document,Date,Math,setInterval(){},setTimeout:(fn,ms)=>timers.push({fn,ms})};vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const api=sandbox.window.LivingGarden,state={xp:0,garden:api.fresh(),learning:{words:['gentle']}},ctx={state,save(){},play(){},items:[],art:id=>`<svg data-id="${id}"></svg>`};
 function run(ms){const index=timers.findIndex(timer=>timer.ms===ms);assert(index>=0,`missing ${ms}ms timer`);timers.splice(index,1)[0].fn()}
 return{api,state,ctx,view,elements,run};
}
test('Look Inside reflects only residents, including after saved state reload; Cat stays locked',()=>{
 const f=fixture();f.state.garden.locations.bunny='main_house';f.state.garden.locations.cat='main_house';
 assert(f.api.lookInside(f.ctx));assert.match(f.view.innerHTML,/aria-label="Inside Main House"/);
 assert.match(f.view.innerHTML,/data-room-out="bunny"/);assert.doesNotMatch(f.view.innerHTML,/data-room-out="bird"|data-room-out="cat"/);
 assert.match(f.view.innerHTML,/living-room-sofa/);assert.match(f.view.innerHTML,/living-room-window/);
 const stored=JSON.parse(JSON.stringify(f.state));f.api.migrate(stored);assert.equal(stored.garden.locations.bunny,'main_house');assert.deepEqual(stored.learning,{words:['gentle']});
 assert(f.api.closeInterior(f.ctx));assert.doesNotMatch(f.view.innerHTML,/aria-label="Inside Main House"/);
 f.state.xp=360;assert(f.api.lookInside(f.ctx));assert.match(f.view.innerHTML,/data-room-out="cat"/);
});
test('Come outside closes room, then uses the existing visible House door exit',()=>{
 const f=fixture();f.state.garden.locations.bunny='main_house';f.api.lookInside(f.ctx);
 assert.equal(f.api.comeOutsideFromInterior('bird',f.ctx),false);
 assert(f.api.comeOutsideFromInterior('bunny',f.ctx));assert.doesNotMatch(f.view.innerHTML,/aria-label="Inside Main House"/);
 assert(f.elements.house.classList.contains('door-open'));assert.equal(f.state.garden.locations.bunny,'main_house');
 f.run(350);assert.equal(f.state.garden.locations.bunny,'garden');assert(f.view.innerHTML.includes('data-living-actor="bunny"'));
 f.run(80);assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),{x:80,y:78});
 assert.equal(f.api.comeOutsideFromInterior('bunny',f.ctx),false);
});
test('Room positions persist independently of Garden positions and remain bounded',()=>{
 const f=fixture(),outside=JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny));
 f.state.garden.locations.bunny='main_house';f.api.lookInside(f.ctx);
 assert(f.api.placeRoomActor('bunny',{x:80,y:56},f.ctx));assert.match(f.view.innerHTML,/data-room-actor="bunny"/);
 f.api.closeInterior(f.ctx);f.api.lookInside(f.ctx);assert.match(f.view.innerHTML,/style="left:80%;top:56%"/);
 assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),outside);
 assert.equal(f.api.placeRoomActor('bird',{x:40,y:50},f.ctx),false);
 assert(f.api.placeRoomActor('bunny',{x:999,y:-100},f.ctx));assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.roomPos.bunny)),{x:88,y:35});
 const reloaded=JSON.parse(JSON.stringify(f.state));f.api.migrate(reloaded);assert.deepEqual(reloaded.garden.roomPos.bunny,{x:88,y:35});
});
test('Existing character art breathes indoors and respects reduced motion',()=>{
 const css=fs.readFileSync('living-garden.css','utf8');assert.match(css,/\.living-room-character svg\{/);
 assert.match(css,/@keyframes livingRoomBreathe/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.living-room-character\{animation:none\}\}/);
 assert(fs.readFileSync('index.html','utf8').includes('living-garden.js?v=20260925-drag'));
});
