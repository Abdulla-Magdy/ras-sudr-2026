(() => {
  if(window.__BAZ_V42__) return;
  window.__BAZ_V42__=true;

  const VERSION='V42';
  const UPDATED_AT='24/09/2026 02:42';
  const MODE_KEY='expenseLogMode';
  let mode=localStorage.getItem(MODE_KEY)||'all';
  if(!['all','mine'].includes(mode)) mode='all';
  let loading=false, queued=false, stampTimer=null;

  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const me=()=>window.TripDB?.getMember?.()||null;
  const route=()=>location.pathname.split('/').pop()||'index.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  const toast=t=>window.toast?.(t);

  function stamp(){
    $$('.v41-version,.v41-version-drawer').forEach(x=>x.remove());
    const footer=$('.v38-footer')||$('.footer');
    if(footer){
      let d=$('.v42-version');
      if(!d){d=document.createElement('div');d.className='v42-version';d.style.cssText='font-size:9px;opacity:.55;text-align:center;padding:7px 8px 92px';footer.insertAdjacentElement('afterend',d)}
      d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    }
  }

  function setActive(){
    $$('.v38-expense-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  }

  async function editExpense(row){
    if(!row)return;
    const amount=prompt('المبلغ',String(Number(row.amount||0)));
    if(amount===null)return;
    const value=Number(amount);
    if(!value||value<=0)return toast('اكتب مبلغ صحيح');
    const note=prompt('ملاحظة',row.note||'');
    if(note===null)return;
    const c=await getClient(); if(!c)return;
    const {error}=await c.rpc('update_trip_expense',{p_expense_id:row.id,p_amount:value,p_note:note.trim()||null,p_category_id:row.category_id});
    if(error){console.error(error);return toast('حصلت مشكلة في التعديل')}
    toast('اتعدل ✅');
    await renderExpensesSafe();
  }

  async function getClient(){
    const cfg=window.SUPABASE_CONFIG||{};
    if(!window.supabase||!cfg.url||!cfg.key)return null;
    if(!window.__V42_CLIENT__)window.__V42_CLIENT__=window.supabase.createClient(cfg.url,cfg.key);
    return window.__V42_CLIENT__;
  }

  async function renderExpensesSafe(){
    if(route()!=='expenses.html'||!me()||!window.TripDB?.list)return;
    if(loading){queued=true;return}
    loading=true;
    try{
      const member=me();
      const [expenses,members,categories]=await Promise.all([
        TripDB.list('expenses',{order:'created_at',asc:false}),
        TripDB.list('members',{order:'sort_order'}),
        TripDB.list('categories',{order:'sort_order'})
      ]);
      const names=Object.fromEntries(members.map(x=>[x.id,x.name]));
      const cats=Object.fromEntries(categories.map(x=>[x.id,x.name]));
      const isAdmin=!!window.TripDB?.isAdmin?.();
      const rows=mode==='mine'?expenses.filter(x=>x.payer_member_id===member.id):expenses;
      setActive();
      const list=$('#expenseList');
      if(!list)return;
      list.innerHTML=rows.length?rows.map(x=>`<article class="card v42-expense-row" data-expense-id="${x.id}" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:10px"><div><strong>${esc(cats[x.category_id]||'مصروف')}</strong><div class="muted" style="font-size:9px;margin-top:3px">${esc(names[x.payer_member_id]||'—')}${x.note?` • ${esc(x.note)}`:''}</div></div><strong>${money(x.amount)}</strong></div>${(isAdmin||x.payer_member_id===member.id)?`<div class="v38-expense-actions"><button class="btn secondary v42-edit" data-id="${x.id}">✏️ تعديل</button><button class="btn danger v42-delete" data-id="${x.id}">حذف</button></div>`:''}</article>`).join(''):'<div class="v38-empty">لسه مفيش مصاريف هنا.</div>';
      const byId=new Map(expenses.map(x=>[String(x.id),x]));
      list.querySelectorAll('.v42-edit').forEach(b=>b.onclick=e=>{e.stopPropagation();editExpense(byId.get(String(b.dataset.id)))});
      list.querySelectorAll('.v42-delete').forEach(b=>b.onclick=async e=>{e.stopPropagation();if(!confirm('تحذف المصروف؟'))return;await TripDB.remove('expenses',b.dataset.id);toast('اتحذف ✅');await renderExpensesSafe()});
    }finally{
      loading=false;
      if(queued){queued=false;setTimeout(renderExpensesSafe,30)}
    }
  }

  // Capture before V38's recursive tab handler. Switching tabs now only redraws the list,
  // instead of recursively rerunning the whole expenses enhancer and all DB work.
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.v38-expense-tab');
    if(!b||route()!=='expenses.html')return;
    const next=b.dataset.mode;
    if(!['all','mine'].includes(next))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    mode=next;
    localStorage.setItem(MODE_KEY,mode);
    setActive();
    renderExpensesSafe().catch(err=>console.warn('[V42 expenses]',err));
  },true);

  // Re-render once after V38/app hydration settles, without polling the page.
  function boot(){
    stamp();
    if(route()==='expenses.html')setTimeout(()=>renderExpensesSafe().catch(()=>{}),250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('popstate',()=>setTimeout(boot,80));
})();
