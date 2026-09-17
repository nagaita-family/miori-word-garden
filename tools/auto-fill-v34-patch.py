"""One-time, guarded integration of v34 suggestions into the existing single-file app."""
from pathlib import Path
app_path=Path('app.js');html_path=Path('index.html')
app=app_path.read_text(encoding='utf-8');html=html_path.read_text(encoding='utf-8')

def one(src,old,new,name):
    count=src.count(old)
    if count!=1:raise RuntimeError(f'{name}: expected one anchor, got {count}')
    return src.replace(old,new,1)

app=one(app,'focusHistory:!!(raw.focusHistory??old?.focusHistory??false),learn};','focusHistory:!!(raw.focusHistory??old?.focusHistory??false),autoFillSources:raw.autoFillSources??old?.autoFillSources??{},learn};','preserve suggestion source')

helpers=r'''
// Only sourced suggestions are filled. Parent/school content and learning history are never replaced.
let autoFillBusy=false,autoFillNotice='';
const autoFillFields=['meaningEn','meaningJa','example','phonicsFocus','pictureCue','pictureEmoji'];
function autoFieldMissing(w,key){return !String(w?.[key]||'').trim()||(key==='pictureEmoji'&&w.pictureEmoji==='✦')}
function applyAutoFillFields(w,suggestion,{protectSchoolMeaning=false}={}){
  if(!w||!suggestion?.fields)return 0;
  let changed=0;w.autoFillSources=w.autoFillSources||{};
  for(const key of autoFillFields){
    if(key==='meaningEn'&&protectSchoolMeaning)continue;
    const value=String(suggestion.fields[key]||'').trim();
    if(!value||!autoFieldMissing(w,key))continue;
    w[key]=key==='phonicsFocus'?norm(value):value;
    w.autoFillSources[key]=suggestion.sources?.[key]||'Suggestion';changed++;
  }
  return changed;
}
function showAutoFillNotice(message){autoFillNotice=message;const el=$('#autoFillStatus');if(el)el.textContent=message}
async function fillMissingInfo(group,weekId=''){
  if(autoFillBusy)return;
  if(!window.WordGardenAutoFill)return toast('Auto Fill is not available. Please reload the page.');
  const past=(state.pastWeeks||[]).find(x=>x.id===weekId);
  const ids=uniqueWordIds(group==='week'?state.week.ids:group==='my'?Object.keys(state.myWords||{}):past?.ids||[]).filter(id=>state.lib[id]);
  if(!ids.length)return toast('No words in this group yet.');
  const initialState=state;autoFillBusy=true;let changedWords=0,addedFields=0,audioFound=0,checked=0;
  showAutoFillNotice(`Searching 0 / ${ids.length} words… School meanings will not be overwritten.`);renderParent();
  try{
    for(const id of ids){
      if(state!==initialState)break;const w=state.lib[id];if(!w)continue;
      const needAudio=!w.pronunciationUrl;
      const [suggestion,audio]=await Promise.all([
        window.WordGardenAutoFill.lookup(id),needAudio?findHumanAudio(id):Promise.resolve('')
      ]);
      if(state!==initialState)break;
      let changed=applyAutoFillFields(w,suggestion,{protectSchoolMeaning:group!=='my'||inCurrentWeek(id)||wordWasInPast(id)});
      if(needAudio){w.audioTried=true;if(audio&&isWordOnlyHumanAudio(id,'',audio)){
        w.pronunciationUrl=audio;w.pronunciationSource='Wikimedia Commons';changed++;audioFound++;
      }}
      checked++;if(changed){changedWords++;addedFields+=changed;save()}else if(needAudio)save();
      showAutoFillNotice(`Searching ${checked} / ${ids.length} words… ${changedWords} words updated.`);
    }
  }catch(e){console.warn('Auto Fill did not finish',e);showAutoFillNotice('Some searches were unavailable. Existing data was kept.');}
  finally{
    autoFillBusy=false;
    if(state===initialState)autoFillNotice=`Checked ${checked}/${ids.length} words · ${changedWords} updated · ${addedFields} fields filled (${audioFound} human recordings). Unavailable suggestions remain blank. Please review added meanings.`;
    renderParent();
  }
}
'''
app=one(app,'function openWordModal(id=null){',helpers+'\nfunction openWordModal(id=null){','insert autofill logic')

app=one(app,'<div class="word-group-pane ${parentGroupTab===\'week\'?\'active\':\'\'}" data-group-pane="week"><p',
        '<p id="autoFillStatus" class="auto-fill-notice" role="status" aria-live="polite">${esc(autoFillNotice)}</p><div class="word-group-pane ${parentGroupTab===\'week\'?\'active\':\'\'}" data-group-pane="week"><div class="auto-fill-toolbar"><button type="button" class="auto-fill-btn" data-fill-group="week" ${autoFillBusy?\'disabled\':\'\'}>✨ Fill Missing Info · This Week</button><small>学校の英語の意味は変更しません。空欄と未登録音声だけ検索。</small></div><p',
        'This Week toolbar')
app=one(app,'<div class="word-group-pane ${parentGroupTab===\'my\'?\'active\':\'\'}" data-group-pane="my"><p',
        '<div class="word-group-pane ${parentGroupTab===\'my\'?\'active\':\'\'}" data-group-pane="my"><div class="auto-fill-toolbar"><button type="button" class="auto-fill-btn" data-fill-group="my" ${autoFillBusy?\'disabled\':\'\'}>✨ Fill Missing Info · My Words</button><small>既存のMy Wordsも一括補完。登録時は自動検索します。</small></div><p',
        'My Words toolbar')
app=one(app,'</small></div><button class="past-review-btn" data-past-review=',
        '</small></div><button type="button" class="auto-fill-btn" data-fill-past="${esc(week.id)}" ${autoFillBusy?\'disabled\':\'\'}>✨ Fill Missing Info</button><button class="past-review-btn" data-past-review=',
        'Past week toolbar')
app=one(app,"$$('[data-past-review]').forEach(btn=>btn.onclick=()=>startPastReview(btn.dataset.pastReview))",
        "$$('[data-past-review]').forEach(btn=>btn.onclick=()=>startPastReview(btn.dataset.pastReview));$$('[data-fill-group]').forEach(btn=>btn.onclick=()=>fillMissingInfo(btn.dataset.fillGroup));$$('[data-fill-past]').forEach(btn=>btn.onclick=()=>fillMissingInfo('past',btn.dataset.fillPast))",
        'bind toolbar handlers')

app=one(app,'required></label><label>English meaning',
        'required></label><p class="auto-fill-modal-note" id="autoFillModalStatus" role="status" aria-live="polite">${w?\'Tap Auto Fill to find missing details. Existing entries stay unchanged.\':\'Enter a word; missing details will be searched automatically. Suggestions can be edited.\'}</p><label>English meaning',
        'modal explanation')
app=one(app,'<button type="button" id="findAudioBtn" class="secondary-btn">Find Human Audio</button>',
        '<button type="button" id="autoFillModalBtn" class="secondary-btn">✨ Auto Fill</button><button type="button" id="findAudioBtn" class="secondary-btn">Find Human Audio</button>',
        'modal auto fill button')
app=one(app,'<button type="submit" class="primary-btn">Save</button>',
        '<button type="submit" id="saveWordBtn" class="primary-btn">Save</button>',
        'name modal save button')

modal=r'''let modalLookupTask=null,modalLookupWord='',modalAutoAudio='',modalSuggestedSources={};
  const fillModalBlanks=async()=>{
    const word=norm($('#wordInput')?.value);if(!word)return false;
    if(!window.WordGardenAutoFill){$('#autoFillModalStatus').textContent='Auto Fill is unavailable. You can still save the word.';return false}
    if(modalLookupTask&&modalLookupWord===word)return modalLookupTask;
    modalLookupWord=word;
    modalLookupTask=(async()=>{
      const note=$('#autoFillModalStatus'),button=$('#autoFillModalBtn');if(note)note.textContent=`Looking up “${word}”…`;
      if(button)button.disabled=true;
      try{
        const needAudio=!$('#pronunciationUrlInput')?.value.trim();
        const [suggestion,audio]=await Promise.all([
          window.WordGardenAutoFill.lookup(word),needAudio?findHumanAudio(word):Promise.resolve('')
        ]);
        if(norm($('#wordInput')?.value)!==word)return false;
        let filled=0;const school=!!w&&(inCurrentWeek(word)||wordWasInPast(word));
        const fieldInputs={meaningEn:'#meaningEnInput',meaningJa:'#meaningJaInput',example:'#exampleInput',phonicsFocus:'#phonicsInput',pictureCue:'#pictureCueInput',pictureEmoji:'#pictureEmojiInput'};
        for(const [key,selector] of Object.entries(fieldInputs)){
          if(key==='meaningEn'&&school)continue;
          const input=$(selector),candidate=String(suggestion?.fields?.[key]||'').trim();
          if(!input||!candidate||(!autoFieldMissing({[key]:input.value},key)))continue;
          input.value=candidate;modalSuggestedSources[key]=suggestion.sources?.[key]||'Suggestion';filled++;
        }
        if(needAudio&&audio&&isWordOnlyHumanAudio(word,'',audio)&&!$('#pronunciationUrlInput').value.trim()){
          $('#pronunciationUrlInput').value=audio;modalAutoAudio=audio;filled++;
        }
        if(note)note.textContent=`${filled} suggestions found. Please check meanings and image ideas before saving. Empty fields have no reliable result.`;
        return true;
      }catch(e){console.warn('Word Auto Fill unavailable',e);if(note)note.textContent='Lookup unavailable. Your word can still be saved.';return false}
      finally{if(button)button.disabled=false}
    })();
    try{return await modalLookupTask}finally{modalLookupTask=null}
  };
  $('#autoFillModalBtn').onclick=()=>fillModalBlanks();
  if(!w)$('#wordInput').addEventListener('change',()=>{if(norm($('#wordInput').value))fillModalBlanks()});
  '''
app=one(app,"$('#closeModal').onclick=$('#cancelModal').onclick=()=>$('#modalRoot').innerHTML='';$('#findAudioBtn').onclick=",
        "$('#closeModal').onclick=$('#cancelModal').onclick=()=>$('#modalRoot').innerHTML='';"+modal+"$('#findAudioBtn').onclick=",
        'bind modal autocomplete')
app=one(app,"$('#wordForm').onsubmit=e=>{e.preventDefault();const word=norm($('#wordInput').value);if(!word)return;const old=state.lib[word];",
        "$('#wordForm').onsubmit=async e=>{e.preventDefault();const word=norm($('#wordInput').value);if(!word)return;const btn=$('#saveWordBtn');if(btn)btn.disabled=true;await fillModalBlanks();if(!$('#wordForm')||norm($('#wordInput')?.value)!==word)return;const old=state.lib[word];",
        'auto fill before save')
app=one(app,"pronunciationSource:$('#pronunciationUrlInput').value.trim()?'manual':''};state.lib[word]=normalizeWord(raw,old);",
        "pronunciationSource:$('#pronunciationUrlInput').value.trim()?(modalAutoAudio&&$('#pronunciationUrlInput').value.trim()===modalAutoAudio?'Wikimedia Commons':(old?.pronunciationUrl===$('#pronunciationUrlInput').value.trim()?old?.pronunciationSource||'manual':'manual')):'',autoFillSources:{...(old?.autoFillSources||{}),...modalSuggestedSources}};state.lib[word]=normalizeWord(raw,old);",
        'keep audio attribution and sources')

html=one(html,'<link rel="stylesheet" href="backup-controls-v33.css?v=20260917-v33">',
         '<link rel="stylesheet" href="backup-controls-v33.css?v=20260917-v33">\n  <link rel="stylesheet" href="word-auto-fill-v34.css?v=20260917-v34">',
         'style include')
html=one(html,'<script src="app.js?v=20260917-backup-controls-v33"></script>',
         '<script src="word-auto-fill-v34.js?v=20260917-v34"></script>\n  <script src="app.js?v=20260917-auto-fill-v34"></script>',
         'load helper before app')
html=one(html,'App version 33, September 17','App version 34, September 17','version aria')
html=one(html,'v33 · Sep 17','v34 · Sep 17','version badge')
app_path.write_text(app,encoding='utf-8');html_path.write_text(html,encoding='utf-8')

for path in Path('tests').glob('*.test.cjs'):
    text=path.read_text(encoding='utf-8')
    text=text.replace('app.js?v=20260917-backup-controls-v33','app.js?v=20260917-auto-fill-v34').replace('v33 · Sep 17','v34 · Sep 17')
    path.write_text(text,encoding='utf-8')
print('v34 integration: conservative sources, three group fill actions, automatic My Words and full backup unchanged.')
