/* Word Garden Auto Fill: optional dictionary suggestions with an offline basic-word fallback.
 * No school/parent content is overwritten; app.js controls which empty fields are filled.
 */
(()=>{
'use strict';
const cache=new Map();
const emojiByWord={apple:'🍎',banana:'🍌',orange:'🍊',grape:'🍇',raisin:'🍇',strawberry:'🍓',carrot:'🥕',potato:'🥔',bread:'🍞',cake:'🎂',water:'💧',rain:'🌧️',snow:'❄️',sun:'☀️',moon:'🌙',star:'⭐',fire:'🔥',cloud:'☁️',tree:'🌳',flower:'🌸',leaf:'🍃',grass:'🌱',forest:'🌲',river:'🏞️',sea:'🌊',ocean:'🌊',mountain:'⛰️',cat:'🐱',dog:'🐶',rabbit:'🐰',bird:'🐦',fish:'🐟',horse:'🐴',frog:'🐸',butterfly:'🦋',beetle:'🪲',honeybee:'🐝',ladybug:'🐞',cricket:'🦗',grasshopper:'🦗',insect:'🐛',school:'🏫',book:'📖',pencil:'✏️',bicycle:'🚲',bike:'🚲',car:'🚗',train:'🚆',airplane:'✈️',house:'🏠',home:'🏠',friend:'🧑‍🤝‍🧑',family:'👨‍👩‍👧‍👦',happy:'😊',sad:'😢',love:'❤️',jump:'🦘',leap:'🦘',hopping:'🐰',leaping:'🦘',because:'💭',gentle:'🕊️',shootingstar:'🌠',summer:'☀️',winter:'❄️',spring:'🌷',autumn:'🍂',with:'🤝',american:'🇺🇸',british:'🇬🇧',japanese:'🇯🇵',escaped:'🏃',handle:'🧳',single:'☝️',teacher:'👩‍🏫',student:'🧑‍🎓',together:'🤝',park:'🌳',drawing:'🎨',reading:'📖',writing:'✏️',food:'🍽️',game:'🎮'};
const visualDefinitions=[[/\b(a|an|the) (insect|bug)\b/i,'🐛'],[/\b(a|an|the) (flower|blossom)\b/i,'🌸'],[/\b(a|an|the) (bird)\b/i,'🐦'],[/\b(a|an|the) (tree)\b/i,'🌳'],[/\b(a|an|the) (fruit)\b/i,'🍎']];
// Small, human-curated basic glossary, not a scraped or AI-generated dictionary.
// Values: short child-friendly English explanation, ordinary Japanese sense, optional example and visual cue.
// It remains available if a public API times out or rejects browser requests.
const basicGlossary={
 summer:['the warm season between spring and autumn','夏','I like swimming in summer.','a sunny summer day'],
 friend:['a person you know and like','友達、友人','I played with my friend.','two friends smiling together'],
 with:['together with someone, or using something','～と一緒に、～を使って','I went to the park with Dad.','two people walking together'],
 winter:['the cold season after autumn','冬'],spring:['the season after winter','春'],autumn:['the season after summer','秋'],
 school:['a place where children learn','学校'],teacher:['a person who teaches','先生'],student:['a person who learns at school','生徒、学生'],
 book:['pages with words or pictures to read','本'],pencil:['something you write or draw with','鉛筆'],paper:['material you write or draw on','紙'],
 read:['to look at and understand written words','読む'],reading:['looking at and understanding written words','読書、読むこと'],
 write:['to make letters or words','書く'],writing:['making letters or words','書くこと、文章'],draw:['to make a picture','絵を描く'],drawing:['making a picture','お絵描き、絵'],
 play:['to have fun with a game or activity','遊ぶ'],played:['had fun playing','遊んだ'],playing:['having fun with a game or activity','遊んでいる'],
 home:['the place where you live','家、自宅'],house:['a building where people live','家'],family:['people in your family','家族'],
 mother:['a female parent','母、お母さん'],father:['a male parent','父、お父さん'],brother:['a boy or man who shares your parent','兄、弟'],sister:['a girl or woman who shares your parent','姉、妹'],
 happy:['feeling glad','うれしい、幸せな'],sad:['feeling unhappy','悲しい'],excited:['feeling very happy about something coming','わくわくした'],
 fun:['something enjoyable','楽しいこと'],good:['nice or of good quality','良い'],bad:['not good','悪い'],
 big:['large in size','大きい'],small:['little in size','小さい'],little:['small','小さい'],beautiful:['very pretty','美しい'],cute:['pleasantly pretty or sweet','かわいい'],
 kind:['caring and helpful to others','親切な'],gentle:['kind, soft, and not rough','優しい、おだやかな'],careful:['trying not to make a mistake or cause harm','注意深い'],
 help:['to make something easier for someone','助ける'],please:['a polite word used when asking','お願いします'],
 morning:['the early part of the day','朝'],night:['the dark part of the day','夜'],today:['this day','今日'],tomorrow:['the day after today','明日'],yesterday:['the day before today','昨日'],
 week:['seven days','週'],day:['one day','日、1日'],year:['twelve months','年、1年'],
 water:['a clear liquid we drink','水'],fire:['flames that give heat and light','火'],sun:['the star that gives Earth light','太陽'],moon:['the bright object that goes around Earth','月'],
 star:['a bright object in the night sky','星'],rain:['water falling from clouds','雨'],snow:['white ice crystals falling from clouds','雪'],cloud:['a white or gray shape in the sky','雲'],
 tree:['a tall plant with a trunk and branches','木'],flower:['the colorful part of a plant','花'],leaf:['a flat green part of a plant','葉'],grass:['short green plants covering ground','草'],
 cat:['a small pet that meows','猫'],dog:['an animal often kept as a pet that barks','犬'],rabbit:['a small animal with long ears','ウサギ'],bird:['an animal with feathers and wings','鳥'],fish:['an animal that lives in water and has fins','魚'],
 apple:['a round fruit that can be red or green','りんご'],banana:['a long yellow fruit','バナナ'],potato:['a vegetable that grows underground','じゃがいも'],
 bicycle:['a vehicle with two wheels that you pedal','自転車'],bike:['a bicycle','自転車'],car:['a road vehicle with wheels','車'],train:['connected carriages that travel on tracks','電車、列車'],
 park:['a place with grass or trees where people can play','公園'],game:['an activity played for fun','ゲーム、遊び'],food:['things people eat','食べ物'],
 jump:['to push yourself into the air','跳ぶ'],jumping:['going up into the air','跳んでいる'],hopping:['jumping with short little jumps','ぴょんぴょん跳ぶこと'],leaping:['jumping high or far','大きく跳ぶこと'],
 escaped:['got away from a place or danger','逃げた'],handle:['the part of an object that you hold','取っ手、持ち手'],single:['only one','一つの、単独の'],
 american:['relating to the United States or its people','アメリカの、アメリカ人'],british:['relating to Britain or its people','イギリスの、イギリス人'],japanese:['relating to Japan or its language','日本の、日本人、日本語'],
 shootingstar:['a bright streak in the night sky made by a meteor','流れ星'],together:['with each other','一緒に'],
 after:['later than something','～の後で'],before:['earlier than something','～の前に'],when:['at what time or at the time that','いつ、～するとき'],where:['in what place','どこに、どこで'],why:['for what reason','なぜ'],what:['which thing','何'],who:['which person','誰'],
 can:['to be able to do something','～できる'],have:['to own or hold something','持っている'],has:['has something; used with he, she, or it','持っている'],
 make:['to create or build something','作る'],made:['created or built something','作った'],look:['to use your eyes to see something','見る'],find:['to discover or locate something','見つける'],found:['discovered something','見つけた'],
 want:['to wish to have or do something','欲しい、～したい'],love:['to like someone or something very much','大好き、愛する'],like:['to enjoy or be fond of','好き'],
 nice:['pleasant or kind','すてきな、親切な'],very:['to a high degree','とても'],really:['truly or very','本当に'],always:['every time','いつも'],never:['not at any time','決して～ない'],sometimes:['on some occasions','ときどき'],
 different:['not the same','違う、異なる'],difficult:['hard to do or understand','難しい'],easy:['not difficult','簡単な'],favorite:['liked more than the others','お気に入りの'],
 people:['more than one person','人々'],person:['one human being','人'],children:['more than one child','子どもたち'],child:['a young person','子ども'],girl:['a female child','女の子'],boy:['a male child','男の子']
};
const cleanWord=w=>String(w||'').toLowerCase().replace(/[^a-z]/g,'');
async function jsonWithin(url,limit=6000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),limit);try{const res=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!res.ok)return null;return await res.json()}catch{return null}finally{clearTimeout(timer)}}
function simplePhonics(word){for(const part of ['igh','eigh','tion','ough','sh','ch','th','ph','ee','ea','ai','ay','oa','oo','ou','ow','oi','oy','ck','ng'])if(word.includes(part))return part;return''}
function extractJapanese(data){
 const wiki=data?.parse?.wikitext?.['*'];if(typeof wiki!=='string')return'';
 // Real Japanese Wiktionary entries often use =={{L|en}}== or =={{en}}==, not just ==英語==.
 const heading=/^==\s*(?:英語|English|\{\{\s*(?:L\s*\|\s*en|en|-en-)\s*\}\})\s*==[ \t]*$/mi.exec(wiki);if(!heading)return'';
 const rest=wiki.slice(heading.index+heading[0].length).split(/^==[^=\n][^\n]*==[ \t]*$/m)[0];
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
   const fields={},sources={};const basic=basicGlossary[word];
   if(selected){fields.meaningEn=selected.definition.trim();sources.meaningEn='Free Dictionary API';if(typeof selected.example==='string'&&selected.example.trim()&&selected.example.length<=260){fields.example=selected.example.trim();sources.example='Free Dictionary API'}}
   const japanese=extractJapanese(ja);if(japanese){fields.meaningJa=japanese;sources.meaningJa='Japanese Wiktionary'}
   // Prefer the familiar everyday sense for the three reported words, not an obscure first dictionary sense.
   if(basic){
     if(!fields.meaningEn||['summer','friend','with'].includes(word)){fields.meaningEn=basic[0];sources.meaningEn='Word Garden built-in basic glossary'}
     if(!fields.meaningJa||['summer','friend','with'].includes(word)){fields.meaningJa=basic[1];sources.meaningJa='Word Garden built-in basic glossary'}
     if(!fields.example&&basic[2]){fields.example=basic[2];sources.example='Word Garden built-in example'}
   }
   const emoji=emojiByWord[word]||visualDefinitions.find(([re])=>re.test(fields.meaningEn||''))?.[1]||'';
   if(emoji){fields.pictureEmoji=emoji;sources.pictureEmoji='Word Garden picture suggestion'}
   if(basic?.[3]){fields.pictureCue=basic[3];sources.pictureCue='Word Garden built-in picture suggestion'}
   else if(emoji&&fields.meaningEn){fields.pictureCue=`Picture idea: ${fields.meaningEn.slice(0,135)}`;sources.pictureCue='Meaning-based picture suggestion'}
   const phonics=simplePhonics(word);if(phonics){fields.phonicsFocus=phonics;sources.phonicsFocus='Word Garden letter-pattern suggestion'}
   return{word,fields,sources,foundEnglish:!!fields.meaningEn,foundJapanese:!!fields.meaningJa,lookupUnavailable:entries===null||ja===null};
 })().catch(()=>({word,fields:{},sources:{},foundEnglish:false,foundJapanese:false,lookupUnavailable:true}));
 cache.set(word,task);
 // Never keep a failed network result forever. The user can retry Auto Fill when online.
 task.then(result=>{if(result.lookupUnavailable&&cache.get(word)===task)cache.delete(word)});
 return task;
}
window.WordGardenAutoFill={lookup,extractJapanese,simplePhonics};
})();
