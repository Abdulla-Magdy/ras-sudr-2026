(() => {
  if (window.__KENZ_EXPENSE_LEDGER_V64__) return;
  window.__KENZ_EXPENSE_LEDGER_V64__ = true;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let state={members:[],categories:[],expenses:[],links:[],items:[]};
  let payer='all',kind='all',client=null,busy=false;

  function style(){
    if($('#el64Style'))return;
    const s=document.createElement('style');s.id='el64Style';s.textContent=`
      #legacyExpenseLedger{display:none!important}.el64-summary{display:flex;align-items:center;justify-content:space-between;gap:10px}.el64-summary small{font-size:8px;color:var(--muted,#9fb0bb);font-weight:700}.el64-panel{padding:14px 2px 2px}.el64-note-top{font-size:9px;color:var(--muted,#9fb0bb);margin:0 2px 12px}.el64-filters{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:12px}.el64-list{display:grid;gap:10px}.el64-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:13px}.el64-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.el64-title{font-size:13px;font-weight:1000}.el64-meta{font-size:9px;color:var(--muted,#9fb0bb);margin-top:4px}.el64-amount{font-size:17px;font-weight:1000;white-space:nowrap}.el64-lines{display:grid;gap:7px;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,.1)}.el64-line{display:flex;justify-content:space-between;gap:8px;align-items:center;background:rgba(103,227,220,.055);border-radius:10px;padding:8px 9px;font-size:9px}.el64-line strong{font-size:10px}.el64-note{font-size:9px;margin-top:9px;color:var(--muted,#9fb0bb)}.el64-actions{display:flex;gap:7px;margin-top:10px;padding-top:9px;border-top:1px dashed rgba(255,255,255,.08)}.el64-actions .btn{min-height:36px;font-size:9px}.el64-lock-note{font-size:8px;color:#f1d58f;margin-top:7px}.el64-empty{text-align:center;padding:20px;color:var(--muted,#9fb0bb)}@media(max-width:640px){.el64-filters{grid-template-columns:1fr 1fr}.el64-filters button{grid-column:1/-1}.el64-amount{font-size:15px}}
    `;document.head.appendChild(s);
  }

  async function getClient(){if(client)return client;const c=window.SUPABASE_CONFIG||{};if(!window.supabase||!c.url||!c.key)return null;client=window.supabase.createClient(c.url,c.key);try{await client.auth.getSession()}catch(_){};return client}
  async function rpc(name,args={}){const c=await getClient();if(!c)throw new Error('DB_NOT_READY');const {data,error}=await c.rpc(name,args);if(error)throw error;return data}

  function ensureHost(){
    if((location.pathname.split('/').pop()||'')!=='expenses.html')return null;
    const details=$('#approvedExpenseLedgerV64');
    if(!details)return null;
    const mount=$('#el64Mount');
    if(mount&&!mount.dataset.ready){
      mount.dataset.ready='1';
      mount.innerHTML=`<div class="el64-panel"><div class="el64-note-top">ظاهر لكل أعضاء الرحلة بعد موافقة الأدمن فقط.</div><div class="el64-filters"><select id="el64Payer" class="select-input"></select><select id="el64Kind" class="select-input"><option value="all">كل المصاريف</option><option value="purchase">فواتير المشتريات</option><option value="general">المصاريف العامة</option></select><button id="el64Reset" class="btn secondary" type="button">إلغاء الفلاتر</button></div><div id="el64List" class="el64-list"><div class="el64-empty">بنحمّل السجل…</div></div></div>`;
      $('#el64Payer').onchange=e=>{payer=e.target.value;render()};
      $('#el64Kind').onchange=e=>{kind=e.target.value;render()};
      $('#el64Reset').onclick=()=>{payer='all';kind='all';$('#el64Payer').value='all';$('#el64Kind').value='all';render()};
    }
    return details;
  }

  async function cancelExpense(id,isPurchase){
    if(busy)return;
    const impact=isPurchase?'إلغاء الفاتورة هيرجع الأصناف للمشتريات ويشيل قيمتها من الحسابات.':'إلغاء المصروف هيشيله من الحسابات.';
    if(!confirm(`${impact}\n\nتكمل؟`))return;
    const reason=prompt('اكتب سبب الإلغاء (إجباري):','');if(reason===null)return;if(reason.trim().length<3){window.toast?.('اكتب سبب واضح للإلغاء');return}
    busy=true;
    try{
      const r=await rpc('admin_cancel_approved_expense',{p_expense_id:id,p_reason:reason.trim()});
      window.toast?.(isPurchase?`اتلغت الفاتورة ورجع ${Number(r?.reopened_items||0).toLocaleString('ar-EG')} صنف للمشتريات ✅`:'تم إلغاء المصروف ✅');
      await load();try{await window.renderPurchaseQueue?.();await window.renderExpenses?.();await window.renderFood?.()}catch(_){}
    }catch(e){
      const m=String(e?.message||e||'');
      if(m.includes('EXPENSE_HAS_LEFTOVER_ACTIVITY'))window.toast?.('مينفعش تلغي الفاتورة بعد ما بدأ توزيع بواقي مرتبطة بيها');
      else if(m.includes('CANCEL_REASON_REQUIRED'))window.toast?.('سبب الإلغاء مطلوب');
      else window.toast?.('ما قدرناش نلغي العملية — راجع البيانات وحاول تاني');
    }finally{busy=false}
  }

  function render(){
    if(!ensureHost())return;
    const members=Object.fromEntries(state.members.map(x=>[x.id,x])),categories=Object.fromEntries(state.categories.map(x=>[x.id,x])),items=Object.fromEntries(state.items.map(x=>[x.id,x]));
    const byExp={};state.links.forEach(l=>(byExp[l.expense_id]??=[]).push(l));
    const payIds=[...new Set(state.expenses.map(x=>x.payer_member_id))],p=$('#el64Payer');
    const ph='<option value="all">كل اللي دفعوا</option>'+payIds.map(id=>`<option value="${id}">${esc(members[id]?.name||'—')}</option>`).join('');if(p&&p.innerHTML!==ph)p.innerHTML=ph;if(p)p.value=payIds.includes(payer)?payer:'all';
    const rows=state.expenses.filter(e=>{const isPurchase=(byExp[e.id]||[]).length>0;return (payer==='all'||e.payer_member_id===payer)&&(kind==='all'||(kind==='purchase'&&isPurchase)||(kind==='general'&&!isPurchase))});
    const count=$('#el64SummaryCount');if(count)count.textContent=`${state.expenses.length.toLocaleString('ar-EG')} حركة`;
    const admin=!!window.TripDB?.isAdmin?.(),list=$('#el64List');if(!list)return;
    list.innerHTML=rows.length?rows.map(e=>{
      const ls=byExp[e.id]||[],isPurchase=ls.length>0,payerName=members[e.payer_member_id]?.name||'—',title=isPurchase?'🛒 فاتورة مشتريات':'💰 '+(categories[e.category_id]?.name||'مصروف عام'),when=e.created_at?new Date(e.created_at).toLocaleString('ar-EG',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'';
      const lines=isPurchase?`<div class="el64-lines">${ls.map(l=>{const item=items[l.shopping_item_id]?.name||'صنف',priced=Number(l.quantity)>0&&Number(l.unit_price)>0;return `<div class="el64-line"><span><strong>${esc(item)}</strong>${priced?` — ${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(l.quantity))} × ${money(l.unit_price)}`:' — سعر تفصيلي غير متاح'}</span><strong>${priced?money(l.line_total):''}</strong></div>`}).join('')}</div>`:'';
      const actions=admin?`<div class="el64-actions"><button class="btn secondary el64-cancel" type="button" data-id="${e.id}" data-purchase="${isPurchase?'1':'0'}">↩️ إلغاء مع سبب</button></div><div class="el64-lock-note">الحذف المباشر مقفول؛ أي إلغاء بيتسجل في سجل التعديلات.</div>`:'';
      return `<article class="el64-card" data-expense-id="${e.id}"><div class="el64-top"><div><div class="el64-title">${title}</div><div class="el64-meta">دفعها ${esc(payerName)}${when?' • '+esc(when):''}</div></div><div class="el64-amount">${money(e.amount)}</div></div>${lines}${e.note?`<div class="el64-note">📝 ${esc(e.note)}</div>`:''}${actions}</article>`;
    }).join(''):'<div class="el64-empty">مفيش مصاريف معتمدة مطابقة للفلاتر.</div>';
    $$('.el64-cancel').forEach(btn=>btn.onclick=()=>cancelExpense(btn.dataset.id,btn.dataset.purchase==='1'));
  }

  async function load(){if(!window.TripDB?.isBound?.())return;try{const [members,categories,expenses,links,items]=await Promise.all([TripDB.list('members',{order:'sort_order'}),TripDB.list('categories',{order:'sort_order'}),TripDB.list('expenses',{order:'created_at',asc:false}),TripDB.list('expense_shopping_items'),TripDB.list('shopping_items',{order:'sort_order'})]);state={members,categories,expenses,links,items};render()}catch(e){console.warn('[V64 ledger]',e)}}
  async function start(){style();for(let i=0;i<120&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,80));ensureHost();await load();setInterval(load,12000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();window.addEventListener('pageshow',load);
})();