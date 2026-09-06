
const CACHE_NAME = "ras-sudr-baz-v20";
const CORE = [
  "./",
  "./index.html",
  "./login.html",
  "./food.html",
  "./responsibilities.html",
  "./expenses.html",
  "./crew.html",
  "./ideas.html",
  "./bag.html",
  "./manifest.webmanifest",
  "./assets/style.css?v=20",
  "./assets/app.js?v=20",
  "./assets/tutorial.js?v=20",
  "./assets/auto-update.js?v=20",
  "./assets/pwa-gate.js?v=20",
  "./assets/db.js?v=20",
  "./assets/fallback-data.js?v=20",
  "./assets/supabase-config.js?v=20",
  "./assets/install.js?v=20",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/app-icon-large.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE).catch(() => {}))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  const isAppCode =
    req.mode === "navigate" ||
    req.destination === "script" ||
    req.destination === "style" ||
    url.pathname.endsWith(".webmanifest");

  // App shell/code: network first.
  // When online, this avoids serving old code after a deployment.
  if(isAppCode){
    event.respondWith(
      fetch(req, {cache:"no-store"}).then(res => {
        if(res && res.ok){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy));
        }
        return res;
      }).catch(async()=>{
        const cached=await caches.match(req);
        if(cached) return cached;
        if(req.mode==="navigate") return caches.match("./index.html");
        throw new Error("offline");
      })
    );
    return;
  }

  // Images and other static files: cache first + background refresh.
  event.respondWith(
    caches.match(req).then(cached=>{
      const refresh=fetch(req).then(res=>{
        if(res && res.ok){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy));
        }
        return res;
      }).catch(()=>cached);
      return cached || refresh;
    })
  );
});
