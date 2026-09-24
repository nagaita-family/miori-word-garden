'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8'),css=fs.readFileSync('living-garden.css','utf8');
function fixture(){
 const timers=[],actors={},buttons={};
 function element(){const values=new Set();return{style:{},classList:{add:(...xs)=>xs.forEach(x=>values.add(x)),remove:(...xs)=>xs.forEach(x=>values.delete(x)),contains:x=>values.has(x)},addEventListener(){},focus(){},querySelector(){return{addEventListener(){}}},querySelectorAll(){return[]}}}
 for(const id of ['bunny','cat','bird'])actors[id]=element();
 const house=element(),actions=element(),view={innerHTML:'',querySelector(sel){return buttons[sel]??=element()},querySelectorAll(){return[]}};
 const document={querySelector(sel){if(sel==='#gardenView'||sel==='#gardenView.active-view')return view;if(sel==='#gardenView.active-view #livingHouse'||sel==='#livingHouse')return house;if(sel==='#livingActions')return actions;if(sel.startsWith('[data-living-actor='))return actors[sel.match(/"(.*?)"/)[1]];return null}};
 const sandbox={window:{},document,Date,Math,setInterval(){},setTimeout:(fn,ms)=>{timers.push({fn,ms})}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const api=sandbox.window.LivingGarden,state={xp:720,garden:api.fresh(),learning:{words:['gentle']}},ctx={state,save(){},play(){},items:[],art:id=>`<svg data-id="${id}"></svg>`};
 const run=ms=>{const index=timers.findIndex(timer=>timer.ms===ms);assert(index>=0,`no pending timer at ${ms}ms`);timers.splice(index,1)[0].fn()};
 return{api,state,ctx,actors,house,actions,view,run,timers};
}
test('Drop opens the door, shrinks into House, saves location and shows the resident face',()=>{
 const f=fixture();f.api.render(f.ctx);assert(f.view.innerHTML.includes('Main House, 0 inside'));
 assert(f.api.dropCharacter('bunny','main_house',f.ctx));assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),{x:87,y:76});
 f.run(580);assert(f.house.classList.contains('door-open'));assert(f.actors.bunny.classList.contains('house-entering'));
 assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),{x:87,y:63});
 f.run(1120);assert(f.actors.bunny.classList.contains('house-behind'));
 f.run(1530);assert.equal(f.state.garden.locations.bunny,'main_house');assert(f.view.innerHTML.includes('Main House, 1 inside'));
 assert(f.view.innerHTML.includes('class="house-friends"'));assert(!f.view.innerHTML.includes('data-living-actor="bunny"'));
 assert(!f.api.dropCharacter('bunny','tree',f.ctx));
 const reloaded=JSON.parse(JSON.stringify(f.state));f.api.migrate(reloaded);assert.equal(reloaded.garden.locations.bunny,'main_house');assert.deepEqual(reloaded.learning,{words:['gentle']});
});
test('Selected return visibly emerges through the door and everyone can return one by one',()=>{
 const f=fixture();f.state.garden.locations={bunny:'main_house',cat:'main_house',bird:'main_house'};f.api.render(f.ctx);
 assert(f.view.innerHTML.includes('Main House, 3 inside'));
 assert(f.api.characterAction('bunny','garden',f.ctx));assert(f.house.classList.contains('door-open'));
 f.run(350);assert.equal(f.state.garden.locations.bunny,'garden');assert(f.actors.bunny.classList.contains('house-emerging'));
 f.run(80);assert(!f.actors.bunny.classList.contains('house-emerging'));assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.characterPos.bunny)),{x:80,y:78});
 assert(f.api.everyoneOutside(f.ctx));f.run(0);f.run(350);f.run(80);f.run(1400);f.run(350);f.run(80);
 assert.equal(f.state.garden.locations.cat,'garden');assert.equal(f.state.garden.locations.bird,'garden');
 assert(f.view.innerHTML.includes('Main House, 0 inside'));assert.equal(f.api.everyoneOutside(f.ctx),false);
});
test('Entry animation and occupancy faces retain stable item scale and reduced motion',()=>{
 assert.match(css,/\.living-house\.door-open \.door\{/);
 assert.match(css,/\.living-actor\.house-entering\{z-index:9/);
 assert.match(css,/\.living-house \.house-friends\{/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.living-house \.door/);
 assert(fs.readFileSync('index.html','utf8').includes('living-garden.js?v=20260925-drag'));
});
