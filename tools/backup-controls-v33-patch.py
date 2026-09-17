"""One-time guarded v33 update: separate Word Pack import and full-backup restore."""
from pathlib import Path

app_path=Path('app.js')
page_path=Path('index.html')
app=app_path.read_text(encoding='utf-8')
page=page_path.read_text(encoding='utf-8')

def once(src, before, after, name):
    matches=src.count(before)
    if matches!=1:
        raise RuntimeError(f'{name}: expected exactly one anchor, found {matches}')
    return src.replace(before,after,1)

old_actions='<label class="secondary-btn file-btn">Import Word Pack<input id="parentImport" type="file" accept="application/json,.json"></label><button id="exportBtn" class="secondary-btn">Export Backup</button><button id="addWordBtn" class="primary-btn">+ Add My Word</button>'
new_actions='<label class="secondary-btn file-btn">Import Word Pack<input id="parentImport" type="file" accept="application/json,.json"></label><button id="exportBtn" class="secondary-btn">Export Backup</button><label class="secondary-btn file-btn backup-restore-btn" title="Restore all saved words, learning and Garden progress">Restore Backup<input id="parentRestore" type="file" accept="application/json,.json"></label><button id="addWordBtn" class="primary-btn">+ Add My Word</button>'
app=once(app,old_actions,new_actions,'Parent three backup controls')
app=once(app,'</div></div>${wordGroupsHtml()}<div class="parent-principle">','</div></div><p class="parent-backup-note">Word Pack = 今週の単語を追加 · Export Backup = 全データを保存 · Restore Backup = バックアップ時点のデータに置き換え（確認あり）</p>${wordGroupsHtml()}<div class="parent-principle">','Parent backup explanation')
old_bind="$('#parentImport').onchange=e=>importWordPack(e.target.files?.[0]);$('#exportBtn').onclick=exportBackup;"
new_bind="$('#parentImport').onchange=e=>{const file=e.target.files?.[0];e.target.value='';importWordPack(file)};$('#parentRestore').onchange=e=>{const file=e.target.files?.[0];e.target.value='';restoreBackup(file)};$('#exportBtn').onclick=exportBackup;"
app=once(app,old_bind,new_bind,'Separate file-input handlers')
old_branch="if(data.version&&data.lib){state=data;state.version=3;ensureLearningGroups(state);save();renderParent();toast('Backup restored.');return}"
new_branch="if(data.version&&data.lib){toast('This is a backup. Please use Restore Backup instead.');return}"
app=once(app,old_branch,new_branch,'Block full restore through weekly Word Pack')

restore=r'''async function restoreBackup(file){
  if(!file)return;
  let data;
  try{data=JSON.parse(await file.text())}catch(e){console.error(e);toast('Could not read the backup file.');return}
  const valid=data&&typeof data==='object'&&!Array.isArray(data)&&[2,3].includes(data.version)&&data.lib&&typeof data.lib==='object'&&!Array.isArray(data.lib)&&data.week&&Array.isArray(data.week.ids)&&data.garden&&typeof data.garden==='object'&&!Array.isArray(data.garden);
  if(!valid){toast('Not a complete backup. Please choose a file from Export Backup.');return}
  if(!confirm('Restore this backup?\n\nALL current words, learning history and Garden progress on THIS device will be REPLACED by the backup.\n\nChoose Cancel to export the current data first.'))return;
  const previous=localStorage.getItem(STORAGE_KEY);
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    state=loadState();
    renderParent();
    toast('Backup restored. Open Garden to see the saved progress.');
  }catch(e){
    console.error(e);
    try{if(previous===null)localStorage.removeItem(STORAGE_KEY);else localStorage.setItem(STORAGE_KEY,previous);state=loadState();renderParent()}catch(rollbackError){console.error(rollbackError)}
    toast('Restore failed. Previous data was kept where possible.');
  }
}
'''
app=once(app,'function exportBackup(){',restore+'function exportBackup(){','Add guarded Restore Backup')
app_path.write_text(app,encoding='utf-8')

page=once(page,'  <link rel="stylesheet" href="learning-groups-v32.css?v=20260917-v32">','  <link rel="stylesheet" href="learning-groups-v32.css?v=20260917-v32">\n  <link rel="stylesheet" href="backup-controls-v33.css?v=20260917-v33">','Load backup controls CSS')
page=once(page,'aria-label="App version 32, September 17">v32 · Sep 17','aria-label="App version 33, September 17">v33 · Sep 17','Visible version badge')
page=once(page,'app.js?v=20260917-learning-groups-v32a','app.js?v=20260917-backup-controls-v33','Bust application script cache')
page=once(page,'<!-- v32: This Week / My Words / Past Tests learning groups and 4+1 Today Play -->','<!-- v33: distinct weekly Word Pack import, full-state export, and confirmation-guarded restore -->','Release comment')
page_path.write_text(page,encoding='utf-8')

# Update only older assertions that require the exact current version, not behavior assertions.
for path in Path('tests').glob('*.test.cjs'):
    text=path.read_text(encoding='utf-8')
    revised=text.replace('v32 · Sep 17','v33 · Sep 17')
    if revised!=text:path.write_text(revised,encoding='utf-8')
print('v33: separate controls, confirm restore, prevent backup import through Word Pack; game logic unchanged.')
