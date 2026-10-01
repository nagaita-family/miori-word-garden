'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('five-words-focus.js','utf8'),ctx);
const f=ctx.window.FiveWordsFocus,plain=x=>x;
test('optional chunks only appear when natural parts reconstruct the word',()=>{
 assert.deepEqual(Array.from(f.chunks('butterfly',['butter','fly'])),['butter','fly']);
 assert.equal(f.chunks('butterfly',['b','utterfly']),null);
 assert.equal(f.chunks('butterfly',['butter','flies']),null);
 assert.match(f.display({word:'butterfly',chunks:['butter','fly']},null,plain),/five-chunk.*butter.*five-chunk.*fly/s);
});
test('seed focus is optional; repeated clean recall mistakes replace it without loud chunks',()=>{
 const w={word:'butterfly',chunks:['butter','fly'],seedFocus:{start:2,length:2},learn:{five:{}}};
 assert.match(f.display(w,null,plain),/five-focus.*tt/);assert.doesNotMatch(f.display(w,null,plain),/five-chunk/);
 const spot=f.mistake(w.word,'butterfli','butterfli');assert.equal(spot.start,8);
 f.remember(w.learn.five,spot);assert.equal(w.learn.five.mioriFocus,undefined);
 f.remember(w.learn.five,spot);assert.equal(w.learn.five.mioriFocus.start,8);
 assert.match(f.display(w,null,plain),/five-focus.*y/);
 f.setParent(w,{start:0,length:3});assert.equal(w.learn.five.parentFocus.start,0);
 assert.match(f.display(w,null,plain),/five-focus.*but/,'Parent manual Focus overrides learned and seed Focus');
 assert.match(f.display(w,{start:6,length:3},plain),/five-focus.*fly/,'the current mistake still takes priority for immediate correction');
 f.setParent(w,null);assert.equal(w.learn.five.parentFocus,undefined);assert.match(f.display(w,null,plain),/five-focus.*y/,'clearing manual Focus returns to Miori Focus');
});
test('ambiguous recognition cannot persist an inaccurate Focus',()=>{
 assert.equal(f.mistake('gentle','gent0le','gentle'),null);
 assert.equal(f.mistake('gentle','gen tle','gentle'),null);
 assert.equal(f.mistake('gentle','gentole','gentole'),null,'length-changing candidates are ignored');
 assert.equal(f.mistake('gentle','xxxxxx','xxxxxx'),null,'large differences are ignored');
 assert.equal(f.focus('gentle',{start:5,length:2}),null);
});
test('new optional Word Pack fields retain older progress when normalized',()=>{
 const app=fs.readFileSync('app.js','utf8'),a=app.indexOf('function normalizeWord('),b=app.indexOf('function seedSchoolWords(',a);
 const local={window:{FiveWordsFocus:f},norm:x=>String(x||'').toLowerCase(),learning:x=>({attempts:0}),emojiFor:()=>'*'};vm.createContext(local);vm.runInContext(app.slice(a,b),local);
 const old={word:'butterfly',learn:{attempts:4,five:{introduced:true,mioriFocus:{start:3,length:2}}}};
 const w=local.normalizeWord({word:'butterfly',chunks:['butter','fly'],seedFocus:{start:2,length:2}},old);
 assert.equal(w.learn.attempts,4);assert.equal(w.learn.five.mioriFocus.start,3);
 assert.deepEqual(Array.from(w.chunks),['butter','fly']);assert.equal(w.seedFocus.start,2);
 const legacy=local.normalizeWord({word:'insect'},null);assert.equal(legacy.chunks,null);assert.equal(legacy.seedFocus,null);
});
