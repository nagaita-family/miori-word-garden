from pathlib import Path

index = Path('index.html')
text = index.read_text()
marker = 'LETTER_BOX_WRITING_V3_20260913'
if marker in text:
    print('Letter-box patch already applied.')
else:
    css = Path('.github/patches/letter-boxes.css').read_text()
    js = Path('.github/patches/letter-boxes.js').read_text()
    if '</style>' not in text:
        raise SystemExit('style anchor not found')
    if "render('garden');" not in text:
        raise SystemExit('render anchor not found')
    text = text.replace('</style>', css + '\n</style>', 1)
    text = text.replace("render('garden');", js + "\nrender('garden');", 1)
    index.write_text(text)

Path('sw.js').write_text("""const CACHE='mwg-v2-letterboxes-20260913';
const CORE=['./','./index.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{let copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));return}e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
""")
