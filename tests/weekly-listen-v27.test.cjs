'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const guard=fs.readFileSync('weekly-test-palm-v25.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const page=fs.readFileSync('index.html','utf8');
const handlers=new Map();
let clock=5000;
let exam=true;
const document={
  querySelector(s){return exam&&s==='.weekly-test-view .weekly-answer-sheet'?{}:null},
  addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn)}
};
vm.runInNewContext(guard,{document,Date:{now:()=>clock}}, {filename:'weekly-test-palm-v25.js'});
const answer={closest(s){return s==='.weekly-answer-sheet'?{}:null}};
const grade={closest(s){return s==='#weeklyGradeBtn,#weeklyGradeTopBtn'?{}:null}};
const listen={closest(s){return null}};
const next={closest(s){return null}};
function fire(type,target,props={}){
  const event={target,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...props};
  for(const fn of handlers.get(type)||[]){fn(event);if(event.stopped)break}
  return event;
}
const tap=t=>fire('pointerdown',t,{pointerType:'touch',width:1,height:1,isPrimary:true});
assert.equal(tap(listen).prevented,false,'Listen works before writing');
fire('pointerdown',answer,{pointerType:'pen'});
assert.equal(tap(listen).prevented,false,'Listen works while Apple Pencil is writing');
assert.equal(fire('touchstart',listen,{touches:[{},{}],changedTouches:[{radiusX:25,radiusY:25}]}).prevented,false,'Listen is not trapped by palm-guard broad touch');
assert.equal(fire('click',listen).prevented,false,'Listen click is delivered while writing');
assert.equal(tap(grade).prevented,true,'Grade stays protected while Pencil is writing');
assert.equal(fire('click',grade).prevented,true,'Accidental grade synthetic click stays blocked');
assert.equal(fire('click',listen).prevented,false,'Grade suppression never swallows the next Listen click');
assert.equal(tap(next).prevented,false,'Navigation is not blocked by grading protection');
fire('pointerup',answer,{pointerType:'pen'});
clock+=200;
assert.equal(fire('click',listen).prevented,false,'Listen works immediately after Pencil lift');
assert.equal(tap(grade).prevented,true,'Grade still has a short cooldown');
clock+=1200;
assert.equal(tap(grade).prevented,false,'Intentional grade works after cooldown');
assert.equal(fire('click',grade).prevented,false,'Grading click remains available');
exam=false;
assert.equal(fire('pointerdown',grade,{pointerType:'touch',width:40,height:40,isPrimary:false}).prevented,false,'Outside weekly exam no grading guard');
const active=app.slice(app.indexOf('function setWeeklyActive('),app.indexOf('function renderWeeklyTest(){'));
const sheet=app.slice(app.indexOf('function renderWeeklyTest(){'),app.indexOf('function gradeWeeklyTest(){'));
assert(active.includes('if(readAloud)playWordAudio(')&&active.includes('userInitiated:true'),'Listen invokes word audio as a user-initiated action');
assert(sheet.includes("$$('.weekly-hear').forEach(button=>button.onclick=()=>setWeeklyActive(Number(button.dataset.index),true))"),'All ten Listen buttons are wired');
assert(page.includes('weekly-test-palm-v25.js?v=20260917-listen-fix-v27'),'Browser gets cache-busted corrected palm guard');
assert(/v[0-9]+ · Sep 24/.test(page),'A visible current version remains');
console.log('PASS v27: all Listen buttons wired, Listen works during and after Pencil and after blocked grade, grading remains protected, browser loads fresh script.');
