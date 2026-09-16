"""v29: Garden-only BGM, continuous Pencil input for Stage 4 and Stage 3 gap."""
from pathlib import Path


def change(path, old, new, label):
    p=Path(path)
    text=p.read_text(encoding='utf-8')
    count=text.count(old)
    if count!=1:raise RuntimeError(f'{label}: expected exactly one anchor, found {count}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

change('app.js',
 "function newQuestion(w,stage=1,range=null){range=range||focusRange(w);const n=stage===3?range.end-range.start:w.word.length;const q={id:w.id,stage,range,first:true,wrong:[],letters:stage>=3?Array(n).fill(''):[],traceLetters:stage===3?Array(w.word.length).fill(''):[],feedback:null,hint:null,mode:'write'};if(stage===1)q.choices=wholeChoices(w,range);if(stage===2)q.choices=gapChoices(w,range);return q}",
 "function newQuestion(w,stage=1,range=null){range=range||focusRange(w);const n=stage===3?range.end-range.start:w.word.length;const q={id:w.id,stage,range,first:true,wrong:[],letters:stage>=3?Array(n).fill(''):[],fullAnswer:'',traceLetters:stage===3?Array(w.word.length).fill(''):[],feedback:null,hint:null,mode:'write'};if(stage===1)q.choices=wholeChoices(w,range);if(stage===2)q.choices=gapChoices(w,range);return q}",
 'A full-word field persists the Stage 4 writing')
change('app.js',
 "q.stage===4?'Write one letter in each box. Scratch a written box to erase.':",
 "q.stage===4?'Write the whole word in one smooth motion. Tap Clear to try again.':",
 'Stage 4 instruction matches full-word Pencil')
change('app.js',
 "function handwritingHtml(w,q){\n  const expected=expectedText(w,q);",
 """function flowComparisonHtml(attempt,correct){
  return window.WordGardenWeeklyDiff?.render(attempt,correct)||`<small>Correct spelling: ${esc(correct)}</small>`
}
function fullWordHandwritingHtml(w,q){
  const answer=q.fullAnswer||'';
  return `<div class="spell-wrap flow-word-wrap"><p class="flow-word-note">Listen, then write the whole word without stopping between letters.</p><label class="flow-word-label" for="stage4WordInput">MY SPELLING</label><input id="stage4WordInput" class="flow-word-input" type="text" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Write the word with Apple Pencil" aria-label="Write the entire spelling word" value="${esc(answer)}"><div class="flow-word-controls"><button type="button" id="clearFlowBtn" class="secondary-btn">Clear ✎</button><button id="checkAnswerBtn" class="check-answer">Check</button></div>${q.feedback?.bad?`<div class="flow-word-diff">${flowComparisonHtml(answer,w.word)}</div>`:''}${hintHtml(q)}</div>`
}
function handwritingHtml(w,q){
  if(q.stage===4)return fullWordHandwritingHtml(w,q);
  const expected=expectedText(w,q);""",
 'Stage 4 renders one handwriting field and accessible erase/check controls')
change('app.js',
 "    const local=full-r.start;const value=q.letters[local]||'';let cls=value?'filled':'';",
 """    if(q.stage===3&&full>=r.start&&full<r.end){
      if(full===r.start){
        const attempt=q.letters.join('');
        boxes.push(`<input id="stage3GapInput" class="stage3-gap-flow ${q.feedback?.bad?'flow-needs-fix':''} ${q.hint?'hint-target':''}" style="grid-column:span ${r.end-r.start};--gap-count:${r.end-r.start}" type="text" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" value="${esc(attempt)}" placeholder="Write ${r.end-r.start===1?'letter':'letters'}" aria-label="Write the missing letters together">`);
      }
      continue;
    }
    const local=full-r.start;const value=q.letters[local]||'';let cls=value?'filled':'';""",
 'Stage 3 gap uses one short flowing field while dotted trace stays')
change('app.js',
 "  const note=stage3?`<div class=\"stage3-bridge-note\"><b>Trace → remember.</b> Follow the dotted letters from left to right, and write the empty purple boxes yourself.</div>`:`<div class=\"box-note\">Write the whole word from memory. Scratch one written box to erase only that letter.</div>`;",
 "  const note=stage3?`<div class=\"stage3-bridge-note\"><b>Trace → remember.</b> Follow the dotted letters, then write the missing letters together in the purple area.</div>`:`<div class=\"box-note\">Write the whole word from memory.</div>`;",
 'Stage 3 instruction explains fluent focus gap')
change('app.js',
 "${boxes.join('')}</div>${hintHtml(q)}<button id=\"checkAnswerBtn\" class=\"check-answer\">Check</button></div>`;",
 "${boxes.join('')}</div>${q.feedback?.bad?`<div class=\"flow-word-diff\">${flowComparisonHtml(q.letters.join(''),expected)}</div>`:''}${hintHtml(q)}<button id=\"checkAnswerBtn\" class=\"check-answer\">Check</button></div>`;",
 'Show the precise difference after Stage 3 gap check')
change('app.js',
 "function hintHtml(q){if(!q.hint)return'';return`<div class=\"hint-strip\">",
 "function hintHtml(q){if(!q.hint)return'';if(q.hint.stage4)return`<div class=\"hint-strip flow-hint\"><span>Remember this part: <b>${esc(q.hint.text)}</b></span><button id=\"hintCloseBtn\" class=\"tiny-audio\" type=\"button\" aria-label=\"Close hint\">×</button></div>`;return`<div class=\"hint-strip\">",
 'Stage 4 hint shows a short focus chunk instead of non-existent boxes')
change('app.js',
 "function feedbackText(q){if(q.feedback?.good)return q.first?'Perfect — you remembered it! ✦':'Yes! You fixed it. That counts. ♡';if(q.feedback?.bad)return'Almost. Green is right. Red or dotted boxes need a fix — stay on this stage.';return''}",
 "function feedbackText(q){if(q.feedback?.good)return q.first?'Perfect — you remembered it! ✦':'Yes! You fixed it. That counts. ♡';if(q.feedback?.bad)return q.stage===4?'Almost! Compare your letters below, then change your answer.':q.stage===3?'Almost! Check the missing letters below and try again.':'Almost. Green is right. Red or dotted boxes need a fix — stay on this stage.';return''}",
 'Feedback describes comparison rather than individual boxes')
change('app.js',
 "  $('#writeModeBtn').onclick=()=>{q.mode='write';renderTask()};$('#eraseModeBtn').onclick=()=>{q.mode='erase';renderTask()};$('#checkAnswerBtn').onclick=()=>checkHandwriting(w,q);",
 "  if(q.stage===4){$('#checkAnswerBtn').onclick=()=>checkHandwriting(w,q);$('#clearFlowBtn').onclick=()=>{q.fullAnswer='';q.feedback=null;q.hint=null;renderTask()};bindFlowWriting($('#stage4WordInput'),w,q);$('#hintCloseBtn')?.addEventListener('click',()=>{q.hint=null;renderTask()});return}\n  $('#writeModeBtn').onclick=()=>{q.mode='write';renderTask()};$('#eraseModeBtn').onclick=()=>{q.mode='erase';renderTask()};$('#checkAnswerBtn').onclick=()=>checkHandwriting(w,q);",
 'Bind Stage 4 Pencil input rather than per-character controls')
change('app.js',
 "  const boxes=$$('.letter-box[data-local]');boxes.forEach((box,index)=>bindLetterBox(box,index,w,q));$$('.trace-input[data-trace-full]').forEach(input=>bindTraceBox(input,Number(input.dataset.traceFull),w,q));",
 "  bindFlowWriting($('#stage3GapInput'),w,q);const boxes=$$('.letter-box[data-local]');boxes.forEach((box,index)=>bindLetterBox(box,index,w,q));$$('.trace-input[data-trace-full]').forEach(input=>bindTraceBox(input,Number(input.dataset.traceFull),w,q));",
 'Bind Stage 3 gap once, leave traced letters as before')
change('app.js',
 "function bindTraceBox(input,full,w,q){",
 """function bindFlowWriting(input,w,q){
  if(!input)return;
  const update=(finishComposition=true)=>{
    if(!finishComposition)return;
    const cleaned=weeklyAnswerText(input.value,expectedText(w,q));
    if(input.value!==cleaned)input.value=cleaned;
    if(q.stage===4)q.fullAnswer=cleaned;else q.letters=[...cleaned];
    q.feedback=null;q.hint=null;
    const fb=$('#feedback');if(fb){fb.textContent='';fb.className='feedback'}
    $('.flow-word-diff')?.remove();$('.hint-strip')?.remove();
    try{navigator.virtualKeyboard?.hide?.()}catch{}
  };
  input.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'){e.preventDefault();input.blur();return}
    if(e.pointerType==='pen'){
      try{if(document.activeElement!==input)input.focus({preventScroll:true})}catch{}
      try{navigator.virtualKeyboard?.hide?.()}catch{}
    }
  },true);
  input.addEventListener('input',e=>update(!e.isComposing));
  input.addEventListener('compositionend',()=>update(true));
  input.addEventListener('change',()=>update(true));
  input.addEventListener('focus',()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}});
}
function bindTraceBox(input,full,w,q){""",
 'Continuous Pencil binding avoids rerender and keeps native composition intact')
change('app.js',
 "function checkHandwriting(w,q){const attempt=q.letters.join(''),correct=expectedText(w,q);if(attempt===correct)right(w,q);else{wrong(w,q,attempt,correct);q.feedback={bad:true};q.hint=null;renderTask();playSfx('wrong')}}",
 "function checkHandwriting(w,q){const field=q.stage===4?$('#stage4WordInput'):q.stage===3?$('#stage3GapInput'):null;if(field){field.blur?.();const clean=weeklyAnswerText(field.value,expectedText(w,q));if(q.stage===4)q.fullAnswer=clean;else q.letters=[...clean]}const attempt=q.stage===4?q.fullAnswer:q.letters.join(''),correct=expectedText(w,q);if(attempt===correct)right(w,q);else{wrong(w,q,attempt,correct);q.feedback={bad:true};q.hint=null;renderTask();playSfx('wrong')}}",
 'Checks whole-word and focused-gap text including the last uncommitted Scribble input')
change('app.js',
 "function showHint(w,q){playSfx('hint');if(q.stage<3){playWordAudio(w,true);toast('Listen slowly, then try again.');return}w.learn.hints++;save();const exp=expectedText(w,q);",
 "function showHint(w,q){playSfx('hint');if(q.stage<3){playWordAudio(w,true);toast('Listen slowly, then try again.');return}w.learn.hints++;save();if(q.stage===4){q.hint={stage4:true,text:w.word.slice(q.range.start,q.range.end)};renderTask();setTimeout(()=>playWordAudio(w,true),70);return}const exp=expectedText(w,q);",
 'Give full-word stage a short optional meaningful chunk hint')
change('app.js',
 "function scheduleBgmBar(){\n  if(!audioUnlocked||!state.settings.music||bgmTimer===null)return;",
 "function scheduleBgmBar(){\n  if(currentView!=='garden'||!audioUnlocked||!state.settings.music||bgmTimer===null)return;",
 'No additional BGM phrases while playing')
change('app.js',
 "if(!audioUnlocked||!state.settings.music||bgmTimer!==null||!['garden','play'].includes(currentView))return;",
 "if(!audioUnlocked||!state.settings.music||bgmTimer!==null||currentView!=='garden')return;",
 'Start background music only in Garden')
change('app.js',
 "function syncBgm(){const should=state.settings.music&&['garden','play'].includes(currentView);if(should)startBgm();else stopBgm()}",
 "function syncBgm(){const should=state.settings.music&&currentView==='garden';if(should)startBgm();else stopBgm()}",
 'Stop BGM on Play, including Test and Review')
change('index.html',
 'aria-label="App version 28, September 17">v28 · Sep 17',
 'aria-label="App version 29, September 17">v29 · Sep 17',
 'App badge v29')
change('index.html',
 'app.js?v=20260917-weekly-lowercase-v28',
 'app.js?v=20260917-flow-writing-v29',
 'Bust previous cached app.js')
change('index.html',
 '<link rel="stylesheet" href="weekly-lowercase-v28.css?v=20260917-v28">',
 '<link rel="stylesheet" href="weekly-lowercase-v28.css?v=20260917-v28">\n  <link rel="stylesheet" href="play-flow-v29.css?v=20260917-v29">',
 'Versioned Stage 3 and Stage 4 styling')
change('index.html',
 '<!-- v28: weekly test lower-case answers, numeric Scribble recognition cleanup -->',
 '<!-- v29: Garden-only BGM and flowing Stage 3 gap/Stage 4 word handwriting -->',
 'App version comment')
for path in ['tests/weekly-test-v24.test.cjs','tests/weekly-test-v25.test.cjs','tests/weekly-lowercase-v28.test.cjs']:
    change(path,'app.js?v=20260917-weekly-lowercase-v28','app.js?v=20260917-flow-writing-v29',f'Adjust {path} cache assertion')
change('tests/weekly-lowercase-v28.test.cjs',"page.includes('v28 · Sep 17')","/v[0-9]+ · Sep 17/.test(page)",'Keep historical v28 test version-agnostic')
print('v29 guarded patch applied: Garden-only BGM and full-word/short-gap Pencil writing, with legacy checks updated.')
