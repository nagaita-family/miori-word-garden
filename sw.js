const CACHE='mwg-v0150';
const ASSETS=[
  './','./index.html','./v012.css','./v012.js','./assets/art-manifest.js',
  './assets/background/garden-base-dev.svg',
  './assets/animals/rabbit/idle-temp.svg','./assets/animals/rabbit/water-temp.svg','./assets/animals/rabbit/happy-temp.svg','./assets/animals/rabbit/eat-temp.svg',
  './assets/animals/cat/idle-temp.svg','./assets/animals/cat/water-temp.svg','./assets/animals/cat/happy-temp.svg','./assets/animals/cat/eat-temp.svg',
  './assets/animals/squirrel/idle-temp.svg','./assets/animals/squirrel/water-temp.svg','./assets/animals/squirrel/happy-temp.svg','./assets/animals/squirrel/eat-temp.svg',
  './assets/animals/duck/idle-temp.svg','./assets/animals/duck/water-temp.svg','./assets/animals/duck/happy-temp.svg','./assets/animals/duck/eat-temp.svg',
  './assets/animals/hedgehog/idle-temp.svg','./assets/animals/hedgehog/water-temp.svg','./assets/animals/hedgehog/happy-temp.svg','./assets/animals/hedgehog/eat-temp.svg',
  './assets/animals/bird/idle-temp.svg','./assets/animals/bird/water-temp.svg','./assets/animals/bird/happy-temp.svg','./assets/animals/bird/eat-temp.svg',
  './assets/animals/dog/idle-temp.svg','./assets/animals/dog/water-temp.svg','./assets/animals/dog/happy-temp.svg','./assets/animals/dog/eat-temp.svg'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
