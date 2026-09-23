window.BazAutoUpdate=(()=>{
  let registration=null,reloading=false;
  async function check(){if(!registration)return;try{await registration.update()}catch(e){console.warn('SW update check failed',e)}}
  async function init(){
    if(!('serviceWorker'in navigator))return;
    try{
      registration=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
      await check();
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
      window.addEventListener('pageshow',check);
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
      setInterval(check,30*60*1000);
    }catch(e){console.warn('Auto update init failed',e)}
  }
  return{init,check};
})();
document.addEventListener('DOMContentLoaded',()=>BazAutoUpdate.init());