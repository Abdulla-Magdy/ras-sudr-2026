
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

      // Force a check every time the app opens.
      await check();

      // And whenever the user returns to the app.
      document.addEventListener("visibilitychange",()=>{
        if(document.visibilityState==="visible") check();
      });
      window.addEventListener("pageshow",()=>check());

      // New worker uses skipWaiting(), so when it takes control,
      // reload once to load the new HTML/CSS/JS immediately.
      navigator.serviceWorker.addEventListener("controllerchange",()=>{
        if(reloading) return;
        reloading=true;
        location.reload();
      });

      // Light periodic check while the app stays open.
      setInterval(check, 30 * 60 * 1000);
    }catch(e){
      console.warn("Auto update init failed",e);
    }
  }

  return {init,check};
})();

document.addEventListener("DOMContentLoaded",()=>BazAutoUpdate.init());
