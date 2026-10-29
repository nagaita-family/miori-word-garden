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
 assert(display(oldSaved,null,x=>x).includes('>w</mark>'),'renderer honors the spelling stored in the record');
 assert(app.includes("const word=norm(raw.word||old?.word||'')"));
 assert(app.includes('function displayedSpelling(w)'));
 assert(app.includes('<strong>${esc(displayedSpelling(w))}</strong>'),'This Week card uses the source spelling');
 assert(!app.includes('WEEKDAY_CAPS'),'one-off weekday casing/migration code is removed');
 assert(app.includes('displayWord:(typeof raw.displayWord'),'Word Pack spelling is persisted as data');
});
test('import remains case-insensitive and avoids duplicate IDs',()=>{
 assert(app.includes('const key=norm(raw.word),old=state.lib[key]'));
 assert(app.includes('uniqueWordIds(ids)'));
 assert(html.includes('app.js?v=20261012-v67'));
 assert(html.includes('five-words-focus.js?v=20261029-v68'));
});
