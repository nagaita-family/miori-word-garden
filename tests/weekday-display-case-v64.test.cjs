'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8'),focus=fs.readFileSync('five-words-focus.js','utf8'),html=fs.readFileSync('index.html','utf8');
const ctx={window:{}};vm.runInNewContext(focus,ctx);
test('weekdays show uppercase without changing identity or review keys',()=>{
 const display=ctx.window.FiveWordsFocus.display;
 const word={id:'wednesday',word:'wednesday',displayWord:'Wednesday',chunks:['wed','nes','day'],learn:{five:{parentFocus:{indices:[0,3]}}}};
 const view=display(word,null,x=>x);
 assert(view.includes('>W</mark>')||view.includes('>W</mark>'));
 assert(view.includes('five-chunk'));
 const oldSaved={...word,displayWord:'wednesday'};
 assert(display(oldSaved,null,x=>x).includes('>W</mark>'),'already-saved lowercase displayWord must not override weekday capitalization');
 assert(app.includes("const word=norm(raw.word||old?.word||'')"));
 assert(app.includes('function displayedSpelling(w)'));
 assert(app.includes('WEEKDAY_CAPS.has(w.word)'));
 assert(app.includes('w.displayWord=displayedSpelling(w)'));
});
test('import remains case-insensitive and avoids duplicate IDs',()=>{
 assert(app.includes('const key=norm(raw.word),old=state.lib[key]'));
 assert(app.includes('uniqueWordIds(ids)'));
 assert(html.includes('app.js?v=20261008-v65'));
 assert(html.includes('five-words-focus.js?v=20261008-v65'));
});
