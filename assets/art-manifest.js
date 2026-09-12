/* Miori's Word Garden v0.15.4 visibility hotfix.
   Use the known-good local kawaii SVG set already present in the repo, and keep
   a few permanent decorative treasures visible so the garden never feels empty. */
window.MWG_ART = {
  version: 154,
  background: 'assets/background/garden-base-dev.svg',
  backgroundHasRabbit: false,
  backgroundHasStaticFlowers: false,
  animals: {
    rabbit: {idle:'assets/animals/rabbit/idle-temp.svg',water:'assets/animals/rabbit/water-temp.svg',happy:'assets/animals/rabbit/happy-temp.svg',eat:'assets/animals/rabbit/eat-temp.svg'},
    cat: {idle:'assets/animals/cat/idle-temp.svg',water:'assets/animals/cat/water-temp.svg',happy:'assets/animals/cat/happy-temp.svg',eat:'assets/animals/cat/eat-temp.svg'},
    squirrel: {idle:'assets/animals/squirrel/idle-temp.svg',water:'assets/animals/squirrel/water-temp.svg',happy:'assets/animals/squirrel/happy-temp.svg',eat:'assets/animals/squirrel/eat-temp.svg'},
    duck: {idle:'assets/animals/duck/idle-temp.svg',water:'assets/animals/duck/water-temp.svg',happy:'assets/animals/duck/happy-temp.svg',eat:'assets/animals/duck/eat-temp.svg'},
    hedgehog: {idle:'assets/animals/hedgehog/idle-temp.svg',water:'assets/animals/hedgehog/water-temp.svg',happy:'assets/animals/hedgehog/happy-temp.svg',eat:'assets/animals/hedgehog/eat-temp.svg'},
    bird: {idle:'assets/animals/bird/idle-temp.svg',water:'assets/animals/bird/water-temp.svg',happy:'assets/animals/bird/happy-temp.svg',eat:'assets/animals/bird/eat-temp.svg'},
    dog: {idle:'assets/animals/dog/idle-temp.svg',water:'assets/animals/dog/water-temp.svg',happy:'assets/animals/dog/happy-temp.svg',eat:'assets/animals/dog/eat-temp.svg'}
  }
};

(function(){
  const css=`
    #world .v11-resident,#world .v153-friend{z-index:42!important;opacity:1!important;visibility:visible!important;filter:drop-shadow(0 5px 6px rgba(85,61,71,.20))}
    #world .v11-resident img,#world .v153-friend img{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:contain!important}
    #world .v153-special,#world .v11-special-item,#world .v11-treehouse,#world .v11-gift{z-index:40!important;opacity:1!important;visibility:visible!important}
    .v154-decor{position:absolute;z-index:18;pointer-events:none;filter:drop-shadow(0 5px 5px rgba(95,66,74,.18));transform:translate(-50%,-50%)}
    .v154-decor svg{display:block;width:100%;height:100%;overflow:visible}
    .v154-mushroom{left:21%;top:70%;width:7%;min-width:42px;aspect-ratio:1}
    .v154-basket{left:35%;top:73%;width:8%;min-width:48px;aspect-ratio:1.15}
    .v154-can{left:51%;top:76%;width:8%;min-width:48px;aspect-ratio:1.1}
  `;
  const style=document.createElement('style'); style.id='v154VisibilityStyle'; style.textContent=css; document.head.appendChild(style);

  function decorMarkup(){return `
    <div class="v154-decor v154-mushroom" aria-hidden="true"><svg viewBox="0 0 80 80"><ellipse cx="40" cy="68" rx="25" ry="6" fill="#d9c8bd" opacity=".35"/><path d="M31 38h18l5 28H26z" fill="#fff8ed" stroke="#fff" stroke-width="4"/><path d="M12 40c4-22 50-29 57 0-13 7-45 8-57 0z" fill="#ff9fbe" stroke="#fff" stroke-width="5"/><circle cx="29" cy="27" r="5" fill="#fff7fb"/><circle cx="49" cy="24" r="4" fill="#fff7fb"/><circle cx="56" cy="35" r="3" fill="#fff7fb"/></svg></div>
    <div class="v154-decor v154-basket" aria-hidden="true"><svg viewBox="0 0 100 85"><ellipse cx="51" cy="74" rx="34" ry="6" fill="#d9c8bd" opacity=".3"/><path d="M24 39h55l-7 35H31z" fill="#f2c98c" stroke="#fff" stroke-width="5"/><path d="M34 42c0-30 36-30 36 0" fill="none" stroke="#c8915f" stroke-width="7"/><g><circle cx="35" cy="32" r="10" fill="#ff9ec2"/><circle cx="55" cy="28" r="11" fill="#ffd46f"/><circle cx="70" cy="35" r="9" fill="#a7dfc7"/><circle cx="35" cy="32" r="3" fill="#fff7c7"/><circle cx="55" cy="28" r="3" fill="#fff7c7"/><circle cx="70" cy="35" r="3" fill="#fff7c7"/></g></svg></div>
    <div class="v154-decor v154-can" aria-hidden="true"><svg viewBox="0 0 100 85"><ellipse cx="51" cy="75" rx="34" ry="6" fill="#d9c8bd" opacity=".3"/><path d="M35 29h42v44H35z" rx="8" fill="#9edbd3" stroke="#fff" stroke-width="5"/><path d="M39 32c-14 1-20 12-17 26 3 11 12 14 20 10" fill="none" stroke="#79bfb7" stroke-width="7"/><path d="M76 43l20-13 3 8-20 17z" fill="#9edbd3" stroke="#fff" stroke-width="4"/><path d="M43 31c2-17 25-17 28 0" fill="none" stroke="#79bfb7" stroke-width="6"/><path d="M47 52c8 7 16 7 23 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg></div>`}

  function ensureVisibleGarden(){
    const world=document.getElementById('world'); if(!world)return;
    if(!world.querySelector('.v154-decor')) world.insertAdjacentHTML('beforeend',decorMarkup());
    world.querySelectorAll('.v11-resident img').forEach(img=>{
      img.style.display='block'; img.style.opacity='1';
      img.onerror=function(){const host=img.closest('.v11-resident'); const t=(host&&host.dataset.type)||'rabbit'; img.onerror=null; img.src='assets/animal-'+t+'.svg';};
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{ensureVisibleGarden();setTimeout(ensureVisibleGarden,300);setTimeout(ensureVisibleGarden,1200)});
  new MutationObserver(ensureVisibleGarden).observe(document.documentElement,{childList:true,subtree:true});
})();
