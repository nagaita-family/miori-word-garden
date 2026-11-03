'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8');
const start=app.indexOf('function bindWordGroupControls(){');
const end=app.indexOf('\n\n// Only sourced',start);
assert(start>=0&&end>start,'Parent control binder found');
const source=app.slice(start,end);

test('every Parent This Week Listen and Slow button receives a working handler',()=>{
  const mk=id=>({dataset:{id}});
  const normal=[mk('hour'),mk('year')],slow=[mk('hour'),mk('year')],edit=[mk('hour')];
  const bySelector={'.group-audio':normal,'.group-audio-slow':slow,'.group-edit':edit};
  const heard=[],edited=[];
  const ctx={
    '$$':selector=>bySelector[selector]||[],
    '$':()=>{throw Error('Single-element selector must not be used for a button list');},
    state:{lib:{hour:{word:'hour'},year:{word:'year'}}},
    playWordAudio:(word,isSlow,opts)=>heard.push([word.word,isSlow,opts.userInitiated]),
    openWordModal:id=>edited.push(id)
  };
  vm.runInNewContext(source+'\nbindWordGroupControls();',ctx);
  for(const b of [...normal,...slow,...edit])assert.equal(typeof b.onclick,'function');
  normal[0].onclick();slow[0].onclick();normal[1].onclick();slow[1].onclick();
  edit[0].onclick();
  assert.deepEqual(heard,[['hour',false,true],['hour',true,true],['year',false,true],['year',true,true]]);
  assert.deepEqual(edited,['hour']);
});

test('Parent audio bindings never call forEach on one selected element',()=>{
  assert.match(source,/\$\$\('\.group-audio'\)\.forEach/);
  assert.match(source,/\$\$\('\.group-audio-slow'\)\.forEach/);
});
