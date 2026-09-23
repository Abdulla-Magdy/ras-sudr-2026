(() => {
  if (window.__BAZ_V34_LOADED__) return;
  window.__BAZ_V34_LOADED__ = true;

  const VERSION='V34';
  const UPDATED_AT='23/09/2026 23:20';
  const pages=['index.html','shopping.html','meals.html','my-tasks.html','expenses.html','bag.html','crew.html','responsibilities.html','location.html','ideas.html'];

  const style=document.createElement('style');
  style.id='v34-style';
  style.textContent=`
    .v34-version{font-size:9px;opacity:.52;text-align:center;padding:7px 8px 92px}
    .v34-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}
  `;
  document.head.appendChild(style);

  function normalizeVersion(){
    document.querySelectorAll('.v32-version,.v33-version,.v32-version-drawer,.v33-version-drawer,.v31-version,.v31-version-drawer').forEach(x=>x.remove());
    const footer=document.querySelector('.footer');
    if(footer&&!document.querySelector('.v34-version')){
      const d=document.createElement('div');d.className='v34-version';d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;footer.insertAdjacentElement('afterend',d);
    }
    const actions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions&&!document.querySelector('.v34-version-drawer')){
      const d=document.createElement('div');d.className='v34-version-drawer';d.textContent=`${VERSION} • ${UPDATED_AT}`;actions.insertAdjacentElement('afterend',d);
    }
  }

  function warmPage(href){
    try{fetch(href,{method:'GET',cache:'force-cache',credentials:'same-origin'}).catch(()=>{});}catch(_){}
  }

  function prefetchMainPages(){
    const run=()=>pages.forEach((p,i)=>setTimeout(()=>warmPage(`./${p}`),i*70));
    if('requestIdleCallback' in window) requestIdleCallback(run,{timeout:1200}); else setTimeout(run,500);
  }

  function armTouchPrefetch(){
    const handler=e=>{
      const a=e.target.closest?.('a[href]'); if(!a)return;
      const u=new URL(a.href,location.href);
      if(u.origin!==location.origin)return;
      if(!/\.html(?:$|[?#])/.test(u.href) && u.pathname!==location.pathname)return;
      warmPage(u.href);
    };
    document.addEventListener('pointerdown',handler,{passive:true,capture:true});
  }

  function finish(){
    normalizeVersion();
    try{sessionStorage.setItem('baz-ui-warm','1')}catch(_){}
    window.BAZ_UI_BOOT?.reveal?.();
    armTouchPrefetch();
    prefetchMainPages();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(()=>requestAnimationFrame(finish)),{once:true});
  else requestAnimationFrame(()=>requestAnimationFrame(finish));
})();
