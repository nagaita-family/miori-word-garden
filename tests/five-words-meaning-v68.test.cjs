'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('five-words-core.js','utf8');
const focus=fs.readFileSync('five-words-focus.js','utf8');
const packSync=fs.readFileSync('school-pack-sync.js','utf8');
const css=fs.readFileSync('five-words-core.css','utf8');
const page=fs.readFileSync('index.html','utf8');
function fixture(lane,word,schoolEn='',schoolJa='',introduced=false){
 const state={lib:{[word.word]:{...word,learn:{attempts:0,correct:0,first:0,mistakes:0,loops:0,stageMist:{4:0},five:{introduced,recallSuccess:0}}}},stats:{answers:0,sessions:0},week:{schoolMeaningById:{[word.word]:schoolEn},schoolMeaningJaById:{[word.word]:schoolJa}},recentWords:[]};
 const nodes=new Map(),root={innerHTML:'',querySelector(id){if(!nodes.has(id))nodes.set(id,{hidden:true,attributes:{},value:'',setAttribute(k,v){this.attributes[k]=v},addEventListener(){},querySelector(){return{}},blur(){}});return nodes.get(id)},querySelectorAll(){return[]}};
 const ctx={window:{},setTimeout(){},navigator:{}};vm.createContext(ctx);vm.runInContext(focus,ctx);vm.runInContext(core,ctx);
 const saved=[],rewards=[];
 const instance=ctx.window.FiveWordsCore.create({lane,ids:[word.word],state,root,save:()=>saved.push(1),audio(){},resolveAudio:async()=>{},normalize:t=>String(t||'').toLowerCase().replace(/[^a-z]/g,''),escape:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'),diff:()=>'',sfx(){},markResult(){},focus:ctx.window.FiveWordsFocus,onRemembered:w=>rewards.push(w.word),home(){},more(){}});
 return{instance,root,state,rewards,nodes};
}
test('New word: the spelling, school Japanese gloss and original English definition are learned together',()=>{
 const x=fixture('week',{id:'bizarre',word:'bizarre',meaningEn:'personal meaning',meaningJa:'ローカルの意味'},'strange and weird','奇妙な、変わった');
 assert.equal(x.instance.run.phase,'look');
 assert.match(x.root.innerHTML,/bizarre/);
 assert.match(x.root.innerHTML,/奇妙な、変わった/);
 assert.match(x.root.innerHTML,/strange and weird/);
 assert.doesNotMatch(x.root.innerHTML,/ローカルの意味/);
 x.instance.advance();assert.equal(x.instance.run.phase,'guided');
 assert.match(x.root.innerHTML,/奇妙な、変わった/);
 assert.doesNotMatch(x.root.innerHTML,/strange and weird/,'guided Pencil view stays compact');
});
test('My Words uses its own explanation and is not replaced by the school definition',()=>{
 const x=fixture('my',{id:'bizarre',word:'bizarre',meaningEn:'my own meaning',meaningJa:'自分で書いた意味'},'school meaning','学校の意味');
 assert.match(x.root.innerHTML,/my own meaning/);
 assert.match(x.root.innerHTML,/自分で書いた意味/);
 assert.doesNotMatch(x.root.innerHTML,/school meaning|学校の意味/);
});
test('Recall asks for meaning but hides target spelling; optional reveal never replaces the input',()=>{
 const x=fixture('week',{id:'spook',word:'spook',meaningEn:'a spook in the hall',meaningJa:'spook を思い出す'},'to spook someone','人を怖がらせる',true);
 assert.equal(x.instance.run.phase,'hidden');
 assert.match(x.root.innerHTML,/What does it mean\?/);
 assert.match(x.root.innerHTML,/Check meaning/);
 assert.doesNotMatch(x.root.innerHTML,/spook/i,'even a definition containing the target must not reveal the answer');
 const input=x.root.querySelector('#fiveInput'),toggle=x.root.querySelector('#fiveMeaningReveal'),reveal=x.root.querySelector('#fiveMeaningAnswer');
 input.value='sp';
 assert.equal(reveal.hidden,true);
 toggle.onclick();
 assert.equal(reveal.hidden,false);
 assert.equal(input.value,'sp','meaning reveal does not destroy existing Pencil text');
 assert.equal(toggle.attributes['aria-expanded'],'true');
 toggle.onclick();assert.equal(reveal.hidden,true);
 x.instance.check('spook');assert.equal(x.instance.run.phase,'result');
 assert.match(x.root.innerHTML,/人を怖がらせる/);
 assert.match(x.root.innerHTML,/to spook someone/);
 assert.equal(x.rewards.length,1,'meaning prompts do not alter spelling reward rules');
});
test('The Practice Pad still has three lines and now reminds the meaning',()=>{
 const x=fixture('my',{id:'hayride',word:'hayride',meaningEn:'a ride with hay',meaningJa:'干し草を積んだ車に乗ること'},'','',true);
 x.instance.check('hayrid');assert.equal(x.instance.run.phase,'practice');
 assert.match(x.root.innerHTML,/干し草を積んだ車に乗ること/);
 assert.equal((x.root.innerHTML.match(/class="five-practice-line"/g)||[]).length,3);
 assert.match(x.root.innerHTML,/Need help\? Trace once/);
 assert.equal(x.rewards.length,0);
});
test('Meaning is not fabricated if the Word Pack or My Words does not supply one',()=>{
 const x=fixture('my',{id:'untested',word:'untested',meaningEn:'',meaningJa:''},'','');
 assert.match(x.root.innerHTML,/Ask if you are not sure/);
});
test('The school pack keeps Japanese and English meanings separately without resetting My Words',()=>{
 const ctx={window:{}};vm.runInNewContext(packSync,ctx);const sync=ctx.window.SchoolPackSync;
 const pack=JSON.parse(fs.readFileSync('word-packs/current.json','utf8'));
 const id=pack.words[0].word.toLowerCase();
 const oldLearn={loops:11,stageMist:{4:2},five:{starred:true,parentFocus:{indices:[0]}}};
 const state={lib:{[id]:{id,word:id,displayWord:pack.words[0].word,meaningJa:'親の説明',meaningEn:'My explanation',learn:oldLearn}},myWords:{[id]:{source:'Reading',note:'Miori note'}},pastWeeks:[],week:{id:pack.weekId,title:pack.weekName,ids:pack.words.map(w=>w.word.toLowerCase()),focusIds:[id]},schoolPackSync:{weekId:pack.weekId,signature:JSON.stringify({weekId:pack.weekId,title:pack.weekName,words:pack.words})}};
 const deps={norm:s=>s.toLowerCase(),normalizeWord:(raw,old)=>({...old,...raw,word:raw.word.toLowerCase(),learn:old?.learn||{}}),archiveWeek(){throw Error('Should not archive')},ensureLearningGroups(){}};
 assert.equal(sync.apply(state,pack,deps).status,'updated','backfill school meanings once');
 assert.equal(state.week.schoolMeaningById[id],pack.words[0].meaningEn);
 assert.equal(state.week.schoolMeaningJaById[id],pack.words[0].meaningJa);
 assert.equal(state.lib[id].meaningJa,'親の説明');
 assert.equal(state.lib[id].learn,oldLearn);
 assert.equal(state.myWords[id].note,'Miori note');
 assert.equal(sync.apply(state,pack,deps).status,'unchanged');
});
test('The UI remains a compact non-modal meaning cue and uses versioned assets',()=>{
 assert.match(css,/\.five-meaning-card/);
 assert.match(css,/\.five-meaning-reveal/);
 assert.match(core,/id="fiveMeaningAnswer" hidden/);
 assert.match(core,/run\.phase=correct\?'result':'practice'/);
 assert(page.includes('five-words-core.js?v=20261026-v68'));
 assert(page.includes('five-words-core.css?v=20261026-v68'));
 assert(page.includes('school-pack-sync.js?v=20261026-v68'));
 assert(page.includes('v68 · Oct 26'));
});
