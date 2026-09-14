from pathlib import Path

p=Path('app.js')
s=p.read_text()

old="""const rewards=[
{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:51,y:64},
{id:'bench',xp:70,type:'treasure',label:'Cozy heart bench',icon:'🩷',x:25,y:72},
{id:'picnic',xp:140,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:70},
{id:'mail',xp:220,type:'treasure',label:'Heart mailbox',icon:'💌',x:17,y:55},
{id:'cat',xp:310,type:'friend',label:'Garden cat',icon:'🐱',x:69,y:62}
];"""
new="""const rewards=[
{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:50,y:66},
{id:'bench',xp:70,type:'treasure',label:'Cozy garden bench',icon:'🩷',x:25,y:73},
{id:'picnic',xp:140,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:72},
{id:'mail',xp:220,type:'treasure',label:'Heart mailbox',icon:'💌',x:17,y:57},
{id:'cat',xp:310,type:'friend',label:'Garden cat',icon:'🐱',x:69,y:64},
{id:'birdbath',xp:400,type:'treasure',label:'Bird bath',icon:'🐦',x:85,y:51},
{id:'seedcrate',xp:500,type:'treasure',label:'Seed crate',icon:'🌼',x:34,y:61},
{id:'arch',xp:620,type:'treasure',label:'Flower arch',icon:'🌸',x:57,y:51},
{id:'shed',xp:760,type:'treasure',label:'Little garden shed',icon:'🏡',x:90,y:34}
];"""
if old not in s:
    raise SystemExit('rewards target missing')
s=s.replace(old,new,1)

marker="function gardenObjectArt(r){"
extra=r'''function birdBathSvg(){return`<svg viewBox="0 0 130 135" aria-hidden="true"><ellipse cx="65" cy="40" rx="48" ry="14" fill="#d7e3e5" stroke="#aabfc4" stroke-width="4"/><path d="M22 39q43 28 86 0" fill="#b9d7dc"/><rect x="58" y="48" width="14" height="58" rx="7" fill="#d8ddcf"/><ellipse cx="65" cy="112" rx="34" ry="10" fill="#c9cfbf"/><path d="M78 27q11-12 25-2-8 3-12 11-5-1-13-9z" fill="#5f8fb5"/><circle cx="98" cy="25" r="2.5" fill="#34363b"/><path d="M105 25l10 3-10 3z" fill="#e8a73d"/></svg>`}
function seedCrateSvg(){return`<svg viewBox="0 0 140 112" aria-hidden="true"><rect x="20" y="48" width="100" height="49" rx="8" fill="#c48b58" stroke="#9d6f47" stroke-width="4"/><path d="M27 61h86M27 79h86" stroke="#e5bb8f" stroke-width="5"/><rect x="35" y="29" width="26" height="36" rx="4" fill="#f7e7b7" transform="rotate(-8 48 47)"/><rect x="72" y="24" width="28" height="39" rx="4" fill="#dfe9c9" transform="rotate(8 86 44)"/><circle cx="48" cy="44" r="7" fill="#ef8a7e"/><path d="M86 35v17M78 44h16" stroke="#6e9b62" stroke-width="4" stroke-linecap="round"/><path d="M112 34l7-13M110 37l15-4" stroke="#8a6b54" stroke-width="5" stroke-linecap="round"/></svg>`}
function flowerArchSvg(){return`<svg viewBox="0 0 145 150" aria-hidden="true"><path d="M28 137V68q0-50 45-50t45 50v69" fill="none" stroke="#eef0e7" stroke-width="12" stroke-linecap="round"/><path d="M38 137V70q0-38 35-38t35 38v67" fill="none" stroke="#8daf7c" stroke-width="8" stroke-linecap="round"/><g fill="#ef8e91"><circle cx="39" cy="54" r="10"/><circle cx="57" cy="31" r="10"/><circle cx="84" cy="28" r="10"/><circle cx="106" cy="48" r="10"/></g><g fill="#f7c95f"><circle cx="33" cy="78" r="7"/><circle cx="73" cy="20" r="7"/><circle cx="113" cy="72" r="7"/></g></svg>`}
function gardenShedSvg(){return`<svg viewBox="0 0 150 135" aria-hidden="true"><path d="M20 57h110v68H20z" fill="#fff8ea" stroke="#d8c8b4" stroke-width="4"/><path d="M10 59L75 18l65 41z" fill="#c87855" stroke="#aa6448" stroke-width="4"/><rect x="62" y="75" width="30" height="50" rx="4" fill="#7f9f87"/><rect x="31" y="72" width="22" height="22" rx="4" fill="#b9d8e7" stroke="#fff" stroke-width="4"/><path d="M42 72v22M31 83h22" stroke="#fff" stroke-width="3"/><circle cx="85" cy="99" r="3" fill="#f2cc5b"/></svg>`}
'''
if marker not in s:
    raise SystemExit('art marker missing')
s=s.replace(marker,extra+marker,1)

old_art="function gardenObjectArt(r){if(r.id==='bunny')return rabbitSvg();if(r.id==='bench')return benchSvg();if(r.id==='picnic')return picnicSvg();if(r.id==='mail')return mailboxSvg();if(r.id==='cat')return catSvg();return r.icon||'✦'}"
new_art="function gardenObjectArt(r){if(r.id==='bunny')return rabbitSvg();if(r.id==='bench')return benchSvg();if(r.id==='picnic')return picnicSvg();if(r.id==='mail')return mailboxSvg();if(r.id==='cat')return catSvg();if(r.id==='birdbath')return birdBathSvg();if(r.id==='seedcrate')return seedCrateSvg();if(r.id==='arch')return flowerArchSvg();if(r.id==='shed')return gardenShedSvg();return r.icon||'✦'}"
if old_art not in s:
    raise SystemExit('art mapper missing')
s=s.replace(old_art,new_art,1)

old_data="const data={seat:['bench','♡','Cozy!'],picnic:['picnic','🍓','Snack time!'],mail:['mail','💌','A letter!'],friends:['cat','♡','New friend!']}[type];"
new_data="const data={seat:['bench','♡','Cozy!'],picnic:['picnic','🍓','Snack time!'],mail:['mail','💌','A letter!'],friends:['cat','♡','New friend!'],birds:['birdbath','🐦','Bird visitors!'],seeds:['seedcrate','🌼','Planting time!'],arch:['arch','✦','Pretty!'],shed:['shed','🧤','Garden tools!']}[type];"
if old_data not in s:
    raise SystemExit('reaction map missing')
s=s.replace(old_data,new_data,1)

old_opts="const options=[['bench','seat',16],['picnic','picnic',17],['mail','mail',17],['cat','friends',16]].filter(([key])=>gardenUnlocked(key));"
new_opts="const options=[['bench','seat',16],['picnic','picnic',17],['mail','mail',17],['cat','friends',16],['birdbath','birds',16],['seedcrate','seeds',16],['arch','arch',18],['shed','shed',17]].filter(([key])=>gardenUnlocked(key));"
if old_opts not in s:
    raise SystemExit('interaction options missing')
s=s.replace(old_opts,new_opts,1)

old_tail="""  if(id==='mail'&&gardenUnlocked('mail')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('mail','bunny');return true}
  if(id==='cat'&&gardenUnlocked('cat')&&gardenDistance(p,bp)<16){triggerGardenInteraction('friends','bunny');return true}
  return false
}"""
new_tail="""  if(id==='mail'&&gardenUnlocked('mail')&&gardenDistance(p,bp)<17){releaseBunnyHere(bp);triggerGardenInteraction('mail','bunny');return true}
  if(id==='cat'&&gardenUnlocked('cat')&&gardenDistance(p,bp)<16){triggerGardenInteraction('friends','bunny');return true}
  if(id==='birdbath'&&gardenUnlocked('birdbath')&&gardenDistance(p,bp)<16){triggerGardenInteraction('birds','bunny');return true}
  if(id==='seedcrate'&&gardenUnlocked('seedcrate')&&gardenDistance(p,bp)<16){triggerGardenInteraction('seeds','bunny');return true}
  if(id==='arch'&&gardenUnlocked('arch')&&gardenDistance(p,bp)<18){triggerGardenInteraction('arch','bunny');return true}
  if(id==='shed'&&gardenUnlocked('shed')&&gardenDistance(p,bp)<17){triggerGardenInteraction('shed','bunny');return true}
  return false
}"""
if old_tail not in s:
    raise SystemExit('drop tail missing')
s=s.replace(old_tail,new_tail,1)

old_tap="""function tapGardenObject(id){
  if(id==='picnic'){triggerGardenInteraction('picnic',id);renderGarden();return}
  if(id==='mail'){triggerGardenInteraction('mail',id);renderGarden();return}
  if(id==='cat'){triggerGardenInteraction('friends',id);renderGarden();return}
  if(id==='bench'&&state.garden.bunnySeated){triggerGardenInteraction('seat','bunny');renderGarden()}
}"""
new_tap="""function tapGardenObject(id){
  if(id==='picnic'){triggerGardenInteraction('picnic',id);renderGarden();return}
  if(id==='mail'){triggerGardenInteraction('mail',id);renderGarden();return}
  if(id==='cat'){triggerGardenInteraction('friends',id);renderGarden();return}
  if(id==='birdbath'){triggerGardenInteraction('birds',id);renderGarden();return}
  if(id==='seedcrate'){triggerGardenInteraction('seeds',id);renderGarden();return}
  if(id==='arch'){triggerGardenInteraction('arch',id);renderGarden();return}
  if(id==='shed'){triggerGardenInteraction('shed',id);renderGarden();return}
  if(id==='bench'&&state.garden.bunnySeated){triggerGardenInteraction('seat','bunny');renderGarden()}
}"""
if old_tap not in s:
    raise SystemExit('tap function missing')
s=s.replace(old_tap,new_tap,1)

old_decor='<div class="garden-butterfly b2">🦋</div><div class="sun"></div><div class="cloud a"></div><div class="cloud b"></div><div class="hill back"></div><div class="hill front"></div><div class="path"></div><div class="pond"></div>'
new_decor='<div class="garden-butterfly b2">🦋</div><div class="sun"></div><div class="cloud a"></div><div class="cloud b"></div><div class="hill back"></div><div class="hill front"></div><div class="ca-house"></div><div class="white-fence"></div><div class="citrus-tree"></div><div class="patio-lights"></div><div class="lavender-edge left"></div><div class="lavender-edge right"></div><div class="path"></div><div class="pond"></div>'
if old_decor not in s:
    raise SystemExit('decor marker missing')
s=s.replace(old_decor,new_decor,1)

s=s.replace('Interactive treasures · visible plant growth · softer sound','Sunny backyard edition · collect, decorate, and grow')
s=s.replace("'Drag Bunny to the bench, picnic, mailbox, or cat — each one reacts differently.'","'Drag Bunny around the backyard — every special spot has its own little reaction.'")

p.write_text(s)
