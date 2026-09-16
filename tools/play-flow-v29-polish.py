"""Final v29 polish: replay each stage only once and let Stage 3 erase the entire gap."""
from pathlib import Path
p=Path('app.js')
s=p.read_text(encoding='utf-8')
def swap(old,new,tag):
    global s
    n=s.count(old)
    if n!=1:raise RuntimeError(f'{tag}: expected one occurrence, got {n}')
    s=s.replace(old,new,1)
swap("bindQuestion(w,q);setTimeout(()=>playWordAudio(w,false,{auto:true}),120);if(!w.pronunciationUrl",
     "bindQuestion(w,q);if(!q.audioStarted){q.audioStarted=true;setTimeout(()=>{if(session?.q===q)playWordAudio(w,false,{auto:true})},120)}if(!w.pronunciationUrl",
     'One automatic pronunciation per stage, never a rerender replay')
swap("input.addEventListener('pointerdown',e=>{\n    if(e.pointerType==='touch'){e.preventDefault();input.blur();return}\n    if(e.pointerType==='pen'){",
     "input.addEventListener('pointerdown',e=>{\n    if(e.pointerType==='touch'){e.preventDefault();input.blur();return}\n    if(e.pointerType==='pen'&&q.stage===3&&q.mode==='erase'){e.preventDefault();q.letters=[];q.feedback=null;q.hint=null;q.mode='write';renderTask();return}\n    if(e.pointerType==='pen'){",
     'Eraser clears shared Stage 3 gap rather than accidentally entering text')
p.write_text(s,encoding='utf-8')
p=Path('tests/play-flow-v29.test.cjs');s=p.read_text(encoding='utf-8')
old="assert(writing.includes('if(!finishComposition)return'),'Text is cleaned after composition, not per incomplete stroke');"
new=old+"\nassert(writing.includes(\"q.stage===3&&q.mode==='erase'\"),'Stage 3 erase button clears the new shared gap');\nassert(src.includes('if(!q.audioStarted){q.audioStarted=true;'),'A stage speaks automatically once, never on a correction rerender');"
assert s.count(old)==1
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('v29 final polish: one stage-start announcement and working Stage 3 shared-gap eraser.')
