from pathlib import Path

APP=Path('app.js')
INDEX=Path('index.html')
CSS=Path('pencil-touch-guard.css')

app=APP.read_text()
index=INDEX.read_text()
css=CSS.read_text()


def replace_once(text, old, new, label):
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old,new,1)

# 1) Keep every Stage 3/4 character visibly boxed, but make written letters display surfaces.
old="""    const local=full-r.start;const value=q.letters[local]||'';const locked=value?' readonly':'';let cls=value?'filled':'';
    if(q.feedback?.bad){if(!value)cls='missing';else cls=value===expected[local]?'ok':'bad'}
    if(q.hint?.local===local)cls+=' hint-target';
    boxes.push(`<input class=\"letter-box ${cls.trim()}\" data-local=\"${local}\" data-full=\"${full}\" value=\"${esc(value)}\"${locked} maxlength=\"1\" inputmode=\"none\" virtualkeyboardpolicy=\"manual\" autocomplete=\"off\" autocapitalize=\"none\" autocorrect=\"off\" spellcheck=\"false\" placeholder=\" \" aria-label=\"Letter ${full+1}\">`);
"""
new="""    const local=full-r.start;const value=q.letters[local]||'';let cls=value?'filled':'';
    if(q.feedback?.bad){if(!value)cls='missing';else cls=value===expected[local]?'ok':'bad'}
    if(q.hint?.local===local)cls+=' hint-target';
    if(value){
      // Written letters are plain display boxes, not text inputs. That removes native caret/selection behavior completely.
      boxes.push(`<div class=\"letter-box written-box ${cls.trim()}\" data-local=\"${local}\" data-full=\"${full}\" role=\"button\" aria-label=\"Letter ${full+1}: ${esc(value)}. Scratch to erase.\">${esc(value)}</div>`);
    }else{
      // Empty boxes start read-only. A Pencil-down event arms only the box being written, so taps/focus cannot summon the keyboard.
      boxes.push(`<input class=\"letter-box empty-box ${cls.trim()}\" data-local=\"${local}\" data-full=\"${full}\" value=\"\" readonly maxlength=\"1\" inputmode=\"none\" virtualkeyboardpolicy=\"manual\" autocomplete=\"off\" autocapitalize=\"none\" autocorrect=\"off\" spellcheck=\"false\" placeholder=\" \" aria-label=\"Letter ${full+1}\">`);
    }
"""
app=replace_once(app,old,new,'handwriting box render')

# 2) Remove programmatic auto-focus. Pencil location itself chooses the next box.
old="""  const inputs=$$('.letter-box');inputs.forEach((input,index)=>bindLetterBox(input,index,inputs,w,q));
  // Only an empty box may own the native text caret. Filled boxes are Pencil scratch targets, not editable text.
  const empty=inputs.find(input=>!q.letters[Number(input.dataset.local)]);
  if(empty)setTimeout(()=>focusLetter(empty),80);else document.activeElement?.blur?.();
}
"""
new="""  const boxes=$$('.letter-box[data-local]');boxes.forEach((box,index)=>bindLetterBox(box,index,w,q));
  // Never pre-focus a writing field. On iPad that can open the software keyboard and it also races with fast Pencil movement.
  document.activeElement?.blur?.();
}
"""
app=replace_once(app,old,new,'bindQuestion focus removal')

# 3) Pencil-down synchronously arms the exact empty box. No delayed jump to the next box.
start=app.index('function bindLetterBox(')
end=app.index('function firstEmptyIndex',start)
if start<0 or end<0:
    raise SystemExit('bindLetterBox block not found')
old_block=app[start:end]
new_block="""function bindLetterBox(box,index,w,q){
  const isInput=box.tagName==='INPUT';
  let penArmedUntil=0;

  box.addEventListener('pointerdown',e=>{
    const pointer=e.pointerType||'';
    if(pointer==='touch'){
      e.preventDefault();
      if(isInput){box.readOnly=true;box.blur()}
      return;
    }
    if(q.mode==='erase'&&(pointer==='pen'||pointer==='mouse')){
      e.preventDefault();e.stopPropagation();clearOneBox(index,w,q,true);return;
    }
    if(q.mode==='write'&&pointer==='pen'&&q.letters[index]){
      // Filled boxes are not text fields. Scratch only this visual box to erase just this letter.
      startFilledBoxScratch(e,index,w,q,box);return;
    }
    if(q.mode==='write'&&pointer==='pen'&&isInput&&!q.letters[index]){
      // Arm and focus exactly where the Pencil landed. No automatic focus hopping.
      penArmedUntil=performance.now()+1800;
      box.readOnly=false;
      box.setAttribute('inputmode','none');
      try{box.focus({preventScroll:true});box.setSelectionRange(0,0)}catch{}
      try{navigator.virtualKeyboard?.hide?.()}catch{}
    }
  },true);

  box.addEventListener('contextmenu',e=>e.preventDefault());
  box.addEventListener('dragstart',e=>e.preventDefault());
  if(!isInput)return;

  box.addEventListener('beforeinput',e=>{
    const t=String(e.inputType||'');
    // Keyboard-style deletion is not part of the Pencil flow; explicit scratch/Eraser owns deletion.
    if(t.startsWith('delete')){e.preventDefault();return}
  });
  box.addEventListener('input',e=>{
    if(q.mode==='erase'){e.target.value='';return}
    const cleaned=norm(e.target.value).slice(-1);
    if(!cleaned){e.target.value='';return}
    q.letters[index]=cleaned;
    q.feedback=null;q.hint=null;
    e.target.value=cleaned;
    e.target.readOnly=true;
    e.target.blur();
    // Do not focus the next box. If Miori writes quickly, the next Pencil-down activates that exact box immediately.
  });
  box.addEventListener('focus',()=>{
    // Only a very recent Pencil-down is allowed to keep an empty input focused. This blocks stray keyboard focus.
    if(performance.now()>penArmedUntil){box.readOnly=true;box.blur();return}
    try{box.setSelectionRange(0,0)}catch{}
    try{navigator.virtualKeyboard?.hide?.()}catch{}
  });
  box.addEventListener('blur',()=>{if(!q.letters[index])box.readOnly=true});
}
function focusLetter(input){
  // Kept only for backwards compatibility with older code paths; no automatic focus is used in Pencil mode.
  if(!input)return;
  input.blur?.();
}
function clearOneBox(index,w,q,fromEraser){
  q.letters[index]='';q.feedback=null;q.hint=null;q.mode='write';renderTask();
  setTimeout(()=>{$(`.letter-box[data-local=\"${index}\"]`)?.classList.add('erase-flash')},35);
  if(fromEraser)navigator.vibrate?.(7)
}
"""
app=app[:start]+new_block+app[end:]

# 4) Make Stage 4's one-letter correction affordance explicit in the instruction copy.
app=app.replace(
    "Write in an empty box. To fix a letter, scratch that box — the other boxes stay safe. Eraser is the backup.",
    "Each letter has its own box. Write directly in an empty box. Scratch one written box to erase only that letter; Eraser is the backup."
)

# 5) Add visual distinction so Stage 4 clearly keeps one box per letter.
css_add="""

/* Pencil flow v4: every Stage 3/4 position stays visibly boxed. */
.written-box{
  display:grid!important;
  place-items:center!important;
  -webkit-user-select:none!important;
  user-select:none!important;
  -webkit-touch-callout:none!important;
  caret-color:transparent!important;
  cursor:default;
}
.empty-box[readonly]{
  caret-color:transparent!important;
}
.empty-box:not([readonly]){
  caret-color:transparent!important;
}
"""
if 'Pencil flow v4' not in css:
    css += css_add

# Cache bust.
index=index.replace('app.js?v=20260914-pencil-box-v3','app.js?v=20260914-pencil-box-v4')
index=index.replace('pencil-touch-guard.css?v=20260914-palm-v3','pencil-touch-guard.css?v=20260914-palm-v4')
index=index.replace('pencil-touch-guard.js?v=20260914-palm-v3','pencil-touch-guard.js?v=20260914-palm-v4')

APP.write_text(app)
INDEX.write_text(index)
CSS.write_text(css)
print('patched Pencil flow v4')
