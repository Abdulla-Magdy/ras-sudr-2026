(() => {
  if (window.__BAZ_V44__) return;
  window.__BAZ_V44__ = true;

  const VERSION='V44';
  const UPDATED_AT='24/09/2026 03:50';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const route=()=>location.pathname.split('/').pop()||'index.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';

  let mode=localStorage.getItem('expenseLogMode')==='mine'?'mine':'all';
  let cache=null, loading=null, patched=false, client=null, lastList=null;

  const style=document.createElement('style');
  style.id='v44-style';
  style.textContent=`
    .v42-version,.v42-version-drawer{display:none!important}
    .v44-version{font-size:9px;opacity:.55;text-align:center;padding:7px 8px 92px}
    .v44-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}
    .v44-expense-tab{border:0;background:rgba(255,255,255,.04);color:var(--muted,#9fb0bb);border-radius:999px;padding:10px 14px;font-weight:900;cursor:pointer}
    .v44-expense-tab.active{background:rgba(103,227,220,.16);color:#fff;box-shadow:inset 0 0 0 1px rgba(103,227,220,.28)}
    @media(min-width:761px){.v44-version{padding-bottom:18px}}
  `;
  document.head.appendChild(style);

  function stamp(){
    const footer=$('.v38-footer')||$('.footer');
    if(footer){
      let d=$('.v44-version');
      if(!d){d=document.createElement('div');d.className='v44-version';footer.insertAdjacentElement('afterend',d)}
      const next=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
      if(d.innerHTML!==next)d.innerHTML=next;
    }
    const actions=$('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){
      let d=$('.v44-version-drawer');
      if(!d){d=document.createElement('div');d.className='v44-version-drawer';actions.insertAdjacentElement('afterend',d)}
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
    ]).then(([expenses,members,categories])=>cache={expenses,members,categories}).finally(()=>{loading=null});
    return loading;
  }

  function tabs(){
    const host=$('.v38-expense-tabs');
    if(!host)return null;
    if(!host.dataset.v44){
      host.dataset.v44='1';
      host.innerHTML=`<button type="button" class="v44-expense-tab" data-mode="mine">🙋 مصاريفي</button><button type="button" class="v44-expense-tab" data-mode="all">👥 كل المصاريف</button>`;
      host.querySelectorAll('.v44-expense-tab').forEach(btn=>{
        btn.onclick=()=>{
          const next=btn.dataset.mode==='mine'?'mine':'all';
          if(next===mode){setActive();return;}
          mode=next;
          localStorage.setItem('expenseLogMode',mode);
          setActive();
          render(false);
        };
      });
    }
    setActive();
    return host;
  }

  function setActive(){
    $$('.v44-expense-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  }

  async function editExpense(row){
    if(!row)return;
    const c=await getClient(); if(!c)return;
    $('#v44Modal')?.remove();
    const back=document.createElement('div');
    back.id='v44Modal';back.className='v38-modal-backdrop';
    back.innerHTML=`<div class="v38-modal"><h3>✏️ تعديل المصروف</h3><div class="v38-modal-grid"><label style="grid-column:1/-1"><span>المبلغ</span><input id="v44Amount" class="amount-input" type="number" step="any" value="${Number(row.amount||0)}"></label><label style="grid-column:1/-1"><span>ملاحظة</span><input id="v44Note" class="text-input" value="${esc(row.note||'')}"></label></div><div class="v38-modal-actions"><button class="btn secondary" data-cancel>إلغاء</button><button class="btn" data-save>حفظ</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('[data-cancel]').onclick=()=>back.remove();
    back.onclick=e=>{if(e.target===back)back.remove()};
    back.querySelector('[data-save]').onclick=async()=>{
      const amount=Number($('#v44Amount').value||0);if(!amount)return window.toast?.('اكتب المبلغ');
      const {error}=await c.rpc('update_trip_expense',{p_expense_id:row.id,p_amount:amount,p_note:$('#v44Note').value.trim()||null,p_category_id:row.category_id});
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
    tabs();
    const list=$('#expenseList');
    const member=window.TripDB?.getMember?.();
    if(!list||!member)return;
    lastList=list;
    if(!list.querySelector('.v44-owned')) list.innerHTML='<div class="v44-owned v38-empty">بنحمّل المصاريف…</div>';
    try{
      const data=await load(force);
      if(route()!=='expenses.html'||list!==$('#expenseList'))return;
      const names=Object.fromEntries(data.members.map(x=>[x.id,x.name]));
      const cats=Object.fromEntries(data.categories.map(x=>[x.id,x.name]));
      const rows=mode==='mine'?data.expenses.filter(x=>x.payer_member_id===member.id):data.expenses;
      list.innerHTML=`<div class="v44-owned">${rows.length?rows.map(x=>`<article class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:10px"><div><strong>${esc(cats[x.category_id]||'مصروف')}</strong><div class="muted" style="font-size:9px;margin-top:3px">${esc(names[x.payer_member_id]||'—')}${x.note?` • ${esc(x.note)}`:''}</div></div><strong>${money(x.amount)}</strong></div>${(window.TripDB?.isAdmin?.()||x.payer_member_id===member.id)?`<div class="v38-expense-actions"><button class="btn secondary v44-edit" data-id="${x.id}">✏️ تعديل</button><button class="btn danger v44-delete" data-id="${x.id}">حذف</button></div>`:''}</article>`).join(''):'<div class="v38-empty">لسه مفيش مصاريف هنا.</div>'}</div>`;
      list.querySelectorAll('.v44-edit').forEach(b=>b.onclick=()=>editExpense(data.expenses.find(x=>x.id===b.dataset.id)));
      list.querySelectorAll('.v44-delete').forEach(b=>b.onclick=()=>removeExpense(b.dataset.id));
      setActive();
    }catch(e){
      console.warn('[V44 expenses]',e);
      list.innerHTML='<div class="v44-owned v38-empty">حصلت مشكلة في تحميل المصاريف — جرّب تاني.</div>';
    }
  }

  function patchRefresh(){
    if(patched||!window.BazV38?.refreshCurrent)return;
    const original=window.BazV38.refreshCurrent.bind(window.BazV38);
    window.BazV38.refreshCurrent=async(...args)=>{
      const result=await original(...args);
      if(route()==='expenses.html')await render(true);
      stamp();
      return result;
    };
    patched=true;
  }

  function run(){
    patchRefresh();stamp();
    if(route()!=='expenses.html'){lastList=null;return;}
    tabs();
    const list=$('#expenseList');
    if(!list)return;
    if(list!==lastList){lastList=list;cache=null;render(false);return;}
    if(!list.querySelector('.v44-owned')) render(false);
  }

  const poll=setInterval(run,400);
  window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();render(false)},{once:true});else{run();render(false)}
})();
