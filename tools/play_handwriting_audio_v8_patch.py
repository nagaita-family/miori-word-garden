from pathlib import Path

p=Path('app.js')
s=p.read_text()

# Remove maxlength from Scribble fields so iPadOS can finish recognition before we normalize the result.
s=s.replace(' value="" maxlength="1" inputmode="none"', ' value="" inputmode="none"')

# Add a small Scribble normalizer before bindLetterBox.
marker='function bindLetterBox(box,index,w,q){'
insert=r'''function normalizeScribbleLetter(raw,expected=''){
  const original=String(raw??'').trim();
  let cleaned=norm(original);
  if(!cleaned){
    if(expected==='l'&&['1','|','｜'].includes(original))return'l';
    if(expected==='t'&&['+','†'].includes(original))return't';
    return''
  }
  // Scribble occasionally commits a short candidate string before settling. If it already contains
  // the letter this box expects, keep that expected letter rather than throwing the whole attempt away.
  if(cleaned.length>1&&expected&&cleaned.includes(expected))return expected;
  // A handwritten lowercase l is sometimes interpreted as capital I on iPad. Preserve spelling intent here.
  if(expected==='l'&&original==='I')return'l';
  return cleaned.slice(-1)
}
'''
if marker not in s:
    raise SystemExit('bindLetterBox marker missing')
s=s.replace(marker,insert+marker,1)

old="""    const cleaned=norm(e.target.value).slice(-1);if(!cleaned){e.target.value='';return}
    q.letters[index]=cleaned;q.feedback=null;q.hint=null;"""
new="""    const expected=expectedText(w,q)[index]||'';
    const cleaned=normalizeScribbleLetter(e.target.value,expected);if(!cleaned){e.target.value='';return}
    q.letters[index]=cleaned;q.feedback=null;q.hint=null;"""
if old not in s:
    raise SystemExit('input normalization target missing')
s=s.replace(old,new,1)

# Make explicit user taps identify themselves, and mark the automatic per-stage playback separately.
s=s.replace("$('#audioBtn').onclick=()=>playWordAudio(w);$('#pictureWordAudioBtn')?.addEventListener('click',()=>playWordAudio(w));",
            "$('#audioBtn').onclick=()=>playWordAudio(w,false,{userInitiated:true});$('#pictureWordAudioBtn')?.addEventListener('click',()=>playWordAudio(w,false,{userInitiated:true}));")
s=s.replace("setTimeout(()=>playWordAudio(w),120);", "setTimeout(()=>playWordAudio(w,false,{auto:true}),120);")
s=s.replace("$('#hintAudioBtn')?.addEventListener('click',()=>playWordAudio(w,true));", "$('#hintAudioBtn')?.addEventListener('click',()=>playWordAudio(w,true,{userInitiated:true}));")

start=s.find('async function playWordAudio(word,slow=false){')
end=s.find('async function findHumanAudio(wordText){',start)
if start<0 or end<0:
    raise SystemExit('playWordAudio block missing')
new_audio=r'''async function playWordAudio(word,slow=false,{auto=false,userInitiated=false}={}){
  if('speechSynthesis'in window)speechSynthesis.cancel();$$('.listen-card.speaking').forEach(b=>b.classList.remove('speaking'));
  if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}
  const pill=$('#voicePill');
  const setPill=(text,cls='')=>{if(!pill)return;pill.textContent=text;pill.classList.remove('human-ready','human-wait','device-fallback');if(cls)pill.classList.add(cls)};
  if(word.pronunciationUrl){
    let finished=false,timer=null;const btn=$('#audioBtn');
    const cleanup=(audio)=>{if(timer)clearTimeout(timer);btn?.classList.remove('playing');if(currentAudio===audio)currentAudio=null};
    const fallback=(audio,reason='')=>{
      if(finished)return;finished=true;cleanup(audio);word.audioTried=true;save();
      // Never erase a stored human URL because of a transient iPad/network/autoplay failure.
      setPill('○ Human audio unavailable now · device voice','device-fallback');
      speak(word.word,{slow})
    };
    try{
      const audio=new Audio();currentAudio=audio;audio.preload='auto';audio.playbackRate=slow?.82:1;btn?.classList.add('playing');
      setPill('● Human recording','human-ready');
      audio.onplaying=()=>{if(timer)clearTimeout(timer);setPill('● Human recording','human-ready')};
      audio.onended=()=>{finished=true;cleanup(audio)};
      // abort is normally caused by us switching to another sound; it is not evidence that the human file is bad.
      audio.onabort=()=>{finished=true;cleanup(audio)};
      audio.onerror=()=>fallback(audio,'media');
      audio.src=word.pronunciationUrl;
      timer=setTimeout(()=>{
        if(audio.readyState>=2||finished)return;
        if(auto){finished=true;cleanup(audio);setPill('● Human recording · tap WORD','human-wait');return}
        fallback(audio,'timeout')
      },5000);
      await audio.play();return
    }catch(e){
      const blocked=e?.name==='NotAllowedError'||e?.name==='AbortError';
      const audio=currentAudio;
      if(blocked){
        finished=true;cleanup(audio);setPill('● Human recording · tap WORD','human-wait');return
      }
      console.warn('Human audio failed for this attempt, using device voice',e);fallback(audio,'play');return
    }
  }
  setPill('○ Device voice','');speak(word.word,{slow})
}
'''
s=s[:start]+new_audio+s[end:]

# Prefer browser-friendly human audio when the search returns multiple otherwise-equivalent recordings.
old_score="""if(/\\.(ogg|oga|mp3|wav)$/i.test(info.url||''))score+=3;if(/song|music|sentence|phrase/.test(title))score-=6;"""
new_score="""if(/\\.mp3(?:$|\\?)/i.test(info.url||''))score+=7;else if(/\\.(m4a|wav)(?:$|\\?)/i.test(info.url||''))score+=5;else if(/\\.(ogg|oga)(?:$|\\?)/i.test(info.url||''))score+=3;if(/song|music|sentence|phrase/.test(title))score-=6;"""
if old_score in s:
    s=s.replace(old_score,new_score,1)

p.write_text(s)
