(() => {
  const VERSION = 'V21';
  const UPDATED_AT = '23/09/2026 16:48';
  const VERSION_KEY = 'baz-v21-seen';
  const repoStyle = `
    .v21-version{font-size:10px;opacity:.65;text-align:center;padding:12px 8px 20px}
    .v21-version strong{opacity:.95}.v21-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.08);font-size:10px}
    .v21-quickbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.v21-quickbar .btn{flex:0 0 auto}
    .v21-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.65);display:none;align-items:flex-end;justify-content:center;z-index:9999;padding:14px}
    .v21-modal-backdrop.open{display:flex}.v21-modal{width:min(560px,100%);background:#0d2d3a;border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:16px;max-height:90vh;overflow:auto}
    .v21-modal h3{margin:0 0 12px}.v21-form{display:grid;gap:10px}.v21-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v21-form label span{display:block;font-size:11px;opacity:.72;margin-bottom:5px}.v21-form input,.v21-form select,.v21-form textarea{width:100%}
    .v21-modal-actions{display:flex;gap:8px;margin-top:12px}.v21-modal-actions .btn{flex:1}
    .v21-owner-tag{font-size:10px;opacity:.7;margin-top:5px}.v21-category-badge{display:inline-flex;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,.08);font-size:9px;margin-inline-start:5px}
    .v21-counts{display:flex;gap:8px;overflow:auto;padding:2px 0 10px}.v21-count-card{min-width:110px;padding:10px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}.v21-count-card strong{display:block;font-size:14px}.v21-count-card span{font-size:11px;opacity:.7}
    .idea-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;background:rgba(255,255,255,.08)}.idea-status.done{background:rgba(45,200,120,.15)}.idea-status.in_progress{background:rgba(255,180,0,.15)}
    .idea-card-v21{display:grid;gap:8px}.idea-actions-v21{display:flex;gap:6px;flex-wrap:wrap}.idea-meta-v21{font-size:10px;opacity:.66}.idea-done-note{font-size:10px;opacity:.8}
    .release-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.release-card{padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.04)}.release-card strong{display:block;margin-bottom:4px}.release-card span{font-size:11px;opacity:.72}
    .location-hero-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.location-hero-actions label{min-width:150px}.location-map{height:52vh;min-height:360px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.12)}
    .live-people{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:12px}.live-person{padding:10px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}.live-person.stale{opacity:.55}.live-person small{display:block;opacity:.65;margin-top:3px}.live-status{font-size:11px;margin-top:8px}.live-status.on{color:#66e3a5}.live-status.off{opacity:.6}
    .live-warning{font-size:11px;opacity:.72;margin-top:10px}.v21-congrats{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);z-index:10000;padding:18px}.v21-congrats-card{max-width:440px;text-align:center;background:#0d2d3a;border:1px solid rgba(255,255,255,.16);border-radius:22px;padding:24px}.v21-congrats-card .emoji{font-size:48px}.v21-congrats-card h2{margin:8px 0}.v21-congrats-card p{opacity:.78}
    @media(max-width:800px){.release-grid{grid-template-columns:1fr}.live-people{grid-template-columns:1fr 1fr}.v21-form-grid{grid-template-columns:1fr}.location-map{height:48vh}}
  `;

  function css(){
    if(document.getElementById('v21-style')) return;
    const s=document.createElement('style'); s.id='v21-style'; s.textContent=repoStyle; document.head.appendChild(s);
  }
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function waitForApp(){
    for(let i=0;i<60;i++){
      if(window.TripDB?.getMember?.() && window.TripDB?.getTrip?.()) return true;
      await sleep(100);
    }
    return false;
  }
  function cfg(){ return window.SUPABASE_CONFIG || {}; }
  function makeClient(){
    const c=cfg();
    return window.supabase?.createClient(c.url,c.key);
  }
  function member(){ return window.TripDB?.getMember?.(); }
  function trip(){ return window.TripDB?.getTrip?.(); }
  function isAdmin(){ return window.TripDB?.isAdmin?.(); }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function toast(t){ if(window.toast) window.toast(t); else alert(t); }

  function addVersion(){
    document.querySelectorAll('.v21-version').forEach(x=>x.remove());
    const el=document.createElement('div'); el.className='v21-version';
    el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    const drawer=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(drawer) drawer.insertAdjacentElement('afterend',el.cloneNode(true));
    const footer=document.querySelector('.footer');
    if(footer) footer.insertAdjacentElement('afterend',el); else document.body.appendChild(el);
  }

  function addLocationNav(){
    const links=document.querySelector('.links');
    if(links && !links.querySelector('[data-page="location.html"]')){
      const a=document.createElement('a'); a.href='location.html'; a.dataset.page='location.html'; a.innerHTML='<span class="nav-icon">📍</span><span class="nav-label">الموقع Live</span>'; links.appendChild(a);
    }
    const drawer=document.querySelector('.mobile-drawer-links');
    if(drawer && !drawer.querySelector('[data-page="location.html"]')){
      const a=document.createElement('a'); a.href='location.html'; a.dataset.page='location.html'; a.innerHTML='<span class="nav-icon">📍</span><span class="nav-label">الموقع Live</span>'; drawer.appendChild(a);
    }
    if(location.pathname.endsWith('index.html') || location.pathname.endsWith('/') || !location.pathname.split('/').pop()){
      const hero=document.querySelector('.hero');
      if(hero && !document.getElementById('startRoadTripV21')){
        const bar=document.createElement('div'); bar.className='v21-quickbar';
        bar.innerHTML='<a id="startRoadTripV21" class="btn" href="location.html">🚗 بدأنا الطريق — Live Location</a>';
        hero.appendChild(bar);
      }
    }
  }

  function modalShell(title,body,saveLabel='حفظ'){
    let back=document.getElementById('v21Modal');
    if(!back){ back=document.createElement('div'); back.id='v21Modal'; back.className='v21-modal-backdrop'; document.body.appendChild(back); }
    back.innerHTML=`<div class="v21-modal"><h3>${title}</h3>${body}<div class="v21-modal-actions"><button class="btn secondary" data-close>إلغاء</button><button class="btn" data-save>${saveLabel}</button></div></div>`;
    back.classList.add('open');
    back.querySelector('[data-close]').onclick=()=>back.classList.remove('open');
    back.onclick=e=>{ if(e.target===back) back.classList.remove('open'); };
    return back;
  }

  async function shoppingEnhance(){
    if(!document.getElementById('foodBody')) return;
    const client=makeClient(); if(!client) return;
    const me=member();
    const [catsRes,itemsRes]=await Promise.all([
      client.from('categories').select('id,name,sort_order').eq('trip_id',trip().id).eq('active',true).order('sort_order'),
      client.from('shopping_items').select('*').eq('trip_id',trip().id).order('sort_order')
    ]);
    const cats=catsRes.data||[], items=itemsRes.data||[];
    const catMap=Object.fromEntries(cats.map(c=>[c.id,c.name]));
    const toolbar=document.querySelector('#foodBody')?.closest('.card')?.querySelector('.toolbar h2'); if(toolbar) toolbar.textContent='قائمة المشتريات';
    const addBox=document.getElementById('foodAddBox'); if(addBox) addBox.style.display='none';
    const parent=document.getElementById('foodBody')?.parentElement;
    if(parent && !document.getElementById('v21QuickShopping')){
      const bar=document.createElement('div'); bar.id='v21QuickShopping'; bar.className='v21-quickbar';
      bar.innerHTML='<button class="btn" id="v21QuickAdd">➕ حاجة ناقصة / إضافة سريعة</button><span class="v21-chip">أي حد يقدر يضيف حاجة وهو في السوبرماركت</span>';
      document.getElementById('foodBody').insertAdjacentElement('beforebegin',bar);
      document.getElementById('v21QuickAdd').onclick=()=>openShoppingModal();
    }

    async function openShoppingModal(item=null){
      const editing=!!item;
      const options=cats.map(c=>`<option value="${c.id}" ${item?.category_id===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
      const back=modalShell(editing?'✏️ تعديل الحاجة':'➕ إضافة سريعة',`<div class="v21-form">
        <label><span>الحاجة</span><input id="v21Name" class="text-input" value="${esc(item?.name||'')}" placeholder="مثال: مناديل"></label>
        <div class="v21-form-grid"><label><span>الكمية</span><input id="v21Qty" class="text-input" type="number" step="any" value="${esc(item?.planned_qty??'')}"></label><label><span>الوحدة</span><input id="v21Unit" class="text-input" value="${esc(item?.unit||'')}" placeholder="كيس / عبوة / كجم"></label></div>
        <label><span>التصنيف</span><select id="v21Cat" class="select-input">${options}</select></label>
        <label><span>ملاحظة (اختياري)</span><textarea id="v21Note" class="textarea">${esc(item?.note||'')}</textarea></label>
        ${editing?'':'<label style="display:flex;gap:8px;align-items:center"><input id="v21Claim" type="checkbox" checked> <span style="margin:0">أنا هجيبها</span></label>'}
      </div>`, editing?'حفظ التعديل':'إضافة');
      back.querySelector('[data-save]').onclick=async()=>{
        const name=back.querySelector('#v21Name').value.trim(); if(!name){toast('اكتب اسم الحاجة');return;}
        const payload={p_name:name,p_qty:back.querySelector('#v21Qty').value?Number(back.querySelector('#v21Qty').value):null,p_unit:back.querySelector('#v21Unit').value.trim()||null,p_category_id:back.querySelector('#v21Cat').value||null,p_note:back.querySelector('#v21Note').value.trim()||null};
        const rpc=editing?'update_own_added_shopping_item':'add_trip_shopping_item';
        if(editing) payload.p_item_id=item.id; else payload.p_claim=back.querySelector('#v21Claim').checked;
        const {error}=await client.rpc(rpc,payload);
        if(error){console.error(error);toast('حصلت مشكلة في الحفظ');return;}
        back.classList.remove('open'); toast(editing?'اتعدل ✅':'اتضافت للمشتريات ✅'); setTimeout(()=>location.reload(),350);
      };
    }

    items.forEach(item=>{
      const candidates=[...document.querySelectorAll(`[data-id="${item.id}"]`)];
      const card=candidates.map(x=>x.closest('.food-item-card')).find(Boolean);
      if(!card) return;
      const meta=card.querySelector('.food-item-meta');
      if(meta && !card.querySelector('.v21-category-badge')) meta.insertAdjacentHTML('beforeend',`<span class="v21-category-badge">${esc(catMap[item.category_id]||'بدون تصنيف')}</span>`);
      const status=card.querySelector('.status');
      if(status && item.purchased){ status.textContent=item.completion_method==='on_me'?'على حسابي ✓':'اتوفرت ✓'; }
      if(item.added_by_member_id===me.id && !item.purchased && !card.querySelector('.v21-edit-own')){
        const actions=card.querySelector('.food-responsibility-action')||card;
        const btn=document.createElement('button'); btn.className='btn secondary v21-edit-own'; btn.textContent='✏️ تعديل اللي ضفته'; btn.onclick=()=>openShoppingModal(item); actions.appendChild(btn);
        const del=document.createElement('button'); del.className='btn danger'; del.textContent='حذف'; del.onclick=async()=>{ if(!confirm('تحذف الحاجة دي؟'))return; const {error}=await client.rpc('delete_own_added_shopping_item',{p_item_id:item.id}); if(error){toast('مينفعش تتحذف دلوقتي');return;} location.reload();}; actions.appendChild(del);
      }
      if(item.responsible_member_id===me.id && !item.purchased && !card.querySelector('.v21-on-me')){
        const actions=card.querySelector('.food-responsibility-action')||card;
        const btn=document.createElement('button'); btn.className='btn secondary v21-on-me'; btn.textContent='🎁 على حسابي';
        btn.onclick=async()=>{ if(!confirm(`تقفل ${item.name} على حسابك من غير ما تدخل مبلغ في الحسابات؟`))return; const {error}=await client.rpc('mark_item_on_me',{p_item_id:item.id}); if(error){toast('حصلت مشكلة');return;} toast('اتوفرت على حسابك ✅'); setTimeout(()=>location.reload(),350);}; actions.appendChild(btn);
      }
      if(item.added_by_member_id===me.id && !card.querySelector('.v21-owner-tag')){ const d=document.createElement('div'); d.className='v21-owner-tag'; d.textContent='أنت اللي ضفت الحاجة دي'; card.appendChild(d); }
    });
  }

  async function responsibilityCounts(){
    if(!document.getElementById('shoppingByPerson')) return;
    const client=makeClient(); if(!client) return;
    const [{data:members},{data:items}]=await Promise.all([
      client.from('members').select('id,name,sort_order').eq('trip_id',trip().id).order('sort_order'),
      client.from('shopping_items').select('responsible_member_id,purchased').eq('trip_id',trip().id)
    ]);
    const section=document.getElementById('shoppingByPerson')?.parentElement;
    if(section && !document.getElementById('v21Counts')){
      const wrap=document.createElement('div'); wrap.id='v21Counts'; wrap.className='v21-counts';
      wrap.innerHTML=(members||[]).map(m=>{const all=(items||[]).filter(x=>x.responsible_member_id===m.id);const open=all.filter(x=>!x.purchased).length;return `<div class="v21-count-card"><strong>${esc(m.name)}</strong><span>${all.length} حاجة • ${open} ناقص</span></div>`}).join('');
      section.insertBefore(wrap,document.getElementById('shoppingByPerson'));
    }
  }

  async function ideasEnhance(){
    if(!document.getElementById('ideasList')) return;
    const client=makeClient(); if(!client) return;
    const [{data:ideas},{data:members}]=await Promise.all([
      client.from('ideas').select('*').eq('trip_id',trip().id).order('created_at',{ascending:false}),
      client.from('members').select('id,name').eq('trip_id',trip().id)
    ]);
    const names=Object.fromEntries((members||[]).map(m=>[m.id,m.name]));
    const labels={new:'💡 اقتراح جديد',in_progress:'🛠️ شغالين عليه',done:'✅ تم التنفيذ'};
    const list=document.getElementById('ideasList');
    list.innerHTML=(ideas||[]).length?(ideas||[]).map(x=>`<div class="card idea-card-v21">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><div>${esc(x.body)}</div><span class="idea-status ${x.status}">${labels[x.status]||labels.new}</span></div>
      <div class="idea-meta-v21">— ${esc(names[x.member_id]||'الأشقياء')} • ${new Date(x.created_at).toLocaleDateString('ar-EG')}</div>
      ${x.status==='done'?`<div class="idea-done-note">🏆 اتنفذت فكرتك${x.implemented_version?` في ${esc(x.implemented_version)}`:''}</div>`:''}
      ${isAdmin()?`<div class="idea-actions-v21"><button class="btn secondary idea-state" data-id="${x.id}" data-state="new">جديد</button><button class="btn secondary idea-state" data-id="${x.id}" data-state="in_progress">شغالين عليه</button><button class="btn idea-state" data-id="${x.id}" data-state="done">تم التنفيذ</button></div>`:''}
    </div>`).join(''):'<div class="muted">لسه مفيش اقتراحات.</div>';
    list.querySelectorAll('.idea-state').forEach(btn=>btn.onclick=async()=>{
      const state=btn.dataset.state; const patch={status:state,implemented_version:state==='done'?VERSION:null,implemented_at:state==='done'?new Date().toISOString():null};
      const {error}=await client.from('ideas').update(patch).eq('id',btn.dataset.id); if(error){toast('حصلت مشكلة');return;} location.reload();
    });

    const roadmap=[...document.querySelectorAll('h2')].find(h=>h.textContent.trim()==='Roadmap')?.closest('.section');
    if(roadmap && !document.getElementById('v21Releases')){
      const sec=document.createElement('section'); sec.id='v21Releases'; sec.className='section';
      sec.innerHTML=`<div class="section-title"><h2>✨ الجديد في التطبيق</h2><small>${VERSION}</small></div><div class="release-grid">
        <div class="release-card"><strong>📍 Live Location</strong><span>مشاركة الموقع لمدة محددة أثناء طريق الذهاب والعودة.</span></div>
        <div class="release-card"><strong>➕ إضافة سريعة</strong><span>أي حد يضيف حاجة ناقصة وهو في السوبرماركت ويعدل اللي أضافه.</span></div>
        <div class="release-card"><strong>🎁 على حسابي</strong><span>تقفل الحاجة بدون إضافة مبلغ للتسوية.</span></div>
        <div class="release-card"><strong>🎒 أساسيات الشنطة</strong><span>أساسيات مشتركة اتضافت لكل واحد من غير ما تكشف شنطة حد للتاني.</span></div>
        <div class="release-card"><strong>📊 توزيع المسؤوليات</strong><span>عداد واضح بعدد الحاجات على كل واحد.</span></div>
        <div class="release-card"><strong>🧾 فاتورة مختلطة</strong><span>فاتورة سوبرماركت واحدة تقدر تقفل أصناف من أكتر من تصنيف.</span></div>
      </div>`;
      roadmap.insertAdjacentElement('beforebegin',sec);
    }
  }

  async function maybeCongrats(){
    const me=member(); if(!me || me.name!=='إيمولا') return;
    if(localStorage.getItem(VERSION_KEY+'-imola-location')) return;
    const client=makeClient();
    const {data}=await client.from('ideas').select('id,status,body,implemented_version').eq('member_id',me.id).eq('status','done');
    const hit=(data||[]).find(x=>/location/i.test(x.body||'')); if(!hit) return;
    const wrap=document.createElement('div'); wrap.className='v21-congrats'; wrap.innerHTML=`<div class="v21-congrats-card"><div class="emoji">🎉📍</div><h2>مبروك يا إيمولا!</h2><p>اقتراحك <strong>Share Location</strong> اتنفذ وبقى Live Location في الرحلة.</p><button class="btn">جامد 😎</button></div>`;
    wrap.querySelector('button').onclick=()=>{localStorage.setItem(VERSION_KEY+'-imola-location','1');wrap.remove();}; document.body.appendChild(wrap);
  }

  async function locationPage(){
    if(!document.getElementById('liveMap')) return;
    const client=makeClient(); if(!client) return;
    const me=member(), tr=trip();
    if(!window.L){ document.getElementById('liveMap').innerHTML='<div class="card">الخريطة محتاجة إنترنت عشان تتحمل.</div>'; return; }
    const map=L.map('liveMap',{zoomControl:true}).setView([29.9,32.7],7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
    const markers=new Map(); let watchId=null,lastSent=0,expiryTimer=null;
    const people=document.getElementById('livePeople'); const status=document.getElementById('myLiveStatus'); const stop=document.getElementById('stopLive');
    const fmtAgo=iso=>{const s=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));if(s<60)return `من ${s} ث`;if(s<3600)return `من ${Math.floor(s/60)} د`;return `من ${Math.floor(s/3600)} س`;};
    async function members(){const {data}=await client.from('members').select('id,name').eq('trip_id',tr.id);return data||[];}
    async function refresh(){
      const [{data:rows},ms]=await Promise.all([client.from('location_shares').select('*').eq('trip_id',tr.id),members()]);
      const names=Object.fromEntries(ms.map(m=>[m.id,m.name])); const now=Date.now(); const active=(rows||[]).filter(r=>r.active && new Date(r.expires_at).getTime()>now);
      const seen=new Set(); active.forEach(r=>{seen.add(r.member_id);const label=names[r.member_id]||'صاحبنا';let mk=markers.get(r.member_id);if(!mk){mk=L.marker([r.latitude,r.longitude]).addTo(map).bindPopup(label);markers.set(r.member_id,mk);}else mk.setLatLng([r.latitude,r.longitude]);mk.setPopupContent(`${label}<br>${fmtAgo(r.updated_at)}`);});
      [...markers.keys()].forEach(id=>{if(!seen.has(id)){map.removeLayer(markers.get(id));markers.delete(id);}});
      if(active.length){const group=L.featureGroup([...markers.values()]);try{map.fitBounds(group.getBounds().pad(.25),{maxZoom:13});}catch(e){}}
      people.innerHTML=ms.map(m=>{const r=active.find(x=>x.member_id===m.id);const stale=r?(now-new Date(r.updated_at).getTime()>120000):true;return `<div class="live-person ${stale?'stale':''}"><strong>${esc(m.name)}</strong><small>${r?`آخر تحديث ${fmtAgo(r.updated_at)}`:'مش مشارك دلوقتي'}</small><div class="live-status ${r?'on':'off'}">${r?'● Live':'○ Offline'}</div></div>`}).join('');
      const mine=active.find(x=>x.member_id===me.id); status.textContent=mine?`موقعك شغال لحد ${new Date(mine.expires_at).toLocaleTimeString('ar-EG',{hour:'numeric',minute:'2-digit'})}`:'موقعك مش شغال'; stop.style.display=mine?'inline-flex':'none';
    }
    async function send(pos,expiresAt,startedAt){
      const now=Date.now(); if(now-lastSent<12000)return; lastSent=now;
      const c=pos.coords; const row={member_id:me.id,trip_id:tr.id,latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy||null,heading:c.heading||null,speed:c.speed||null,started_at:startedAt,expires_at:expiresAt,updated_at:new Date().toISOString(),active:true};
      const {error}=await client.from('location_shares').upsert(row,{onConflict:'member_id'}); if(error) console.error(error);
    }
    function startWatch(expiresAt,startedAt){
      if(watchId!==null) navigator.geolocation.clearWatch(watchId);
      watchId=navigator.geolocation.watchPosition(p=>{if(Date.now()>=new Date(expiresAt).getTime()){stopShare();return;}send(p,expiresAt,startedAt);},()=>toast('راجع إذن الموقع في الموبايل'),{enableHighAccuracy:true,maximumAge:8000,timeout:20000});
      clearTimeout(expiryTimer); expiryTimer=setTimeout(stopShare,Math.max(1000,new Date(expiresAt).getTime()-Date.now()));
    }
    async function startShare(hours){
      if(!navigator.geolocation){toast('الموبايل مش بيدعم تحديد الموقع');return;}
      const startedAt=new Date().toISOString(),expiresAt=new Date(Date.now()+hours*3600000).toISOString();
      status.textContent='بنحدد موقعك...';
      navigator.geolocation.getCurrentPosition(async p=>{await send(p,expiresAt,startedAt);startWatch(expiresAt,startedAt);refresh();toast(`Live Location شغال ${hours} ساعات ✅`);},()=>toast('اسمح للتطبيق باستخدام الموقع'),{enableHighAccuracy:true,timeout:20000});
    }
    async function stopShare(){ if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;} clearTimeout(expiryTimer); await client.from('location_shares').update({active:false,updated_at:new Date().toISOString()}).eq('member_id',me.id); refresh(); }
    document.getElementById('startLive').onclick=()=>startShare(Number(document.getElementById('liveHours').value||3)); stop.onclick=stopShare;
    const {data:mine}=await client.from('location_shares').select('*').eq('member_id',me.id).maybeSingle(); if(mine?.active && new Date(mine.expires_at).getTime()>Date.now()) startWatch(mine.expires_at,mine.started_at);
    await refresh();
    client.channel('trip-live-location').on('postgres_changes',{event:'*',schema:'public',table:'location_shares',filter:`trip_id=eq.${tr.id}`},refresh).subscribe();
    setInterval(refresh,30000);
  }

  async function main(){
    css(); if(!(await waitForApp())) return;
    addLocationNav(); addVersion();
    await Promise.allSettled([shoppingEnhance(),responsibilityCounts(),ideasEnhance(),locationPage()]);
    await maybeCongrats();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(main,250)); else setTimeout(main,250);
})();
