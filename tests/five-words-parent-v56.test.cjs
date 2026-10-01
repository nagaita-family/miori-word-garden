'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8'),start=app.indexOf('function fiveManual(lane){'),end=app.indexOf('function startFiveWords(lane){',start);
const uiStart=app.indexOf('function renderFiveParentControls(){'),uiEnd=app.indexOf('function renderParent(){',uiStart);
test('Parent star and one-off Next 5 persist, can be queued, and stay in their lane',()=>{
 const state={week:{id:'week-1',ids:['apple'],focusIds:[]},myWords:{journal:{}},lib:{apple:{id:'apple',learn:{loops:0,stageMist:{4:0}}},journal:{id:'journal',learn:{loops:1,stageMist:{4:0}}}}};
 const bars={},toolbars={},saved=[];
 const pane=lane=>{const card={dataset:{id:lane==='week'?'apple':'journal'},appendChild(bar){bars[lane]=bar}};
  const grid={before(toolbar){toolbars[lane]=toolbar},querySelectorAll(){return[card]}};
  return{querySelector:()=>grid}};
 const panes={week:pane('week'),my:pane('my')};
 const document={querySelector:s=>panes[s.match(/"(week|my)"/)?.[1]],createElement:()=>{
  const controls={star:{},focus:{},input:{checked:false}};
  return{className:'',innerHTML:'',querySelector:s=>s==='.five-star-toggle'?controls.star:s==='.five-focus-edit'?controls.focus:s==='input'?controls.input:controls.star}
 }};
 const focusApi={focus:()=>null};
 const ctx={state,document,window:{FiveWordsFocus:focusApi},save:()=>saved.push(JSON.stringify(state)),renderParent(){},toast(){},esc:s=>s,openFiveFocusEditor(){}};
 vm.createContext(ctx);vm.runInContext(app.slice(start,end)+app.slice(uiStart,uiEnd),ctx);
 ctx.renderFiveParentControls();
 bars.week.querySelector('.five-star-toggle').onclick();assert.equal(state.lib.apple.learn.five.starred,true);
 assert.equal(typeof bars.week.querySelector('.five-focus-edit').onclick,'function','Parent Focus editor is wired in both lanes');
 bars.week.querySelector('input').onchange({target:{checked:true}});assert.deepEqual(Array.from(state.fiveWordManual.week.ids),['apple']);
 toolbars.week.querySelector('[data-queue-five]').onclick();assert.equal(state.fiveWordManual.week.pending,true);
 const restored=JSON.parse(saved.at(-1));assert.equal(restored.lib.apple.learn.five.starred,true);assert.deepEqual(restored.fiveWordManual.week.ids,['apple']);
 assert.deepEqual(restored.fiveWordManual.my.ids,[]);
 state.week.id='week-2';assert.deepEqual(Array.from(ctx.fiveManual('week').ids),[],'a new week drops old manual selections');
});
test('Parent UI is wired for both groups and Practice 5 consumes a queued manual selection',()=>{
 assert(app.includes('renderFiveParentControls()'));
 assert(app.includes('manual:manual.pending?manual.ids:[]'));
 assert(app.includes('manual.ids=[];manual.pending=false;save()'));
 assert(fs.readFileSync('index.html','utf8').includes('five-words-parent.css?v=20261001-v58'));
});
