(() => {
  if (window.__BAZ_V27_LOADED__) return;
  window.__BAZ_V27_LOADED__ = true;

  const VERSION='V27';
  const UPDATED_AT='23/09/2026 19:45';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let bagFilter=localStorage.getItem('v27BagFilter')||'pending';
  let bagTimer=null;

  const style=document.createElement('style');
  style.id='v27-style';
  style.textContent=`
    body.v27-ui{--v27-line:rgba(255,255,255,.075);--v27-card:rgba(255,255,255,.032);--v27-muted:rgba(247,251,255,.58);--v27-aqua:#67e3dc;--v27-green:#91e6a0;--v27-amber:#ffc86b}
    .v27-bag-page .hero{padding:20px 0 9px}.v27-bag-page .hero .eyebrow{display:none}.v27-bag-page .hero h1{text-align:right;font-size:30px;margin:0 0 5px}.v27-bag-page .hero .subtitle{text-align:right;font-size:11px}.v27-bag-page .privacy-badge{margin-top:9px;padding:8px 10px;border-radius:12px;font-size:9px;background:rgba(103,227,220,.06);border:1px solid rgba(103,227,220,.12)}
    .v27-bag-page .bag-kpis{grid-template-columns:repeat(3,1fr);gap:6px}.v27-bag-page .bag-kpi{padding:10px;border-radius:13px;min-height:70px}.v27-bag-page .bag-kpi span{font-size:8px}.v27-bag-page .bag-kpi strong{font-size:18px;margin-top:5px}.v27-bag-page .bag-kpi.accent{display:none}.v27-bag-page .bag-progress{margin-top:7px;height:7px}
    .v27-bag-page .bag-add-card{padding:0;background:transparent;border:0}.v27-bag-page .bag-add-card>.section-title{display:none}.v27-bag-add-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--v27-line);background:rgba(255,255,255,.035);color:#fff;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer}.v27-bag-add-toggle span:last-child{font-size:20px;color:var(--v27-aqua)}.v27-bag-add-content{display:none;margin-top:8px;padding:12px;border:1px solid var(--v27-line);border-radius:14px;background:rgba(255,255,255,.025)}.v27-bag-add-content.open{display:block}.v27-bag-page .bag-add-grid{gap:7px}.v27-bag-page .bag-add-grid .mini-field span{font-size:8px}.v27-bag-page .bag-add-grid .text-input,.v27-bag-page .bag-add-grid .select-input{padding:9px 10px;font-size:11px}.v27-bag-page .bag-add-btn{min-height:38px!important}.v27-bag-page .quick-pack{margin-top:10px;display:flex;gap:6px;flex-wrap:wrap}.v27-bag-page .quick-pack .muted{width:100%;font-size:9px}.v27-bag-page .quick-pack button{padding:7px 9px;border-radius:999px;font-size:9px}
    .v27-bag-page #bagList{display:grid;gap:9px}.v27-bag-page .bag-group{margin:0;background:rgba(255,255,255,.025);border:1px solid var(--v27-line);border-radius:14px;padding:10px 11px}.v27-bag-page .bag-group-title{margin:0 0 5px;padding:0 1px}.v27-bag-page .bag-group-title strong{font-size:12px}.v27-bag-page .bag-group-title small{font-size:9px;color:var(--v27-muted)}.v27-bag-page .bag-items{display:grid;gap:0}.v27-bag-page .bag-item{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px 0!important;margin:0!important;background:transparent!important;border:0!important;border-bottom:1px solid var(--v27-line)!important;border-radius:0!important}.v27-bag-page .bag-item:last-child{border-bottom:0!important}.v27-bag-page .bag-item-body strong{font-size:12px}.v27-bag-page .bag-item-meta{font-size:8px!important;color:var(--v27-muted)}.v27-bag-page .bag-check{width:34px!important;height:34px!important;border-radius:11px!important}.v27-bag-page .bag-delete{width:30px;height:30px;font-size:18px;opacity:.65}.v27-bag-page .bag-item.packed .bag-item-body strong{text-decoration:none;opacity:.75}.v27-bag-status{display:inline-flex;align-items:center;gap:4px;margin-top:4px;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:800}.v27-bag-status.pending{background:rgba(255,200,107,.09);color:#ffd89a;border:1px solid rgba(255,200,107,.14)}.v27-bag-status.done{background:rgba(145,230,160,.09);color:#bdf4c7;border:1px solid rgba(145,230,160,.14)}
    .v27-bag-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 0 10px}.v27-bag-tabs::-webkit-scrollbar{display:none}.v27-bag-tab{border:1px solid var(--v27-line);background:rgba(255,255,255,.035);color:var(--v27-muted);border-radius:999px;padding:8px 11px;white-space:nowrap;font-size:9px;font-weight:800}.v27-bag-tab.active{background:rgba(103,227,220,.12);border-color:rgba(103,227,220,.22);color:#fff}.v27-bag-tab b{margin-inline-start:4px;color:var(--v27-aqua)}
    .v27-bag-page .section-title:has(#bagOwnerLabel){align-items:center}.v27-bag-page .section-title:has(#bagOwnerLabel) h2{font-size:18px}.v27-bag-page #bagOwnerLabel{font-size:8px}
    .v27-version{font-size:9px;opacity:.55;text-align:center;padding:10px 8px 16px}.v27-version-drawer{font-size:9px;opacity:.55;text-align:center;padding:8px}
    @media(max-width:760px){.v27-bag-page .bag-kpis{grid-template-columns:repeat(3,1fr)}.v27-bag-page .bag-item{grid-template-columns:36px minmax(0,1fr) 28px}}
  `;
  document.head.appendChild(style);

  function path(){return location.pathname.split('/').pop()||'index.html';}

  async function waitForApp(){
    for(let i=0;i<100;i++){
      if(window.TripDB?.getMember?.()) return true;
      await sleep(100);
    }
    return false;
  }

  function updateVersion(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v27-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer,.v27-version-drawer').forEach(x=>x.remove());
    const el=document.createElement('div');el.className='v27-version';el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    const footer=document.querySelector('.footer');if(footer)footer.insertAdjacentElement('afterend',el);else document.body.appendChild(el);
    const actions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){const d=document.createElement('div');d.className='v27-version-drawer';d.textContent=`${VERSION} • ${UPDATED_AT}`;actions.insertAdjacentElement('afterend',d);}
  }

  function fixPendingBagCopy(root=document){
    root.querySelectorAll('small,.muted,.v26-task-row small,.v25-task small').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(t==='لسه في شنطتك') el.textContent='لسه مش في الشنطة';
    });
  }

  function ensureBagAddCollapse(){
    const card=document.querySelector('.bag-add-card');if(!card||card.dataset.v27)return;
    card.dataset.v27='1';
    const grid=card.querySelector('.bag-add-grid');const quick=card.querySelector('.quick-pack');
    if(!grid&&!quick)return;
    const toggle=document.createElement('button');toggle.type='button';toggle.className='v27-bag-add-toggle';toggle.innerHTML='<span>＋ إضافة حاجة لشنطتي</span><span>⌄</span>';
    const content=document.createElement('div');content.className='v27-bag-add-content';
    if(grid)content.appendChild(grid);if(quick)content.appendChild(quick);
    card.append(toggle,content);
    toggle.onclick=()=>{const open=content.classList.toggle('open');toggle.querySelector('span:last-child').textContent=open?'⌃':'⌄';};
  }

  function ensureBagTabs(){
    const list=document.getElementById('bagList');if(!list)return null;
    let tabs=document.getElementById('v27BagTabs');
    if(!tabs){
      tabs=document.createElement('div');tabs.id='v27BagTabs';tabs.className='v27-bag-tabs';
      list.insertAdjacentElement('beforebegin',tabs);
      tabs.onclick=e=>{const b=e.target.closest('[data-bag-filter]');if(!b)return;bagFilter=b.dataset.bagFilter;localStorage.setItem('v27BagFilter',bagFilter);applyBagView();};
    }
    return tabs;
  }

  function decorateBagItems(){
    const list=document.getElementById('bagList');if(!list)return;
    list.querySelectorAll('.bag-item').forEach(item=>{
      const packed=item.classList.contains('packed') || item.querySelector('.bag-check')?.dataset.packed==='true';
      let status=item.querySelector('.v27-bag-status');
      if(!status){status=document.createElement('span');status.className='v27-bag-status';item.querySelector('.bag-item-body')?.appendChild(status);}
      status.className=`v27-bag-status ${packed?'done':'pending'}`;
      status.textContent=packed?'✓ موجود في الشنطة':'○ لسه مش في الشنطة';
      item.dataset.v27Packed=packed?'1':'0';
    });
  }

  function applyBagView(){
    const list=document.getElementById('bagList');if(!list)return;
    decorateBagItems();
    const items=[...list.querySelectorAll('.bag-item')];
    const packed=items.filter(x=>x.dataset.v27Packed==='1').length;
    const pending=items.length-packed;
    const tabs=ensureBagTabs();
    if(tabs){
      tabs.innerHTML=`<button class="v27-bag-tab ${bagFilter==='pending'?'active':''}" data-bag-filter="pending">لسه ناقص <b>${pending}</b></button><button class="v27-bag-tab ${bagFilter==='done'?'active':''}" data-bag-filter="done">في الشنطة <b>${packed}</b></button><button class="v27-bag-tab ${bagFilter==='all'?'active':''}" data-bag-filter="all">الكل <b>${items.length}</b></button>`;
    }
    items.forEach(item=>{
      const done=item.dataset.v27Packed==='1';
      item.style.display=bagFilter==='all'||(bagFilter==='done'&&done)||(bagFilter==='pending'&&!done)?'':'none';
    });
    list.querySelectorAll('.bag-group').forEach(group=>{
      const visible=[...group.querySelectorAll('.bag-item')].some(x=>x.style.display!=='none');
      group.style.display=visible?'':'none';
    });
  }

  function redesignBag(){
    if(path()!=='bag.html')return;
    document.body.classList.add('v27-ui','v27-bag-page');
    const hero=document.querySelector('main .hero');
    if(hero&&!hero.dataset.v27){hero.dataset.v27='1';const s=hero.querySelector('.subtitle');if(s)s.textContent='Checklist بسيطة: علّم الحاجة أول ما تتحط فعلًا في الشنطة.';}
    const packedLabel=document.querySelector('.bag-kpi.done span');if(packedLabel)packedLabel.textContent='في الشنطة';
    const remainingLabels=[...document.querySelectorAll('.bag-kpi span')];remainingLabels.forEach(x=>{if((x.textContent||'').trim()==='فاضل')x.textContent='لسه ناقص';});
    ensureBagAddCollapse();ensureBagTabs();applyBagView();

    const list=document.getElementById('bagList');
    if(list&&!list.dataset.v27Observed){
      list.dataset.v27Observed='1';
      new MutationObserver(()=>{clearTimeout(bagTimer);bagTimer=setTimeout(()=>{applyBagView();fixPendingBagCopy();},80);}).observe(list,{childList:true,subtree:true,class:true,attributes:true});
    }
  }

  function globalCopyWatcher(){
    fixPendingBagCopy();
    const target=document.querySelector('main');if(!target||target.dataset.v27Copy)return;target.dataset.v27Copy='1';
    new MutationObserver(()=>{clearTimeout(bagTimer);bagTimer=setTimeout(()=>fixPendingBagCopy(),80);}).observe(target,{childList:true,subtree:true,characterData:true});
  }

  function globalPolish(){document.body.classList.add('v27-ui');updateVersion();fixPendingBagCopy();}

  async function main(){
    if(!(await waitForApp()))return;
    globalPolish();
    redesignBag();
    globalCopyWatcher();
    [700,1500,2600].forEach(ms=>setTimeout(()=>{globalPolish();redesignBag();fixPendingBagCopy();},ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(main,120));else setTimeout(main,120);
})();
