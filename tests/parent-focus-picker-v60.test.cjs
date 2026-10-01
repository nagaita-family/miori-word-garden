'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

const app=fs.readFileSync('app.js','utf8');
const focusSource=fs.readFileSync('five-words-focus.js','utf8');
const start=app.indexOf('function openFiveFocusEditor(id){');
const end=app.indexOf('function renderFiveParentControls(){',start);
assert(start>=0&&end>start);

test('Parent Focus picker toggles individual letters, allows gaps, and saves them',()=>{
  const word={id:'bought',word:'bought',learn:{loops:0,stageMist:{4:0}}};
  const state={lib:{bought:word}};
  const modalRoot={innerHTML:''},picker={},preview={innerHTML:''},note={textContent:''};
  const close={},cancel={},clear={},saveBtn={};
  const buttons=[...word.word].map((ch,i)=>({
    dataset:{focusLetter:String(i)},
    classList:{selected:false,toggle(name,on){if(name==='selected')this.selected=!!on}},
    onclick:null
  }));
  const map={
    '#modalRoot':modalRoot,'#focusLetterPicker':picker,'#focusPreview':preview,'#focusPickerNote':note,
    '#closeFocusPicker':close,'#cancelFocusPicker':cancel,'#clearFocusPicker':clear,'#saveFocusPicker':saveBtn
  };
  const $=(selector)=>selector==='[data-focus-letter]'?buttons[0]:map[selector]||null;
  const $$=(selector,root)=>selector==='[data-focus-letter]'&&root===picker?buttons:[];
  let saves=0,renders=0,lastToast='';
  const ctx={window:{},state,$,$$,esc:s=>String(s),save:()=>saves++,renderParent:()=>renders++,toast:s=>{lastToast=s}};
  vm.createContext(ctx);vm.runInContext(focusSource,ctx);vm.runInContext(app.slice(start,end),ctx);

  assert.doesNotThrow(()=>ctx.openFiveFocusEditor('bought'),'opening the picker must not treat one Element as a list');
  assert.equal(typeof buttons[1].onclick,'function');
  buttons[1].onclick(); // o
  buttons[3].onclick(); // g, leaving u and h unselected
  assert.match(preview.innerHTML,/b<mark>o<\/mark>u<mark>g<\/mark>ht/);
  assert.equal(buttons[1].classList.selected,true);
  assert.equal(buttons[2].classList.selected,false);
  assert.equal(buttons[3].classList.selected,true);
  saveBtn.onclick();
  assert.deepEqual(Array.from(word.learn.five.parentFocus.indices),[1,3]);
  assert.equal(saves,1);
  assert.equal(renders,1);
  assert.equal(modalRoot.innerHTML,'');
  assert.match(lastToast,/Focus Spot/);
});

test('v61 app cache/version markers are current',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert(html.includes('app.js?v=20261002-v63'));
  assert(html.includes('v63 · Oct 2'));
});
