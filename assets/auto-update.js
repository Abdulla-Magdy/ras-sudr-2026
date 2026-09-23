
// Shared feature layers. V21 stays as the base feature pack; V22 adds smoke-test fixes.
(function loadFeatureLayers(){
  function loadV22(){
    if(window.__BAZ_V22_LOADED__ || document.querySelector('script[data-v22]')) return;
    const s=document.createElement('script');
    s.src='./assets/v22.js?v=22';
    s.dataset.v22='1';
    s.async=false;
    document.head.appendChild(s);
  }

  const existingV21=document.querySelector('script[data-v21]');
  if(existingV21){
    if(existingV21.dataset.loaded==='1') loadV22();
    else existingV21.addEventListener('load',loadV22,{once:true});
    return;
  }

  const s=document.createElement('script');
  s.src='./assets/v21.js?v=21';
  s.dataset.v21='1';
  s.async=false;
  s.onload=()=>{s.dataset.loaded='1';loadV22();};
  document.head.appendChild(s);
})();

window.BazAutoUpdate = (() => {
  let registration=null;
  let reloading=false;

  async function check(){
    if(!registration) return;
    try{ await registration.update(); }catch(e){ console.warn("SW update check failed",e); }
  }

  async function init(){
    if(!("serviceWorker" in navigator)) return;

    try{
      registration=await navigator.serviceWorker.register("./service-worker.js",{
        updateViaCache:"none"
      });

      await check();

      document.addEventListener("visibilitychange",()=>{
        if(document.visibilityState==="visible") check();
      });
      window.addEventListener("pageshow",()=>check());

      navigator.serviceWorker.addEventListener("controllerchange",()=>{
        if(reloading) return;
        reloading=true;
        location.reload();
      });

      setInterval(check, 30 * 60 * 1000);
    }catch(e){
      console.warn("Auto update init failed",e);
    }
  }

  return {init,check};
})();

document.addEventListener("DOMContentLoaded",()=>BazAutoUpdate.init());
