// Cache only static presentation assets, never API responses, credentials or private data.
const CACHE='merka-static-v1';const ASSETS=['/','/styles.css','/assets/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method==='GET'&&url.origin===location.origin&&['/','/styles.css','/assets/icon.svg'].includes(url.pathname))e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
