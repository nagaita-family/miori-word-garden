'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const guard=fs.readFileSync('weekly-test-palm-v25.js','utf8');
const v24=fs.readFileSync('weekly-test-v24.css','utf8');
const section=(first,last)=>{const start=src.indexOf(first);const end=src.indexOf(last,start+first.length);assert(start>=0&&end>start,`Missing section ${first}`);return src.slice(start,end)};
const result=section('function renderWeeklyResult(){','function practiceIds(){');
const task=section('function renderTask(){','function questionHtml(');
const stageTransition=section('function right(w,q){','function renderReward(');
const grading=section('function gradeWeeklyTest(){','function renderWeeklyResult(){');
assert(result.includes('reviewMissed:true'),'Only a missed-word review session is marked for stages 3 and 4');
assert(result.includes('wrong.map(x=>x.id)'),'Review includes only words missed on the weekly exam');
assert(task.includes('const start=session.reviewMissed?3:'),'Missed-word review starts in stage 3 while normal routing chooses its own start stage');
assert(stageTransition.includes('newQuestion(w,stage+1,q.range)'),'Stage 3 still advances to Stage 4');
assert(stageTransition.includes('if(q.stage<4)'),'Stage 4 still completes the word');
assert(grading.includes('if(!confirm(message))return'),'Grading always requires a deliberate confirmation even when nothing is blank');
assert(grading.includes('state.weekTestResult=')&&grading.includes('delete state.weekTestDraft'),'Final grade still saves results and clears the draft');
assert(result.includes('Stage 3 → 4'),'Review button explains shortened flow');
assert(html.includes('weekly-test-palm-v25.js?v=20260917-listen-fix-v27')&&html.includes('app.js?v=20260924-living-b')&&/v[0-9]+ · Sep 24/.test(html),'v25 guard remains loaded with current app cache bust');
assert(v24.includes('overflow-y:auto')&&v24.includes('display:inline-flex!important'),'Always-visible grading layout retained');
assert(src.includes("if(kind==='week'&&isCurrentFocus(id))score+=50"),'Current-week Focus replaces the old permanent parent star');
assert(fs.readFileSync('test-mode-v21.js','utf8').includes("const TEST_KEY='mwg-v2-rebuild-test'"),'Parent Test Mode isolation retained');
// Exercise the capture-phase palm guard rather than relying only on source-text checks.
const handlers=new Map();let clock=10000;let exam=true;
const document={
  querySelector(selector){return exam&&selector==='.weekly-test-view .weekly-answer-sheet'?{}:null},
  addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn)}
};
vm.runInNewContext(guard,{document,Date:{now:()=>clock}}, {filename:'weekly-test-palm-v25.js'});
const answer={closest(selector){return selector==='.weekly-answer-sheet'?{}:null}};
const gradeButton={closest(selector){return selector==='#weeklyGradeBtn,#weeklyGradeTopBtn'?{}:null}};
function fire(type,target,extra={}){
  const e={target,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra};
  for(const fn of handlers.get(type)||[]){fn(e);if(e.stopped)break;}
  return e;
}
assert.equal(fire('pointerdown',gradeButton,{pointerType:'touch',width:1,height:1,isPrimary:true}).prevented,false,'A deliberate single-finger tap remains possible');
assert.equal(fire('click',gradeButton).prevented,false,'Normal grading click passes to confirmation');
fire('pointerdown',answer,{pointerType:'pen'});
assert.equal(fire('pointerdown',gradeButton,{pointerType:'touch',width:1,height:1,isPrimary:true}).prevented,true,'Palm touching grade while Pencil writes is blocked');
assert.equal(fire('click',gradeButton).prevented,true,'Synthetic click after blocked contact is blocked');
fire('pointerup',answer,{pointerType:'pen'});
clock+=700;
assert.equal(fire('pointerdown',gradeButton,{pointerType:'touch',width:1,height:1,isPrimary:true}).prevented,false,'Normal taps are allowed again after the Pencil cooldown');
clock+=1100;
assert.equal(fire('click',gradeButton).prevented,false,'Grading becomes available after palm contact expires');
assert.equal(fire('touchstart',gradeButton,{touches:[{},{}],changedTouches:[{}]}).prevented,true,'Two-finger palm contact blocked');
clock+=1200;
assert.equal(fire('pointerdown',gradeButton,{pointerType:'touch',width:32,height:26,isPrimary:true}).prevented,true,'Wide touch contact blocked');
clock+=1200;
assert.equal(fire('touchstart',gradeButton,{touches:[{}],changedTouches:[{radiusX:25,radiusY:5}]}).prevented,true,'Safari broad palm contact blocked');
clock+=1200;
assert.equal(fire('click',gradeButton,{detail:0}).prevented,false,'Accessible keyboard activation is not globally disabled');
exam=false;
fire('pointerdown',answer,{pointerType:'pen'});
assert.equal(fire('pointerdown',gradeButton,{pointerType:'touch',width:40,height:40,isPrimary:false}).prevented,false,'Weekly guard does not affect other views');
console.log('PASS v25: palm guard, deliberate grading, missed-only Stage 3→4 review, current practice routing, and Test Mode.');
