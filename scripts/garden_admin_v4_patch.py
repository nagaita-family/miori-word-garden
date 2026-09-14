from pathlib import Path

p=Path('app.js')
s=p.read_text()

s=s.replace("garden:{growth:0,pos:{},bunnySeated:false}","garden:{growth:0,pos:{},bunnySeated:false,stored:[]}")
s=s.replace("s.garden=s.garden||{growth:0,pos:{},bunnySeated:false};s.garden.pos=s.garden.pos||{};if(typeof s.garden.bunnySeated!=='boolean')s.garden.bunnySeated=false;",
            "s.garden=s.garden||{growth:0,pos:{},bunnySeated:false,stored:[]};s.garden.pos=s.garden.pos||{};if(typeof s.garden.bunnySeated!=='boolean')s.garden.bunnySeated=false;if(!Array.isArray(s.garden.stored))s.garden.stored=[];")

s=s.replace("const celebration=gardenCelebration;const target=celebration?(celebration.growth<=5?'left':'right'):'';",
            "const celebration=gardenCelebration;const target=celebration?(celebration.growth<=5?'left':'right'):'';const storedCount=(state.garden.stored||[]).length;const unlockedTreasureCount=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp).length;")

old='<button class="primary-btn garden-play" id="gardenPlayBtn">${celebration?\'Keep going ✦\':\'Play! ✦\'}</button>'
new='<div class="garden-head-actions"><button class="secondary-btn treasure-open" id="treasureChestBtn">🧺 Treasure Box <span>${storedCount}/${unlockedTreasureCount}</span></button><button class="primary-btn garden-play" id="gardenPlayBtn">${celebration?\'Keep going ✦\':\'Play! ✦\'}</button></div>'
if old not in s: raise SystemExit('garden head target not found')
s=s.replace(old,new,1)

s=s.replace("$('#gardenPlayBtn').onclick=()=>celebration?continuePlay():(playSfx('tap'),setView('play'));",
            "$('#gardenPlayBtn').onclick=()=>celebration?continuePlay():(playSfx('tap'),setView('play'));$('#treasureChestBtn')?.addEventListener('click',()=>{playSfx('tap');openTreasureChest()});")

s=s.replace("rewards.filter(r=>state.xp>=r.xp).forEach(r=>{",
            "rewards.filter(r=>state.xp>=r.xp&&!(state.garden.stored||[]).includes(r.id)).forEach(r=>{")

marker='function releaseBunnyHere(pos){'
chest=r'''function openTreasureChest(){
  const unlocked=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp);const stored=state.garden.stored||[];
  const cards=unlocked.length?unlocked.map(r=>{const away=stored.includes(r.id);return`<div class="treasure-card ${away?'stored':''}" data-treasure="${r.id}"><div class="treasure-art">${gardenObjectArt(r)}</div><div class="treasure-copy"><b>${esc(r.label)}</b><span>${away?'In Treasure Box':'In the garden'}</span></div><button class="${away?'place-item':'store-item'}" data-id="${r.id}">${away?'Place in garden':'Put away'}</button></div>`}).join(''):`<div class="treasure-empty">Keep spelling — your first garden treasure will unlock soon ✦</div>`;
  $('#modalRoot').innerHTML=`<div class="modal treasure-modal"><div class="modal-card treasure-panel"><div class="modal-head"><div><p class="eyebrow">MY COLLECTION</p><h2>🧺 Treasure Box</h2><p>Keep special items here, then bring them back whenever you want.</p></div><button id="closeTreasure" class="icon-btn">×</button></div><div class="treasure-grid">${cards}</div></div></div>`;
  $('#closeTreasure').onclick=()=>$('#modalRoot').innerHTML='';
  $$('.store-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();openTreasureChest();playSfx('tap')});
  $$('.place-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;state.garden.stored=state.garden.stored.filter(x=>x!==id);if(!state.garden.pos[id])state.garden.pos[id]=gardenDefaultPos(id);save();renderGarden();openTreasureChest();playSfx('sparkle')});
}

'''
if marker not in s: raise SystemExit('release marker missing')
s=s.replace(marker,chest+marker,1)

start=s.index('function renderParent(){')
end=s.index('function openWordModal',start)
replacement=r'''function resetOneLearning(id){const w=state.lib[id];if(!w)return;if(confirm(`Reset learning data for “${w.word}” only?`)){w.learn=learning(w.word);save();renderParent();toast(`${w.word}: learning data reset.`)}}
function resetAllLearning(){if(!confirm('Reset learning data for ALL words? Garden items and XP will stay.'))return;Object.values(state.lib).forEach(w=>w.learn=learning(w.word));save();renderParent();toast('All learning data reset.')}
function resetGardenLayout(){if(!confirm('Reset garden positions? Items in the Treasure Box will stay there.'))return;state.garden.pos={};state.garden.bunnySeated=false;save();renderParent();toast('Garden layout reset.')}
function resetGardenProgress(){if(!confirm('Reset the whole garden? This resets XP, plant growth, item positions, and the Treasure Box. Word learning data will NOT be deleted.'))return;state.xp=0;state.garden={growth:0,pos:{},bunnySeated:false,stored:[]};save();renderParent();toast('Garden reset. Learning data kept.')}
function learningSummary(w){const l=w.learn||learning(w.word),weak=Math.max(0,...(l.weak||[])),wi=weak?(l.weak||[]).indexOf(weak):-1;return{loops:l.loops||0,correct:l.correct||0,mistakes:l.mistakes||0,weak:wi>=0?w.word.slice(wi,Math.min(w.word.length,wi+2)):'—',last:l.last||'Not practiced yet'}}
function renderParent(){
  const week=state.week.ids.map(id=>state.lib[id]).filter(Boolean),all=Object.values(state.lib).sort((a,b)=>a.word.localeCompare(b.word));
  $('#parentView').innerHTML=`<div class="parent-view parent-v4"><div class="parent-head"><div><p class="eyebrow">DAD SPACE</p><h1>Parent</h1><p>Everything Dad needs to maintain words, pronunciation, learning data, and the garden.</p></div><div class="parent-actions"><label class="secondary-btn file-btn">Import Word Pack<input id="parentImport" type="file" accept="application/json,.json"></label><button id="exportBtn" class="secondary-btn">Export Backup</button><button id="addWordBtn" class="primary-btn">+ Add Word</button></div></div><div class="parent-stats-row"><div><b>${week.length}</b><span>This week</span></div><div><b>${state.xp}</b><span>Total XP</span></div><div><b>${state.garden.growth||0}</b><span>Garden growth</span></div><div><b>${rewards.filter(r=>state.xp>=r.xp).length}</b><span>Unlocked friends & items</span></div></div><div class="parent-grid parent-main-grid"><section class="panel"><div class="panel-head"><div><p class="eyebrow">THIS WEEK</p><h2>${esc(state.week.title)}</h2></div><span>${week.length} words</span></div><div class="week-list word-card-list">${week.map(wordRowHtml).join('')}</div></section><aside class="panel settings parent-audio-panel"><p class="eyebrow">PRONUNCIATION</p><h2>English voice & audio</h2><select id="voiceSelect"><option value="">Best available</option>${voices.filter(v=>/^en/i.test(v.lang)).map(v=>`<option value="${esc(v.voiceURI)}" ${v.voiceURI===state.settings.voice?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><p>Human recordings are used first when available. Device voice is the fallback.</p><button id="testVoiceBtn" class="parent-big-button">🔊 Test voice</button></aside></div><section class="panel library-panel"><div class="panel-head"><div><p class="eyebrow">WORD LIBRARY</p><h2>All saved words</h2></div><input id="librarySearch" class="search-input" placeholder="Search words…"></div><div id="libraryList" class="library-list word-card-list">${all.map(wordRowHtml).join('')}</div></section><section class="panel maintenance-panel"><div><p class="eyebrow">MAINTENANCE</p><h2>Reset & maintenance</h2><p>These controls are intentionally down here because you probably will not need them often.</p></div><div class="maintenance-actions"><button id="resetAllLearningBtn" class="maintenance-btn learning">↻ Reset all learning data<span>Keeps XP and the garden</span></button><button id="resetGardenLayoutBtn" class="maintenance-btn layout">▦ Reset garden layout<span>Keeps growth and unlocked items</span></button><button id="resetGardenProgressBtn" class="maintenance-btn danger-soft">Reset whole garden<span>Keeps word learning data</span></button></div></section></div>`;
  $('#parentImport').onchange=e=>importWordPack(e.target.files?.[0]);$('#exportBtn').onclick=exportBackup;$('#addWordBtn').onclick=()=>openWordModal();$('#voiceSelect').onchange=e=>{state.settings.voice=e.target.value;save()};$('#testVoiceBtn').onclick=()=>speak('Hello Miori. Let’s practice spelling together.');$('#librarySearch').oninput=e=>{const q=e.target.value.toLowerCase();$('#libraryList').innerHTML=all.filter(w=>!q||w.word.includes(q)||(w.meaningEn||'').toLowerCase().includes(q)).map(wordRowHtml).join('');bindParentRows()};$('#resetAllLearningBtn').onclick=resetAllLearning;$('#resetGardenLayoutBtn').onclick=resetGardenLayout;$('#resetGardenProgressBtn').onclick=resetGardenProgress;bindParentRows()
}
function wordRowHtml(w){const m=learningSummary(w);return`<div class="word-row parent-word-card" data-id="${w.id}"><div class="word-main"><strong>${esc(w.word)}</strong><span class="audio-status">${w.pronunciationUrl?'● Human audio':'○ Device voice'}</span><p>${esc(w.meaningEn||'No meaning saved')}</p></div><div class="learning-mini"><span><b>${m.loops}</b> full loops</span><span><b>${m.correct}</b> correct</span><span><b>${m.mistakes}</b> mistakes</span><span>weak: <b>${esc(m.weak)}</b></span><small>${esc(m.last)}</small></div><div class="word-actions"><button class="parent-row-btn audio-preview">🔊 Audio</button><button class="parent-row-btn edit-word">✎ Edit</button><button class="parent-row-btn reset-word">↻ Reset learning</button></div></div>`}
function bindParentRows(){$$('.word-row').forEach(row=>{const w=state.lib[row.dataset.id];$('.audio-preview',row).onclick=()=>playWordAudio(w);$('.edit-word',row).onclick=()=>openWordModal(w.id);$('.reset-word',row).onclick=()=>resetOneLearning(w.id)})}
'''
s=s[:start]+replacement+s[end:]
p.write_text(s)

idx=Path('index.html')
h=idx.read_text()
if 'apple-touch-icon' not in h:
    h=h.replace('<meta name="apple-mobile-web-app-capable" content="yes">','<meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-title" content="Word Garden">\n  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png?v=20260914-v4">\n  <link rel="icon" type="image/png" sizes="192x192" href="icon-192.png?v=20260914-v4">\n  <link rel="manifest" href="manifest.webmanifest?v=20260914-v4">')
h=h.replace('<span class="brand-mark">✿</span>','<span class="brand-mark app-icon-mark"><img src="app-icon.svg?v=20260914-v4" alt=""></span>')
if 'garden-admin-v4.css' not in h:
    h=h.replace('</head>','  <link rel="stylesheet" href="garden-admin-v4.css?v=20260914-v4">\n</head>')
h=h.replace('app.js?v=20260914-garden-v3','app.js?v=20260914-garden-v4')
idx.write_text(h)
