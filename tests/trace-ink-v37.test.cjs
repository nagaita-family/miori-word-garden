'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('app.js','utf8');
function setup(){
 const q={mode:'write',traceLetters:[],tracePaths:{}},ctx={session:{q},document:{createElementNS(){return{attrs:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},remove(){this.removed=true}}}}};
 vm.createContext(ctx);const a=src.indexOf('function bindTracePad('),b=src.indexOf('\nfunction normalizeScribbleLetter(',a);vm.runInContext(src.slice(a,b),ctx);
 function pad(full){
  const handlers={},classes=new Set(),paths=[];
  const ink={appendChild(p){paths.push(p)},replaceChildren(){paths.splice(0)}};
  const cell={classList:{add(x){classes.add(x)},remove(x){classes.delete(x)}}};
  const el={isConnected:true,closest:()=>cell,querySelector:()=>ink,getBoundingClientRect:()=>({left:0,top:0,width:72,height:72}),setPointerCapture(){},addEventListener(t,f){handlers[t]=f}};
  ctx.bindTracePad(el,full,{word:'bat'},q);
  const emit=(t,x=4,y=4,pointerType='pen')=>handlers[t]({pointerId:1,pointerType,clientX:x,clientY:y,preventDefault(){}});
  return{emit,paths,classes,el};
 }
 return{q,ctx,pad};
}
test('Adjacent Pencil strokes complete independently without waiting for recognition',()=>{
 const {q,pad}=setup(),a=pad(0),b=pad(1);
 a.emit('pointerdown');b.emit('pointerdown');a.emit('pointermove',20,20);b.emit('pointermove',35,35);
 b.emit('pointerup',35,35);a.emit('pointerup',20,20);
 assert.equal(q.traceLetters[0],'b');assert.equal(q.traceLetters[1],'a');
 assert.match(q.tracePaths[0][0],/^M4 4 L20 20$/);assert.equal(a.paths.length,1);
});
test('A tap or finger cannot complete a traced letter',()=>{
 const {q,pad}=setup(),a=pad(0);
 a.emit('pointerdown');a.emit('pointerup');assert.equal(q.traceLetters[0],undefined);
 a.emit('pointerdown',4,4,'touch');a.emit('pointermove',40,40,'touch');a.emit('pointerup',40,40,'touch');assert.equal(q.traceLetters[0],undefined);
});
test('Multiple strokes stay on the same cell and Eraser clears only its own strokes',()=>{
 const {q,pad}=setup(),a=pad(0),b=pad(1);
 for(const item of [a,b]){item.emit('pointerdown');item.emit('pointermove',25,25);item.emit('pointerup',25,25)}
 a.emit('pointerdown');a.emit('pointermove',35,35);a.emit('pointerup',35,35);
 assert.equal(q.tracePaths[0].length,2);
 q.mode='erase';a.emit('pointerdown');assert.equal(q.traceLetters[0],'');assert.equal(q.tracePaths[0].length,0);assert.equal(q.traceLetters[1],'a');
});
test('A cancelled stroke and a stale question do not mark completion',()=>{
 const {q,ctx,pad}=setup(),a=pad(0);a.emit('pointerdown');a.emit('pointermove',30,30);a.emit('pointercancel');assert.equal(q.traceLetters[0],undefined);
 a.emit('pointerdown');a.emit('pointermove',30,30);ctx.session={q:{}};a.emit('pointerup');assert.equal(q.traceLetters[0],undefined);
});
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('stage3-trace-v9.css?v=20260923-v38')&&html.includes('pencil-touch-guard.js?v=20260923-v37'));
assert(html.includes('v52 · Sep 25'));

test('A traced guide shows retained ink without a correctness check',()=>{
 const css=fs.readFileSync('stage3-trace-v9.css','utf8');
 assert(css.includes('.trace-cell.traced{')&&css.includes('border-color:#bca5d5'));
 assert(css.includes('.trace-ink path')&&!css.includes('content:"✓"'));
});
