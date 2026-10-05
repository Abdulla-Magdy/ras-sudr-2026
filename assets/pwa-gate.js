(() => {
  const ua=navigator.userAgent||'';
  const isMobile=/Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(navigator.maxTouchPoints>1&&/Macintosh/i.test(ua));
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const pathname=location.pathname.toLowerCase();
  const file=pathname.split('/').pop()||'';
  const onLogin=file==='login.html';
  window.BAZ_PWA_GATE={isMobile,isStandalone};

  // On mobile browsers, every route (including the site root) must go through
  // the install-only login gate. Installed PWA sessions are allowed through.
  if(isMobile&&!isStandalone&&!onLogin){
    const base=location.pathname.replace(/[^/]*$/,'');
    location.replace(base+'login.html?install=1&v=68');
    return;
  }

  const root=document.documentElement;
  root.classList.toggle('mobile-browser-gated',isMobile&&!isStandalone);
  root.classList.toggle('installed-pwa',isStandalone);

  if(!document.querySelector('script[data-kenz-maintenance]')){
    const base=location.pathname.replace(/[^/]*$/,'');
    const s=document.createElement('script');
    s.src=base+'assets/maintenance.js?v=65';
    s.dataset.kenzMaintenance='1';
    document.head.appendChild(s);
  }
})();