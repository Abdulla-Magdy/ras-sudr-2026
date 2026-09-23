(() => {
  if (window.__BAZ_V36_LOADED__) return;
  window.__BAZ_V36_LOADED__ = true;

  const VERSION = 'V36';
  const UPDATED_AT = '23/09/2026 23:45';
  const ROUTES = new Set([
    'index.html','shopping.html','meals.html','my-tasks.html','responsibilities.html',
    'expenses.html','crew.html','ideas.html','bag.html','location.html'
  ]);
  const ROUTE_LAYERS = {
    'index.html':[25,26],
    'shopping.html':[21,22,23,26],
    'meals.html':[26],
    'my-tasks.html':[26],
    'responsibilities.html':[21,30],
    'expenses.html':[21,22,23,24,28],
    'crew.html':[31],
    'ideas.html':[21,22,30],
    'bag.html':[27],
    'location.html':[21,22,23,29]
  };

  let navigating = false;
  let navSeq = 0;
  const htmlCache = new Map();
  const scrollPositions = new Map();
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const style = document.createElement('style');
  style.id = 'v36-style';
  style.textContent = `
    :root{--v36-bg:#071822;--v36-line:rgba(255,255,255,.10);--v36-muted:rgba(247,251,255,.62);--v36-aqua:#73e7e1}
    html{background:var(--v36-bg)}
    body.v36-shell{overflow-x:hidden}
    body.v36-shell #v25BottomNav,body.v36-shell #v26BottomNav,body.v36-shell #v35PreBottomNav{display:none!important}
    #v36BottomNav{display:none;position:fixed;z-index:13000;left:12px;right:12px;bottom:max(10px,env(safe-area-inset-bottom));height:66px;background:rgba(5,20,29,.97);border:1px solid rgba(255,255,255,.115);border-radius:21px;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 16px 40px rgba(0,0,0,.32);padding:5px}
    #v36BottomNav a,#v36BottomNav button{flex:1;min-width:0;border:0;background:transparent;color:var(--v36-muted);text-decoration:none;border-radius:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:800;font-size:9px;-webkit-tap-highlight-color:transparent}
    #v36BottomNav .ico{font-size:19px;line-height:1}#v36BottomNav .active{background:linear-gradient(135deg,rgba(115,231,225,.13),rgba(146,119,239,.15));color:#fff}
    #v36BottomNav a:active,#v36BottomNav button:active{transform:scale(.97)}
    .v36-version{font-size:9px;opacity:.52;text-align:center;padding:7px 8px 92px}.v36-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}
    body.v36-shell.v36-soft-fallback main.shell{opacity:.01}
    body.v36-shell main.shell{transition:opacity .10s ease}
    ::view-transition-old(root),::view-transition-new(root){animation-duration:.13s;animation-timing-function:ease-out}
    @media(max-width:760px){#v36BottomNav{display:flex}body.v36-shell{padding-bottom:82px!important}}
    @media(min-width:761px){.v36-version{padding-bottom:18px}}
    @media(prefers-reduced-motion:reduce){body.v36-shell main.shell{transition:none}::view-transition-old(root),::view-transition-new(root){animation:none}}
  `;
  document.head.appendChild(style);

  function routeFile(input = location.href){
    const u = input instanceof URL ? input : new URL(input, location.href);
    let f = u.pathname.split('/').pop() || 'index.html';
    if (!f || f === '/') f = 'index.html';
    if (f === 'food.html') f = 'shopping.html';
    return ROUTES.has(f) ? f : null;
  }

  function routeKey(input = location.href){
    const u = input instanceof URL ? input : new URL(input, location.href);
    return `${u.pathname}${u.search}${u.hash}`;
  }

  function isInternalRoute(anchor){
    if (!anchor || !anchor.href || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
    const raw = anchor.getAttribute('href') || '';
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) return false;
    const u = new URL(anchor.href, location.href);
    return u.origin === location.origin && !!routeFile(u);
  }

  async function waitForApp(){
    for (let i=0;i<100;i++){
      if (window.TripDB?.getMember?.() && window.renderFood && document.body) return true;
      await sleep(50);
    }
    return false;
  }

  function cleanPageClasses(){
    const explicit = [
      'v25-food-page','v26-shopping-page','v26-meals-page','v26-my-page','v27-bag-page',
      'v28-expenses-page','v29-location-page','v30-responsibilities-page','v30-ideas-page'
    ];
    explicit.forEach(c=>document.body.classList.remove(c));
    [...document.body.classList].forEach(c=>{if(/^v32-page-/.test(c))document.body.classList.remove(c)});
  }

  function applyPageClass(file){
    const page = file.replace('.html','').replace('my-tasks','my-tasks');
    document.body.classList.add('v32-ui',`v32-page-${page}`,'v36-shell');
  }

  function updateActiveNav(file){
    document.querySelectorAll('[data-page]').forEach(a=>{
      let f = a.dataset.page || '';
      if (f === 'food.html') f = 'shopping.html';
      a.classList.toggle('active',f===file);
    });
    document.querySelectorAll('#v36BottomNav a[data-route]').forEach(a=>a.classList.toggle('active',a.dataset.route===file));
  }

  function buildBottomNav(){
    let nav = document.getElementById('v36BottomNav');
    if (!nav){
      nav = document.createElement('nav');
      nav.id = 'v36BottomNav';
      nav.innerHTML = `
        <a href="index.html" data-route="index.html"><span class="ico">🏠</span><span>الرئيسية</span></a>
        <a href="shopping.html" data-route="shopping.html"><span class="ico">🛒</span><span>المشتريات</span></a>
        <a href="expenses.html" data-route="expenses.html"><span class="ico">💰</span><span>الحسابات</span></a>
        <a href="bag.html" data-route="bag.html"><span class="ico">🎒</span><span>شنطتي</span></a>
        <button type="button" id="v36More"><span class="ico">•••</span><span>المزيد</span></button>`;
      document.body.appendChild(nav);
      nav.querySelector('#v36More').onclick=()=>document.getElementById('mobileMenuToggle')?.click();
    }
    updateActiveNav(routeFile() || 'index.html');
  }

  function rebuildDrawer(){
    const host = document.querySelector('#mobileMenuDrawer .mobile-drawer-links');
    if (!host) return;
    const file = routeFile() || 'index.html';
    const items = [
      ['index.html','🏠','الرئيسية','الرحلة'],
      ['shopping.html','🛒','المشتريات','الرحلة'],
      ['meals.html','🍽️','خطة الأكل','الرحلة'],
      ['my-tasks.html','✅','عليّا إيه؟','الرحلة'],
      ['expenses.html','💰','الحسابات','الرحلة'],
      ['bag.html','🎒','شنطتي','الرحلة'],
      ['crew.html','😎','الأشقياء','المجموعة'],
      ['responsibilities.html','📋','مين عليه إيه؟','المجموعة'],
      ['location.html','📍','Live Location','المجموعة'],
      ['ideas.html','💡','الاقتراحات','المجموعة']
    ];
    let group='';let out='';
    for(const [href,ico,label,g] of items){
      if(g!==group){group=g;out+=`<div class="v31-drawer-section-label">${g}</div>`}
      out+=`<a href="${href}" data-page="${href}" class="${file===href?'active':''}"><span class="nav-icon">${ico}</span><span class="nav-label">${label}</span></a>`;
    }
    if(window.TripDB?.isAdmin?.()) out+=`<div class="v31-drawer-section-label">الإدارة</div><a href="crew.html#adminPanel" class="v31-admin-menu"><span class="nav-icon">👑</span><span class="nav-label">إدارة الرحلة</span></a>`;
    host.innerHTML=out;
  }

  function version(){
    document.querySelectorAll('[class*="version"]').forEach(el=>{
      if(el.classList.contains('v36-version')||el.classList.contains('v36-version-drawer'))return;
      if(/\bV(?:2[1-9]|3[0-5])\b/.test(el.textContent||''))el.remove();
    });
    document.querySelectorAll('.v36-version,.v36-version-drawer').forEach(x=>x.remove());
    const footer=document.querySelector('.footer');
    if(footer){
      footer.textContent='البز في الرحلة • 2026';
      const d=document.createElement('div');d.className='v36-version';d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;footer.insertAdjacentElement('afterend',d);
    }
    const actions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){const d=document.createElement('div');d.className='v36-version-drawer';d.textContent=`${VERSION} • ${UPDATED_AT}`;actions.insertAdjacentElement('afterend',d)}
  }

  async function ensureLocationAssets(){
    if (window.L) return;
    if(!document.querySelector('link[data-v36-leaflet]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.crossOrigin='';l.dataset.v36Leaflet='1';document.head.appendChild(l);
    }
    await new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-v36-leaflet]');
      if(existing){if(window.L)return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.crossOrigin='';s.dataset.v36Leaflet='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    }).catch(()=>{});
  }

  async function fetchTemplate(url){
    const u = url instanceof URL ? url : new URL(url,location.href);
    const file = routeFile(u);
    if(!file) throw new Error('Unsupported route');
    const cacheKey = new URL(file,location.href).pathname;
    if(htmlCache.has(cacheKey)) return htmlCache.get(cacheKey);
    const p = fetch(cacheKey,{credentials:'same-origin'}).then(async r=>{
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const text=await r.text();const doc=new DOMParser().parseFromString(text,'text/html');const main=doc.querySelector('main.shell');
      if(!main)throw new Error('Missing main shell');
      return {file,title:doc.title||document.title,html:main.outerHTML};
    }).catch(e=>{htmlCache.delete(cacheKey);throw e});
    htmlCache.set(cacheKey,p);return p;
  }

  function prefetch(url){fetchTemplate(url).catch(()=>{});}

  async function callMaybe(name){
    const fn=window[name];if(typeof fn!=='function')return;
    try{return await fn()}catch(e){console.warn(`[V36] ${name}`,e)}
  }

  async function renderBaseRoute(){
    const initNames=[];
    if(document.getElementById('foodBody')) initNames.push('foodAddInit');
    if(document.getElementById('expenseList')) initNames.push('expenseInit');
    if(document.getElementById('ideaList')||document.getElementById('ideasList')) initNames.push('ideasInit');
    if(document.getElementById('bagList')) initNames.push('privateBagInit');
    for(const n of initNames) await callMaybe(n);

    const renderNames=['renderHomeMeals','renderCrew','renderMeals','renderFood','renderResponsibilities','renderFoodResponsibilities','renderExpenses','renderRecentChanges','renderAdminPanel','renderParticipantCount'];
    await Promise.allSettled(renderNames.map(n=>callMaybe(n)));
  }

  function clearLayerArtifacts(v){
    document.querySelectorAll(`#v${v}-style`).forEach(x=>x.remove());
    document.querySelectorAll(`script[data-v36-rerun="${v}"]`).forEach(x=>x.remove());
    window[`__BAZ_V${v}_LOADED__`]=false;
  }

  function rerunLayer(v){
    clearLayerArtifacts(v);
    return new Promise(resolve=>{
      const s=document.createElement('script');s.src=`./assets/v${v}.js?v=${v}`;s.async=false;s.dataset.v36Rerun=String(v);s.onload=()=>resolve();s.onerror=()=>resolve();document.head.appendChild(s);
    });
  }

  async function runEnhancers(file){
    if(file==='location.html') await ensureLocationAssets();
    const layers=ROUTE_LAYERS[file]||[];
    for(const v of layers) await rerunLayer(v);
    await sleep(file==='location.html'?260:170);
    cleanPageClasses();
    applyPageClass(file);
    buildBottomNav();
    rebuildDrawer();
    version();
  }

  async function settleRoute(file){
    await renderBaseRoute();
    await runEnhancers(file);
  }

  function closeDrawer(){
    document.getElementById('mobileMenuDrawer')?.classList.remove('open');
    document.getElementById('mobileMenuBackdrop')?.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  async function swapTo(target,{push=true,restoreScroll=false}={}){
    const u=target instanceof URL?target:new URL(target,location.href);
    const file=routeFile(u);if(!file)return;
    if(navigating)return;
    navigating=true;
    const seq=++navSeq;
    scrollPositions.set(routeKey(),window.scrollY);
    closeDrawer();
    try{
      const template=await fetchTemplate(u);
      if(seq!==navSeq)return;
      const doSwap=async()=>{
        if(push) history.pushState({bazSpa:true},'',u.pathname+u.search+u.hash);
        cleanPageClasses();
        const holder=document.createElement('div');holder.innerHTML=template.html;
        const next=holder.firstElementChild;
        const current=document.querySelector('main.shell');
        if(!current||!next)throw new Error('Shell swap failed');
        current.replaceWith(next);
        document.title=template.title;
        applyPageClass(file);
        updateActiveNav(file);
        await settleRoute(file);
      };

      if(document.startViewTransition){
        const vt=document.startViewTransition(doSwap);
        await vt.updateCallbackDone.catch(()=>{});
        await vt.finished.catch(()=>{});
      }else{
        document.body.classList.add('v36-soft-fallback');
        await doSwap();
        requestAnimationFrame(()=>document.body.classList.remove('v36-soft-fallback'));
      }

      const saved=scrollPositions.get(routeKey(u));
      if(restoreScroll&&Number.isFinite(saved)) window.scrollTo(0,saved); else window.scrollTo(0,0);
      if(u.hash){setTimeout(()=>document.querySelector(u.hash)?.scrollIntoView({behavior:'smooth',block:'start'}),30)}
    }catch(e){
      console.error('[V36] SPA navigation failed',e);
      location.href=u.href;
    }finally{navigating=false;}
  }

  function interceptNavigation(){
    document.addEventListener('click',e=>{
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      const a=e.target.closest('a[href]');if(!isInternalRoute(a))return;
      const u=new URL(a.href,location.href);
      if(u.pathname===location.pathname&&u.search===location.search&&u.hash&&u.hash!==location.hash)return;
      e.preventDefault();swapTo(u,{push:true});
    },true);
    document.addEventListener('pointerdown',e=>{const a=e.target.closest?.('a[href]');if(isInternalRoute(a))prefetch(a.href)},{capture:true,passive:true});
    window.addEventListener('popstate',()=>swapTo(new URL(location.href),{push:false,restoreScroll:true}));
  }

  function warmRoutes(){
    const work=()=>ROUTES.forEach(f=>prefetch(new URL(f,location.href)));
    if('requestIdleCallback'in window)requestIdleCallback(work,{timeout:1800});else setTimeout(work,700);
  }

  async function revealColdStart(){
    const file=routeFile()||'index.html';
    cleanPageClasses();applyPageClass(file);buildBottomNav();rebuildDrawer();version();
    document.documentElement.classList.remove('baz-v35-pre','baz-cold-start');
    window.BAZ_COLD_START_REVEAL?.();
    document.documentElement.classList.add('baz-ui-ready');
  }

  async function init(){
    if(!(await waitForApp())){window.BAZ_COLD_START_REVEAL?.();return;}
    document.body.classList.add('v36-shell');
    history.replaceState({...history.state,bazSpa:true},'',location.href);
    buildBottomNav();rebuildDrawer();interceptNavigation();warmRoutes();
    await sleep(140);
    await revealColdStart();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else init();
})();