(() => {
  if(window.__KENZ_V51_RUNTIME__)return;
  window.__KENZ_V51_RUNTIME__=true;
  const page=()=>location.pathname.split('/').pop()||'index.html';

  async function localPushActive(){
    try{
      if(!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window))return false;
      if(Notification.permission!=='granted')return false;
      const reg=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.ready;
      if(!reg)return false;
      return !!(await reg.pushManager.getSubscription());
    }catch(_){return false}
  }

  async function cleanHomePush(){
    if(page()!=='index.html')return;
    const host=document.getElementById('n47HomePush');
    if(!host)return;
    const active=await localPushActive();
    host.hidden=active;
    host.style.display=active?'none':'';
    const feed=document.getElementById('n47HomeFeed');
    if(feed)feed.style.marginTop=active?'0':'10px';
  }

  function ensureAdminNotify(){
    // admin-notify.js stays mounted and polls its own page.
    return;
    if(page()!=='admin-announcements.html')return;
    if(!window.TripDB?.isAdmin?.())return;
    if(document.getElementById('adminPushBox'))return;
    // admin-notify.js owns the actual UI; re-run it on SPA navigation by reloading only when needed.
    const old=document.querySelector('script[data-admin-notify-v51]');
    if(old)return;
    window.__KENZ_ADMIN_NOTIFY__=false;
    const s=document.createElement('script');
    s.src='./assets/admin-notify.js?v=51';
    s.dataset.adminNotifyV51='1';
    s.onload=()=>s.remove();
    document.head.appendChild(s);
  }

  async function tick(){
    await cleanHomePush();
    ensureAdminNotify();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,400),{once:true});
  else setTimeout(tick,400);
  window.addEventListener('pageshow',tick);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick()});
  setInterval(tick,1200);
})();
