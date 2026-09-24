'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('play-viewport-v31.css','utf8');
const base=fs.readFileSync('styles.css','utf8');
const layout=fs.readFileSync('garden-play-v11.css','utf8');
const app=fs.readFileSync('app.js','utf8');
const page=fs.readFileSync('index.html','utf8');
function rule(selector){
  const pos=css.indexOf(selector+'{');
  assert(pos>=0,`Missing layout rule: ${selector}`);
  return css.slice(pos+selector.length+1,css.indexOf('}',pos));
}
assert(base.includes('.play-view{height:100%')&&base.includes('overflow:hidden'),'Reproduce old outer Play clipping');
assert(base.includes('.game-card{')&&base.includes('overflow:hidden'),'Reproduce old clipped game card');
assert(layout.includes('#playView .game-card:has(.letter-row)'),'Old responsive layout only targets Stage 3 after Stage 4 became a single field');
const stage=rule('#playView .play-view:has(.flow-word-wrap)');
assert(stage.includes('grid-template-rows:auto minmax(0,1fr)'),'Stage 4 is viewport-sized with a bounded card');
const card=rule('#playView .game-card:has(.flow-word-wrap)');
assert(card.includes('height:100%')&&card.includes('min-height:0'),'Stage 4 uses the available height');
assert(card.includes('overflow-y:auto')&&!card.includes('overflow:hidden'),'Stage 4 can scroll on any device or large text');
assert(card.includes('-webkit-overflow-scrolling:touch'),'Nested scrolling works with an iPad finger');
const question=rule('#playView .game-card:has(.flow-word-wrap) .question-area');
assert(question.includes('height:auto')&&question.includes('flex:1 0 auto'),'Answer can grow for feedback instead of clipping or overlapping it');
for(const selector of ['.word-audio-row','.word-visual-cue.audio-clue-panel','.flow-word-input','.flow-word-controls #checkAnswerBtn','.flow-word-diff','.feedback','.help-row.assist-dock']){
  assert(css.includes(selector+'{'),`Compact Stage 4 must include ${selector}`);
}
assert(css.includes('.weekly-diff-label:not(:first-child)')&&css.includes('.weekly-diff-cell'),'Two comparison rows and missing-character indicators are compact but retained');
assert(css.includes('@media(max-height:760px)')&&css.includes('.flow-word-note{display:none}'),'Short landscape iPads remove duplicate instructions before shrinking the writable field');
assert(css.includes('@media(max-width:620px)'),'Narrow screen support');
assert(rule('#playView .game-card:has(.letter-row)').includes('overflow-y:auto'),'Stage 3 corrections can scroll rather than vanish');
assert(rule('#playView .game-card:has(.letter-row)').includes('minmax(min-content,1fr)'),'Stage 3 comparison cannot be assigned a zero-height track');
assert(app.includes('wrong(w,q,attempt,correct);q.feedback={bad:true}')&&app.includes("renderTask();playSfx('wrong')"),'A wrong answer still renders comparison feedback before any adaptive follow-up');
assert(app.includes('flowComparisonHtml(answer,w.word)'),'Correct word comparison still exists after Stage 4 errors');
assert(page.includes('play-viewport-v31.css?v=20260917-v31'),'Browser still loads the responsive v31 CSS');
assert(page.includes('v48 · Sep 24'),'Visible version advances while v31 layout remains');
assert(page.includes('writing-erase-v30.js?v=20260917-v30'),'Previously added two erase actions remain');
assert(!css.includes('display:none!important')&&!css.includes('.flow-word-diff{display:none'),'Correction information is never hidden to squeeze the layout');
console.log('PASS v31: iPad Step 4 comparison and scrolling remain intact under v32 adaptive learning groups.');
