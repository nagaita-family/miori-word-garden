/* v34: optional, source-backed suggestions. Never guess a missing dictionary entry. */
(()=>{
'use strict';
const cache=new Map();
const emojiByWord={apple:'🍎',banana:'🍌',orange:'🍊',grape:'🍇',raisin:'🍇',strawberry:'🍓',carrot:'🥕',potato:'🥔',bread:'🍞',cake:'🎂',water:'💧',rain:'🌧️',snow:'❄️',sun:'☀️',moon:'🌙',star:'⭐',fire:'🔥',cloud:'☁️',tree:'🌳',flower:'🌸',leaf:'🍃',grass:'🌱',forest:'🌲',river:'🏞️',sea:'🌊',ocean:'🌊',mountain:'⛰️',cat:'🐱',dog:'🐶',rabbit:'🐰',bird:'🐦',fish:'🐟',horse:'🐴',frog:'🐸',butterfly:'🦋',beetle:'🪲',honeybee:'🐝',ladybug:'🐞',cricket:'🦗',grasshopper:'🦗',insect:'🐛',school:'🏫',book:'📖',pencil:'✏️',bicycle:'🚲',bike:'🚲',car:'🚗',train:'🚆',airplane:'✈️',house:'🏠',home:'🏠',friend:'🧑‍🤝‍🧑',family:'👨‍👩‍👧‍👦',happy:'😊',sad:'😢',love:'❤️',jump:'🦘',leap:'🦘',hopping:'🐰',leaping:'🦘',because:'💭',gentle:'🕊️',shootingstar:'🌠'};
const visualDefinitions=[[/\b(a|an|the) (insect|bug)\b/i,'🐛'],[/\b(a|an|the) (flower|blossom)\b/i,'🌸'],[/\b(a|an|the) (bird)\b/i,'🐦'],[/\b(a|an|the) (tree)\b/i,'🌳'],[/\b(a|an|the) (fruit)\b/i,'🍎']];
const cleanWord=w=>String(w||'').toLowerCase().replace(/[^a-z]/g,'');
async function jsonWithin(url,limit=5200){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),limit);try{const res=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!res.ok)return null;return await res.json()}catch{return null}finally{clearTimeout(timer)}}
function simplePhonics(word){for(const part of ['igh','eigh','tion','ough','sh','ch','th','ph','ee','ea','ai','ay','oa','oo','ou','ow','oi','oy','ck','ng'])if(word.includes(part))return part;return''}
function extractJapanese(data){
 const wiki=data?.parse?.wikitext?.['*'];if(typeof wiki!=='string')return'';
 const heading=/^==\s*(?:英語|English)\s*==\s*$/mi.exec(wiki);if(!heading)return'';
 const rest=wiki.slice(heading.index+heading[0].length).split(/^==[^=\n][^\n]*==\s*$/m)[0];
 for(const raw of rest.split('\n')){
   if(!/^#(?![:*#])\s*\S/.test(raw))continue;
   let text=raw.replace(/^#\s*/,'');for(let i=0;i<4;i++)text=text.replace(/\{\{[^{}]*\}\}/g,'');
   text=text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2').replace(/\[\[([^\]]+)\]\]/g,'$1').replace(/\[[^\]]*\]/g,'').replace(/<[^>]+>/g,'').replace(/''+/g,'').replace(/\{\|[^]*$/,'').trim();
   text=text.replace(/^[:：;；\s]+/,'').split(/[。；;]/)[0].trim();
   if(text.length>=1&&text.length<=70&&/[ぁ-んァ-ン一-龯]/.test(text)&&!/[{}|=#]/.test(text))return text;
 }
 return'';
}
async function lookup(wordText){
 const word=cleanWord(wordText);if(!word||word.length>35)return{word:'',fields:{},sources:{}};
 if(cache.has(word))return cache.get(word);
 const task=(async()=>{
   const [entries,ja]=await Promise.all([
     jsonWithin(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
     jsonWithin(`https://ja.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`)
   ]);
   const entry=Array.isArray(entries)?entries.find(e=>cleanWord(e?.word)===word):null;
   const definitions=(entry?.meanings||[]).flatMap(m=>(m.definitions||[]).map(d=>({part:m.partOfSpeech,definition:d.definition,example:d.example})));
   const selected=definitions.find(d=>typeof d.definition==='string'&&d.definition.trim()&&d.definition.length<=300)||null;
   const fields={},sources={};
   if(selected){fields.meaningEn=selected.definition.trim();sources.meaningEn='Free Dictionary API';if(typeof selected.example==='string'&&selected.example.trim()&&selected.example.length<=260){fields.example=selected.example.trim();sources.example='Free Dictionary API'}}
   const japanese=extractJapanese(ja);if(japanese){fields.meaningJa=japanese;sources.meaningJa='Japanese Wiktionary'}
   const emoji=emojiByWord[word]||visualDefinitions.find(([re])=>re.test(selected?.definition||''))?.[1]||'';
   if(emoji){fields.pictureEmoji=emoji;sources.pictureEmoji='Word Garden picture suggestion'}
   if(emoji&&selected?.definition){fields.pictureCue=`Picture idea: ${selected.definition.trim().slice(0,135)}`;sources.pictureCue='Dictionary-based picture suggestion'}
   const phonics=simplePhonics(word);if(phonics){fields.phonicsFocus=phonics;sources.phonicsFocus='Word Garden letter-pattern suggestion'}
   return{word,fields,sources,foundEnglish:!!selected,foundJapanese:!!japanese};
 })().catch(()=>({word,fields:{},sources:{},foundEnglish:false,foundJapanese:false}));
 cache.set(word,task);return task;
}
window.WordGardenAutoFill={lookup,extractJapanese,simplePhonics};
})();
