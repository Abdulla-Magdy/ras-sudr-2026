(() => {
  if (window.__BAZ_V29_LOADED__) return;
  window.__BAZ_V29_LOADED__ = true;

  const VERSION='V29';
  const UPDATED_AT='23/09/2026 22:12';

  const style=document.createElement('style');
  style.id='v29-style';
  style.textContent=`
    body.v29-ui .v29-location-main{padding-bottom:108px}
    body.v29-ui .v29-location-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;padding:22px 0 12px}
    body.v29-ui .v29-location-intro h1{font-size:clamp(28px,6vw,44px);line-height:1.05;margin:4px 0 5px}
    body.v29-ui .v29-location-intro .subtitle{font-size:13px;margin:0;color:var(--muted)}
    body.v29-ui .v29-active-count{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;padding:8px 11px;border:1px solid rgba(102,230,223,.2);background:rgba(102,230,223,.08);border-radius:999px;font-size:11px;font-weight:900;color:#dffffb}
    body.v29-ui .v29-active-count span{color:#65e8a9;font-size:12px}
    body.v29-ui .v29-live-section{padding-top:4px}
    body.v29-ui .v29-map-shell{position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.10);background:#0b2430;box-shadow:0 18px 45px rgba(0,0,0,.18)}
    body.v29-ui .location-map{height:56dvh;min-height:420px;max-height:650px;border:0!important;border-radius:0!important}
    body.v29-ui .live-people{position:absolute!important;top:10px;right:10px;left:10px;z-index:750!important;display:flex!important;grid-template-columns:none!important;gap:7px!important;margin:0!important;overflow-x:auto;padding:2px 1px 8px;scrollbar-width:none;direction:rtl;pointer-events:none}
    body.v29-ui .live-people::-webkit-scrollbar{display:none}
    body.v29-ui .live-person{flex:0 0 auto;min-width:100px;max-width:148px;padding:7px 10px!important;border-radius:13px!important;background:rgba(5,24,34,.87)!important;backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.14)!important;box-shadow:0 6px 20px rgba(0,0,0,.22);pointer-events:auto;order:0}
    body.v29-ui .live-person.stale{order:1;opacity:.63!important}
    body.v29-ui .live-person strong{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    body.v29-ui .live-person small{font-size:8px!important;margin-top:1px!important;white-space:nowrap}
    body.v29-ui .live-person .live-status{font-size:8px!important;margin-top:2px!important}
    body.v29-ui .v29-location-controls{padding:13px 14px;margin-top:11px;border-radius:18px;background:rgba(15,50,63,.74);box-shadow:none}
    body.v29-ui .v29-control-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
    body.v29-ui .v29-control-head small{font-size:9px;color:var(--muted)}
    body.v29-ui #myLiveStatus{font-size:13px;font-weight:900;margin-top:2px}
    body.v29-ui .location-hero-actions{display:grid!important;grid-template-columns:minmax(105px,125px) 1fr;gap:8px!important;align-items:end!important;margin-top:8px}
    body.v29-ui .location-hero-actions .mini-field{min-width:0!important}
    body.v29-ui .location-hero-actions .mini-field span{font-size:9px}
    body.v29-ui .location-hero-actions #startLive{min-height:45px}
    body.v29-ui .location-hero-actions #stopLive{grid-column:1/-1;min-height:42px}
    body.v29-ui .v23-maps-action{margin:9px 0 0!important;justify-content:stretch!important}
    body.v29-ui .v23-maps-action .btn{width:100%;justify-content:center;background:rgba(102,230,223,.08);border:1px solid rgba(102,230,223,.20);color:#dffffb;box-shadow:none}
    body.v29-ui .v29-background-note{margin-top:9px;border-top:1px solid rgba(255,255,255,.07);padding-top:8px}
    body.v29-ui .v29-background-note summary{cursor:pointer;font-size:9px;color:var(--muted);list-style:none}
    body.v29-ui .v29-background-note summary::-webkit-details-marker{display:none}
    body.v29-ui .v29-background-note .live-warning{font-size:9px;margin-top:7px;line-height:1.6}
    body.v29-ui .v29-admin-destination{margin-top:10px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.025);overflow:hidden}
    body.v29-ui .v29-admin-destination>summary{cursor:pointer;padding:12px 14px;font-size:11px;font-weight:900;list-style:none}
    body.v29-ui .v29-admin-destination>summary::-webkit-details-marker{display:none}
    body.v29-ui .v29-admin-destination>summary:after{content:'⌄';float:left;color:var(--accent)}
    body.v29-ui .v29-admin-destination[open]>summary:after{content:'⌃'}
    body.v29-ui .v29-admin-destination-body{padding:0 10px 10px}
    body.v29-ui #v22DestinationAdmin{margin:0!important;padding:12px!important;border-radius:14px!important;background:rgba(255,255,255,.035)!important;box-shadow:none!important}
    body.v29-ui #v22DestinationAdmin>h3{display:none!important}
    body.v29-ui #v22DestinationAdmin .v22-route-note{font-size:9px!important;line-height:1.55}
    body.v29-ui #v22DestinationAdmin .v22-tools{margin-bottom:0!important}
    body.v29-ui .leaflet-control-zoom{margin-top:78px!important}
    body.v29-ui .v29-version{font-size:9px;opacity:.62;text-align:center;padding:10px 8px 22px}
    body.v29-ui .v29-version-drawer{font-size:9px;opacity:.58;text-align:center;padding:9px 8px 4px}
    @media(max-width:700px){
      body.v29-ui .v29-location-intro{padding:18px 0 10px;align-items:center}
      body.v29-ui .v29-location-intro .eyebrow{display:none}
      body.v29-ui .v29-location-intro .subtitle{font-size:11px}
      body.v29-ui .v29-active-count{font-size:10px;padding:7px 9px}
      body.v29-ui .location-map{height:54dvh;min-height:390px}
      body.v29-ui .live-person{min-width:92px;max-width:130px;padding:6px 9px!important}
      body.v29-ui .location-hero-actions{grid-template-columns:112px 1fr}
    }
  `;
  document.head.appendChild(style);

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const isLocation=()=>location.pathname.endsWith('/location.html')||location.pathname.endsWith('location.html');
  const isAdmin=()=>!!window.TripDB?.isAdmin?.();

  function updateActiveCount(){
    const host=document.getElementById('livePeople');
    const badge=document.getElementById('v29ActiveCount');
    if(!host||!badge)return;
    const live=[...host.querySelectorAll('.live-person')].filter(x=>!x.classList.contains('stale')&&x.querySelector('.live-status.on')).length;
    badge.innerHTML=`<span>●</span> ${live.toLocaleString('ar-EG')} Live`;
  }

  function watchPeople(){
    const host=document.getElementById('livePeople');if(!host)return;
    updateActiveCount();
    if(host.dataset.v29Observed)return;
    host.dataset.v29Observed='1';
    new MutationObserver(()=>updateActiveCount()).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  function moveAdminSettings(){
    const panel=document.getElementById('v22DestinationAdmin');
    const controls=document.getElementById('v29LocationControls');
    if(!controls)return;
    if(!isAdmin()){
      document.getElementById('v29AdminDestination')?.remove();
      panel?.remove();
      return;
    }
    if(!panel)return;
    let details=document.getElementById('v29AdminDestination');
    if(!details){
      details=document.createElement('details');
      details.id='v29AdminDestination';
      details.className='v29-admin-destination';
      details.innerHTML='<summary>⚙️ إعدادات وجهة الرحلة <span style="opacity:.55;font-weight:400">للأدمن فقط</span></summary><div class="v29-admin-destination-body"></div>';
      controls.insertAdjacentElement('afterend',details);
    }
    details.querySelector('.v29-admin-destination-body').appendChild(panel);
  }

  function tidyStatus(){
    const status=document.getElementById('myLiveStatus');
    if(!status)return;
    status.classList.toggle('on',!status.textContent.includes('مش شغال')&&!status.textContent.includes('بنحدد'));
    status.classList.toggle('off',status.textContent.includes('مش شغال'));
  }

  function observeStatus(){
    const status=document.getElementById('myLiveStatus');if(!status||status.dataset.v29Observed)return;
    status.dataset.v29Observed='1';
    tidyStatus();
    new MutationObserver(tidyStatus).observe(status,{childList:true,subtree:true,characterData:true});
  }

  function invalidateMap(){
    try{window.__BAZ_LIVE_MAP__?.invalidateSize?.();}catch(e){}
  }

  function updateVersion(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v27-version,.v28-version,.v29-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer,.v27-version-drawer,.v28-version-drawer,.v29-version-drawer').forEach(x=>x.remove());
    const page=document.createElement('div');page.className='v29-version';page.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    const footer=document.querySelector('.footer');if(footer)footer.insertAdjacentElement('afterend',page);else document.body.appendChild(page);
    const drawerActions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(drawerActions){const d=document.createElement('div');d.className='v29-version-drawer';d.innerHTML=`<strong>${VERSION}</strong> • ${UPDATED_AT}`;drawerActions.insertAdjacentElement('afterend',d);}
  }

  async function apply(){
    document.body.classList.add('v29-ui');
    if(isLocation()){
      watchPeople();
      observeStatus();
      moveAdminSettings();
      invalidateMap();
    }
    updateVersion();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,250));else setTimeout(apply,250);
  [700,1300,2200,3500].forEach(ms=>setTimeout(apply,ms));
})();
