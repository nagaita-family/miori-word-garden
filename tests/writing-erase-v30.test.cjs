'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const js=fs.readFileSync('writing-erase-v30.js','utf8');
const css=fs.readFileSync('writing-erase-v30.css','utf8');
const page=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const listeners=new Map();
const document={addEventListener(type,fn){(listeners.get(type)||listeners.set(type,[]).get(type)).push(fn)},createElement(tag){return makeElement(tag)}};
function fire(type,target,extra={}){const event={target,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...extra};for(const listener of listeners.get(type)||[])listener(event);return event}
function makeElement(tag){
  const events={};
  return {tag,children:[],isConnected:false,attributes:{},setAttribute(k,v){this.attributes[k]=v},addEventListener(type,cb){events[type]=cb},click(){events.click?.()},appendChild(child){this.children.push(child);child.parent=this},remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)},closest(selector){return selector==='.writing-erase-tools'&&(this.className==='writing-erase-tools'||this.parent?.className==='writing-erase-tools')?this.className==='writing-erase-tools'?this:this.parent:null}};
}
function writingInput(selector,original){
  const input={value:original,isConnected:true,blurred:0,events:[],matches(query){return query.split(',').includes(selector)},blur(){this.blurred++},insertAdjacentElement(position,el){assert.equal(position,'afterend');el.isConnected=true;this.tools=el},dispatchEvent(event){this.events.push(event.type);this.saved=this.value}};
  return input;
}
vm.runInNewContext(js,{document,Event:class{constructor(type,opts){this.type=type;this.bubbles=opts?.bubbles}}});
const step4=writingInput('#stage4WordInput','ladybug');
assert.equal(step4.tools,undefined,'No tools before writing begins');
fire('focusin',step4);
assert.equal(step4.tools.children.length,2,'Only two buttons appear beside focused Step 4 field');
const [back,clear]=step4.tools.children;
assert.equal(back.textContent,'⌫ One letter');assert.equal(clear.textContent,'✕ Clear all');
back.click();assert.equal(step4.value,'ladybu');assert.equal(step4.saved,'ladybu');
back.click();assert.equal(step4.value,'ladyb','One-letter button can be repeated without re-focusing');
clear.click();assert.equal(step4.value,'');assert.equal(step4.saved,'');
assert.equal(step4.events.length,3,'All corrections invoke original app input event');
let test=writingInput('.weekly-answer','honeybee');
fire('focusin',test);
assert.equal(step4.tools.isConnected,false,'Old field buttons disappear when another answer receives focus');
assert.equal(test.tools.children.length,2,'Focused weekly answer gets its own two buttons');
const [testBack,testClear]=test.tools.children;
testBack.click();assert.equal(test.value,'honeybe');assert.equal(test.saved,'honeybe','Weekly draft input event fires');
testClear.click();assert.equal(test.saved,'','Clear saves blank draft');
const other=writingInput('.weekly-answer','ladybug');
fire('focusin',other);assert.equal(test.tools.isConnected,false,'Previous Test row is no longer cluttered');
assert.equal(other.tools.isConnected,true);
const fakeOutside={closest(){return null}};
fire('pointerdown',fakeOutside);assert.equal(other.tools.isConnected,false,'Leaving the writing field hides both buttons');
fire('focusin',other);assert.equal(other.tools.isConnected,true,'Returning to an answer reopens its buttons');
const copy=fire('copy',other),cut=fire('cut',other),paste=fire('paste',other),menu=fire('contextmenu',other);
assert(copy.defaultPrevented&&cut.defaultPrevented&&paste.defaultPrevented&&menu.defaultPrevented,'Native editing commands blocked only for these writing fields');
assert.equal(fire('copy',fakeOutside).defaultPrevented,false,'Other app areas keep native behaviors');
assert(css.includes('-webkit-touch-callout:none')&&!css.includes('user-select:none'),'Avoid callout without disabling Pencil selection engine');
assert(css.includes('.flow-word-controls #clearFlowBtn{display:none!important}'),'Old persistent clear is replaced, not duplicated');
assert(page.includes('writing-erase-v30.css')&&page.includes('writing-erase-v30.js'),'Page loads local-only eraser assets');
assert(page.includes('v46 · Sep 24'),'Current version badge remains updated alongside v30 erasers');
assert(app.includes('input.dispatchEvent')===false||app.includes('weeklyAnswerText'),'Existing answer normalization not replaced');
assert(app.includes('weeklyTest.answers[id]=cleaned;saveWeeklyDraft()'),'Weekly test still saves after input');
assert(app.includes('if(q.stage===4)q.fullAnswer=cleaned'),'Step 4 still updates its own answer from input');
console.log('PASS v30: two buttons only for active writing field, repeated backspace, clear and persistence events, test row switching, controls hide, native menu suppression, original Scribble/app preserved.');
