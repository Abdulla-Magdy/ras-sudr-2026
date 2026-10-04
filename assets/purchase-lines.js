(() => {
  if(window.__KENZ_PURCHASE_LINES__) return;
  window.__KENZ_PURCHASE_LINES__=true;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const page=()=>location.pathname.split('/').pop()||'index.html';
  const money=v=>new Intl.NumberFormat('ar-EG',{minimumFractionDigits:Number.isInteger(Number(v||0))?0:2,maximumFractionDigits:2}).format(Number(v||0))+' ج';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let itemMap={}, patchedSubmit=false, patchedFinance=false, approvalClient=null;

  function injectStyles(){
    if($('#pl53Style')) return;
    const s=document.createElement('style');s.id='pl53Style';s.textContent=`
      .pl53-line{display:grid;grid-template-columns:minmax(90px,.8fr) minmax(100px,1fr) auto;gap:8px;align-items:end;width:100%;padding:9px 0 2px;grid-column:1/-1}.pl53-line label{display:grid;gap:4px;font-size:8px;color:var(--muted,#9fb0bb)}.pl53-line input{width:100%;box-sizing:border-box}.pl53-total{font-weight:1000;font-size:11px;white-space:nowrap;padding-bottom:9px}.purchase-queue-item.pl53-selected{border-color:rgba(103,227,220,.35);background:rgba(103,227,220,.06)}.purchase-queue-item:not(.pl53-selected) .pl53-line{opacity:.45}.pl53-help{font-size:8px;color:var(--muted,#9fb0bb);margin:7px 0 0}.pl53-leftovers-link{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:12px 14px;border-radius:14px;text-decoration:none;color:inherit;background:rgba(103,227,220,.07);border:1px solid rgba(103,227,220,.18)}.pl53-leftovers-link strong{font-size:11px}.pl53-leftovers-link small{display:block;color:var(--muted,#9fb0bb);font-size:8px;margin-top:3px}.pl53-price-detail{margin-top:7px;padding-top:7px;border-top:1px dashed rgba(255,255,255,.08);font-size:8px;color:var(--muted,#9fb0bb);display:grid;gap:3px}.pl53-price-row{display:flex;justify-content:space-between;gap:10px}.pl53-personal-charge{font-size:8px;color:#f1d58f;margin-top:3px}
      @media(max-width:600px){.pl53-line{grid-template-columns:1fr 1fr}.pl53-total{grid-column:1/-1;padding-bottom:0}.purchase-queue-item{flex-wrap:wrap}}
    `;document.head.appendChild(s);
  }

  async function loadItems(){
    try{
      const rows=await window.TripDB?.list?.('shopping_items',{order:'sort_order'})||[];
      itemMap=Object.fromEntries(rows.map(x=>[x.id,x]));
    }catch(_){itemMap={}}
  }

  function lineValues(row){
    const cb=row.querySelector('.purchase-item-check');
    const qty=Number(row.querySelector('.pl53-qty')?.value||0);
    const unitPrice=Number(row.querySelector('.pl53-price')?.value||0);
    return {item_id:cb?.value,quantity:qty,unit_price:unitPrice,line_total:Math.round(qty*unitPrice*100)/100};
  }

  function recalc(){
    const selected=$$('.purchase-item-check:checked').map(cb=>cb.closest('.purchase-queue-item')).filter(Boolean);
    const lines=selected.map(lineValues);
    const valid=lines.length>0 && lines.every(x=>x.quantity>0&&x.unit_price>0);
    const total=Math.round(lines.reduce((s,x)=>s+x.line_total,0)*100)/100;
    const amount=$('#purchaseBatchAmount');if(amount){amount.value=total?String(total):'';amount.readOnly=true;}
    const counter=$('#selectedPurchaseCount');if(counter)counter.textContent=`${selected.length} مختارين • ${money(total)}`;
    const btn=$('#recordPurchaseBatch');
    if(btn){btn.disabled=!valid;btn.textContent=valid?`✓ ابعت الفاتورة للمراجعة — ${money(total)}`:(selected.length?'كمّل سعر وكمية كل صنف':'اختار المشتريات الأول');}
    selected.forEach(row=>{const v=lineValues(row);const t=row.querySelector('.pl53-total');if(t)t.textContent=money(v.line_total)});
  }

  function decorateQueue(){
    if(page()!=='expenses.html')return;
    const amount=$('#purchaseBatchAmount');
    if(amount){amount.readOnly=true;amount.placeholder='بيتحسب تلقائيًا';const sp=amount.closest('label')?.querySelector('span');if(sp)sp.textContent='إجمالي الفاتورة المحسوب';}
    const footer=$('.purchase-batch-footer');
    if(footer&&!footer.querySelector('.pl53-help')){const p=document.createElement('div');p.className='pl53-help';p.textContent='لازم تسجل الكمية الفعلية وسعر الوحدة لكل صنف. الإجمالي بيتحسب تلقائيًا.';footer.prepend(p);}

    $$('.purchase-queue-item').forEach(row=>{
      const cb=row.querySelector('.purchase-item-check');if(!cb)return;
      if(!row.querySelector('.pl53-line')){
        const item=itemMap[cb.value]||{};
        const defaultQty=Number(item.actual_qty||item.planned_qty||1)||1;
        const d=document.createElement('div');d.className='pl53-line';d.innerHTML=`<label><span>الكمية الفعلية</span><input class="qty-input pl53-qty" type="number" min="0.01" step="0.01" inputmode="decimal" value="${defaultQty}"></label><label><span>سعر الوحدة</span><input class="amount-input pl53-price" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0"></label><strong class="pl53-total">0 ج</strong>`;row.appendChild(d);
      }
      const sync=()=>{row.classList.toggle('pl53-selected',cb.checked);row.querySelectorAll('.pl53-line input').forEach(i=>i.disabled=!cb.checked);recalc();};
      cb.onchange=sync;
      row.querySelectorAll('.pl53-line input').forEach(i=>i.oninput=recalc);
      sync();
    });
    recalc();
  }

  async function submitPurchase(){
    const btn=$('#recordPurchaseBatch');if(!btn)return;
    const selected=$$('.purchase-item-check:checked').map(cb=>cb.closest('.purchase-queue-item')).filter(Boolean);
    const lines=selected.map(lineValues);
    if(!lines.length){window.toast?.('اختار المشتريات الأول');return}
    if(lines.some(x=>x.quantity<=0||x.unit_price<=0)){window.toast?.('لازم تدخل الكمية والسعر لكل صنف');return}
    const total=Math.round(lines.reduce((s,x)=>s+x.line_total,0)*100)/100;
    const payerId=window.TripDB.isAdmin()?($('#purchaseQueuePayer')?.value||window.TripDB.getMember().id):window.TripDB.getMember().id;
    const note=$('#purchaseBatchNote')?.value.trim()||'';
    btn.disabled=true;
    try{
      await window.TripDB.recordPurchaseBatch(payerId,lines.map(x=>x.item_id),total,note,lines);
      if($('#purchaseBatchNote'))$('#purchaseBatchNote').value='';
      window.toast?.('الفاتورة اتبعتت للأدمن للمراجعة ⏳');
      setTimeout(()=>location.reload(),450);
    }catch(e){
      console.error('[purchase-lines]',e);
      const m=String(e?.message||e||'');
      const msg=m.includes('ITEM_PENDING_APPROVAL')?'في صنف منهم مستني اعتماد بالفعل':m.includes('ITEM_PRICES_REQUIRED')?'لازم تسجل سعر كل صنف':m.includes('PURCHASE_LINES_MISMATCH')?'راجع الأصناف والكميات':m.includes('PURCHASE_TOTAL_MISMATCH')?'راجع إجمالي أسعار الأصناف':m.includes('ITEM_ALREADY_PURCHASED')?'في صنف متسجل كمشترى بالفعل':m.includes('ITEM_NOT_ASSIGNED_TO_PAYER')?'في صنف مش مسؤول عنه الشخص المختار':'حصلت مشكلة في تسجيل الفاتورة';
      window.toast?.(msg);
      btn.disabled=false;
    }
  }

  function patchSubmit(){
    if(page()!=='expenses.html'||patchedSubmit)return;
    const btn=$('#recordPurchaseBatch');if(!btn||typeof btn.onclick!=='function')return;
    btn.onclick=submitPurchase;patchedSubmit=true;decorateQueue();
  }

  function addLeftoversLink(){
    if(page()!=='expenses.html'||$('#pl53LeftoversLink'))return;
    const section=$('.v38-expense-summary')?.closest('.section');if(!section)return;
    const a=document.createElement('a');a.id='pl53LeftoversLink';a.className='pl53-leftovers-link';a.href='leftovers.html';a.innerHTML='<div><strong>🧺 تصفية بواقي الرحلة</strong><small>سجّل اللي فاض ومين أخده قبل التسوية النهائية</small></div><span>←</span>';section.appendChild(a);
  }

  async function applyAdjustedFinance(){
    if(page()!=='expenses.html'||!window.TripDB?.leftoverCharges)return;
    try{
      const [expenses,members,charges]=await Promise.all([
        window.TripDB.list('expenses',{order:'created_at',asc:false}),
        window.TripDB.list('members',{order:'sort_order'}),
        window.TripDB.leftoverCharges()
      ]);
      const total=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
      const personalTotal=Number(charges?.total||0);
      const chargeMap=Object.fromEntries((charges?.by_member||[]).map(x=>[x.member_id,Number(x.amount||0)]));
      const active=members.filter(m=>m.confirmed!==false);
      const baseShare=active.length?Math.max(0,total-personalTotal)/active.length:0;
      const paid={};members.forEach(m=>paid[m.id]=0);expenses.forEach(x=>paid[x.payer_member_id]=(paid[x.payer_member_id]||0)+Number(x.amount||0));
      const people=members.map(m=>{const included=m.confirmed!==false;const personal=chargeMap[m.id]||0;const share=(included?baseShare:0)+personal;return{id:m.id,name:m.name,paid:paid[m.id]||0,share,personal,net:(paid[m.id]||0)-share,included}}).filter(p=>p.included||p.paid>0||p.personal>0);
      const me=window.TripDB.getMember();const mine=people.find(p=>p.id===me?.id);
      if($('#v38TripTotal'))$('#v38TripTotal').textContent=money(total);
      if($('#v38MyPaid')&&mine)$('#v38MyPaid').textContent=money(mine.paid);
      if($('#v38MyShare')&&mine)$('#v38MyShare').textContent=money(mine.share);
      if($('#v38MyNet')&&mine)$('#v38MyNet').textContent=(mine.net>=0?'+':'')+money(mine.net);
      if($('#shareExpense'))$('#shareExpense').textContent=money(baseShare);
      if($('#shareCaption'))$('#shareCaption').textContent=`القسمة الجماعية ${money(baseShare)} للفرد${personalTotal>0?' + قيمة البواقي اللي كل شخص أخدها':''}`;
      if($('#settlementBody'))$('#settlementBody').innerHTML=people.map(p=>`<tr class="${p.included?'':'excluded-row'}"><td><strong>${esc(p.name)}</strong>${p.personal?`<div class="pl53-personal-charge">+ بواقي ${money(p.personal)}</div>`:''}</td><td>${money(p.paid)}</td><td>${money(p.share)}</td><td class="${p.net>0?'net-credit':p.net<0?'net-debt':'net-zero'}">${p.net>=0?'+':''}${money(p.net)}</td><td>${p.net>.005?`<span class="balance-badge credit">له ${money(p.net)}</span>`:p.net<-.005?`<span class="balance-badge debt">عليه ${money(Math.abs(p.net))}</span>`:'<span class="balance-badge settled">خالص ✓</span>'}</td></tr>`).join('');
      if($('#settlementCards'))$('#settlementCards').innerHTML=people.map(p=>`<article class="settlement-person-card"><div class="settlement-person-head"><div><strong>${esc(p.name)}</strong>${p.personal?`<small>بواقي شخصية: ${money(p.personal)}</small>`:''}</div>${p.net>.005?`<span class="balance-badge credit">له ${money(p.net)}</span>`:p.net<-.005?`<span class="balance-badge debt">عليه ${money(Math.abs(p.net))}</span>`:'<span class="balance-badge settled">خالص ✓</span>'}</div><div class="settlement-person-grid"><div><span>دفع</span><strong>${money(p.paid)}</strong></div><div><span>نصيبه</span><strong>${money(p.share)}</strong></div><div class="settlement-net"><span>الصافي</span><strong>${p.net>=0?'+':''}${money(p.net)}</strong></div></div></article>`).join('');
      const creditors=people.filter(p=>p.net>.005).map(p=>({...p,r:p.net})), debtors=people.filter(p=>p.net<-.005).map(p=>({...p,r:-p.net}));const transfers=[];let c=0,d=0;while(c<creditors.length&&d<debtors.length){const a=Math.min(creditors[c].r,debtors[d].r);if(a>.005)transfers.push({from:debtors[d].name,to:creditors[c].name,amount:a});creditors[c].r-=a;debtors[d].r-=a;if(creditors[c].r<=.005)c++;if(debtors[d].r<=.005)d++;}
      if($('#transferPlan'))$('#transferPlan').innerHTML=transfers.length?transfers.map(t=>`<div class="transfer-row"><strong>${esc(t.from)}</strong><span>يحوّل ${money(t.amount)} إلى</span><strong>${esc(t.to)}</strong></div>`).join(''):'<div class="settled-all">✅ الحسابات متوازنة.</div>';
    }catch(e){console.warn('[leftover-finance]',e)}
  }

  function patchFinance(){
    if(page()!=='expenses.html'||patchedFinance||typeof window.renderExpenses!=='function')return;
    const original=window.renderExpenses;
    window.renderExpenses=async function(...args){const r=await original.apply(this,args);await applyAdjustedFinance();return r};
    patchedFinance=true;applyAdjustedFinance();
  }

  async function approvalRpc(name,args={}){
    if(!approvalClient){const c=window.SUPABASE_CONFIG||{};if(!window.supabase||!c.url||!c.key)return null;approvalClient=window.supabase.createClient(c.url,c.key)}
    const {data,error}=await approvalClient.rpc(name,args);if(error)throw error;return data;
  }
  async function decorateApprovalCards(){
    if(page()!=='admin-expenses.html')return;
    try{
      const rows=await approvalRpc('admin_list_expense_approval_requests',{p_status:null})||[];
      rows.forEach(r=>{
        if(r.request_type!=='purchase'||!r.purchase_lines?.length)return;
        const card=document.querySelector(`[data-request="${r.id}"]`);if(!card||card.querySelector('.pl53-price-detail'))return;
        const names=Object.fromEntries((r.items||[]).map(i=>[i.id,i.name]));
        const d=document.createElement('div');d.className='pl53-price-detail';d.innerHTML=r.purchase_lines.map(l=>`<div class="pl53-price-row"><span>${esc(names[l.item_id]||'صنف')} — ${l.quantity} × ${money(l.unit_price)}</span><strong>${money(l.line_total)}</strong></div>`).join('');
        const items=card.querySelector('.ea52-items');items?items.after(d):card.appendChild(d);
      });
    }catch(_){ }
  }

  injectStyles();
  if(page()==='expenses.html'){
    const timer=setInterval(async()=>{
      if(!window.TripDB?.isBound?.())return;
      await loadItems();decorateQueue();patchSubmit();patchFinance();addLeftoversLink();
      if(patchedSubmit&&patchedFinance)clearInterval(timer);
    },250);
    const mo=new MutationObserver(()=>decorateQueue());mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(applyAdjustedFinance,1200);
  }
  if(page()==='admin-expenses.html'){
    const mo=new MutationObserver(()=>decorateApprovalCards());mo.observe(document.documentElement,{childList:true,subtree:true});
    setInterval(decorateApprovalCards,800);
  }
})();
