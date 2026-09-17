"""One-time guarded v32 integration: This Week / My Words / Past Tests."""
from pathlib import Path
import re

APP=Path('app.js')
PAGE=Path('index.html')
app=APP.read_text(encoding='utf-8')
page=PAGE.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    count=text.count(old)
    if count!=1:
        raise RuntimeError(f'{label}: expected one anchor, got {count}')
    return text.replace(old,new,1)


def replace_block(text, start_pat, end_pat, new_block, label):
    pat=re.compile(start_pat+r'.*?'+end_pat,re.S)
    m=pat.search(text)
    if not m:
        raise RuntimeError(f'{label}: block not found')
    if pat.search(text,m.end()):
        raise RuntimeError(f'{label}: block is not unique')
    return text[:m.start()]+new_block+text[m.end():]

old_default="function defaultState(){return{version:3,xp:0,week:{id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids:[]},lib:{},garden:{growth:0,pos:{},bunnySeated:false,stored:[]},settings:{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true},stats:{answers:0,sessions:0},recentWords:[]}}"
new_default="function defaultState(){return{version:3,xp:0,week:{id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids:[],focusIds:[]},myWords:{},pastWeeks:[],learningGroupsVersion:1,lib:{},garden:{growth:0,pos:{},bunnySeated:false,stored:[]},settings:{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true},stats:{answers:0,sessions:0},recentWords:[]}}"
app=replace_once(app,old_default,new_default,'defaultState')

helpers=r'''
let parentGroupTab='week';
function uniqueWordIds(ids){return[...new Set((ids||[]).map(norm).filter(Boolean))]}
function weekIdentity(title=''){const key=String(title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return key||`week-${today()}`}
function ensureLearningGroups(s){
  s.week=s.week||{id:'',title:'This Week',ids:[],focusIds:[]};s.week.ids=uniqueWordIds(s.week.ids);s.week.focusIds=uniqueWordIds(s.week.focusIds).filter(id=>s.week.ids.includes(id));
  if(Array.isArray(s.myWords)){const next={};for(const id of uniqueWordIds(s.myWords))next[id]={addedAt:today(),source:'Imported',note:''};s.myWords=next}else if(!s.myWords||typeof s.myWords!=='object')s.myWords={};
  s.pastWeeks=Array.isArray(s.pastWeeks)?s.pastWeeks.filter(Boolean).map(x=>({id:x.id||weekIdentity(x.title),title:x.title||'Past test',ids:uniqueWordIds(x.ids),focusIds:uniqueWordIds(x.focusIds),archivedAt:x.archivedAt||''})):[];
  if(!s.learningGroupsVersion){
    s.week.id=weekIdentity(s.week.title||s.week.id);
    for(const w of Object.values(s.lib||{}))if(w?.parentPriority){w.focusHistory=true;if(s.week.ids.includes(w.id)&&!s.week.focusIds.includes(w.id))s.week.focusIds.push(w.id)}
    s.learningGroupsVersion=1;
  }
  for(const w of Object.values(s.lib||{}))if(w?.parentPriority){w.focusHistory=true;w.parentPriority=false}
  s.week.focusIds=uniqueWordIds(s.week.focusIds).filter(id=>s.week.ids.includes(id));
  return s
}
function archiveWeek(s,week=s.week){
  if(!week?.ids?.length)return;
  s.pastWeeks=Array.isArray(s.pastWeeks)?s.pastWeeks:[];
  const snapshot={id:week.id||weekIdentity(week.title),title:week.title||'Past test',ids:uniqueWordIds(week.ids),focusIds:uniqueWordIds(week.focusIds),archivedAt:today()};
  for(const id of snapshot.focusIds){const w=s.lib?.[id];if(w)w.focusHistory=true}
  const at=s.pastWeeks.findIndex(x=>x.id===snapshot.id||x.title===snapshot.title);
  if(at>=0)s.pastWeeks[at]={...s.pastWeeks[at],...snapshot,ids:uniqueWordIds([...(s.pastWeeks[at].ids||[]),...snapshot.ids]),focusIds:uniqueWordIds([...(s.pastWeeks[at].focusIds||[]),...snapshot.focusIds])};else s.pastWeeks.push(snapshot);
  s.pastWeeks=s.pastWeeks.slice(-24)
}
function inCurrentWeek(id){return state.week.ids.includes(norm(id))}
function isCurrentFocus(id){return inCurrentWeek(id)&&state.week.focusIds.includes(norm(id))}
function myWordMeta(id){return state.myWords?.[norm(id)]||null}
function setMyWord(id,on,meta={}){id=norm(id);if(!id||!state.lib[id])return;state.myWords=state.myWords||{};if(on){const old=state.myWords[id]||{};state.myWords[id]={addedAt:old.addedAt||today(),source:meta.source??old.source??'Journal',note:meta.note??old.note??''}}else delete state.myWords[id]}
function wordWasInPast(id){id=norm(id);return(state.pastWeeks||[]).some(w=>(w.ids||[]).includes(id))}
function myWordStatus(w){const l=w?.learn||learning(w?.word||''),loops=l.loops||0,stage4=l.stageMist?.[4]||0,mistakes=l.mistakes||0;if(loops>=3&&stage4<=1&&mistakes<=Math.max(2,loops))return{key:'remembered',label:'🌼 Remembered'};if(loops>=1||(l.correct||0)>=2)return{key:'growing',label:'🌿 Getting stronger'};return{key:'learning',label:'🌱 Learning'}}
function practiceKindLabel(kind){return kind==='my'?'MY WORD':kind==='past'?'REVIEW':'THIS WEEK'}
'''
app=replace_once(app,new_default,new_default+'\n'+helpers,'learning group helpers')

app=replace_once(app,"if(!s.week?.ids?.length)s.week={id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids};","if(!s.week?.ids?.length)s.week={id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids,focusIds:[]};",'seed week focus')
app=replace_once(app,"s.recentWords=Array.isArray(s.recentWords)?s.recentWords:[];seedSchoolWords(s);localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s;","s.recentWords=Array.isArray(s.recentWords)?s.recentWords:[];seedSchoolWords(s);ensureLearningGroups(s);localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s;",'load migration')
app=replace_once(app,"audioTried:old?.audioTried||raw.audioTried||false,parentPriority:!!(raw.parentPriority??old?.parentPriority??false),learn};","audioTried:old?.audioTried||raw.audioTried||false,parentPriority:!!(raw.parentPriority??old?.parentPriority??false),focusHistory:!!(raw.focusHistory??old?.focusHistory??false),learn};",'preserve focus history')

new_play_home=r'''function renderPlayHome(){
  session=null;helpKind='';const draft=state.weekTestDraft?.weekId===state.week.id;const previous=state.weekTestResult?.weekId===state.week.id;
  const weekCount=state.week.ids.filter(id=>state.lib[id]).length,myIds=Object.keys(state.myWords||{}).filter(id=>state.lib[id]),myOutside=myIds.filter(id=>!state.week.ids.includes(id)).length;
  $('#playView').innerHTML=`<div class="play-view"><div class="play-home"><div class="play-hero-card"><div><div class="play-new">TODAY’S SPELL ADVENTURE ✦</div><p class="eyebrow">READY WHEN YOU ARE</p><h1>Let’s make some words bloom.</h1><p>Today keeps the spelling test first, while one personal word keeps everyday writing growing too.</p><div class="today-plan"><div class="today-plan-card week"><b>📝 This Week · up to 4</b><small>School spelling-test words come first.</small></div><div class="today-plan-card mine"><b>📚 My Words · up to 1</b><small>Journal, reading, and everyday words stay with you.</small></div></div><div class="play-mode-actions"><button class="giant" id="startSessionBtn">Today’s Play ✦</button><button class="secondary-play" id="weekOnlyBtn" ${weekCount?'':'disabled'}>This Week only</button><button class="secondary-play" id="myWordsOnlyBtn" ${myIds.length?'':'disabled'}>My Words only</button></div><section class="weekly-test-entry"><span class="weekly-entry-kicker">📝 THIS WEEK TEST</span><h2>Ready for the spelling test?</h2><p>Hear each word. Write on one answer sheet. Check all your answers at the end.</p><div class="weekly-entry-actions"><button id="startWeeklyTestBtn" class="primary-btn" type="button">${draft?'Resume this week’s test':'Start this week’s test'}</button>${draft?'<button id="newWeeklyTestBtn" class="secondary-btn" type="button">Start over</button>':''}${previous?'<button id="weeklyLastResultBtn" class="secondary-btn" type="button">Last test results</button>':''}</div></section><div class="play-meta"><span>${esc(state.week.title)}</span><span>${weekCount} This Week</span><span>${myOutside} My Words outside this week</span><span>Past tests stay out unless you choose Review</span></div></div><div class="play-mascot"><div class="mascot-bubble">🐰</div></div></div></div></div>`;
  $('#startSessionBtn').onclick=()=>startSession('today');$('#weekOnlyBtn')?.addEventListener('click',()=>startSession('week'));$('#myWordsOnlyBtn')?.addEventListener('click',()=>startSession('my'));$('#startWeeklyTestBtn').onclick=()=>startWeeklyTest();$('#newWeeklyTestBtn')?.addEventListener('click',()=>startWeeklyTest(true));$('#weeklyLastResultBtn')?.addEventListener('click',renderWeeklyResult);syncBgm()
}
// A weekly exam'''
app=replace_block(app,r'function renderPlayHome\(\)\{',r'// A weekly exam',new_play_home,'renderPlayHome')

new_practice=r'''function practiceIds(){return uniqueWordIds([...state.week.ids,...Object.keys(state.myWords||{})]).filter(id=>!!state.lib[id])}
function practiceScore(id,kind='week'){
  const w=state.lib[id];if(!w)return-999;const l=w.learn||learning(w.word),max=Math.max(0,...(l.weak||[])),rate=l.attempts?l.mistakes/l.attempts:0;let score=max*.8+rate*6+Math.random()*1.4;
  if(kind==='week'&&isCurrentFocus(id))score+=50;
  if(kind==='my'){const s=myWordStatus(w);score+=s.key==='learning'?10:s.key==='growing'?5:1}
  if(!l.last)score+=2;return score
}
function takePracticeIds(ids,count,kind,exclude=[]){const blocked=new Set(exclude);return uniqueWordIds(ids).filter(id=>state.lib[id]&&!blocked.has(id)).sort((a,b)=>practiceScore(b,kind)-practiceScore(a,kind)).slice(0,Math.max(0,count))}
function makeSession(items,mode='today'){
  const clean=[];const seen=new Set();for(const item of items){if(!item?.id||seen.has(item.id)||!state.lib[item.id])continue;seen.add(item.id);clean.push(item)}
  if(!clean.length)return null;return{count:0,goal:clean.length,ids:clean.map(x=>x.id),doneIds:[],last:'',q:null,xp:0,mode,kindById:Object.fromEntries(clean.map(x=>[x.id,x.kind])),startStageById:Object.fromEntries(clean.map(x=>[x.id,x.startStage||1]))}
}
function startSession(mode='today'){
  const weekIds=uniqueWordIds(state.week.ids).filter(id=>state.lib[id]),myIds=uniqueWordIds(Object.keys(state.myWords||{})).filter(id=>state.lib[id]&&!weekIds.includes(id));let items=[];
  if(mode==='week')items=takePracticeIds(weekIds,5,'week').map(id=>({id,kind:'week',startStage:1}));
  else if(mode==='my')items=takePracticeIds(Object.keys(state.myWords||{}),5,'my').map(id=>({id,kind:'my',startStage:4}));
  else{
    const w=takePracticeIds(weekIds,4,'week');const m=takePracticeIds(myIds,1,'my',w);items=[...w.map(id=>({id,kind:'week',startStage:1})),...m.map(id=>({id,kind:'my',startStage:4}))];
    let need=5-items.length;if(need>0){const used=items.map(x=>x.id);const moreWeek=takePracticeIds(weekIds,need,'week',used);items.push(...moreWeek.map(id=>({id,kind:'week',startStage:1})));need=5-items.length;if(need>0){const moreMy=takePracticeIds(myIds,need,'my',items.map(x=>x.id));items.push(...moreMy.map(id=>({id,kind:'my',startStage:4})))}}
  }
  session=makeSession(items,mode);if(!session)return toast(mode==='my'?'Add a My Word in Parent first.':'Add this week’s words in Parent first.');playSfx('start');syncBgm();helpKind='';renderTask()
}
function startPastReview(weekId){
  const past=(state.pastWeeks||[]).find(x=>x.id===weekId);if(!past)return;const ids=takePracticeIds(past.ids,5,'past'),items=ids.map(id=>({id,kind:'past',startStage:4}));session=makeSession(items,'past');if(!session)return toast('No saved words in this past test.');playSfx('start');setView('play')
}
function chooseWord(){
  let pool=(session.ids||practiceIds()).filter(id=>!session.doneIds.includes(id)).map(id=>state.lib[id]).filter(Boolean);if(pool.length>1)pool=pool.filter(w=>w.id!==session.last);pool.sort((a,b)=>practiceScore(b.id,session.kindById?.[b.id]||'week')-practiceScore(a.id,session.kindById?.[a.id]||'week'));return pool[0]
}
function chunkRanges'''
app=replace_block(app,r'function practiceIds\(\)',r'function chunkRanges',new_practice,'practice selection')

old_q="if(!session.q){const w=chooseWord();if(!w)return finishSession();session.last=w.id;session.q=newQuestion(w,session.reviewMissed?3:1)}"
new_q="if(!session.q){const w=chooseWord();if(!w)return finishSession();session.last=w.id;const kind=session.kindById?.[w.id]||'week';session.currentKind=kind;const start=session.reviewMissed?3:(session.startStageById?.[w.id]||1);session.q=newQuestion(w,start);session.q.practiceKind=kind;session.q.myWordTrial=!session.reviewMissed&&(kind==='my'||kind==='past')&&start===4}"
app=replace_once(app,old_q,new_q,'renderTask start stage')
app=replace_once(app,'<p class="task-prompt">${STAGE_PROMPTS[q.stage]}</p>','<span class="practice-kind-badge ${q.practiceKind||\'week\'}">${practiceKindLabel(q.practiceKind)}</span><p class="task-prompt">${STAGE_PROMPTS[q.stage]}</p>','practice kind badge')
app=replace_once(app,"${q.stage===3?'Trace the dotted letters, then write the empty boxes.':q.stage===4?'Write the whole word in one smooth motion. Tap Clear to try again.':'You can play the sound again.'}","${q.stage===3?'Trace the dotted letters, then write the empty boxes.':q.stage===4?(q.myWordTrial?'First, try the whole word from memory.':'Write the whole word in one smooth motion.'):'You can play the sound again.'}",'stage prompt')

new_check=r'''function checkHandwriting(w,q){
  const field=q.stage===4?$('#stage4WordInput'):q.stage===3?$('#stage3GapInput'):null;if(field){field.blur?.();const clean=weeklyAnswerText(field.value,expectedText(w,q));if(q.stage===4)q.fullAnswer=clean;else q.letters=[...clean]}
  const attempt=q.stage===4?q.fullAnswer:q.letters.join(''),correct=expectedText(w,q);if(attempt===correct){right(w,q);return}
  wrong(w,q,attempt,correct);q.feedback={bad:true};q.hint=null;const recallMiss=q.stage===4&&q.myWordTrial;const kind=q.practiceKind;q.myWordTrial=false;renderTask();playSfx('wrong');
  if(recallMiss)setTimeout(()=>{if(!session?.q||session.q.id!==w.id||session.q.stage!==4)return;const next=newQuestion(w,3,focusRange(w));next.practiceKind=kind;next.myWordTrial=false;session.q=next;helpKind='';renderTask();toast('Let’s practice the tricky part, then try the whole word again.')},850)
}
function wrong'''
app=replace_block(app,r'function checkHandwriting\(w,q\)\{',r'function wrong',new_check,'checkHandwriting')
app=replace_once(app,"session.q=newQuestion(w,stage+1,q.range);helpKind='';renderTask()","const next=newQuestion(w,stage+1,q.range);next.practiceKind=q.practiceKind;next.myWordTrial=false;session.q=next;helpKind='';renderTask()",'carry practice kind')

new_parent_helpers=r'''function adviceForWord(w,m){
  if(isCurrentFocus(w.id))return{jp:'今週のテストで重点的に見たい単語。★は今週だけ出題順を上げ、次の週には持ち越しません。',en:`Let's try “${w.word}” together.`};
  if(m.key==='help'&&m.weakText)return{jp:`「${m.weakText}」のところだけ、書かせずに一緒に見つけたり声に出したりするくらいで十分。`,en:`Can you find “${m.weakText}” in “${w.word}”?`};
  if(m.feeling==='tricky')return{jp:'本人がTrickyと感じた単語。書き取りを増やすより、一緒にゆっくり言ってみるくらいがおすすめ。',en:`Want to say “${w.word}” slowly with me?`};
  if(m.key==='ready')return{jp:'追加練習はなしでOK。できた時に、考えたことや覚えていたことを一言ほめる。',en:`You remembered “${w.word}”!`};
  if(!m.practiced)return{jp:'まだ触らなくてOK。Playが自然に出してくれるのを待つ。',en:'No need to practice this one yet.'};
  return{jp:'次にPlayで出た時に見守るだけでOK。答えを先に教えず、自分で思い出す時間を残す。',en:`Take your time with “${w.word}”.`}
}
function priorityButtonHtml(w){if(!inCurrentWeek(w.id))return'';const selected=isCurrentFocus(w.id);return`<button type="button" class="parent-priority-toggle ${selected?'selected':''}" aria-pressed="${selected}">${selected?'★ Focus this week':'☆ Focus this week'}</button>`}
function guidanceWordCardHtml(w){
  const m=masteryInfo(w),a=adviceForWord(w,m),focus=isCurrentFocus(w.id),feel=m.feeling?`<span class="miori-feel">Miori: ${feelingLabel(m.feeling)}</span>`:'',weak=m.weakText?`<span>focus: ${esc(m.weakText)}</span>`:'';
  return`<div class="word-row guidance-word-card status-${m.key} ${focus?'parent-priority':''}" data-id="${w.id}"><div><div class="mastery-word-head"><strong>${esc(w.word)}</strong>${focus?'<span class="parent-star-badge">★ This week focus</span>':''}<span class="mastery-status">${m.label}</span></div></div><div class="guidance-actions">${priorityButtonHtml(w)}<button class="audio-preview" aria-label="Hear ${esc(w.word)}">🔊</button><button class="edit-word" aria-label="Edit ${esc(w.word)}">✎</button></div><div class="mastery-meta">${feel}${weak}${m.last?`<span>last: ${esc(m.last)}</span>`:''}</div><p class="mastery-reason">${esc(focus&&m.key==='ready'?'アプリではReady。でも今週だけもう一度見たい単語として★を付けています。':m.reason)}</p><div class="try-this"><b>Dad can try</b>${esc(a.jp)}<br><em>“${esc(a.en)}”</em></div></div>`
}
function parentGuidanceCards(week){
  const rows=week.map(w=>({w,m:masteryInfo(w)})),used=new Set(),cards=[];const add=(row,kind,icon,title,text,small='')=>{if(!row||used.has(row.w.id)||cards.length>=3)return;used.add(row.w.id);cards.push(`<div class="guidance-card ${kind}"><div class="guidance-icon">${icon}</div><b>${esc(title)}</b><p>${esc(text)}</p>${small?`<small>${esc(small)}</small>`:''}</div>`)};
  const picked=rows.find(x=>isCurrentFocus(x.w.id));if(picked)add(picked,'support','⭐',`${picked.w.word}: 今週のFocus`,'今週だけ出題順を上げます。新しい週に切り替わると自動で通常の履歴になります。','This-week focus');
  const need=rows.filter(x=>x.m.key==='help').sort((a,b)=>b.m.maxWeak-a.m.maxWeak)[0];if(need){const a=adviceForWord(need.w,need.m);add(need,'support','✨',`${need.w.word}: ここだけ少し助ける`,a.jp,a.en)}
  const ready=rows.find(x=>x.m.key==='ready'&&!used.has(x.w.id));if(ready){const a=adviceForWord(ready.w,ready.m);add(ready,'celebrate','🌼',`${ready.w.word}: もう十分育ってる`,a.jp,a.en)}
  if(cards.length<3)cards.push(`<div class="guidance-card pace"><div class="guidance-icon">📚</div><b>My Wordsは長く育てる</b><p>Journalなどで見つけた単語は週をまたいで残り、まずStep 4で思い出せるか試します。</p><small>Everyday words stay useful.</small></div>`);if(cards.length<3)cards.push(`<div class="guidance-card pace"><div class="guidance-icon">☁️</div><b>Past Testsは普段は静かに</b><p>通常Playには割り込まず、Past TestsからReviewを選んだ時に確認します。</p><small>Review when it is useful.</small></div>`);return cards.slice(0,3).join('')
}
function groupBadgesHtml(w){let out='';if(inCurrentWeek(w.id))out+='<span class="group-badge week">This Week</span>';if(myWordMeta(w.id))out+='<span class="group-badge mine">My Words</span>';if(wordWasInPast(w.id))out+='<span class="group-badge history">Past Test</span>';if(w.focusHistory&&!isCurrentFocus(w.id))out+='<span class="group-badge focus">★ Previously focused</span>';return out}
function thisWeekGroupCard(w){const m=masteryInfo(w),focus=isCurrentFocus(w.id),mine=!!myWordMeta(w.id);return`<article class="group-word-card ${focus?'focus':''}" data-id="${w.id}"><div class="group-word-head"><strong>${esc(w.word)}</strong>${focus?'<span class="group-badge focus">★ Focus</span>':''}${mine?'<span class="group-badge mine">My Words too</span>':''}</div><p>${esc(w.meaningEn||'No meaning saved')}</p><div class="group-word-meta"><span>${m.label}</span>${m.weakText?`<span>focus: ${esc(m.weakText)}</span>`:''}</div><div class="group-word-actions"><button class="group-focus-toggle focus-toggle ${focus?'selected':''}" data-id="${w.id}">${focus?'★ Focus on':'☆ Focus this week'}</button><button class="group-myword-toggle myword-toggle ${mine?'selected':''}" data-id="${w.id}">${mine?'📚 In My Words':'＋ My Words'}</button><button class="group-audio" data-id="${w.id}">🔊</button><button class="group-edit" data-id="${w.id}">✎</button></div></article>`}
function myWordGroupCard(w){const meta=myWordMeta(w.id)||{},s=myWordStatus(w);return`<article class="group-word-card" data-id="${w.id}"><div class="group-word-head"><strong>${esc(w.word)}</strong><span class="group-badge mine">My Words</span>${inCurrentWeek(w.id)?'<span class="group-badge week">This Week too</span>':''}</div><p>${esc(w.meaningEn||'No meaning saved')}</p><div class="group-word-meta"><span class="myword-state ${s.key}">${s.label}</span><span>${esc(meta.source||'Everyday English')}</span></div>${meta.note?`<p class="myword-context">${esc(meta.note)}</p>`:''}<div class="group-word-actions"><button class="group-audio" data-id="${w.id}">🔊 Audio</button><button class="group-edit" data-id="${w.id}">✎ Edit</button><button class="group-remove-myword remove-myword" data-id="${w.id}">Remove from My Words</button></div></article>`}
function pastGroupsHtml(){const weeks=[...(state.pastWeeks||[])].reverse();if(!weeks.length)return'<p class="word-group-note">Past Tests will appear here automatically when you import the next week. Old ★ focus is kept as history, but it will not affect current Play.</p>';return weeks.map(week=>{const ids=uniqueWordIds(week.ids).filter(id=>state.lib[id]);return`<div class="past-week-block"><div class="past-week-head"><div><h3>${esc(week.title||'Past test')}</h3><small>${ids.length} saved words${week.archivedAt?` · archived ${esc(week.archivedAt)}`:''}</small></div><button class="past-review-btn" data-past-review="${esc(week.id)}">Review up to 5 →</button></div><div class="past-word-chips">${ids.map(id=>{const w=state.lib[id],focus=(week.focusIds||[]).includes(id)||w.focusHistory,mine=!!myWordMeta(id);return`<button type="button" class="past-word-chip ${focus?'was-focus':''} ${mine?'is-myword':''}" data-past-word="${id}" title="${mine?'Also in My Words':'Past test word'}">${esc(w.word)}${mine?' · 📚':''}</button>`}).join('')}</div></div>`}).join('')}
function wordGroupsHtml(){const week=state.week.ids.map(id=>state.lib[id]).filter(Boolean),mine=Object.keys(state.myWords||{}).map(id=>state.lib[id]).filter(Boolean),pastCount=new Set((state.pastWeeks||[]).flatMap(x=>x.ids||[])).size;return`<section class="panel word-groups-panel"><div class="panel-head"><div><p class="eyebrow">WORD GROUPS</p><h2>今の目的で分けて見る</h2><p>This Weekは短期、My Wordsは日常で使う長期、Past Testsは必要な時だけ復習。</p></div></div><div class="word-groups-summary"><div class="word-group-summary week"><small>THIS WEEK</small><b>${week.length}</b><small>今週のテスト。★はこの週だけ有効。</small></div><div class="word-group-summary mine"><small>MY WORDS</small><b>${mine.length}</b><small>Journalなどで見つけた、長く覚えたい言葉。</small></div><div class="word-group-summary past"><small>PAST TESTS</small><b>${pastCount}</b><small>通常Playにはほぼ出さず、Review用。</small></div></div><div class="word-group-tabs"><button class="word-group-tab ${parentGroupTab==='week'?'active':''}" data-group-tab="week">📝 This Week</button><button class="word-group-tab ${parentGroupTab==='my'?'active':''}" data-group-tab="my">📚 My Words</button><button class="word-group-tab ${parentGroupTab==='past'?'active':''}" data-group-tab="past">🌿 Past Tests</button></div><div class="word-group-pane ${parentGroupTab==='week'?'active':''}" data-group-pane="week"><p class="word-group-note"><b>${esc(state.week.title)}</b> · ★は今週の中だけで出題を優先。週が変わると履歴だけ残ります。</p><div class="group-word-grid">${week.map(thisWeekGroupCard).join('')||'<p>No words yet.</p>'}</div></div><div class="word-group-pane ${parentGroupTab==='my'?'active':''}" data-group-pane="my"><p class="word-group-note">日常で書けるようになりたい言葉。PlayではまずStep 4で記憶を確認し、必要な時だけStep 3に戻ります。</p><div class="group-word-grid">${mine.map(myWordGroupCard).join('')||'<p>まだMy Wordsはありません。上の「+ Add My Word」からJournalの言葉を追加できます。</p>'}</div></div><div class="word-group-pane ${parentGroupTab==='past'?'active':''}" data-group-pane="past">${pastGroupsHtml()}</div></section>`}
function recentWordsHtml'''
app=replace_block(app,r'function adviceForWord\(w,m\)\{',r'function recentWordsHtml',new_parent_helpers,'parent helper functions')

new_parent=r'''function renderParent(){
  ensureLearningGroups(state);const week=state.week.ids.map(id=>state.lib[id]).filter(Boolean),all=Object.values(state.lib).sort((a,b)=>a.word.localeCompare(b.word));
  $('#parentView').innerHTML=`<div class="parent-view parent-v4 parent-v19"><div class="parent-head"><div><p class="eyebrow">DAD SPACE</p><h1>Parent · Gentle Support</h1><p>今週のテストと、日常で使いたい言葉を分けて育てます。Past Testsは必要な時だけ静かに復習します。</p></div><div class="parent-actions"><label class="secondary-btn file-btn">Import Word Pack<input id="parentImport" type="file" accept="application/json,.json"></label><button id="exportBtn" class="secondary-btn">Export Backup</button><button id="addWordBtn" class="primary-btn">+ Add My Word</button></div></div>${wordGroupsHtml()}<div class="parent-principle"><b>考え方：</b> ★は「今週だけの作戦」。My Wordsは週をまたぐ長期の言葉。間違いの記録はどちらでも残り、Past Testsの★は履歴としてだけ残ります。</div><section class="panel guidance-panel"><div class="panel-head"><div><p class="eyebrow">HOW TO HELP MIORI</p><h2>今できる、小さなサポート</h2></div><span>up to 3 ideas</span></div><div class="guidance-cards">${parentGuidanceCards(week)}</div></section><section class="panel recent-panel"><div class="panel-head"><div><p class="eyebrow">RECENTLY EXPLORED</p><h2>最近ふれた単語</h2><p>会話のきっかけ用。何分やった・何問やった、は表示しません。</p></div></div>${recentWordsHtml()}</section><aside class="panel settings parent-audio-panel"><p class="eyebrow">PRONUNCIATION</p><h2>English voice & audio</h2><select id="voiceSelect"><option value="">Best available</option>${voices.filter(v=>/^en/i.test(v.lang)).map(v=>`<option value="${esc(v.voiceURI)}" ${v.voiceURI===state.settings.voice?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><p>Human recordings are used first when available. Device voice is the fallback.</p><button id="testVoiceBtn" class="parent-big-button">🔊 Test voice</button></aside><section class="panel library-panel"><div class="panel-head"><div><p class="eyebrow">WORD LIBRARY</p><h2>All saved words</h2></div><input id="librarySearch" class="search-input" placeholder="Search words…"></div><div id="libraryList" class="library-list word-card-list">${all.map(wordRowHtml).join('')}</div></section><section class="panel maintenance-panel"><div><p class="eyebrow">MAINTENANCE</p><h2>Reset & maintenance</h2><p>These controls are intentionally down here because you probably will not need them often.</p></div><div class="maintenance-actions"><button id="resetAllLearningBtn" class="maintenance-btn learning">↻ Reset all learning data<span>Keeps garden progress</span></button><button id="resetGardenLayoutBtn" class="maintenance-btn layout">▦ Reset garden layout<span>Keeps growth and unlocked items</span></button><button id="resetGardenProgressBtn" class="maintenance-btn danger-soft">Reset whole garden<span>Keeps word learning data</span></button></div></section></div>`;
  $('#parentImport').onchange=e=>importWordPack(e.target.files?.[0]);$('#exportBtn').onclick=exportBackup;$('#addWordBtn').onclick=()=>openWordModal();$('#voiceSelect').onchange=e=>{state.settings.voice=e.target.value;save()};$('#testVoiceBtn').onclick=()=>speak('Hello Miori. Let’s practice spelling together.');$('#librarySearch').oninput=e=>{const q=e.target.value.toLowerCase();$('#libraryList').innerHTML=all.filter(w=>!q||w.word.includes(q)||(w.meaningEn||'').toLowerCase().includes(q)).map(wordRowHtml).join('');bindParentRows()};$('#resetAllLearningBtn').onclick=resetAllLearning;$('#resetGardenLayoutBtn').onclick=resetGardenLayout;$('#resetGardenProgressBtn').onclick=resetGardenProgress;bindParentRows();bindWordGroupControls()
}
function wordRowHtml(w){const m=learningSummary(w),mine=!!myWordMeta(w.id);return`<div class="word-row parent-word-card ${isCurrentFocus(w.id)?'parent-priority':''}" data-id="${w.id}"><div class="word-main"><strong>${esc(w.word)}</strong><div class="parent-group-badges">${groupBadgesHtml(w)}</div><span class="audio-status">${w.pronunciationUrl?'● Human audio':'○ Device voice'}</span><p>${esc(w.meaningEn||'No meaning saved')}</p></div><div class="learning-mini"><span><b>${m.loops}</b> full loops</span><span><b>${m.correct}</b> correct</span><span><b>${m.mistakes}</b> mistakes</span><span>weak: <b>${esc(m.weak)}</b></span><small>${esc(m.last)}</small></div><div class="word-actions">${priorityButtonHtml(w)}<button class="parent-row-btn library-myword-toggle ${mine?'selected':''}">${mine?'📚 My Word':'＋ My Words'}</button><button class="parent-row-btn audio-preview">🔊 Audio</button><button class="parent-row-btn edit-word">✎ Edit</button><button class="parent-row-btn reset-word">↻ Reset learning</button></div></div>`}
function toggleParentPriority(id){id=norm(id);if(!inCurrentWeek(id))return;const focus=new Set(state.week.focusIds||[]);if(focus.has(id))focus.delete(id);else focus.add(id);state.week.focusIds=[...focus];const w=state.lib[id];save();renderParent();toast(isCurrentFocus(id)?`${w.word}: ★ 今週の中で優先します。`:`${w.word}: 今週の★を外しました。`)}
function toggleMyWord(id){id=norm(id);const w=state.lib[id];if(!w)return;const on=!myWordMeta(id);setMyWord(id,on,{source:inCurrentWeek(id)?'Saved from This Week':'Parent'});save();renderParent();toast(on?`${w.word}: My Wordsに残します。`:`${w.word}: My Wordsから外しました。`)}
function bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];if(!w)return;$('.parent-priority-toggle',row)?.addEventListener('click',()=>toggleParentPriority(row.dataset.id));$('.library-myword-toggle',row)?.addEventListener('click',()=>toggleMyWord(row.dataset.id));$('.audio-preview',row)?.addEventListener('click',()=>playWordAudio(w));$('.edit-word',row)?.addEventListener('click',()=>openWordModal(w.id));$('.reset-word',row)?.addEventListener('click',()=>resetOneLearning(w.id))})}
function bindWordGroupControls(){
  $$('[data-group-tab]').forEach(btn=>btn.onclick=()=>{parentGroupTab=btn.dataset.groupTab;renderParent()});$$('.group-focus-toggle').forEach(btn=>btn.onclick=()=>toggleParentPriority(btn.dataset.id));$$('.group-myword-toggle').forEach(btn=>btn.onclick=()=>toggleMyWord(btn.dataset.id));$$('.group-remove-myword').forEach(btn=>btn.onclick=()=>toggleMyWord(btn.dataset.id));$$('.group-audio').forEach(btn=>btn.onclick=()=>{const w=state.lib[btn.dataset.id];if(w)playWordAudio(w)});$$('.group-edit').forEach(btn=>btn.onclick=()=>openWordModal(btn.dataset.id));$$('[data-past-review]').forEach(btn=>btn.onclick=()=>startPastReview(btn.dataset.pastReview))
}
function openWordModal(id=null){
  const w=id?state.lib[id]:null,meta=id?myWordMeta(id):null,keep=!!meta||!w;$('#modalRoot').innerHTML=`<div class="modal"><div class="modal-card"><div class="modal-head"><div><p class="eyebrow">WORD DETAILS</p><h2>${w?'Edit Word':'Add My Word'}</h2></div><button id="closeModal" class="icon-btn">×</button></div><form id="wordForm" class="word-form"><label>Word<input id="wordInput" value="${esc(w?.word||'')}" ${w?'readonly':''} required></label><label>English meaning<textarea id="meaningEnInput" rows="2">${esc(w?.meaningEn||'')}</textarea></label><label>Japanese meaning<textarea id="meaningJaInput" rows="2">${esc(w?.meaningJa||'')}</textarea></label><label>Example sentence<textarea id="exampleInput" rows="2">${esc(w?.example||'')}</textarea></label><div class="form-two"><label>Phonics focus<input id="phonicsInput" value="${esc(w?.phonicsFocus||'')}"></label><label>Picture cue<input id="pictureCueInput" value="${esc(w?.pictureCue||'')}"></label></div><label>Picture emoji<input id="pictureEmojiInput" value="${esc(w?.pictureEmoji||'')}"></label><label>Miori's spelling<input id="mioriSpellingInput" value="${esc(w?.mioriSpelling||'')}" placeholder="e.g. becaus"></label><label><input id="keepMyWordInput" type="checkbox" ${keep?'checked':''}> Keep in My Words</label><div class="form-two"><label>Found in / reason<input id="myWordSourceInput" value="${esc(meta?.source||'Journal')}" placeholder="Journal, Reading…"></label><label>Context / note<input id="myWordNoteInput" value="${esc(meta?.note||'')}" placeholder="Sentence or why it matters"></label></div><label>Human pronunciation URL<input id="pronunciationUrlInput" value="${esc(w?.pronunciationUrl||'')}"></label><div class="modal-actions">${w?'<button type="button" id="resetLearningBtn" class="danger">Reset learning</button>':''}<button type="button" id="findAudioBtn" class="secondary-btn">Find Human Audio</button><button type="button" id="cancelModal" class="secondary-btn">Cancel</button><button type="submit" class="primary-btn">Save</button></div></form></div></div>`;
  $('#closeModal').onclick=$('#cancelModal').onclick=()=>$('#modalRoot').innerHTML='';$('#findAudioBtn').onclick=async()=>{const word=norm($('#wordInput').value);if(!word)return;const btn=$('#findAudioBtn');btn.disabled=true;btn.textContent='Searching…';const url=await findHumanAudio(word);btn.disabled=false;btn.textContent='Find Human Audio';if(url){$('#pronunciationUrlInput').value=url;toast('Human pronunciation found.')}else toast('No clear human recording found.')};$('#resetLearningBtn')?.addEventListener('click',()=>{if(confirm(`Reset learning data for “${w.word}” only?`)){w.learn=learning(w.word);save();$('#modalRoot').innerHTML='';renderParent()}});$('#wordForm').onsubmit=e=>{e.preventDefault();const word=norm($('#wordInput').value);if(!word)return;const old=state.lib[word];const raw={word,meaningEn:$('#meaningEnInput').value.trim(),meaningJa:$('#meaningJaInput').value.trim(),example:$('#exampleInput').value.trim(),phonicsFocus:$('#phonicsInput').value.trim(),pictureCue:$('#pictureCueInput').value.trim(),pictureEmoji:$('#pictureEmojiInput').value.trim(),mioriSpelling:$('#mioriSpellingInput').value.trim(),pronunciationUrl:$('#pronunciationUrlInput').value.trim(),pronunciationSource:$('#pronunciationUrlInput').value.trim()?'manual':''};state.lib[word]=normalizeWord(raw,old);setMyWord(word,$('#keepMyWordInput').checked,{source:$('#myWordSourceInput').value.trim()||'Journal',note:$('#myWordNoteInput').value.trim()});save();$('#modalRoot').innerHTML='';parentGroupTab='my';renderParent();toast('Saved to My Words.')};setTimeout(()=>$('#wordInput')?.focus(),40)
}
async function importWordPack(file){
  if(!file)return;try{const data=JSON.parse(await file.text());if(data.version&&data.lib){state=data;state.version=3;ensureLearningGroups(state);save();renderParent();toast('Backup restored.');return}const words=Array.isArray(data)?data:data.words;if(!Array.isArray(words)||!words.length)throw new Error('no words');const nextTitle=data.weekName||data.title||'This Week',ids=[];for(const raw of words){if(!raw.word)continue;const key=norm(raw.word),old=state.lib[key];state.lib[key]=normalizeWord(raw,old);ids.push(key)}const nextIds=uniqueWordIds(ids),sameTitle=state.week?.title===nextTitle,sameIds=nextIds.length===state.week.ids.length&&nextIds.every(id=>state.week.ids.includes(id));if(!(sameTitle&&sameIds))archiveWeek(state,state.week);const oldFocus=sameTitle&&sameIds?state.week.focusIds:[];state.week={id:data.weekId||weekIdentity(nextTitle),title:nextTitle,ids:nextIds,focusIds:uniqueWordIds(oldFocus).filter(id=>nextIds.includes(id))};ensureLearningGroups(state);delete state.weekTestDraft;save();parentGroupTab='week';renderParent();toast(`Imported ${ids.length} words · This Week updated.`);for(const id of state.week.ids){const w=state.lib[id];if(w&&!w.pronunciationUrl&&!w.audioTried)resolveHumanAudioForWord(w)}}catch(e){console.error(e);toast('Could not import this Word Pack.')}
}
function exportBackup'''
app=replace_block(app,r'function renderParent\(\)\{',r'function exportBackup',new_parent,'parent UI/import')

# Register v32 assets and cache-bust changed app.js.
page=replace_once(page,'  <link rel="stylesheet" href="play-viewport-v31.css?v=20260917-v31">\n</head>','  <link rel="stylesheet" href="play-viewport-v31.css?v=20260917-v31">\n  <link rel="stylesheet" href="learning-groups-v32.css?v=20260917-v32">\n</head>','v32 css link')
page=replace_once(page,'<span class="app-version-badge" aria-label="App version 31, September 17">v31 · Sep 17</span>','<span class="app-version-badge" aria-label="App version 32, September 17">v32 · Sep 17</span>','version badge')
page=replace_once(page,'<script src="app.js?v=20260917-flow-writing-v29"></script>','<script src="app.js?v=20260917-learning-groups-v32"></script>','app cache bust')
page=replace_once(page,'<!-- v31: small-iPad Step 4 feedback fits or safely scrolls; Stage 3 overflow protected -->','<!-- v32: This Week / My Words / Past Tests learning groups and 4+1 Today Play -->','version comment')

# Historical tests should assert the current visible badge/cache while retaining their own feature checks.
for test in Path('tests').glob('*.test.cjs'):
    if test.name=='learning-groups-v32.test.cjs':
        continue
    text=test.read_text(encoding='utf-8')
    text=text.replace("v31 · Sep 17","v32 · Sep 17")
    text=text.replace("app.js?v=20260917-flow-writing-v29","app.js?v=20260917-learning-groups-v32")
    test.write_text(text,encoding='utf-8')

APP.write_text(app,encoding='utf-8')
PAGE.write_text(page,encoding='utf-8')
print('v32 learning groups integrated; saved learning/Garden data migrate in place.')
