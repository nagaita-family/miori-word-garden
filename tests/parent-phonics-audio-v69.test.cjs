'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const helper=fs.readFileSync('parent-phonics.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('parent-phonics.css','utf8');
const pack=JSON.parse(fs.readFileSync('word-packs/current.json','utf8'));
const context={window:{}};vm.runInNewContext(helper,context);
const phonics=context.window.ParentPhonics;
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function renderedWord(word){
 const raw=pack.words.find(w=>w.word===word);
 return phonics.display({word:word.toLowerCase().replace(/[^a-z]/g,''),displayWord:raw.displayWord||raw.word,chunks:raw.chunks,phonicsChunks:raw.phonicsChunks,phonicsSilent:raw.phonicsSilent},escape);
}
test('Parent groups use verified school chunks, including silent h and y/ear',()=>{
 const hour=renderedWord('hour');
 assert.match(hour,/parent-phonics-silent[^>]*>h<\/span>/);
 assert.match(hour,/parent-phonics-chunk">our<\/span>/);
 assert.equal((hour.match(/class="parent-phonics-chunk"/g)||[]).length,2);
 assert.equal((renderedWord('year').match(/class="parent-phonics-chunk"/g)||[]).length,2);
 assert.equal((renderedWord('month').match(/class="parent-phonics-chunk"/g)||[]).length,4);
 assert.equal((renderedWord('noon').match(/class="parent-phonics-chunk"/g)||[]).length,3);
});
test('word identity and spaces are unchanged, including school time zone',()=>{
 for(const raw of pack.words){
  const displayed=renderedWord(raw.word);
  assert.equal(displayed.replace(/<[^>]+>/g,''),raw.displayWord||raw.word);
 }
 assert.match(renderedWord('time zone'),/parent-phonics-gap"> <\/span>/);
 assert.equal(phonics.validParts('year',['ye','wrong']),null);
 assert.equal(phonics.display({word:'test',chunks:['te','st'],displayWord:'test'},escape).replace(/<[^>]+>/g,''),'test');
});
test('unsafe or invalid metadata is never interpreted as markup',()=>{
 assert.equal(phonics.validParts('test',['<img','st>']),null);
 const plain=phonics.display({word:'test',displayWord:'test',chunks:['invalid']},escape);
 assert.equal(plain,'test');
});
test('Parent This Week has normal and slow audio using existing player, without changing practice flow',()=>{
 assert.match(app,/function thisWeekGroupCard\(w\)[^\n]*ParentPhonics\?\.display\(w,esc\)/);
 assert.match(app,/class="group-audio-slow"/);
 assert.match(app,/group-audio-slow'\)\.forEach\(btn=>btn\.onclick=/);
 assert.match(app,/playWordAudio\(w,true,\{userInitiated:true\}\)/);
 assert.match(app,/playWordAudio\(w,false,\{userInitiated:true\}\)/);
 assert.match(app,/schoolMeaning\|\|w\.meaningEn/);
 assert.match(app,/audio\.playbackRate=slow\?\.82:1/);
 assert.match(app,/u\.rate=slow\?\.62:\.88/);
 assert.match(css,/\.parent-phonics-chunk\{[^}]*border-bottom/);
 assert.match(css,/\.parent-phonics-silent/);
});
test('parent-only metadata stays in school pack, with unchanged five-word chunks',()=>{
 const month=pack.words.find(w=>w.word==='month');
 assert.equal(month.chunks.join(''),'month');
 assert.deepEqual(month.phonicsChunks,['m','o','n','th']);
 assert.deepEqual(pack.words.find(w=>w.word==='hour').phonicsSilent,[0]);
 const syncContext={window:{}};vm.runInNewContext(fs.readFileSync('school-pack-sync.js','utf8'),syncContext);
 const read=syncContext.window.SchoolPackSync.readPack;
 const norm=s=>String(s).toLowerCase().replace(/[^a-z]/g,'');
 assert.equal(read(pack,norm).ids.length,10);
 for(const invalid of [
  {...pack,words:pack.words.map((w,i)=>i? w :{...w,phonicsSilent:[500]})},
  {...pack,words:pack.words.map((w,i)=>i? w :{...w,phonicsChunks:['h','wrong']})},
  {...pack,words:pack.words.map((w,i)=>i? w :{...w,phonicsSilent:[0,0]})}
 ])assert.throws(()=>read(invalid,norm));
 assert.match(app,/phonicsChunks:window\.ParentPhonics\?\.validParts/);
});
test('new helpers load before app and have fresh cache keys',()=>{
 assert.match(html,/parent-phonics\.css\?v=20261103-v69/);
 assert.match(html,/parent-phonics\.js\?v=20261103-v69/);
 assert(html.indexOf('parent-phonics.js')<html.indexOf('app.js?v='));
 assert.match(html,/app\.js\?v=20261012-v67-parent-phonics-v69/);
 assert.match(html,/v71 · Nov 4/);
});
