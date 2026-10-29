'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const moduleSource=fs.readFileSync('school-pack-sync.js','utf8');
const current=JSON.parse(fs.readFileSync('word-packs/current.json','utf8'));
const app=fs.readFileSync('app.js','utf8');
const page=fs.readFileSync('index.html','utf8');
const ctx={window:{}};vm.runInNewContext(moduleSource,ctx);
const sync=ctx.window.SchoolPackSync;
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
let archives=0;
const deps={
 norm,
 normalizeWord:(raw,old)=>({...old,...raw,id:norm(raw.word),word:norm(raw.word),displayWord:raw.displayWord||raw.word,learn:old?.learn||{loops:0}}),
 archiveWeek:(s,week)=>{archives++;s.pastWeeks.push({...week,ids:[...week.ids]})},
 ensureLearningGroups:()=>{}
};
const fresh=()=>({
 version:3,lib:{},week:{id:'legacy-week',title:'Legacy',ids:['journal'],focusIds:[]},
 pastWeeks:[],myWords:{journal:{addedAt:'2026-10-01',source:'Reading',note:'Never remove'}},
 garden:{growth:12},stats:{answers:41},weekTestDraft:{weekId:'legacy-week'}
});
test('the published school pack has 10 Unit 7a spellings and valid chunk metadata',()=>{
 const checked=sync.readPack(current,norm);
 assert.equal(checked.ids.length,10);
 assert.equal(current.words[0].word,'hour');
 assert.equal(current.words[3].word,'month');
 assert.equal(current.words[8].word,'time zone');
 assert.equal(current.words[9].word,'year');
});
test('a first GitHub update replaces only This Week and archives once',()=>{
 archives=0;
 const state=fresh();
 state.lib.journal={id:'journal',word:'journal',learn:{loops:3}};
 const result=sync.apply(state,current,deps);
 assert.equal(result.status,'updated');
 assert.equal(result.changedWeek,true);
 assert.equal(archives,1);
 assert.equal(state.week.id,current.weekId);
 assert.equal(state.week.ids.length,10);
 assert.equal(state.lib.Hour,undefined,'normalized IDs are lowercase');
 assert.equal(state.lib.hour.displayWord,'hour');
 assert.deepEqual(state.myWords.journal,{addedAt:'2026-10-01',source:'Reading',note:'Never remove'});
 assert.equal(state.lib.journal.learn.loops,3);
 assert.equal(state.garden.growth,12);
 assert.equal(state.weekTestDraft,undefined,'only the old school test draft resets on a new week');
 const second=sync.apply(state,current,deps);
 assert.equal(second.status,'unchanged');
 assert.equal(archives,1,'identical fetch is idempotent');
});
test('existing spelling history, parent Focus, stars, journal notes and manual meanings are preserved',()=>{
 archives=0;
 const state=fresh();
 state.week={id:current.weekId,title:current.weekName,ids:current.words.map(w=>norm(w.word)),focusIds:['minute']};
 state.myWords.minute={addedAt:'2026-10-01',source:'Journal',note:'My own sentence'};
 const learn={loops:7,mistakes:2,five:{parentFocus:{indices:[0,3]},starred:true,recallSuccess:2}};
 state.lib.minute={id:'minute',word:'minute',displayWord:'minute',meaningEn:'My own explanation',learn};
 state.weekTestDraft={weekId:current.weekId};
 const result=sync.apply(state,current,deps);
 assert.equal(result.status,'updated');
 assert.equal(result.changedWeek,false);
 assert.equal(state.lib.minute.learn,learn);
 assert.equal(state.lib.minute.meaningEn,'My own explanation','personal My Words meaning wins');
 assert.equal(state.week.schoolMeaningById.minute,'a measure of time that is 60 seconds long; the long hand of the clock','school definition remains available separately');
 assert.equal(state.myWords.minute.note,'My own sentence');
 assert.deepEqual(state.week.focusIds,['minute']);
 assert.deepEqual(state.weekTestDraft,{weekId:current.weekId});
 assert.equal(archives,0);
});
test('a new school pack shares one ID with My Words without mixing their practice pools',()=>{
 archives=0;
 const state=fresh();
 state.lib.journal={id:'journal',word:'journal',displayWord:'journal',meaningEn:'an account of my day',learn:{loops:5}};
 const next={weekId:'2026-10-19-new-week',weekName:'New week',words:[{word:'journal',meaningEn:'school definition',chunks:['jour','nal']},{word:'Jason',chunks:['Ja','son']}]};
 sync.apply(state,next,deps);
 assert.equal(state.lib.journal.learn.loops,5);
 assert.equal(state.lib.journal.meaningEn,'an account of my day');
 assert.equal(state.week.schoolMeaningById.journal,'school definition');
 assert.deepEqual(Array.from(state.week.ids),['journal','jason']);
 assert.deepEqual(Object.keys(state.myWords),['journal']);
 assert.equal(state.lib.jason.displayWord,'Jason');
});
test('invalid data never changes saved state or silently restores a full backup',()=>{
 for(const bad of [
  {version:3,lib:{a:{}},week:{ids:[]}},
  {...current,words:[current.words[0],current.words[0]]},
  {...current,words:[{word:'hour',chunks:['hou','rzz']}]},
  {...current,words:[{word:'hour',seedFocus:{start:50,length:3}}]},
  {...current,weekId:''}
 ]){
  const state=fresh(),before=JSON.stringify(state);
  assert.throws(()=>sync.apply(state,bad,deps));
  assert.equal(JSON.stringify(state),before);
 }
});
test('manual emergency Import is kept until GitHub publishes the next week',()=>{
 const state=fresh();
 state.schoolPackSync={weekId:current.weekId,manualOverride:true,manualOverrideSourceWeekId:current.weekId};
 const before=JSON.stringify(state);
 assert.equal(sync.apply(state,current,deps).status,'manual');
 assert.equal(JSON.stringify(state),before);
 const next={weekId:'2026-10-20-school',weekName:'Next week',words:[{word:'Jason'}]};
 assert.equal(sync.apply(state,next,deps).status,'updated');
 assert.equal(state.schoolPackSync.manualOverride,undefined);
});
test('app uses GitHub Pages fetch, live local state and two isolated five-word pools',()=>{
 assert.match(app,/fetch\(SCHOOL_PACK_URL/);
 assert.match(app,/cache:'no-store'/);
 assert.match(app,/SchoolPackSync\.apply\(state,pack/);
 assert(app.includes('if(fiveWords||session||weeklyTest)return;'),'sync waits for all live writing sessions');
 assert.match(app,/lane==='week'\?state\.week\.ids:Object\.keys\(state\.myWords\|\|\{\}\)/);
 assert.match(app,/schoolMeaningById\?\.\[w\.id\]/);
 assert.match(app,/manualOverrideSourceWeekId/);
 assert(!app.includes('WEEKDAY_CAPS'),'obsolete one-off weekday migration is removed');
 assert(page.includes('school-pack-sync.js?v=20261029-v68'));
 assert(page.includes('app.js?v=20261012-v67'));
 assert(page.includes('v68 · Oct 29'));
});

test('time zone keeps the correct school spacing without splitting the learning ID',()=>{
 const pack=sync.readPack(current,norm);
 assert(Array.from(pack.ids).includes('timezone'));
 const state=fresh();sync.apply(state,current,deps);
 assert.equal(state.lib.timezone.displayWord,'time zone');
 assert.deepEqual(Array.from(state.lib.timezone.chunks),['time','zone']);
 assert.equal(state.week.schoolMeaningById.timezone,'one of the 24 areas that the world is divided into');
 assert.equal(state.lib.timezone.meaningJa,'');
});
