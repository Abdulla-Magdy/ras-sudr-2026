(function loadV41(){
  if(window.__BAZ_V41__||document.querySelector('script[data-v41]'))return;
  const s=document.createElement('script');
  s.src='./assets/v41.js?v=41';
  s.dataset.v41='1';
  s.defer=true;
  document.head.appendChild(s);
})();

(function loadV42(){
  if(window.__BAZ_V42__||document.querySelector('script[data-v42]'))return;
  const s=document.createElement('script');
  s.src='./assets/v42.js?v=42';
  s.dataset.v42='1';
  s.defer=true;
  document.head.appendChild(s);
})();

window.BazAutoUpdate=(()=>{
  let registration=null,reloading=false;
  async function check(){if(!registration)return;try{await registration.update()}catch(e){console.warn('SW update check failed',e)}}
  async function init(){
    if(!('serviceWorker'in navigator))return;
    try{
      registration=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
      window.addEventListener('pageshow',()=>{if(document.visibilityState==='visible')check()});
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
      setTimeout(check,2500);
      setInterval(check,30*60*1000);
    }catch(e){console.warn('Auto update init failed',e)}
  }
  return{init,check};
})();

async function v38SettleAfterCoreInit(){
  for(let i=0;i<120;i++){
    if(document.getElementById('mobileMenuToggle')&&window.BazV38?.refreshCurrent){
      try{await window.BazV38.refreshCurrent('core-ready')}catch(e){console.warn('V38 settle failed',e)}
      return;
    }
    await new Promise(r=>setTimeout(r,50));
  }
}

function startAutoUpdateWhenIdle(){
  const run=()=>BazAutoUpdate.init();
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:1800});
  else setTimeout(run,900);
}

document.addEventListener('DOMContentLoaded',()=>{
  v38SettleAfterCoreInit();
  startAutoUpdateWhenIdle();
});