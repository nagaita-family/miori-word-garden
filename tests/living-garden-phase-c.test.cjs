'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8');
const ctx={window:{},document:{querySelector:()=>null},setInterval(){}};vm.createContext(ctx);vm.runInContext(source,ctx);const api=ctx.window.LivingGarden;
test('One successful completed word advances fruit once, and ripe fruit waits without losing later growth',()=>{
 const g=api.fresh();for(let i=1;i<=4;i++)assert.equal(api.onWordComplete(g,new Date(2026,8,24,13)).stage,i);
 assert.equal(g.fruit.progress,4);api.onWordComplete(g,new Date(2026,8,24,13));assert.equal(g.fruit.progress,5);
 assert(api.eatFruit(g));assert.equal(g.fruit.progress,1);assert.equal(g.fruit.eaten,1);
 assert.equal(api.eatFruit(g),false);for(let i=0;i<3;i++)api.onWordComplete(g,new Date(2026,8,24,13));
 assert(api.eatFruit(g));assert.equal(g.fruit.eaten,2);
});
test('A daypart moment is once per local day and part; missed parts carry no debt',()=>{
 const g=api.fresh(),date=(day,h)=>new Date(2026,8,day,h);
 assert.match(api.onWordComplete(g,date(24,8)).moment,/morning/i);
 assert.equal(api.onWordComplete(g,date(24,9)).moment,'');
 assert.match(api.onWordComplete(g,date(24,21)).moment,/patio/i);
 assert.match(api.onWordComplete(g,date(25,13)).moment,/sunny/i);
 assert.deepEqual(JSON.parse(JSON.stringify(g.moments.parts)),['day']);
 assert(!('streak' in g)&&!('missed' in g));
});
test('Fruit hook occurs only after Stage 4 success, outside weekly assessment',()=>{
 const app=fs.readFileSync('app.js','utf8'),start=app.indexOf('function right(w,q){'),end=app.indexOf('function renderReward(',start),part=app.slice(start,end);
 assert(part.indexOf('if(q.stage<4)')<part.indexOf('onWordComplete(state.garden)'));
 assert.equal((part.match(/onWordComplete\(state\.garden\)/g)||[]).length,1);
 assert(!app.slice(app.indexOf('function gradeWeeklyTest(){'),app.indexOf('function renderWeeklyResult(){')).includes('onWordComplete'));
 const css=fs.readFileSync('living-garden.css','utf8');assert(css.includes('.living-fruit.stage-4')&&css.includes('prefers-reduced-motion:reduce'));
});
