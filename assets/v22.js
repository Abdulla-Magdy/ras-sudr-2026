(() => {
  if (window.__BAZ_V22_LOADED__) return;
  window.__BAZ_V22_LOADED__ = true;

  const VERSION = 'V22';
  const UPDATED_AT = '23/09/2026 17:40';
  let client = null;

  // Patch Leaflet before V21 creates the live map.
  // This keeps the map under the mobile drawer and gives every person pin a permanent name.
  function patchLeaflet(){
    if (!window.L || L.__bazV22Patched) return;

    const originalMap = L.map;
    L.map = function(...args){
      const map = originalMap.apply(this, args);
      window.__BAZ_LIVE_MAP__ = map;
      return map;
    };

    const originalMarker = L.marker;
    L.marker = function(...args){
      const marker = originalMarker.apply(this, args);
      const originalBindPopup = marker.bindPopup;
      marker.bindPopup = function(content, ...rest){
        try{
          const label = String(content ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          if (label && !marker.getTooltip()) {
            marker.bindTooltip(label, {
              permanent: true,
              direction: 'top',
              offset: [0, -28],
              className: 'live-name-tooltip'
            });
          }
        }catch(e){}
        return originalBindPopup.call(marker, content, ...rest);
      };
      return marker;
    };

    const originalFitBounds = L.Map.prototype.fitBounds;
    L.Map.prototype.fitBounds = function(bounds, options){
      try{
        if (window.__BAZ_DEST_LATLNG__) {
          const b = L.latLngBounds(bounds);
          b.extend(window.__BAZ_DEST_LATLNG__);
          return originalFitBounds.call(this, b, options);
        }
      }catch(e){}
      return originalFitBounds.call(this, bounds, options);
    };

    L.__bazV22Patched = true;
  }
  patchLeaflet();

  const css = `
    .mobile-menu-backdrop{z-index:20000!important}
    .mobile-menu-drawer{z-index:20001!important}
    .location-map,.leaflet-container{z-index:1!important}
    .live-name-tooltip{background:#071824!important;color:#fff!important;border:1px solid rgba(255,255,255,.28)!important;border-radius:999px!important;padding:4px 8px!important;font-weight:800!important;font-size:11px!important;box-shadow:0 5px 16px rgba(0,0,0,.28)!important}
    .live-name-tooltip:before{display:none!important}
    .v22-version{font-size:10px;opacity:.7;text-align:center;padding:12px 8px 20px}
    .v22-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}
    .v22-hint{font-size:10px;color:var(--muted)}
    .v22-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.68);display:none;align-items:flex-end;justify-content:center;z-index:30000;padding:14px}
    .v22-modal-backdrop.open{display:flex}.v22-modal{width:min(560px,100%);background:#0d2d3a;border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:16px;max-height:90vh;overflow:auto}
    .v22-modal h3{margin:0 0 12px}.v22-form{display:grid;gap:10px}.v22-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v22-form label span{display:block;font-size:11px;opacity:.72;margin-bottom:5px}.v22-modal-actions{display:flex;gap:8px;margin-top:12px}.v22-modal-actions .btn{flex:1}
    .v22-item-note{font-size:10px;color:#ffd17c;margin-top:7px}.v22-item-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
    .v22-idea-card{display:grid;gap:9px}.v22-idea-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.v22-idea-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;white-space:nowrap;background:rgba(255,255,255,.08)}.v22-idea-status.done{background:rgba(142,229,155,.13);color:#baf5c4}.v22-idea-status.in_progress{background:rgba(255,189,89,.13);color:#ffd17c}.v22-idea-meta{font-size:10px;color:var(--muted)}
    .v22-expense-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
    .v22-destination-wrap{position:relative}.v22-map-open{position:absolute;left:12px;bottom:12px;z-index:900;display:inline-flex;text-decoration:none;box-shadow:0 8px 22px rgba(0,0,0,.3)}
    .v22-destination-card{margin-top:12px}.v22-destination-card .grid-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px}.v22-destination-card .wide{grid-column:1/-1}
    .v22-route-note{font-size:10px;color:var(--muted);margin-top:8px;line-height:1.6}
    .v22-onme-inline{margin-inline-start:8px}
    @media(max-width:700px){.v22-form-grid,.v22-destination-card .grid-fields{grid-template-columns:1fr}.v22-destination-card .wide{grid-column:auto}.v22-map-open{left:8px;bottom:8px;font-size:10px;padding:9px 11px}}
  `;

  function injectCss(){
    if (document.getElementById('v22Style')) return;
    const s=document.createElement('style'); s.id='v22Style'; s.textContent=css; document.head.appendChild(s);
  }
  injectCss();

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function waitForApp(){
    for(let i=0;i<80;i++){
      if (window.TripDB?.getMember?.() && window.TripDB?.getTrip?.()) return true;
      await sleep(100);
    }
    return false;
  }

  function cfg(){ return window.SUPABASE_CONFIG || {}; }
  async function db(){
    if (!client) {
      const c=cfg();
      if (!c.url || !c.key || !window.supabase) return null;
      client=window.supabase.createClient(c.url,c.key);
    }
    try{ await client.auth.getSession(); }catch(e){}
    return client;
  }
  function me(){ return window.TripDB?.getMember?.(); }
  function trip(){ return window.TripDB?.getTrip?.(); }
  function isAdmin(){ return !!window.TripDB?.isAdmin?.(); }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function toast(t){ if(window.toast) window.toast(t); else alert(t); }

  function modal(title, body, saveLabel='حفظ'){
    let back=document.getElementById('v22Modal');
    if(!back){back=document.createElement('div');back.id='v22Modal';back.className='v22-modal-backdrop';document.body.appendChild(back);}
    back.innerHTML=`<div class="v22-modal"><h3>${title}</h3>${body}<div class="v22-modal-actions"><button class="btn secondary" data-cancel>إلغاء</button><button class="btn" data-save>${saveLabel}</button></div></div>`;
    back.classList.add('open');
    back.querySelector('[data-cancel]').onclick=()=>back.classList.remove('open');
    back.onclick=e=>{if(e.target===back)back.classList.remove('open');};
    return back;
  }

  function cleanupHomeButton(){
    const btn=document.getElementById('startRoadTripV21');
    if(btn){const wrap=btn.closest('.v21-quickbar'); if(wrap)wrap.remove(); else btn.remove();}
  }

  function updateVersion(){
    document.querySelectorAll('.v21-version,.v22-version').forEach(el=>{
      el.classList.add('v22-version');
      el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    });
    if(!document.querySelector('.v22-version')){
      const el=document.createElement('div');el.className='v22-version';el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
      const footer=document.querySelector('.footer'); if(footer)footer.insertAdjacentElement('afterend',el); else document.body.appendChild(el);
    }
  }

  async function categories(){
    const c=await db(); if(!c)return [];
    const {data}=await c.from('categories').select('id,name,sort_order').eq('trip_id',trip().id).eq('active',true).order('sort_order');
    return data||[];
  }

  async function openQuickAdd(existing=null){
    const c=await db(); if(!c)return;
    const cats=await categories();
    const editing=!!existing;
    const opts=cats.map(x=>`<option value="${x.id}" ${existing?.category_id===x.id?'selected':''}>${esc(x.name)}</option>`).join('');
    const back=modal(editing?'✏️ تعديل الحاجة اللي ضفتها':'➕ إضافة سريعة للمشتريات',`<div class="v22-form">
      <label><span>الحاجة</span><input id="v22ItemName" class="text-input" value="${esc(existing?.name||'')}" placeholder="مثال: مناديل"></label>
      <div class="v22-form-grid"><label><span>الكمية</span><input id="v22ItemQty" class="text-input" type="number" step="any" value="${esc(existing?.planned_qty??'')}"></label><label><span>الوحدة</span><input id="v22ItemUnit" class="text-input" value="${esc(existing?.unit||'')}" placeholder="كيس / عبوة / كجم"></label></div>
      <label><span>التصنيف</span><select id="v22ItemCat" class="select-input">${opts}</select></label>
      <label><span>ملاحظة (اختياري)</span><textarea id="v22ItemNote" class="textarea">${esc(existing?.note||'')}</textarea></label>
      ${editing?'':'<label style="display:flex;gap:8px;align-items:center"><input id="v22Claim" type="checkbox" checked><span style="margin:0">أنا هجيبها</span></label>'}
    </div>`,editing?'حفظ التعديل':'إضافة');

    back.querySelector('[data-save]').onclick=async()=>{
      const name=back.querySelector('#v22ItemName').value.trim(); if(!name){toast('اكتب اسم الحاجة الأول');return;}
      const payload={
        p_name:name,
        p_qty:back.querySelector('#v22ItemQty').value?Number(back.querySelector('#v22ItemQty').value):null,
        p_unit:back.querySelector('#v22ItemUnit').value.trim()||null,
        p_category_id:back.querySelector('#v22ItemCat').value||null,
        p_note:back.querySelector('#v22ItemNote').value.trim()||null
      };
      let rpc='add_trip_shopping_item';
      if(editing){rpc='update_own_added_shopping_item';payload.p_item_id=existing.id;}
      else payload.p_claim=back.querySelector('#v22Claim').checked;
      const {error}=await c.rpc(rpc,payload);
      if(error){console.error(error);toast('حصلت مشكلة في الحفظ');return;}
      back.classList.remove('open');toast(editing?'اتعدل ✅':'اتضافت للمشتريات ✅');setTimeout(()=>location.reload(),300);
    };
  }

  async function enhanceShopping(){
    const c=await db(); if(!c)return;
    if(!document.getElementById('foodBody') && !document.getElementById('purchaseQueue')) return;
    const {data:items}=await c.from('shopping_items').select('*').eq('trip_id',trip().id).order('sort_order');
    const rows=items||[]; const mine=me();

    // One clear Quick Add on food page.
    if(document.getElementById('foodBody')){
      document.getElementById('v21QuickShopping')?.remove();
      if(!document.getElementById('v22QuickShoppingFood')){
        const bar=document.createElement('div');bar.id='v22QuickShoppingFood';bar.className='v22-tools';
        bar.innerHTML='<button class="btn" id="v22QuickAddFood">➕ حاجة ناقصة / إضافة سريعة</button><span class="v22-hint">أي حد يقدر يضيف حاجة وهو في السوبرماركت</span>';
        document.getElementById('foodBody').insertAdjacentElement('beforebegin',bar);
        bar.querySelector('#v22QuickAddFood').onclick=()=>openQuickAdd();
      }

      rows.forEach(item=>{
        const trigger=[...document.querySelectorAll(`[data-id="${item.id}"]`)][0];
        const card=trigger?.closest('.food-item-card'); if(!card)return;
        if(item.note && !card.querySelector('.v22-item-note')){
          const d=document.createElement('div');d.className='v22-item-note';d.textContent=`📝 ${item.note}`;card.appendChild(d);
        }
        let actionWrap=card.querySelector('.food-responsibility-action'); if(!actionWrap){actionWrap=document.createElement('div');actionWrap.className='food-responsibility-action';card.appendChild(actionWrap);}
        if(item.responsible_member_id===mine.id && !item.purchased && !actionWrap.querySelector('.v22-on-me')){
          const b=document.createElement('button');b.className='btn secondary v22-on-me';b.textContent='🎁 على حسابي';
          b.onclick=async()=>{if(!confirm(`تقفل ${item.name} على حسابك من غير ما يدخل مبلغ في الحسابات؟`))return;const {error}=await c.rpc('mark_item_on_me',{p_item_id:item.id});if(error){console.error(error);toast('حصلت مشكلة');return;}toast('اتوفرت على حسابك ✅');setTimeout(()=>location.reload(),300);};
          actionWrap.appendChild(b);
        }
        if(item.added_by_member_id===mine.id && !item.purchased && !actionWrap.querySelector('.v22-edit-own')){
          const e=document.createElement('button');e.className='btn secondary v22-edit-own';e.textContent='✏️ تعديل';e.onclick=()=>openQuickAdd(item);actionWrap.appendChild(e);
          const d=document.createElement('button');d.className='btn danger v22-delete-own';d.textContent='حذف';d.onclick=async()=>{if(!confirm('تحذف الحاجة دي؟'))return;const {error}=await c.rpc('delete_own_added_shopping_item',{p_item_id:item.id});if(error){console.error(error);toast('مينفعش تتحذف دلوقتي');return;}location.reload();};actionWrap.appendChild(d);
        }
      });
    }

    // Also expose Quick Add and "على حسابي" where the user records supermarket receipts.
    if(document.getElementById('purchaseQueue')){
      if(!document.getElementById('v22QuickShoppingExpense')){
        const bar=document.createElement('div');bar.id='v22QuickShoppingExpense';bar.className='v22-tools';
        bar.innerHTML='<button class="btn secondary" id="v22QuickAddExpense">➕ نسينا حاجة في السوبرماركت؟</button><span class="v22-hint">ضيفها هنا من غير ما ترجع لصفحة الأكل</span>';
        document.getElementById('purchaseQueue').insertAdjacentElement('beforebegin',bar);
        bar.querySelector('#v22QuickAddExpense').onclick=()=>openQuickAdd();
      }
      if(!document.getElementById('v22OnMeHelp')){
        const p=document.createElement('div');p.id='v22OnMeHelp';p.className='notice';p.style.marginBottom='10px';p.innerHTML='🎁 <strong>على حسابي:</strong> بتظهر للحاجة اللي إنت مسؤول عنها، وتقفلها من غير ما تضيف مبلغ للتسوية.';
        document.getElementById('purchaseQueue').insertAdjacentElement('beforebegin',p);
      }
      const itemMap=Object.fromEntries(rows.map(x=>[x.id,x]));
      document.querySelectorAll('.purchase-item-check').forEach(ch=>{
        const item=itemMap[ch.value]; const row=ch.closest('.purchase-queue-item');
        if(!item||!row||item.responsible_member_id!==mine.id||item.purchased||row.querySelector('.v22-onme-inline'))return;
        const b=document.createElement('button');b.type='button';b.className='btn secondary v22-onme-inline';b.textContent='🎁 على حسابي';
        b.onclick=async e=>{e.preventDefault();e.stopPropagation();if(!confirm(`تقفل ${item.name} على حسابك؟`))return;const {error}=await c.rpc('mark_item_on_me',{p_item_id:item.id});if(error){console.error(error);toast('حصلت مشكلة');return;}toast('اتقفلت على حسابك ✅');setTimeout(()=>location.reload(),300);};
        row.appendChild(b);
      });
    }
  }

  async function renderIdeasV22(){
    const list=document.getElementById('ideasList'); if(!list)return;
    const c=await db(); if(!c)return;
    const [{data:ideas},{data:members}]=await Promise.all([
      c.from('ideas').select('*').eq('trip_id',trip().id).order('created_at',{ascending:false}),
      c.from('members').select('id,name').eq('trip_id',trip().id)
    ]);
    const names=Object.fromEntries((members||[]).map(x=>[x.id,x.name]));
    const labels={new:'💡 اقتراح جديد',in_progress:'🛠️ شغالين عليه',done:'✅ تم التنفيذ'};
    list.innerHTML=(ideas||[]).length?(ideas||[]).map(x=>`<div class="card v22-idea-card">
      <div class="v22-idea-head"><div>${esc(x.body)}</div><span class="v22-idea-status ${x.status}">${labels[x.status]||labels.new}</span></div>
      <div class="v22-idea-meta">— ${esc(names[x.member_id]||'الأشقياء')} • ${new Date(x.created_at).toLocaleDateString('ar-EG')}</div>
      ${x.status==='done'?`<div class="v22-idea-meta">🏆 اتنفذت الفكرة${x.implemented_version?` في ${esc(x.implemented_version)}`:''}</div>`:''}
      ${isAdmin()?`<div class="v22-item-actions"><button class="btn secondary v22-idea-state" data-id="${x.id}" data-state="new">جديد</button><button class="btn secondary v22-idea-state" data-id="${x.id}" data-state="in_progress">شغالين عليه</button><button class="btn v22-idea-state" data-id="${x.id}" data-state="done">تم التنفيذ</button></div>`:''}
      ${(isAdmin()||x.member_id===me().id)?`<div><button class="btn danger v22-idea-del" data-id="${x.id}">حذف</button></div>`:''}
    </div>`).join(''):'<div class="muted">لسه مفيش اقتراحات.</div>';

    list.querySelectorAll('.v22-idea-state').forEach(btn=>btn.onclick=async()=>{
      const state=btn.dataset.state;
      const patch={status:state,implemented_version:state==='done'?VERSION:null,implemented_at:state==='done'?new Date().toISOString():null};
      const {error}=await c.from('ideas').update(patch).eq('id',btn.dataset.id);if(error){console.error(error);toast('حصلت مشكلة');return;}renderIdeasV22();
    });
    list.querySelectorAll('.v22-idea-del').forEach(btn=>btn.onclick=async()=>{if(!confirm('تحذف الاقتراح؟'))return;const {error}=await c.from('ideas').delete().eq('id',btn.dataset.id);if(error){toast('مينفعش يتحذف');return;}renderIdeasV22();});
  }

  async function enhanceExpenseEdit(){
    if(!document.getElementById('expenseList'))return;
    const c=await db(); if(!c)return;
    const cats=await categories();
    const {data:expenses}=await c.from('expenses').select('*,expense_shopping_items(shopping_item_id)').eq('trip_id',trip().id).order('created_at',{ascending:false});
    const map=Object.fromEntries((expenses||[]).map(x=>[x.id,x]));
    document.querySelectorAll('.expense-del[data-id]').forEach(del=>{
      const id=del.dataset.id, row=map[id], card=del.closest('.expense-log-card'); if(!row||!card||card.querySelector('.v22-expense-edit'))return;
      let actions=card.querySelector('.v22-expense-actions'); if(!actions){actions=document.createElement('div');actions.className='v22-expense-actions';del.insertAdjacentElement('beforebegin',actions);actions.appendChild(del);}
      const b=document.createElement('button');b.className='btn secondary compact v22-expense-edit';b.textContent='✏️ تعديل';actions.insertBefore(b,del);
      b.onclick=()=>openExpenseEdit(row,cats);
    });
  }

  async function openExpenseEdit(row,cats){
    const linked=(row.expense_shopping_items||[]).length>0;
    const opts=cats.map(x=>`<option value="${x.id}" ${x.id===row.category_id?'selected':''}>${esc(x.name)}</option>`).join('');
    const back=modal('✏️ تعديل المصروف',`<div class="v22-form">
      <label><span>المبلغ</span><input id="v22ExpenseAmount" class="amount-input" type="number" step="0.01" value="${esc(row.amount)}"></label>
      ${linked?'<div class="notice">المصروف ده مربوط بمشتريات؛ نقدر نعدل المبلغ والملاحظة، لكن التصنيف يفضل مربوط بالفاتورة.</div>':`<label><span>التصنيف</span><select id="v22ExpenseCat" class="select-input">${opts}</select></label>`}
      <label><span>ملاحظة</span><textarea id="v22ExpenseNote" class="textarea">${esc(row.note||'')}</textarea></label>
    </div>`,'حفظ التعديل');
    back.querySelector('[data-save]').onclick=async()=>{
      const c=await db(); const amount=Number(back.querySelector('#v22ExpenseAmount').value||0);if(amount<=0){toast('راجع المبلغ');return;}
      const payload={p_expense_id:row.id,p_amount:amount,p_note:back.querySelector('#v22ExpenseNote').value.trim()||null,p_category_id:linked?null:(back.querySelector('#v22ExpenseCat')?.value||null)};
      const {error}=await c.rpc('update_trip_expense',payload);if(error){console.error(error);toast('حصلت مشكلة في التعديل');return;}toast('المصروف اتعدل ✅');back.classList.remove('open');setTimeout(()=>location.reload(),300);
    };
  }

  function parseCoords(url){
    const s=String(url||'');
    let m=s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/); if(m)return [Number(m[1]),Number(m[2])];
    m=s.match(/[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?)(?:,|%2C)(-?\d+(?:\.\d+)?)/i); if(m)return [Number(m[1]),Number(m[2])];
    return null;
  }

  async function enhanceDestination(){
    const mapEl=document.getElementById('liveMap'); if(!mapEl)return;
    const c=await db(); if(!c)return;
    let map=null; for(let i=0;i<50;i++){if(window.__BAZ_LIVE_MAP__){map=window.__BAZ_LIVE_MAP__;break;}await sleep(100);} if(!map)return;

    const {data:dest}=await c.from('trips').select('id,destination_url,destination_label,destination_lat,destination_lng').eq('id',trip().id).single();
    if(!dest)return;
    if(dest.destination_lat!=null&&dest.destination_lng!=null) window.__BAZ_DEST_LATLNG__=[dest.destination_lat,dest.destination_lng];

    const parent=mapEl.parentElement; parent.classList.add('v22-destination-wrap');
    if(dest.destination_url && !document.getElementById('v22OpenMaps')){
      const a=document.createElement('a');a.id='v22OpenMaps';a.className='btn v22-map-open';a.target='_blank';a.rel='noopener';a.href=dest.destination_url;a.textContent='🗺️ افتح الطريق للقرية في Maps';parent.appendChild(a);
    }

    if(isAdmin() && !document.getElementById('v22DestinationAdmin')){
      const card=document.createElement('div');card.id='v22DestinationAdmin';card.className='card v22-destination-card';
      card.innerHTML=`<h3>👑 إعدادات وجهة الرحلة</h3><div class="grid-fields">
        <label class="mini-field wide"><span>لينك القرية</span><input id="v22DestUrl" class="text-input" value="${esc(dest.destination_url||'')}"></label>
        <label class="mini-field"><span>Latitude</span><input id="v22DestLat" class="text-input" type="number" step="any" value="${dest.destination_lat??''}"></label>
        <label class="mini-field"><span>Longitude</span><input id="v22DestLng" class="text-input" type="number" step="any" value="${dest.destination_lng??''}"></label>
      </div><div class="v22-tools"><button id="v22PickDest" class="btn secondary">📍 اختار مكان القرية من الخريطة</button><button id="v22SaveDest" class="btn">حفظ الوجهة</button></div><div class="v22-route-note">اللينك الحالي محفوظ. عشان الطريق نفسه يظهر جوه الخريطة لازم يبقى عندنا نقطة القرية؛ تقدر تدخل الإحداثيات أو تضغط «اختار مكان القرية» وبعدها تضغط على مكانها في الخريطة مرة واحدة.</div>`;
      parent.insertAdjacentElement('afterend',card);
      const parsed=parseCoords(dest.destination_url); if(parsed && !dest.destination_lat){card.querySelector('#v22DestLat').value=parsed[0];card.querySelector('#v22DestLng').value=parsed[1];}
      card.querySelector('#v22PickDest').onclick=()=>{
        toast('اضغط دلوقتي على مكان القرية في الخريطة');
        map.once('click',e=>{card.querySelector('#v22DestLat').value=e.latlng.lat.toFixed(6);card.querySelector('#v22DestLng').value=e.latlng.lng.toFixed(6);toast('اتحددت النقطة — اضغط حفظ الوجهة');});
      };
      card.querySelector('#v22SaveDest').onclick=async()=>{
        const url=card.querySelector('#v22DestUrl').value.trim();const latVal=card.querySelector('#v22DestLat').value;const lngVal=card.querySelector('#v22DestLng').value;
        const {error}=await c.rpc('admin_update_trip_destination',{p_url:url,p_label:'القرية',p_lat:latVal===''?null:Number(latVal),p_lng:lngVal===''?null:Number(lngVal)});
        if(error){console.error(error);toast('حصلت مشكلة في حفظ الوجهة');return;}toast('الوجهة اتحفظت ✅');setTimeout(()=>location.reload(),350);
      };
    }

    if(dest.destination_lat!=null&&dest.destination_lng!=null){
      const destLatLng=[dest.destination_lat,dest.destination_lng];
      const marker=L.marker(destLatLng).addTo(map).bindPopup('🏁 '+(dest.destination_label||'القرية'));
      marker.on('click',()=>{if(dest.destination_url)window.open(dest.destination_url,'_blank');});
      await drawRouteToDestination(c,map,destLatLng,dest.destination_url);
      setInterval(()=>drawRouteToDestination(c,map,destLatLng,dest.destination_url),60000);
    }
  }

  let routeLayer=null;
  async function drawRouteToDestination(c,map,destLatLng,url){
    const mine=me(); if(!mine)return;
    const {data:loc}=await c.from('location_shares').select('latitude,longitude,active,expires_at').eq('member_id',mine.id).maybeSingle();
    if(!loc||!loc.active||new Date(loc.expires_at).getTime()<=Date.now())return;
    try{
      const u=`https://router.project-osrm.org/route/v1/driving/${loc.longitude},${loc.latitude};${destLatLng[1]},${destLatLng[0]}?overview=full&geometries=geojson`;
      const r=await fetch(u);if(!r.ok)throw new Error('route');const j=await r.json();const geom=j.routes?.[0]?.geometry;if(!geom)return;
      if(routeLayer)map.removeLayer(routeLayer);
      routeLayer=L.geoJSON(geom,{style:{weight:5,opacity:.78}}).addTo(map);
      routeLayer.on('click',()=>{if(url)window.open(url,'_blank');});
      map.fitBounds(routeLayer.getBounds().pad(.08),{maxZoom:13});
    }catch(e){console.warn('Route draw failed',e);}
  }

  async function main(){
    if(!(await waitForApp()))return;
    cleanupHomeButton();
    updateVersion();
    setTimeout(cleanupHomeButton,900);setTimeout(cleanupHomeButton,1800);
    setTimeout(updateVersion,800);setTimeout(updateVersion,1800);
    setTimeout(()=>enhanceShopping().catch(console.error),800);
    setTimeout(()=>enhanceShopping().catch(console.error),1800);
    setTimeout(()=>renderIdeasV22().catch(console.error),1200);
    setTimeout(()=>enhanceExpenseEdit().catch(console.error),1000);
    setTimeout(()=>enhanceExpenseEdit().catch(console.error),1800);
    setTimeout(()=>enhanceDestination().catch(console.error),900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(main,150));else setTimeout(main,150);
})();
