const CACHE_NAME='ras-sudr-baz-v48';
const CORE=[
  './','./index.html','./login.html','./food.html','./shopping.html','./meals.html','./my-tasks.html','./responsibilities.html','./expenses.html','./crew.html','./ideas.html','./bag.html','./location.html','./transport.html','./activity.html','./games.html','./manifest.webmanifest',
  './assets/style.css?v=20','./assets/v38.css?v=38','./assets/app.js?v=39','./assets/v38.js?v=39','./assets/v39.js?v=39','./assets/v41.js?v=41','./assets/v42.js?v=43','./assets/v44.js?v=45','./assets/sprint2.js?v=46','./assets/notifications.js?v=47','./assets/games.js?v=48','./assets/tutorial.js?v=39','./assets/auto-update.js?v=48','./assets/pwa-gate.js?v=38','./assets/db.js?v=39','./assets/fallback-data.js?v=39','./assets/supabase-config.js?v=39','./assets/install.js?v=39',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/app-icon-large.png','./assets/last-trip.jpg'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function save(cache,req,res){if(res?.ok){try{await cache.put(req,res.clone())}catch(_){}}return res}
async function nav(req,event){const cache=await caches.open(CACHE_NAME);const cached=await cache.match(req,{ignoreSearch:true});const net=fetch(req,{cache:'no-store'}).then(r=>save(cache,req,r));if(cached){event.waitUntil(net.catch(()=>{}));return cached}try{return await net}catch(_){return(await cache.match('./index.html'))||Response.error()}}
async function asset(req,event){const cache=await caches.open(CACHE_NAME);const cached=await cache.match(req,{ignoreSearch:true});if(cached)return cached;try{return await save(cache,req,await fetch(req,{cache:'no-store'}))}catch(_){return Response.error()}}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;if(req.mode==='navigate'){event.respondWith(nav(req,event));return}event.respondWith(asset(req,event))});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json()||{}}catch(_){data={title:'البز في الرحلة',body:event.data?.text()||'فيه تحديث جديد',url:'activity.html'}}
  const title=data.title||'البز في الرحلة';
  const options={
    body:data.body||'فيه تحديث جديد',
    icon:'./assets/icons/app-icon-large.png',
    tag:data.id?`kenz-${data.id}`:`kenz-${data.type||'update'}`,
    renotify:false,
    data:{url:data.url||'activity.html'},
    timestamp:Date.now()
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification?.data?.url||'activity.html',self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async list=>{
    for(const client of list){
      try{
        const u=new URL(client.url);
        if(u.origin===new URL(target).origin){
          if('navigate' in client)await client.navigate(target).catch(()=>{});
          return client.focus();
        }
      }catch(_){}
    }
    return self.clients.openWindow?self.clients.openWindow(target):undefined;
  }));
});