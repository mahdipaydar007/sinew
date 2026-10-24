// App shell: network first (updates arrive), cache fallback (works offline). Exercise GIFs/thumbnails: cache first, so every GIF you've seen works offline.
const C='sinew-v9',M='ironclad-media';
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>Promise.allSettled(['./','index.html','style.css','data.js','app.js','manifest.json','icon.svg'].map(u=>c.add(u)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>![C,M,'ironclad-ex'].includes(x)).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.hostname==='raw.githubusercontent.com'&&/\.(gif|jpg|png)$/i.test(u.pathname)){
    e.respondWith(caches.open(M).then(async c=>{const h=await c.match(r);if(h)return h;const x=await fetch(r);if(x.ok)c.put(r,x.clone()).catch(()=>{});return x}));return}
  if(u.origin!==location.origin)return;
  e.respondWith(fetch(r).then(x=>{const y=x.clone();caches.open(C).then(c=>c.put(r,y));return x}).catch(()=>caches.match(r)))});
