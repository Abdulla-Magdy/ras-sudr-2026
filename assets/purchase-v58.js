(() => {
  if (window.__KENZ_PURCHASE_V58__) return;
  window.__KENZ_PURCHASE_V58__ = true;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const page = () => location.pathname.split('/').pop() || 'index.html';
  const money = v => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0)) + ' ج';
  const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let itemMap = {};
  let client = null;
  let submitting = false;

  function styles(){
    if ($('#pv58Style')) return;
    const s=document.createElement('style');
    s.id='pv58Style';
    s.textContent=`
      .pv58-line{display:grid;grid-template-columns:1fr 1fr auto;gap:9px;align-items:end;width:100%;margin-top:11px;padding-top:11px;border-top:1px dashed rgba(255,255,255,.10);grid-column:1/-1}
      .pv58-line label{display:grid;gap:5px;color:var(--muted,#9fb0bb);font-size:9px}.pv58-line input{width:100%;box-sizing:border-box;min-height:42px}.pv58-line-total{font-size:12px;font-weight:1000;white-space:nowrap;padding:0 2px 11px}.purchase-queue-item.pv58-selected{border-color:rgba(103,227,220,.38)!important;background:rgba(103,227,220,.065)!important}.purchase-queue-item:not(.pv58-selected) .pv58-line{opacity:.5}.pv58-hint{font-size:9px;color:var(--muted,#9fb0bb);line-height:1.6;margin:8px 0}.pv58-leftovers{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border:1px solid rgba(103,227,220,.22);background:rgba(103,227,220,.07);border-radius:15px;color:inherit;text-decoration:none;margin-top:10px}.pv58-leftovers strong{display:block;font-size:12px}.pv58-leftovers small{display:block;font-size:9px;color:var(--muted,#9fb0bb);margin-top:3px}.pl53-line{display:none!important}
      @media(max-width:640px){.pv58-line{grid-template-columns:1fr 1fr}.pv58-line-total{grid-column:1/-1;padding-bottom:2px}.purchase-queue-item{flex-wrap:wrap!important}}
    `;
    document.head.appendChild(s);
  }

  async function loadItems(){
    try{
      const rows = await window.TripDB?.list?.('shopping_items',{order:'sort_order'}) || [];
      itemMap = Object.fromEntries(rows.map(x=>[x.id,x]));
    }catch(_){ itemMap = {}; }
  }

  function rowFor(cb){ return cb.closest('.purchase-queue-item') || cb.closest('label') || cb.parentElement; }

  function ensureEditors(){
    if (page() !== 'expenses.html') return;
    const amount = $('#purchaseBatchAmount');
    if (amount){ amount.readOnly=true; amount.placeholder='بيتحسب تلقائيًا'; }
    const footer=$('.purchase-batch-footer');
    if(footer && !footer.querySelector('.pv58-hint')){
      const h=document.createElement('div'); h.className='pv58-hint';
      h.textContent='لكل صنف: اكتب الكمية الفعلية وإجمالي سعر الكمية. هنحسب سعر الوحدة تلقائيًا.';
      footer.prepend(h);
    }

    $$('.purchase-item-check').forEach(cb=>{
      const row=rowFor(cb); if(!row) return;
      if(!row.querySelector('.pv58-line')){
        const item=itemMap[cb.value] || {};
        const q=Number(item.actual_qty || item.planned_qty || 1) || 1;
        const d=document.createElement('div');
        d.className='pv58-line';
        d.innerHTML=`<label><span>الكمية الفعلية</span><input class="qty-input pv58-qty" type="number" min="0.01" step="0.01" inputmode="decimal" value="${q}"></label><label><span>إجمالي سعر الكمية</span><input class="amount-input pv58-price" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="مثال: 900"></label><strong class="pv58-line-total">0 ج</strong>`;
        row.appendChild(d);
        d.querySelectorAll('input').forEach(i=>i.addEventListener('input',recalc));
        cb.addEventListener('change',()=>setTimeout(recalc,0));
      }
    });
    recalc();
  }

  function selectedLines(){
    return $$('.purchase-item-check:checked').map(cb=>{
      const row=rowFor(cb);
      const qty=Number(row?.querySelector('.pv58-qty')?.value || 0);
      const enteredTotal=Number(row?.querySelector('.pv58-price')?.value || 0);
      const lineTotal=Math.round(enteredTotal*100)/100;
      const unitPrice=qty>0 ? lineTotal/qty : 0;
      return {item_id:cb.value, quantity:qty, unit_price:unitPrice, line_total:lineTotal, row};
    });
  }

  function recalc(){
    if(page()!=='expenses.html') return;
    $$('.purchase-item-check').forEach(cb=>{
      const row=rowFor(cb); if(!row)return;
      row.classList.toggle('pv58-selected',cb.checked);
      row.querySelectorAll('.pv58-line input').forEach(i=>i.disabled=!cb.checked);
    });
    const lines=selectedLines();
    const total=Math.round(lines.reduce((s,l)=>s+l.line_total,0)*100)/100;
    const valid=lines.length>0 && lines.every(l=>l.quantity>0 && l.line_total>0);
    lines.forEach(l=>{ const t=l.row?.querySelector('.pv58-line-total'); if(t)t.textContent=`${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(l.quantity)} × ${money(l.unit_price)} = ${money(l.line_total)}`; });
    const amount=$('#purchaseBatchAmount'); if(amount) amount.value=total ? String(total) : '';
    const counter=$('#selectedPurchaseCount'); if(counter) counter.textContent=`${lines.length} مختارين • ${money(total)}`;
    const btn=$('#recordPurchaseBatch');
    if(btn){
      btn.disabled=!valid || submitting;
      btn.textContent=valid ? `✓ سجل الفاتورة — ${money(total)}` : (lines.length ? 'كمّل الكمية وإجمالي سعر كل صنف' : 'اختار المشتريات الأول');
    }
  }

  async function rpc(name,args){
    if(!client){
      const c=window.SUPABASE_CONFIG||{};
      if(!window.supabase || !c.url || !c.key) throw new Error('DB_NOT_READY');
      client=window.supabase.createClient(c.url,c.key);
    }
    const {data,error}=await client.rpc(name,args); if(error) throw error; return data;
  }

  async function submit(){
    if(submitting) return;
    const lines=selectedLines();
    if(!lines.length){ window.toast?.('اختار المشتريات الأول'); return; }
    if(lines.some(l=>l.quantity<=0 || l.line_total<=0)){ window.toast?.('اكتب الكمية وإجمالي سعر كل صنف'); return; }
    const total=Math.round(lines.reduce((s,l)=>s+l.line_total,0)*100)/100;
    const payerId=window.TripDB?.isAdmin?.() ? ($('#purchaseQueuePayer')?.value || window.TripDB.getMember()?.id) : window.TripDB?.getMember?.()?.id;
    const note=$('#purchaseBatchNote')?.value.trim() || null;
    submitting=true; recalc();
    try{
      await rpc('record_purchase_batch',{
        p_payer_member_id:payerId,
        p_item_ids:lines.map(l=>l.item_id),
        p_amount:total,
        p_note:note,
        p_lines:lines.map(({item_id,quantity,unit_price,line_total})=>({item_id,quantity,unit_price,line_total}))
      });
      window.toast?.('الفاتورة اتبعتت للأدمن للمراجعة ⏳');
      setTimeout(()=>location.reload(),500);
    }catch(e){
      console.error('[V58 purchase]',e);
      const m=String(e?.message||e||'');
      const msg=m.includes('ITEM_PENDING_APPROVAL')?'في صنف منهم مستني اعتماد بالفعل':m.includes('PURCHASE_TOTAL_MISMATCH')?'راجع أسعار الأصناف':m.includes('ITEM_ALREADY_PURCHASED')?'في صنف متسجل كمشترى بالفعل':m.includes('ITEM_NOT_ASSIGNED_TO_PAYER')?'في صنف مش مسؤول عنه الشخص المختار':m.includes('ITEM_PRICES_REQUIRED')?'لازم تسجل الكمية وإجمالي سعر كل صنف':'حصلت مشكلة في تسجيل الفاتورة';
      window.toast?.(msg);
      submitting=false; recalc();
    }
  }

  function hookButton(){
    const btn=$('#recordPurchaseBatch'); if(!btn || btn.dataset.pv58Hooked==='1') return;
    btn.dataset.pv58Hooked='1';
    btn.addEventListener('click',e=>{ e.preventDefault(); e.stopImmediatePropagation(); submit(); },true);
  }

  function addLeftoversLink(){
    if(page()!=='expenses.html' || $('#pv58Leftovers')) return;
    const section=$('.v38-expense-summary')?.closest('.section'); if(!section)return;
    const a=document.createElement('a'); a.id='pv58Leftovers'; a.className='pv58-leftovers'; a.href='leftovers.html';
    a.innerHTML='<div><strong>🧺 تصفية بواقي الرحلة</strong><small>سجّل اللي فاض ومين أخده قبل التسوية النهائية</small></div><span>←</span>';
    section.appendChild(a);
  }

  async function decorateApprovals(){
    if(page()!=='admin-expenses.html') return;
    try{
      const rows=await rpc('admin_list_expense_approval_requests',{p_status:null})||[];
      rows.forEach(r=>{
        if(r.request_type!=='purchase' || !r.purchase_lines?.length) return;
        const card=document.querySelector(`[data-request="${r.id}"]`); if(!card || card.querySelector('.pv58-price-detail')) return;
        const names=Object.fromEntries((r.items||[]).map(i=>[i.id,i.name]));
        const d=document.createElement('div'); d.className='pv58-price-detail'; d.style='margin-top:9px;padding-top:9px;border-top:1px dashed rgba(255,255,255,.1);font-size:9px;display:grid;gap:5px';
        d.innerHTML=r.purchase_lines.map(l=>`<div style="display:flex;justify-content:space-between;gap:8px"><span>${esc(names[l.item_id]||'صنف')} — ${l.quantity} × ${money(l.unit_price)}</span><strong>${money(l.line_total)}</strong></div>`).join('');
        card.appendChild(d);
      });
    }catch(_){ }
  }

  async function tick(){
    if(page()==='expenses.html'){
      if(window.TripDB?.isBound?.()) await loadItems();
      ensureEditors(); hookButton(); addLeftoversLink(); recalc();
    }else if(page()==='admin-expenses.html') await decorateApprovals();
  }

  styles();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,250),{once:true});
  else setTimeout(tick,100);
  setInterval(tick,500);
})();