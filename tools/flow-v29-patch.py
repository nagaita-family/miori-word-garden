"""Guarded v29 patch: quiet Play/Test, fluent Stage 4 field, lightweight Stage 3 processing."""
from pathlib import Path

def swap(path,old,new,label):
    p=Path(path)
    text=p.read_text(encoding='utf-8')
    count=text.count(old)
    if count!=1:raise RuntimeError(f'{label}: expected 1 occurrence, found {count}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

swap('app.js',
    "if(!audioUnlocked||!state.settings.music||bgmTimer===null)return;const ctx=ensureAudioCtx();",
    "if(currentView!=='garden'||!audioUnlocked||!state.settings.music||bgmTimer===null)return;const ctx=ensureAudioCtx();",
    'No BGM bar while playing or testing')
swap('app.js',
    "if(!audioUnlocked||!state.settings.music||bgmTimer!==null||!['garden','play'].includes(currentView))return;",
    "if(!audioUnlocked||!state.settings.music||bgmTimer!==null||currentView!=='garden')return;",
    'Start BGM only in Garden')
swap('app.js',
    "function syncBgm(){const should=state.settings.music&&['garden','play'].includes(currentView);if(should)startBgm();else stopBgm()}",
    "function syncBgm(){const should=state.settings.music&&currentView==='garden';if(should)startBgm();else stopBgm()}",
    'Stop music on Play and Test while keeping SFX')
swap('app.js',
    "traceLetters:stage===3?Array(w.word.length).fill(''):[],feedback:null,hint:null,mode:'write'",
    "traceLetters:stage===3?Array(w.word.length).fill(''):[],fullAnswer:'',feedback:null,hint:null,mode:'write'",
    'Keep full word in current question without touching persisted mastery')
swap('app.js',
    "q.stage===4?'Write one letter in each box. Scratch a written box to erase.'",
    "q.stage===4?'Write the whole word smoothly on one line. Tap Check when you finish.'",
    'Stage 4 prompt now matches fluent handwriting')
swap('app.js',
    'function handwritingHtml(w,q){\n  const expected=expectedText(w,q);',
    '''function stage4HandwritingHtml(w,q){
  const answer=esc(q.fullAnswer||'');
  return`<div class="spell-wrap stage4-fluent"><div class="stage4-instruction"><b>One smooth line ✎</b><span>Write the whole word, then tap Check. You can edit or clear it.</span></div><input id="stage4Answer" class="stage4-full-answer ${q.feedback?.bad?'needs-fix':''}" type="text" value="${answer}" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" aria-label="Write the complete word with Apple Pencil" placeholder="Write with Apple Pencil"><div class="stage4-action-row"><button id="stage4ClearBtn" class="secondary-btn" type="button">Clear word</button><button id="checkAnswerBtn" class="check-answer" type="button">Check ✓</button></div>${hintHtml(q)}</div>`
}
function handwritingHtml(w,q){
  if(q.stage===4)return stage4HandwritingHtml(w,q);
  const expected=expectedText(w,q);''',
    'Render a single full-word Pencil field only for Stage 4')
swap('app.js',
    "function hintHtml(q){if(!q.hint)return'';return`<div class=\"hint-strip\"><button id=\"hintAudioBtn\" class=\"tiny-audio\">🔊</button><span>Fix the purple box:</span>${q.hint.options.map(c=>`<button class=\"hint-choice\" data-hint=\"${c}\">${c}</button>`).join('')}<button id=\"hintCloseBtn\" class=\"tiny-audio\">×</button></div>`}",
    "function hintHtml(q){if(!q.hint)return'';return`<div class=\"hint-strip\"><button id=\"hintAudioBtn\" class=\"tiny-audio\">🔊</button><span>${q.stage===4?(q.hint.extra?'There may be an extra letter. Try removing it.':`Which letter fits near position ${q.hint.local+1}?`):'Fix the purple box:'}</span>${(q.hint.options||[]).map(c=>`<button class=\"hint-choice\" data-hint=\"${c}\">${c}</button>`).join('')}<button id=\"hintCloseBtn\" class=\"tiny-audio\">×</button></div>`}",
    'Hint copy works for word-length-agnostic Stage 4 and Stage 3 boxes')
swap('app.js',
    "if(q.feedback?.bad)return'Almost. Green is right. Red or dotted boxes need a fix — stay on this stage.';",
    "if(q.feedback?.bad)return q.stage===4?'Almost! Take another look at your word, or use Hint. You can edit right here.':'Almost. Green is right. Red or dotted boxes need a fix — stay on this stage.';",
    'Stage 4 failure no longer refers to boxes')
swap('app.js',
    "  if(q.stage<3){$$('[data-choice]').forEach(b=>b.onclick=()=>pickChoice(b,w,q));return}\n  $('#writeModeBtn').onclick=",
    '''  if(q.stage<3){$$('[data-choice]').forEach(b=>b.onclick=()=>pickChoice(b,w,q));return}
  if(q.stage===4){
    const input=$('#stage4Answer');
    const store=(commit=true)=>{
      if(!commit)return;
      const cleaned=weeklyAnswerText(input.value,w.word);
      if(input.value!==cleaned)input.value=cleaned;
      if(cleaned!==q.fullAnswer){
        q.fullAnswer=cleaned;q.letters=[...cleaned];q.feedback=null;q.hint=null;
        input.classList.remove('needs-fix');
        const feedback=$('#feedback');if(feedback){feedback.textContent='';feedback.className='feedback'}
        $('.hint-strip')?.remove();
      }
      try{navigator.virtualKeyboard?.hide?.()}catch{}
    };
    input.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'){e.preventDefault();input.blur();return}
      if(e.pointerType==='pen'){
        try{if(document.activeElement!==input)input.focus({preventScroll:true})}catch{}
        try{navigator.virtualKeyboard?.hide?.()}catch{}
      }
    },true);
    input.addEventListener('input',e=>store(!e.isComposing));
    input.addEventListener('compositionend',()=>store(true));
    input.addEventListener('change',()=>store(true));
    $('#stage4ClearBtn').onclick=()=>{
      input.value='';q.fullAnswer='';q.letters=[];q.feedback=null;q.hint=null;
      input.classList.remove('needs-fix');
      const feedback=$('#feedback');if(feedback){feedback.textContent='';feedback.className='feedback'}
      $('.hint-strip')?.remove();
    };
    $('#checkAnswerBtn').onclick=()=>checkHandwriting(w,q);
    $('#hintAudioBtn')?.addEventListener('click',()=>playWordAudio(w,true,{userInitiated:true}));
    $('#hintCloseBtn')?.addEventListener('click',()=>{q.hint=null;renderTask()});
    $$('[data-hint]').forEach(b=>b.onclick=()=>chooseHint(b,w,q));
    document.activeElement?.blur?.();return
  }
  $('#writeModeBtn').onclick=''',
    'Bind fluent Stage 4 as one Scribble input; keep Stage 3 letter boxes')
swap('app.js',
    "cell?.classList.add('trace-retry');setTimeout(()=>cell?.classList.remove('trace-retry'),320);return",
    "cell?.classList.add('trace-retry');setTimeout(()=>cell?.classList.remove('trace-retry'),140);return",
    'Quicker retry feedback in Stage 3 tracing')
swap('app.js',
    "    q.letters[index]=cleaned;q.feedback=null;q.hint=null;\n    // Convert only this field",
    "    const hadFeedback=!!q.feedback?.bad||!!q.hint;\n    q.letters[index]=cleaned;q.feedback=null;q.hint=null;\n    // Convert only this field",
    'Only do expensive feedback cleanup if necessary')
swap('app.js',
    "    $$('.letter-box').forEach(el=>el.classList.remove('ok','bad','missing','hint-target'));const fb=$('#feedback');if(fb){fb.textContent='';fb.className='feedback'};$('.hint-strip')?.remove();",
    "    if(hadFeedback){$$('.letter-box').forEach(el=>el.classList.remove('ok','bad','missing','hint-target'));const fb=$('#feedback');if(fb){fb.textContent='';fb.className='feedback'};$('.hint-strip')?.remove()}",
    'Avoid unnecessary full-row DOM work for each handwritten Stage 3 letter')
swap('app.js',
    "function checkHandwriting(w,q){const attempt=q.letters.join(''),correct=expectedText(w,q);",
    "function checkHandwriting(w,q){const attempt=q.stage===4?weeklyAnswerText($('#stage4Answer')?.value??q.fullAnswer,w.word):q.letters.join(''),correct=expectedText(w,q);if(q.stage===4){q.fullAnswer=attempt;q.letters=[...attempt]}".replace("q.letters=[...attempt]}","q.letters=[...attempt]};"),
    'Stage 4 checks complete Scribble input including final iPad commit')
swap('app.js',
    "function showHint(w,q){playSfx('hint');if(q.stage<3){playWordAudio(w,true);toast('Listen slowly, then try again.');return}w.learn.hints++;save();const exp=expectedText(w,q);",
    "function showHint(w,q){playSfx('hint');if(q.stage<3){playWordAudio(w,true);toast('Listen slowly, then try again.');return}w.learn.hints++;save();if(q.stage===4){showFullWordHint(w,q);return}const exp=expectedText(w,q);",
    'Stage 4 hint understands missing and extra letters')
swap('app.js',
    'function chooseHint(button,w,q){if(button.dataset.hint!==q.hint?.correct)',
    '''function showFullWordHint(w,q){
  const exp=w.word,attempt=weeklyAnswerText($('#stage4Answer')?.value??q.fullAnswer,w.word);
  q.fullAnswer=attempt;q.letters=[...attempt];
  const slots=alignChars(exp,attempt).slots,local=slots.findIndex(s=>!s||s.state!=='ok');
  if(local<0){
    q.hint={extra:true,options:[]};renderTask();return
  }
  const correct=exp[local],insertAt=slots.slice(0,local).filter(s=>s?.typed).length;
  let alts=[...(CONF[correct]||['a','e','i'])].filter(x=>x!==correct);
  while(alts.length<2){const c='abcdefghijklmnopqrstuvwxyz'[(local+alts.length*7)%26];if(c!==correct&&!alts.includes(c))alts.push(c)}
  q.hint={local,correct,insertAt,missing:slots[local]?.state==='missing',options:shuffle([correct,...alts.slice(0,2)])};renderTask()
}
function chooseHint(button,w,q){if(button.dataset.hint!==q.hint?.correct)''',
    'Align full-word hint without showing whole correct word')
swap('app.js',
    "button.classList.add('yes');q.letters[q.hint.local]=q.hint.correct;q.hint=null;q.feedback=null;playSfx('correct');setTimeout(()=>renderTask(),240)",
    "button.classList.add('yes');if(q.stage===4){const h=q.hint,at=h.insertAt;q.fullAnswer=h.missing?q.fullAnswer.slice(0,at)+h.correct+q.fullAnswer.slice(at):q.fullAnswer.slice(0,at)+h.correct+q.fullAnswer.slice(at+1);q.letters=[...q.fullAnswer]}else q.letters[q.hint.local]=q.hint.correct;q.hint=null;q.feedback=null;playSfx('correct');setTimeout(()=>renderTask(),140)",
    'Stage 4 hint inserts missing letters instead of overwriting following letters')
swap('index.html',
    '  <link rel="stylesheet" href="weekly-lowercase-v28.css?v=20260917-v28">',
    '  <link rel="stylesheet" href="weekly-lowercase-v28.css?v=20260917-v28">\n  <link rel="stylesheet" href="fluent-play-v29.css?v=20260917-v29">',
    'Load Stage 4 layout and Pencil CSS')
swap('index.html',
    'aria-label="App version 28, September 17">v28 · Sep 17',
    'aria-label="App version 29, September 17">v29 · Sep 17',
    'Visible version 29')
swap('index.html',
    'app.js?v=20260917-weekly-lowercase-v28',
    'app.js?v=20260917-fluent-play-v29',
    'Fresh application JavaScript')
swap('index.html',
    '<!-- v28: weekly test lower-case answers, numeric Scribble recognition cleanup -->',
    '<!-- v29: no Play/Test BGM, fluent Stage 4 Pencil line, faster Stage 3 feedback -->',
    'Release footer')
for path in ['tests/weekly-test-v24.test.cjs','tests/weekly-test-v25.test.cjs','tests/weekly-lowercase-v28.test.cjs']:
    swap(path,'app.js?v=20260917-weekly-lowercase-v28','app.js?v=20260917-fluent-play-v29','Update historical JS cache assertion')
swap('tests/weekly-lowercase-v28.test.cjs',
    "page.includes('v28 · Sep 17')",
    "page.includes('v29 · Sep 17')",
    'Latest visible version for lower-case regression')
print('v29 guarded patch complete: Garden-only BGM; Stage 4 full-word Scribble; Stage 3 lighter feedback.')
