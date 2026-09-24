'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8');
const styles=fs.readFileSync('living-garden.css','utf8');
const app=fs.readFileSync('app.js','utf8');
const rewards=vm.runInNewContext(`${app.match(/const rewards=\[[\s\S]*?\n\];/)[0]};rewards`).filter(r=>r.type==='treasure').map(({id,xp,label})=>({id,xp,label}));
function setup(xp=0){
 const timers=[],view={innerHTML:'',querySelector(){return{addEventListener(){},querySelectorAll(){return[]}}},querySelectorAll(){return[]}},document={querySelector(sel){return sel==='#gardenView'?view:null}};
 const sandbox={window:{},document,Date,Math,setTimeout:f=>timers.push(f),setInterval(){}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const state={xp,garden:sandbox.window.LivingGarden.fresh(),lib:{word:{learn:{weak:[1]}}},week:{ids:['word']}},saved=[];
 const ctx={state,items:rewards,save:()=>saved.push(JSON.stringify(state)),art:()=>'<svg></svg>'};
 return{api:sandbox.window.LivingGarden,ctx,state,timers,saved,view};
}
test('Living Garden upgrades v1 without touching learning or gifting an unearned arch',()=>{
 const {api,state}=setup(0);state.garden.livingGardenVersion=1;state.garden.placed=['arch'];state.garden.growth=9;state.garden.fruit.progress=3;state.garden.characterPos.bunny={x:32,y:64};
 const before=JSON.stringify({lib:state.lib,week:state.week,xp:state.xp});api.migrate(state);
 assert.equal(state.garden.livingGardenVersion,2);assert.deepEqual(Array.from(state.garden.placed),[]);
 assert.equal(state.garden.growth,9);assert.equal(state.garden.fruit.progress,3);assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bunny)),{x:32,y:64});
 api.migrate(state);assert.equal(JSON.stringify({lib:state.lib,week:state.week,xp:state.xp}),before);
});
test('Every unlockable item starts stored, appears only when earned and placed, and can be moved and put away',()=>{
 const {api,state,ctx,saved,view}=setup(0);
 assert.equal(rewards.length,7);assert.equal(api.itemPlaced('arch',ctx),false);
 for(const item of rewards){
  assert.equal(api.placeItem(item.id,ctx),false);
  state.xp=item.xp;
  assert.equal(api.itemPlaced(item.id,ctx),false);
  assert.equal(state.garden.placed.includes(item.id),false);
  assert.equal(api.placeItem(item.id,ctx),true);assert.equal(api.itemPlaced(item.id,ctx),true);
  assert(view.innerHTML.includes(`data-garden-item="${item.id}"`));
  assert.equal(api.storeItem(item.id,ctx),true);assert.equal(api.dropCharacter('bunny',item.id,ctx),false);
 }
 assert(saved.length===rewards.length*2);
 assert(app.includes("items:rewards.filter(r=>r.type==='treasure')"));
});
test('Storage, placement and positions survive reload; stored items have no reaction',()=>{
 const {api,state,ctx,timers}=setup(720);
 // Minimal render stub lets the normal place/store functions exercise their state and UI path.
 const view={innerHTML:'',querySelector(){return{addEventListener(){},querySelectorAll(){return[]}}},querySelectorAll(){return[]}};
 // Bind the setup document's querySelector through the sandbox API by using a new context fixture.
 const sb={window:{},document:{querySelector:sel=>sel==='#gardenView'?view:null},Date,Math,setInterval(){},setTimeout:f=>timers.push(f)};
 vm.createContext(sb);vm.runInContext(source,sb);const api2=sb.window.LivingGarden;
 assert(api2.placeItem('bench',ctx));assert(api2.placeItem('arch',ctx));
 assert.equal(api2.moveItem('arch',{x:39,y:72},ctx),true);
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.itemPos.arch)),{x:39,y:72});
 assert.equal(api2.dropCharacter('bunny','bench',ctx),true);assert.equal(state.garden.commands.bunny.kind,'sit');
 assert(api2.storeItem('bench',ctx));assert.equal(api2.dropCharacter('bunny','bench',ctx),false);
 const reloaded=JSON.parse(JSON.stringify(state));api2.migrate(reloaded);
 assert.equal(reloaded.garden.placed.includes('bench'),false);assert.equal(reloaded.garden.placed.includes('arch'),true);
 assert.deepEqual(reloaded.garden.itemPos.arch,{x:39,y:72});assert.equal(api2.itemPlaced('arch',{...ctx,state:reloaded}),true);
});
test('Common reactions and drag priority keep residents in a valid Garden state',()=>{
 const {api,state,ctx,timers}=setup(720);state.garden.placed=['bench','picnic','mail','birdbath','seedcrate','arch','shed'];
 for(const [item,who,expected] of [['bench','bunny','sit'],['picnic','bunny','eat'],['mail','cat','inspect'],['birdbath','bird','bathe'],['seedcrate','bunny','play'],['arch','bird','perch'],['shed','cat','inspect'],['tree','bird','inspect']]){
  assert.equal(api.reactionKind(who,item,state.garden),expected);assert.equal(api.dropCharacter(who,item,ctx),true);
  assert.equal(state.garden.locations[who],'garden');assert.equal(state.garden.commands[who].kind,expected);
 }
 assert(api.dropCharacter('bunny','arch',ctx));const before=JSON.stringify(state.garden.characterPos.bunny);
 api.placeActor('bunny',{x:28,y:70},ctx);for(const callback of timers.splice(0))callback();
 assert.notEqual(JSON.stringify(state.garden.characterPos.bunny),before);
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.characterPos.bunny)),{x:28,y:70});
 assert.equal(state.garden.locations.bunny,'garden');
});
test('Cat remains locked below 360 XP and all seven items are absent in a new Garden view',()=>{
 const {api,state,ctx}=setup(0);assert.equal(api.dropCharacter('cat','tree',ctx),false);
 const view={innerHTML:'',querySelector(){return{addEventListener(){},querySelectorAll(){return[]}}},querySelectorAll(){return[]}};
 const sb={window:{},document:{querySelector:sel=>sel==='#gardenView'?view:null},Date,Math,setInterval(){},setTimeout(){}};
 vm.createContext(sb);vm.runInContext(source,sb);
 sb.window.LivingGarden.render({...ctx,play(){}});
 assert(!view.innerHTML.includes('data-garden-item="arch"'));
 assert(!view.innerHTML.includes('data-living-actor="cat"'));
 assert(view.innerHTML.includes('data-garden-item="tree"')&&view.innerHTML.includes('data-garden-item="main_house"'));
 assert(view.innerHTML.includes('Garage · 0'));
 assert(!view.innerHTML.includes('Garden shelf'));
});
test('Pointer drop on a bench triggers sitting; dragging interrupts autonomous motion',()=>{
 assert(styles.includes('.living-fruit:disabled{pointer-events:none}'),'the invisible unripe fruit cannot intercept Tree drags');
 const timers=[],handlers=()=>({});
 function element(dataset,box){const events=handlers(),classes=new Set();return{dataset,style:{left:'46%',top:'73%'},events,box,classList:{add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},addEventListener:(type,fn)=>events[type]=fn,setPointerCapture(){},getBoundingClientRect(){return box}}}
 const bench=element({gardenItem:'bench'},{left:490,right:590,top:295,bottom:385,width:100,height:90});
 const arch=element({gardenItem:'arch'},{left:600,right:700,top:260,bottom:390,width:100,height:130});
 const actor=element({livingActor:'bunny'},{left:420,right:480,top:340,bottom:405,width:60,height:65});
 const empty=element({},{}),scene=element({}, {left:0,top:0,width:1000,height:500});scene.querySelectorAll=sel=>sel==='[data-garden-item]'?[bench,arch]:[];
 const view={innerHTML:'',querySelector:sel=>sel==='#livingScene'?scene:empty,querySelectorAll:sel=>sel==='[data-garden-item]'?[bench,arch]:sel==='[data-living-actor]'?[actor]:[]};
 const document={querySelector:sel=>sel==='#gardenView'||sel==='#gardenView.active-view'?view:sel==='#gardenView.active-view .living-scene'?scene:sel==='[data-living-actor="bunny"]'?actor:null};
 const sandbox={window:{},document,Date,Math:{...Math,random:()=>.8,hypot:Math.hypot,max:Math.max,min:Math.min},setTimeout:f=>timers.push(f),setInterval(){}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);const api=sandbox.window.LivingGarden;
 const state={xp:720,garden:api.fresh()},ctx={state,items:rewards,save(){},play(){},art:()=>'<svg></svg>'};state.garden.placed=['bench','arch'];
 api.render(ctx);
 actor.events.pointerdown({pointerId:1,button:0,pointerType:'mouse',clientX:460,clientY:370});
 const stationary=JSON.stringify(state.garden.characterPos.bunny);api.gentleWander();assert.equal(JSON.stringify(state.garden.characterPos.bunny),stationary);
 actor.events.pointermove({pointerId:1,clientX:530,clientY:350});
 actor.events.pointerup({pointerId:1,clientX:530,clientY:350,type:'pointerup'});
 assert.equal(state.garden.commands.bunny.kind,'sit');assert.equal(state.garden.commands.bunny.target,'bench');
 assert.equal(state.garden.locations.bunny,'garden');
 actor.events.pointerdown({pointerId:3,button:0,pointerType:'mouse',clientX:530,clientY:350});
 actor.events.pointermove({pointerId:3,clientX:596,clientY:350});
 actor.events.pointerup({pointerId:3,clientX:596,clientY:350,type:'pointerup'});
 assert.equal(state.garden.commands.bunny.target,'placed','a release outside both item bounds stays exactly where placed');
 assert(Math.abs(state.garden.characterPos.bunny.x-59.6)<.001);
 bench.style.left='52%';bench.style.top='80%';
 bench.events.pointerdown({pointerId:2,button:0,pointerType:'mouse',clientX:530,clientY:350,target:{closest:()=>null}});
 bench.events.pointermove({pointerId:2,clientX:630,clientY:360});
 bench.events.pointerup({pointerId:2,type:'pointerup'});
 assert.deepEqual(JSON.parse(JSON.stringify(state.garden.itemPos.bench)),{x:62,y:82});
});
