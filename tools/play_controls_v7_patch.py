from pathlib import Path

p=Path('app.js')
s=p.read_text()

old_clue='''function clueHtml(w){return`<div class="word-visual-cue audio-clue-panel"><div class="cue-picture-tile" aria-label="${esc(w.pictureCue||'Picture clue')}"><span class="cue-picture-emoji">${esc(w.pictureEmoji||emojiFor(w.word))}</span></div><div class="cue-listen-grid"><button id="meaningEnAudioBtn" class="listen-card english" type="button" aria-label="Hear the English meaning"><span class="listen-icon">🔊</span><span class="listen-copy"><small>ENGLISH</small><b>Meaning</b></span><span class="listen-action">Tap to hear <span class="sound-bars">▮▮▮</span></span></button><button id="meaningJaAudioBtn" class="listen-card japanese" type="button" aria-label="日本語の意味を聞く"><span class="listen-icon">🔊</span><span class="listen-copy"><small>日本語</small><b>いみ</b></span><span class="listen-action">タップして聞く <span class="sound-bars">▮▮▮</span></span></button><button id="exampleAudioBtn" class="listen-card example" type="button" aria-label="Hear the example sentence"><span class="listen-icon">💬</span><span class="listen-copy"><small>EXAMPLE</small><b>Sentence</b></span><span class="listen-action">Tap to hear <span class="sound-bars">▮▮▮</span></span></button></div></div>`}'''
new_clue='''function clueHtml(w){return`<div class="word-visual-cue audio-clue-panel"><button id="pictureWordAudioBtn" class="cue-picture-tile" type="button" aria-label="Hear the word again"><span class="cue-picture-emoji">${esc(w.pictureEmoji||emojiFor(w.word))}</span><span class="cue-picture-sound">🔊 WORD</span></button><div class="cue-listen-grid"><button id="meaningEnAudioBtn" class="listen-card english" type="button" aria-label="Hear the English meaning"><span class="listen-icon">🔊</span><span class="listen-copy"><small>ENGLISH</small><b>Meaning</b></span><span class="listen-action">Tap to hear <span class="sound-bars">▮▮▮</span></span></button><button id="meaningJaAudioBtn" class="listen-card japanese" type="button" aria-label="日本語の意味を聞く"><span class="listen-icon">🔊</span><span class="listen-copy"><small>日本語</small><b>いみ</b></span><span class="listen-action">タップして聞く <span class="sound-bars">▮▮▮</span></span></button><button id="exampleAudioBtn" class="listen-card example" type="button" aria-label="Hear the example sentence"><span class="listen-icon">💬</span><span class="listen-copy"><small>EXAMPLE</small><b>Sentence</b></span><span class="listen-action">Tap to hear <span class="sound-bars">▮▮▮</span></span></button></div></div>`}'''
if old_clue not in s:
    raise SystemExit('clue target missing')
s=s.replace(old_clue,new_clue,1)

old_audio='<button id="audioBtn" class="audio-orb">🔊</button>'
new_audio='<button id="audioBtn" class="audio-orb word-sound-button" aria-label="Hear the spelling word"><span class="speaker-glyph">🔊</span><small>WORD</small></button>'
if old_audio not in s:
    raise SystemExit('audio button target missing')
s=s.replace(old_audio,new_audio,1)

old_help='<div class="help-row"><button id="hintBtn" class="help-btn hint">✦ Hint</button><button id="peekBtn" class="help-btn">◉ Peek</button></div>'
new_help='<div class="help-row assist-dock"><button id="hintBtn" class="help-btn hint assist-btn"><span class="assist-icon">✦</span><span><b>Hint</b><small>Give me a clue</small></span></button><button id="peekBtn" class="help-btn peek assist-btn"><span class="assist-icon">◉</span><span><b>Peek</b><small>Show the word</small></span></button></div>'
if old_help not in s:
    raise SystemExit('help target missing')
s=s.replace(old_help,new_help,1)

old_bind="$('#exitPlayBtn').onclick=renderPlayHome;$('#audioBtn').onclick=()=>playWordAudio(w);$('#meaningEnAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningEn||w.pictureCue||'',{lang:'en-US',button:e.currentTarget}));"
new_bind="$('#exitPlayBtn').onclick=renderPlayHome;$('#audioBtn').onclick=()=>playWordAudio(w);$('#pictureWordAudioBtn')?.addEventListener('click',()=>playWordAudio(w));$('#meaningEnAudioBtn')?.addEventListener('click',e=>speakLearningText(w.meaningEn||w.pictureCue||'',{lang:'en-US',button:e.currentTarget}));"
if old_bind not in s:
    raise SystemExit('bind target missing')
s=s.replace(old_bind,new_bind,1)

p.write_text(s)
