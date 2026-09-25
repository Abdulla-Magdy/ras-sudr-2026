window.KENZ_APP_VERSION='V51';
window.KENZ_APP_UPDATED_AT='25/09/2026 03:35';

(function loadVersionBadge(){
  if(window.__KENZ_APP_VERSION_BADGE__||document.querySelector('script[data-app-version]'))return;
  const s=document.createElement('script');
  s.src='./assets/app-version.js?v=51';
  s.dataset.appVersion='1';
  s.defer=true;
  document.head.appendChild(s);
})();

(function loadV41(){
  if(window.__BAZ_V41__||document.querySelector('script[data-v41]'))return;
  const s=document.createElement('script');s.src='./assets/v41.js?v=41';s.dataset.v41='1';s.defer=true;document.head.appendChild(s);
})();
(function loadV42(){
  if(window.__BAZ_V42__||document.querySelector('script[data-v42]'))return;
  const s=document.createElement('script');s.src='./assets/v42.js?v=43';s.dataset.v42='1';s.defer=true;document.head.appendChild(s);
})();
(function loadV44(){
  if(window.__BAZ_V44__||document.querySelector('script[data-v44]'))return;
  const s=document.createElement('script');s.src='./assets/v44.js?v=49';s.dataset.v44='1';s.defer=true;document.head.appendChild(s);
})();
(function loadSprint2(){
  if(window.__KENZ_SPRINT2__||document.querySelector('script[data-sprint2]'))return;
  const s=document.createElement('script');s.src='./assets/sprint2.js?v=46';s.dataset.sprint2='1';s.defer=true;document.head.appendChild(s);
})();
(function loadNotifications(){
  if(window.__KENZ_NOTIFICATIONS__||document.querySelector('script[data-notifications]'))return;
  const s=document.createElement('script');s.src='./assets/notifications.js?v=51';s.dataset.notifications='1';s.defer=true;document.head.appendChild(s);
})();
(function loadGames(){
  if(window.__KENZ_GAMES__||document.querySelector('script[data-games]'))return;
  const s=document.createElement('script');s.src='./assets/games.js?v=48';s.dataset.games='1';s.defer=true;document.head.appendChild(s);
})();
(function loadAdminNotify(){
  if(window.__KENZ_ADMIN_NOTIFY__||document.querySelector('script[data-admin-notify]'))return;
  const s=document.createElement('script');s.src='./assets/admin-notify.js?v=51';s.dataset.adminNotify='1';s.defer=true;document.head.appendChild(s);
})();
(function loadV51Runtime(){
  if(window.__KENZ_V51_RUNTIME__||document.querySelector('script[data-v51-runtime]'))return;
  const s=document.createElement('script');s.src='./assets/v51-runtime.js?v=51';s.dataset.v51Runtime='1';s.defer=true;document.head.appendChild(s);
})();

window.BazAutoUpdate=(()=>{
  let registration=null,reloading=false;
  async function check(){if(!registration)return;try{await registration.update()}catch(e){console.warn('SW update check failed',e)}}
  async function init(){
    if(!('serviceWorker'in navigator))return;
    try{
      registration=await navigator.serviceWorker.register('./service-worker.js?v=51',{updateViaCache:'none'});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
      window.addEventListener('pageshow',()=>{if(document.visibilityState==='visible')check()});
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
      setTimeout(check,1200);
      setInterval(check,20*60*1000);
    }catch(e){console.warn('Auto update init failed',e)}
  }
  return{init,check};
})();

async function v38SettleAfterCoreInit(){
  for(let i=0;i<120;i++){
    if(document.getElementById('mobileMenuToggle')&&window.BazV38?.refreshCurrent){
      try{await window.BazV38.refreshCurrent('core-ready')}catch(e){console.warn('V38 settle failed',e)}
      try{await window.KenzSprint2?.hydrate?.()}catch(e){console.warn('Sprint2 settle failed',e)}
      try{await window.KenzNotifications?.hydrate?.()}catch(e){console.warn('Notifications settle failed',e)}
      try{await window.KenzGames?.hydrate?.()}catch(e){console.warn('Games settle failed',e)}
      try{await window.KenzAdminNotify?.mount?.()}catch(e){console.warn('Admin notify settle failed',e)}
      return;
    }
    await new Promise(r=>setTimeout(r,50));
  }
}

function startAutoUpdateWhenIdle(){
  const run=()=>BazAutoUpdate.init();
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:900});
  else setTimeout(run,350);
}

document.addEventListener('DOMContentLoaded',()=>{
  v38SettleAfterCoreInit();
  startAutoUpdateWhenIdle();
});
