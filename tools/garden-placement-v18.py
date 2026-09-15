from pathlib import Path

p=Path('app.js')
s=p.read_text()

def replace_once(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: source not found')
    s=s.replace(old,new,1)

# Clearer default positions: beds live on the left, decorations enter the open center/right play space.
replacements={
"{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:50,y:66}":"{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:53,y:68}",
"{id:'bench',xp:90,type:'treasure',label:'Cozy garden bench',icon:'🩷',x:25,y:73}":"{id:'bench',xp:90,type:'treasure',label:'Cozy garden bench',icon:'🩷',x:57,y:76}",
"{id:'picnic',xp:180,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:72}":"{id:'picnic',xp:180,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:77}",
"{id:'mail',xp:270,type:'treasure',label:'Heart mailbox',icon:'💌',x:17,y:57}":"{id:'mail',xp:270,type:'treasure',label:'Heart mailbox',icon:'💌',x:48,y:58}",
"{id:'cat',xp:360,type:'friend',label:'Garden cat',icon:'🐱',x:69,y:64}":"{id:'cat',xp:360,type:'friend',label:'Garden cat',icon:'🐱',x:71,y:65}",
"{id:'birdbath',xp:450,type:'treasure',label:'Bird bath',icon:'🐦',x:85,y:51}":"{id:'birdbath',xp:450,type:'treasure',label:'Bird bath',icon:'🐦',x:88,y:57}",
"{id:'seedcrate',xp:540,type:'treasure',label:'Seed crate',icon:'🌼',x:34,y:61}":"{id:'seedcrate',xp:540,type:'treasure',label:'Seed crate',icon:'🌼',x:48,y:78}",
"{id:'arch',xp:630,type:'treasure',label:'Flower arch',icon:'🌸',x:57,y:51}":"{id:'arch',xp:630,type:'treasure',label:'Flower arch',icon:'🌸',x:64,y:49}",
"{id:'shed',xp:720,type:'treasure',label:'Little garden shed',icon:'🏡',x:90,y:34}":"{id:'shed',xp:720,type:'treasure',label:'Little garden shed',icon:'🏡',x:89,y:36}"
}
for old,new in replacements.items():
    replace_once(old,new,'reward position')

# The big unlock reveal is single-use. Re-rendering Garden for place/store must never replay it.
old="""  const unlockReward=celebration?.unlock?rewards.find(r=>r.id===celebration.unlock.id):null;
  const rewardCard="""
new="""  const unlockReward=celebration?.unlock&&!celebration.unlockShown?rewards.find(r=>r.id===celebration.unlock.id):null;
  if(unlockReward)celebration.unlockShown=true;
  const rewardCard="""
replace_once(old,new,'single-use unlock reveal')

# Always place an item from the Treasure Box into its clear recommended spot. The user can drag from there.
old="""  $$('.place-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;state.garden.stored=state.garden.stored.filter(x=>x!==id);if(!state.garden.pos[id])state.garden.pos[id]=gardenDefaultPos(id);save();renderGarden();openTreasureChest();playSfx('place')});"""
new="""  $$('.place-item').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id;state.garden.stored=state.garden.stored.filter(x=>x!==id);state.garden.pos[id]=gardenDefaultPos(id);save();renderGarden();openTreasureChest();playSfx('place')});"""
replace_once(old,new,'clear placement from treasure')

p.write_text(s)
