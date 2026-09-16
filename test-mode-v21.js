(()=>{
'use strict';

const PROD_KEY='mwg-v2-rebuild';
const TEST_KEY='mwg-v2-rebuild-test';
const MODE_KEY='mwg-v2-test-mode-v21';

const nativeGet=Storage.prototype.getItem;
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;

const rawGet=key=>nativeGet.call(window.localStorage,key);
const rawSet=(key,value)=>nativeSet.call(window.localStorage,key,value);
const rawRemove=key=>nativeRemove.call(window.localStorage,key);

function readMode(){
  try{return JSON.parse(rawGet(MODE_KEY)||'null')}catch{return null}
}

let testMode=!!readMode()?.active;

function routedKey(storage,key){
  return storage===window.localStorage&&testMode&&String(key)===PROD_KEY?TEST_KEY:key;
}

Storage.prototype.getItem=function(key){return nativeGet.call(this,routedKey(this,key))};
Storage.prototype.setItem=function(key,value){return nativeSet.call(this,routedKey(this,key),value)};
Storage.prototype.removeItem=function(key){return nativeRemove.call(this,routedKey(this,key))};

function copyProductionToTest(){
  const production=rawGet(PROD_KEY);
  if(production==null)rawRemove(TEST_KEY);else rawSet(TEST_KEY,production);
}

function startTestMode(){
  copyProductionToTest();
  rawSet(MODE_KEY,JSON.stringify({active:true,startedAt:new Date().toISOString()}));
  testMode=true;
  window.location.reload();
}

function restartTestMode(){
  if(!window.confirm('Restart Test Mode from Miori’s current real data? Current test changes will be discarded.'))return;
  copyProductionToTest();
  rawSet(MODE_KEY,JSON.stringify({active:true,startedAt:new Date().toISOString()}));
  window.location.reload();
}

function endTestMode(){
  if(!window.confirm('End Test Mode and discard all test changes? Miori’s real learning data will stay exactly as it was.'))return;
  testMode=false;
  rawRemove(MODE_KEY);
  rawRemove(TEST_KEY);
  window.location.reload();
}

function addBanner(){
  document.body.classList.toggle('mwg-test-mode',testMode);
  const old=document.getElementById('mwgTestBanner');
  if(!testMode){old?.remove();return}
  if(old)return;
  const banner=document.createElement('div');
  banner.id='mwgTestBanner';
  banner.setAttribute('role','status');
  banner.innerHTML='<b>🧪 PARENT TEST MODE</b><span>progress is temporary · Miori’s real record is safe</span>';
  document.body.appendChild(banner);
}

function injectParentPanel(){
  const parent=document.getElementById('parentView');
  if(!parent||!parent.querySelector('.parent-view')||parent.querySelector('#mwgTestPanel'))return;
  const panel=document.createElement('section');
  panel.id='mwgTestPanel';
  panel.className=`panel test-mode-panel ${testMode?'active':''}`;
  if(testMode){
    panel.innerHTML=`<div class="test-mode-copy"><p class="eyebrow">SAFE DEVICE TESTING</p><h2>🧪 Test Mode is ON</h2><p>今のPlay・Garden・Treasure・間違い記録・自己評価は、すべてテスト用データだけに保存されています。美織の本番学習記録は変更されません。</p><small>Safariを閉じてもTest Modeは続きます。終了するときはここで破棄してください。</small></div><div class="test-mode-actions"><button id="restartTestModeBtn" class="secondary-btn">↻ Restart from real data</button><button id="endTestModeBtn" class="primary-btn test-end-btn">End Test & Discard</button></div>`;
  }else{
    panel.innerHTML=`<div class="test-mode-copy"><p class="eyebrow">SAFE DEVICE TESTING</p><h2>🧪 Parent Test Mode</h2><p>現在の美織の状態をコピーして、iPad・Apple Pencil・音・Gardenなどを本番と同じように試せます。テスト中の進行は別の保存領域に入り、本番の学習記録には反映されません。</p><small>Test Modeを終了すると、テスト中の変更だけを破棄して元の本番状態へ戻ります。</small></div><div class="test-mode-actions"><button id="startTestModeBtn" class="primary-btn">Start Test Mode</button></div>`;
  }
  const principle=parent.querySelector('.parent-principle');
  if(principle)principle.insertAdjacentElement('afterend',panel);else parent.querySelector('.parent-view')?.prepend(panel);
  panel.querySelector('#startTestModeBtn')?.addEventListener('click',startTestMode);
  panel.querySelector('#restartTestModeBtn')?.addEventListener('click',restartTestMode);
  panel.querySelector('#endTestModeBtn')?.addEventListener('click',endTestMode);
}

function boot(){
  addBanner();
  injectParentPanel();
  const parent=document.getElementById('parentView');
  if(parent)new MutationObserver(()=>injectParentPanel()).observe(parent,{childList:true,subtree:false});
}

window.MWGTestMode={isActive:()=>testMode,start:startTestMode,restart:restartTestMode,end:endTestMode};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
