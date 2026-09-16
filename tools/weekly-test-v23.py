"""Install the v23 weekly spelling test without rewriting unrelated handwriting code."""
from pathlib import Path

p=Path('app.js')
s=p.read_text(encoding='utf-8')

def replace_once(old,new,description):
    global s
    count=s.count(old)
    if count!=1:
        raise SystemExit(f'{description}: expected one source match, found {count}')
    s=s.replace(old,new,1)

replace_once("let session=null;\nlet helpKind='';", "let session=null;\nlet weeklyTest=null;\nlet helpKind='';", 'weekly test runtime state')
replace_once("function renderPlayHome(){session=null;helpKind='';", "function renderPlayHome(){session=null;helpKind='';const draft=state.weekTestDraft?.weekId===state.week.id;const previous=state.weekTestResult?.weekId===state.week.id;", 'play home state')
replace_once('<button class="giant" id="startSessionBtn">Start! ✦</button><div class="play-meta">', '''<button class="giant" id="startSessionBtn">Start! ✦</button><section class="weekly-test-entry"><span class="weekly-entry-kicker">📝 THIS WEEK TEST</span><h2>Ready for the spelling test?</h2><p>Hear each word. Write on one answer sheet. Check all your answers at the end.</p><div class="weekly-entry-actions"><button id="startWeeklyTestBtn" class="primary-btn" type="button">${draft?'Resume this week’s test':'Start this week’s test'}</button>${draft?'<button id="newWeeklyTestBtn" class="secondary-btn" type="button">Start over</button>':''}${previous?'<button id="weeklyLastResultBtn" class="secondary-btn" type="button">Last test results</button>':''}</div></section><div class="play-meta">''', 'weekly test play entry')
replace_once("$('#startSessionBtn').onclick=startSession;syncBgm()}", "$('#startSessionBtn').onclick=startSession;$('#startWeeklyTestBtn').onclick=()=>startWeeklyTest();$('#newWeeklyTestBtn')?.addEventListener('click',()=>startWeeklyTest(true));$('#weeklyLastResultBtn')?.addEventListener('click',renderWeeklyResult);syncBgm()}", 'weekly test buttons')

exam = r'''// A weekly exam is a separate assessment, not a four-stage learning attempt.
// The same local state store is used, so the existing Parent Test Mode remains isolated.
function weeklyTestIds(){return[...new Set(state.week.ids)].filter(id=>!!state.lib[id]).slice(0,10)}
function weeklyScore(ids,answers,lib){return ids.map(id=>({id,answer:String(answers[id]||'').trim(),correct:norm(answers[id])===lib[id].word}))}
function saveWeeklyDraft(){
  if(!weeklyTest)return;
  state.weekTestDraft={weekId:state.week.id,weekTitle:state.week.title,ids:[...weeklyTest.ids],answers:{...weeklyTest.answers},active:weeklyTest.active,startedAt:weeklyTest.startedAt};
  save()
}
function startWeeklyTest(fresh=false){
  const current=weeklyTestIds();if(!current.length)return toast('Add this week’s words in Parent first.');
  const draft=state.weekTestDraft;
  if(fresh&&draft?.weekId===state.week.id&&!confirm('Start a new test? Your unfinished answer sheet will be discarded.'))return;
  const resume=!fresh&&draft?.weekId===state.week.id&&Array.isArray(draft.ids)&&draft.ids.length===current.length&&draft.ids.every(id=>current.includes(id));
  const ids=resume?[...draft.ids]:shuffle(current);
  weeklyTest={ids,answers:Object.fromEntries(ids.map(id=>[id,resume&&typeof draft.answers?.[id]==='string'?draft.answers[id]:''])),active:resume?Math.max(0,Math.min(ids.length-1,Number(draft.active)||0)):0,startedAt:resume?draft.startedAt:new Date().toISOString()};
  session=null;helpKind='';saveWeeklyDraft();renderWeeklyTest();
  // The start button is a user gesture, so reading the first/current word can begin here.
  playWordAudio(state.lib[weeklyTest.ids[weeklyTest.active]],false,{userInitiated:true})
}
function setWeeklyActive(next,readAloud=false){
  if(!weeklyTest)return;
  weeklyTest.active=Math.max(0,Math.min(weeklyTest.ids.length-1,next));saveWeeklyDraft();
  $$('.weekly-question').forEach((row,i)=>row.classList.toggle('active',i===weeklyTest.active));
  const label=$('#weeklyNow');if(label)label.textContent=`Question ${weeklyTest.active+1} of ${weeklyTest.ids.length}`;
  const nextBtn=$('#weeklyNextBtn');if(nextBtn)nextBtn.textContent=weeklyTest.active===weeklyTest.ids.length-1?'Back to question 1 ↻':'Next word →';
  if(readAloud)playWordAudio(state.lib[weeklyTest.ids[weeklyTest.active]],false,{userInitiated:true})
}
function renderWeeklyTest(){
  if(!weeklyTest)return renderPlayHome();
  const total=weeklyTest.ids.length,answered=weeklyTest.ids.filter(id=>norm(weeklyTest.answers[id])).length;
  $('#playView').innerHTML=`<div class="play-view weekly-test-view"><div class="weekly-sheet"><header class="weekly-sheet-head"><div><span class="weekly-entry-kicker">📝 THIS WEEK TEST</span><h1>My spelling test</h1><p>${esc(state.week.title)} · Listen and write. Answers stay hidden until you finish.</p></div><button id="weeklyLeaveBtn" class="secondary-btn" type="button">Save & exit</button></header><div class="weekly-instructions"><b id="weeklyNow">Question ${weeklyTest.active+1} of ${total}</b><span id="weeklyAnswered">${answered} / ${total} answered</span><span>Tap 🔊 to hear a word again. You can change any answer.</span></div><div class="weekly-answer-sheet">${weeklyTest.ids.map((id,i)=>`<div class="weekly-question ${i===weeklyTest.active?'active':''}" data-id="${esc(id)}" data-index="${i}"><div class="weekly-question-head"><span class="weekly-number">${i+1}.</span><button type="button" class="weekly-hear" aria-label="Hear question ${i+1}" data-index="${i}">🔊 <span>Listen</span></button></div><input type="text" class="weekly-answer" data-id="${esc(id)}" data-index="${i}" value="${esc(weeklyTest.answers[id])}" aria-label="Spelling answer for question ${i+1}" placeholder="Write your answer" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done"></div>`).join('')}</div><footer class="weekly-sheet-actions"><button id="weeklyNextBtn" class="secondary-btn" type="button">${weeklyTest.active===total-1?'Back to question 1 ↻':'Next word →'}</button><button id="weeklyGradeBtn" class="primary-btn" type="button">Check all ${total} answers ✓</button></footer><p class="weekly-sheet-note">No hints, no answer checks yet. This test does not change your Garden, XP, or spelling mastery. Practice after grading can grow the Garden.</p></div></div>`;
  $('#weeklyLeaveBtn').onclick=()=>{saveWeeklyDraft();renderPlayHome()};
  $$('.weekly-hear').forEach(button=>button.onclick=()=>setWeeklyActive(Number(button.dataset.index),true));
  $$('.weekly-answer').forEach(input=>{
    const id=input.dataset.id,index=Number(input.dataset.index);
    input.addEventListener('focus',()=>setWeeklyActive(index,false));
    input.addEventListener('input',()=>{weeklyTest.answers[id]=input.value;saveWeeklyDraft();const answered=weeklyTest.ids.filter(x=>norm(weeklyTest.answers[x])).length;const n=$('#weeklyAnswered');if(n)n.textContent=`${answered} / ${weeklyTest.ids.length} answered`;});
    input.addEventListener('change',()=>{weeklyTest.answers[id]=input.value;saveWeeklyDraft()});
  });
  $('#weeklyNextBtn').onclick=()=>setWeeklyActive((weeklyTest.active+1)%total,true);
  $('#weeklyGradeBtn').onclick=gradeWeeklyTest;
  syncBgm()
}
function gradeWeeklyTest(){
  if(!weeklyTest)return;
  // Grab the actual field contents before grading; Scribble may commit its final input on blur.
  document.activeElement?.blur?.();
  $$('.weekly-answer').forEach(input=>weeklyTest.answers[input.dataset.id]=input.value);
  const blank=weeklyTest.ids.filter(id=>!norm(weeklyTest.answers[id])).length;
  if(blank&&!confirm(`${blank} ${blank===1?'answer is':'answers are'} blank. Check the test anyway?`))return;
  const items=weeklyScore(weeklyTest.ids,weeklyTest.answers,state.lib);
  state.weekTestResult={weekId:state.week.id,weekTitle:state.week.title,gradedAt:new Date().toISOString(),items};
  delete state.weekTestDraft;weeklyTest=null;save();playSfx(items.every(x=>x.correct)?'finish':'correct');renderWeeklyResult()
}
function renderWeeklyResult(){
  const result=state.weekTestResult;
  if(!result||result.weekId!==state.week.id)return renderPlayHome();
  const items=result.items||[],correct=items.filter(item=>item.correct).length,wrong=items.filter(item=>!item.correct&&state.lib[item.id]);
  $('#playView').innerHTML=`<div class="play-view weekly-test-view"><div class="weekly-sheet weekly-results"><div class="weekly-results-head"><span class="weekly-entry-kicker">📝 THIS WEEK TEST · RESULTS</span><h1>${correct} / ${items.length} correct</h1><p>${esc(result.weekTitle||state.week.title)} · You finished your answer sheet!</p><p class="weekly-results-note">${wrong.length?'Check the words below, then practice just the ones you missed.':'All correct! Your Garden is ready when you are.'}</p></div><div class="weekly-result-list">${items.map((item,i)=>{const word=state.lib[item.id]?.word||item.id;return`<div class="weekly-result-row ${item.correct?'is-correct':'needs-review'}"><span class="weekly-result-number">${i+1}.</span><span class="weekly-result-status">${item.correct?'✓':'↻'}</span><div><b>${item.answer?esc(item.answer):'<i>No answer</i>'}</b>${item.correct?'':`<small>Correct spelling: <strong>${esc(word)}</strong></small>`}</div><button class="weekly-result-hear" type="button" data-id="${esc(item.id)}" aria-label="Hear question ${i+1}">🔊</button></div>`}).join('')}</div><div class="weekly-result-actions">${wrong.length?`<button id="weeklyPracticeWrongBtn" class="primary-btn" type="button">Practice ${wrong.length} missed ${wrong.length===1?'word':'words'} →</button>`:''}<button id="weeklyRetakeBtn" class="secondary-btn" type="button">Try the test again</button><button id="weeklyResultDoneBtn" class="secondary-btn" type="button">Back to Play</button></div><p class="weekly-sheet-note">The test score is saved separately. Only the optional four-stage practice gives garden growth and updates learning data.</p></div></div>`;
  $$('.weekly-result-hear').forEach(b=>b.onclick=()=>{const w=state.lib[b.dataset.id];if(w)playWordAudio(w,false,{userInitiated:true})});
  $('#weeklyPracticeWrongBtn')?.addEventListener('click',()=>{
    const ids=[...new Set(wrong.map(x=>x.id))];if(!ids.length)return;
    weeklyTest=null;session={count:0,goal:ids.length,ids,doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()
  });
  $('#weeklyRetakeBtn').onclick=()=>startWeeklyTest(true);
  $('#weeklyResultDoneBtn').onclick=renderPlayHome;
  syncBgm()
}
'''
replace_once('function practiceIds(){', exam+'function practiceIds(){', 'install weekly assessment functions')
p.write_text(s,encoding='utf-8')
print('v23 weekly test patched: answer sheet, draft, single grading, wrong-only four-stage review')
