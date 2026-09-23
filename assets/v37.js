(() => {
  if (window.__BAZ_V37_LOADED__) return;
  window.__BAZ_V37_LOADED__ = true;

  const VERSION='V37';
  const UPDATED_AT='24/09/2026 00:14';

  // V36 SPA navigation is kept, but page-to-page visual transitions are removed.
  // This prevents Chromium from showing a snapshot of the old page on top of the
  // new page during navigation (the ghosting visible in the recorded smoke test).
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
    /* No cross-fade, no old/new page snapshots, no fallback fade. */
    ::view-transition-old(root),::view-transition-new(root){animation:none!important;opacity:1!important}
    body.v36-shell main.shell{transition:none!important}
    body.v36-shell.v36-soft-fallback main.shell{opacity:1!important}
  `;
  document.head.appendChild(style);

  function updateVersion(){
    document.querySelectorAll('.v36-version').forEach(el=>{
      el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    });
    document.querySelectorAll('.v36-version-drawer').forEach(el=>{
      el.textContent=`${VERSION} • ${UPDATED_AT}`;
    });
  }

  updateVersion();
  [400,1000,2200].forEach(ms=>setTimeout(updateVersion,ms));
})();