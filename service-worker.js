const CACHE_NAME='ras-sudr-baz-v54';
const CORE=[
  './','./index.html','./login.html','./shopping.html','./meals.html','./my-tasks.html','./responsibilities.html','./expenses.html','./admin-expenses.html','./crew.html','./ideas.html','./bag.html','./location.html','./transport.html','./activity.html','./games.html','./manifest.webmanifest?v=52',
  './trip.html','./account.html','./settings.html','./admin.html','./admin-members.html','./admin-games.html','./admin-announcements.html','./assets/information-architecture.js?v=54','./assets/information-architecture.css?v=54','./assets/style.css?v=20','./assets/v38.css?v=38','./assets/app.js?v=54','./assets/v38.js?v=39','./assets/v41.js?v=41','./assets/v42.js?v=43','./assets/v44.js?v=49','./assets/sprint2.js?v=54','./assets/notifications.js?v=54','./assets/games.js?v=54','./assets/admin-notify.js?v=54','./assets/admin-notify.css?v=51','./assets/app-version.js?v=52','./assets/v51-runtime.js?v=54','./assets/expense-approval.js?v=54','./assets/tutorial.js?v=39','./assets/auto-update.js?v=54','./assets/pwa-gate.js?v=38','./assets/db.js?v=39','./assets/fallback-data.js?v=39','./assets/supabase-config.js?v=39','./assets/install.js?v=39',
  './assets/icons/icon-192.png?v=51','./assets/icons/icon-512.png?v=51','./assets/icons/apple-touch-icon.png?v=51','./assets/icons/app-icon-large.png?v=51','./assets/last-trip.jpg'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>Promise.allSettled(CORE.map(async url=>{
    try{const r=await fetch(url,{cache:'reload'});if(r.ok)await cache.put(url,r.clone())}catch(_){}
  }))));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

async function save(cache,req,res){if(res?.ok){try{await cache.put(req,res.clone())}catch(_){}}return res}

async function networkFirst(req,fallback){
  const cache=await caches.open(CACHE_NAME);
  try{return await save(cache,req,await fetch(req,{cache:'no-store'}))}
  catch(_){return (await cache.match(req))||(fallback?await cache.match(fallback):null)||Response.error()}
}

async function cacheFirst(req){
  const cache=await caches.open(CACHE_NAME);
  const hit=await cache.match(req);
  if(hit)return hit;
  try{return await save(cache,req,await fetch(req,{cache:'no-store'}))}catch(_){return Response.error()}
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,'./index.html'));return}
  const fresh=/\.(?:js|css|webmanifest|json)$/i.test(url.pathname)||url.pathname.includes('/assets/icons/');
  event.respondWith(fresh?networkFirst(req):cacheFirst(req));
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json()||{}}catch(_){data={title:'البز في الرحلة',body:event.data?.text()||'فيه تحديث جديد',url:'activity.html'}}
  const title=data.title||'البز في الرحلة';
  const options={
    body:data.body||'فيه تحديث جديد',
    icon:'./assets/icons/app-icon-large.png?v=51',
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
