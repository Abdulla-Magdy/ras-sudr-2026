(() => {
  if (window.__BAZ_V32_LOADED__) return;
  window.__BAZ_V32_LOADED__ = true;

  const VERSION='V32';
  const UPDATED_AT='23/09/2026 22:12';
  const page=(location.pathname.split('/').pop()||'index.html').replace('.html','');

  const style=document.createElement('style');
  style.id='v32-style';
  style.textContent=`
    :root{
      --v32-bg:#071822;
      --v32-surface:rgba(255,255,255,.042);
      --v32-surface-strong:rgba(255,255,255,.065);
      --v32-line:rgba(255,255,255,.085);
      --v32-line-strong:rgba(255,255,255,.13);
      --v32-text:#f7fbff;
      --v32-muted:rgba(247,251,255,.62);
      --v32-aqua:#73e7e1;
      --v32-purple:#9277ef;
      --v32-green:#93e7a3;
      --v32-amber:#ffd17c;
      --v32-red:#ff9a8d;
      --v32-radius:16px;
      --v32-radius-sm:12px;
      --v32-bottom-space:96px;
    }

    html{scroll-behavior:smooth;background:var(--v32-bg)}
    body.v32-ui{
      color:var(--v32-text);
      -webkit-font-smoothing:antialiased;
      text-rendering:optimizeLegibility;
      overflow-x:hidden;
    }
    body.v32-ui main.shell{padding-bottom:20px}
    body.v32-ui .shell{width:min(1040px,calc(100% - 28px))}
    body.v32-ui .section{padding:6px 0 12px}
    body.v32-ui .section-title{gap:10px;margin-bottom:9px;align-items:center}
    body.v32-ui .section-title h2{font-size:19px;line-height:1.25;margin:0}
    body.v32-ui h1,body.v32-ui h2,body.v32-ui h3{letter-spacing:-.015em}
    body.v32-ui .muted,body.v32-ui small{line-height:1.55}

    /* Header */
    body.v32-ui .topbar{
      background:rgba(4,17,25,.94)!important;
      border-bottom:1px solid rgba(255,255,255,.075)!important;
      backdrop-filter:blur(20px) saturate(130%);
      -webkit-backdrop-filter:blur(20px) saturate(130%);
    }
    body.v32-ui .nav{min-height:66px!important}
    body.v32-ui .brand-logo{box-shadow:0 5px 16px rgba(0,0,0,.18)}
    body.v32-ui #userBar .member-chip{border-color:rgba(115,231,225,.18)!important;background:rgba(115,231,225,.055)!important}
    body.v32-ui #mobileMenuToggle{border-color:rgba(255,255,255,.12)!important;background:rgba(255,255,255,.035)!important}

    /* Surfaces */
    body.v32-ui .card,
    body.v32-ui .v25-panel,
    body.v32-ui .v25-kpi,
    body.v32-ui .v31-crew-row,
    body.v32-ui .v30-collapsible,
    body.v32-ui .v31-admin-details{
      background:var(--v32-surface)!important;
      border-color:var(--v32-line)!important;
      box-shadow:none!important;
    }
    body.v32-ui .card{border-radius:var(--v32-radius)!important;padding:14px!important}
    body.v32-ui .notice{border-radius:13px!important;padding:11px 12px!important;font-size:11px!important;line-height:1.65!important}

    /* Buttons */
    body.v32-ui .btn,
    body.v32-ui button:not(.leaflet-control-zoom-in):not(.leaflet-control-zoom-out){
      transition:transform .12s ease,background .12s ease,border-color .12s ease,opacity .12s ease;
    }
    body.v32-ui .btn{min-height:42px!important;border-radius:12px!important;padding:9px 13px!important;font-weight:850!important;box-shadow:none!important}
    body.v32-ui .btn:active,
    body.v32-ui .v25-bottom-nav a:active,
    body.v32-ui .v25-bottom-nav button:active{transform:scale(.975)}
    body.v32-ui .btn.secondary{background:rgba(255,255,255,.055)!important;border-color:rgba(255,255,255,.11)!important}
    body.v32-ui .btn.danger{background:rgba(255,112,96,.095)!important;border-color:rgba(255,112,96,.18)!important;color:#ffd0ca!important}
    body.v32-ui .compact{min-height:36px!important;padding:7px 10px!important}

    /* Inputs */
    body.v32-ui input:not([type=checkbox]):not([type=radio]),
    body.v32-ui select,
    body.v32-ui textarea{
      min-height:44px;
      border-radius:12px!important;
      border-color:rgba(255,255,255,.105)!important;
      background:rgba(0,0,0,.16)!important;
      box-shadow:none!important;
    }
    body.v32-ui textarea{min-height:82px}
    body.v32-ui input:focus,body.v32-ui select:focus,body.v32-ui textarea:focus{
      outline:none!important;
      border-color:rgba(115,231,225,.45)!important;
      box-shadow:0 0 0 3px rgba(115,231,225,.08)!important;
    }
    body.v32-ui :focus-visible{outline:2px solid rgba(115,231,225,.72);outline-offset:2px}

    /* Pills / status */
    body.v32-ui .pill,body.v32-ui .status,body.v32-ui .food-owner-badge,
    body.v32-ui .v21-chip,body.v32-ui .v31-status,body.v32-ui .v22-idea-status{
      border-radius:999px!important;
    }

    /* Details */
    body.v32-ui details>summary{min-height:42px;display:flex;align-items:center}
    body.v32-ui details>summary:active{opacity:.82}

    /* Bottom nav */
    body.v32-ui .v25-bottom-nav{
      left:12px!important;right:12px!important;
      bottom:max(10px,env(safe-area-inset-bottom))!important;
      height:66px!important;
      border-radius:21px!important;
      background:rgba(5,20,29,.965)!important;
      border-color:rgba(255,255,255,.115)!important;
      box-shadow:0 16px 40px rgba(0,0,0,.32)!important;
      padding:5px!important;
    }
    body.v32-ui .v25-bottom-nav a,body.v32-ui .v25-bottom-nav button{border-radius:15px!important;font-size:9px!important}
    body.v32-ui .v25-bottom-nav .active{background:linear-gradient(135deg,rgba(115,231,225,.13),rgba(146,119,239,.15))!important}
    body.v32-ui .v25-bottom-nav .ico{font-size:19px!important}

    /* Drawer */
    body.v32-ui #mobileMenuDrawer{background:#061b27!important}
    body.v32-ui #mobileMenuDrawer .mobile-drawer-links a{min-height:43px!important}
    body.v32-ui .v31-drawer-section-label{padding-top:13px!important}
    body.v32-ui #mobileMenuDrawer .mobile-drawer-actions{border-top:1px solid rgba(255,255,255,.07);margin-top:8px;padding-top:10px}

    /* Page hero */
    body.v32-ui .hero{padding-block:22px 12px!important}
    body.v32-ui .hero .eyebrow{display:none!important}
    body.v32-ui .hero h1{font-size:clamp(27px,7vw,42px)!important;line-height:1.12!important;margin:0 0 5px!important}
    body.v32-ui .hero .subtitle{font-size:12.5px!important;line-height:1.7!important;color:var(--v32-muted)!important}

    /* Home */
    body.v32-page-index .v25-home-dashboard{gap:10px!important}
    body.v32-page-index .v25-kpi-grid{gap:7px!important}
    body.v32-page-index .v25-kpi{min-height:82px!important;padding:10px!important}
    body.v32-page-index .v25-panel{padding:13px!important}
    body.v32-page-index .v25-task{padding:9px!important}
    body.v32-page-index .v25-quick-actions{gap:7px!important}
    body.v32-page-index .v25-quick-actions a{padding:10px 7px!important}

    /* Shopping */
    body.v32-page-shopping .v25-shopping-filters{top:66px!important;padding-top:5px!important}
    body.v32-page-shopping #foodBody{gap:7px!important}
    body.v32-page-shopping .food-item-card{scroll-margin-top:138px}
    body.v32-page-shopping .food-item-name{font-size:14px!important}
    body.v32-page-shopping .food-responsibility-action{gap:6px!important}

    /* Bag */
    body.v32-page-bag .v27-bag-row{padding-block:11px!important}
    body.v32-page-bag .v27-bag-status{font-size:9px!important}

    /* Accounts */
    body.v32-page-expenses .v28-money-summary{gap:7px!important}
    body.v32-page-expenses .expense-log-card{padding:13px!important;border-radius:15px!important}
    body.v32-page-expenses .v22-expense-actions{gap:7px!important;margin-top:10px!important}

    /* Responsibilities / Crew / Ideas */
    body.v32-page-responsibilities .v30-person{padding:10px 0!important}
    body.v32-page-crew .v31-crew-row{padding:11px 12px!important}
    body.v32-page-ideas .v30-idea-card{padding:13px!important}
    body.v32-page-ideas .v30-roadmap-scroll{grid-auto-columns:minmax(205px,72vw)!important}

    /* Live */
    body.v32-page-location .location-map{border-radius:18px!important;border-color:rgba(255,255,255,.11)!important}
    body.v32-page-location .live-person{border-radius:13px!important}

    /* Empty states */
    body.v32-ui .empty-finance,body.v32-ui .v25-empty,body.v32-ui .empty-state{
      border:1px dashed rgba(255,255,255,.09)!important;
      background:rgba(255,255,255,.018)!important;
      border-radius:14px!important;
      padding:16px!important;
      text-align:center!important;
      color:var(--v32-muted)!important;
    }

    /* Footer and tutorial */
    body.v32-ui .footer{font-size:10px!important;opacity:.42!important;padding:18px 0 6px!important}
    body.v32-ui #tutorialFab,body.v32-ui .tutorial-fab{bottom:calc(var(--v32-bottom-space) + env(safe-area-inset-bottom))!important}
    .v32-version{font-size:9px;opacity:.52;text-align:center;padding:7px 8px 92px}
    .v32-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}

    /* Tap/scroll polish */
    body.v32-ui a,body.v32-ui button{-webkit-tap-highlight-color:transparent}
    body.v32-ui *{scrollbar-color:rgba(255,255,255,.13) transparent}
    body.v32-ui ::-webkit-scrollbar{width:7px;height:7px}
    body.v32-ui ::-webkit-scrollbar-track{background:transparent}
    body.v32-ui ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:999px}

    @media(max-width:760px){
      body.v32-ui{padding-bottom:82px!important}
      body.v32-ui .shell{width:min(100% - 24px,1040px)!important}
      body.v32-ui .section{padding-bottom:10px!important}
      body.v32-ui .card{padding:13px!important}
      body.v32-ui .section-title h2{font-size:18px!important}
      body.v32-ui .topbar .nav{min-height:64px!important}
      body.v32-ui .brand span{font-size:13px!important}
      body.v32-ui .brand-logo{width:39px!important;height:39px!important}
      body.v32-ui #userBar .member-chip{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    }

    @media(min-width:761px){
      body.v32-ui .v32-version{padding-bottom:18px}
    }

    @media(prefers-reduced-motion:reduce){
      html{scroll-behavior:auto!important}
      body.v32-ui *,body.v32-ui *:before,body.v32-ui *:after{animation:none!important;transition:none!important}
    }
  `;
  document.head.appendChild(style);

  function applyPageClass(){
    document.body.classList.add('v32-ui',`v32-page-${page}`);
  }

  function normalizeFooter(){
    document.querySelectorAll('.footer').forEach(f=>{f.textContent='البز في الرحلة • 2026';});
  }

  function collapseHomeActivity(){
    if(page!=='index')return;
    const headings=[...document.querySelectorAll('h2,h3')];
    const h=headings.find(x=>x.textContent.includes('آخر تعديلات الأشقياء'));
    if(!h)return;
    const section=h.closest('.section');
    if(!section||section.dataset.v32collapsed)return;
    section.dataset.v32collapsed='1';
    const content=[...section.children];
    const det=document.createElement('details');
    det.className='v30-collapsible v32-home-activity';
    det.innerHTML='<summary><span>🕘 آخر تعديلات الأشقياء</span><small class="muted">عرض</small></summary><div class="v30-collapsible-body"></div>';
    const body=det.querySelector('.v30-collapsible-body');
    content.forEach(el=>body.appendChild(el));
    section.appendChild(det);
  }

  function normalizeVersion(){
    document.querySelectorAll('[class*="version"]').forEach(el=>{
      if(el.classList.contains('v32-version')||el.classList.contains('v32-version-drawer'))return;
      if(/\bV(?:2[1-9]|3[01])\b/.test(el.textContent||''))el.remove();
    });
    const footer=document.querySelector('.footer');
    if(footer&&!document.querySelector('.v32-version')){
      const d=document.createElement('div');d.className='v32-version';d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;footer.insertAdjacentElement('afterend',d);
    }
    const actions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions&&!document.querySelector('.v32-version-drawer')){
      const d=document.createElement('div');d.className='v32-version-drawer';d.textContent=`${VERSION} • ${UPDATED_AT}`;actions.insertAdjacentElement('afterend',d);
    }
  }

  function polishAria(){
    document.querySelectorAll('button').forEach(b=>{
      if(!b.getAttribute('type')&&!b.closest('form'))b.type='button';
    });
    document.querySelectorAll('details>summary').forEach(s=>s.setAttribute('role','button'));
  }

  function apply(){
    applyPageClass();
    normalizeFooter();
    collapseHomeActivity();
    polishAria();
    normalizeVersion();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,180));
  else setTimeout(apply,180);
  [700,1500,2600].forEach(ms=>setTimeout(apply,ms));
})();