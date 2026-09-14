from pathlib import Path

APP=Path('app.js')
CSS=Path('pencil-touch-guard.css')
INDEX=Path('index.html')

app=APP.read_text()
css=CSS.read_text()
index=INDEX.read_text()


def replace_once(text, old, new, label):
    if new in text:
        return text
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old,new,1)

# 1) Pedagogical chunks. Stage 2/3 gaps must never straddle a meaningful word-part boundary.
marker='];\nconst rewards=['
chunk_block="];\nconst WORD_CHUNKS={\n  beetle:['bee','tle'],\n  butterfly:['butter','fly'],\n  cricket:['crick','et'],\n  grasshopper:['grass','hopper'],\n  honeybee:['honey','bee'],\n  insect:['in','sect'],\n  ladybug:['lady','bug'],\n  raisin:['rai','sin'],\n  riding:['rid','ing'],\n  thicket:['thick','et']\n};\nconst rewards=["
app=replace_once(app,marker,chunk_block,'WORD_CHUNKS')

old_focus="""function focusRange(w){
  if(w.mioriSpelling&&w.mioriSpelling!==w.word){const a=alignChars(w.word,w.mioriSpelling);const i=a.slots.findIndex(s=>!s||s.state!=='ok');if(i>=0)return{start:i,end:Math.min(w.word.length,i+Math.min(3,w.word.length-i))}}
  const max=Math.max(0,...w.learn.weak);if(max){const i=w.learn.weak.indexOf(max);return{start:i,end:Math.min(w.word.length,i+2)}}
  const f=w.phonicsFocus,i=w.word.indexOf(f);if(f&&i>=0)return{start:i,end:i+f.length};
  const s=Math.floor(w.word.length/2);return{start:s,end:Math.min(w.word.length,s+1)};
}
"""
new_focus="""function chunkRanges(w){
  const parts=(WORD_CHUNKS[w.word]||[]).map(norm).filter(Boolean);
  if(!parts.length||parts.join('')!==w.word)return[{start:0,end:w.word.length}];
  let pos=0;return parts.map(text=>{const r={start:pos,end:pos+text.length};pos=r.end;return r});
}
function rangeInsideChunk(w,index,desired=2){
  const chunks=chunkRanges(w);const c=chunks.find(x=>index>=x.start&&index<x.end)||chunks[0]||{start:0,end:w.word.length};
  const len=Math.max(1,c.end-c.start);desired=Math.max(1,Math.min(desired,len));
  let start=Math.max(c.start,Math.min(index,c.end-desired));
  if(index>=start+desired)start=Math.max(c.start,index-desired+1);
  return{start,end:start+desired};
}
function focusRange(w){
  // First follow Miori's real misspelling, but keep the practice gap inside one meaningful chunk.
  if(w.mioriSpelling&&w.mioriSpelling!==w.word){
    const a=alignChars(w.word,w.mioriSpelling);const i=a.slots.findIndex(s=>!s||s.state!=='ok');
    if(i>=0)return rangeInsideChunk(w,i,Math.min(3,w.word.length));
  }
  // Then revisit weak letters without creating unnatural joins such as lady|bug -> "yb".
  const max=Math.max(0,...w.learn.weak);if(max){const i=w.learn.weak.indexOf(max);return rangeInsideChunk(w,i,2)}
  // Prefer the teacher/parent phonics focus when it stays inside the same learning chunk.
  const f=w.phonicsFocus,i=w.word.indexOf(f);if(f&&i>=0){
    const c=chunkRanges(w).find(x=>i>=x.start&&i<x.end);
    if(c&&i+f.length<=c.end)return{start:i,end:i+f.length};
    return rangeInsideChunk(w,i,Math.max(1,Math.min(f.length,3)));
  }
  // Fallback: choose a short piece from one chunk, never across a compound/syllable boundary.
  const chunks=chunkRanges(w);const c=chunks[Math.min(chunks.length-1,Math.floor(chunks.length/2))]||{start:0,end:w.word.length};
  const anchor=Math.floor((c.start+c.end-1)/2);return rangeInsideChunk(w,anchor,Math.min(2,c.end-c.start));
}
"""
app=replace_once(app,old_focus,new_focus,'focusRange')

# 2) Filled handwriting boxes become non-editable text surfaces. This removes the native caret/selection race.
app=replace_once(
    app,
    "const local=full-r.start;const value=q.letters[local]||'';let cls=value?'filled':'';",
    "const local=full-r.start;const value=q.letters[local]||'';const locked=value?' readonly':'';let cls=value?'filled':'';",
    'locked box state')
app=replace_once(
    app,
    'value="${esc(value)}" maxlength="1" inputmode="none"',
    'value="${esc(value)}"${locked} maxlength="1" inputmode="none"',
    'readonly attribute')
app=replace_once(
    app,
    'Each box is independent. Scratching one box cannot delete another box. If Scribble misses, tap Eraser and touch that one box with Pencil.',
    'Write in an empty box. To fix a letter, scratch that box — the other boxes stay safe. Eraser is the backup.',
    'box note')

old_bind_tail="""  const inputs=$$('.letter-box');inputs.forEach((input,index)=>bindLetterBox(input,index,inputs,w,q));
  const targetIndex=q.feedback?.bad?firstWrongIndex(w,q):firstEmptyIndex(q);
  setTimeout(()=>focusLetter(inputs[Math.max(0,targetIndex)]||inputs[0]),80);
}
function bindLetterBox(input,index,inputs,w,q){
  let advanceTimer=null;let lastPointer='';
  input.addEventListener('pointerdown',e=>{lastPointer=e.pointerType||'';if(lastPointer==='touch'){e.preventDefault();input.blur();return}if(q.mode==='erase'&&(lastPointer==='pen'||lastPointer==='mouse')){e.preventDefault();clearOneBox(index,w,q,true)}} ,true);
  input.addEventListener('contextmenu',e=>e.preventDefault());input.addEventListener('dragstart',e=>e.preventDefault());
  input.addEventListener('beforeinput',e=>{
    const t=String(e.inputType||'');
    if(t.startsWith('delete')){e.preventDefault();clearOneBox(index,w,q,false);return}
  });
  input.addEventListener('input',e=>{
    if(q.mode==='erase'){e.target.value=q.letters[index]||'';return}
    const cleaned=norm(e.target.value).slice(-1);
    q.letters[index]=cleaned;e.target.value=cleaned;q.feedback=null;q.hint=null;e.target.classList.toggle('filled',!!cleaned);e.target.classList.remove('ok','bad','missing','hint-target');
    clearTimeout(advanceTimer);
    if(cleaned){advanceTimer=setTimeout(()=>{if(q.letters[index]!==cleaned)return;const next=inputs.slice(index+1).find((x,j)=>!q.letters[index+1+j]);focusLetter(next)},140)}
    else focusLetter(input);
  });
  input.addEventListener('focus',()=>{try{input.setSelectionRange(input.value.length,input.value.length)}catch{}});
}
function focusLetter(input){if(!input)return;clearTimeout(focusTimer);focusTimer=setTimeout(()=>{try{input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)}catch{try{input.focus()}catch{}}},20)}
"""
new_bind_tail="""  const inputs=$$('.letter-box');inputs.forEach((input,index)=>bindLetterBox(input,index,inputs,w,q));
  // Only an empty box may own the native text caret. Filled boxes are Pencil scratch targets, not editable text.
  const empty=inputs.find(input=>!q.letters[Number(input.dataset.local)]);
  if(empty)setTimeout(()=>focusLetter(empty),80);else document.activeElement?.blur?.();
}
function startFilledBoxScratch(e,index,w,q,input){
  const pointerId=e.pointerId,rect=input.getBoundingClientRect(),points=[];let finished=false;
  const add=ev=>{const list=ev.getCoalescedEvents?.()||[ev];for(const p of list)points.push({x:p.clientX,y:p.clientY,t:performance.now()})};
  const cleanup=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',finish,true);window.removeEventListener('pointercancel',finish,true)};
  const move=ev=>{if(ev.pointerId!==pointerId)return;add(ev);ev.preventDefault()};
  const finish=ev=>{if(finished||ev.pointerId!==pointerId)return;finished=true;add(ev);cleanup();
    if(points.length<3)return;
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,path=0,reversals=0,lastSign=0;
    for(let i=0;i<points.length;i++){const p=points[i];minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);if(i){const dx=p.x-points[i-1].x,dy=p.y-points[i-1].y;path+=Math.hypot(dx,dy);if(Math.abs(dx)>2){const sign=Math.sign(dx);if(lastSign&&sign!==lastSign)reversals++;lastSign=sign}}}
    const width=maxX-minX,height=maxY-minY,duration=points.at(-1).t-points[0].t;
    const looksScratch=duration<2200&&height<=rect.height*1.65&&width>=Math.max(10,rect.width*.12)&&(reversals>=1||path>=Math.max(28,width*1.65));
    if(looksScratch)clearOneBox(index,w,q,false);
  };
  input.blur();e.preventDefault();e.stopPropagation();add(e);
  window.addEventListener('pointermove',move,{capture:true,passive:false});window.addEventListener('pointerup',finish,true);window.addEventListener('pointercancel',finish,true);
}
function bindLetterBox(input,index,inputs,w,q){
  let advanceTimer=null;let lastPointer='';
  input.addEventListener('pointerdown',e=>{
    lastPointer=e.pointerType||'';
    if(lastPointer==='touch'){e.preventDefault();input.blur();return}
    if(q.mode==='erase'&&(lastPointer==='pen'||lastPointer==='mouse')){e.preventDefault();clearOneBox(index,w,q,true);return}
    // A filled box never enters native text editing. Pencil movement here is interpreted only as scratch-to-erase.
    if(q.mode==='write'&&lastPointer==='pen'&&q.letters[index]){startFilledBoxScratch(e,index,w,q,input);return}
  },true);
  input.addEventListener('contextmenu',e=>e.preventDefault());input.addEventListener('dragstart',e=>e.preventDefault());
  input.addEventListener('beforeinput',e=>{
    const t=String(e.inputType||'');
    if(t.startsWith('delete')){e.preventDefault();clearOneBox(index,w,q,false);return}
  });
  input.addEventListener('input',e=>{
    if(q.mode==='erase'){e.target.value=q.letters[index]||'';return}
    const cleaned=norm(e.target.value).slice(-1);
    q.letters[index]=cleaned;e.target.value=cleaned;q.feedback=null;q.hint=null;e.target.classList.toggle('filled',!!cleaned);e.target.classList.remove('ok','bad','missing','hint-target');
    clearTimeout(advanceTimer);
    if(cleaned){
      // Lock immediately after Scribble commits the letter, then move to the next empty box. No visible text caret remains on a written letter.
      input.readOnly=true;input.blur();
      advanceTimer=setTimeout(()=>{if(q.letters[index]!==cleaned)return;const next=inputs.slice(index+1).find((x,j)=>!q.letters[index+1+j]);focusLetter(next)},110)
    }else{input.readOnly=false;focusLetter(input)}
  });
  input.addEventListener('focus',()=>{if(input.readOnly){input.blur();return}try{input.setSelectionRange(0,0)}catch{}});
}
function focusLetter(input){if(!input||input.readOnly)return;clearTimeout(focusTimer);focusTimer=setTimeout(()=>{if(input.readOnly)return;try{input.focus({preventScroll:true});input.setSelectionRange(0,0)}catch{try{input.focus()}catch{}}},20)}
"""
app=replace_once(app,old_bind_tail,new_bind_tail,'handwriting binding')

# 3) Extra CSS: a filled box must not expose native caret/selection chrome on iPadOS.
css_add="""

/* Pencil scratch v3: written letters are display-like scratch targets, not editable text. */
.letter-box[readonly]{
  caret-color:transparent!important;
  -webkit-user-select:none!important;
  user-select:none!important;
  -webkit-touch-callout:none!important;
  cursor:default;
}
.letter-box[readonly]:focus{
  caret-color:transparent!important;
}
"""
if 'Pencil scratch v3' not in css:
    css += css_add

# Cache-bust all three handwriting files.
index=index.replace('app.js?v=20260914-pencil-box-v2','app.js?v=20260914-pencil-box-v3')
index=index.replace('pencil-touch-guard.css?v=20260914-palm-v2','pencil-touch-guard.css?v=20260914-palm-v3')
index=index.replace('pencil-touch-guard.js?v=20260914-palm-v2','pencil-touch-guard.js?v=20260914-palm-v3')

APP.write_text(app)
CSS.write_text(css)
INDEX.write_text(index)
print('patched app.js, pencil-touch-guard.css, index.html')
