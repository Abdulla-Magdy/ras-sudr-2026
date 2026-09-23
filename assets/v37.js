(() => {
  if (window.__BAZ_V37_LOADED__) return;
  window.__BAZ_V37_LOADED__ = true;

  const VERSION='V37';
  const UPDATED_AT='24/09/2026 00:14';

  // Keep V36 SPA navigation, but remove every visual page transition.
  // This stops Chromium from rendering an old-page snapshot on top of the new
  // page during navigation (the ghosting visible in the smoke-test video).
  try {
    Object.defineProperty(document,'startViewTransition',{
      value: undefined,
      writable: false,
      configurable: true
    });
  } catch (_) {
    try { document.startViewTransition = undefined; } catch (_) {}
  }

  const style=document.createElement('style');
  style.id='v37-style';
  style.textContent=`
    ::view-transition-old(root),::view-transition-new(root){animation:none!important;opacity:1!important}
    body.v36-shell main.shell{transition:none!important}
    body.v36-shell.v36-soft-fallback main.shell{opacity:1!important}
  `;
  document.head.appendChild(style);

  function updateVersion(){
    document.querySelectorAll('.v36-version').forEach(el=>{
      if((el.textContent||'').includes(VERSION))return;
      el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    });
    document.querySelectorAll('.v36-version-drawer').forEach(el=>{
      if((el.textContent||'').includes(VERSION))return;
      el.textContent=`${VERSION} • ${UPDATED_AT}`;
    });
  }

  updateVersion();
  [300,800,1600].forEach(ms=>setTimeout(updateVersion,ms));
  const observer=new MutationObserver(()=>updateVersion());
  const startObserver=()=>{if(document.body)observer.observe(document.body,{childList:true,subtree:true});};
  if(document.body)startObserver();else document.addEventListener('DOMContentLoaded',startObserver,{once:true});
})();