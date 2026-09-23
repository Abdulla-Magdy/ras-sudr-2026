const CACHE_NAME = "ras-sudr-baz-v35";
const CORE = [
  "./","./index.html","./login.html","./food.html","./shopping.html","./meals.html","./my-tasks.html","./responsibilities.html","./expenses.html","./crew.html","./ideas.html","./bag.html","./location.html","./manifest.webmanifest",
  "./assets/style.css?v=20","./assets/app.js?v=20","./assets/tutorial.js?v=20","./assets/auto-update.js?v=20",
  "./assets/v21.js?v=21","./assets/v22.js?v=22","./assets/v23.js?v=23","./assets/v24.js?v=24","./assets/v25.js?v=25","./assets/v26.js?v=26","./assets/v27.js?v=27","./assets/v28.js?v=28","./assets/v29.js?v=29","./assets/v30.js?v=30","./assets/v31.js?v=31","./assets/v32.js?v=32","./assets/v34.js?v=34","./assets/v35.js?v=35",
  "./assets/pwa-gate.js?v=20","./assets/db.js?v=20","./assets/fallback-data.js?v=20","./assets/supabase-config.js?v=20","./assets/install.js?v=20",
  "./assets/icons/icon-192.png","./assets/icons/icon-512.png","./assets/icons/apple-touch-icon.png","./assets/icons/app-icon-large.png"
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE).catch(()=>{})));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

async function put(cache,req,res){if(res&&res.ok){try{await cache.put(req,res.clone())}catch(_){}}return res;}
async function navigateFast(req,event){
  const cache=await caches.open(CACHE_NAME);const cached=await cache.match(req,{ignoreSearch:true});
  const network=fetch(req,{cache:'no-store'}).then(res=>put(cache,req,res));
  if(cached){event.waitUntil(network.catch(()=>{}));return cached;}
  try{return await network}catch(_){return (await cache.match('./index.html'))||Response.error()}
}
async function cachedStatic(req,event){
  const cache=await caches.open(CACHE_NAME);const cached=await cache.match(req,{ignoreSearch:false});
  const network=fetch(req).then(res=>put(cache,req,res));
  if(cached){event.waitUntil(network.catch(()=>{}));return cached;}
  try{return await network}catch(_){return Response.error()}
}
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){event.respondWith(navigateFast(req,event));return;}
  event.respondWith(cachedStatic(req,event));
});