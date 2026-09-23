(() => {
  if (window.__BAZ_V33_LOADED__) return;
  window.__BAZ_V33_LOADED__ = true;

  const VERSION='V33';
  const UPDATED_AT='23/09/2026 22:55';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function normalizeVersion(){
    document.querySelectorAll('.v32-version,.v32-version-drawer,.v31-version,.v31-version-drawer').forEach(x=>x.remove());
    const footer=document.querySelector('.footer');
    if(footer&&!document.querySelector('.v33-version')){
      const d=document.createElement('div');
      d.className='v33-version';
      d.style.cssText='font-size:9px;opacity:.52;text-align:center;padding:7px 8px 92px';
      d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
      footer.insertAdjacentElement('afterend',d);
    }
    const actions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions&&!document.querySelector('.v33-version-drawer')){
      const d=document.createElement('div');
      d.className='v33-version-drawer';
      d.style.cssText='font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px';
      d.textContent=`${VERSION} • ${UPDATED_AT}`;
      actions.insertAdjacentElement('afterend',d);
    }
  }

  function pageReady(){
    const page=(location.pathname.split('/').pop()||'index.html').replace('.html','');
    if(page==='login') return true;
    if(!document.body?.classList.contains('v32-ui')) return false;
    if(page==='index') return !!document.getElementById('v25HomeDashboard');
    if(page==='shopping'||page==='food') return !!document.getElementById('foodBody');
    if(page==='expenses') return !!document.getElementById('expenseList');
    if(page==='bag') return !!document.getElementById('bagList');
    if(page==='location') return !!document.getElementById('liveMap');
    return true;
  }

  async function finishBoot(){
    for(let i=0;i<36;i++){
      if(pageReady()) break;
      await sleep(100);
    }
    await sleep(180);
    normalizeVersion();
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.BAZ_UI_BOOT?.reveal?.()));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',finishBoot,{once:true});
  else finishBoot();
})();
