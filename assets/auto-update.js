
// Shared feature layers.
(function loadFeatureLayers(){
  function loadV25(){
    if(window.__BAZ_V25_LOADED__ || document.querySelector('script[data-v25]')) return;
    const s=document.createElement('script');
    s.src='./assets/v25.js?v=25';
    s.dataset.v25='1';
    s.async=false;
    document.head.appendChild(s);
  }

  function loadV24(){
    if(window.__BAZ_V24_LOADED__){ loadV25(); return; }
    const existing=document.querySelector('script[data-v24]');
    if(existing){ existing.addEventListener('load',loadV25,{once:true}); return; }
    const s=document.createElement('script');
    s.src='./assets/v24.js?v=24';
    s.dataset.v24='1';
    s.async=false;
    s.onload=loadV25;
    document.head.appendChild(s);
  }

  function loadV23(){
    if(window.__BAZ_V23_LOADED__){ loadV24(); return; }
    const existing=document.querySelector('script[data-v23]');
    if(existing){ existing.addEventListener('load',loadV24,{once:true}); return; }
    const s=document.createElement('script');
    s.src='./assets/v23.js?v=23';
    s.dataset.v23='1';
    s.async=false;
    s.onload=loadV24;
    document.head.appendChild(s);
  }

  function loadV22(){
    if(window.__BAZ_V22_LOADED__){ loadV23(); return; }
    const existing=document.querySelector('script[data-v22]');
    if(existing){ existing.addEventListener('load',loadV23,{once:true}); return; }
    const s=document.createElement('script');
    s.src='./assets/v22.js?v=22';
    s.dataset.v22='1';
    s.async=false;
    s.onload=loadV23;
    document.head.appendChild(s);
  }

  if(window.__BAZ_V21_LOADED__){ loadV22(); return; }
  const existingV21=document.querySelector('script[data-v21]');
  if(existingV21){ existingV21.addEventListener('load',loadV22,{once:true}); return; }

  const s=document.createElement('script');
  s.src='./assets/v21.js?v=21';
  s.dataset.v21='1';
  s.async=false;
  s.onload=loadV22;
  document.head.appendChild(s);
})();

// Once V25 is active, never show version labels injected later by older compatibility layers.
(function suppressLegacyVersionLabels(){
  const s=document.createElement('style');
  s.textContent='body.v25-ui .v21-version,body.v25-ui .v22-version,body.v25-ui .v23-version,body.v25-ui .v24-version,body.v25-ui .v23-version-drawer,body.v25-ui .v24-version-drawer{display:none!important}';
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
