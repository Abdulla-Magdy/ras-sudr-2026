(() => {
  const ua = navigator.userAgent || "";
  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const path = location.pathname.toLowerCase();
  const onLogin = path.endsWith("/login.html") || path.endsWith("/");

  window.BAZ_PWA_GATE = { isMobile, isStandalone };

  if (isMobile && !isStandalone && !onLogin) {
    const base = location.pathname.replace(/[^/]*$/, "");
    location.replace(base + "login.html?install=1");
    return;
  }

  document.documentElement.classList.toggle("mobile-browser-gated", isMobile && !isStandalone);
  document.documentElement.classList.toggle("installed-pwa", isStandalone);

  // V34: no full-screen loader between app pages. Keep the previous page visible
  // until the next document is ready when Chromium supports cross-document transitions.
  const navStyle=document.createElement('style');
  navStyle.id='baz-nav-style';
  navStyle.textContent=`
    @view-transition{navigation:auto}
    ::view-transition-old(root){animation:120ms ease-out both bazOld}
    ::view-transition-new(root){animation:150ms ease-out both bazNew}
    @keyframes bazOld{to{opacity:.88}}
    @keyframes bazNew{from{opacity:.92}to{opacity:1}}
    @media(prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation:none}}
  `;
  document.head.appendChild(navStyle);

  // Warm the UI layer downloads as early as possible. auto-update.js still executes
  // them in strict order, but the network fetches can happen in parallel.
  if (!onLogin) {
    [21,22,23,24,25,26,27,28,29,30,31,32,34].forEach(v=>{
      const l=document.createElement('link');
      l.rel='preload'; l.as='script'; l.href=`./assets/v${v}.js?v=${v}`;
      document.head.appendChild(l);
    });
  }

  // Only on a genuinely cold app start, suppress the legacy first paint without
  // showing a spinner or a blocking loading screen. This flag survives all page
  // changes in the same app session, so navigation itself is never covered.
  let cold=false;
  try{cold=!onLogin && sessionStorage.getItem('baz-ui-warm')!=='1';}catch(_){cold=false;}
  if(cold){
    const root=document.documentElement;
    root.classList.add('baz-cold-start');
    const s=document.createElement('style');
    s.id='baz-cold-style';
    s.textContent='html.baz-cold-start{background:#071822}html.baz-cold-start body{opacity:0!important}';
    document.head.appendChild(s);
    let done=false;
    window.BAZ_UI_BOOT={reveal(){
      if(done)return;done=true;
      try{sessionStorage.setItem('baz-ui-warm','1')}catch(_){}
      root.classList.remove('baz-cold-start');
      requestAnimationFrame(()=>document.getElementById('baz-cold-style')?.remove());
    }};
    setTimeout(()=>window.BAZ_UI_BOOT?.reveal?.(),1800);
  } else {
    window.BAZ_UI_BOOT={reveal(){try{sessionStorage.setItem('baz-ui-warm','1')}catch(_){}}};
  }
})();
