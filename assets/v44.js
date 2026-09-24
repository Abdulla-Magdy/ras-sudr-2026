(() => {
  if (window.__BAZ_V44__) return;
  window.__BAZ_V44__ = true;

  const VERSION='V45';
  const UPDATED_AT='24/09/2026 03:58';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const route=()=>location.pathname.split('/').pop()||'index.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';

  let mode=localStorage.getItem('expenseLogMode')==='mine'?'mine':'all';
  let cache=null, loading=null, client=null, lastList=null, patchDone=false;

  const style=document.createElement('style');
  style.id='v45-style';
  style.textContent=`
    .v42-version,.v42-version-drawer,.v44-version,.v44-version-drawer{display:none!important}
    .v45-version{font-size:9px;opacity:.55;text-align:center;padding:7px 8px 92px}
    .v45-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}
    .v38-expense-tabs{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
    .v45-expense-tab{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:var(--muted,#9fb0bb);border-radius:14px;padding:11px 10px;font-weight:900;cursor:pointer;min-height:44px}
    .v45-expense-tab.active{background:rgba(103,227,220,.20);border-color:rgba(103,227,220,.55);color:#fff;box-shadow:0 0 0 1px rgba(103,227,220,.08) inset}
    .v45-expense-view{margin:8px 0 10px;padding:8px 10px;border-radius:11px;background:rgba(255,255,255,.035);font-size:9px;color:var(--muted,#9fb0bb)}
    .v45-expense-same{margin-top:6px;color:#f1d58f}
    @media(min-width:761px){.v45-version{padding-bottom:18px}}
  `;
  document.head.appendChild(style);

  function stamp(){
    const footer=$('.v38-footer')||$('.footer');
    if(footer){
      let d=$('.v45-version');
      if(!d){d=document.createElement('div');d.className='v45-version';footer.insertAdjacentElement('afterend',d)}
      const next=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
      if(d.innerHTML!==next)d.innerHTML=next;
    }
    const actions=$('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){
      let d=$('.v45-version-drawer');
      if(!d){d=document.createElement('div');d.className='v45-version-drawer';actions.insertAdjacentElement('afterend',d)}
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

  async function load(force=false){
    if(force)cache=null;
    if(cache)return cache;
    if(loading)return loading;
    loading=Promise.all([
      TripDB.list('expenses',{order:'created_at',asc:false}),
      TripDB.list('members',{order:'sort_order'}),
      TripDB.list('categories',{order:'sort_order'})
    ]).then(([expenses,members,categories])=>({expenses,members,categories}))
      .then(data=>{cache=data;return data})
      .finally(()=>{loading=null});
    return loading;
  }

  function ensureTabs(){
    const host=$('.v38-expense-tabs');
    if(!host)return null;
    if(!host.querySelector('.v45-expense-tab')){
      host.innerHTML=`
        <button type="button" class="v45-expense-tab" data-expense-mode="mine">🙋 مصاريفي <b data-count="mine">—</b></button>
        <button type="button" class="v45-expense-tab" data-expense-mode="all">👥 كل المصاريف <b data-count="all">—</b></button>`;
    }
    updateTabState();
    return host;
  }

  function updateTabState(){
    $$('.v45-expense-tab').forEach(b=>{
      const active=b.dataset.expenseMode===mode;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',active?'true':'false');
    });
    const note=$('#v45ExpenseView');
    if(note)note.firstElementChild.textContent=mode==='mine'?'العرض الحالي: مصاريفي فقط':'العرض الحالي: كل مصاريف الرحلة';
  }

  function ensureViewNote(){
    const host=$('.v38-expense-tabs');
    if(!host)return null;
    let note=$('#v45ExpenseView');
    if(!note){
      note=document.createElement('div');
      note.id='v45ExpenseView';
      note.className='v45-expense-view';
      note.innerHTML='<div></div><div class="v45-expense-same" hidden></div>';
      host.insertAdjacentElement('afterend',note);
    }
    updateTabState();
    return note;
  }

  function updateCounts(data,member){
    const mineCount=data.expenses.filter(x=>x.payer_member_id===member.id).length;
    const allCount=data.expenses.length;
    const mineEl=$('[data-count="mine"]');
    const allEl=$('[data-count="all"]');
    if(mineEl)mineEl.textContent=`(${mineCount.toLocaleString('ar-EG')})`;
    if(allEl)allEl.textContent=`(${allCount.toLocaleString('ar-EG')})`;
    const note=ensureViewNote();
    if(note){
      const same=note.querySelector('.v45-expense-same');
      if(allCount>0&&mineCount===allCount){
        same.hidden=false;
        same.textContent='حاليًا كل المصاريف المسجلة مدفوعة بواسطتك، لذلك القائمتان نفس المحتوى.';
      }else same.hidden=true;
    }
  }

  async function editExpense(row){
    if(!row)return;
    const c=await getClient();if(!c)return;
    $('#v45Modal')?.remove();
    const back=document.createElement('div');
    back.id='v45Modal';back.className='v38-modal-backdrop';
    back.innerHTML=`<div class="v38-modal"><h3>✏️ تعديل المصروف</h3><div class="v38-modal-grid"><label style="grid-column:1/-1"><span>المبلغ</span><input id="v45Amount" class="amount-input" type="number" step="any" value="${Number(row.amount||0)}"></label><label style="grid-column:1/-1"><span>ملاحظة</span><input id="v45Note" class="text-input" value="${esc(row.note||'')}"></label></div><div class="v38-modal-actions"><button class="btn secondary" data-cancel>إلغاء</button><button class="btn" data-save>حفظ</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('[data-cancel]').onclick=()=>back.remove();
    back.onclick=e=>{if(e.target===back)back.remove()};
    back.querySelector('[data-save]').onclick=async()=>{
      const amount=Number($('#v45Amount').value||0);if(!amount)return window.toast?.('اكتب المبلغ');
      const {error}=await c.rpc('update_trip_expense',{p_expense_id:row.id,p_amount:amount,p_note:$('#v45Note').value.trim()||null,p_category_id:row.category_id});
      if(error){console.error(error);return window.toast?.('حصلت مشكلة في التعديل')}
      back.remove();window.toast?.('اتعدل ✅');await render(true);
    };
  }

  async function removeExpense(id){
    if(!confirm('تحذف المصروف؟'))return;
    await TripDB.remove('expenses',id);
    window.toast?.('اتحذف ✅');
    await render(true);
  }

  async function render(force=false){
    if(route()!=='expenses.html')return;
    ensureTabs();ensureViewNote();updateTabState();
    const list=$('#expenseList');
    const member=window.TripDB?.getMember?.();
    if(!list||!member)return;
    lastList=list;
    try{
      const data=await load(force);
      if(route()!=='expenses.html'||list!==$('#expenseList'))return;
      updateCounts(data,member);
      const names=Object.fromEntries(data.members.map(x=>[x.id,x.name]));
      const cats=Object.fromEntries(data.categories.map(x=>[x.id,x.name]));
      const rows=mode==='mine'?data.expenses.filter(x=>x.payer_member_id===member.id):data.expenses;
      list.innerHTML=`<div class="v45-owned">${rows.length?rows.map(x=>`<article class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:10px"><div><strong>${esc(cats[x.category_id]||'مصروف')}</strong><div class="muted" style="font-size:9px;margin-top:3px">${esc(names[x.payer_member_id]||'—')}${x.note?` • ${esc(x.note)}`:''}</div></div><strong>${money(x.amount)}</strong></div>${(window.TripDB?.isAdmin?.()||x.payer_member_id===member.id)?`<div class="v38-expense-actions"><button class="btn secondary v45-edit" data-id="${x.id}">✏️ تعديل</button><button class="btn danger v45-delete" data-id="${x.id}">حذف</button></div>`:''}</article>`).join(''):'<div class="v38-empty">لسه مفيش مصاريف هنا.</div>'}</div>`;
      list.querySelectorAll('.v45-edit').forEach(b=>b.onclick=()=>editExpense(data.expenses.find(x=>x.id===b.dataset.id)));
      list.querySelectorAll('.v45-delete').forEach(b=>b.onclick=()=>removeExpense(b.dataset.id));
      updateTabState();
    }catch(e){
      console.warn('[V45 expenses]',e);
      list.innerHTML='<div class="v45-owned v38-empty">حصلت مشكلة في تحميل المصاريف — جرّب تاني.</div>';
    }
  }

  // One authoritative delegated handler. It works even if another layer re-renders the tab buttons.
  if(!document.__v45ExpenseTabs){
    document.__v45ExpenseTabs=true;
    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-expense-mode],.v38-expense-tab[data-mode]');
      if(!btn||route()!=='expenses.html')return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const raw=btn.dataset.expenseMode||btn.dataset.mode;
      mode=raw==='mine'?'mine':'all';
      localStorage.setItem('expenseLogMode',mode);
      ensureTabs();ensureViewNote();updateTabState();
      render(false);
    },true);
  }

  function patchRefresh(){
    if(patchDone||!window.BazV38?.refreshCurrent)return;
    const original=window.BazV38.refreshCurrent.bind(window.BazV38);
    window.BazV38.refreshCurrent=async(...args)=>{
      const result=await original(...args);
      if(route()==='expenses.html')await render(true);
      stamp();
      return result;
    };
    patchDone=true;
  }

  function run(){
    patchRefresh();stamp();
    if(route()!=='expenses.html'){lastList=null;return;}
    ensureTabs();ensureViewNote();
    const list=$('#expenseList');
    if(!list)return;
    if(list!==lastList||!list.querySelector('.v45-owned')){lastList=list;render(false)}
  }

  const poll=setInterval(run,500);
  window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();render(false)},{once:true});else{run();render(false)}
})();
