'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8'),css=fs.readFileSync('living-garden.css','utf8');
function setup(){
 const timers=[],controls=new Map(),empty={addEventListener(){},focus(){}};
 const control=(key,data={})=>{const button={dataset:data,events:{},addEventListener(type,fn){this.events[type]=fn},focus(){},click(){this.events.click?.()}};controls.set(key,button);return button};
 const view={innerHTML:'',querySelector(sel){return controls.get(sel)||control(sel)},querySelectorAll(sel){if(sel==='[data-place]'||sel==='[data-store]'){const attribute=sel==='[data-place]'?'place':'store';return [...this.innerHTML.matchAll(new RegExp(`data-${attribute}="([a-z]+)"`,'g'))].map(match=>control(`${attribute}:${match[1]}`,{[attribute]:match[1]}))}return[]}};
 const document={querySelector:sel=>sel==='#gardenView'?view:null};
 const sandbox={window:{},document,Date,Math,setInterval(){},setTimeout:fn=>timers.push(fn)};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const api=sandbox.window.LivingGarden,state={xp:0,garden:api.fresh(),history:{savedWord:['gentle']}},ctx={state,save(){},play(){},art:()=>'<svg></svg>',items:[{id:'bench',xp:90,label:'Cozy Garden Bench'},{id:'arch',xp:630,label:'Flower Arch'}]};
 const render=()=>api.render(ctx);
 return{api,state,ctx,view,controls,timers,render};
}
test('Garage is in Garden; locked treasures are hidden, owned ones start stored',()=>{
 const f=setup();f.render();assert.match(f.view.innerHTML,/id="livingGarage"/);assert(!f.view.innerHTML.includes('living-shelf'));
 assert(!f.view.innerHTML.includes('Cozy Garden Bench'));assert(!f.view.innerHTML.includes('Flower Arch'));
 f.controls.get('#livingGarage').click();assert.match(f.view.innerHTML,/id="livingGaragePanel"/);assert.match(f.view.innerHTML,/Nothing here yet/);
 f.state.xp=90;f.render();assert.match(f.view.innerHTML,/Cozy Garden Bench/);assert.match(f.view.innerHTML,/In Garage/);
 assert(!f.view.innerHTML.includes('Flower Arch'));assert(!f.view.innerHTML.includes('data-garden-item="bench"'));
});
test('Garage place and put away controls preserve state, block stored reactions and survive reload',()=>{
 const f=setup();f.state.xp=630;f.render();f.controls.get('#livingGarage').click();
 f.controls.get('place:bench').click();assert(f.api.itemPlaced('bench',f.ctx));assert(f.view.innerHTML.includes('data-garden-item="bench"'));
 assert(f.view.innerHTML.includes('In Garden'));assert(!f.state.garden.placed.includes('arch'));
 assert(f.api.moveItem('bench',{x:39,y:78},f.ctx));assert(f.api.dropCharacter('bunny','bench',f.ctx));
 f.controls.get('store:bench').click();assert(!f.api.itemPlaced('bench',f.ctx));
 assert(!f.view.innerHTML.includes('data-garden-item="bench"'));assert(f.view.innerHTML.includes('In Garage'));
 assert.equal(f.api.dropCharacter('bunny','bench',f.ctx),false);
 for(const timer of f.timers.splice(0))timer();assert.equal(f.state.garden.commands.bunny.target,'placed');
 const reloaded=JSON.parse(JSON.stringify(f.state));f.api.migrate(reloaded);
 assert.equal(reloaded.garden.itemPos.bench.x,39);assert(!reloaded.garden.placed.includes('bench'));
 assert.deepEqual(reloaded.history,{savedWord:['gentle']});
 f.controls.get('#livingGarageClose').click();assert(!f.view.innerHTML.includes('id="livingGaragePanel"'));
});
test('Garage uses a scene building with a compact inventory, including narrow layouts',()=>{
 assert.match(css,/\.living-garage\{position:absolute/);
 assert.match(css,/\.living-garage-panel\{position:absolute/);
 assert.match(css,/@media\(max-width:700px\)\{\.living-garage/);
 assert(fs.readFileSync('index.html','utf8').includes('living-garden.js?v=20260924-d1'));
});
