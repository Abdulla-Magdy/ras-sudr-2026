(() => {
  if (window.__KENZ_EXPENSE_TRANSPARENCY_V61__) return;
  window.__KENZ_EXPENSE_TRANSPARENCY_V61__ = true;

  const $=s=>document.querySelector(s);
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const page=()=>location.pathname.split('/').pop()||'index.html';
  let state={members:[],categories:[],expenses:[],links:[],items:[]};
  let payerFilter='all',categoryFilter='all',signature='';

  function style(){
    if($('#et61Style'))return;
    const s=document.createElement('style');s.id='et61Style';s.textContent=`
      .et61-info{font-size:9px;color:var(--muted,#9fb0bb);line-height:1.6;margin:-2px 0 10px}.et61-filters{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:10px}.et61-filters select,.et61-filters button{min-height:40px}.et61-list{display:grid;gap:8px}.et61-card{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);border-radius:15px;padding:12px}.et61-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.et61-title{font-size:12px;font-weight:1000}.et61-amount{font-size:16px;font-weight:1000;white-space:nowrap}.et61-meta{font-size:9px;color:var(--muted,#9fb0bb);margin-top:4px;line-height:1.65}.et61-note{margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.08);font-size:9px}.et61-items{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.et61-chip{font-size:8px;padding:5px 7px;border-radius:999px;border:1px solid rgba(103,227,220,.16);background:rgba(103,227,220,.07)}.et61-empty{padding:18px 8px;text-align:center;color:var(--muted,#9fb0bb);font-size:10px}.et61-count{font-size:9px;color:var(--muted,#9fb0bb);margin-top:8px;text-align:left}@media(max-width:640px){.et61-filters{grid-template-columns:1fr 1fr}.et61-filters button{grid-column:1/-1}.et61-amount{font-size:14px}}
    `;document.head.appendChild(s);
  }

  function ensureUi(){
    if(page()!=='expenses.html')return false;
    const host=$('#expenseList');if(!host)return false;
    const panel=host.closest('.v38-panel');
    if(panel){
      const head=panel.querySelector('.v38-panel-head');
      if(head){const h=head.querySelector('h2');if(h)h.textContent='سجل المصاريف المعتمدة';const sm=head.querySelector('small');if(sm)sm.textContent='ظاهر لكل أعضاء الرحلة';}
      panel.querySelector('.v38-expense-tabs')?.remove();
      if(!panel.querySelector('#et61Info')){
        const info=document.createElement('div');info.id='et61Info';info.className='et61-info';info.textContent='أي مصروف أو فاتورة بيظهر هنا لكل أعضاء الرحلة بعد اعتماد الأدمن، للشفافية.';host.before(info);
        const filters=document.createElement('div');filters.id='et61Filters';filters.className='et61-filters';filters.innerHTML=`<select id="et61Payer" class="select-input" aria-label="فلتر حسب الدافع"></select><select id="et61Category" class="select-input" aria-label="فلتر حسب البند"></select><button id="et61Reset" class="btn secondary" type="button">إلغاء الفلاتر</button>`;host.before(filters);
        $('#et61Payer').onchange=e=>{payerFilter=e.target.value;render()};
        $('#et61Category').onchange=e=>{categoryFilter=e.target.value;render()};
        $('#et61Reset').onclick=()=>{payerFilter='all';categoryFilter='all';$('#et61Payer').value='all';$('#et61Category').value='all';render()};
      }
    }
    return true;
  }

  function maps(){
    return {
      members:Object.fromEntries(state.members.map(x=>[x.id,x])),
      categories:Object.fromEntries(state.categories.map(x=>[x.id,x])),
      items:Object.fromEntries(state.items.map(x=>[x.id,x]))
    };
  }

  function fillFilters(){
    const p=$('#et61Payer'),c=$('#et61Category');if(!p||!c)return;
    const memberIds=new Set(state.expenses.map(x=>x.payer_member_id));
    const categoryIds=new Set(state.expenses.map(x=>x.category_id));
    const payerHtml='<option value="all">كل اللي دفعوا</option>'+state.members.filter(m=>memberIds.has(m.id)).map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');
    const categoryHtml='<option value="all">كل البنود</option>'+state.categories.filter(x=>categoryIds.has(x.id)).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
    if(p.innerHTML!==payerHtml)p.innerHTML=payerHtml;if(c.innerHTML!==categoryHtml)c.innerHTML=categoryHtml;
    p.value=[...p.options].some(o=>o.value===payerFilter)?payerFilter:'all';c.value=[...c.options].some(o=>o.value===categoryFilter)?categoryFilter:'all';
  }

  function render(){
    if(!ensureUi())return;
    fillFilters();
    const host=$('#expenseList');if(!host)return;
    const {members,categories,items}=maps();
    const linksByExpense={};
    state.links.forEach(l=>(linksByExpense[l.expense_id]??=[]).push(l));
    const rows=state.expenses.filter(e=>(payerFilter==='all'||e.payer_member_id===payerFilter)&&(categoryFilter==='all'||e.category_id===categoryFilter));
    host.className='et61-list';
    host.innerHTML=rows.length?rows.map(e=>{
      const linked=linksByExpense[e.id]||[];
      const isPurchase=linked.length>0;
      const payer=members[e.payer_member_id]?.name||'—';
      const category=categories[e.category_id]?.name||'مصروف';
      const when=e.created_at?new Date(e.created_at).toLocaleString('ar-EG',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'';
      const chips=linked.map(l=>{const item=items[l.shopping_item_id];const detail=l.quantity&&l.unit_price?` • ${l.quantity} × ${money(l.unit_price)}`:'';return `<span class="et61-chip">${esc(item?.name||'صنف')}${detail}</span>`}).join('');
      return `<article class="et61-card"><div class="et61-head"><div><div class="et61-title">${isPurchase?'🛒 فاتورة مشتريات':'💰 '+esc(category)}</div><div class="et61-meta">دفعها <strong>${esc(payer)}</strong>${when?' • '+esc(when):''}</div></div><div class="et61-amount">${money(e.amount)}</div></div>${chips?`<div class="et61-items">${chips}</div>`:''}${e.note?`<div class="et61-note">📝 ${esc(e.note)}</div>`:''}</article>`;
    }).join(''):'<div class="et61-empty">مفيش مصاريف معتمدة مطابقة للفلاتر دي.</div>';
    const count=document.createElement('div');count.className='et61-count';count.textContent=`${rows.length.toLocaleString('ar-EG')} حركة معتمدة`;host.appendChild(count);
  }

  async function load(force=false){
    if(page()!=='expenses.html'||!window.TripDB?.isBound?.())return;
    try{
      const [members,categories,expenses,links,items]=await Promise.all([
        window.TripDB.list('members',{order:'sort_order'}),
        window.TripDB.list('categories',{order:'sort_order'}),
        window.TripDB.list('expenses',{order:'created_at',asc:false}),
        window.TripDB.list('expense_shopping_items'),
        window.TripDB.list('shopping_items',{order:'sort_order'})
      ]);
      const sig=JSON.stringify([expenses.map(x=>[x.id,x.updated_at,x.amount]),links.map(x=>[x.expense_id,x.shopping_item_id,x.quantity,x.unit_price])]);
      state={members,categories,expenses,links,items};
      if(force||sig!==signature){signature=sig;render()}
    }catch(e){console.warn('[expense transparency]',e)}
  }

  style();
  const start=async()=>{for(let i=0;i<100&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,80));ensureUi();await load(true);try{window.TripDB?.subscribe?.('expenses',()=>load(true))}catch(_){};};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',()=>load(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load(true)});
})();