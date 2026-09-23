'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('app.js','utf8');
function setup(){
 const q={mode:'write',traceLetters:[]},document={activeElement:null,createElement(){return{dataset:{},setAttribute(){}}}};
 const ctx={document,session:{q},navigator:{},norm:s=>String(s).toLowerCase().replace(/[^a-z]/g,'')};
 vm.createContext(ctx);
 for(const [start,end] of [['function bindTraceBox(','\nfunction '],['function normalizeScribbleLetter(','\nfunction bindLetterBox(']]){
  const a=src.indexOf(start);vm.runInContext(src.slice(a,src.indexOf(end,a+start.length)),ctx);
 }
 function field(full){
  const listeners={},classes=new Set(),cell={overlay:null,classList:{add(...s){s.forEach(x=>classes.add(x))},remove(...s){s.forEach(x=>classes.delete(x))}},querySelector(){return this.overlay},appendChild(o){this.overlay=o;o.remove=()=>{this.overlay=null}}};
  const input={value:'',isConnected:true,focusCount:0,closest:()=>cell,setAttribute(){},addEventListener(n,fn){(listeners[n]??=[]).push(fn)},focus(){document.activeElement=this;this.focusCount++},blur(){throw Error('Trace handler must not blur a pending field')},replaceWith(){throw Error('Native input must remain attached')}};
  input.emit=(n,e={})=>{for(const fn of listeners[n]||[])fn({target:input,preventDefault(){},stopPropagation(){},...e})};
  ctx.bindTraceBox(input,full,{word:'cat'},q);return{input,cell,classes};
 }
 return{q,ctx,document,field};
}
test('Second cell accepts strokes before first composition finishes; late commits stay in their original cells',()=>{
 const {q,document,field}=setup(),a=field(0),b=field(1);
 a.input.emit('pointerdown',{pointerType:'pen'});a.input.emit('compositionstart');
 a.input.value='x';a.input.emit('input',{isComposing:true});
 assert.equal(a.input.value,'x');assert.equal(q.traceLetters[0],undefined);assert.equal(a.cell.overlay,null);
 b.input.emit('pointerdown',{pointerType:'pen'});b.input.emit('compositionstart');
 a.input.value='c';a.input.emit('compositionend');
 assert.equal(document.activeElement,b.input);assert.equal(q.traceLetters[0],'c');assert.equal(a.input.isConnected,true);
 b.input.value='a';b.input.emit('compositionend');b.input.emit('input');
 assert.equal(q.traceLetters[1],'a');assert.equal(b.cell.overlay.textContent,'a');assert.equal(a.input.focusCount,1);
});
test('Composition flag protects candidates even when an input event omits isComposing',()=>{
 const {q,field}=setup(),{input,cell}=field(0);input.emit('compositionstart');input.value='c';input.emit('input');
 assert.equal(cell.overlay,null);assert.equal(q.traceLetters[0],undefined);
 input.emit('compositionend');assert.equal(q.traceLetters[0],'c');
});
test('Wrong attempt is retained until a new stroke; new composition can correct it',()=>{
 const {q,field}=setup(),{input,classes}=field(0);input.value='z';input.emit('input');
 assert.equal(input.value,'z');assert(classes.has('trace-retry'));assert.equal(q.traceLetters[0],'');
 input.emit('pointerdown',{pointerType:'pen'});assert.equal(input.value,'');
 input.emit('compositionstart');input.value='c';input.emit('compositionend');assert.equal(q.traceLetters[0],'c');
});
test('Palm contact does not blur or discard pending text; old questions ignore delayed events',()=>{
 const {q,ctx,field}=setup(),{input}=field(0);input.emit('compositionstart');input.value='c';
 input.emit('pointerdown',{pointerType:'touch'});input.emit('touchstart');assert.equal(input.value,'c');
 ctx.session={q:{}};input.emit('compositionend');assert.equal(q.traceLetters[0],undefined);
});
test('Erase affects only its own cell and ignores late recognition until writing resumes',()=>{
 const {q,field}=setup(),a=field(0),b=field(1);
 a.input.value='c';a.input.emit('input');b.input.value='a';b.input.emit('input');
 q.mode='erase';a.input.emit('pointerdown',{pointerType:'pen'});
 a.input.value='c';a.input.emit('input');assert.equal(q.traceLetters[0],'');assert.equal(q.traceLetters[1],'a');assert.equal(a.cell.overlay,null);
 q.mode='write';a.input.emit('pointerdown',{pointerType:'pen'});a.input.value='c';a.input.emit('input');assert.equal(q.traceLetters[0],'c');
});
