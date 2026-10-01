'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

const app=fs.readFileSync('app.js','utf8');
const focusSource=fs.readFileSync('five-words-focus.js','utf8');
const start=app.indexOf('function openFiveFocusEditor(id){');
const end=app.indexOf('function renderFiveParentControls(){',start);
assert(start>=0&&end>start);

test('Parent Focus picker binds every letter, previews the range, and saves it',()=>{
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
  buttons[4].onclick(); // h
  assert.match(preview.innerHTML,/b<mark>ough<\/mark>t/);
  assert(buttons.slice(1,5).every(b=>b.classList.selected));
  saveBtn.onclick();
  assert.equal(word.learn.five.parentFocus.start,1);
  assert.equal(word.learn.five.parentFocus.length,4);
  assert.equal(saves,1);
  assert.equal(renders,1);
  assert.equal(modalRoot.innerHTML,'');
  assert.match(lastToast,/Focus Spot/);
});

test('v60 app cache/version markers are current',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert(html.includes('app.js?v=20261002-v60'));
  assert(html.includes('v60 · Oct 2'));
});
