(()=>{
'use strict';
const VERSION=1;
function fresh(){return{livingGardenVersion:VERSION,growth:0,pos:{},stored:[],bunnySeated:false,locations:{bunny:'garden'},characterPos:{},fruit:{stage:0,ripe:0},houses:{main_house:{owned:true}},garage:[],placed:[],moments:{}}}
function migrate(state){
 if(state.garden?.livingGardenVersion===VERSION)return state;
 // Replace only the Garden subtree. XP, learning history, words and test state remain untouched.
 state.garden=fresh();return state;
}
function daypart(date=new Date()){
 const hour=date.getHours();return hour<6||hour>=20?'night':hour<11?'morning':hour<17?'day':'evening';
}
function render({state,celebration,save,play,feel}){
 const part=daypart(),g=state.garden,view=document.querySelector('#gardenView');
 const titles={morning:'A gentle morning',day:'A sunny afternoon',evening:'A glowing evening',night:'A peaceful night'};
 const note=celebration?`<div class="living-moment">🌱 ${escapeText(celebration.word)} helped your garden grow!</div>`:'';
 view.innerHTML=`<div class="living-garden garden-view"><header class="living-head"><div><p class="eyebrow">YOUR LIVING GARDEN</p><h1>Miori’s little world ✦</h1><p>${titles[part]} · ${g.growth} words grown</p></div><button id="livingPlay" class="primary-btn">${celebration?'Next word →':'Play! ✦'}</button></header><div class="living-scene ${part}" id="livingScene"><div class="living-sky"><i class="living-cloud first"></i><i class="living-cloud second"></i><i class="living-sun"></i><i class="living-moon"></i><i class="living-stars">✦　✧　✦</i></div><div class="living-hill far"></div><div class="living-hill near"></div><div class="living-shrub left"></div><div class="living-shrub right"></div><div class="living-oak"><i class="trunk"></i><i class="canopy"></i></div><div class="living-house"><i class="roof"></i><i class="window"></i><i class="door"></i></div><div class="living-path"></div><div class="living-lawn"></div><div class="living-patio-lights">✦　✦　✦　✦</div><div id="livingActors"></div>${note}<div class="living-scene-label">${titles[part]}</div></div></div>`;
 view.querySelector('#livingPlay').addEventListener('click',play);
}
function escapeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.LivingGarden={VERSION,fresh,migrate,daypart,render};
let lastPart=daypart();setInterval(()=>{const next=daypart();if(next!==lastPart){lastPart=next;if(document.querySelector('#gardenView.active-view .living-scene'))document.querySelector('[data-nav="garden"]')?.click()}},60000);
})();
