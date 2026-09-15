from pathlib import Path
import re

p=Path('app.js')
s=p.read_text()

def replace_once(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: source not found')
    s=s.replace(old,new,1)

def sub_once(pattern,repl,label):
    global s
    s2,n=re.subn(pattern,repl,s,count=1,flags=re.S)
    if n!=1:
        raise SystemExit(f'{label}: expected 1 replacement, got {n}')
    s=s2

# Store only what helps supportive guidance: latest self-feeling and a light recent-word list.
replace_once(
"function learning(word){return{attempts:0,correct:0,first:0,mistakes:0,stageMist:{1:0,2:0,3:0,4:0},weak:Array(word.length).fill(0),lastWrong:'',last:'',hints:0,peeks:0,loops:0}}",
"function learning(word){return{attempts:0,correct:0,first:0,mistakes:0,stageMist:{1:0,2:0,3:0,4:0},weak:Array(word.length).fill(0),lastWrong:'',last:'',hints:0,peeks:0,loops:0,feeling:'',feelingDate:''}}",
'learning feeling fields')
replace_once(
"  learn.hints=learn.hints||0;learn.peeks=learn.peeks||0;learn.loops=learn.loops||0;",
"  learn.hints=learn.hints||0;learn.peeks=learn.peeks||0;learn.loops=learn.loops||0;learn.feeling=learn.feeling||'';learn.feelingDate=learn.feelingDate||'';",
'normalize feeling fields')
replace_once(
"settings:{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true},stats:{answers:0,sessions:0}}}",
"settings:{sound:true,music:true,musicV2:true,voice:'',audioDefaultV17:true},stats:{answers:0,sessions:0},recentWords:[]}}",
'default recent words')
replace_once(
"  seedSchoolWords(s);localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s;",
"  s.recentWords=Array.isArray(s.recentWords)?s.recentWords:[];seedSchoolWords(s);localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s;",
'load recent words')

# On full-word completion, keep a tiny recent list and occasionally ask Miori how it felt.
replace_once(
"  const gain=30,beforeGrowth=state.garden.growth,beforeXp=state.xp;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;session.xp+=gain;session.count++;if(!session.doneIds.includes(w.id))session.doneIds.push(w.id);",
"  const gain=30,beforeGrowth=state.garden.growth,beforeXp=state.xp;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;session.xp+=gain;session.count++;if(!session.doneIds.includes(w.id))session.doneIds.push(w.id);state.recentWords=[{id:w.id,date:today()},...(state.recentWords||[]).filter(x=>x.id!==w.id)].slice(0,8);const askFeeling=(Math.floor(state.xp/30)%3===0);",
'recent and reflection')
replace_once(
"gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,beforeGrowth,growth:state.garden.growth,finished,unlock:unlockedReward?{id:unlockedReward.id,label:unlockedReward.label,icon:unlockedReward.icon}:null};",
"gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,beforeGrowth,growth:state.garden.growth,finished,askFeeling,unlock:unlockedReward?{id:unlockedReward.id,label:unlockedReward.label,icon:unlockedReward.icon}:null};",
'celebration reflection')

# Optional self-reflection sits inside the reward card and never blocks Next word.
replace_once(
"  const rewardCard=celebration?`<div class=\"reward-garden-card\"><div class=\"reward-emoji\">${esc(celebration.emoji||'🌱')}</div><div class=\"copy\"><b>${esc(celebration.word)} made THIS plant grow! ✦</b><span>Word complete · ${growthCopy}</span></div><button id=\"gardenNextWordBtn\">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';",
"  const feelingPrompt=celebration?.askFeeling?`<div class=\"feel-check\"><small>How did that feel?</small><button class=\"feel-btn\" data-word=\"${esc(celebration.word)}\" data-feel=\"easy\">😊 Easy</button><button class=\"feel-btn\" data-word=\"${esc(celebration.word)}\" data-feel=\"almost\">🙂 Almost</button><button class=\"feel-btn\" data-word=\"${esc(celebration.word)}\" data-feel=\"tricky\">😵 Tricky</button></div>`:'';\n  const rewardCard=celebration?`<div class=\"reward-garden-card\"><div class=\"reward-emoji\">${esc(celebration.emoji||'🌱')}</div><div class=\"copy\"><b>${esc(celebration.word)} made THIS plant grow! ✦</b><span>Word complete · ${growthCopy}</span>${feelingPrompt}</div><button id=\"gardenNextWordBtn\">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';",
'reward self reflection')
replace_once(
"  $('#gardenNextWordBtn')?.addEventListener('click',continuePlay);",
"  $('#gardenNextWordBtn')?.addEventListener('click',continuePlay);$$('.feel-btn').forEach(btn=>btn.addEventListener('click',()=>{const w=state.lib[btn.dataset.word];if(!w)return;w.learn.feeling=btn.dataset.feel;w.learn.feelingDate=today();save();const wrap=btn.closest('.feel-check');$$('.feel-btn',wrap).forEach(x=>x.classList.toggle('selected',x===btn));if(!$('.feel-thanks',wrap))wrap?.insertAdjacentHTML('beforeend','<span class=\"feel-thanks\">Thanks ♡</span>');playSfx('tap')}));",
'bind self reflection')

# Replace parent reporting with supportive, non-surveillance guidance.
pattern=r"function learningSummary\(w\)\{.*?\nfunction wordRowHtml\(w\)"
repl=r'''function masteryInfo(w){
  const l=w.learn||learning(w.word),vals=l.weak||[],maxWeak=Math.max(0,...vals),wi=maxWeak?vals.indexOf(maxWeak):-1,loops=l.loops||0,stage4=l.stageMist?.[4]||0,practiced=loops>0||(l.correct||0)>0||(l.mistakes||0)>0,feeling=l.feeling||'';
  const weakText=maxWeak>=2&&wi>=0?w.word.slice(wi,Math.min(w.word.length,wi+2)):'';
  const repeated=loops>=2&&(maxWeak>=4||(stage4>=2&&maxWeak>=2));
  const ready=loops>=2&&maxWeak<=1&&stage4<=1&&(l.mistakes||0)<=Math.max(3,loops*2);
  let key='growing',label='🌱 Growing',reason='Still settling in — no need to push it.';
  if(!practiced)reason='Not explored yet. It can wait until Play brings it up.';
  else if(repeated){key='help';label='✨ Needs a little help';reason=weakText?`She has paused around “${weakText}” more than once.`:'Whole-word spelling is still taking a little extra thought.'}
  else if(ready){key='ready';label='🌼 Ready';reason='This word is looking steady. Extra practice is not needed right now.'}
  else if(feeling==='tricky')reason='Miori said this one felt tricky. That feeling matters even if the answers are improving.';
  else if(weakText)reason=`The “${weakText}” part is still becoming familiar.`;
  return{key,label,reason,weakText,feeling,loops,last:l.last||'',practiced,maxWeak,stage4}
}
function feelingLabel(feel){return({easy:'😊 Easy',almost:'🙂 Almost',tricky:'😵 Tricky'})[feel]||''}
function adviceForWord(w,m){
  if(m.key==='help'&&m.weakText)return{jp:`「${m.weakText}」のところだけ、書かせずに一緒に見つけたり声に出したりするくらいで十分。`,en:`Can you find “${m.weakText}” in “${w.word}”?`};
  if(m.feeling==='tricky')return{jp:'本人がTrickyと感じた単語。書き取りを増やすより、一緒にゆっくり言ってみるくらいがおすすめ。',en:`Want to say “${w.word}” slowly with me?`};
  if(m.key==='ready')return{jp:'追加練習はなしでOK。できた時に、考えたことや覚えていたことを一言ほめる。',en:`You remembered “${w.word}”!`};
  if(!m.practiced)return{jp:'まだ触らなくてOK。Playが自然に出してくれるのを待つ。',en:'No need to practice this one yet.'};
  return{jp:'次にPlayで出た時に見守るだけでOK。答えを先に教えず、自分で思い出す時間を残す。',en:`Take your time with “${w.word}”.`}
}
function guidanceWordCardHtml(w){
  const m=masteryInfo(w),a=adviceForWord(w,m),feel=m.feeling?`<span class="miori-feel">Miori: ${feelingLabel(m.feeling)}</span>`:'',weak=m.weakText?`<span>focus: ${esc(m.weakText)}</span>`:'';
  return`<div class="word-row guidance-word-card status-${m.key}" data-id="${w.id}"><div><div class="mastery-word-head"><strong>${esc(w.word)}</strong><span class="mastery-status">${m.label}</span></div></div><div class="guidance-actions"><button class="audio-preview" aria-label="Hear ${esc(w.word)}">🔊</button><button class="edit-word" aria-label="Edit ${esc(w.word)}">✎</button></div><div class="mastery-meta">${feel}${weak}${m.last?`<span>last: ${esc(m.last)}</span>`:''}</div><p class="mastery-reason">${esc(m.reason)}</p><div class="try-this"><b>Dad can try</b>${esc(a.jp)}<br><em>“${esc(a.en)}”</em></div></div>`
}
function parentGuidanceCards(week){
  const rows=week.map(w=>({w,m:masteryInfo(w)})),used=new Set(),cards=[];
  const add=(row,kind,icon,title,text,small='')=>{if(!row||used.has(row.w.id)||cards.length>=3)return;used.add(row.w.id);cards.push(`<div class="guidance-card ${kind}"><div class="guidance-icon">${icon}</div><b>${esc(title)}</b><p>${esc(text)}</p>${small?`<small>${esc(small)}</small>`:''}</div>`)};
  const need=rows.filter(x=>x.m.key==='help').sort((a,b)=>b.m.maxWeak-a.m.maxWeak)[0];
  if(need){const a=adviceForWord(need.w,need.m);add(need,'support','✨',`${need.w.word}: ここだけ少し助ける`,a.jp,a.en)}
  const tricky=rows.find(x=>x.m.feeling==='tricky'&&!used.has(x.w.id));
  if(tricky){const a=adviceForWord(tricky.w,tricky.m);add(tricky,'support','💭',`${tricky.w.word}: 本人はTricky`,a.jp,a.en)}
  const ready=rows.find(x=>x.m.key==='ready'&&!used.has(x.w.id));
  if(ready){const a=adviceForWord(ready.w,ready.m);add(ready,'celebrate','🌼',`${ready.w.word}: もう十分育ってる`,a.jp,a.en)}
  if(cards.length<3)cards.push(`<div class="guidance-card pace"><div class="guidance-icon">🌿</div><b>ペースは美織に任せてOK</b><p>量や時間を増やすより、「どの単語がおもしろかった？」くらいの会話で十分。</p><small>No need to turn it into homework.</small></div>`);
  if(cards.length<3)cards.push(`<div class="guidance-card celebrate"><div class="guidance-icon">♡</div><b>結果より、考えたことをほめる</b><p>正解そのものより「自分で思い出したね」「最後まで考えたね」の方を拾う。</p><small>Notice effort, not just accuracy.</small></div>`);
  if(cards.length<3)cards.push(`<div class="guidance-card pace"><div class="guidance-icon">☁️</div><b>何もしない日も大丈夫</b><p>このページに「要サポート」がなければ、追加練習を作らなくてOK。</p><small>Sometimes the best help is space.</small></div>`);
  return cards.slice(0,3).join('')
}
function recentWordsHtml(){
  const rows=(state.recentWords||[]).slice(0,6).map(x=>({x,w:state.lib[x.id]})).filter(x=>x.w);if(!rows.length)return'<p class="recent-empty">まだ最近の記録はありません。ここでは時間や回数は追いません。</p>';
  return`<div class="recent-word-chips">${rows.map(({x,w})=>`<span class="recent-word-chip">${esc(w.word)} <small>${x.date===today()?'today':'recent'}</small></span>`).join('')}</div>`
}
function learningSummary(w){const l=w.learn||learning(w.word),weak=Math.max(0,...(l.weak||[])),wi=weak?(l.weak||[]).indexOf(weak):-1;return{loops:l.loops||0,correct:l.correct||0,mistakes:l.mistakes||0,weak:wi>=0?w.word.slice(wi,Math.min(w.word.length,wi+2)):'—',last:l.last||'Not practiced yet'}}
function renderParent(){
  const week=state.week.ids.map(id=>state.lib[id]).filter(Boolean),all=Object.values(state.lib).sort((a,b)=>a.word.localeCompare(b.word));
  $('#parentView').innerHTML=`<div class="parent-view parent-v4 parent-v19"><div class="parent-head"><div><p class="eyebrow">DAD SPACE</p><h1>Parent · Gentle Support</h1><p>美織のペースはそのまま。ここは「どれだけやったか」を管理する場所ではなく、「今どこを少し助けるとよさそうか」を見る場所です。</p></div><div class="parent-actions"><label class="secondary-btn file-btn">Import Word Pack<input id="parentImport" type="file" accept="application/json,.json"></label><button id="exportBtn" class="secondary-btn">Export Backup</button><button id="addWordBtn" class="primary-btn">+ Add Word</button></div></div><div class="parent-principle"><b>目安：</b> 1回の間違いでは「苦手」にしません。同じところで繰り返し迷った時だけサポート候補に上げます。Readyなら、追加練習を作らないことも大切です。</div><section class="panel guidance-panel"><div class="panel-head"><div><p class="eyebrow">HOW TO HELP MIORI</p><h2>今できる、小さなサポート</h2></div><span>up to 3 ideas</span></div><div class="guidance-cards">${parentGuidanceCards(week)}</div></section><section class="panel recent-panel"><div class="panel-head"><div><p class="eyebrow">RECENTLY EXPLORED</p><h2>最近ふれた単語</h2><p>会話のきっかけ用。何分やった・何問やった、は表示しません。</p></div></div>${recentWordsHtml()}</section><section class="panel mastery-panel"><div class="panel-head"><div><p class="eyebrow">THIS WEEK</p><h2>${esc(state.week.title)}</h2></div><div class="mastery-legend"><span class="ready">🌼 Ready</span><span class="growing">🌱 Growing</span><span class="help">✨ Little help</span></div></div><div class="mastery-grid">${week.map(guidanceWordCardHtml).join('')}</div></section><aside class="panel settings parent-audio-panel"><p class="eyebrow">PRONUNCIATION</p><h2>English voice & audio</h2><select id="voiceSelect"><option value="">Best available</option>${voices.filter(v=>/^en/i.test(v.lang)).map(v=>`<option value="${esc(v.voiceURI)}" ${v.voiceURI===state.settings.voice?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><p>Human recordings are used first when available. Device voice is the fallback.</p><button id="testVoiceBtn" class="parent-big-button">🔊 Test voice</button></aside><section class="panel library-panel"><div class="panel-head"><div><p class="eyebrow">WORD LIBRARY</p><h2>Technical word details</h2></div><input id="librarySearch" class="search-input" placeholder="Search words…"></div><div id="libraryList" class="library-list word-card-list">${all.map(wordRowHtml).join('')}</div></section><section class="panel maintenance-panel"><div><p class="eyebrow">MAINTENANCE</p><h2>Reset & maintenance</h2><p>These controls are intentionally down here because you probably will not need them often.</p></div><div class="maintenance-actions"><button id="resetAllLearningBtn" class="maintenance-btn learning">↻ Reset all learning data<span>Keeps garden progress</span></button><button id="resetGardenLayoutBtn" class="maintenance-btn layout">▦ Reset garden layout<span>Keeps growth and unlocked items</span></button><button id="resetGardenProgressBtn" class="maintenance-btn danger-soft">Reset whole garden<span>Keeps word learning data</span></button></div></section></div>`;
  $('#parentImport').onchange=e=>importWordPack(e.target.files?.[0]);$('#exportBtn').onclick=exportBackup;$('#addWordBtn').onclick=()=>openWordModal();$('#voiceSelect').onchange=e=>{state.settings.voice=e.target.value;save()};$('#testVoiceBtn').onclick=()=>speak('Hello Miori. Let’s practice spelling together.');$('#librarySearch').oninput=e=>{const q=e.target.value.toLowerCase();$('#libraryList').innerHTML=all.filter(w=>!q||w.word.includes(q)||(w.meaningEn||'').toLowerCase().includes(q)).map(wordRowHtml).join('');bindParentRows()};$('#resetAllLearningBtn').onclick=resetAllLearning;$('#resetGardenLayoutBtn').onclick=resetGardenLayout;$('#resetGardenProgressBtn').onclick=resetGardenProgress;bindParentRows()
}
function wordRowHtml(w)'''
sub_once(pattern,repl,'parent guidance functions')

# Guidance cards intentionally omit the reset button, so row binding must be tolerant.
replace_once(
"function bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];$('.audio-preview',row).onclick=()=>playWordAudio(w);$('.edit-word',row).onclick=()=>openWordModal(w.id);$('.reset-word',row).onclick=()=>resetOneLearning(w.id)})}",
"function bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];if(!w)return;$('.audio-preview',row)?.addEventListener('click',()=>playWordAudio(w));$('.edit-word',row)?.addEventListener('click',()=>openWordModal(w.id));$('.reset-word',row)?.addEventListener('click',()=>resetOneLearning(w.id))})}",
'optional parent row actions')

p.write_text(s)
