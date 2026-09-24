'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8');
test('Tap placement moves a selected character or House to the tapped spot even over another item',()=>{
 const nodes=new Map();function element(dataset={}){const events={},el={dataset,events,style:{},innerHTML:'',classList:{add(){},remove(){}},addEventListener(name,fn){events[name]=fn},focus(){},setPointerCapture(){},getBoundingClientRect(){return{left:0,top:0,width:1000,height:500}},querySelector(sel){const key=`${dataset.gardenItem||dataset.livingActor||'menu'}:${sel}`;if(!nodes.has(key))nodes.set(key,element());return nodes.get(key)},querySelectorAll(){return[]}};return el}
 const scene=element(),menu=element(),tree=element({gardenItem:'tree'}),main=element({gardenItem:'main_house'}),birdHouse=element({gardenItem:'bird_house'}),actor=element({livingActor:'bunny'});
 const view={innerHTML:'',querySelector(sel){if(sel==='#livingScene')return scene;if(sel==='#livingActions')return menu;const key=`view:${sel}`;if(!nodes.has(key))nodes.set(key,element());return nodes.get(key)},querySelectorAll(sel){return sel==='[data-garden-item]'?[tree,main,birdHouse]:sel==='[data-living-actor]'?[actor]:[]}};
 const document={querySelector(sel){if(sel==='#gardenView'||sel==='#gardenView.active-view')return view;if(sel==='[data-living-actor="bunny"]')return actor;return null}};
 const sandbox={window:{},document,Date,Math,setInterval(){},setTimeout(){}};vm.createContext(sandbox);vm.runInContext(source,sandbox);const api=sandbox.window.LivingGarden;
 const state={xp:0,garden:api.fresh(),learning:{word:'butterfly'}},ctx={state,items:[],play(){},save(){},art:()=>'<svg></svg>'};api.render(ctx);
 const event={target:{closest:()=>null},clientX:730,clientY:350,preventDefault(){},stopPropagation(){}};
 actor.events.click();menu.querySelector('[data-move-actor]').events.click();assert.match(menu.innerHTML,/Tap the spot for Bunny/);
 scene.events.click(event);assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bunny)),{x:73,y:70});assert.equal(state.garden.commands.bunny.target,'placed');
 main.events.click();menu.querySelector('[data-move]').events.click();scene.events.click({...event,clientX:360,clientY:270});
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.itemPos.main_house)),{x:36,y:54});assert.equal(state.garden.locations.bunny,'garden');
 assert.deepEqual(state.learning,{word:'butterfly'});
});
test('Garden placement remains separate from Garage storage and indoor placement',()=>{
 const css=fs.readFileSync('living-garden.css','utf8');assert.match(css,/\.living-item\.dragging\{/);
 assert.match(source,/scene\.addEventListener\('click',e=>\{if\(!placement/);
 assert.match(source,/if\(kind==='actor'\)placeActor\(id,p,ctx\);else moveItem\(id,p,ctx\)/);
});
