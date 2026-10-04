(() => {
  if(window.__KENZ_PURCHASE_SUBMIT_V57__) return;
  window.__KENZ_PURCHASE_SUBMIT_V57__=true;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  let client=null;
  async function rpc(name,args){
    const c=window.SUPABASE_CONFIG||{};
    if(!client){
      if(!window.supabase||!c.url||!c.key) throw new Error('DB_NOT_READY');
      client=window.supabase.createClient(c.url,c.key);
      await client.auth.getSession();
    }
    const {data,error}=await client.rpc(name,args);
    if(error) throw error;
    return data;
  }
  function money(v){return new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج'}
  function lineFromRow(row){
    const cb=row.querySelector('.purchase-item-check');
    const quantity=Number(row.querySelector('.pl53-qty')?.value||0);
    const unit_price=Number(row.querySelector('.pl53-price')?.value||0);
    return {item_id:cb?.value,quantity,unit_price,line_total:Math.round(quantity*unit_price*100)/100};
  }
  async function submit(){
    const btn=$('#recordPurchaseBatch');if(!btn)return;
    const lines=$$('.purchase-item-check:checked').map(cb=>cb.closest('.purchase-queue-item')).filter(Boolean).map(lineFromRow);
    if(!lines.length){window.toast?.('اختار المشتريات الأول');return}
    if(lines.some(x=>!x.item_id||x.quantity<=0||x.unit_price<=0)){window.toast?.('لازم تدخل الكمية والسعر لكل صنف');return}
    const total=Math.round(lines.reduce((s,x)=>s+x.line_total,0)*100)/100;
    const me=window.TripDB?.getMember?.();
    const payerId=window.TripDB?.isAdmin?.()?($('#purchaseQueuePayer')?.value||me?.id):me?.id;
    const note=$('#purchaseBatchNote')?.value.trim()||null;
    btn.disabled=true;
    try{
      await rpc('record_purchase_batch',{
        p_payer_member_id:payerId,
        p_item_ids:lines.map(x=>x.item_id),
        p_amount:total,
        p_note:note,
        p_lines:lines
      });
      window.toast?.(`الفاتورة ${money(total)} اتبعتت للأدمن للمراجعة ⏳`);
      setTimeout(()=>location.reload(),500);
    }catch(e){
      console.error('[purchase-submit-v57]',e);
      const m=String(e?.message||e||'');
      const msg=m.includes('ITEM_PENDING_APPROVAL')?'في صنف منهم مستني اعتماد بالفعل':m.includes('ITEM_PRICES_REQUIRED')?'لازم تسجل سعر كل صنف':m.includes('PURCHASE_LINES_MISMATCH')?'راجع الأصناف والكميات':m.includes('PURCHASE_TOTAL_MISMATCH')?'راجع إجمالي أسعار الأصناف':m.includes('ITEM_ALREADY_PURCHASED')?'في صنف متسجل كمشترى بالفعل':m.includes('ITEM_NOT_ASSIGNED_TO_PAYER')?'في صنف مش مسؤول عنه الشخص المختار':'حصلت مشكلة في تسجيل الفاتورة';
      window.toast?.(msg);
      btn.disabled=false;
    }
  }
  const timer=setInterval(()=>{
    const btn=$('#recordPurchaseBatch');
    if(!btn||!window.TripDB?.isBound?.()||!document.querySelector('.pl53-line'))return;
    btn.onclick=submit;
    clearInterval(timer);
  },150);
})();
