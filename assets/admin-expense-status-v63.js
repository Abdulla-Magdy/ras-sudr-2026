(() => {
  if(window.__KENZ_ADMIN_EXPENSE_STATUS_V63__)return;
  window.__KENZ_ADMIN_EXPENSE_STATUS_V63__=true;
  const s=document.createElement('style');s.textContent='.ae60-status.cancelled{background:rgba(160,170,180,.12);color:#c8d0d6}';document.head.appendChild(s);
  function patch(){document.querySelectorAll('.ae60-status.cancelled').forEach(x=>{if(x.textContent!=='↩️ ملغي')x.textContent='↩️ ملغي'});document.querySelectorAll('.ea52-status.cancelled').forEach(x=>{if(x.textContent!=='↩️ ملغي')x.textContent='↩️ ملغي'})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
  new MutationObserver(patch).observe(document.documentElement,{childList:true,subtree:true});
})();