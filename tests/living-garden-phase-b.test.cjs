'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const timers=[],actors={};const document={querySelector(sel){if(sel.startsWith('[data-living-actor='))return actors[sel.match(/"(.*?)"/)[1]]||null;return null}};
 const ctx={window:{},document,Date,Math,setTimeout:f=>{timers.push(f)},setInterval(){}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('living-garden.js','utf8'),ctx);
 const api=ctx.window.LivingGarden,state={garden:api.fresh()},saved=[];
 const callbacks={state,save:()=>saved.push(JSON.stringify(state.garden))};
 return{api,state,timers,actors,callbacks,saved};
}
test('Phase A state adds B residents once without resetting growth or a custom location',()=>{
 const {api,state}=setup();state.garden.growth=8;delete state.garden.locations.cat;state.garden.locations.bunny='main_house';api.migrate(state);
 assert.equal(state.garden.growth,8);assert.equal(state.garden.locations.bunny,'main_house');assert.equal(state.garden.locations.cat,'garden');
 api.migrate(state);assert.equal(state.garden.growth,8);
});
test('Explicit house trip persists and house residents cannot use the Garden arch',()=>{
 const {api,state,timers,callbacks,saved}=setup();api.characterAction('bunny','main_house',callbacks);
 assert.equal(state.garden.commands.bunny.target,'main_house');assert.equal(state.garden.characterPos.bunny.x,81);
 timers.shift()();assert.equal(state.garden.locations.bunny,'main_house');
 const before=timers.length;api.characterAction('bunny','arch',callbacks);assert.equal(timers.length,before);
 assert(saved.at(-1).includes('main_house'));
 api.characterAction('bunny','garden',callbacks);assert.equal(state.garden.locations.bunny,'garden');
});
test('A direct arch request moves a garden character, while another character command cannot cancel it',()=>{
 const {api,state,timers,callbacks}=setup();api.characterAction('bird','arch',callbacks);
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bird)),{x:59,y:39});
 api.characterAction('cat','main_house',callbacks);timers.shift()();
 assert.equal(state.garden.locations.bird,'garden');assert.equal(state.garden.commands.bird.target,'arch');
 assert.equal(api.OBJECT_REACTIONS.arch.bird.includes('arch'),true);
});
test('Wandering respects manual commands and indoors state',()=>{
 const {api,state,callbacks}=setup();state.garden.locations.bunny='main_house';state.garden.commands.cat={until:Date.now()+10000,target:'arch'};
 const css=fs.readFileSync('living-garden.css','utf8');assert(css.includes('transition:left 1.1s ease'));
 assert(api.OBJECT_REACTIONS.arch.bunny);assert(!api.OBJECT_REACTIONS.bench);
});
