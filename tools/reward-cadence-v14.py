from pathlib import Path

p=Path('app.js')
s=p.read_text()
old="""const rewards=[
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
new="""const rewards=[
{id:'bunny',xp:0,type:'rabbit',label:'Bunny',icon:'🐰',x:50,y:66},
{id:'bench',xp:90,type:'treasure',label:'Cozy garden bench',icon:'🩷',x:25,y:73},
{id:'picnic',xp:180,type:'treasure',label:'Strawberry picnic',icon:'🍓',x:78,y:72},
{id:'mail',xp:270,type:'treasure',label:'Heart mailbox',icon:'💌',x:17,y:57},
{id:'cat',xp:360,type:'friend',label:'Garden cat',icon:'🐱',x:69,y:64},
{id:'birdbath',xp:450,type:'treasure',label:'Bird bath',icon:'🐦',x:85,y:51},
{id:'seedcrate',xp:540,type:'treasure',label:'Seed crate',icon:'🌼',x:34,y:61},
{id:'arch',xp:630,type:'treasure',label:'Flower arch',icon:'🌸',x:57,y:51},
{id:'shed',xp:720,type:'treasure',label:'Little garden shed',icon:'🏡',x:90,y:34}
];"""
if old not in s:
    raise SystemExit('current reward block not found')
s=s.replace(old,new,1)
p.write_text(s)
