(() => {
  if (window.__KENZ_HOME_PUSH_CLEANUP__) return;
  window.__KENZ_HOME_PUSH_CLEANUP__ = true;

  const page=()=>location.pathname.split('/').pop()||'index.html';

  async function isPushActive(){
    if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))return false;
    if(Notification.permission!=='granted')return false;
    try{
      const reg=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.ready;
      if(!reg)return false;
      return !!(await reg.pushManager.getSubscription());
    }catch(_){return false}
  }

  async function sync(){
    if(page()!=='index.html')return;
    const host=document.getElementById('n47HomePush');
    if(!host)return;
    const active=await isPushActive();
    host.hidden=active;
    host.style.display=active?'none':'';
    const feed=document.getElementById('n47HomeFeed');
    if(feed)feed.style.marginTop=active?'0':'10px';
  }

  const run=()=>sync().catch(()=>{});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,700),{once:true});
  else setTimeout(run,700);
  window.addEventListener('pageshow',run);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')run()});
  setInterval(run,2500);
})();
