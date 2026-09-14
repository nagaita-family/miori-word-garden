from pathlib import Path

p=Path('app.js')
s=p.read_text()

s=s.replace("const STAGE_PROMPTS=['','Listen. Which spelling is right?','Which letters fit here?','Write the missing part.','Write the whole word.'];",
            "const STAGE_PROMPTS=['','Listen. Which spelling is right?','Which letters fit here?','Trace the word. Fill the blank.','Write the whole word.'];")

old_q="const q={id:w.id,stage,range,first:true,wrong:[],letters:stage>=3?Array(n).fill(''):[],feedback:null,hint:null,mode:'write'}"
new_q="const q={id:w.id,stage,range,first:true,wrong:[],letters:stage>=3?Array(n).fill(''):[],traceLetters:stage===3?Array(w.word.length).fill(''):[],feedback:null,hint:null,mode:'write'}"
if old_q not in s:
    raise SystemExit('newQuestion target missing')
s=s.replace(old_q,new_q,1)

old_sub="${q.stage>=3?'One box = one real writing field. Scratch only inside the letter you want to erase.':'You can play the sound again.'}"
new_sub="${q.stage===3?'Trace the dotted letters, then write the empty boxes.':q.stage===4?'Write one letter in each box. Scratch a written box to erase.':'You can play the sound again.'}"
if old_sub not in s:
    raise SystemExit('task subprompt target missing')
s=s.replace(old_sub,new_sub,1)

start=s.find('function handwritingHtml(w,q){')
end=s.find('function hintHtml(q){',start)
if start<0 or end<0:
    raise SystemExit('handwritingHtml block missing')
new_hand=r'''function handwritingHtml(w,q){
  const expected=expectedText(w,q);const r=q.stage===3?q.range:{start:0,end:w.word.length};let boxes=[];
  if(q.stage===3&&!Array.isArray(q.traceLetters))q.traceLetters=Array(w.word.length).fill('');
  for(let full=0;full<w.word.length;full++){
    if(q.stage===3&&(full<r.start||full>=r.end)){
      const guide=esc(w.word[full]),traced=q.traceLetters[full]||'';
      boxes.push(`<div class="trace-cell ${traced?'traced':''}" data-guide-full="${full}"><svg class="trace-guide" viewBox="0 0 72 72" aria-hidden="true"><text x="36" y="53" text-anchor="middle">${guide}</text></svg>${traced?`<div class="trace-written" data-trace-full="${full}" aria-label="Traced letter ${guide}">${esc(traced)}</div>`:`<input class="trace-input" data-trace-full="${full}" value="" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Trace letter ${guide}">`}</div>`);continue
    }
    const local=full-r.start;const value=q.letters[local]||'';let cls=value?'filled':'';
    if(q.feedback?.bad){if(!value)cls='missing';else cls=value===expected[local]?'ok':'bad'}
    if(q.hint?.local===local)cls+=' hint-target';
    if(value){
      boxes.push(`<div class="letter-box written-box ${cls.trim()}" data-local="${local}" data-full="${full}" role="button" aria-label="Letter ${full+1}: ${esc(value)}. Scratch to erase.">${esc(value)}</div>`);
    }else{
      boxes.push(`<input class="letter-box empty-box ${cls.trim()}" data-local="${local}" data-full="${full}" value="" inputmode="none" virtualkeyboardpolicy="manual" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder=" " aria-label="Letter ${full+1}">`);
    }
  }
  const stage3=q.stage===3;
  const note=stage3?`<div class="stage3-bridge-note"><b>Trace → remember.</b> Follow the dotted letters from left to right, and write the empty purple boxes yourself.</div>`:`<div class="box-note">Write the whole word from memory. Scratch one written box to erase only that letter.</div>`;
  return`<div class="spell-wrap"><div class="pencil-modebar"><button id="writeModeBtn" class="mode-btn write ${q.mode==='write'?'on':''}">✎ Write</button><button id="eraseModeBtn" class="mode-btn erase ${q.mode==='erase'?'on':''}">⌫ Eraser</button></div>${note}<div id="letterRow" class="letter-row ${stage3?'stage3-trace-row':''} ${q.mode==='erase'?'erase-mode':''}" style="--letters:${w.word.length}">${boxes.join('')}</div>${hintHtml(q)}<button id="checkAnswerBtn" class="check-answer">Check</button></div>`;
}
'''
s=s[:start]+new_hand+s[end:]

old_bind="const boxes=$$('.letter-box[data-local]');boxes.forEach((box,index)=>bindLetterBox(box,index,w,q));"
new_bind="const boxes=$$('.letter-box[data-local]');boxes.forEach((box,index)=>bindLetterBox(box,index,w,q));$$('.trace-input[data-trace-full]').forEach(input=>bindTraceBox(input,Number(input.dataset.traceFull),w,q));"
if old_bind not in s:
    raise SystemExit('bindQuestion target missing')
s=s.replace(old_bind,new_bind,1)

marker='function startFilledBoxScratch(e,index,w,q,input){'
if marker not in s:
    raise SystemExit('scratch marker missing')
trace_fn=r'''function bindTraceBox(input,full,w,q){
  const expected=w.word[full]||'';
  input.addEventListener('pointerdown',e=>{
    const pointer=e.pointerType||'';
    if(pointer==='touch'){e.preventDefault();input.blur();return}
    if(q.mode==='erase'){e.preventDefault();e.stopPropagation();input.value='';return}
    if(q.mode==='write'&&pointer==='pen'){
      input.setAttribute('inputmode','none');
      try{if(document.activeElement!==input)input.focus({preventScroll:true})}catch{}
      setTimeout(()=>{try{navigator.virtualKeyboard?.hide?.()}catch{}},0)
    }
  },true);
  input.addEventListener('touchstart',e=>{e.preventDefault();input.blur()},{passive:false});
  input.addEventListener('contextmenu',e=>e.preventDefault());input.addEventListener('dragstart',e=>e.preventDefault());
  input.addEventListener('keydown',e=>e.preventDefault());
  input.addEventListener('beforeinput',e=>{const t=String(e.inputType||'');if(t.startsWith('delete'))e.preventDefault()});
  input.addEventListener('input',e=>{
    if(q.mode==='erase'){e.target.value='';return}
    const cleaned=normalizeScribbleLetter(e.target.value,expected);if(!cleaned){e.target.value='';return}
    const cell=e.target.closest('.trace-cell');
    if(cleaned!==expected){e.target.value='';cell?.classList.add('trace-retry');setTimeout(()=>cell?.classList.remove('trace-retry'),320);return}
    if(!Array.isArray(q.traceLetters))q.traceLetters=Array(w.word.length).fill('');q.traceLetters[full]=cleaned;
    if(cell){cell.classList.add('traced');const done=document.createElement('div');done.className='trace-written';done.dataset.traceFull=String(full);done.setAttribute('aria-label',`Traced letter ${expected}`);done.textContent=cleaned;e.target.replaceWith(done)}
    try{navigator.virtualKeyboard?.hide?.()}catch{}
  });
  input.addEventListener('focus',()=>{try{input.setSelectionRange(0,0)}catch{};try{navigator.virtualKeyboard?.hide?.()}catch{}})
}
'''
s=s.replace(marker,trace_fn+marker,1)

p.write_text(s)
