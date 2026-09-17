/* v30: Small, focus-only eraser for whole-word Scribble inputs. No new screen layout. */
(()=>{
'use strict';
let activeInput=null;
let activeTools=null;
const isWritingInput=target=>target?.matches?.('#stage4WordInput,.weekly-answer');
function closeTools(){
  activeTools?.remove();
  activeTools=null;
  activeInput=null;
}
function editAnswer(input,operation){
  if(!input?.isConnected)return;
  // Finish the iPad's current Scribble commit before taking one letter off its end.
  input.blur();
  const original=input.value||'';
  const next=operation==='back'?original.slice(0,-1):'';
  if(next===original)return;
  input.value=next;
  // Reuse the original app's input listener: it owns lowercase cleaning, drafts,
  // answer counts, Stage 4 state and removal of obsolete error hints.
  input.dispatchEvent(new Event('input',{bubbles:true}));
}
function showTools(input){
  if(!input?.isConnected||activeInput===input&&activeTools?.isConnected)return;
  closeTools();
  const tools=document.createElement('div');
  tools.className='writing-erase-tools';
  tools.setAttribute('role','group');
  tools.setAttribute('aria-label','Correct this spelling answer');
  for(const [operation,label] of [['back','⌫ One letter'],['clear','✕ Clear all']]){
    const button=document.createElement('button');
    button.type='button';
    button.className=`writing-erase-action ${operation==='clear'?'writing-erase-clear':''}`;
    button.textContent=label;
    button.setAttribute('aria-label',operation==='back'?'Erase the last letter':'Erase this entire answer');
    button.addEventListener('click',()=>editAnswer(input,operation));
    tools.appendChild(button);
  }
  input.insertAdjacentElement('afterend',tools);
  activeInput=input;
  activeTools=tools;
}
document.addEventListener('focusin',event=>{
  if(isWritingInput(event.target)){showTools(event.target);return}
  if(!event.target?.closest?.('.writing-erase-tools'))closeTools();
});
document.addEventListener('pointerdown',event=>{
  if(!activeTools)return;
  if(event.target===activeInput||event.target?.closest?.('.writing-erase-tools'))return;
  closeTools();
},true);
// Avoid native edit menus without disabling text input or the Pencil Scribble engine.
for(const type of ['contextmenu','copy','cut','paste','dragstart']){
  document.addEventListener(type,event=>{
    if(isWritingInput(event.target))event.preventDefault();
  },true);
}
})();
