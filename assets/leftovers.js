(() => {
  if(window.__KENZ_LEFTOVERS__) return;
  window.__KENZ_LEFTOVERS__=true;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('ar-EG',{minimumFractionDigits:Number.isInteger(Number(v||0))?0:2,maximumFractionDigits:2}).format(Number(v||0))+' ج';
  let members=[], rows=[], busy=false;

  function injectStyles(){
    if($('#lo57Style'))return;
    const s=document.createElement('style');s.id='lo57Style';s.textContent=`
      .lo57-list{display:grid;gap:12px}.lo57-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:14px}.lo57-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.lo57-head h3{margin:0 0 4px;font-size:13px}.lo57-meta{font-size:8.5px;color:var(--muted,#9fb0bb);line-height:1.7}.lo57-value{text-align:left}.lo57-value strong{display:block;font-size:15px}.lo57-status{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:7.5px;font-weight:900;margin-top:4px;background:rgba(103,227,220,.1);color:#9ef2ed}.lo57-status.closed,.lo57-status.shared,.lo57-status.donated,.lo57-status.discarded{background:rgba(255,255,255,.06);color:var(--muted,#9fb0bb)}.lo57-admin{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.07)}.lo57-admin .mini-field{margin:0}.lo57-claim{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-top:12px;padding:11px;border-radius:14px;background:rgba(103,227,220,.055);border:1px solid rgba(103,227,220,.11)}.lo57-allocs{display:grid;gap:7px;margin-top:10px}.lo57-alloc{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.035);font-size:8.5px}.lo57-alloc strong{font-size:9px}.lo57-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.lo57-actions .btn{font-size:8px;padding:8px 10px}.lo57-note{margin-top:10px;padding:9px;border-radius:11px;background:rgba(241,213,143,.08);border:1px solid rgba(241,213,143,.13);font-size:8px;color:#f1d58f}.lo57-empty{padding:20px;text-align:center;color:var(--muted,#9fb0bb)}
      @media(max-width:620px){.lo57-claim{grid-template-columns:1fr 1fr}.lo57-claim .btn{grid-column:1/-1}.lo57-admin{grid-template-columns:1fr}.lo57-head{align-items:flex-start}}
    `;document.head.appendChild(s);
  }

  function statusLabel(s){return s==='shared'?'فضل على حساب الرحلة':s==='donated'?'اتبرعنا بيه':s==='discarded'?'اترمى':s==='closed'?'مقفول':'مفتوح'}
  function canRemoveAllocation(a){const me=window.TripDB.getMember?.();return window.TripDB.isAdmin?.()||a.member_id===me?.id}

  function render(){
    const box=$('#leftoverList');if(!box)return;
    const priced=rows.filter(r=>r.priced);
    const totalValue=priced.reduce((s,r)=>s+Number(r.remaining_qty||0)*Number(r.unit_price||0),0);
    const allocatedValue=priced.reduce((s,r)=>s+(r.allocations||[]).reduce((a,x)=>a+Number(x.amount||0),0),0);
    const availableValue=priced.reduce((s,r)=>s+Number(r.available_qty||0)*Number(r.unit_price||0),0);
    if($('#leftoverValue'))$('#leftoverValue').textContent=money(totalValue);
    if($('#allocatedValue'))$('#allocatedValue').textContent=money(allocatedValue);
    if($('#availableValue'))$('#availableValue').textContent=money(availableValue);
    if($('#leftoverCount'))$('#leftoverCount').textContent=rows.filter(r=>Number(r.remaining_qty||0)>0).length.toLocaleString('ar-EG');

    if(!rows.length){box.innerHTML='<div class="lo57-empty">لسه مفيش مشتريات معتمدة نعمل لها تصفية.</div>';return}
    box.className='lo57-list';
    box.innerHTML=rows.map(r=>{
      const unit=r.unit||'وحدة';
      const purchased=Number(r.purchased_qty||0);
      const remaining=Number(r.remaining_qty||0);
      const available=Number(r.available_qty||0);
      const allocs=r.allocations||[];
      const admin=window.TripDB.isAdmin?.();
      const open=r.status==='open';
      return `<article class="lo57-card" data-item="${r.shopping_item_id}">
        <div class="lo57-head"><div><h3>${esc(r.name)}</h3><div class="lo57-meta">اتشترى: <strong>${purchased||'—'} ${esc(unit)}</strong>${r.priced?` • سعر الوحدة: <strong>${money(r.unit_price)}</strong>`:' • فاتورة قديمة بدون سعر للصنف'}</div></div><div class="lo57-value">${r.priced?`<strong>${money(Number(r.unit_price||0)*remaining)}</strong>`:'<strong>—</strong>'}<span class="lo57-status ${esc(r.status)}">${statusLabel(r.status)}</span></div></div>
        ${!r.priced?`<div class="lo57-note">⚠️ الصنف ده تابع لفاتورة اتسجلت قبل نظام سعر كل صنف، لذلك مش هنحسب له بواقي شخصية تلقائيًا.</div>`:''}
        ${admin&&r.priced?`<div class="lo57-admin"><label class="mini-field"><span>الكمية اللي فاضت من الرحلة</span><input class="qty-input lo57-remaining" type="number" min="0" max="${purchased}" step="0.01" value="${remaining}"></label><button class="btn lo57-save-remaining">حفظ المتبقي</button></div>`:''}
        ${r.priced&&remaining>0?`<div class="lo57-meta" style="margin-top:10px">متاح للتوزيع: <strong>${available} ${esc(unit)}</strong> • قيمة المتاح ${money(available*Number(r.unit_price||0))}</div>`:''}
        ${r.priced&&open&&available>0?`<div class="lo57-claim"><label class="mini-field"><span>الكمية</span><input class="qty-input lo57-claim-qty" type="number" min="0.01" max="${available}" step="0.01" value="${available}"></label>${admin?`<label class="mini-field"><span>مين هياخدها؟</span><select class="select-input lo57-member">${members.map(m=>`<option value="${m.id}" ${m.id===window.TripDB.getMember()?.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label>`:`<div class="mini-field"><span>هتتحسب على</span><strong>${esc(window.TripDB.getMember()?.name||'أنا')}</strong></div>`}<button class="btn lo57-claim-btn">${admin?'تعيين البواقي':'أنا هاخدها'}</button></div>`:''}
        ${allocs.length?`<div class="lo57-allocs">${allocs.map(a=>`<div class="lo57-alloc"><div><strong>${esc(a.member_name)}</strong> أخذ ${a.qty} ${esc(unit)} — ${money(a.amount)}</div>${canRemoveAllocation(a)?`<button class="btn danger compact lo57-remove" data-allocation="${a.id}">إلغاء</button>`:''}</div>`).join('')}</div>`:''}
        ${admin&&r.priced&&remaining>0?`<div class="lo57-actions"><button class="btn secondary lo57-status-btn" data-status="open">فتح التوزيع</button><button class="btn secondary lo57-status-btn" data-status="shared">الباقي على حساب الرحلة</button><button class="btn secondary lo57-status-btn" data-status="donated">تبرعنا بالباقي</button><button class="btn secondary lo57-status-btn" data-status="discarded">اترمى الباقي</button><button class="btn secondary lo57-status-btn" data-status="closed">إغلاق</button></div>`:''}
      </article>`;
    }).join('');

    $$('.lo57-save-remaining').forEach(btn=>btn.onclick=async()=>{
      if(busy)return;const card=btn.closest('.lo57-card'),id=card.dataset.item,qty=Number(card.querySelector('.lo57-remaining').value||0);busy=true;btn.disabled=true;
      try{await window.TripDB.setLeftoverRemaining(id,qty);window.toast?.('اتحفظت كمية البواقي ✅');await load()}
      catch(e){const m=String(e?.message||e||'');window.toast?.(m.includes('QTY_EXCEEDS_PURCHASED')?'المتبقي مينفعش يزيد عن اللي اتشترى':m.includes('QTY_BELOW_ALLOCATED')?'لازم تلغي جزء من التوزيع الأول':'حصلت مشكلة في حفظ المتبقي')}
      finally{busy=false;btn.disabled=false}
    });

    $$('.lo57-claim-btn').forEach(btn=>btn.onclick=async()=>{
      if(busy)return;const card=btn.closest('.lo57-card'),id=card.dataset.item,qty=Number(card.querySelector('.lo57-claim-qty').value||0),memberId=card.querySelector('.lo57-member')?.value||null;if(!qty)return;busy=true;btn.disabled=true;
      try{const x=await window.TripDB.claimLeftover(id,qty,memberId);window.toast?.(`اتحسبت ${money(x.amount)} على الشخص اللي أخدها ✅`);await load()}
      catch(e){const m=String(e?.message||e||'');window.toast?.(m.includes('QTY_EXCEEDS_AVAILABLE')?'الكمية أكبر من المتاح':m.includes('LEFTOVER_CLOSED')?'الصنف مقفول للتوزيع':'حصلت مشكلة في توزيع البواقي')}
      finally{busy=false;btn.disabled=false}
    });

    $$('.lo57-remove').forEach(btn=>btn.onclick=async()=>{if(busy||!confirm('تلغي توزيع البواقي ده؟'))return;busy=true;try{await window.TripDB.removeLeftoverAllocation(btn.dataset.allocation);window.toast?.('اتلغى التوزيع');await load()}finally{busy=false}});
    $$('.lo57-status-btn').forEach(btn=>btn.onclick=async()=>{if(busy)return;const card=btn.closest('.lo57-card');busy=true;try{await window.TripDB.setLeftoverStatus(card.dataset.item,btn.dataset.status);window.toast?.('اتحدثت حالة البواقي ✅');await load()}finally{busy=false}});
  }

  async function load(){
    try{[members,rows]=await Promise.all([window.TripDB.list('members',{order:'sort_order'}),window.TripDB.leftovers()]);render()}
    catch(e){console.error('[leftovers]',e);if($('#leftoverList'))$('#leftoverList').innerHTML='<div class="lo57-empty">حصلت مشكلة في تحميل البواقي.</div>'}
  }

  injectStyles();
  const timer=setInterval(()=>{if(window.TripDB?.isBound?.()){clearInterval(timer);load()}},250);
})();
