(() => {
  if (window.__BAZ_V24_LOADED__) return;
  window.__BAZ_V24_LOADED__ = true;

  const VERSION='V24';
  const UPDATED_AT='23/09/2026 18:05';

  const style=document.createElement('style');
  style.id='v24-style';
  style.textContent=`
    .v24-expense-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 14px;padding:5px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09)}
    .v24-expense-tab{border:0;border-radius:12px;padding:11px 12px;background:transparent;color:var(--muted);font-weight:800;cursor:pointer}
    .v24-expense-tab.active{background:rgba(102,230,223,.13);color:#fff;border:1px solid rgba(102,230,223,.22)}
    .v24-expense-tab small{display:inline-flex;min-width:22px;height:22px;padding:0 6px;align-items:center;justify-content:center;border-radius:999px;background:rgba(255,255,255,.08);font-size:10px;margin-inline-start:5px}
    .v24-expense-filter-note{font-size:10px;color:var(--muted);margin:-5px 2px 12px}
    .v24-version{font-size:10px;opacity:.7;text-align:center;padding:12px 8px 20px}
    .v24-version-drawer{font-size:10px;opacity:.65;text-align:center;padding:10px 8px 4px}
  `;
  document.head.appendChild(style);

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let selectedMode=localStorage.getItem('expenseLogMode')||'all';
  let syncing=false;

  function getMe(){ return window.TripDB?.getMember?.(); }
  function isAdmin(){ return !!window.TripDB?.isAdmin?.(); }

  async function waitForApp(){
    for(let i=0;i<80;i++){
      if(getMe()) return true;
      await sleep(100);
    }
    return false;
  }

  function ensureTabs(){
    const list=document.getElementById('expenseList');
    if(!list) return null;
    let tabs=document.getElementById('v24ExpenseTabs');
    if(!tabs){
      tabs=document.createElement('div');
      tabs.id='v24ExpenseTabs';
      tabs.className='v24-expense-tabs';
      tabs.innerHTML=`
        <button class="v24-expense-tab" data-mode="all">👥 كل المصاريف <small id="v24AllCount">0</small></button>
        <button class="v24-expense-tab" data-mode="mine">🙋 مصاريفي <small id="v24MineCount">0</small></button>
      `;
      list.insertAdjacentElement('beforebegin',tabs);
      const note=document.createElement('div');
      note.id='v24ExpenseFilterNote';
      note.className='v24-expense-filter-note';
      tabs.insertAdjacentElement('afterend',note);
      tabs.querySelectorAll('[data-mode]').forEach(btn=>btn.onclick=()=>{
        selectedMode=btn.dataset.mode;
        localStorage.setItem('expenseLogMode',selectedMode);
        applyFilter();
      });
    }
    return tabs;
  }

  function applyFilter(){
    const tabs=ensureTabs();
    const list=document.getElementById('expenseList');
    if(!tabs||!list) return;
    const me=getMe();
    let mine=0,all=0,visible=0;
    list.querySelectorAll('.expense-log-card').forEach(card=>{
      all++;
      const isMine=card.dataset.payerId===me?.id;
      if(isMine) mine++;
      const show=selectedMode==='all'||isMine;
      card.style.display=show?'':'none';
      if(show) visible++;
    });
    const allCount=document.getElementById('v24AllCount'); if(allCount) allCount.textContent=all.toLocaleString('ar-EG');
    const mineCount=document.getElementById('v24MineCount'); if(mineCount) mineCount.textContent=mine.toLocaleString('ar-EG');
    tabs.querySelectorAll('[data-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===selectedMode));
    const note=document.getElementById('v24ExpenseFilterNote');
    if(note){
      note.textContent=selectedMode==='mine'
        ? (mine?`ظاهر دلوقتي ${mine.toLocaleString('ar-EG')} مصروف سجلتهم إنت — تقدر تعدلهم أو تحذفهم بسهولة.`:'إنت لسه ما سجلتش مصاريف.')
        : `ظاهر كل مصاريف الرحلة (${all.toLocaleString('ar-EG')}). افتح «مصاريفي» عشان توصل لحاجتك بسرعة.`;
    }
    const empty=document.getElementById('v24MineEmpty');
    if(empty) empty.remove();
    if(selectedMode==='mine'&&visible===0&&all>0){
      const e=document.createElement('div');e.id='v24MineEmpty';e.className='empty-finance';e.textContent='إنت لسه ما سجلتش مصاريف.';list.appendChild(e);
    }
  }

  async function syncExpenseOwners(){
    if(syncing||!document.getElementById('expenseList')||!window.TripDB?.list) return;
    syncing=true;
    try{
      const arr=await TripDB.list('expenses',{order:'created_at',asc:false});
      const cards=[...document.querySelectorAll('#expenseList .expense-log-card')];
      cards.forEach((card,i)=>{
        if(arr[i]){
          card.dataset.expenseId=arr[i].id;
          card.dataset.payerId=arr[i].payer_member_id||'';
        }
      });
      applyFilter();
    }catch(e){console.warn('V24 expense filter sync failed',e);}
    finally{syncing=false;}
  }

  function watchExpenseList(){
    const list=document.getElementById('expenseList');if(!list)return;
    ensureTabs();
    syncExpenseOwners();
    const obs=new MutationObserver(muts=>{
      if(muts.some(m=>m.type==='childList')) setTimeout(syncExpenseOwners,80);
    });
    obs.observe(list,{childList:true,subtree:false});
  }

  function guardDestinationAdmin(){
    const panel=document.getElementById('v22DestinationAdmin');
    if(panel&&!isAdmin()) panel.remove();
  }

  function updateVersion(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v23-version-drawer,.v24-version-drawer').forEach(x=>x.remove());
    const page=document.createElement('div');
    page.className='v24-version';
    page.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    const footer=document.querySelector('.footer');
    if(footer) footer.insertAdjacentElement('afterend',page); else document.body.appendChild(page);
    const drawerActions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(drawerActions){
      const d=document.createElement('div');d.className='v24-version-drawer';d.innerHTML=`<strong>${VERSION}</strong> • ${UPDATED_AT}`;
      drawerActions.insertAdjacentElement('afterend',d);
    }
  }

  async function main(){
    if(!(await waitForApp()))return;
    watchExpenseList();
    guardDestinationAdmin();
    updateVersion();
    [900,1800,3200].forEach(ms=>setTimeout(()=>{
      syncExpenseOwners();
      guardDestinationAdmin();
      updateVersion();
    },ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(main,150));else setTimeout(main,150);
})();
