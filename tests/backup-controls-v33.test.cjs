'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

(async()=>{
  const app=fs.readFileSync('app.js','utf8');
  const html=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('backup-controls-v33.css','utf8');
  assert.match(app,/id="parentImport"[^>]*type="file"/);
  assert.match(app,/id="parentRestore"[^>]*type="file"/);
  assert.match(app,/id="exportBtn"/);
  assert.match(app,/parent-backup-note/);
  assert(app.includes("$('#parentRestore').onchange=e=>"),'Restore has its own file input');
  assert(app.includes("toast('This is a backup. Please use Restore Backup instead.')"),'Word Pack cannot silently overwrite the whole app');
  assert(app.includes('JSON.stringify(state,null,2)'),'Export still serializes the full state');
  assert(html.includes('backup-controls-v33.css?v=20260917-v33')&&html.includes('app.js?v=20260917-auto-fill-v34'),'New assets are cache-busted');
  assert(html.includes('v35 · Sep 17'),'Parent changes show their version');
  assert(css.includes('.backup-restore-btn')&&css.includes('.parent-backup-note'),'Parent UI provides visual separation and an explanation');
  const start=app.indexOf('async function restoreBackup(file){');
  const end=app.indexOf('function exportBackup(){',start);
  assert(start>=0&&end>start,'Standalone restore is defined before export');
  const storage=new Map();
  const original={version:3,week:{ids:['old']},lib:{old:{id:'old',word:'old'}},garden:{growth:21,pos:{}},xp:630};
  const backup={version:3,week:{ids:['new']},lib:{new:{id:'new',word:'new'}},garden:{growth:2,pos:{}},xp:60};
  storage.set('mwg-v2-rebuild',JSON.stringify(original));
  let confirmResult=false,confirmCalls=0,renderCalls=0;
  const messages=[];
  const ctx={
    STORAGE_KEY:'mwg-v2-rebuild',state:original,console,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    loadState:()=>JSON.parse(storage.get('mwg-v2-rebuild')),
    renderParent:()=>renderCalls++,toast:msg=>messages.push(msg),
    confirm:()=>{confirmCalls++;return confirmResult}
  };
  vm.createContext(ctx);
  vm.runInContext(app.slice(start,end),ctx);
  const file=data=>({text:async()=>JSON.stringify(data),name:'saved-backup.json'});
  await ctx.restoreBackup(file({weekName:'School',words:[{word:'new'}]}));
  assert.equal(storage.get('mwg-v2-rebuild'),JSON.stringify(original),'Weekly pack cannot be restored as full backup');
  assert.equal(confirmCalls,0,'Malformed full backup is blocked before confirmation');
  await ctx.restoreBackup({text:async()=>'{not json'});
  assert.equal(storage.get('mwg-v2-rebuild'),JSON.stringify(original),'Broken JSON cannot replace saved progress');
  await ctx.restoreBackup(file(backup));
  assert.equal(confirmCalls,1,'Valid backup requires confirmation');
  assert.equal(storage.get('mwg-v2-rebuild'),JSON.stringify(original),'Cancel keeps current state');
  confirmResult=true;
  await ctx.restoreBackup(file(backup));
  assert.equal(confirmCalls,2,'Accepted backup was confirmed');
  assert.equal(storage.get('mwg-v2-rebuild'),JSON.stringify(backup),'Confirmed backup restores all state');
  assert.equal(ctx.state.xp,60,'In-memory state is updated after restore');
  assert.equal(ctx.state.garden.growth,2,'Garden progress comes from backup');
  assert.equal(ctx.state.lib.new.word,'new','Word library comes from backup');
  assert.equal(renderCalls,1,'Parent rerenders on success');
  assert(messages.some(x=>x.includes('Backup restored')),'Success is shown only after commit');
  console.log('PASS v33: distinct import/export/restore UI, invalid backup blocked, explicit overwrite confirmation, cancel preserved, complete restore and existing export retained.');
})().catch(e=>{console.error(e);process.exitCode=1});
