(() => {
  const ua=navigator.userAgent||'';
  const isMobile=/Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(navigator.maxTouchPoints>1&&/Macintosh/i.test(ua));
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const pathname=location.pathname.toLowerCase();
  const file=pathname.split('/').pop()||'';
  const onLogin=file==='login.html';
  const gateLanding=onLogin||pathname.endsWith('/');
  window.BAZ_PWA_GATE={isMobile,isStandalone};
  if(isMobile&&!isStandalone&&!gateLanding){
    const base=location.pathname.replace(/[^/]*$/,'');
    location.replace(base+'login.html?install=1');
    return;
  }
  const root=document.documentElement;
  root.classList.toggle('mobile-browser-gated',isMobile&&!isStandalone);
  root.classList.toggle('installed-pwa',isStandalone);
})();