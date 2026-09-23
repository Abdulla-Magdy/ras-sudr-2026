// Shared feature layers V21 -> V32 + V34 + V35.
(function loadFeatureLayers(){
  const versions=[21,22,23,24,25,26,27,28,29,30,31,32,34,35];
  versions.forEach(v=>{
    const flag=`__BAZ_V${v}_LOADED__`;
    if(window[flag] || document.querySelector(`script[data-v${v}]`)) return;
    const s=document.createElement('script');
    s.src=`./assets/v${v}.js?v=${v}`;
    s.dataset[`v${v}`]='1';
    s.async=false;
    document.head.appendChild(s);
  });
})();

(function suppressLegacyVersionLabels(){
  const s=document.createElement('style');
  s.textContent='.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v27-version,.v28-version,.v29-version,.v30-version,.v31-version,.v32-version,.v33-version,.v34-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer,.v27-version-drawer,.v28-version-drawer,.v29-version-drawer,.v30-version-drawer,.v31-version-drawer,.v32-version-drawer,.v33-version-drawer,.v34-version-drawer{display:none!important}';
  document.head.appendChild(s);
})();

window.BazAutoUpdate = (() => {
  let registration=null,reloading=false;
  async function check(){if(!registration)return;try{await registration.update()}catch(e){console.warn('SW update check failed',e)}}
  async function init(){
    if(!('serviceWorker' in navigator))return;
    try{
      registration=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
      await check();
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
      window.addEventListener('pageshow',()=>check());
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
      setInterval(check,30*60*1000);
    }catch(e){console.warn('Auto update init failed',e)}
  }
  return {init,check};
})();
document.addEventListener('DOMContentLoaded',()=>BazAutoUpdate.init());