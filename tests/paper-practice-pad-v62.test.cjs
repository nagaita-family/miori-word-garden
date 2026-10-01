'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');

const core=fs.readFileSync('five-words-core.js','utf8');
const css=fs.readFileSync('five-words-core.css','utf8');
const palm=fs.readFileSync('pencil-touch-guard.js','utf8');
const html=fs.readFileSync('index.html','utf8');

test('Practice Pad is paper-style Pencil ink, not an immediate spelling retest',()=>{
  assert(core.includes("run.phase=correct?'result':'practice'"));
  assert(core.includes('five-practice-line'));
  assert(core.includes('five-practice-ink'));
  assert(core.includes('Look at the correct spelling'));
  assert(core.includes('Write it three times with your Pencil.'));
  assert(core.includes('Need help? Trace once'));
  assert(core.includes("run.practicePaths.every(paths=>paths.length)"));
  for(const old of ['padTrace','padCopy','padHidden'])assert(!core.includes(old),old+' should no longer be a required Practice Pad phase');
  assert(!core.includes('five-practice-input'),'practice rows should remain raw Pencil ink rather than Scribble text fields');
});

test('paper lines have real ink styling and palm protection',()=>{
  assert.match(css,/\.five-practice-line[\s\S]*touch-action:none/);
  assert.match(css,/\.five-practice-ink path[\s\S]*stroke:/);
  assert(palm.includes('#playView .five-words-view .five-practice-line'));
  assert(palm.includes('.five-practice-line,.five-trace-pad'));
});

test('v62 assets are cache-busted',()=>{
  assert(html.includes('five-words-core.css?v=20261002-v62'));
  assert(html.includes('five-words-core.js?v=20261002-v62'));
  assert(html.includes('pencil-touch-guard.js?v=20261002-v62'));
  assert(html.includes('v62 · Oct 2'));
});
