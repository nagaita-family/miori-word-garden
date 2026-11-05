'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const start=app.indexOf('function speak(text,{slow=false}={})');
const end=app.indexOf('\nfunction humanAudioTokens(',start);
assert(start>=0&&end>start,'word playback functions available');
const source=app.slice(start,end);

function createEnv({ignoresRate=false}={}){
 const played=[],spoken=[];
 const synthesis={cancel(){},speak(utterance){spoken.push(utterance)}};
 class MockAudio{
  constructor(){this._rate=1;this.defaultPlaybackRate=1;this.readyState=2;this.pauseCount=0;played.push(this)}
  set playbackRate(value){this._rate=ignoresRate?1:value}
  get playbackRate(){return this._rate}
  set src(value){this._src=value;this._rate=1}
  get src(){return this._src}
  pause(){this.pauseCount++}
  async play(){this.onloadedmetadata?.();this.onplaying?.()}
 }
 class Utterance{constructor(text){this.text=text}}
 const ctx={window:{speechSynthesis:synthesis},speechSynthesis:synthesis,SpeechSynthesisUtterance:Utterance,Audio:MockAudio,
  chosenVoice:()=>({lang:'en-US',voiceURI:'en-us'}),displayedSpelling:w=>w.displayWord||w.word,currentAudio:null,
  '$':()=>null,'$$':()=>[],storedHumanAudioLooksSafe:()=>true,
  resolveHumanAudioForWord:async()=>false,save:()=>{},toast:()=>{},
  setTimeout,clearTimeout,console
 };
 vm.runInNewContext(source,ctx);
 return{ctx,played,spoken};
}
test('Parent Slow reapplies 0.60x to a human recording after loading resets the rate',async()=>{
 const {ctx,played,spoken}=createEnv();
 await ctx.playWordAudio({word:'year',pronunciationUrl:'https://example.com/year.mp3'},true,{userInitiated:true});
 assert.equal(played.length,1);
 assert.equal(played[0].defaultPlaybackRate,.60);
 assert.equal(played[0].playbackRate,.60);
 assert.equal(spoken.length,0,'human recording remains preferred');
});
test('normal human pronunciation remains at 1.0x',async()=>{
 const {ctx,played}=createEnv();
 await ctx.playWordAudio({word:'year',pronunciationUrl:'https://example.com/year.mp3'},false,{userInitiated:true});
 assert.equal(played[0].playbackRate,1);
});
test('when a device refuses a slowed recording, pause it and play slow device speech instead',async()=>{
 const {ctx,played,spoken}=createEnv({ignoresRate:true});
 await ctx.playWordAudio({word:'month',pronunciationUrl:'https://example.com/month.mp3'},true,{userInitiated:true});
 assert.equal(played[0].pauseCount,1);
 assert.equal(spoken.length,1);
 assert.equal(spoken[0].text,'month');
 assert.equal(spoken[0].rate,.52);
});
test('when no human recording exists the distinct TTS slow setting is used',async()=>{
 const {ctx,spoken,played}=createEnv();
 await ctx.playWordAudio({word:'orbit'},true,{userInitiated:true});
 assert.equal(played.length,0);
 assert.equal(spoken.length,1);
 assert.equal(spoken[0].rate,.52);
});
test('Parent UI labels speed and the app uses the new cache-busted release',()=>{
 assert.match(app,/Slow 0\.6×/);
 assert.match(app,/onloadedmetadata=\(\)=>/);
 assert.match(app,/function setHumanWordRate\(audio,slow\)/);
 assert.match(html,/app\.js\?v=[^"]*v71/);
 assert.match(html,/v71 · Nov 4/);
});
test('contraction audio says the display spelling rather than the normalized key',async()=>{
 const {ctx,spoken,played}=createEnv();
 await ctx.playWordAudio({word:'wont',displayWord:'won’t'},true,{userInitiated:true});
 assert.equal(played.length,0);
 assert.equal(spoken.length,1);
 assert.equal(spoken[0].text,'won’t');
 assert.equal(spoken[0].rate,.52);
});
