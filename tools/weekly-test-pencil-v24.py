"""Patch the v23 weekly test without changing ordinary stage-4 handwriting."""
from pathlib import Path

app = Path('app.js')
s = app.read_text(encoding='utf-8')

def swap(old, new, label):
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one occurrence, found {count}')
    s = s.replace(old, new, 1)

swap(
    "function weeklyScore(ids,answers,lib){return ids.map(id=>({id,answer:String(answers[id]||'').trim(),correct:norm(answers[id])===lib[id].word}))}",
    "function weeklyAnswerText(raw){return String(raw??'').replace(/\\s+/g,'')}\nfunction weeklyScore(ids,answers,lib){return ids.map(id=>({id,answer:weeklyAnswerText(answers[id]),correct:norm(answers[id])===lib[id].word}))}",
    'space-free display and grading'
)
swap("?draft.answers[id]:''])),active:", "?weeklyAnswerText(draft.answers[id]):''])),active:", 'normalize prior drafts')
swap(
    '<button id="weeklyLeaveBtn" class="secondary-btn" type="button">Save & exit</button></header>',
    '<div class="weekly-header-actions"><button id="weeklyLeaveBtn" class="secondary-btn" type="button">Save & exit</button><button id="weeklyGradeTopBtn" class="primary-btn" type="button">Check answers ✓</button></div></header>',
    'top visible grading control'
)
swap(
    '<input type="text" class="weekly-answer" data-id=',
    '<input type="text" class="weekly-answer" inputmode="none" virtualkeyboardpolicy="manual" data-id=',
    'Pencil-only input attributes'
)
swap('placeholder="Write your answer"', 'placeholder="Write with Apple Pencil"', 'Pencil placeholder')
swap(
    '''    input.addEventListener('focus',()=>setWeeklyActive(index,false));
    input.addEventListener('input',()=>{weeklyTest.answers[id]=input.value;saveWeeklyDraft();const answered=weeklyTest.ids.filter(x=>norm(weeklyTest.answers[x])).length;const n=$('#weeklyAnswered');if(n)n.textContent=`${answered} / ${weeklyTest.ids.length} answered`;});
    input.addEventListener('change',()=>{weeklyTest.answers[id]=input.value;saveWeeklyDraft()});''',
    '''    // A finger should scroll/tap controls, not raise an on-screen keyboard. Let Pencil Scribble own the field.
    input.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'){e.preventDefault();input.blur();return}
      if(e.pointerType==='pen'){
        try{if(document.activeElement!==input)input.focus({preventScroll:true})}catch{}
        try{navigator.virtualKeyboard?.hide?.()}catch{}
      }
    },true);
    input.addEventListener('focus',()=>{setWeeklyActive(index,false);try{navigator.virtualKeyboard?.hide?.()}catch{}});
    const storeWeeklyAnswer=(cleanField=true)=>{
      const cleaned=weeklyAnswerText(input.value);
      // Scribble sometimes inserts a space while the Pencil pauses between parts of a compound word.
      // Leave IME composition alone until it commits, then remove spaces from the visible text and saved answer.
      if(cleanField&&input.value!==cleaned)input.value=cleaned;
      weeklyTest.answers[id]=cleaned;saveWeeklyDraft();
      const answered=weeklyTest.ids.filter(x=>norm(weeklyTest.answers[x])).length;
      const n=$('#weeklyAnswered');if(n)n.textContent=`${answered} / ${weeklyTest.ids.length} answered`;
      try{navigator.virtualKeyboard?.hide?.()}catch{}
    };
    input.addEventListener('input',e=>storeWeeklyAnswer(!e.isComposing));
    input.addEventListener('compositionend',()=>storeWeeklyAnswer(true));
    input.addEventListener('change',()=>storeWeeklyAnswer(true));''',
    'Pencil focus and whitespace handling'
)
swap("  $('#weeklyGradeBtn').onclick=gradeWeeklyTest;", "  $('#weeklyGradeBtn').onclick=gradeWeeklyTest;\n  $('#weeklyGradeTopBtn').onclick=gradeWeeklyTest;", 'bind both grade buttons')
swap("  $$('.weekly-answer').forEach(input=>weeklyTest.answers[input.dataset.id]=input.value);", "  $$('.weekly-answer').forEach(input=>weeklyTest.answers[input.dataset.id]=weeklyAnswerText(input.value));", 'normalize all answers before grading')
app.write_text(s, encoding='utf-8')

page = Path('index.html')
h = page.read_text(encoding='utf-8')
def html_swap(old, new, label):
    global h
    count=h.count(old)
    if count!=1:raise SystemExit(f'{label}: expected one occurrence, found {count}')
    h=h.replace(old,new,1)
html_swap('<link rel="stylesheet" href="weekly-test-v23.css?v=20260917-v23">', '<link rel="stylesheet" href="weekly-test-v23.css?v=20260917-v23">\n  <link rel="stylesheet" href="weekly-test-v24.css?v=20260917-v24">', 'v24 footer CSS')
html_swap('aria-label="App version 23, September 17">v23 · Sep 17', 'aria-label="App version 24, September 17">v24 · Sep 17', 'visible version')
html_swap('app.js?v=20260917-weekly-test-v23', 'app.js?v=20260917-weekly-pencil-v24', 'cache buster')
html_swap('<!-- v23 production: This Week Test: 10-word answer sheet, one-time grading, missed-word practice -->', '<!-- v24 production: visible grade buttons, Pencil-focused entry, spaces ignored in weekly exam -->', 'release description')
page.write_text(h, encoding='utf-8')
print('Patched v24: visible grading controls, scrollable answer sheet CSS, Scribble-only visual input and whitespace-free answers.')
