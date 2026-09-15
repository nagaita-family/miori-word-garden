from pathlib import Path
p=Path('app.js')
s=p.read_text()
old="""        reveal.classList.add('show');
        setTimeout(()=>playSfx('sparkle'),180);
        setTimeout(()=>{if(!gardenCelebration)return;reveal.classList.add('flying');chest.classList.add('treasure-catch')},1650);
        setTimeout(()=>{reveal.classList.add('done');chest.classList.remove('treasure-catch');playSfx('sparkle')},2700)"""
new="""        const nextBtn=$('#gardenNextWordBtn'),playBtn=$('#gardenPlayBtn');if(nextBtn)nextBtn.disabled=true;if(playBtn)playBtn.disabled=true;
        setTimeout(()=>{if(!gardenCelebration)return;reveal.classList.add('show');playSfx('sparkle')},1900);
        setTimeout(()=>{if(!gardenCelebration)return;reveal.classList.add('flying');chest.classList.add('treasure-catch')},3550);
        setTimeout(()=>{reveal.classList.add('done');chest.classList.remove('treasure-catch');playSfx('sparkle');if(nextBtn)nextBtn.disabled=false;if(playBtn)playBtn.disabled=false},4600)"""
if old not in s: raise SystemExit('unlock timing block not found')
s=s.replace(old,new,1)
p.write_text(s)
