'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('five-words-selection.js','utf8'),ctx);
const {select,markResult}=ctx.window.FiveWordsSelection,now=Date.parse('2026-09-30T08:00:00Z');
const words=(ids)=>Object.fromEntries(ids.map(id=>[id,{word:id,learn:{attempts:0,correct:0,mistakes:0,loops:0,stageMist:{4:0}}}]));
test('due recall and mistakes have priority while a new word always gets a slot',()=>{
 const ids=['one','two','three','four','five','six','seven'],lib=words(ids);
 for(const id of ids.slice(0,6))lib[id].learn.five={introduced:true,recallSuccess:1,dueAt:new Date(now+3600000).toISOString()};
 lib.one.learn.five.dueAt=new Date(now-1000).toISOString();
 lib.two.learn.five.needsRecall=true;lib.two.learn.mistakes=2;
 const picked=Array.from(select({ids,lib,now,count:5,stars:['three']}));
 assert.equal(picked.length,5);assert.equal(new Set(picked).size,5);
 assert(picked.includes('one')&&picked.includes('two')&&picked.includes('seven'));
 assert(picked.includes('three'),'parent priority boosts a word without consuming every slot');
});
test('two adjacent loops rotate when the pool permits, without crossing lanes',()=>{
 const ids=Array.from({length:10},(_,i)=>'word'+i),lib=words(ids);
 const first=Array.from(select({ids,lib,now,count:5}));
 const second=Array.from(select({ids,lib,previous:first,now,count:5}));
 assert.equal(first.length,5);assert.equal(second.length,5);
 assert.equal(second.filter(x=>first.includes(x)).length,0,'the other five words have a turn');
 const mine=Array.from(select({ids:['journal','reading'],lib:{...lib,...words(['journal','reading'])},previous:first,now}));
 assert.deepEqual(mine,['journal','reading'],'a selected pool cannot bring in other-lane words');
});
test('manual slots lead; repeated loops still give unseen words a turn',()=>{
 const ids=['a','b','c','d','e','f'],lib=words(ids);
 for(const id of ids.slice(0,5))lib[id].learn.five={introduced:true,dueAt:new Date(now-1000).toISOString()};
 const picked=Array.from(select({ids,lib,manual:['b','c'],previous:['a','b','c','d','e'],now}));
 assert.deepEqual(picked.slice(0,2),['b','c']);assert(picked.includes('f'));
});
test('initial success schedules later recall; a miss returns to short spacing and Pad does not reset it',()=>{
 const f={introduced:false,recallSuccess:1};
 markResult(f,{correct:true,firstTry:true,now});assert.equal(f.dueAt,new Date(now+4*3600000).toISOString());
 f.recallSuccess=2;markResult(f,{correct:true,firstTry:true,now});assert.equal(f.dueAt,new Date(now+24*3600000).toISOString());
 markResult(f,{correct:false,firstTry:true,now});assert.equal(f.needsRecall,true);const due=f.dueAt;
 markResult(f,{correct:true,firstTry:false,now});assert.equal(f.dueAt,due);assert.equal(f.needsRecall,true);
});
