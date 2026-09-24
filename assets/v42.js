(() => {
  if (window.__BAZ_V42__) return;
  window.__BAZ_V42__ = true;

  const VERSION='V43';
  const UPDATED_AT='24/09/2026 02:45';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const route=()=>location.pathname.split('/').pop()||'index.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';

  let purchasePatched=false, refreshPatched=false, lastExpenseList=null, client=null;
  const expense={
    mode:localStorage.getItem('expenseLogMode')==='mine'?'mine':'all',
    data:null,
    loading:null
  };

  const style=document.createElement('style');
  style.id='v42-style';
  style.textContent=`
    .v41-version,.v41-version-drawer{display:none!important}
    .v42-version{font-size:9px;opacity:.55;text-align:center;padding:7px 8px 92px}
    .v42-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}
    .v38-ui .crew-card .trip-status{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;justify-self:end!important;min-height:28px!important;min-width:62px!important;padding:6px 10px!important;border-radius:999px!important;font-size:10px!important;font-weight:900!important;line-height:1.15!important;text-align:center!important;white-space:nowrap!important}
    .v38-expense-tab:disabled{opacity:.65;cursor:default}
    @media(min-width:761px){.v42-version{padding-bottom:18px}}
  `;
  document.head.appendChild(style);

  function stamp(){
    const footer=$('.v38-footer')||$('.footer');
    if(footer){
      let d=$('.v42-version');
      if(!d){d=document.createElement('div');d.className='v42-version';footer.insertAdjacentElement('afterend',d)}
      const next=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
      if(d.innerHTML!==next)d.innerHTML=next;
    }
    const actions=$('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){
      let d=$('.v42-version-drawer');
      if(!d){d=document.createElement('div');d.className='v42-version-drawer';actions.insertAdjacentElement('afterend',d)}
      const next=`${VERSION} • ${UPDATED_AT}`;
      if(d.textContent!==next)d.textContent=next;
    }
  }

  async function getClient(){
    if(client)return client;
    const c=window.SUPABASE_CONFIG||{};
    if(!window.supabase||!c.url||!c.key)return null;
    client=window.supabase.createClient(c.url,c.key);
    try{await client.auth.getSession()}catch(_){}
    return client;
  }

  function patchPurchaseQueue(){
    if(purchasePatched||typeof window.renderPurchaseQueue!=='function')return;
    window.renderPurchaseQueue=async function(){
      const box=$('#purchaseQueue'); if(!box) return;
      const items=DBLIVE?await TripDB.list('shopping_items',{order:'sort_order'}):[];
      const payerId=IS_ADMIN?($('#purchaseQueuePayer')?.value||CURRENT_MEMBER.id):CURRENT_MEMBER.id;
      const eligible=items.filter(x=>!x.purchased&&x.responsible_member_id===payerId);
      if($('#purchaseQueueCount')) $('#purchaseQueueCount').textContent=`${eligible.length} جاهزين للتسجيل`;
      box.innerHTML=eligible.length?eligible.map(x=>`
        <label class="purchase-queue-item">
          <input type="checkbox" class="purchase-item-check" value="${x.id}">
          <div><strong>${esc(x.name)}</strong><small>${x.planned_qty??'—'} ${esc(x.unit||'')}</small></div>
          <span>${esc(foodResponsibleName(x.responsible_member_id))}</span>
        </label>`).join(''):`<div class="empty-finance">مفيش مشتريات معلّقة على الشخص ده حاليًا ✅</div>`;
      $$('.purchase-item-check').forEach(ch=>ch.onchange=updatePurchaseBatchButtonState);
      updatePurchaseBatchButtonState();
    };
    window.renderPurchaseQueue.__v43=true;
    purchasePatched=true;
    if(route()==='expenses.html') window.renderPurchaseQueue().catch(console.warn);
  }

  async function loadExpenseData(force=false){
    if(force)expense.data=null;
    if(expense.data)return expense.data;
    if(expense.loading)return expense.loading;
    expense.loading=Promise.all([
      TripDB.list('expenses',{order:'created_at',asc:false}),
      TripDB.list('members',{order:'sort_order'}),
      TripDB.list('categories',{order:'sort_order'})
    ]).then(([expenses,members,categories])=>{
      expense.data={expenses,members,categories};
      return expense.data;
    }).finally(()=>{expense.loading=null});
    return expense.loading;
  }

  function setTabState(){
    $$('.v38-expense-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===expense.mode));
  }

  function modal(title,body,saveLabel='حفظ'){
    $('#v43Modal')?.remove();
    const back=document.createElement('div');
    back.id='v43Modal';back.className='v38-modal-backdrop';
    back.innerHTML=`<div class="v38-modal"><h3>${title}</h3>${body}<div class="v38-modal-actions"><button class="btn secondary" data-cancel>إلغاء</button><button class="btn" data-save>${saveLabel}</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('[data-cancel]').onclick=()=>back.remove();
    back.onclick=e=>{if(e.target===back)back.remove()};
    return back;
  }

  async function editExpense(row){
    if(!row)return;
    const c=await getClient(); if(!c)return;
    const back=modal('✏️ تعديل المصروف',`<div class="v38-modal-grid"><label style="grid-column:1/-1"><span>المبلغ</span><input id="v43Amount" class="amount-input" type="number" step="any" value="${Number(row.amount||0)}"></label><label style="grid-column:1/-1"><span>ملاحظة</span><input id="v43Note" class="text-input" value="${esc(row.note||'')}"></label></div>`,'حفظ');
    back.querySelector('[data-save]').onclick=async()=>{
      const amount=Number($('#v43Amount').value||0); if(!amount)return window.toast?.('اكتب المبلغ');
      const {error}=await c.rpc('update_trip_expense',{p_expense_id:row.id,p_amount:amount,p_note:$('#v43Note').value.trim()||null,p_category_id:row.category_id});
      if(error){console.error(error);return window.toast?.('حصلت مشكلة في التعديل')}
      back.remove(); window.toast?.('اتعدل ✅'); await refreshExpenseList(true);
    };
  }

  async function deleteExpense(id){
    if(!confirm('تحذف المصروف؟'))return;
    await TripDB.remove('expenses',id);
    window.toast?.('اتحذف ✅');
    await refreshExpenseList(true);
  }

  async function renderExpenseList(){
    if(route()!=='expenses.html')return;
    const member=window.TripDB?.getMember?.(); const list=$('#expenseList');
    if(!member||!list)return;
    setTabState();
    const data=await loadExpenseData();
    if(route()!=='expenses.html'||list!==$('#expenseList'))return;
    const names=Object.fromEntries(data.members.map(x=>[x.id,x.name]));
    const cats=Object.fromEntries(data.categories.map(x=>[x.id,x.name]));
    const rows=expense.mode==='mine'?data.expenses.filter(x=>x.payer_member_id===member.id):data.expenses;
    list.innerHTML=rows.length?rows.map(x=>`<article class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:10px"><div><strong>${esc(cats[x.category_id]||'مصروف')}</strong><div class="muted" style="font-size:9px;margin-top:3px">${esc(names[x.payer_member_id]||'—')}${x.note?` • ${esc(x.note)}`:''}</div></div><strong>${money(x.amount)}</strong></div>${(window.TripDB?.isAdmin?.()||x.payer_member_id===member.id)?`<div class="v38-expense-actions"><button class="btn secondary v43-edit-expense" data-id="${x.id}">✏️ تعديل</button><button class="btn danger v43-delete-expense" data-id="${x.id}">حذف</button></div>`:''}</article>`).join(''):'<div class="v38-empty">لسه مفيش مصاريف هنا.</div>';
    list.querySelectorAll('.v43-edit-expense').forEach(b=>b.onclick=()=>editExpense(data.expenses.find(x=>x.id===b.dataset.id)));
    list.querySelectorAll('.v43-delete-expense').forEach(b=>b.onclick=()=>deleteExpense(b.dataset.id));
    setTabState();
  }

  async function refreshExpenseList(force=false){
    if(force)expense.data=null;
    try{await renderExpenseList()}catch(e){console.warn('[V43 expenses]',e)}
  }

  function bindExpenseTabs(){
    if(document.__v43ExpenseTabs)return;
    document.__v43ExpenseTabs=true;
    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('.v38-expense-tab');
      if(!btn||route()!=='expenses.html')return;
      const next=btn.dataset.mode==='mine'?'mine':'all';
      e.preventDefault();
      e.stopImmediatePropagation();
      if(next===expense.mode){setTabState();return;}
      expense.mode=next;
      localStorage.setItem('expenseLogMode',next);
      setTabState();
      renderExpenseList();
    },true);
  }

  function patchRefresh(){
    if(refreshPatched||!window.BazV38?.refreshCurrent)return;
    const original=window.BazV38.refreshCurrent.bind(window.BazV38);
    window.BazV38.refreshCurrent=async(...args)=>{
      const result=await original(...args);
      if(route()==='expenses.html'){
        expense.data=null;
        await renderExpenseList();
      }
      stamp();
      return result;
    };
    refreshPatched=true;
  }

  function patchCrew(){
    if(route()!=='crew.html')return;
    $$('#crewGrid .trip-status').forEach(x=>x.setAttribute('aria-label',x.textContent.trim()));
  }

  function run(){
    patchPurchaseQueue();
    patchRefresh();
    patchCrew();
    stamp();
    bindExpenseTabs();
    if(route()==='expenses.html'){
      const list=$('#expenseList');
      if(list&&list!==lastExpenseList){
        lastExpenseList=list;
        expense.data=null;
        renderExpenseList();
      }
    }else lastExpenseList=null;
  }

  // Deliberately no whole-document MutationObserver here. The previous observer
  // reacted to its own version-stamp DOM writes and could create a render loop.
  const poll=setInterval(run,800);
  window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
