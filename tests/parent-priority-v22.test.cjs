const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('app.js', 'utf8');
const isolated = fs.readFileSync('test-mode-v21.js', 'utf8');
assert.match(app, /function practiceIds\(/);
assert.match(app, /function toggleParentPriority\(/);

const hook = `
globalThis.__testPriority = function () {
  const raisin = state.lib.raisin;
  assert.equal(!!raisin.parentPriority, false, 'old records default to no star');
  raisin.parentPriority = true;
  seedSchoolWords(state);
  assert.equal(state.lib.raisin.parentPriority, true, 'school-word reseed preserves star');
  const extra = normalizeWord({word:'outside'}, null);
  extra.parentPriority = true;
  state.lib.outside = extra;
  const ids = practiceIds();
  assert.ok(ids.includes('outside'), 'starred words beyond current week are eligible');
  assert.equal(new Set(ids).size, ids.length, 'no duplicate word ids');
  session = {ids, doneIds:[], last:'', count:0, goal:Math.min(10,ids.length)};
  for(let i=0;i<2;i++) {
    const picked = chooseWord();
    assert.ok(picked.parentPriority, 'starred words sort before adaptive scores');
    session.doneIds.push(picked.id);
  }
  assert.equal(!!chooseWord().parentPriority, false, 'completed stars do not repeat in one session');
  assert.equal(normalizeWord({word:'raisin'}, state.lib.raisin).parentPriority, true, 'edits and imports preserve parent flag');
  save();
  assert.equal(JSON.parse(localStorage.getItem('mwg-v2-rebuild')).lib.raisin.parentPriority, true, 'flag is saved with word data');
  renderParent=()=>{};toast=()=>{};
  toggleParentPriority('raisin');
  assert.equal(state.lib.raisin.parentPriority,false,'star is reversible');
  assert.equal(JSON.parse(localStorage.getItem('mwg-v2-rebuild')).lib.raisin.parentPriority,false,'unstar is saved');
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
    assert.equal(test.lib.outside.parentPriority,true,'star updates test store');
    assert.equal(test.lib.raisin.parentPriority,false,'star removal updates test store');
  } else {
    const realData = JSON.parse(real);
    assert.equal(realData.lib.outside.parentPriority,true,'star stored in production when not testing');
  }
  console.log(`v22 priority and storage test passed: ${testMode?'test mode':'normal mode'}`);
}
