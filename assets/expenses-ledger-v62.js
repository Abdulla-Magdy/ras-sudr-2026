(() => {
  if (window.__KENZ_EXPENSE_LEDGER_V62__) return;
  window.__KENZ_EXPENSE_LEDGER_V62__ = true;
  const $=s=>document.querySelector(s);
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let state={members:[],categories:[],expenses:[],links:[],items:[]};
  let payer='all',kind='all';

  function style(){
    if($('#el62Style'))return;
    const s=document.createElement('style');s.id='el62Style';s.textContent=`
      #legacyExpenseLedger{display:none!important}.el62-panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:16px}.el62-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:12px}.el62-head h2{margin:0;font-size:20px}.el62-head small{color:var(--muted,#9fb0bb)}.el62-filters{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:12px}.el62-list{display:grid;gap:10px}.el62-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:13px}.el62-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.el62-title{font-size:13px;font-weight:1000}.el62-meta{font-size:9px;color:var(--muted,#9fb0bb);margin-top:4px}.el62-amount{font-size:17px;font-weight:1000;white-space:nowrap}.el62-lines{display:grid;gap:7px;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,.1)}.el62-line{display:flex;justify-content:space-between;gap:8px;align-items:center;background:rgba(103,227,220,.055);border-radius:10px;padding:8px 9px;font-size:9px}.el62-line strong{font-size:10px}.el62-note{font-size:9px;margin-top:9px;color:var(--muted,#9fb0bb)}.el62-empty{text-align:center;padding:20px;color:var(--muted,#9fb0bb)}@media(max-width:640px){.el62-filters{grid-template-columns:1fr 1fr}.el62-filters button{grid-column:1/-1}.el62-head{align-items:flex-start}.el62-head h2{font-size:17px}}
    `;document.head.appendChild(s);
  }

  function ensureHost(){
    if((location.pathname.split('/').pop()||'')!=='expenses.html')return null;
    const legacy=$('#expenseList')?.closest('.section');
    if(!legacy)return null;
    legacy.id='legacyExpenseLedger';
    let sec=$('#approvedExpenseLedgerV62');
    if(!sec){
      sec=document.createElement('section');sec.className='section';sec.id='approvedExpenseLedgerV62';
      sec.innerHTML=`<div class="el62-panel"><div class="el62-head"><div><h2>سجل المصاريف المعتمدة</h2><small>ظاهر لكل أعضاء الرحلة بعد موافقة الأدمن</small></div><small id="el62Count">—</small></div><div class="el62-filters"><select id="el62Payer" class="select-input"></select><select id="el62Kind" class="select-input"><option value="all">كل المصاريف</option><option value="purchase">فواتير المشتريات</option><option value="general">المصاريف العامة</option></select><button id="el62Reset" class="btn secondary" type="button">إلغاء الفلاتر</button></div><div id="el62List" class="el62-list"></div></div>`;
      legacy.after(sec);
      $('#el62Payer').onchange=e=>{payer=e.target.value;render()};
      $('#el62Kind').onchange=e=>{kind=e.target.value;render()};
      $('#el62Reset').onclick=()=>{payer='all';kind='all';$('#el62Payer').value='all';$('#el62Kind').value='all';render()};
    }
    return sec;
  }

  function render(){
    if(!ensureHost())return;
    const members=Object.fromEntries(state.members.map(x=>[x.id,x]));
    const categories=Object.fromEntries(state.categories.map(x=>[x.id,x]));
    const items=Object.fromEntries(state.items.map(x=>[x.id,x]));
    const byExp={};state.links.forEach(l=>(byExp[l.expense_id]??=[]).push(l));
    const payIds=[...new Set(state.expenses.map(x=>x.payer_member_id))];
    const p=$('#el62Payer');
    const ph='<option value="all">كل اللي دفعوا</option>'+payIds.map(id=>`<option value="${id}">${esc(members[id]?.name||'—')}</option>`).join('');
    if(p.innerHTML!==ph)p.innerHTML=ph;p.value=payIds.includes(payer)?payer:'all';
    const rows=state.expenses.filter(e=>{
      const isPurchase=(byExp[e.id]||[]).length>0;
      return (payer==='all'||e.payer_member_id===payer)&&(kind==='all'||(kind==='purchase'&&isPurchase)||(kind==='general'&&!isPurchase));
    });
    $('#el62Count').textContent=`${rows.length.toLocaleString('ar-EG')} حركة`;
    $('#el62List').innerHTML=rows.length?rows.map(e=>{
      const ls=byExp[e.id]||[];const isPurchase=ls.length>0;
      const payerName=members[e.payer_member_id]?.name||'—';
      const title=isPurchase?'🛒 فاتورة مشتريات':'💰 '+(categories[e.category_id]?.name||'مصروف عام');
      const when=e.created_at?new Date(e.created_at).toLocaleString('ar-EG',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'';
      const lines=isPurchase?`<div class="el62-lines">${ls.map(l=>{const item=items[l.shopping_item_id]?.name||'صنف';const priced=Number(l.quantity)>0&&Number(l.unit_price)>0;return `<div class="el62-line"><span><strong>${esc(item)}</strong>${priced?` — ${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(l.quantity))} × ${money(l.unit_price)}`:' — سعر تفصيلي غير متاح'}</span><strong>${priced?money(l.line_total):''}</strong></div>`}).join('')}</div>`:'';
      return `<article class="el62-card"><div class="el62-top"><div><div class="el62-title">${title}</div><div class="el62-meta">دفعها ${esc(payerName)}${when?' • '+esc(when):''}</div></div><div class="el62-amount">${money(e.amount)}</div></div>${lines}${e.note?`<div class="el62-note">📝 ${esc(e.note)}</div>`:''}</article>`;
    }).join(''):'<div class="el62-empty">مفيش مصاريف معتمدة مطابقة للفلاتر.</div>';
  }

  async function load(){
    if(!window.TripDB?.isBound?.())return;
    try{
      const [members,categories,expenses,links,items]=await Promise.all([
        TripDB.list('members',{order:'sort_order'}),TripDB.list('categories',{order:'sort_order'}),TripDB.list('expenses',{order:'created_at',asc:false}),TripDB.list('expense_shopping_items'),TripDB.list('shopping_items',{order:'sort_order'})
      ]);
      state={members,categories,expenses,links,items};render();
    }catch(e){console.warn('[V62 ledger]',e)}
  }
  async function start(){style();for(let i=0;i<120&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,80));ensureHost();await load();setInterval(load,12000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',load);
})();