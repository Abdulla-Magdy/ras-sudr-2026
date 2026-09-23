// Shared feature layers V21 -> V31.
(function loadFeatureLayers(){
  const versions=[21,22,23,24,25,26,27,28,29,30,31];
  const loadAt=(idx)=>{
    if(idx>=versions.length) return;
    const v=versions[idx], flag=`__BAZ_V${v}_LOADED__`;
    if(window[flag]){ loadAt(idx+1); return; }
    const existing=document.querySelector(`script[data-v${v}]`);
    if(existing){
      if(window[flag]) loadAt(idx+1);
      else existing.addEventListener('load',()=>loadAt(idx+1),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=`./assets/v${v}.js?v=${v}`;
    s.dataset[`v${v}`]='1';
    s.async=false;
    s.onload=()=>loadAt(idx+1);
    document.head.appendChild(s);
  };
  loadAt(0);
})();

(function suppressLegacyVersionLabels(){
  const s=document.createElement('style');
  s.textContent='.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v27-version,.v28-version,.v29-version,.v30-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer,.v27-version-drawer,.v28-version-drawer,.v29-version-drawer,.v30-version-drawer{display:none!important}';
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