'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
 const helper=fs.readFileSync('word-auto-fill-v34.js','utf8');
 let fetchCount=0;
 const wiktionary={parse:{wikitext:{'*':'=={{L|fr}}==\n===名詞===\n# 間違った言語\n=={{L|en}}==\n===接続詞===\n# {{lb|en|reason}} [[なぜなら]]。\n=={{L|fr}}==\n# mauvais'}}};
 const english=[{word:'because',meanings:[{partOfSpeech:'conjunction',definitions:[{definition:'For the reason that.',example:'I stayed inside because it rained.'}]}]}];
 const ctx={window:{},AbortController,setTimeout,clearTimeout,fetch:async url=>{
   fetchCount++;
   if(url.includes('/because')||url.includes('page=because'))return{ok:true,json:async()=>url.includes('dictionaryapi.dev')?english:wiktionary};
   throw new TypeError('Simulated CORS / offline failure');
 }};
 vm.createContext(ctx);vm.runInContext(helper,ctx);
 for(const [word,ja,emoji] of [['summer','夏','☀️'],['friend','友達、友人','🧑‍🤝‍🧑'],['with','～と一緒に、～を使って','🤝']]){
   const result=await ctx.window.WordGardenAutoFill.lookup(word);
   assert.equal(result.fields.meaningJa,ja,`${word}: Japanese meaning must work offline`);
   assert.ok(result.fields.meaningEn,`${word}: English meaning must work offline`);
   assert.ok(result.fields.example,`${word}: example must work offline`);
   assert.ok(result.fields.pictureCue,`${word}: picture idea must work offline`);
   assert.equal(result.fields.pictureEmoji,emoji);
   assert.equal(result.sources.meaningJa,'Word Garden built-in basic glossary');
   assert.equal(result.lookupUnavailable,true);
 }
 const prior=fetchCount;
 await ctx.window.WordGardenAutoFill.lookup('summer');
 assert.ok(fetchCount>prior,'failed network lookups are retryable, not permanently cached');
 const basic=await ctx.window.WordGardenAutoFill.lookup('teacher');
 assert.equal(basic.fields.meaningJa,'先生','other basic words have offline coverage');
 const because=await ctx.window.WordGardenAutoFill.lookup('because');
 assert.equal(because.fields.meaningEn,'For the reason that.');
 assert.equal(because.fields.meaningJa,'なぜなら','{{L|en}} Wiktionary headings must be recognized; French entry must not leak');
 const cached=fetchCount;await ctx.window.WordGardenAutoFill.lookup('because');assert.equal(fetchCount,cached,'successful dictionary responses remain cached');
 const missing=await ctx.window.WordGardenAutoFill.lookup('notawordzzzz');
 assert.equal(missing.fields.meaningJa,undefined,'unknown words are never assigned made-up Japanese');
 assert.equal(missing.fields.meaningEn,undefined,'unknown words are never assigned made-up English');
 console.log('PASS v35: summer/friend/with and basic glossary work offline; real Wiktionary heading variants parse; offline results can retry; real misses stay empty.');
})().catch(e=>{console.error(e);process.exitCode=1});
