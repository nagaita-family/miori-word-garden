const CACHE='mwg-v0154-kawaii';
const ASSETS=[
  './',
  './index.html',
  './v012.css',
  './v012.js',
  './assets/art-manifest.js',
  './assets/background/garden-base-dev.svg',
  './assets/animals/rabbit/idle-v0153.svg',
  './assets/animals/cat/idle-v0153.svg',
  './assets/animals/squirrel/idle-v0153.svg',
  './assets/animals/duck/idle-v0153.svg',
  './assets/animals/hedgehog/idle-v0153.svg',
  './assets/animals/bird/idle-v0153.svg',
  './assets/animals/dog/idle-v0153.svg'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
