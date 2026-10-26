'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('five-words-core.js','utf8');
const focus=fs.readFileSync('five-words-focus.js','utf8');
const packSync=fs.readFileSync('school-pack-sync.js','utf8');
const css=fs.readFileSync('five-words-core.css','utf8');
const page=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const pack=JSON.parse(fs.readFileSync('word-packs/current.json','utf8'));
function fixture(lane,word,schoolEn='',schoolImage='',introduced=false){
 const state={lib:{[word.word]:{...word,learn:{attempts:0,correct:0,first:0,mistakes:0,loops:0,stageMist:{4:0},five:{introduced,recallSuccess:0}}}},stats:{answers:0,sessions:0},week:{schoolMeaningById:{[word.word]:schoolEn},schoolImageById:{[word.word]:schoolImage}},recentWords:[]};
 const nodes=new Map(),root={innerHTML:'',querySelector(id){if(!nodes.has(id))nodes.set(id,{hidden:true,attributes:{},value:'',setAttribute(k,v){this.attributes[k]=v},addEventListener(){},querySelector(){return{}},blur(){}});return nodes.get(id)},querySelectorAll(){return[]}};
 const ctx={window:{},setTimeout(){},navigator:{}};vm.createContext(ctx);vm.runInContext(focus,ctx);vm.runInContext(core,ctx);
 const saved=[],rewards=[];
 const instance=ctx.window.FiveWordsCore.create({lane,ids:[word.word],state,root,save:()=>saved.push(1),audio(){},resolveAudio:async()=>{},normalize:t=>String(t||'').toLowerCase().replace(/[^a-z]/g,''),escape:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'),diff:()=>'',sfx(){},markResult(){},focus:ctx.window.FiveWordsFocus,onRemembered:w=>rewards.push(w.word),home(){},more(){}});
 return{instance,root,state,rewards,nodes};
}
test('new word displays an illustration, the written target, and no Japanese meaning',()=>{
 const x=fixture('week',{id:'bizarre',word:'bizarre',meaningEn:'personal meaning',meaningJa:'ローカルの意味'},
 'strange and weird','./word-images/bizarre.svg');
 assert.equal(x.instance.run.phase,'look');
 assert.match(x.root.innerHTML,/class="five-picture" src="\.\/word-images\/bizarre\.svg"/);
 assert.match(x.root.innerHTML,/bizarre/);
 assert.match(x.root.innerHTML,/Show English meaning/);
 assert.doesNotMatch(x.root.innerHTML,/ローカルの意味|意味|奇妙/);
 x.instance.advance();assert.equal(x.instance.run.phase,'guided');
 assert.match(x.root.innerHTML,/word-images\/bizarre\.svg/,'the same image stays during guided writing');
});
test('My Words uses its own picture rather than the school picture',()=>{
 const x=fixture('my',{id:'bizarre',word:'bizarre',image:'./word-images/my-bizarre.svg',meaningEn:'my own meaning'},
 'school meaning','./word-images/bizarre.svg');
 assert.match(x.root.innerHTML,/src="\.\/word-images\/my-bizarre\.svg"/);
 assert.doesNotMatch(x.root.innerHTML,/src="\.\/word-images\/bizarre\.svg"/);
});
test('audio recall keeps the picture but hides target spelling; English explanation is opt-in',()=>{
 const x=fixture('week',{id:'spook',word:'spook',meaningEn:'a spook',meaningJa:'怖がらせる'},
 'to spook someone','./word-images/spook.svg',true);
 assert.equal(x.instance.run.phase,'hidden');
 assert.match(x.root.innerHTML,/word-images\/spook\.svg/);
 assert.match(x.root.innerHTML,/What does the picture mean\? Say it\./);
 assert.doesNotMatch(x.root.innerHTML,/class="five-guide"|class="five-target"/,'no visible spelling model during recall');
 assert.doesNotMatch(x.root.innerHTML,/>to spook someone</,'definition cannot reveal spelling');
 assert.match(x.root.innerHTML,/>to _____ someone</);
 assert.doesNotMatch(x.root.innerHTML,/怖がらせる/);
 const input=x.root.querySelector('#fiveInput'),toggle=x.root.querySelector('#fiveMeaningReveal'),reveal=x.root.querySelector('#fiveMeaningAnswer');
 input.value='sp';
 assert.equal(reveal.hidden,true);
 toggle.onclick();
 assert.equal(reveal.hidden,false);
 assert.equal(input.value,'sp','the picture/meaning toggle never destroys the Pencil input');
 assert.equal(toggle.attributes['aria-expanded'],'true');
 toggle.onclick();assert.equal(reveal.hidden,true);
 x.instance.check('spook');assert.equal(x.instance.run.phase,'result');
 assert.match(x.root.innerHTML,/word-images\/spook\.svg/);
 assert.equal(x.rewards.length,1,'meaning prompts never change spelling rewards');
});
test('wrong spelling keeps the illustration through the existing three-line Practice Pad',()=>{
 const x=fixture('my',{id:'hayride',word:'hayride',image:'./word-images/hayride.svg',meaningEn:'a ride with hay'},'','',true);
 x.instance.check('hayrid');assert.equal(x.instance.run.phase,'practice');
 assert.match(x.root.innerHTML,/word-images\/hayride\.svg/);
 assert.equal((x.root.innerHTML.match(/class="five-practice-line"/g)||[]).length,3);
 assert.match(x.root.innerHTML,/Need help\? Trace once/);
 assert.equal(x.rewards.length,0);
});
test('no picture produces a non-blocking meaning prompt, not made-up art',()=>{
 const x=fixture('my',{id:'untested',word:'untested',meaningEn:''},'','');
 assert.match(x.root.innerHTML,/five-picture-placeholder/);
 assert.match(x.root.innerHTML,/What does it mean\?/);
 assert.doesNotMatch(x.root.innerHTML,/class="five-picture" src=/);
});
test('all ten GitHub words have unique local picture files, without Japanese or spelling in artwork',()=>{
 const names=new Set();
 for(const w of pack.words){
  assert.match(w.image,/^\.\/word-images\/[a-z0-9-]+\.(svg|png|webp)$/);
  const local=w.image.replace(/^\.\//,'');
  assert(fs.existsSync(local),w.word+' picture missing');
  const contents=fs.readFileSync(local,'utf8');
  assert.match(contents,/^<svg/);
  assert.doesNotMatch(contents,/<text|<foreignObject|[\u3040-\u30ff\u3400-\u9fff]/,'no written word or Japanese in an illustration');
  assert(!names.has(w.image));names.add(w.image);
 }
 assert.equal(names.size,10);
});
test('the GitHub curriculum stores pictures separate from personal My Words',()=>{
 const ctx={window:{}};vm.runInNewContext(packSync,ctx);const sync=ctx.window.SchoolPackSync;
 const id=pack.words[0].word.toLowerCase(),learn={loops:11,stageMist:{4:2},five:{starred:true,parentFocus:{indices:[0]}}};
 const state={lib:{[id]:{id,word:id,displayWord:pack.words[0].word,image:'./word-images/my-bizarre.svg',meaningEn:'My explanation',learn}},myWords:{[id]:{source:'Reading',note:'Miori note'}},pastWeeks:[],week:{id:pack.weekId,title:pack.weekName,ids:pack.words.map(w=>w.word.toLowerCase()),focusIds:[id]},schoolPackSync:{weekId:pack.weekId,signature:JSON.stringify({weekId:pack.weekId,title:pack.weekName,words:pack.words})}};
 const deps={norm:s=>s.toLowerCase(),normalizeWord:(raw,old)=>({...old,...raw,word:raw.word.toLowerCase(),learn:old?.learn||{}}),archiveWeek(){throw Error('Should not archive')},ensureLearningGroups(){}};
 assert.equal(sync.apply(state,pack,deps).status,'updated','new image map backfills once');
 assert.equal(state.week.schoolImageById[id],pack.words[0].image);
 assert.equal(state.lib[id].image,'./word-images/my-bizarre.svg','personal picture is not overwritten');
 assert.equal(state.lib[id].learn,learn);
 assert.equal(state.myWords[id].note,'Miori note');
 assert.equal(sync.apply(state,pack,deps).status,'unchanged');
 const bad={...pack,words:pack.words.map((w,i)=>i===0?{...w,image:'https://third.party/image.png'}:w)};
 assert.throws(()=>sync.readPack(bad,s=>s.toLowerCase()),/Invalid image path/);
});
test('the in-game UI is English-only and assets have updated cache keys',()=>{
 assert.match(css,/\.five-picture-cue/);
 assert.match(css,/\.five-meaning-reveal/);
 assert.match(core,/id="fiveMeaningAnswer" class="five-meaning-en" hidden/);
 assert.doesNotMatch(core,/meaningJa|いみ|意味|日本語/);
 assert.match(core,/run\.phase=correct\?'result':'practice'/);
 assert.match(app,/image:raw\.image\?\?old\?\.image\?\?''/);
 assert(page.includes('five-words-core.js?v=20261026-v68'));
 assert(page.includes('five-words-core.css?v=20261026-v68'));
 assert(page.includes('school-pack-sync.js?v=20261026-v68'));
 assert(page.includes('v68 · Oct 26'));
});
