from pathlib import Path

p=Path('app.js')
s=p.read_text()

old_clue="""function clueHtml(w){return`<div class=\"word-visual-cue\"><div class=\"cue-emoji\">${esc(w.pictureEmoji||emojiFor(w.word))}</div><div class=\"cue-copy\"><strong>${esc(w.pictureCue||'Picture this word in your mind.')}</strong><p class=\"meaning\">${esc(w.meaningEn||'')}</p>${w.meaningJa?`<p>${esc(w.meaningJa)}</p>`:''}</div></div>`}"""
new_clue="""function clueHtml(w){return`<div class=\"word-visual-cue audio-clue-panel\"><div class=\"cue-picture-tile\" aria-label=\"${esc(w.pictureCue||'Picture clue')}\"><span class=\"cue-picture-emoji\">${esc(w.pictureEmoji||emojiFor(w.word))}</span></div><div class=\"cue-listen-grid\"><button id=\"meaningEnAudioBtn\" class=\"listen-card english\" type=\"button\" aria-label=\"Hear the English meaning\"><span class=\"listen-icon\">🔊</span><span class=\"listen-copy\"><small>ENGLISH</small><b>Meaning</b></span><span class=\"listen-action\">Tap to hear <span class=\"sound-bars\">▮▮▮</span></span></button><button id=\"meaningJaAudioBtn\" class=\"listen-card japanese\" type=\"button\" aria-label=\"日本語の意味を聞く\"><span class=\"listen-icon\">🔊</span><span class=\"listen-copy\"><small>日本語</small><b>いみ</b></span><span class=\"listen-action\">タップして聞く <span class=\"sound-bars\">▮▮▮</span></span></button><button id=\"exampleAudioBtn\" class=\"listen-card example\" type=\"button\" aria-label=\"Hear the example sentence\"><span class=\"listen-icon\">💬</span><span class=\"listen-copy\"><small>EXAMPLE</small><b>Sentence</b></span><span class=\"listen-action\">Tap to hear <span class=\"sound-bars\">▮▮▮</span></span></button></div></div>`}"""
if old_clue not in s:
    raise SystemExit('clueHtml target missing')
s=s.replace(old_clue,new_clue,1)

old_help='''<div class="help-row"><button id="hintBtn" class="help-btn hint">✦ Hint</button><button id="peekBtn" class="help-btn">◉ Peek</button><button id="meaningBtn" class="help-btn">💡 Meaning</button><button id="exampleBtn" class="help-btn">💬 Example</button></div><div id="helpPanel" class="help-panel ${helpKind?'':'hidden'}">${helpPanelHtml(w)}</div>'''
new_help='''<div class="help-row"><button id="hintBtn" class="help-btn hint">✦ Hint</button><button id="peekBtn" class="help-btn">◉ Peek</button></div>'''
if old_help not in s:
    raise SystemExit('help row target missing')
s=s.replace(old_help,new_help,1)

old_audio_bind="""$('#audioBtn').onclick=()=>playWordAudio(w);$('#hintBtn').onclick=()=>showHint(w,q);"""
new_audio_bind="""$('#audioBtn').onclick=()=>playWordAudio(w);$('#meaningEnAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningEn||w.pictureCue||'',{lang:'en-US',button:e.currentTarget}));$('#meaningJaAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningJa||'',{lang:'ja-JP',button:e.currentTarget}));$('#exampleAudioBtn')?.addEventListener('click',e=>speakLearningText(w.example||'',{lang:'en-US',button:e.currentTarget}));$('#hintBtn').onclick=()=>showHint(w,q);"""
if old_audio_bind not in s:
    raise SystemExit('audio bind target missing')
s=s.replace(old_audio_bind,new_audio_bind,1)

old_help_bind="""$('#peekBtn').onclick=()=>showPeek(w);$('#meaningBtn').onclick=()=>toggleHelp('meaning',w);$('#exampleBtn').onclick=()=>toggleHelp('example',w);bindQuestion(w,q);"""
new_help_bind="""$('#peekBtn').onclick=()=>showPeek(w);bindQuestion(w,q);"""
if old_help_bind not in s:
    raise SystemExit('help bind target missing')
s=s.replace(old_help_bind,new_help_bind,1)

marker="function speak(text,{slow=false}={}){"
insert=r'''function chosenVoiceForLang(lang='en-US'){
  const code=String(lang).slice(0,2).toLowerCase();
  if(code==='en')return chosenVoice();
  const list=voices.filter(v=>String(v.lang||'').toLowerCase().startsWith(code));
  if(code==='ja')return list.find(v=>/(Kyoko|Otoya|Hattori|Haruka|Japanese|日本語)/i.test(v.name))||list[0]||null;
  return list[0]||null
}
function speakLearningText(text,{lang='en-US',button=null}={}){
  text=String(text||'').trim();if(!text)return toast(lang.startsWith('ja')?'説明がありません。':'No audio text saved.');
  if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}
  if(!('speechSynthesis'in window))return toast('Speech is not available on this device.');
  speechSynthesis.cancel();$$('.listen-card.speaking').forEach(b=>b.classList.remove('speaking'));
  const u=new SpeechSynthesisUtterance(text),v=chosenVoiceForLang(lang);if(v)u.voice=v;u.lang=v?.lang||lang;u.rate=lang.startsWith('ja')?.86:.9;u.pitch=1.02;
  button?.classList.add('speaking');const done=()=>button?.classList.remove('speaking');u.onend=done;u.onerror=done;speechSynthesis.speak(u)
}
'''
if marker not in s:
    raise SystemExit('speak marker missing')
s=s.replace(marker,insert+marker,1)

old_play="""async function playWordAudio(word,slow=false){
  if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}"""
new_play="""async function playWordAudio(word,slow=false){
  if('speechSynthesis'in window)speechSynthesis.cancel();$$('.listen-card.speaking').forEach(b=>b.classList.remove('speaking'));
  if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}"""
if old_play not in s:
    raise SystemExit('playWordAudio target missing')
s=s.replace(old_play,new_play,1)

p.write_text(s)
