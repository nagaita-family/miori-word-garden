from pathlib import Path

p=Path('app.js')
s=p.read_text()

def replace_once(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: source not found')
    s=s.replace(old,new,1)

replace_once(
"function gardenDefaultPos(id){const r=rewards.find(x=>x.id===id);return{x:r?.x??50,y:r?.y??60}}\nfunction gardenPos(id){return state.garden.pos[id]||gardenDefaultPos(id)}\nfunction bunnyDisplayPos(){const bench=gardenPos('bench');return state.garden.bunnySeated&&state.xp>=90?{x:bench.x,y:bench.y-8}:gardenPos('bunny')}\nfunction gardenUnlocked(id){const r=rewards.find(x=>x.id===id);return!!r&&state.xp>=r.xp}\nfunction gardenDistance",
"function gardenDefaultPos(id){const r=rewards.find(x=>x.id===id);return{x:r?.x??50,y:r?.y??60}}\nfunction gardenPos(id){return state.garden.pos[id]||gardenDefaultPos(id)}\nfunction gardenUnlocked(id){const r=rewards.find(x=>x.id===id);return!!r&&state.xp>=r.xp}\nfunction gardenPlaced(id){return gardenUnlocked(id)&&!(state.garden.stored||[]).includes(id)}\nfunction bunnyDisplayPos(){const bench=gardenPos('bench');return state.garden.bunnySeated&&gardenPlaced('bench')?{x:bench.x,y:bench.y-8}:gardenPos('bunny')}\nfunction interactionItem(type){return({seat:'bench',picnic:'picnic',mail:'mail',friends:'cat',birds:'birdbath',seeds:'seedcrate',arch:'arch',shed:'shed'})[type]||''}\nfunction gardenDistance",
'placed helper')

replace_once(
"function gardenReactionHtml(){\n  if(!gardenInteraction)return'';const type=gardenInteraction.type;\n  const data={seat:['bench','♡','Cozy!'],picnic:['picnic','🍓','Snack time!'],mail:['mail','💌','A letter!'],friends:['cat','♡','New friend!'],birds:['birdbath','🐦','Bird visitors!'],seeds:['seedcrate','🌼','Planting time!'],arch:['arch','✦','Pretty!'],shed:['shed','🧤','Garden tools!']}[type];if(!data)return'';\n  const p=gardenPos(data[0]);return`<div class=\"garden-reaction ${type}\" style=\"left:${p.x}%;top:${Math.max(12,p.y-14)}%\"><span>${data[1]}</span><b>${data[2]}</b></div>`\n}",
"function gardenReactionHtml(){\n  if(!gardenInteraction)return'';const type=gardenInteraction.type;\n  const data={seat:['bench','♡','Cozy!'],picnic:['picnic','🍓','Snack time!'],mail:['mail','💌','A letter!'],friends:['cat','♡','New friend!'],birds:['birdbath','🐦','Bird visitors!'],seeds:['seedcrate','🌼','Planting time!'],arch:['arch','✦','Pretty!'],shed:['shed','🧤','Garden tools!']}[type];if(!data||!gardenPlaced(data[0])){gardenInteraction=null;return''}\n  const p=gardenPos(data[0]);return`<div class=\"garden-reaction ${type}\" style=\"left:${p.x}%;top:${Math.max(12,p.y-14)}%\"><span>${data[1]}</span><b>${data[2]}</b></div>`\n}",
'reaction visibility gate')

replace_once(
"    const options=[['bench','seat',16],['picnic','picnic',17],['mail','mail',17],['cat','friends',16],['birdbath','birds',16],['seedcrate','seeds',16],['arch','arch',18],['shed','shed',17]].filter(([key])=>gardenUnlocked(key));",
"    const options=[['bench','seat',16],['picnic','picnic',17],['mail','mail',17],['cat','friends',16],['birdbath','birds',16],['seedcrate','seeds',16],['arch','arch',18],['shed','shed',17]].filter(([key])=>gardenPlaced(key));",
'bunny only reacts to placed items')

for item in ['bench','picnic','mail','cat','birdbath','seedcrate','arch','shed']:
    s=s.replace(f"gardenUnlocked('{item}')",f"gardenPlaced('{item}')")

replace_once(
"  $$('.store-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();openTreasureChest();playSfx('store')});",
"  $$('.store-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}if(gardenInteraction&&interactionItem(gardenInteraction.type)===id)gardenInteraction=null;if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();openTreasureChest();playSfx('store')});",
'modal store clears interaction')

replace_once(
"      if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}\n      if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();",
"      if(id==='bench'&&state.garden.bunnySeated){state.garden.bunnySeated=false;state.garden.pos.bunny=gardenDefaultPos('bunny')}\n      if(gardenInteraction&&interactionItem(gardenInteraction.type)===id)gardenInteraction=null;\n      if(!state.garden.stored.includes(id))state.garden.stored.push(id);save();renderGarden();",
'drag store clears interaction')

p.write_text(s)
