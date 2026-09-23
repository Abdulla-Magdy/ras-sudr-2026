(() => {
  if (window.__BAZ_V25_LOADED__) return;
  window.__BAZ_V25_LOADED__ = true;

  const VERSION='V25';
  const UPDATED_AT='23/09/2026 18:25';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  const style=document.createElement('style');
  style.id='v25-style';
  style.textContent=`
    :root{--v25-bg:#071722;--v25-surface:#102a36;--v25-surface2:#133541;--v25-line:rgba(255,255,255,.09);--v25-text:#f7fbff;--v25-muted:rgba(247,251,255,.62);--v25-aqua:#67e3dc;--v25-purple:#8f6bf0;--v25-green:#91e6a0;--v25-amber:#ffc86b;--v25-red:#ff8b7d}
    body.v25-ui{font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;background:linear-gradient(180deg,#071722 0%,#0a2633 55%,#08212d 100%);padding-bottom:78px}
    .v25-ui .shell{width:min(1100px,calc(100% - 24px))}
    .v25-ui .topbar{background:rgba(5,18,27,.92);border-bottom:1px solid var(--v25-line);backdrop-filter:blur(18px)}
    .v25-ui .nav{padding:9px 0;min-height:64px}.v25-ui .brand{gap:8px}.v25-ui .brand-logo{width:44px;height:44px;border-radius:13px}.v25-ui .brand span{font-size:15px}
    .v25-ui .card{background:rgba(255,255,255,.045);border:1px solid var(--v25-line);border-radius:16px;padding:16px;box-shadow:none}
    .v25-ui .btn{min-height:44px;border-radius:12px;padding:10px 14px}.v25-ui .btn.secondary{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.10)}
    .v25-ui .hero{padding:24px 0 14px}.v25-ui .hero h1{font-size:clamp(32px,8vw,48px);line-height:1.1;margin:8px 0}.v25-ui .subtitle{font-size:13px;line-height:1.7}
    .v25-ui .section{padding:7px 0 14px}.v25-ui .section-title{margin-bottom:10px}.v25-ui .section-title h2{font-size:20px}
    .v25-ui .text-input,.v25-ui .select-input,.v25-ui .qty-input,.v25-ui .amount-input,.v25-ui .textarea{background:rgba(0,0,0,.16);border-color:rgba(255,255,255,.10);border-radius:12px}

    /* Bottom navigation */
    .v25-bottom-nav{display:none;position:fixed;z-index:12000;left:10px;right:10px;bottom:10px;height:64px;background:rgba(7,23,34,.96);border:1px solid rgba(255,255,255,.11);border-radius:20px;backdrop-filter:blur(18px);box-shadow:0 14px 38px rgba(0,0,0,.32);padding:5px}
    .v25-bottom-nav a,.v25-bottom-nav button{flex:1;min-width:0;border:0;background:transparent;color:var(--v25-muted);text-decoration:none;border-radius:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:800;font-size:9px;cursor:pointer}
    .v25-bottom-nav .ico{font-size:20px;line-height:1}.v25-bottom-nav .active{background:linear-gradient(135deg,rgba(103,227,220,.14),rgba(143,107,240,.15));color:#fff}.v25-bottom-nav .active .ico{transform:translateY(-1px)}

    /* Home */
    .v25-home-hero{display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:right}.v25-home-hero h1{text-align:right!important;font-size:27px!important;margin:0!important}.v25-home-hero .hello{color:var(--v25-muted);font-size:12px;margin-bottom:3px}.v25-countdown-pill{display:flex;gap:5px;align-items:center;background:rgba(103,227,220,.08);border:1px solid rgba(103,227,220,.16);border-radius:15px;padding:9px 11px;white-space:nowrap}.v25-countdown-pill strong{font-size:21px}.v25-countdown-pill span{font-size:10px;color:var(--v25-muted)}
    .v25-home-dashboard{display:grid;gap:12px}.v25-kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v25-kpi{background:rgba(255,255,255,.04);border:1px solid var(--v25-line);border-radius:15px;padding:12px;min-height:92px}.v25-kpi .ico{font-size:20px}.v25-kpi strong{display:block;font-size:19px;margin:8px 0 2px}.v25-kpi small{display:block;font-size:9px;color:var(--v25-muted);line-height:1.4}
    .v25-panel{background:rgba(255,255,255,.04);border:1px solid var(--v25-line);border-radius:16px;padding:14px}.v25-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.v25-panel-head h3{margin:0;font-size:17px}.v25-panel-head a{font-size:10px;color:var(--v25-aqua);text-decoration:none}.v25-task-list{display:grid;gap:7px}.v25-task{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:12px;background:rgba(0,0,0,.12)}.v25-task .task-ico{width:29px;height:29px;display:grid;place-items:center;border-radius:9px;background:rgba(255,255,255,.055)}.v25-task strong{font-size:12px;display:block}.v25-task small{font-size:9px;color:var(--v25-muted)}.v25-empty{font-size:11px;color:var(--v25-muted);padding:8px 2px}
    .v25-quick-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v25-quick-actions a{text-decoration:none;background:rgba(255,255,255,.045);border:1px solid var(--v25-line);border-radius:14px;padding:12px 8px;text-align:center;font-size:10px;font-weight:800}.v25-quick-actions a span{display:block;font-size:22px;margin-bottom:5px}
    .v25-meals-mini{display:grid;gap:7px}.v25-meal-row{display:flex;gap:9px;align-items:flex-start;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.065)}.v25-meal-row:last-child{border-bottom:0}.v25-day{flex:0 0 auto;min-width:43px;padding:5px 7px;border-radius:999px;background:rgba(143,107,240,.13);color:#d9cfff;text-align:center;font-size:9px;font-weight:900}.v25-meal-row strong{font-size:12px}.v25-meal-row p{margin:2px 0 0;color:var(--v25-muted);font-size:10px;line-height:1.55}

    /* Shopping */
    .v25-food-page .hero{padding-bottom:8px}.v25-food-page .hero .eyebrow{display:none}.v25-food-page .hero h1{text-align:right;font-size:31px}.v25-food-page .hero .subtitle{text-align:right}
    .v25-food-page #mealGrid{gap:8px}.v25-food-page .meal-card{padding:12px;border-radius:14px}.v25-food-page .meal-card textarea{min-height:62px}.v25-food-page .meal-card .pill{font-size:8px;padding:4px 7px}
    .v25-food-page #foodBody{display:grid;gap:8px!important;margin-top:10px!important}.v25-food-page #foodBody>.food-item-card{margin:0!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.085)!important;border-radius:14px!important;padding:12px!important;box-shadow:none!important}
    .v25-food-page .food-item-head{gap:9px!important;align-items:flex-start!important}.v25-food-page .food-item-name{font-size:15px!important;line-height:1.3}.v25-food-page .food-item-meta{margin-top:4px!important;font-size:9px!important;gap:8px!important}.v25-food-page .food-head-badges{gap:5px!important}.v25-food-page .food-owner-badge,.v25-food-page .status{font-size:8px!important;padding:4px 6px!important}.v25-food-page .food-responsibility-action{margin-top:8px!important;padding-top:8px!important;border-top:1px solid rgba(255,255,255,.055);display:flex!important;gap:6px!important;flex-wrap:wrap!important}.v25-food-page .food-responsibility-action .btn{min-height:36px!important;padding:7px 10px!important;font-size:9px!important}.v25-food-page .food-responsibility-action .mini-field{flex:1 1 170px;margin:0!important}.v25-food-page .food-responsibility-action .mini-field>span{font-size:8px}.v25-food-page .food-responsibility-action .select-input{padding:8px 9px!important;font-size:11px!important}.v25-food-page .food-edit-details{margin-top:8px!important}.v25-food-page .food-edit-details summary{font-size:9px!important;padding:7px 0!important;color:var(--v25-aqua)!important}.v25-food-page .food-edit-grid{gap:7px!important}.v25-food-page .v22-item-note{font-size:9px!important;margin-top:6px!important}
    .v25-food-shell-card{background:transparent!important;border:0!important;padding:0!important}.v25-food-shell-card>.toolbar{margin-bottom:8px}.v25-food-shell-card>.toolbar h2{font-size:20px!important}.v25-shopping-filters{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:3px 0 9px;position:sticky;top:64px;z-index:20;background:linear-gradient(180deg,rgba(8,33,45,.98),rgba(8,33,45,.91) 78%,rgba(8,33,45,0))}.v25-shopping-filters::-webkit-scrollbar{display:none}.v25-shopping-filter{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:var(--v25-muted);border-radius:999px;padding:8px 10px;white-space:nowrap;font-size:9px;font-weight:800}.v25-shopping-filter.active{background:rgba(103,227,220,.13);border-color:rgba(103,227,220,.24);color:#fff}.v25-shopping-filter b{margin-inline-start:4px;color:var(--v25-aqua)}
    .v25-shopping-summary{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:13px;background:linear-gradient(135deg,rgba(103,227,220,.08),rgba(143,107,240,.08));border:1px solid rgba(255,255,255,.08);margin-bottom:8px}.v25-shopping-summary strong{font-size:12px}.v25-shopping-summary span{font-size:9px;color:var(--v25-muted)}

    .v25-version{font-size:9px;opacity:.55;text-align:center;padding:10px 8px 16px}.v25-version-drawer{font-size:9px;opacity:.55;text-align:center;padding:8px}

    @media(max-width:760px){
      .v25-bottom-nav{display:flex}.v25-ui .links{display:none!important}.v25-ui #dbState{display:none}.v25-ui .topbar .nav{display:grid!important;grid-template-columns:58px 1fr auto;align-items:center!important;gap:6px!important}.v25-ui .brand{grid-column:2;grid-row:1;justify-self:center}.v25-ui #userBar{grid-column:3;grid-row:1;justify-self:end}.v25-ui #mobileMenuToggle{grid-column:1;grid-row:1;justify-self:start}.v25-ui .brand span{font-size:13px}.v25-ui .brand-logo{width:40px;height:40px}.v25-ui #userBar .member-chip{display:inline-flex!important;font-size:9px;padding:5px 7px}.v25-ui #userBar .btn{display:none!important}
      .v25-home-hero{padding-top:4px}.v25-kpi{padding:10px;min-height:84px}.v25-kpi strong{font-size:17px}.v25-quick-actions a{padding:10px 6px}
      .v25-food-page .grid-3{grid-template-columns:1fr!important}
    }
    @media(min-width:761px){.v25-ui{padding-bottom:0}}
  `;
  document.head.appendChild(style);

  function me(){return window.TripDB?.getMember?.();}
  function isAdmin(){return !!window.TripDB?.isAdmin?.();}
  function path(){return location.pathname.split('/').pop()||'index.html';}
  function money(v){return new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

  async function waitForApp(){
    for(let i=0;i<100;i++){
      if(window.TripDB?.getMember?.())return true;
      await sleep(100);
    }
    return false;
  }

  function buildBottomNav(){
    if(path()==='login.html'||document.getElementById('v25BottomNav'))return;
    const p=path();
    const nav=document.createElement('nav');nav.id='v25BottomNav';nav.className='v25-bottom-nav';
    nav.innerHTML=`
      <a href="index.html" class="${p==='index.html'?'active':''}"><span class="ico">🏠</span><span>الرئيسية</span></a>
      <a href="food.html" class="${p==='food.html'?'active':''}"><span class="ico">🛒</span><span>المشتريات</span></a>
      <a href="expenses.html" class="${p==='expenses.html'?'active':''}"><span class="ico">💰</span><span>الحسابات</span></a>
      <a href="bag.html" class="${p==='bag.html'?'active':''}"><span class="ico">🎒</span><span>شنطتي</span></a>
      <button type="button" id="v25More"><span class="ico">•••</span><span>المزيد</span></button>`;
    document.body.appendChild(nav);
    nav.querySelector('#v25More').onclick=()=>document.getElementById('mobileMenuToggle')?.click();
  }

  function updateVersion(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer').forEach(x=>x.remove());
    const el=document.createElement('div');el.className='v25-version';el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    const footer=document.querySelector('.footer');if(footer)footer.insertAdjacentElement('afterend',el);else document.body.appendChild(el);
    const drawerActions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');if(drawerActions){const d=document.createElement('div');d.className='v25-version-drawer';d.innerHTML=`${VERSION} • ${UPDATED_AT}`;drawerActions.insertAdjacentElement('afterend',d);}
  }

  async function redesignHome(){
    if(path()!=='index.html'||document.getElementById('v25HomeDashboard'))return;
    const member=me();if(!member)return;
    document.body.classList.add('v25-home');
    const [items,expenses,bag,meals,members]=await Promise.all([
      TripDB.list('shopping_items',{order:'sort_order'}),
      TripDB.list('expenses',{order:'created_at',asc:false}),
      TripDB.list('private_packing_items',{order:'created_at',asc:true}).catch(()=>[]),
      TripDB.list('meal_plan',{order:'day_no'}),
      TripDB.list('members',{order:'sort_order'})
    ]);
    const open=items.filter(x=>!x.purchased), assigned=items.filter(x=>!x.purchased&&x.responsible_member_id), mine=items.filter(x=>!x.purchased&&x.responsible_member_id===member.id), unassigned=items.filter(x=>!x.purchased&&!x.responsible_member_id);
    const total=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
    const myBag=bag.filter(x=>!x.owner_member_id||x.owner_member_id===member.id);const packed=myBag.filter(x=>x.packed).length;const bagRemaining=myBag.filter(x=>!x.packed);
    const confirmed=members.filter(x=>x.confirmed!==false).length;

    const hero=document.querySelector('main .hero');
    if(hero){hero.innerHTML=`<div class="v25-home-hero"><div><div class="hello">أهلاً يا ${esc(member.name)} ${isAdmin()?'👑':''}</div><h1>جاهزين للرحلة؟ 😎</h1><div class="subtitle">${confirmed} أشقياء مؤكدين • الأربعاء 7 أكتوبر</div></div><div class="v25-countdown-pill"><strong id="v25Days">—</strong><span>يوم<br>على السفر</span></div></div>`;}

    const oldTimer=document.querySelector('.timer')?.closest('.section');if(oldTimer)oldTimer.style.display='none';
    const oldQuick=document.querySelector('.section.quick');if(oldQuick)oldQuick.style.display='none';
    const oldMeal=document.getElementById('mealSummary')?.closest('.section');if(oldMeal)oldMeal.style.display='none';

    const dashboard=document.createElement('section');dashboard.id='v25HomeDashboard';dashboard.className='section v25-home-dashboard';
    const tasks=[...mine.slice(0,4).map(x=>({ico:'🛒',title:x.name,sub:`مشترياتك${x.planned_qty?` • ${x.planned_qty} ${x.unit||''}`:''}`})),...bagRemaining.slice(0,2).map(x=>({ico:'🎒',title:x.item_name,sub:'لسه في شنطتك'}))].slice(0,5);
    dashboard.innerHTML=`
      <div class="v25-kpi-grid">
        <a class="v25-kpi" href="food.html" style="text-decoration:none"><span class="ico">🛒</span><strong>${open.length.toLocaleString('ar-EG')}</strong><small>حاجة لسه مطلوبة<br>${unassigned.length.toLocaleString('ar-EG')} من غير مسؤول</small></a>
        <a class="v25-kpi" href="expenses.html" style="text-decoration:none"><span class="ico">💰</span><strong>${money(total)}</strong><small>إجمالي مصاريف الرحلة</small></a>
        <a class="v25-kpi" href="bag.html" style="text-decoration:none"><span class="ico">🎒</span><strong>${packed}/${myBag.length}</strong><small>جاهزين في شنطتك</small></a>
      </div>
      <div class="v25-panel"><div class="v25-panel-head"><h3>عليك إيه دلوقتي؟</h3><a href="responsibilities.html">عرض الكل</a></div><div class="v25-task-list">${tasks.length?tasks.map(t=>`<div class="v25-task"><span class="task-ico">${t.ico}</span><div><strong>${esc(t.title)}</strong><small>${esc(t.sub)}</small></div></div>`).join(''):'<div class="v25-empty">مفيش حاجة معلقة عليك دلوقتي 👌</div>'}</div></div>
      <div class="v25-quick-actions"><a href="expenses.html"><span>➕</span>سجل مصروف</a><a href="food.html"><span>🛒</span>حاجة ناقصة</a><a href="location.html"><span>📍</span>Live Location</a></div>
      <div class="v25-panel"><div class="v25-panel-head"><h3>خطة الأكل</h3><a href="food.html">تعديل الخطة</a></div><div class="v25-meals-mini">${meals.map(m=>`<div class="v25-meal-row"><span class="v25-day">يوم ${m.day_no}</span><div><strong>${esc(m.title||'')}</strong><p>${esc(m.details||'لسه بيتحدد')}</p></div></div>`).join('')}</div></div>`;
    hero?.insertAdjacentElement('afterend',dashboard);

    function mirrorDays(){const d=document.getElementById('days')?.textContent;const out=document.getElementById('v25Days');if(out&&d)out.textContent=d;}
    mirrorDays();setInterval(mirrorDays,1000);
  }

  let foodFilter=localStorage.getItem('v25FoodFilter')||'all';
  let foodSyncing=false;
  async function redesignFood(){
    if(path()!=='food.html')return;
    document.body.classList.add('v25-food-page');
    const shellCard=document.getElementById('foodBody')?.closest('.card');if(shellCard)shellCard.classList.add('v25-food-shell-card');
    const hero=document.querySelector('main .hero');if(hero&&!hero.dataset.v25){hero.dataset.v25='1';hero.querySelector('h1').textContent='المشتريات والأكل';const s=hero.querySelector('.subtitle');if(s)s.textContent='شوف الناقص، خد مسؤولية حاجة، وسجل اللي اتجاب بسرعة.';}
    if(foodSyncing)return;foodSyncing=true;
    try{
      const items=await TripDB.list('shopping_items',{order:'sort_order'});const member=me();
      const body=document.getElementById('foodBody');if(!body)return;
      const cards=[...body.querySelectorAll('.food-item-card')];
      cards.forEach((card,i)=>{const x=items[i];if(!x)return;card.dataset.itemId=x.id;card.dataset.purchased=x.purchased?'1':'0';card.dataset.owner=x.responsible_member_id||'';card.dataset.unassigned=x.responsible_member_id?'0':'1';const st=card.querySelector('.status.done');if(st)st.textContent='تم توفيرها ✓';});

      let filters=document.getElementById('v25ShoppingFilters');
      if(!filters){
        filters=document.createElement('div');filters.id='v25ShoppingFilters';filters.className='v25-shopping-filters';
        const quick=document.getElementById('v22QuickShoppingFood');const anchor=quick||body;anchor.insertAdjacentElement(quick?'afterend':'beforebegin',filters);
        filters.onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;foodFilter=b.dataset.filter;localStorage.setItem('v25FoodFilter',foodFilter);applyFoodFilter(items);};
      }
      filters.innerHTML=`<button class="v25-shopping-filter" data-filter="all">الكل <b>${items.length}</b></button><button class="v25-shopping-filter" data-filter="unassigned">ناقص مسؤول <b>${items.filter(x=>!x.purchased&&!x.responsible_member_id).length}</b></button><button class="v25-shopping-filter" data-filter="mine">عليا <b>${items.filter(x=>!x.purchased&&x.responsible_member_id===member.id).length}</b></button><button class="v25-shopping-filter" data-filter="done">اتجاب <b>${items.filter(x=>x.purchased).length}</b></button>`;
      let summary=document.getElementById('v25ShoppingSummary');if(!summary){summary=document.createElement('div');summary.id='v25ShoppingSummary';summary.className='v25-shopping-summary';filters.insertAdjacentElement('beforebegin',summary);}summary.innerHTML=`<div><strong>${items.filter(x=>x.purchased).length} من ${items.length} اتوفروا</strong><br><span>${items.filter(x=>!x.purchased&&!x.responsible_member_id).length} لسه محتاجين حد ياخدهم</span></div><span>🛒</span>`;
      applyFoodFilter(items);
    }finally{foodSyncing=false;}
  }

  function applyFoodFilter(items){
    const member=me();
    document.querySelectorAll('#v25ShoppingFilters [data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===foodFilter));
    document.querySelectorAll('#foodBody .food-item-card').forEach((card,i)=>{
      const x=items[i];if(!x)return;let show=true;
      if(foodFilter==='unassigned')show=!x.purchased&&!x.responsible_member_id;
      else if(foodFilter==='mine')show=!x.purchased&&x.responsible_member_id===member.id;
      else if(foodFilter==='done')show=!!x.purchased;
      card.style.display=show?'':'none';
    });
  }

  function watchFood(){
    const body=document.getElementById('foodBody');if(!body)return;const obs=new MutationObserver(()=>setTimeout(()=>redesignFood().catch(console.error),100));obs.observe(body,{childList:true});
  }

  function globalPolish(){document.body.classList.add('v25-ui');buildBottomNav();updateVersion();}

  async function main(){
    if(!(await waitForApp()))return;
    globalPolish();
    await redesignHome().catch(console.error);
    await redesignFood().catch(console.error);
    watchFood();
    [800,1600,2800].forEach(ms=>setTimeout(()=>{globalPolish();redesignFood().catch(console.error);},ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(main,120));else setTimeout(main,120);
})();