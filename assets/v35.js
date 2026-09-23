(() => {
  if(window.__BAZ_V35_LOADED__) return;
  window.__BAZ_V35_LOADED__=true;
  const VERSION='V35', UPDATED_AT='23/09/2026 23:20';

  function version(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v27-version,.v28-version,.v29-version,.v30-version,.v31-version,.v32-version,.v33-version,.v34-version,.v21-version-drawer,.v22-version-drawer,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer,.v27-version-drawer,.v28-version-drawer,.v29-version-drawer,.v30-version-drawer,.v31-version-drawer,.v32-version-drawer,.v33-version-drawer,.v34-version-drawer,.v35-version,.v35-version-drawer').forEach(x=>x.remove());
    const f=document.querySelector('.footer');if(f){const d=document.createElement('div');d.className='v35-version';d.style.cssText='font-size:9px;opacity:.52;text-align:center;padding:7px 8px 92px';d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;f.insertAdjacentElement('afterend',d)}
    const a=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');if(a){const d=document.createElement('div');d.className='v35-version-drawer';d.style.cssText='font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px';d.textContent=`${VERSION} • ${UPDATED_AT}`;a.insertAdjacentElement('afterend',d)}
  }

  function cleanup(){
    const page=(location.pathname.split('/').pop()||'index.html').replace('.html','');
    const root=document.documentElement;
    if(page==='index'&&document.getElementById('v25HomeDashboard')) document.getElementById('v35HomeShell')?.remove();
    if(page==='expenses'&&document.getElementById('v28PersonalSummary')){document.getElementById('v35ExpenseShell')?.remove();root.classList.remove('baz-pre-expenses');}
    if(page==='bag'&&document.getElementById('v27BagTabs')){document.querySelector('.v35-bag-toggle')?.remove();root.classList.remove('baz-pre-bag');}
    if(document.getElementById('v26BottomNav')||document.getElementById('v25BottomNav')) document.getElementById('v35PreBottomNav')?.remove();
    version();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanup,{once:true});else cleanup();
  [250,700,1500,2800].forEach(ms=>setTimeout(cleanup,ms));
})();
