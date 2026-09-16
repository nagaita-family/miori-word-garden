"""Normalize only weekly exam Scribble answers, without changing regular Play or stored learning."""
from pathlib import Path

def replace_once(path, old, new, label):
    file=Path(path)
    text=file.read_text(encoding='utf-8')
    count=text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {count}')
    file.write_text(text.replace(old,new,1),encoding='utf-8')

replace_once('app.js',
    "function weeklyAnswerText(raw){return String(raw??'').replace(/\\s+/g,'')}",
    """// Scribble can read a handwritten lower-case l as 1. Keep it as l only when
// that one recognition fix fits the expected spelling better than discarding it.
// Never alter actual alphabetic spelling mistakes or reveal the correct word.
function weeklyLetterDistance(a,b){
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const next=[i];
    for(let j=1;j<=b.length;j++)next[j]=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    prev=next;
  }
  return prev[b.length]
}
function weeklyAnswerText(raw,expected=''){
  let text=String(raw??'').normalize('NFKC').toLowerCase().replace(/[^a-z1]/g,'');
  while(text.includes('1')){
    const i=text.indexOf('1'),asL=text.slice(0,i)+'l'+text.slice(i+1),without=text.slice(0,i)+text.slice(i+1);
    text=expected.includes('l')&&weeklyLetterDistance(asL,expected)<weeklyLetterDistance(without,expected)?asL:without;
  }
  return text
}""",
    'Strict lower-case and context-sensitive 1-to-l Scribble conversion')
replace_once('app.js',
    "function weeklyScore(ids,answers,lib){return ids.map(id=>({id,answer:weeklyAnswerText(answers[id]),correct:norm(answers[id])===lib[id].word}))}",
    "function weeklyScore(ids,answers,lib){return ids.map(id=>{const answer=weeklyAnswerText(answers[id],lib[id].word);return{id,answer,correct:answer===lib[id].word}})}",
    'Score cleaned lower-case answers rather than raw numbers and punctuation')
replace_once('app.js',
    "weeklyAnswerText(draft.answers[id]):''])),active:",
    "weeklyAnswerText(draft.answers[id],state.lib[id].word):''])),active:",
    'Clean resumed drafts with their matching weekly word')
replace_once('app.js',
    "const cleaned=weeklyAnswerText(input.value);",
    "const cleaned=weeklyAnswerText(input.value,state.lib[id].word);",
    'Clean actual Pencil input per weekly word')
replace_once('app.js',
    "$$('.weekly-answer').forEach(input=>weeklyTest.answers[input.dataset.id]=weeklyAnswerText(input.value));",
    "$$('.weekly-answer').forEach(input=>weeklyTest.answers[input.dataset.id]=weeklyAnswerText(input.value,state.lib[input.dataset.id].word));",
    'Clean last uncommitted field immediately before grading')
replace_once('index.html',
    'aria-label="App version 27, September 17">v27 · Sep 17',
    'aria-label="App version 28, September 17">v28 · Sep 17',
    'Visible version')
replace_once('index.html',
    '<script src="app.js?v=20260917-weekly-results-v26"></script>',
    '<script src="app.js?v=20260917-weekly-lowercase-v28"></script>',
    'Fresh app JavaScript cache key')
replace_once('index.html',
    '<link rel="stylesheet" href="weekly-result-compare-v26.css?v=20260917-v26">',
    '<link rel="stylesheet" href="weekly-result-compare-v26.css?v=20260917-v26">\n  <link rel="stylesheet" href="weekly-lowercase-v28.css?v=20260917-v28">',
    'Only weekly exam gets lower-case display override')
replace_once('index.html',
    '<!-- v27: weekly Listen unaffected by palm guard; grading still protected -->',
    '<!-- v28: weekly test lower-case answers, numeric Scribble recognition cleanup -->',
    'Version comment')
replace_once('tests/weekly-test-v24.test.cjs',
    "assert.equal(ctx.weeklyAnswerText('Rai Sin'),'RaiSin');",
    "assert.equal(ctx.weeklyAnswerText('Rai Sin'),'raisin');",
    'Old space test expects normalized lower-case answer')
replace_once('tests/weekly-test-v24.test.cjs',
    "assert.equal(scored[1].correct,true);assert.equal(scored[1].answer,'RAISIN');",
    "assert.equal(scored[1].correct,true);assert.equal(scored[1].answer,'raisin');",
    'Old score expects normalized lower-case answer')
replace_once('tests/weekly-test-v24.test.cjs',
    "page.includes('app.js?v=20260917-weekly-results-v26')",
    "page.includes('app.js?v=20260917-weekly-lowercase-v28')",
    'Old input regression accepts v28 asset')
replace_once('tests/weekly-test-v25.test.cjs',
    "html.includes('app.js?v=20260917-weekly-results-v26')",
    "html.includes('app.js?v=20260917-weekly-lowercase-v28')",
    'Old palm regression accepts v28 asset')
replace_once('tests/weekly-listen-v27.test.cjs',
    "assert(page.includes('v27 · Sep 17'),'New version appears visibly');",
    "assert(/v[0-9]+ · Sep 17/.test(page),'A visible current version remains');",
    'Old Listen regression does not require obsolete visible badge')
print('v28 patch: narrow lower-case alphabetic input, contextual 1->l, ignore other digits and punctuation, versioned assets.')
