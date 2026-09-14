from pathlib import Path

p=Path('app.js')
s=p.read_text()

# ----- Garden reward: show the exact plant BEFORE growth, spotlight it, then animate to AFTER growth. -----
old="""  const celebration=gardenCelebration;const target=celebration?(celebration.growth<=5?'left':'right'):'';const storedCount=(state.garden.stored||[]).length;const unlockedTreasureCount=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp).length;
  const rewardCard=celebration?`<div class=\"reward-garden-card\"><div class=\"reward-emoji\">${esc(celebration.emoji||'🌱')}</div><div class=\"copy\"><b>${esc(celebration.word)} made the garden grow! ✦</b><span>+${celebration.gain} XP · Watch the shoot grow, then bloom.</span></div><button id=\"gardenNextWordBtn\">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const burst=celebration?`<div class=\"growth-burst ${target}\"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';"""
new="""  const celebration=gardenCelebration;let target='',beforeStage=0,afterStage=0;
  if(celebration){const step=celebration.beforeGrowth<10?celebration.beforeGrowth:(celebration.beforeGrowth%10);target=step<5?'left':'right';beforeStage=step<5?step:step-5;afterStage=Math.min(5,beforeStage+1)}
  const displayA=celebration&&target==='left'?beforeStage:a,displayB=celebration&&target==='right'?beforeStage:b;
  const storedCount=(state.garden.stored||[]).length;const unlockedTreasureCount=rewards.filter(r=>r.id!=='bunny'&&state.xp>=r.xp).length;
  const stageNames=['Seed','Tiny sprout','Growing stem','Leafy plant','Flower bud','Bloom!'];const growthCopy=celebration?`${stageNames[beforeStage]} → ${stageNames[afterStage]}`:'';
  const rewardCard=celebration?`<div class=\"reward-garden-card\"><div class=\"reward-emoji\">${esc(celebration.emoji||'🌱')}</div><div class=\"copy\"><b>${esc(celebration.word)} made THIS plant grow! ✦</b><span>+${celebration.gain} XP · ${growthCopy}</span></div><button id=\"gardenNextWordBtn\">${celebration.finished?'Finish ✦':'Next word →'}</button></div>`:'';
  const burst=celebration?`<div class=\"growth-burst ${target}\"><span>✦</span><span>✧</span><span>🌱</span><span>✦</span></div>`:'';
  const growthBadge=celebration?`<div class=\"growth-target-badge ${target}\"><b>LOOK! THIS ONE ✦</b><span>${growthCopy}</span></div>`:'';
  const sparkRing=celebration?`<div class=\"growth-spark-ring ${target}\"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>`:'';"""
if old not in s:
    raise SystemExit('garden celebration header target missing')
s=s.replace(old,new,1)

old_plots="""<div class=\"plot left ${target==='left'?'growth-now':''}\">${plant(a)}</div><div class=\"plot right ${target==='right'?'growth-now':''}\">${plant(b)}</div>${growthJourneyHtml(target)}${burst}${gardenReactionHtml()}"""
new_plots="""<div class=\"plot left ${target==='left'?'growth-target':''}\" data-growth-plot=\"left\">${plant(displayA)}</div><div class=\"plot right ${target==='right'?'growth-target':''}\" data-growth-plot=\"right\">${plant(displayB)}</div>${burst}${growthBadge}${sparkRing}${gardenReactionHtml()}"""
if old_plots not in s:
    raise SystemExit('garden plots target missing')
s=s.replace(old_plots,new_plots,1)

old_tail="""  if(celebration){setTimeout(()=>playSfx('sparkle'),180)}"""
new_tail="""  if(celebration){
    const targetPlot=$(`.plot[data-growth-plot=\"${target}\"]`),bunny=root.querySelector('[data-id=\"bunny\"]'),scene=$('#gardenScene');
    if(bunny)bunny.classList.add('garden-cheer');
    const bp=bunnyDisplayPos();scene?.insertAdjacentHTML('beforeend',`<div class=\"bunny-cheer-bubble\" style=\"left:${bp.x}%;top:${Math.max(12,bp.y-16)}%\">Yay! <span>♡</span></div>`);
    setTimeout(()=>{if(!gardenCelebration||!targetPlot)return;targetPlot.innerHTML=plant(afterStage);targetPlot.classList.add('growth-change');playSfx('sparkle')},720)
  }"""
if old_tail not in s:
    raise SystemExit('garden celebration tail target missing')
s=s.replace(old_tail,new_tail,1)

# ----- Human audio: only accept files whose filename/title really represents the single target word. -----
start=s.find('async function findHumanAudio(wordText){')
end=s.find('async function resolveHumanAudioForWord',start)
if start<0 or end<0:
    raise SystemExit('findHumanAudio block missing')
strict_audio=r'''function humanAudioTokens(text){
  try{text=decodeURIComponent(String(text||''))}catch{text=String(text||'')}
  text=text.replace(/^File:/i,'').replace(/\.(ogg|oga|mp3|wav|m4a)(?:\?.*)?$/i,'').replace(/[_+()\[\],.-]+/g,' ').toLowerCase();
  return text.match(/[a-z]+/g)||[]
}
function isWordOnlyHumanAudio(word,title='',url=''){
  word=norm(word);if(!word)return false;
  const source=title||String(url||'').split('/').pop()||'';const tokens=humanAudioTokens(source);
  const meta=new Set(['en','eng','english','us','usa','uk','gb','au','ca','american','british','pronunciation','pronounce','audio','voice','spoken','male','female','wiktionary','commons','file']);
  const meaningful=tokens.filter(t=>!meta.has(t));
  return meaningful.length===1&&meaningful[0]===word
}
function storedHumanAudioLooksSafe(w){
  if(!w?.pronunciationUrl)return false;
  const auto=String(w.pronunciationSource||'').toLowerCase().includes('wikimedia')||/wikimedia\.org|upload\.wikimedia\.org/i.test(w.pronunciationUrl);
  return !auto||isWordOnlyHumanAudio(w.word,'',w.pronunciationUrl)
}
async function findHumanAudio(wordText){
  const word=norm(wordText);if(!word)return'';
  try{
    const q=encodeURIComponent(`${word} pronunciation`);
    const url=`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);const res=await fetch(url,{signal:controller.signal});clearTimeout(timer);if(!res.ok)return'';
    const data=await res.json();const pages=Object.values(data.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.url);
    const scored=pages.map(p=>{const title=String(p.title||''),low=title.toLowerCase(),info=p.imageinfo[0],audioUrl=info.url||'';
      if(!isWordOnlyHumanAudio(word,title,audioUrl))return null;
      let score=20;if(low.includes(word))score+=8;if(/en[-_ ]?(us|uk|gb)|english|american|british/i.test(title))score+=5;if(/pronunciation|pronounce/i.test(title))score+=3;
      if(/\.mp3(?:$|\?)/i.test(audioUrl))score+=8;else if(/\.(m4a|wav)(?:$|\?)/i.test(audioUrl))score+=6;else if(/\.(ogg|oga)(?:$|\?)/i.test(audioUrl))score+=4;
      return{url:audioUrl,score,title}
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    return scored[0]?.url||''
  }catch{return''}
}
'''
s=s[:start]+strict_audio+s[end:]

# Validate old cached Wikimedia selections before trying to play them. This clears phrase recordings such as
# "Like a butterfly upon the wheel" and immediately searches again for a word-only file.
needle="""  const setPill=(text,cls='')=>{if(!pill)return;pill.textContent=text;pill.classList.remove('human-ready','human-wait','device-fallback');if(cls)pill.classList.add(cls)};
  if(word.pronunciationUrl){"""
replacement="""  const setPill=(text,cls='')=>{if(!pill)return;pill.textContent=text;pill.classList.remove('human-ready','human-wait','device-fallback');if(cls)pill.classList.add(cls)};
  if(word.pronunciationUrl&&!storedHumanAudioLooksSafe(word)){
    word.pronunciationUrl='';word.pronunciationSource='';word.audioTried=false;save();setPill('○ Finding a word-only recording…','human-wait');
    const found=await resolveHumanAudioForWord(word);if(found)return playWordAudio(word,slow,{auto,userInitiated})
  }
  if(word.pronunciationUrl){"""
if needle not in s:
    raise SystemExit('playWordAudio validation insertion target missing')
s=s.replace(needle,replacement,1)

p.write_text(s)
