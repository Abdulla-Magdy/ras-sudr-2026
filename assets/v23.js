(() => {
  if (window.__BAZ_V23_LOADED__) return;
  window.__BAZ_V23_LOADED__ = true;

  const VERSION='V23';
  const UPDATED_AT='23/09/2026 17:58';

  const style=document.createElement('style');
  style.id='v23-style';
  style.textContent=`
    .food-responsibility-action{display:flex!important;gap:8px!important;flex-wrap:wrap!important;align-items:center!important;margin-top:9px!important}
    .food-responsibility-action .btn{position:static!important;inset:auto!important;transform:none!important;margin:0!important;width:auto!important}
    .v22-expense-actions{position:static!important;display:flex!important;gap:10px!important;flex-wrap:wrap!important;align-items:center!important;margin-top:14px!important}
    .v22-expense-actions .btn,.v22-expense-actions .expense-del{position:static!important;inset:auto!important;transform:none!important;float:none!important;margin:0!important;width:auto!important}
    .v23-maps-action{display:flex;justify-content:center;margin:10px 0 4px}
    .v23-maps-action .btn{display:inline-flex;text-decoration:none}
    #v22OpenMaps{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;z-index:auto!important}
    .v23-version{font-size:10px;opacity:.7;text-align:center;padding:12px 8px 20px}
    .v23-version-drawer{font-size:10px;opacity:.65;text-align:center;padding:10px 8px 4px}
  `;
  document.head.appendChild(style);

  function moveMapsButton(){
    const status=document.getElementById('myLiveStatus');
    const link=document.getElementById('v22OpenMaps');
    if(!status||!link) return;
    let wrap=document.getElementById('v23MapsAction');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='v23MapsAction';
      wrap.className='v23-maps-action';
      status.insertAdjacentElement('afterend',wrap);
    }
    wrap.appendChild(link);
  }

  function cleanVersions(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v23-version-drawer').forEach(x=>x.remove());
    const page=document.createElement('div');
    page.className='v23-version';
    page.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    const footer=document.querySelector('.footer');
    if(footer) footer.insertAdjacentElement('afterend',page); else document.body.appendChild(page);

    const drawerActions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(drawerActions){
      const d=document.createElement('div');
      d.className='v23-version-drawer';
      d.innerHTML=`<strong>${VERSION}</strong> • ${UPDATED_AT}`;
      drawerActions.insertAdjacentElement('afterend',d);
    }
  }

  function tidyActions(){
    document.querySelectorAll('.v22-expense-actions').forEach(w=>{
      w.style.display='flex';
      w.style.gap='10px';
      w.style.flexWrap='wrap';
      w.querySelectorAll('button').forEach(b=>{
        b.style.position='static';
        b.style.transform='none';
        b.style.margin='0';
      });
    });
    document.querySelectorAll('.food-responsibility-action').forEach(w=>{
      w.style.display='flex';w.style.gap='8px';w.style.flexWrap='wrap';
    });
  }

  function apply(){
    moveMapsButton();
    tidyActions();
    cleanVersions();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,500));
  else setTimeout(apply,500);

  [900,1600,2600].forEach(ms=>setTimeout(apply,ms));
})();
