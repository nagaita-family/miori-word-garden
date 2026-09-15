from pathlib import Path

p=Path('app.js')
s=p.read_text()

old="""const seatText=state.xp<70?'Keep growing — Bunny’s cozy bench is coming!':state.garden.bunnySeated?'🐰 Bunny is cozy on the bench ♡':'Drag Bunny around the backyard — every special spot has its own little reaction.';"""
new="""const seatText=state.xp<90?'Keep growing — Bunny’s cozy bench is coming!':state.garden.bunnySeated?'🐰 Bunny is cozy on the bench ♡':'Drag Bunny around the backyard — every special spot has its own little reaction.';"""
if old not in s: raise SystemExit('seatText block not found')
s=s.replace(old,new,1)

old="""  const stageNames=['Seed','Tiny sprout','Growing stem','Leafy plant','Flower bud','Bloom!'];const growthCopy=celebration?`${stageNames[beforeStage]} → ${stageNames[afterStage]}`:'';
  const rewardCard=celebration?`<div class=\"reward-garden-card\"><div class=\"reward-emoji\">${esc(celebration.emoji||'🌱')}</div><div class=\"copy\"><b>${esc(celebration.word)} made THIS plant grow! ✦</b><span>+${celebration.gain} XP · ${growthCopy}</span></div><button id=\"gardenNextWordBtn\">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const burst=celebration?`<div class=\"growth-burst ${target}\"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';"""
new="""  const stageNames=['Seed','Tiny sprout','Growing stem','Leafy plant','Flower bud','Bloom!'];const growthCopy=celebration?`${stageNames[beforeStage]} → ${stageNames[afterStage]}`:'';
  const unlockReward=celebration?.unlock?rewards.find(r=>r.id===celebration.unlock.id):null;
  const rewardCard=celebration?`<div class=\"reward-garden-card\"><div class=\"reward-emoji\">${esc(celebration.emoji||'🌱')}</div><div class=\"copy\"><b>${esc(celebration.word)} made THIS plant grow! ✦</b><span>+${celebration.gain} XP · ${growthCopy}</span></div><button id=\"gardenNextWordBtn\">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const unlockReveal=unlockReward?`<div class=\"treasure-unlock-reveal\" id=\"treasureUnlockReveal\"><div class=\"treasure-unlock-rays\"></div><div class=\"treasure-unlock-copy\"><small>NEW TREASURE! ✦</small><h2>${esc(unlockReward.label)}</h2><p>You got it! It’s going into your Treasure Box.</p></div><div class=\"treasure-unlock-fly ${unlockReward.id}\" id=\"treasureUnlockFly\">${gardenObjectArt(unlockReward)}</div><div class=\"treasure-unlock-stars\">✦　✧　✦</div></div>`:'';
  const burst=celebration?`<div class=\"growth-burst ${target}\"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';"""
if old not in s: raise SystemExit('reward card block not found')
s=s.replace(old,new,1)

old="""  $('#gardenView').innerHTML=`<div class=\"garden-view\"><div class=\"garden-head\"><div><p class=\"eyebrow\">YOUR GARDEN</p><h1>Miori’s little spell world ✦</h1><p class=\"sub\">${esc(state.week.title)} · ${state.garden.growth} growth moments</p></div><div class=\"garden-head-actions\"><button class=\"secondary-btn treasure-open\" id=\"treasureChestBtn\">🧺 Treasure Box <span>${storedCount}/${unlockedTreasureCount}</span></button><button class=\"primary-btn garden-play\" id=\"gardenPlayBtn\">${celebration?'Keep going ✦':'Play! ✦'}</button></div></div><div class=\"garden-scene ${celebration?'reward-moment':''}\" id=\"gardenScene\">${rewardCard}<div class=\"garden-update\"><b>NEW ✦</b><span>Sunny backyard edition · collect, decorate, and grow</span></div>"""
new="""  $('#gardenView').innerHTML=`<div class=\"garden-view\">${unlockReveal}<div class=\"garden-head\"><div><p class=\"eyebrow\">YOUR GARDEN</p><h1>Miori’s little spell world ✦</h1><p class=\"sub\">${esc(state.week.title)} · ${state.garden.growth} growth moments</p></div><div class=\"garden-head-actions\"><button class=\"secondary-btn treasure-open\" id=\"treasureChestBtn\">🧺 Treasure Box <span>${storedCount}/${unlockedTreasureCount}</span></button><button class=\"primary-btn garden-play\" id=\"gardenPlayBtn\">${celebration?'Keep going ✦':'Play! ✦'}</button></div></div><div class=\"garden-scene ${celebration?'reward-moment':''}\" id=\"gardenScene\">${rewardCard}<div class=\"garden-update\"><b>NEW ✦</b><span>Sunny backyard edition · collect, decorate, and grow</span></div>"""
if old not in s: raise SystemExit('garden html prefix not found')
s=s.replace(old,new,1)

old="""  if(celebration){
    const targetPlot=$(`.plot[data-growth-plot=\"${target}\"]`),bunny=root.querySelector('[data-id=\"bunny\"]'),scene=$('#gardenScene');
    if(bunny)bunny.classList.add('garden-cheer');
    const bp=bunnyDisplayPos();scene?.insertAdjacentHTML('beforeend',`<div class=\"bunny-cheer-bubble\" style=\"left:${bp.x}%;top:${Math.max(12,bp.y-16)}%\">Yay! <span>♡</span></div>`);
    setTimeout(()=>{if(!gardenCelebration||!targetPlot)return;targetPlot.innerHTML=plant(afterStage);targetPlot.classList.add('growth-change');playSfx('sparkle')},720)
  }
}"""
new="""  if(celebration){
    const targetPlot=$(`.plot[data-growth-plot=\"${target}\"]`),bunny=root.querySelector('[data-id=\"bunny\"]'),scene=$('#gardenScene');
    if(bunny)bunny.classList.add('garden-cheer');
    const bp=bunnyDisplayPos();scene?.insertAdjacentHTML('beforeend',`<div class=\"bunny-cheer-bubble\" style=\"left:${bp.x}%;top:${Math.max(12,bp.y-16)}%\">Yay! <span>♡</span></div>`);
    setTimeout(()=>{if(!gardenCelebration||!targetPlot)return;targetPlot.innerHTML=plant(afterStage);targetPlot.classList.add('growth-change');playSfx('sparkle')},720);
    if(unlockReward){
      const reveal=$('#treasureUnlockReveal'),fly=$('#treasureUnlockFly'),chest=$('#treasureChestBtn');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!reveal||!fly||!chest)return;
        const fr=fly.getBoundingClientRect(),cr=chest.getBoundingClientRect();
        fly.style.setProperty('--treasure-fly-x',`${cr.left+cr.width/2-(fr.left+fr.width/2)}px`);
        fly.style.setProperty('--treasure-fly-y',`${cr.top+cr.height/2-(fr.top+fr.height/2)}px`);
        reveal.classList.add('show');
        setTimeout(()=>playSfx('sparkle'),180);
        setTimeout(()=>{if(!gardenCelebration)return;reveal.classList.add('flying');chest.classList.add('treasure-catch')},1650);
        setTimeout(()=>{reveal.classList.add('done');chest.classList.remove('treasure-catch');playSfx('sparkle')},2700)
      }))
    }
  }
}"""
if old not in s: raise SystemExit('celebration block not found')
s=s.replace(old,new,1)

old="""function makeDraggable(el){
  let pid=null;const scene=$('#gardenScene');
  el.onpointerdown=e=>{pid=e.pointerId;el._p=null;el._start={x:e.clientX,y:e.clientY};el.setPointerCapture?.(pid);el.classList.add('dragging')};
  el.onpointermove=e=>{if(e.pointerId!==pid)return;const r=scene.getBoundingClientRect();const x=Math.max(4,Math.min(96,(e.clientX-r.left)/r.width*100));const y=Math.max(10,Math.min(91,(e.clientY-r.top)/r.height*100));el.style.left=`${x}%`;el.style.top=`${y}%`;el._p={x,y}};
  el.onpointerup=e=>{if(e.pointerId!==pid)return;el.classList.remove('dragging');const id=el.dataset.id,p=el._p,start=el._start;pid=null;
    if(!p||Math.hypot(e.clientX-(start?.x||e.clientX),e.clientY-(start?.y||e.clientY))<5){tapGardenObject(id);return}
    if(id==='bunny')state.garden.bunnySeated=false;
    state.garden.pos[id]=p;const reacted=reactToGardenDrop(id,p);save();
    if(reacted||id==='bench'||id==='picnic'||id==='mail'||id==='cat'||id==='bunny')renderGarden();
  }
}"""
new="""function treasureDropHit(x,y){const chest=$('#treasureChestBtn');if(!chest)return false;const r=chest.getBoundingClientRect();return x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12}
function makeDraggable(el){
  let pid=null;const scene=$('#gardenScene');
  el.onpointerdown=e=>{pid=e.pointerId;el._p=null;el._start={x:e.clientX,y:e.clientY};el.setPointerCapture?.(pid);el.classList.add('dragging')};
  el.onpointermove=e=>{if(e.pointerId!==pid)return;const r=scene.getBoundingClientRect();const x=Math.max(4,Math.min(96,(e.clientX-r.left)/r.width*100));const y=Math.max(10,Math.min(91,(e.clientY-r.top)/r.height*100));el.style.left=`${x}%`;el.style.top=`${y}%`;el._p={x,y};const over=el.dataset.id!=='bunny'&&treasureDropHit(e.clientX,e.clientY);$('#treasureChestBtn')?.classList.toggle('drop-ready',over);el.classList.toggle('over-treasure',over)};
  el.onpointerup=e=>{if(e.pointerId!==pid)return;const id=el.dataset.id,p=el._p,start=el._start,dropToTreasure=id!=='bunny'&&treasureDropHit(e.clientX,e.clientY);pid=null;el.classList.remove('dragging','over-treasure');$('#treasureChestBtn')?.classList.remove('drop-ready');
    if(dropToTreasure){
      if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}
      if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();const chest=$('#treasureChestBtn');chest?.classList.add('treasure-catch');setTimeout(()=>chest?.classList.remove('treasure-catch'),650);playSfx('sparkle');toast('Into the Treasure Box! ✦');return
    }
    if(!p||Math.hypot(e.clientX-(start?.x||e.clientX),e.clientY-(start?.y||e.clientY))<5){tapGardenObject(id);return}
    if(id==='bunny')state.garden.bunnySeated=false;
    state.garden.pos[id]=p;const reacted=reactToGardenDrop(id,p);save();
    if(reacted||id==='bench'||id==='picnic'||id==='mail'||id==='cat'||id==='bunny')renderGarden();
  }
  el.onpointercancel=()=>{$('#treasureChestBtn')?.classList.remove('drop-ready');el.classList.remove('dragging','over-treasure');pid=null}
}"""
if old not in s: raise SystemExit('makeDraggable block not found')
s=s.replace(old,new,1)

old="""  const gain=30,beforeGrowth=state.garden.growth;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;session.xp+=gain;session.count++;if(!session.doneIds.includes(w.id))session.doneIds.push(w.id);
  const finished=session.count>=session.goal;gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,beforeGrowth,growth:state.garden.growth,finished};session.q=null;save();"""
new="""  const gain=30,beforeGrowth=state.garden.growth,beforeXp=state.xp;state.xp+=gain;state.garden.growth++;l.loops=(l.loops||0)+1;session.xp+=gain;session.count++;if(!session.doneIds.includes(w.id))session.doneIds.push(w.id);
  const unlockedReward=rewards.find(r=>r.id!=='bunny'&&beforeXp<r.xp&&state.xp>=r.xp)||null;
  if(unlockedReward&&!state.garden.stored.includes(unlockedReward.id))state.garden.stored.push(unlockedReward.id);
  const finished=session.count>=session.goal;gardenCelebration={word:w.word,emoji:w.pictureEmoji||'🌱',gain,beforeGrowth,growth:state.garden.growth,finished,unlock:unlockedReward?{id:unlockedReward.id,label:unlockedReward.label,icon:unlockedReward.icon}:null};session.q=null;save();"""
if old not in s: raise SystemExit('stage4 reward block not found')
s=s.replace(old,new,1)

p.write_text(s)
