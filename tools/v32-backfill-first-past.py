"""One-time v32 follow-up: recover the seeded Unit 5A as Past Tests on devices already on a newer week."""
from pathlib import Path

app=Path('app.js').read_text(encoding='utf-8')
page=Path('index.html').read_text(encoding='utf-8')
old="""  if(!s.learningGroupsVersion){\n    s.week.id=weekIdentity(s.week.title||s.week.id);\n    for(const w of Object.values(s.lib||{}))if(w?.parentPriority){w.focusHistory=true;if(s.week.ids.includes(w.id)&&!s.week.focusIds.includes(w.id))s.week.focusIds.push(w.id)}\n    s.learningGroupsVersion=1;\n  }"""
new="""  if(!s.learningGroupsVersion){\n    s.week.id=weekIdentity(s.week.title||s.week.id);\n    const seedIds=SCHOOL_WORDS.map(x=>norm(x.word)).filter(id=>s.lib?.[id]);\n    const seedIsCurrent=seedIds.length===SCHOOL_WORDS.length&&seedIds.every(id=>s.week.ids.includes(id))&&s.week.ids.every(id=>seedIds.includes(id));\n    if(seedIds.length===SCHOOL_WORDS.length&&!seedIsCurrent&&!s.pastWeeks.some(x=>x.id==='2026-09-17-unit-5a'||x.title==='Sept 17 · Unit 5A')){\n      const oldFocus=seedIds.filter(id=>!!s.lib[id]?.parentPriority);\n      s.pastWeeks.push({id:'2026-09-17-unit-5a',title:'Sept 17 · Unit 5A',ids:seedIds,focusIds:oldFocus,archivedAt:''});\n    }\n    for(const w of Object.values(s.lib||{}))if(w?.parentPriority){w.focusHistory=true;if(s.week.ids.includes(w.id)&&!s.week.focusIds.includes(w.id))s.week.focusIds.push(w.id)}\n    s.learningGroupsVersion=1;\n  }"""
if app.count(old)!=1: raise RuntimeError(f'ensureLearningGroups anchor count={app.count(old)}')
app=app.replace(old,new,1)
old_script='<script src="app.js?v=20260917-learning-groups-v32"></script>'
new_script='<script src="app.js?v=20260917-learning-groups-v32a"></script>'
if page.count(old_script)!=1: raise RuntimeError('app cache anchor missing')
page=page.replace(old_script,new_script,1)
for test in Path('tests').glob('*.test.cjs'):
    text=test.read_text(encoding='utf-8').replace('app.js?v=20260917-learning-groups-v32','app.js?v=20260917-learning-groups-v32a')
    test.write_text(text,encoding='utf-8')
v32=Path('tests/learning-groups-v32.test.cjs')
t=v32.read_text(encoding='utf-8')
anchor="assert(src.includes('function ensureLearningGroups(s)'),'Old local state is migrated without resetting progress');"
extra=anchor+"\nassert(src.includes('seedIds.length===SCHOOL_WORDS.length&&!seedIsCurrent'),'A device already on Unit 5B can recover the pre-v32 Unit 5A list as Past Tests');"
if t.count(anchor)!=1: raise RuntimeError('v32 test anchor missing')
v32.write_text(t.replace(anchor,extra,1),encoding='utf-8')
Path('app.js').write_text(app,encoding='utf-8')
Path('index.html').write_text(page,encoding='utf-8')
print('Recovered pre-v32 Unit 5A history when appropriate; no current-week or learning data is replaced.')
