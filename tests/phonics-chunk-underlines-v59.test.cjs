'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

const focusSource=fs.readFileSync('five-words-focus.js','utf8');
const css=fs.readFileSync('five-words-focus.css','utf8');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(focusSource,ctx);
const f=ctx.window.FiveWordsFocus;

test('one-letter phonics chunks are valid and render as separate underline spans',()=>{
  assert.deepEqual(Array.from(f.chunks('bought',['b','ough','t'])),['b','ough','t']);
  assert.deepEqual(Array.from(f.chunks('wrote',['wr','ote'])),['wr','ote']);
  assert.equal(f.chunks('bought',['b','ough','x']),null);
  const shown=f.display({word:'bought',chunks:['b','ough','t'],learn:{five:{parentFocus:{start:1,length:4}}}},null,x=>x);
  assert.equal((shown.match(/class="five-chunk"/g)||[]).length,3);
  assert.match(shown,/five-chunk">b<\/span><span class="five-chunk"><mark class="five-focus">ough<\/mark><\/span><span class="five-chunk">t/);
});

test('chunk styling is quiet underline grouping while Focus remains the highlighter',()=>{
  assert.match(css,/\.five-chunk[\s\S]*border-bottom/);
  assert.match(css,/\.five-focus[\s\S]*#ffeda4/);
  assert.doesNotMatch(css,/\.five-chunk[\s\S]{0,180}background:/,'Chunk itself does not add a competing color block');
});

test('current saved past-tense words receive curated chunks without re-importing the pack',()=>{
  for(const token of [
    "talked:['talk','ed']","hoped:['hope','d']","missed:['miss','ed']",
    "collected:['col','lect','ed']","emptied:['empt','ied']","grabbed:['grab','b','ed']",
    "wrote:['wr','ote']","bought:['b','ough','t']","drew:['dr','ew']","ate:['ate']"
  ]) assert(app.includes(token),token);
  assert(app.includes('function hydrateChunkSeeds(s)'));
  assert(app.includes('seedSchoolWords(s);hydrateChunkSeeds(s);ensureLearningGroups(s)'));
  assert(app.includes('raw.chunks??old?.chunks??WORD_CHUNKS[word]'));
});

test('v59 chunk assets are cache-busted',()=>{
  assert(html.includes('five-words-focus.css?v=20261001-v59'));
  assert(html.includes('five-words-focus.js?v=20261008-v66'));
  assert(html.includes('app.js?v=20261008-v66'));
  assert(html.includes('v66 · Oct 8'));
});
