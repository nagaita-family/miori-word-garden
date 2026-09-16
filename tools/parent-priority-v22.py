"""Apply v22 parent-selected practice flags; abort on unexpected source changes."""
from pathlib import Path

p = Path('app.js')
s = p.read_text(encoding='utf-8')

def change(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected one matching anchor, found {n}')
    s = s.replace(old, new, 1)

change('audioTried:old?.audioTried||raw.audioTried||false,learn};',
       'audioTried:old?.audioTried||raw.audioTried||false,parentPriority:!!(raw.parentPriority??old?.parentPriority??false),learn};',
       'preserve flag through weekly word seeding and edits')

change("function startSession(){if(!state.week.ids.length)return toast('Add words in Parent first.');playSfx('start');syncBgm();session={count:0,goal:Math.min(GOAL,state.week.ids.length),doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()}",
       "function practiceIds(){return[...new Set([...state.week.ids,...Object.values(state.lib).filter(w=>w.parentPriority).map(w=>w.id)])].filter(id=>!!state.lib[id])}\nfunction startSession(){const ids=practiceIds();if(!ids.length)return toast('Add words in Parent first.');playSfx('start');syncBgm();session={count:0,goal:Math.min(GOAL,ids.length),ids,doneIds:[],last:'',q:null,xp:0};helpKind='';renderTask()}",
       'include starred words outside the current week')

change("function chooseWord(){let pool=state.week.ids.filter(id=>!session.doneIds.includes(id)).map(id=>state.lib[id]).filter(Boolean);if(pool.length>1)pool=pool.filter(w=>w.id!==session.last);const scored=pool.map(w=>{const l=w.learn,max=Math.max(0,...l.weak),rate=l.attempts?l.mistakes/l.attempts:0;return{w,score:(w.mioriSpelling&&w.mioriSpelling!==w.word?5:0)+max*.7+rate*5+Math.random()}}).sort((a,b)=>b.score-a.score);return scored[0]?.w}",
       "function chooseWord(){let pool=(session.ids||practiceIds()).filter(id=>!session.doneIds.includes(id)).map(id=>state.lib[id]).filter(Boolean);if(pool.length>1)pool=pool.filter(w=>w.id!==session.last);const scored=pool.map(w=>{const l=w.learn,max=Math.max(0,...l.weak),rate=l.attempts?l.mistakes/l.attempts:0;return{w,score:(w.mioriSpelling&&w.mioriSpelling!==w.word?5:0)+max*.7+rate*5+Math.random()}}).sort((a,b)=>Number(!!b.w.parentPriority)-Number(!!a.w.parentPriority)||b.score-a.score);return scored[0]?.w}",
       'starred words go first while adaptive ranking still applies within groups')

change('${state.week.ids.length} words</span><span>Real human pronunciation',
       '${practiceIds().length} words</span><span>Real human pronunciation',
       'show correct practice pool size')

change("function adviceForWord(w,m){\n  if(m.key==='help'",
       "function adviceForWord(w,m){\n  if(w.parentPriority)return{jp:'紙で気になった単語。次のPlayで先に出ます。できたら回数を増やさず、親が必要と感じなくなった時に★を外せます。',en:`Let's try “${w.word}” together.`};\n  if(m.key==='help'",
       'manual priority guidance')

change('function guidanceWordCardHtml(w){',
       'function priorityButtonHtml(w){const selected=!!w.parentPriority;return`<button type="button" class="parent-priority-toggle ${selected?\'selected\':\'\'}" aria-pressed="${selected}" aria-label="${selected?\'Remove\':\'Add\'} ${esc(w.word)} ${selected?\'from\':\'to\'} priority practice" title="紙で気になった単語を優先">${selected?\'★ 練習する\':\'☆ 練習したい\'}</button>`}\nfunction guidanceWordCardHtml(w){',
       'accessible star button helper')

change('class="word-row guidance-word-card status-${m.key}" data-id="${w.id}"',
       'class="word-row guidance-word-card status-${m.key} ${w.parentPriority?\'parent-priority\':\'\'}" data-id="${w.id}"',
       'weekly word visual marker')
change('<strong>${esc(w.word)}</strong><span class="mastery-status">${m.label}</span>',
       '<strong>${esc(w.word)}</strong>${w.parentPriority?\'<span class="parent-star-badge">★ Parent pick</span>\':\'\'}<span class="mastery-status">${m.label}</span>',
       'keep manual priority separate from computed mastery')
change('<div class="guidance-actions"><button class="audio-preview"',
       '<div class="guidance-actions">${priorityButtonHtml(w)}<button class="audio-preview"',
       'weekly card star button')
change('<p class="mastery-reason">${esc(m.reason)}</p>',
       '<p class="mastery-reason">${esc(w.parentPriority&&m.key===\'ready\'?\'アプリではReady。紙の練習で気になったため、親がもう一度試す単語に選んでいます。\':m.reason)}</p>',
       'avoid conflicting ready guidance')

change("  const need=rows.filter(x=>x.m.key==='help')",
       "  const picked=rows.find(x=>x.w.parentPriority);if(picked)add(picked,'support','⭐',`${picked.w.word}: 紙での気づき`,'親が練習に選んだ単語。次のPlayで優先されます。','Parent-selected practice');\n  const need=rows.filter(x=>x.m.key==='help')",
       'show parent observation among gentle suggestions')

change('<span class="help">✨ Little help</span>',
       '<span class="help">✨ Little help</span><span class="parent-priority-legend">★ Parent pick</span>',
       'separate manual-status legend')
change('class="word-row parent-word-card" data-id="${w.id}"',
       'class="word-row parent-word-card ${w.parentPriority?\'parent-priority\':\'\'}" data-id="${w.id}"',
       'library card marker')
change('<strong>${esc(w.word)}</strong><span class="audio-status">',
       '<strong>${esc(w.word)}</strong>${w.parentPriority?\'<span class="parent-star-badge">★ Parent pick</span>\':\'\'}<span class="audio-status">',
       'library flag badge')
change('<div class="word-actions"><button class="parent-row-btn audio-preview">',
       '<div class="word-actions">${priorityButtonHtml(w)}<button class="parent-row-btn audio-preview">',
       'library star button')

change("function bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];if(!w)return;$('.audio-preview',row)?.addEventListener('click',()=>playWordAudio(w));$('.edit-word',row)?.addEventListener('click',()=>openWordModal(w.id));$('.reset-word',row)?.addEventListener('click',()=>resetOneLearning(w.id))})}",
       "function toggleParentPriority(id){const w=state.lib[id];if(!w)return;const query=$('#librarySearch')?.value||'';w.parentPriority=!w.parentPriority;save();renderParent();if(query){const input=$('#librarySearch');input.value=query;input.dispatchEvent(new Event('input'))}toast(w.parentPriority?`${w.word}: ★ 次のPlayで優先します。`:`${w.word}: ★ を外しました。`)}\nfunction bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];if(!w)return;$('.parent-priority-toggle',row)?.addEventListener('click',()=>toggleParentPriority(row.dataset.id));$('.audio-preview',row)?.addEventListener('click',()=>playWordAudio(w));$('.edit-word',row)?.addEventListener('click',()=>openWordModal(w.id));$('.reset-word',row)?.addEventListener('click',()=>resetOneLearning(w.id))})}",
       'toggle persists and re-renders both word lists')

p.write_text(s, encoding='utf-8')
print('v22: parent star flags and priority practice applied successfully')