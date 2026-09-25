(() => {
  if(window.__KENZ_APP_VERSION_BADGE__)return;
  window.__KENZ_APP_VERSION_BADGE__=true;
  const V=window.KENZ_APP_VERSION||'V51';
  const T=window.KENZ_APP_UPDATED_AT||'25/09/2026 03:35';
  const style=document.createElement('style');
  style.textContent=`.v38-version,.v42-version,.v44-version,.v45-version,.v38-version-drawer,.v42-version-drawer,.v44-version-drawer,.v45-version-drawer{display:none!important}.kenz-current-version{font-size:9px;opacity:.58;text-align:center;padding:7px 8px 92px}.kenz-current-version-drawer{font-size:9px;opacity:.52;text-align:center;padding:8px 8px 4px}@media(min-width:761px){.kenz-current-version{padding-bottom:18px}}`;
  document.head.appendChild(style);
  function stamp(){
    const footer=document.querySelector('.v38-footer,.footer');
    if(footer){
      let d=document.querySelector('.kenz-current-version');
      if(!d){d=document.createElement('div');d.className='kenz-current-version';footer.insertAdjacentElement('afterend',d)}
      d.innerHTML=`<strong>${V}</strong> • آخر تحديث ${T}`;
    }
    const actions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){
      let d=document.querySelector('.kenz-current-version-drawer');
      if(!d){d=document.createElement('div');d.className='kenz-current-version-drawer';actions.insertAdjacentElement('afterend',d)}
      d.textContent=`${V} • ${T}`;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stamp,{once:true});else stamp();
  setInterval(stamp,1200);
})();
