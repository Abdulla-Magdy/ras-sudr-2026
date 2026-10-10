(() => {
 const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 let items=[],plans=[],filter='saved',members=[];
 const sources={undecided:'لسه هنحدد',cairo:'القاهرة',ras_sudr:'رأس سدر'};
 const options=v=>Object.entries(sources).map(([k,n])=>`<option value="${k}" ${v===k?'selected':''}>${n}</option>`).join('');
 async function load(){try{[items,plans,members]=await Promise.all([TripDB.list('shopping_items',{order:'sort_order'}),TripDB.list('trip_next_plans',{order:'updated_at',asc:false}),TripDB.list('members')]);render();}catch(e){$('#npError').textContent='تعذر تحميل القائمة. راجع الاتصال وحاول تاني.';}}
 function render(){
  $('#npCount').textContent=plans.length+' ملاحظة محفوظة للرحلة الجاية';
  let rows=[];
  if(filter==='items') rows=items.map(i=>({item:i,plan:plans.find(p=>p.shopping_item_id===i.id)}));
  else rows=plans.filter(p=>filter==='saved'||(filter==='forgotten'&&!p.shopping_item_id)||p.buy_from===filter).map(p=>({plan:p,item:items.find(i=>i.id===p.shopping_item_id)}));
  $('#npList').innerHTML=rows.length?rows.map(({item:i,plan:p})=>`<details class="co-card" data-item="${i?.id||''}" data-plan="${p?.id||''}"><summary>${esc(p?.name||i?.name)} ${p?'• محفوظة ✓':''}</summary>
    <p class="co-muted">${i?`الرحلة دي: المخطط ${esc(i.planned_qty??'—')} ${esc(i.unit)} • الفعلي ${esc(i.actual_qty??'—')} ${esc(i.unit)}`:'📝 حاجة نسيناها أو عايزين نضيفها'}${p?`<br>آخر تعديل: ${esc(members.find(m=>m.id===p.updated_by_member_id)?.name||'عضو')} • ${new Date(p.updated_at).toLocaleDateString('ar-EG')}`:''}</p>
    <form class="np-edit"><label>اسم الصنف<input name="name" required maxlength="120" value="${esc(p?.name||i?.name)}"></label><div class="co-grid"><label>الكمية المناسبة للرحلة الجاية<input name="quantity" type="number" inputmode="decimal" min="0.01" max="100000" step="0.01" value="${esc(p?.quantity??'')}" placeholder="لسه هنحدد"></label><label>الوحدة<input name="unit" maxlength="30" value="${esc(p?.unit??i?.unit??'')}" placeholder="علبة / كجم / قطعة"></label></div><label>نجيبه منين؟<select name="buy_from">${options(p?.buy_from||'undecided')}</select></label><label>ملاحظتك أو سبب التغيير<textarea name="note" maxlength="1000" rows="3" placeholder="مثال: ٣ كجم كانت كتير؛ ٢ تكفي. نجيبه من رأس سدر أسهل.">${esc(p?.note||'')}</textarea></label><div class="np-row-actions"><button class="btn" type="submit">حفظ للسنة الجاية</button><span class="np-message" role="status"></span></div></form></details>`).join(''):'<div class="co-card"><p>لسه مفيش حاجات هنا. ضيف حاجة نسيناها، أو افتح «أصناف الرحلة» وعدّل الكمية ومكان الشراء.</p></div>';
  document.querySelectorAll('.np-edit').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const card=form.closest('details');await save(form,card.dataset.plan,card.dataset.item);});
  document.querySelectorAll('[data-np-filter]').forEach(b=>b.classList.toggle('active',b.dataset.npFilter===filter));
 }
 async function save(form,id,itemId){const b=form.querySelector('button[type=submit]'),status=form.querySelector('.np-message');b.disabled=true;status.textContent='بنحفظ…';
  const fields=new FormData(form),me=TripDB.getMember();
  const row={trip_id:TripDB.getTrip().id,name:String(fields.get('name')).trim(),quantity:fields.get('quantity')?Number(fields.get('quantity')):null,unit:String(fields.get('unit')||'').trim(),buy_from:fields.get('buy_from'),note:String(fields.get('note')||'').trim(),updated_by_member_id:me.id};
  try{if(id){const prior=plans.find(p=>p.id===id);await TripDB.updateNextPlan(id,row,prior?.updated_at);}else await TripDB.insert('trip_next_plans',{...row,shopping_item_id:itemId||null,created_by_member_id:me.id});status.textContent='اتحفظت ✅';if(!id&&!itemId)form.reset();await load();window.toast?.('اتحفظت للرحلة الجاية ✅');}catch(e){status.textContent=String(e.code)==='23505'?'حد سجل اقتراح للصنف ده. اضغط تحديث وشوفه.':String(e.message).includes('PLAN_CHANGED')?'حد عدّل الملاحظة دي. اضغط تحديث قبل تعديلك.':'تعذر الحفظ. راجع الاتصال والبيانات وحاول تاني.';}finally{b.disabled=false;}
 }
 async function start(){for(let i=0;i<120&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,100));if(!TripDB.isBound())return;await load();$('#npAdd').onsubmit=e=>{e.preventDefault();save(e.target,null,null);};$('#npRefresh').onclick=load;document.querySelectorAll('[data-np-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.npFilter;render();});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
