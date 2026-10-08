'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

const source=fs.readFileSync('pencil-touch-guard.js','utf8');
const css=fs.readFileSync('pencil-touch-guard.css','utf8');
const html=fs.readFileSync('index.html','utf8');

function harness(){
  const listeners={};
  const selection={isCollapsed:false,removed:0,removeAllRanges(){this.removed++;this.isCollapsed=true}};
  const document={
    activeElement:null,
    querySelector(){return{}},
    addEventListener(type,fn){(listeners[type]??=[]).push(fn)}
  };
  const ctx={document,window:{getSelection:()=>selection}};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  const target=(zones=[],action=false,input=false)=>({
    closest(selector){
      if(action&&selector.includes('button'))return this;
      return zones.some(zone=>selector.includes(zone))?this:null;
    },
    matches(selector){return input&&selector.includes('.flow-word-input')}
  });
  const fire=(type,props={})=>{
    let prevented=0,stopped=0;
    const event={
      target:target(),pointerType:'touch',touches:[{}],changedTouches:[{}],
      preventDefault(){prevented++},stopPropagation(){stopped++},
      ...props
    };
    for(const fn of listeners[type]||[])fn(event);
    return{prevented,stopped,event};
  };
  return{target,fire,selection};
}

test('new 5 Words and Weekly Test areas suppress native selection without swallowing card scrolling',()=>{
  const x=harness();
  const fiveCard=x.target(['.five-card']);
  assert.equal(x.fire('selectstart',{target:fiveCard}).prevented,1,'5 Words card blocks text selection');
  assert.equal(x.fire('touchstart',{target:fiveCard,touches:[{}]}).prevented,0,'5 Words card itself still allows finger scroll');

  const weekly=x.target(['.weekly-sheet']);
  assert.equal(x.fire('selectstart',{target:weekly}).prevented,1,'Weekly Test sheet blocks text selection');
  assert.equal(x.fire('touchstart',{target:weekly,touches:[{}]}).prevented,0,'Weekly Test sheet itself still allows finger scroll');
});

test('actual Pencil surfaces reject finger/palm contact and buttons stay usable',()=>{
  const x=harness();
  const trace=x.target(['.five-trace-pad','.five-card']);
  assert.equal(x.fire('touchstart',{target:trace,touches:[{}]}).prevented,1,'Practice Pad trace surface rejects touch');

  const input=x.target(['.five-writing','.flow-word-input','.five-card']);
  assert.equal(x.fire('pointerdown',{target:input,pointerType:'touch'}).prevented,1,'5 Words Scribble input rejects touch');

  const paper=x.target(['.five-practice-line','.five-card']);
  assert.equal(x.fire('touchstart',{target:paper,touches:[{}]}).prevented,1,'paper Practice Pad rejects palm/finger contact');

  const action=x.target(['.five-card'],true);
  assert.equal(x.fire('selectstart',{target:action}).prevented,0,'buttons remain normal finger controls');
  assert.equal(x.fire('touchstart',{target:action,touches:[{}]}).prevented,0,'button touch is not swallowed');
});

test('guard covers every current Apple Pencil writing family',()=>{
  for(const token of ['.stage3-gap-flow','#stage4WordInput','.five-words-view .flow-word-input','.five-practice-line','.five-trace-pad','.weekly-test-view .weekly-answer']){
    assert(source.includes(token),token+' is registered in the delegated guard');
  }
  for(const token of ['#playView .spell-wrap','#playView .five-card','#playView .weekly-sheet']){
    assert(css.includes(token),token+' disables native text selection/callout');
  }
  assert(!/\.flow-word-input[^}]*touch-action\s*:\s*none/s.test(css),'native Scribble inputs do not disable touch-action');
  assert(!/\.weekly-answer[^}]*touch-action\s*:\s*none/s.test(css),'weekly Scribble inputs do not disable touch-action');
});

test('v62 palm guard JS is cache-busted while its CSS remains current',()=>{
  assert(html.includes('pencil-touch-guard.css?v=20261001-v57'));
  assert(html.includes('pencil-touch-guard.js?v=20261002-v62'));
  assert(html.includes('v65 · Oct 8'));
});
