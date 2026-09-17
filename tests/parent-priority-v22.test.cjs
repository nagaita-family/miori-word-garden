const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('app.js', 'utf8');
const isolated = fs.readFileSync('test-mode-v21.js', 'utf8');
assert.match(app, /function practiceIds\(/);
assert.match(app, /function toggleParentPriority\(/);
assert.match(app, /function setMyWord\(/);

const hook = `
globalThis.__testPriority = function () {
  const raisin = state.lib.raisin;
  assert.equal(isCurrentFocus('raisin'), false, 'current week starts without a focus star');
  state.week.focusIds=['raisin'];
  save();
  assert.equal(isCurrentFocus('raisin'), true, 'focus star belongs to the current week');
  const extra = normalizeWord({word:'outside'}, null);
  extra.parentPriority = true;
  state.lib.outside = extra;
  ensureLearningGroups(state);
  assert.equal(extra.focusHistory,true,'legacy star becomes history');
  assert.equal(extra.parentPriority,false,'legacy permanent priority flag is retired');
  assert.equal(practiceIds().includes('outside'),false,'past/legacy focus does not leak into current practice');
  setMyWord('outside',true,{source:'Journal',note:'I used this word'});
  assert.equal(practiceIds().includes('outside'),true,'My Words remain eligible across weeks');
  assert.equal(new Set(practiceIds()).size,practiceIds().length,'no duplicate word ids');
  renderParent=()=>{};toast=()=>{};
  toggleParentPriority('raisin');
  assert.equal(isCurrentFocus('raisin'),false,'this-week focus is reversible');
  save();
  const stored=JSON.parse(localStorage.getItem('mwg-v2-rebuild'));
  assert.equal(!!stored.myWords.outside,true,'My Words are saved');
  assert.equal(stored.week.focusIds.includes('raisin'),false,'cleared current focus is saved');
};
`;
const patchedApp = app.replace(/\}\)\(\);\s*$/, hook + '\n})();');
assert.notEqual(patchedApp, app, 'test hooks inserted inside app closure');

for (const testMode of [false, true]) {
  class Storage {
    constructor() { this.entries = new Map(); }
    getItem(key) { return this.entries.has(String(key)) ? this.entries.get(String(key)) : null; }
    setItem(key, value) { this.entries.set(String(key), String(value)); }
    removeItem(key) { this.entries.delete(String(key)); }
  }
  const localStorage = new Storage();
  const production = JSON.stringify({version:3,xp:17,week:{id:'',title:'Weekly',ids:[]},lib:{},garden:{growth:0,pos:{},stored:[]},settings:{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true},stats:{answers:0,sessions:0},recentWords:[]});
  localStorage.setItem('mwg-v2-rebuild', production);
  if(testMode) {
    localStorage.setItem('mwg-v2-rebuild-test', production);
    localStorage.setItem('mwg-v2-test-mode-v21',JSON.stringify({active:true}));
  }
  const document = {readyState:'loading', addEventListener(){}, querySelector(){return null}};
  const window = {localStorage, location:{reload(){}}, confirm(){return true}};
  const sandbox = vm.createContext({assert, document, window, Storage, localStorage, console});
  if(testMode) vm.runInContext(isolated, sandbox, {filename:'test-mode-v21.js'});
  vm.runInContext(patchedApp, sandbox, {filename:'app.js'});
  sandbox.__testPriority();
  const real = localStorage.entries.get('mwg-v2-rebuild');
  if(testMode) {
    assert.equal(real, production, 'TEST MODE MUST NOT mutate real data');
    const test = JSON.parse(localStorage.entries.get('mwg-v2-rebuild-test'));
    assert.equal(!!test.myWords.outside,true,'My Words update isolated test store');
    assert.equal(test.week.focusIds.includes('raisin'),false,'focus removal updates isolated test store');
  } else {
    const realData = JSON.parse(real);
    assert.equal(!!realData.myWords.outside,true,'My Words stored in production when not testing');
  }
  console.log(`v32 week-focus and storage test passed: ${testMode?'test mode':'normal mode'}`);
}
