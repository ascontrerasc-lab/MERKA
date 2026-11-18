// MERKA PWA: cache de recursos publicos, compatible con /MERKA/ en GitHub Pages.
// No guardar API, credenciales, contenido privado ni respuestas de Firebase.
const CACHE='merka-static-pages-v2';
const BASE=new URL(self.registration.scope);
const ASSETS=['./','./styles.css','./assets/icon.svg'].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  if(event.request.method==='GET' && ASSETS.includes(event.request.url)) {
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
  }
});
