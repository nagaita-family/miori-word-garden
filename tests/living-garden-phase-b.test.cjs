'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const timers=[],actors={};const document={querySelector(sel){if(sel.startsWith('[data-living-actor='))return actors[sel.match(/"(.*?)"/)[1]]||null;return null}};
 const ctx={window:{},document,Date,Math,setTimeout:f=>{timers.push(f)},setInterval(){}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('living-garden.js','utf8'),ctx);
 const api=ctx.window.LivingGarden,state={xp:720,garden:api.fresh()},saved=[];state.garden.placed=['arch'];
 const callbacks={state,items:[{id:'arch',xp:630,label:'Flower arch'},{id:'bench',xp:90,label:'Cozy garden bench'},{id:'birdbath',xp:450,label:'Bird bath'}],save:()=>saved.push(JSON.stringify(state.garden))};
 return{api,state,timers,actors,callbacks,saved};
}
test('Phase A state adds B residents once without resetting growth or a custom location',()=>{
 const {api,state}=setup();state.garden.growth=8;delete state.garden.locations.cat;state.garden.locations.bunny='main_house';api.migrate(state);
 assert.equal(state.garden.growth,8);assert.equal(state.garden.locations.bunny,'main_house');assert.equal(state.garden.locations.cat,'garden');
 api.migrate(state);assert.equal(state.garden.growth,8);
});
test('Explicit house trip persists and house residents cannot use the Garden arch',()=>{
 const {api,state,timers,callbacks,saved}=setup();api.characterAction('bunny','main_house',callbacks);
 assert.equal(state.garden.commands.bunny.target,'main_house');assert.equal(state.garden.characterPos.bunny.x,87);
 timers.shift()();assert.equal(state.garden.locations.bunny,'garden');
 timers.shift()();assert.equal(state.garden.locations.bunny,'garden');
 timers.shift()();assert.equal(state.garden.locations.bunny,'main_house');
 const before=timers.length;api.characterAction('bunny','arch',callbacks);assert.equal(timers.length,before);
 assert(saved.at(-1).includes('main_house'));
 api.characterAction('bunny','garden',callbacks);assert.equal(state.garden.locations.bunny,'garden');
});
test('A direct arch request moves a garden character, while another character command cannot cancel it',()=>{
 const {api,state,timers,callbacks}=setup();api.characterAction('bird','arch',callbacks);
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bird)),{x:62,y:65});
 api.characterAction('cat','main_house',callbacks);timers.shift()();
 assert.equal(state.garden.locations.bird,'garden');assert.equal(state.garden.commands.bird.target,'arch');
 assert.equal(api.OBJECT_REACTIONS.arch.bird.includes('arch'),true);
});
test('A resident crosses the open arch, while house or stored-arch requests do nothing',()=>{
 const {api,state,timers,callbacks}=setup();
 api.characterAction('bunny','arch',callbacks);
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bunny)),{x:62,y:89});
 timers.shift()();
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bunny)),{x:62,y:75});
 timers.shift()();
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bunny)),{x:64,y:64});
 state.garden.locations.cat='main_house';
 const before=timers.length;api.characterAction('cat','arch',callbacks);assert.equal(timers.length,before);
 state.garden.placed=[];
 api.characterAction('bird','arch',callbacks);assert.equal(timers.length,before);
});
test('Living Garden renders a painted arch with a clear passage and illustrated residents',()=>{
 const source=fs.readFileSync('living-garden.js','utf8'),css=fs.readFileSync('living-garden.css','utf8');
 const button={addEventListener(){}},view={innerHTML:'',querySelector(){return button},querySelectorAll(){return[]}};
 const document={querySelector(sel){return sel==='#gardenView'?view:null}};
 const ctx={window:{},document,Date,Math,setInterval(){},setTimeout(){}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const state={xp:720,garden:ctx.window.LivingGarden.fresh()};state.garden.fruit.progress=3;state.garden.placed=['arch'];
 ctx.window.LivingGarden.render({state,items:[{id:'arch',xp:630,label:'Flower arch'}],play(){},save(){},art:id=>`<svg data-friend="${id}"></svg>`});
 assert.match(view.innerHTML,/<button class="living-arch living-item"[^>]+id="livingArch"[^>]*><svg class="living-arch-art"/);
 assert.match(view.innerHTML,/V98C22 44 63 17 120 17s98 27 98 81v109/);
 assert(!view.innerHTML.includes('>🌸<span>Flower Arch'));
 assert(!view.innerHTML.includes('<span>Flower Arch</span>'));
 assert.match(view.innerHTML,/<button class="living-actor bird"[^>]*><svg/);
 assert.match(view.innerHTML,/<button id="livingFruit"[^>]*><svg/);
 assert.match(css,/\.living-arch\.living-item\{[^}]*z-index:7;pointer-events:auto/);
 assert.match(css,/\.living-arch-art\{[^}]*pointer-events:none/);
 assert.match(css,/\.living-arch-art path,\.living-arch-art use\{pointer-events:visiblePainted/);
 assert(fs.readFileSync('index.html','utf8').includes('living-garden.css?v=20260924-d4'));
});
test('Wandering respects manual commands and indoors state',()=>{
 const {api,state,callbacks}=setup();state.garden.locations.bunny='main_house';state.garden.commands.cat={until:Date.now()+10000,target:'arch'};
 const css=fs.readFileSync('living-garden.css','utf8');assert(css.includes('transition:left 1.1s ease'));
 assert(api.OBJECT_REACTIONS.arch.bunny);assert(!api.OBJECT_REACTIONS.bench);
});
test('Dragging can place a resident across the scene and saves a bounded position',()=>{
 const {api,state,callbacks,saved}=setup();
 api.characterAction('bunny','arch',callbacks);
 api.placeActor('bunny',{x:78,y:74},callbacks);
 assert.equal(state.garden.commands.bunny.target,'placed');
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bunny)),{x:78,y:74});
 api.placeActor('cat',{x:170,y:-30},callbacks);
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.cat)),{x:95,y:10});
 assert(saved.at(-1).includes('"x":95'));
 const css=fs.readFileSync('living-garden.css','utf8');
 assert.match(css,/#livingActors\{position:absolute;inset:0;z-index:8;pointer-events:none\}/);
 assert.match(css,/\.living-actor\{pointer-events:auto;touch-action:none\}/);
 assert.match(css,/animation-duration:38s/);
 assert.match(css,/translateX\(190px\)/);
});
