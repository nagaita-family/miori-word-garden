'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('five-words-core.js','utf8');
const selection=fs.readFileSync('five-words-selection.js','utf8');
const focusSource=fs.readFileSync('five-words-focus.js','utf8');
const page=fs.readFileSync('index.html','utf8');
function fixture(ids=['butterfly','cricket','insect','raisin','ladybug'],lane='week',prior=[]){
 const state={lib:Object.fromEntries(ids.map(id=>[id,{id,word:id,learn:{attempts:0,correct:0,first:0,mistakes:0,loops:prior.includes(id)?1:0,stageMist:{4:0},last:''}}])),stats:{answers:0,sessions:0},recentWords:[]};
 const nodes=new Map(),root={innerHTML:'',querySelector(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',onclick:null,addEventListener(){},querySelector(){return{}}});return nodes.get(id)}};
 const saved=[],reward=[];const ctx={window:{},setTimeout(){},navigator:{}};vm.createContext(ctx);vm.runInContext(selection,ctx);vm.runInContext(focusSource,ctx);vm.runInContext(src,ctx);
 const core=ctx.window.FiveWordsCore.create({lane,ids,state,root,save:()=>saved.push(JSON.stringify(state)),audio(){},resolveAudio:async()=>{},normalize:s=>String(s||'').toLowerCase().replace(/[^a-z]/g,''),escape:s=>s,diff:(a,b)=>a+' → '+b,sfx(){},markResult:ctx.window.FiveWordsSelection.markResult,focus:ctx.window.FiveWordsFocus,home(){},more(){},onRemembered:w=>reward.push(w.id)});
 return{core,state,root,saved,reward};
}
test('New words: look and listen, write in view, then hidden audio-only check and five-word finish',()=>{
 const x=fixture();assert.equal(x.core.run.phase,'look');assert.match(x.root.innerHTML,/Look & Listen.*butterfly/s);
 x.core.advance();assert.equal(x.core.run.phase,'guided');assert.match(x.root.innerHTML,/Look & Write.*butterfly/s);
 x.core.advance();assert.equal(x.core.run.phase,'guided','cannot skip writing');
 x.core.run.answer='butterfly';x.core.advance();assert.equal(x.core.run.phase,'hidden');assert.doesNotMatch(x.root.innerHTML,/butterfly/,'the answer is completely hidden');
 x.core.check('butterfly');assert.equal(x.core.run.phase,'result');assert.equal(x.reward.length,1);
 x.core.next();assert.equal(x.core.run.phase,'look');
 for(let i=1;i<5;i++){x.core.advance();x.core.run.answer=x.core.run.ids[i];x.core.advance();x.core.check(x.core.run.ids[i]);x.core.next()}
 assert.equal(x.core.run.phase,'done');assert.match(x.root.innerHTML,/5 words done!.*Finish.*5 more/s);assert.equal(x.state.stats.sessions,1);
 assert(x.saved.length>=5,'each completed word saves learning progress');
});
test('Recall mistake opens a paper Practice Pad: model visible, three Pencil lines, no immediate hidden retest',()=>{
 const x=fixture(['cricket'],'my',['cricket']),w=x.state.lib.cricket;
 assert.equal(x.core.run.phase,'hidden');assert.doesNotMatch(x.root.innerHTML,/cricket/);
 x.core.check('criket');assert.equal(x.core.run.phase,'practice');
 assert.match(x.root.innerHTML,/Practice Pad.*You wrote.*criket.*correct spelling.*cricket/s);
 assert.equal((x.root.innerHTML.match(/five-practice-line/g)||[]).length,3);
 assert.match(x.root.innerHTML,/Need help\? Trace once/,'Trace is optional help, not a required step');
 x.core.completePractice();assert.equal(x.core.run.phase,'practice','three handwritten lines are required');
 x.core.run.practicePaths=[['M0 0L20 20'],['M0 0L20 20'],['M0 0L20 20']];
 x.core.completePractice();assert.equal(x.core.run.phase,'result');assert.equal(w.learn.five.needsRecall,true);
 assert.equal(w.learn.five.recallSuccess,0);assert.equal(x.reward.length,0,'Practice Pad completion is not recall mastery or Garden growth');
 assert.match(x.root.innerHTML,/remember it again later/i);
 x.core.next();assert.equal(x.core.run.phase,'done');
 const restored=JSON.parse(x.saved.at(-1));assert.equal(restored.lib.cricket.learn.five.introduced,true);
});
test('New-word mistake is practiced on paper, then becomes audio-only recall on a later loop',()=>{
 const x=fixture(['butterfly'],'week');x.core.advance();x.core.run.answer='butterfly';x.core.advance();x.core.check('buterfly');
 assert.equal(x.core.run.phase,'practice');
 x.core.run.practicePaths=[['M0 0L20 20'],['M0 0L20 20'],['M0 0L20 20']];x.core.completePractice();x.core.next();
 assert.equal(x.state.lib.butterfly.learn.five.needsRecall,true);
 const y=fixture(['butterfly'],'week');y.state.lib.butterfly.learn=x.state.lib.butterfly.learn;
 // Loading the saved learning record starts on Listen & Write, never LOOK again.
 const ctx={window:{},setTimeout(){},navigator:{}};vm.createContext(ctx);vm.runInContext(focusSource,ctx);vm.runInContext(src,ctx);
 const resumed=ctx.window.FiveWordsCore.create({lane:'week',ids:['butterfly'],state:y.state,root:y.root,save(){},audio(){},resolveAudio:async()=>{},normalize:s=>s,escape:s=>s,diff:()=>'',sfx(){},focus:ctx.window.FiveWordsFocus,markResult(){},home(){},more(){},onRemembered(){}});
 assert.equal(resumed.run.phase,'hidden');assert.deepEqual(Array.from(resumed.run.ids),['butterfly']);
 assert(page.includes('five-words-core.js?v=20261002-v62')&&page.includes('five-words-core.css?v=20261002-v62'));
});
test('Play entry gives This Week and My Words their own exact pool, even for an overlapping word',()=>{
 const app=fs.readFileSync('app.js','utf8'),start=app.indexOf('function fiveManual(lane){'),end=app.indexOf('// A weekly exam',start);
 assert(start>=0&&end>start);
 const seen=[],state={week:{id:'current',ids:['alpha','beta','gamma','delta','epsilon','zeta'],focusIds:[]},myWords:{journal:{},alpha:{}},lib:Object.fromEntries(['alpha','beta','gamma','delta','epsilon','zeta','journal'].map(id=>[id,{id}]))};
 const ctx={state,session:{},fiveWords:null,window:{FiveWordsCore:{create:args=>{seen.push(args);return{render(){}}}},FiveWordsSelection:{select:args=>[...new Set([...(args.manual||[]),...args.ids])].filter(id=>state.lib[id]).slice(0,5),markResult(){}},FiveWordsFocus:{}},playSfx(){},syncBgm(){},helpKind:'',toast(){},$:()=>({}),save(){},playWordAudio(){},resolveHumanAudioForWord(){},weeklyAnswerText(){},flowComparisonHtml(){},esc(){},renderPlayHome(){},rewards:[]};
 vm.createContext(ctx);vm.runInContext(app.slice(start,end),ctx);ctx.startFiveWords('week');ctx.startFiveWords('my');
 assert.deepEqual(Array.from(seen[0].ids),['alpha','beta','gamma','delta','epsilon']);
 assert.deepEqual(Array.from(seen[1].ids),['journal','alpha']);
 assert.equal(seen[0].lane,'week');assert.equal(seen[1].lane,'my');
 const queued=ctx.fiveManual('week');queued.ids=['zeta','gamma'];queued.pending=true;
 assert.deepEqual(JSON.parse(JSON.stringify(state.fiveWordManual.week.ids)),['zeta','gamma'],'Next 5 is serializable before a session');
 ctx.startFiveWords('week');assert.deepEqual(Array.from(seen[2].ids).slice(0,2),['zeta','gamma']);
 assert.equal(queued.pending,false);assert.deepEqual(Array.from(queued.ids),[],'one-off selection is consumed after starting');
});
