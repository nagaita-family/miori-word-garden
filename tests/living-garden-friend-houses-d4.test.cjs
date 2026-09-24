'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8');
function fixture(){const timers=[],elements={};
 function element(){const classes=new Set();return{style:{},classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)},addEventListener(){},focus(){},querySelector(){return element()},querySelectorAll(){return[]}}}
 const view={innerHTML:'',querySelector(sel){return elements[sel]??=element()},querySelectorAll(){return[]}};
 const document={querySelector(sel){if(sel==='#gardenView'||sel==='#gardenView.active-view')return view;if(sel.startsWith('[data-living-actor='))return elements[sel]??=element();if(sel==='#livingHouse'||sel.includes('#livingHouse'))return elements.main??=element();if(sel.includes('data-garden-item="cat_house"'))return elements.cat??=element();if(sel.includes('data-garden-item="bird_house"'))return elements.bird??=element();return null}};
 const sandbox={window:{},document,Date,Math,setInterval(){},setTimeout:(fn,ms)=>timers.push({fn,ms})};vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const api=sandbox.window.LivingGarden,state={xp:0,garden:api.fresh(),learning:{words:['gentle']}},ctx={state,save(){},play(){},items:[],art:id=>`<svg data-id="${id}"></svg>`};
 function run(ms){const i=timers.findIndex(t=>t.ms===ms);assert(i>=0,`missing timer ${ms}`);timers.splice(i,1)[0].fn()}
 return{api,state,ctx,view,elements,run};
}
test('Bird cottage starts visible and movable; Cat cottage appears only after Cat unlock',()=>{
 const f=fixture();f.api.render(f.ctx);assert.match(f.view.innerHTML,/Bird Nest House, 0 inside/);assert.doesNotMatch(f.view.innerHTML,/Cat Cottage/);
 assert.equal(f.api.itemPlaced('cat_house',f.ctx),false);assert.equal(f.api.moveItem('cat_house',{x:70,y:70},f.ctx),false);
 assert(f.api.moveItem('bird_house',{x:56,y:65},f.ctx));assert.deepEqual(JSON.parse(JSON.stringify(f.state.garden.itemPos.bird_house)),{x:56,y:65});
 assert.equal(f.api.storeItem('bird_house',f.ctx),false);f.state.xp=360;f.api.render(f.ctx);assert.match(f.view.innerHTML,/Cat Cottage, 0 inside/);
 assert(f.api.moveItem('cat_house',{x:71,y:67},f.ctx));assert.equal(f.api.storeItem('cat_house',f.ctx),false);
 const restored=JSON.parse(JSON.stringify(f.state));f.api.migrate(restored);assert.deepEqual(restored.garden.itemPos.bird_house,{x:56,y:65});assert.deepEqual(restored.learning,{words:['gentle']});
});
test('Drop into a friend cottage saves its own location; door exit returns to Garden',()=>{
 const f=fixture();f.api.render(f.ctx);assert(f.api.dropCharacter('bird','bird_house',f.ctx));f.run(580);assert(f.elements.bird.classList.contains('door-open'));f.run(1120);f.run(1530);
 assert.equal(f.state.garden.locations.bird,'bird_house');assert.match(f.view.innerHTML,/Bird Nest House, 1 inside/);assert.doesNotMatch(f.view.innerHTML,/data-living-actor="bird"/);
 assert.equal(f.api.dropCharacter('bird','tree',f.ctx),false);assert(f.api.characterAction('bird','garden',f.ctx));assert(f.elements.bird.classList.contains('door-open'));
 f.run(350);f.run(80);assert.equal(f.state.garden.locations.bird,'garden');assert.match(f.view.innerHTML,/Bird Nest House, 0 inside/);
});
test('Cat cottage occupants and group exit stay separate from Main House room',()=>{
 const f=fixture();f.state.xp=360;f.state.garden.locations={bunny:'cat_house',cat:'cat_house',bird:'main_house'};f.api.render(f.ctx);
 assert.match(f.view.innerHTML,/Cat Cottage, 2 inside/);assert.match(f.view.innerHTML,/Main House, 1 inside/);
 assert(f.api.lookInside(f.ctx));assert.match(f.view.innerHTML,/data-room-out="bird"/);assert.doesNotMatch(f.view.innerHTML,/data-room-out="bunny"|data-room-out="cat"/);f.api.closeInterior(f.ctx);
 assert(f.api.everyoneOutside(f.ctx,'cat_house'));f.run(0);f.run(350);f.run(80);f.run(1400);f.run(350);f.run(80);
 assert.equal(f.state.garden.locations.bunny,'garden');assert.equal(f.state.garden.locations.cat,'garden');assert.equal(f.state.garden.locations.bird,'main_house');assert.equal(f.api.everyoneOutside(f.ctx,'cat_house'),false);
});
test('Friend cottages use distinctive small art and preserve reduced-motion doors',()=>{
 const css=fs.readFileSync('living-garden.css','utf8');assert.match(css,/\.friend-house\.cat_house\{/);assert.match(css,/\.friend-house\.bird_house\{/);assert.match(css,/\.living-house\.door-open \.door\{/);
});
