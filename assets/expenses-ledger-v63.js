(() => {
  if (window.__KENZ_EXPENSE_LEDGER_V63__) return;
  window.__KENZ_EXPENSE_LEDGER_V63__ = true;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let state={members:[],categories:[],expenses:[],links:[],items:[]};
  let payer='all',kind='all',client=null,busy=false;

  function style(){
    if($('#el63Style'))return;
    const s=document.createElement('style');s.id='el63Style';s.textContent=`
      #legacyExpenseLedger,#approvedExpenseLedgerV62{display:none!important}.el63-panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:16px}.el63-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:12px}.el63-head h2{margin:0;font-size:20px}.el63-head small{color:var(--muted,#9fb0bb)}.el63-filters{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:12px}.el63-list{display:grid;gap:10px}.el63-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:13px}.el63-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.el63-title{font-size:13px;font-weight:1000}.el63-meta{font-size:9px;color:var(--muted,#9fb0bb);margin-top:4px}.el63-amount{font-size:17px;font-weight:1000;white-space:nowrap}.el63-lines{display:grid;gap:7px;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,.1)}.el63-line{display:flex;justify-content:space-between;gap:8px;align-items:center;background:rgba(103,227,220,.055);border-radius:10px;padding:8px 9px;font-size:9px}.el63-line strong{font-size:10px}.el63-note{font-size:9px;margin-top:9px;color:var(--muted,#9fb0bb)}.el63-actions{display:flex;gap:7px;margin-top:10px;padding-top:9px;border-top:1px dashed rgba(255,255,255,.08)}.el63-actions .btn{min-height:36px;font-size:9px}.el63-lock-note{font-size:8px;color:#f1d58f;margin-top:7px}.el63-empty{text-align:center;padding:20px;color:var(--muted,#9fb0bb)}@media(max-width:640px){.el63-filters{grid-template-columns:1fr 1fr}.el63-filters button{grid-column:1/-1}.el63-head{align-items:flex-start}.el63-head h2{font-size:17px}}
    `;document.head.appendChild(s);
  }

  async function getClient(){if(client)return client;const c=window.SUPABASE_CONFIG||{};if(!window.supabase||!c.url||!c.key)return null;client=window.supabase.createClient(c.url,c.key);try{await client.auth.getSession()}catch(_){};return client}
  async function rpc(name,args={}){const c=await getClient();if(!c)throw new Error('DB_NOT_READY');const {data,error}=await c.rpc(name,args);if(error)throw error;return data}

  function ensureHost(){
    if((location.pathname.split('/').pop()||'')!=='expenses.html')return null;
    const legacy=$('#expenseList')?.closest('.section');if(!legacy)return null;legacy.id='legacyExpenseLedger';
    let sec=$('#approvedExpenseLedgerV63');if(!sec){
      sec=document.createElement('section');sec.className='section';sec.id='approvedExpenseLedgerV63';
      sec.innerHTML=`<div class="el63-panel"><div class="el63-head"><div><h2>سجل المصاريف المعتمدة</h2><small>ظاهر لكل أعضاء الرحلة بعد موافقة الأدمن</small></div><small id="el63Count">—</small></div><div class="el63-filters"><select id="el63Payer" class="select-input"></select><select id="el63Kind" class="select-input"><option value="all">كل المصاريف</option><option value="purchase">فواتير المشتريات</option><option value="general">المصاريف العامة</option></select><button id="el63Reset" class="btn secondary" type="button">إلغاء الفلاتر</button></div><div id="el63List" class="el63-list"></div></div>`;
      legacy.after(sec);
      $('#el63Payer').onchange=e=>{payer=e.target.value;render()};$('#el63Kind').onchange=e=>{kind=e.target.value;render()};$('#el63Reset').onclick=()=>{payer='all';kind='all';$('#el63Payer').value='all';$('#el63Kind').value='all';render()};
    }return sec;
  }

  async function cancelExpense(id,isPurchase){
    if(busy)return;
    const impact=isPurchase?'إلغاء الفاتورة هيرجع الأصناف للمشتريات، ويشيل قيمتها من الحسابات.':'إلغاء المصروف هيشيله من الحسابات.';
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
    const payIds=[...new Set(state.expenses.map(x=>x.payer_member_id))],p=$('#el63Payer');
    const ph='<option value="all">كل اللي دفعوا</option>'+payIds.map(id=>`<option value="${id}">${esc(members[id]?.name||'—')}</option>`).join('');if(p.innerHTML!==ph)p.innerHTML=ph;p.value=payIds.includes(payer)?payer:'all';
    const rows=state.expenses.filter(e=>{const isPurchase=(byExp[e.id]||[]).length>0;return (payer==='all'||e.payer_member_id===payer)&&(kind==='all'||(kind==='purchase'&&isPurchase)||(kind==='general'&&!isPurchase))});
    $('#el63Count').textContent=`${rows.length.toLocaleString('ar-EG')} حركة`;
    const admin=!!window.TripDB?.isAdmin?.();
    $('#el63List').innerHTML=rows.length?rows.map(e=>{
      const ls=byExp[e.id]||[],isPurchase=ls.length>0,payerName=members[e.payer_member_id]?.name||'—',title=isPurchase?'🛒 فاتورة مشتريات':'💰 '+(categories[e.category_id]?.name||'مصروف عام'),when=e.created_at?new Date(e.created_at).toLocaleString('ar-EG',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'';
      const lines=isPurchase?`<div class="el63-lines">${ls.map(l=>{const item=items[l.shopping_item_id]?.name||'صنف',priced=Number(l.quantity)>0&&Number(l.unit_price)>0;return `<div class="el63-line"><span><strong>${esc(item)}</strong>${priced?` — ${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(l.quantity))} × ${money(l.unit_price)}`:' — سعر تفصيلي غير متاح'}</span><strong>${priced?money(l.line_total):''}</strong></div>`}).join('')}</div>`:'';
      const actions=admin?`<div class="el63-actions"><button class="btn secondary el63-cancel" type="button" data-id="${e.id}" data-purchase="${isPurchase?'1':'0'}">↩️ إلغاء مع سبب</button></div><div class="el63-lock-note">الحذف المباشر مقفول؛ أي إلغاء بيتسجل في سجل التعديلات.</div>`:'';
      return `<article class="el63-card" data-expense-id="${e.id}"><div class="el63-top"><div><div class="el63-title">${title}</div><div class="el63-meta">دفعها ${esc(payerName)}${when?' • '+esc(when):''}</div></div><div class="el63-amount">${money(e.amount)}</div></div>${lines}${e.note?`<div class="el63-note">📝 ${esc(e.note)}</div>`:''}${actions}</article>`;
    }).join(''):'<div class="el63-empty">مفيش مصاريف معتمدة مطابقة للفلاتر.</div>';
    $$('.el63-cancel').forEach(btn=>btn.onclick=()=>cancelExpense(btn.dataset.id,btn.dataset.purchase==='1'));
  }

  async function load(){if(!window.TripDB?.isBound?.())return;try{const [members,categories,expenses,links,items]=await Promise.all([TripDB.list('members',{order:'sort_order'}),TripDB.list('categories',{order:'sort_order'}),TripDB.list('expenses',{order:'created_at',asc:false}),TripDB.list('expense_shopping_items'),TripDB.list('shopping_items',{order:'sort_order'})]);state={members,categories,expenses,links,items};render()}catch(e){console.warn('[V63 ledger]',e)}}
  async function start(){style();for(let i=0;i<120&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,80));ensureHost();await load();setInterval(load,12000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();window.addEventListener('pageshow',load);
})();