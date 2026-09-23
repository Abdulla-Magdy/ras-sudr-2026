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

  // Prevent the legacy/base HTML from flashing before the V25+ UI layers finish.
  // This script runs in <head>, so the cover is present before the first paint.
  if (!onLogin) {
    const root=document.documentElement;
    root.classList.add('baz-ui-booting');
    const style=document.createElement('style');
    style.id='baz-ui-boot-style';
    style.textContent=`
      html.baz-ui-booting{background:#071822!important;overflow:hidden}
      html.baz-ui-booting body{visibility:hidden!important}
      html.baz-ui-booting::before{
        content:'البز في الرحلة';position:fixed;inset:0;z-index:2147483646;
        display:flex;align-items:center;justify-content:center;padding-bottom:34px;
        background:linear-gradient(180deg,#06151f,#082634);color:#f7fbff;
        font:900 20px/1.4 system-ui,-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;
        letter-spacing:-.02em
      }
      html.baz-ui-booting::after{
        content:'';position:fixed;z-index:2147483647;left:50%;top:calc(50% + 25px);
        width:24px;height:24px;margin-left:-12px;border-radius:50%;
        border:3px solid rgba(255,255,255,.14);border-top-color:#73e7e1;
        animation:bazBootSpin .75s linear infinite
      }
      @keyframes bazBootSpin{to{transform:rotate(360deg)}}
      html.baz-ui-ready body{animation:bazUiIn .16s ease-out both}
      @keyframes bazUiIn{from{opacity:.86}to{opacity:1}}
      @media(prefers-reduced-motion:reduce){html.baz-ui-booting::after{animation:none}html.baz-ui-ready body{animation:none}}
    `;
    document.head.appendChild(style);

    let revealed=false;
    const reveal=()=>{
      if(revealed)return; revealed=true;
      root.classList.remove('baz-ui-booting');
      root.classList.add('baz-ui-ready');
      setTimeout(()=>document.getElementById('baz-ui-boot-style')?.remove(),350);
    };
    window.BAZ_UI_BOOT={reveal};
    // Safety valve: never leave the app hidden if a later enhancement fails.
    setTimeout(reveal,6000);
  }
})();
