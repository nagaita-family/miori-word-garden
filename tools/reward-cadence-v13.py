from pathlib import Path

p=Path('app.js')
s=p.read_text()
old="""const rewards=[
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
new="""const rewards=[
{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:50,y:66},
{id:'bench',xp:30,type:'treasure',label:'Cozy garden bench',icon:'🩷',x:25,y:73},
{id:'picnic',xp:60,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:72},
{id:'mail',xp:120,type:'treasure',label:'Heart mailbox',icon:'💌',x:17,y:57},
{id:'cat',xp:180,type:'friend',label:'Garden cat',icon:'🐱',x:69,y:64},
{id:'birdbath',xp:240,type:'treasure',label:'Bird bath',icon:'🐦',x:85,y:51},
{id:'seedcrate',xp:300,type:'treasure',label:'Seed crate',icon:'🌼',x:34,y:61},
{id:'arch',xp:390,type:'treasure',label:'Flower arch',icon:'🌸',x:57,y:51},
{id:'shed',xp:480,type:'treasure',label:'Little garden shed',icon:'🏡',x:90,y:34}
];"""
if old not in s:
    raise SystemExit('reward block not found')
s=s.replace(old,new,1)
old_next="const next=rewards.find(r=>state.xp<r.xp);const nextText=next?`${next.icon||'✦'} ${next.label} at ${next.xp} XP`:'✨ All current garden surprises unlocked!';"
new_next="const next=rewards.find(r=>state.xp<r.xp);const wordsAway=next?Math.max(1,Math.ceil((next.xp-state.xp)/30)):0;const nextText=next?`${next.icon||'✦'} Next: ${next.label} · ${wordsAway} ${wordsAway===1?'word':'words'} away`:'✨ All current garden surprises unlocked!';"
if old_next not in s:
    raise SystemExit('next reward line not found')
s=s.replace(old_next,new_next,1)
p.write_text(s)
