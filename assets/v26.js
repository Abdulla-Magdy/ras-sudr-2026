(() => {
  if (window.__BAZ_V26_LOADED__) return;
  window.__BAZ_V26_LOADED__ = true;

  const VERSION='V26';
  const UPDATED_AT='23/09/2026 19:30';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let shoppingSyncing=false;
  let shoppingFilter=localStorage.getItem('v26ShoppingFilter')||'all';

  const style=document.createElement('style');
  style.id='v26-style';
  style.textContent=`
    body.v26-ui{--v26-line:rgba(255,255,255,.075);--v26-card:rgba(255,255,255,.032);--v26-muted:rgba(247,251,255,.6)}
    .v26-ui .v25-kpi{min-height:72px;padding:9px 10px}.v26-ui .v25-kpi .ico{font-size:17px}.v26-ui .v25-kpi strong{font-size:16px;margin:4px 0 1px}.v26-ui .v25-kpi small{font-size:8px}
    .v26-ui .v25-home-dashboard{gap:9px}.v26-ui .v25-panel{padding:12px}.v26-ui .v25-task{padding:0;background:transparent}.v26-ui .v26-task-link{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border-radius:12px;background:rgba(0,0,0,.12);text-decoration:none}.v26-ui .v26-task-link:active{transform:scale(.99)}
    .v26-ui .v25-quick-actions{gap:6px}.v26-ui .v25-quick-actions a{padding:9px 5px;border-radius:12px}.v26-ui .v25-quick-actions a span{font-size:18px;margin-bottom:3px}
    .v26-meal-shortcut{display:flex;align-items:center;justify-content:space-between;gap:10px;text-decoration:none;padding:12px 14px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid var(--v26-line)}.v26-meal-shortcut strong{font-size:14px}.v26-meal-shortcut small{display:block;color:var(--v26-muted);font-size:9px;margin-top:3px}.v26-meal-shortcut .arrow{font-size:22px;color:#67e3dc}
    .v26-bottom-nav{display:none;position:fixed;z-index:12050;left:10px;right:10px;bottom:10px;height:62px;background:rgba(7,23,34,.97);border:1px solid rgba(255,255,255,.1);border-radius:19px;backdrop-filter:blur(18px);box-shadow:0 14px 38px rgba(0,0,0,.34);padding:5px}.v26-bottom-nav a,.v26-bottom-nav button{flex:1;min-width:0;border:0;background:transparent;color:var(--v26-muted);text-decoration:none;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:800;font-size:9px}.v26-bottom-nav .ico{font-size:19px}.v26-bottom-nav .active{background:rgba(103,227,220,.11);color:#fff}
    .v26-shopping-page .hero{padding:20px 0 8px}.v26-shopping-page .hero .eyebrow{display:none}.v26-shopping-page .hero h1{text-align:right;font-size:30px;margin:0 0 5px}.v26-shopping-page .hero .subtitle{text-align:right;font-size:11px}.v26-shopping-page #foodBody{display:grid;gap:7px!important;margin-top:8px!important}.v26-shopping-page #foodBody>.food-item-card{margin:0!important;background:var(--v26-card)!important;border:1px solid var(--v26-line)!important;border-radius:13px!important;padding:11px!important;box-shadow:none!important;scroll-margin-top:150px}.v26-shopping-page #foodBody>.food-item-card.v26-focus{outline:2px solid rgba(103,227,220,.65);box-shadow:0 0 0 5px rgba(103,227,220,.08)!important}.v26-shopping-page .food-item-name{font-size:14px!important}.v26-shopping-page .food-item-meta{font-size:9px!important}.v26-shopping-page .food-owner-badge,.v26-shopping-page .status{font-size:8px!important;padding:4px 6px!important}.v26-shopping-page .food-responsibility-action,.v26-shopping-page .food-edit-details{display:none!important}.v26-shopping-page .food-item-card.v26-open .food-responsibility-action{display:flex!important;gap:6px!important;flex-wrap:wrap!important;margin-top:8px!important;padding-top:8px!important;border-top:1px solid var(--v26-line)}.v26-shopping-page .food-item-card.v26-open .food-edit-details{display:block!important}.v26-item-toggle{margin-top:7px;border:0;background:transparent;color:#67e3dc;font-size:9px;font-weight:800;padding:3px 0;cursor:pointer}.v26-shopping-page .food-item-card.v26-open .v26-item-toggle{color:#fff}.v26-shopping-page .food-responsibility-action .btn{min-height:34px!important;padding:6px 9px!important;font-size:9px!important}.v26-shopping-page .food-responsibility-action .mini-field{flex:1 1 170px}.v26-shopping-page .food-edit-details summary{font-size:9px!important;color:#67e3dc!important}.v26-shopping-page .food-edit-grid{gap:6px!important}.v26-shopping-shell{background:transparent!important;border:0!important;padding:0!important}.v26-shopping-shell>.toolbar{display:none}.v26-shopping-filters{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:3px 0 8px;position:sticky;top:64px;z-index:25;background:linear-gradient(180deg,rgba(8,33,45,.98),rgba(8,33,45,.9) 80%,rgba(8,33,45,0))}.v26-shopping-filter{border:1px solid var(--v26-line);background:rgba(255,255,255,.035);color:var(--v26-muted);border-radius:999px;padding:8px 10px;white-space:nowrap;font-size:9px;font-weight:800}.v26-shopping-filter.active{background:rgba(103,227,220,.12);border-color:rgba(103,227,220,.22);color:#fff}.v26-shopping-summary{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid var(--v26-line);margin-bottom:7px}.v26-shopping-summary strong{font-size:11px}.v26-shopping-summary span{font-size:9px;color:var(--v26-muted)}
    .v26-meals-page .hero{padding:20px 0 10px}.v26-meals-page .hero .eyebrow{display:none}.v26-meals-page .hero h1{text-align:right;font-size:30px;margin:0 0 5px}.v26-meals-page .hero .subtitle{text-align:right;font-size:11px}.v26-meals-page #mealGrid{gap:9px}.v26-meals-page .meal-card{padding:13px;border-radius:14px}.v26-meals-page .meal-card textarea{min-height:68px}.v26-meals-page .meal-card .btn{min-height:38px;padding:8px 12px}
    .v26-my-page .hero{padding:20px 0 10px}.v26-my-page .hero .eyebrow{display:none}.v26-my-page .hero h1{text-align:right;font-size:30px;margin:0 0 5px}.v26-my-page .hero .subtitle{text-align:right;font-size:11px}.v26-my-grid{display:grid;gap:10px}.v26-task-section{background:rgba(255,255,255,.035);border:1px solid var(--v26-line);border-radius:15px;padding:13px}.v26-task-section h2{margin:0 0 9px;font-size:17px}.v26-task-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--v26-line);text-decoration:none}.v26-task-row:last-child{border-bottom:0}.v26-task-row strong{font-size:12px}.v26-task-row small{display:block;color:var(--v26-muted);font-size:9px;margin-top:2px}.v26-task-row .go{color:#67e3dc;font-size:20px}.v26-empty{color:var(--v26-muted);font-size:10px;padding:8px 0}
    .v26-version{font-size:9px;opacity:.55;text-align:center;padding:10px 8px 16px}.v26-version-drawer{font-size:9px;opacity:.55;text-align:center;padding:8px}
    @media(max-width:760px){.v26-bottom-nav{display:flex}.v26-ui{padding-bottom:76px}.v26-ui .v25-bottom-nav{display:none!important}.v26-ui .v25-kpi-grid{gap:6px}.v26-ui .v25-panel-head h3{font-size:15px}.v26-ui .v25-panel-head{margin-bottom:8px}.v26-meals-page .grid-3{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  function path(){return location.pathname.split('/').pop()||'index.html';}
  function me(){return window.TripDB?.getMember?.();}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  async function waitForApp(){for(let i=0;i<100;i++){if(me())return true;await sleep(100);}return false;}

  function buildBottomNav(){
    document.getElementById('v25BottomNav')?.remove();
    document.getElementById('v26BottomNav')?.remove();
    if(path()==='login.html')return;
    const p=path();
    const nav=document.createElement('nav');nav.id='v26BottomNav';nav.className='v26-bottom-nav';
    nav.innerHTML=`<a href="index.html" class="${p==='index.html'?'active':''}"><span class="ico">🏠</span><span>الرئيسية</span></a><a href="shopping.html" class="${p==='shopping.html'?'active':''}"><span class="ico">🛒</span><span>المشتريات</span></a><a href="expenses.html" class="${p==='expenses.html'?'active':''}"><span class="ico">💰</span><span>الحسابات</span></a><a href="bag.html" class="${p==='bag.html'?'active':''}"><span class="ico">🎒</span><span>شنطتي</span></a><button type="button" id="v26More"><span class="ico">•••</span><span>المزيد</span></button>`;
    document.body.appendChild(nav);nav.querySelector('#v26More').onclick=()=>document.getElementById('mobileMenuToggle')?.click();
  }

  function patchDrawer(){
    const drawer=document.getElementById('mobileMenuDrawer');if(!drawer)return;
    drawer.querySelectorAll('a[href="food.html"]').forEach(a=>{a.href='shopping.html';const l=a.querySelector('.nav-label')||a.querySelector('span:last-child');if(l)l.textContent='المشتريات';});
    if(!drawer.querySelector('a[href="meals.html"]')){
      const shop=drawer.querySelector('a[href="shopping.html"]');
      if(shop){const a=document.createElement('a');a.href='meals.html';a.innerHTML='<span class="nav-icon">🍽️</span><span class="nav-label">خطة الأكل</span>';shop.insertAdjacentElement('beforebegin',a);}
    }
    if(!drawer.querySelector('a[href="my-tasks.html"]')){
      const r=drawer.querySelector('a[href="responsibilities.html"]');
      if(r){const a=document.createElement('a');a.href='my-tasks.html';a.innerHTML='<span class="nav-icon">✅</span><span class="nav-label">عليّا إيه؟</span>';r.insertAdjacentElement('beforebegin',a);}
    }
  }

  function updateVersion(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer').forEach(x=>x.remove());
    const el=document.createElement('div');el.className='v26-version';el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;const f=document.querySelector('.footer');if(f)f.insertAdjacentElement('afterend',el);else document.body.appendChild(el);
    const da=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');if(da){const d=document.createElement('div');d.className='v26-version-drawer';d.textContent=`${VERSION} • ${UPDATED_AT}`;da.insertAdjacentElement('afterend',d);}
  }

  async function declutterHome(){
    if(path()!=='index.html')return;
    const member=me();if(!member)return;
    const [items,bag]=await Promise.all([TripDB.list('shopping_items',{order:'sort_order'}),TripDB.list('private_packing_items',{order:'created_at',asc:true}).catch(()=>[])]);
    const mine=items.filter(x=>!x.purchased&&x.responsible_member_id===member.id);
    const bagMine=bag.filter(x=>(!x.owner_member_id||x.owner_member_id===member.id)&&!x.packed);
    const list=document.querySelector('.v25-task-list');
    if(list){
      const tasks=[...mine.slice(0,4).map(x=>({href:`shopping.html?item=${encodeURIComponent(x.id)}`,ico:'🛒',title:x.name,sub:`مشترياتك${x.planned_qty?` • ${x.planned_qty} ${x.unit||''}`:''}`})),...bagMine.slice(0,2).map(x=>({href:'bag.html',ico:'🎒',title:x.item_name,sub:'لسه في شنطتك'}))].slice(0,5);
      list.innerHTML=tasks.length?tasks.map(t=>`<div class="v25-task"><a class="v26-task-link" href="${t.href}"><span class="task-ico">${t.ico}</span><div><strong>${esc(t.title)}</strong><small>${esc(t.sub)}</small></div></a></div>`).join(''):'<div class="v25-empty">مفيش حاجة معلقة عليك دلوقتي 👌</div>';
      const panel=list.closest('.v25-panel');const all=panel?.querySelector('.v25-panel-head a');if(all){all.href='my-tasks.html';all.textContent='عرض الكل';}
    }
    document.querySelectorAll('.v25-quick-actions a[href="food.html"]').forEach(a=>a.href='shopping.html');
    const mealPanel=[...document.querySelectorAll('.v25-panel')].find(x=>x.querySelector('.v25-meals-mini'));
    if(mealPanel){mealPanel.outerHTML='<a class="v26-meal-shortcut" href="meals.html"><div><strong>🍽️ خطة الأكل</strong><small>وجبات الـ3 أيام في صفحة مستقلة</small></div><span class="arrow">‹</span></a>';}
    document.querySelectorAll('.v25-kpi[href="food.html"]').forEach(a=>a.href='shopping.html');
  }

  async function redesignShopping(){
    if(path()!=='shopping.html')return;
    document.body.classList.add('v26-shopping-page','v25-food-page');
    const body=document.getElementById('foodBody');if(!body||shoppingSyncing)return;shoppingSyncing=true;
    try{
      const member=me();const items=await TripDB.list('shopping_items',{order:'sort_order'});const cards=[...body.querySelectorAll('.food-item-card')];
      cards.forEach((card,i)=>{const x=items[i];if(!x)return;card.dataset.itemId=x.id;card.dataset.purchased=x.purchased?'1':'0';card.dataset.owner=x.responsible_member_id||'';card.dataset.unassigned=x.responsible_member_id?'0':'1';if(!card.querySelector('.v26-item-toggle')){const b=document.createElement('button');b.type='button';b.className='v26-item-toggle';b.textContent='إدارة الصنف';b.onclick=e=>{e.stopPropagation();card.classList.toggle('v26-open');b.textContent=card.classList.contains('v26-open')?'إخفاء التفاصيل':'إدارة الصنف';};card.appendChild(b);card.addEventListener('click',e=>{if(e.target.closest('button,input,select,textarea,summary,a,label'))return;card.classList.toggle('v26-open');b.textContent=card.classList.contains('v26-open')?'إخفاء التفاصيل':'إدارة الصنف';});}}
      );
      const shell=body.closest('.card');if(shell)shell.classList.add('v26-shopping-shell');
      document.getElementById('v25ShoppingFilters')?.remove();document.getElementById('v25ShoppingSummary')?.remove();
      let filters=document.getElementById('v26ShoppingFilters');if(!filters){filters=document.createElement('div');filters.id='v26ShoppingFilters';filters.className='v26-shopping-filters';const quick=document.getElementById('v22QuickShoppingFood');(quick||body).insertAdjacentElement(quick?'afterend':'beforebegin',filters);filters.onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;shoppingFilter=b.dataset.filter;localStorage.setItem('v26ShoppingFilter',shoppingFilter);applyShoppingFilter(items);};}
      filters.innerHTML=`<button class="v26-shopping-filter" data-filter="all">الكل ${items.length}</button><button class="v26-shopping-filter" data-filter="unassigned">ناقص مسؤول ${items.filter(x=>!x.purchased&&!x.responsible_member_id).length}</button><button class="v26-shopping-filter" data-filter="mine">عليا ${items.filter(x=>!x.purchased&&x.responsible_member_id===member.id).length}</button><button class="v26-shopping-filter" data-filter="done">اتجاب ${items.filter(x=>x.purchased).length}</button>`;
      let summary=document.getElementById('v26ShoppingSummary');if(!summary){summary=document.createElement('div');summary.id='v26ShoppingSummary';summary.className='v26-shopping-summary';filters.insertAdjacentElement('beforebegin',summary);}summary.innerHTML=`<div><strong>${items.filter(x=>x.purchased).length} من ${items.length} اتوفروا</strong><br><span>${items.filter(x=>!x.purchased&&!x.responsible_member_id).length} لسه من غير مسؤول</span></div><span>🛒</span>`;
      applyShoppingFilter(items);
      const target=new URLSearchParams(location.search).get('item');if(target){shoppingFilter='all';applyShoppingFilter(items);const card=cards.find(c=>c.dataset.itemId===target);if(card){card.style.display='';card.classList.add('v26-focus','v26-open');card.querySelector('.v26-item-toggle')?.replaceChildren(document.createTextNode('إخفاء التفاصيل'));setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'center'}),180);setTimeout(()=>card.classList.remove('v26-focus'),2600);}}
    }finally{shoppingSyncing=false;}
  }

  function applyShoppingFilter(items){
    const member=me();document.querySelectorAll('#v26ShoppingFilters [data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===shoppingFilter));document.querySelectorAll('#foodBody .food-item-card').forEach((card,i)=>{const x=items[i];if(!x)return;let show=true;if(shoppingFilter==='unassigned')show=!x.purchased&&!x.responsible_member_id;else if(shoppingFilter==='mine')show=!x.purchased&&x.responsible_member_id===member.id;else if(shoppingFilter==='done')show=!!x.purchased;card.style.display=show?'':'none';});
  }

  async function renderMyTasks(){
    if(path()!=='my-tasks.html')return;document.body.classList.add('v26-my-page');const member=me();const [items,bag]=await Promise.all([TripDB.list('shopping_items',{order:'sort_order'}),TripDB.list('private_packing_items',{order:'created_at',asc:true}).catch(()=>[])]);const mine=items.filter(x=>!x.purchased&&x.responsible_member_id===member.id);const bagMine=bag.filter(x=>(!x.owner_member_id||x.owner_member_id===member.id)&&!x.packed);const root=document.getElementById('v26MyTasks');if(!root)return;root.innerHTML=`<div class="v26-my-grid"><section class="v26-task-section"><h2>🛒 مشتريات عليا <span class="muted">(${mine.length})</span></h2>${mine.length?mine.map(x=>`<a class="v26-task-row" href="shopping.html?item=${encodeURIComponent(x.id)}"><div><strong>${esc(x.name)}</strong><small>${x.planned_qty?`${esc(x.planned_qty)} ${esc(x.unit||'')}`:'بدون كمية محددة'}</small></div><span class="go">‹</span></a>`).join(''):'<div class="v26-empty">مفيش مشتريات عليك دلوقتي 👌</div>'}</section><section class="v26-task-section"><h2>🎒 لسه في شنطتي <span class="muted">(${bagMine.length})</span></h2>${bagMine.length?bagMine.map(x=>`<a class="v26-task-row" href="bag.html"><div><strong>${esc(x.item_name)}</strong><small>${esc(x.category||'شنطتي')}</small></div><span class="go">‹</span></a>`).join(''):'<div class="v26-empty">شنطتك متعلم عليها كلها ✅</div>'}</section></div>`;
  }

  function mealsPolish(){if(path()==='meals.html')document.body.classList.add('v26-meals-page');}

  function global(){document.body.classList.add('v26-ui');buildBottomNav();patchDrawer();updateVersion();}
  async function main(){if(!(await waitForApp()))return;global();await declutterHome().catch(console.error);await redesignShopping().catch(console.error);await renderMyTasks().catch(console.error);mealsPolish();const body=document.getElementById('foodBody');if(body){new MutationObserver(()=>setTimeout(()=>redesignShopping().catch(console.error),100)).observe(body,{childList:true});}[700,1500,2800].forEach(ms=>setTimeout(()=>{global();declutterHome().catch(console.error);redesignShopping().catch(console.error);mealsPolish();},ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(main,120));else setTimeout(main,120);
})();