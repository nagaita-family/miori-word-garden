"""Apply the narrow v25 weekly-test fixes; stop on unexpected source changes."""
from pathlib import Path


def one(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one exact source match; found {count}')
    return text.replace(old, new, 1)

p=Path('app.js')
s=p.read_text(encoding='utf-8')
s=one(s,
      "weeklyTest=null;session={count:0,goal:ids.length,ids,doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()",
      "weeklyTest=null;session={count:0,goal:ids.length,ids,doneIds:[],last:'',q:null,xp:0,reviewMissed:true};helpKind='';renderTask()",
      'Mark only missed-word sessions for short review')
s=one(s,
      'session.last=w.id;session.q=newQuestion(w,1)',
      'session.last=w.id;session.q=newQuestion(w,session.reviewMissed?3:1)',
      'Start only missed-word review at stage 3')
s=one(s,
      "Practice ${wrong.length} missed ${wrong.length===1?'word':'words'} →",
      "Practice ${wrong.length} missed ${wrong.length===1?'word':'words'} · Stage 3 → 4",
      'Explain two-stage practice on result button')
s=one(s,
      'Only the optional four-stage practice gives garden growth and updates learning data.',
      'Only the optional Stage 3 → Stage 4 review gives garden growth and updates learning data.',
      'Correct review explanation')
s=one(s,
      "  if(blank&&!confirm(`${blank} ${blank===1?'answer is':'answers are'} blank. Check the test anyway?`))return;",
      "  const message=blank?`${blank} ${blank===1?'answer is':'answers are'} blank. Finish and grade all ${weeklyTest.ids.length} answers anyway?`:`Finished writing? Grade all ${weeklyTest.ids.length} answers now?`;\n  if(!confirm(message))return;",
      'Always require explicit grading confirmation')
p.write_text(s,encoding='utf-8')

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=one(s,
      'aria-label="App version 24, September 17">v24 · Sep 17',
      'aria-label="App version 25, September 17">v25 · Sep 17',
      'Visible app version')
s=one(s,
      '<script src="app.js?v=20260917-weekly-pencil-v24"></script>',
      '<script src="app.js?v=20260917-weekly-review-v25"></script>\n  <script src="weekly-test-palm-v25.js?v=20260917-v25"></script>',
      'Load versioned app and weekly palm guard')
s=one(s,
      '<!-- v24 production: visible grade buttons, Pencil-focused entry, spaces ignored in weekly exam -->',
      '<!-- v25 production: test palm protection and missed-word stages 3 then 4 -->',
      'Production version comment')
p.write_text(s,encoding='utf-8')

# The historical v24 tests must verify their feature, not reject all future versions.
p=Path('tests/weekly-test-v24.test.cjs')
s=p.read_text(encoding='utf-8')
s=one(s,
      "page.includes('app.js?v=20260917-weekly-pencil-v24')&&page.includes('v24 · Sep 17')",
      "page.includes('app.js?v=20260917-weekly-review-v25')&&/v[0-9]+ · Sep 17/.test(page)",
      'Allow later app versions in v24 regression')
p.write_text(s,encoding='utf-8')
print('Applied v25: review starts at stage 3, universal grade confirmation, versioned palm guard and refreshed legacy test.')
