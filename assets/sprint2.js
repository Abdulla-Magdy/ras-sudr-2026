(() => {
  if (window.__KENZ_SPRINT2__) return;
  window.__KENZ_SPRINT2__ = true;

  const VERSION='V46';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const num=v=>Number(v||0);
  let client=null, lastKey='', busy=false, showCarForm=false;

  const STATUS={
    planning:['بنظبط الدنيا','📝'],
    to_meeting:['رايح التجمع','📍'],
    ready:['جاهز للتحرك','✅'],
    on_way:['اتحركنا','🚗'],
    arrived:['وصلنا','🏁']
  };

  function injectStyle(){
    if($('#s2Style'))return;
    const s=document.createElement('style');s.id='s2Style';s.textContent=`
      .s2-readiness-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .s2-ready-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:13px;min-width:0}
      .s2-ready-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}.s2-ready-head span{font-size:10px;color:var(--muted,#9fb0bb);font-weight:800}.s2-ready-head strong{font-size:18px}
      .s2-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden}.s2-bar>i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#67e3dc,#9af3ba)}
      .s2-ready-sub{font-size:8px;color:var(--muted,#9fb0bb);margin-top:7px;line-height:1.6}
      .s2-blockers{display:grid;gap:7px;margin-top:11px}.s2-blocker{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.028);color:inherit;text-decoration:none;font-size:9px}.s2-blocker b{font-size:10px}.s2-blocker.ok{opacity:.65}
      .s2-readiness-link{font-size:9px;text-decoration:none;color:var(--accent,#67e3dc);font-weight:900}
      .s2-transport-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.s2-stat{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:15px;padding:12px;text-align:center}.s2-stat strong{display:block;font-size:21px}.s2-stat span{font-size:8px;color:var(--muted,#9fb0bb)}
      .s2-car-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:14px;margin-bottom:10px}.s2-car-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.s2-car-head h3{margin:0;font-size:14px}.s2-status{font-size:8px;padding:5px 8px;border-radius:999px;background:rgba(103,227,220,.12);white-space:nowrap}.s2-car-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.s2-chip{font-size:8px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.055);color:var(--muted,#9fb0bb)}.s2-chip.me{color:#fff;background:rgba(103,227,220,.13)}
      .s2-passengers{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.s2-empty{padding:16px;text-align:center;color:var(--muted,#9fb0bb);font-size:9px}
      .s2-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.s2-form .full{grid-column:1/-1}.s2-field{display:grid;gap:5px}.s2-field span{font-size:8px;color:var(--muted,#9fb0bb);font-weight:800}.s2-field input,.s2-field textarea{width:100%;box-sizing:border-box}
      .s2-member-list{display:grid;gap:7px}.s2-member-check{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.025)}.s2-member-check label{display:flex;align-items:center;gap:8px;font-size:9px;font-weight:800}.s2-member-check small{font-size:7px;color:var(--muted,#9fb0bb)}.s2-member-check.disabled{opacity:.45}
      .s2-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.s2-actions .btn{flex:1;min-width:120px}.s2-status-actions{display:flex;gap:6px;overflow-x:auto;padding:3px 0;margin-top:10px}.s2-status-btn{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);color:inherit;padding:8px 9px;border-radius:11px;font-size:8px;white-space:nowrap}.s2-status-btn.active{background:rgba(103,227,220,.16);border-color:rgba(103,227,220,.4)}
      .s2-notice{padding:11px 12px;border-radius:13px;background:rgba(241,213,143,.09);border:1px solid rgba(241,213,143,.18);font-size:9px;line-height:1.7}
      .s2-nav-link{display:flex!important}
      @media(max-width:640px){.s2-readiness-grid{grid-template-columns:1fr}.s2-transport-summary{grid-template-columns:repeat(3,1fr)}.s2-form{grid-template-columns:1fr}.s2-form .full{grid-column:auto}.s2-ready-card{padding:11px}.s2-stat{padding:10px 5px}.s2-stat strong{font-size:17px}}
    `;document.head.appendChild(s);
  }

  async function getClient(){
    if(client)return client;
    const c=window.SUPABASE_CONFIG||{};
    if(!window.supabase||!c.url||!c.key)return null;
    client=window.supabase.createClient(c.url,c.key);
    try{await client.auth.getSession()}catch(_){}
    return client;
  }

  async function rpc(name,args={}){
    const c=await getClient();if(!c)throw new Error('DB_NOT_READY');
    const {data,error}=await c.rpc(name,args);if(error)throw error;return data;
  }

  function pct(done,total){return total>0?Math.round(done*100/total):100}
  function metric(label,value,sub){return `<div class="s2-ready-card"><div class="s2-ready-head"><span>${label}</span><strong>${value}%</strong></div><div class="s2-bar"><i style="width:${Math.max(0,Math.min(100,value))}%"></i></div><div class="s2-ready-sub">${sub}</div></div>`}

  async function renderReadiness(){
    const host=$('#tripReadiness');if(!host)return;
    try{
      const d=await rpc('get_trip_readiness');
      const shopping=pct(num(d.shopping_purchased),num(d.shopping_total));
      const responsibility=pct(num(d.shopping_assigned),num(d.shopping_total));
      const bags=pct(num(d.packing_packed),num(d.packing_total));
      const myBagLeft=Math.max(0,num(d.my_packing_total)-num(d.my_packing_packed));
      const open=Math.max(0,num(d.shopping_total)-num(d.shopping_purchased));
      const transportLeft=Math.max(0,num(d.confirmed_members)-num(d.transport_assigned));
      const blockers=[];
      blockers.push(open?`<a class="s2-blocker" href="shopping.html"><span>🛒 لسه <b>${open.toLocaleString('ar-EG')}</b> مشتريات ما اتجابتش</span><span>‹</span></a>`:`<div class="s2-blocker ok"><span>✅ المشتريات كلها اتقفلت</span></div>`);
      if(num(d.open_unassigned)>0)blockers.push(`<a class="s2-blocker" href="shopping.html"><span>🙋 <b>${num(d.open_unassigned).toLocaleString('ar-EG')}</b> أصناف لسه من غير مسؤول</span><span>‹</span></a>`);
      blockers.push(myBagLeft?`<a class="s2-blocker" href="bag.html"><span>🎒 شنطتك ناقص فيها <b>${myBagLeft.toLocaleString('ar-EG')}</b> حاجات</span><span>‹</span></a>`:`<div class="s2-blocker ok"><span>🎒 شنطتك جاهزة ✅</span></div>`);
      blockers.push(transportLeft?`<a class="s2-blocker" href="transport.html"><span>🚗 <b>${transportLeft.toLocaleString('ar-EG')}</b> لسه مش متوزعين على العربيات</span><span>‹</span></a>`:`<a class="s2-blocker ok" href="transport.html"><span>🚗 توزيع العربيات كامل ✅</span><span>‹</span></a>`);
      host.innerHTML=`<div class="s2-readiness-grid">${metric('🛒 المشتريات',shopping,`${num(d.shopping_purchased).toLocaleString('ar-EG')} من ${num(d.shopping_total).toLocaleString('ar-EG')} اتجابوا`)}${metric('📋 المسؤوليات',responsibility,`${num(d.shopping_assigned).toLocaleString('ar-EG')} صنف ليهم مسؤول`)}${metric('🎒 الشنط',bags,`نسبة إجمالية من غير كشف محتوى شنطة أي حد`)}</div><div class="s2-blockers">${blockers.join('')}</div>`;
    }catch(e){console.warn('[Sprint2 readiness]',e);host.innerHTML='<div class="v38-empty">مش قادرين نحسب الجاهزية دلوقتي.</div>'}
  }

  function statusLabel(status){const x=STATUS[status]||STATUS.planning;return `${x[1]} ${x[0]}`}
  function carOfPassenger(cars,id){return cars.find(c=>(c.passengers||[]).some(p=>p.member_id===id))||null}

  async function renderTransport(){
    if(!$('#transportApp'))return;
    const host=$('#transportApp');
    const me=window.TripDB?.getMember?.();if(!me)return;
    try{
      const d=await rpc('get_trip_transport_overview');
      const cars=Array.isArray(d.cars)?d.cars:[], members=Array.isArray(d.members)?d.members:[], unassigned=Array.isArray(d.unassigned)?d.unassigned:[];
      const myCar=cars.find(c=>c.driver_member_id===me.id)||null;
      const riding=carOfPassenger(cars,me.id);
      const assigned=Math.max(0,members.length-unassigned.length);
      const totalPassengerSpots=cars.reduce((s,c)=>s+num(c.passenger_capacity),0);
      const usedPassengerSpots=cars.reduce((s,c)=>s+(c.passengers||[]).length,0);

      let mine='';
      if(riding&&!myCar){
        mine=`<div class="s2-car-card"><div class="s2-car-head"><div><h3>إنت راكب مع ${esc(riding.driver_name)} 🚗</h3><div class="s2-car-meta">${riding.departure_time?`<span class="s2-chip">⏰ ${esc(riding.departure_time)}</span>`:''}${riding.meeting_point?`<span class="s2-chip">📍 ${esc(riding.meeting_point)}</span>`:''}</div></div><span class="s2-status">${statusLabel(riding.status)}</span></div><div class="s2-notice" style="margin-top:11px">لو قررت تطلع بعربيتك، لازم سواق العربية دي يشيلك من قائمته الأول.</div></div>`;
      }else if(myCar||showCarForm){
        const selected=new Set((myCar?.passengers||[]).map(p=>p.member_id));
        const driverMap=new Map(cars.map(c=>[c.driver_member_id,c]));
        const passengerMap=new Map();cars.forEach(c=>(c.passengers||[]).forEach(p=>passengerMap.set(p.member_id,c)));
        const checks=members.filter(m=>m.id!==me.id).map(m=>{
          const otherDriver=driverMap.get(m.id);const otherRide=passengerMap.get(m.id);const blocked=(otherDriver&&otherDriver.id!==myCar?.id)||(otherRide&&otherRide.id!==myCar?.id);
          let reason='';if(otherDriver&&otherDriver.id!==myCar?.id)reason='طالع بعربيته';else if(otherRide&&otherRide.id!==myCar?.id)reason=`راكب مع ${otherRide.driver_name}`;
          return `<div class="s2-member-check ${blocked?'disabled':''}"><label><input type="checkbox" class="s2-passenger" value="${m.id}" ${selected.has(m.id)?'checked':''} ${blocked?'disabled':''}><span>${esc(m.name)}</span></label>${reason?`<small>${esc(reason)}</small>`:'<small>متاح</small>'}</div>`;
        }).join('');
        mine=`<div class="s2-car-card"><div class="s2-car-head"><div><h3>${myCar?'عربيتك 🚘':'أنا طالع بعربيتي 🚘'}</h3><div class="muted" style="font-size:8px;margin-top:4px">حدد الأماكن والتجمع واختار مين راكب معاك.</div></div>${myCar?`<span class="s2-status">${statusLabel(myCar.status)}</span>`:''}</div><div class="s2-form"><label class="s2-field"><span>كام حد يركب معاك؟</span><input id="s2Capacity" class="text-input" type="number" min="0" max="8" value="${myCar?.passenger_capacity??3}"></label><label class="s2-field"><span>ميعاد التحرك</span><input id="s2Time" class="text-input" type="time" value="${esc(myCar?.departure_time||'')}"></label><label class="s2-field full"><span>مكان التجمع</span><input id="s2Meeting" class="text-input" value="${esc(myCar?.meeting_point||'')}" placeholder="مثال: عند جلاكسي 6:30"></label><label class="s2-field full"><span>ملاحظة</span><textarea id="s2Note" class="textarea" rows="2" placeholder="اختياري">${esc(myCar?.note||'')}</textarea></label><div class="full"><div class="section-title" style="margin-bottom:7px"><h3 style="font-size:11px">مين راكب معاك؟</h3><small>اختار على قد الأماكن</small></div><div class="s2-member-list">${checks||'<div class="s2-empty">مفيش أعضاء متاحين.</div>'}</div></div></div><div class="s2-actions"><button id="s2SaveCar" class="btn">💾 حفظ العربية</button>${myCar?'<button id="s2DeleteCar" class="btn danger">إلغاء عربيتي</button>':'<button id="s2CancelCar" class="btn secondary">إلغاء</button>'}</div>${myCar?`<div style="margin-top:13px"><div class="muted" style="font-size:8px;margin-bottom:5px">حالة العربية يوم السفر</div><div class="s2-status-actions">${Object.entries(STATUS).map(([k,v])=>`<button class="s2-status-btn ${myCar.status===k?'active':''}" data-status="${k}">${v[1]} ${v[0]}</button>`).join('')}</div></div>`:''}</div>`;
      }else{
        mine=`<div class="s2-car-card"><div class="s2-empty">لسه مش راكب مع حد ومش مسجل عربية.</div><button id="s2StartCar" class="btn" style="width:100%">🚘 أنا طالع بعربيتي</button></div>`;
      }

      const carCards=cars.length?cars.map(c=>{
        const ps=c.passengers||[];const seats=`${ps.length.toLocaleString('ar-EG')}/${num(c.passenger_capacity).toLocaleString('ar-EG')}`;
        return `<div class="s2-car-card"><div class="s2-car-head"><div><h3>🚗 عربية ${esc(c.driver_name)}</h3><div class="s2-car-meta"><span class="s2-chip">👥 ${seats} راكبين</span>${c.departure_time?`<span class="s2-chip">⏰ ${esc(c.departure_time)}</span>`:''}${c.meeting_point?`<span class="s2-chip">📍 ${esc(c.meeting_point)}</span>`:''}</div></div><span class="s2-status">${statusLabel(c.status)}</span></div><div class="s2-passengers"><span class="s2-chip me">السواق: ${esc(c.driver_name)}</span>${ps.map(p=>`<span class="s2-chip">${esc(p.name)}</span>`).join('')}${!ps.length?'<span class="s2-chip">لسه مفيش ركاب</span>':''}</div>${c.note?`<div class="muted" style="font-size:8px;margin-top:9px">📝 ${esc(c.note)}</div>`:''}</div>`;
      }).join(''):'<div class="s2-empty">محدش سجل عربية لسه.</div>';

      host.innerHTML=`<section class="section"><div class="s2-transport-summary"><div class="s2-stat"><strong>${cars.length.toLocaleString('ar-EG')}</strong><span>عربيات</span></div><div class="s2-stat"><strong>${assigned.toLocaleString('ar-EG')}/${members.length.toLocaleString('ar-EG')}</strong><span>متوزعين</span></div><div class="s2-stat"><strong>${usedPassengerSpots.toLocaleString('ar-EG')}/${totalPassengerSpots.toLocaleString('ar-EG')}</strong><span>أماكن مستخدمة</span></div></div></section><section class="section"><div class="v38-panel"><div class="v38-panel-head"><h2>ترتيبك إنت</h2></div>${mine}</div></section><section class="section"><div class="v38-panel"><div class="v38-panel-head"><h2>العربيات</h2><small>${cars.length.toLocaleString('ar-EG')} عربيات</small></div>${carCards}</div></section><section class="section"><div class="v38-panel"><div class="v38-panel-head"><h2>لسه مش متوزعين</h2><small>${unassigned.length.toLocaleString('ar-EG')}</small></div><div class="s2-passengers">${unassigned.length?unassigned.map(m=>`<span class="s2-chip">${esc(m.name)}</span>`).join(''):'<span class="s2-chip me">كله اتوزع ✅</span>'}</div></div></section>`;

      $('#s2StartCar')?.addEventListener('click',()=>{showCarForm=true;renderTransport()});
      $('#s2CancelCar')?.addEventListener('click',()=>{showCarForm=false;renderTransport()});
      $('#s2SaveCar')?.addEventListener('click',async()=>{
        const btn=$('#s2SaveCar');if(btn.disabled)return;
        const capacity=Math.max(0,Math.min(8,num($('#s2Capacity')?.value)));
        const passengers=[...document.querySelectorAll('.s2-passenger:checked')].map(x=>x.value);
        if(passengers.length>capacity)return window.toast?.(`اخترت ${passengers.length} والحد ${capacity}`);
        btn.disabled=true;btn.textContent='بنحفظ…';
        try{await rpc('save_my_trip_car',{p_passenger_capacity:capacity,p_departure_time:$('#s2Time')?.value||null,p_meeting_point:$('#s2Meeting')?.value?.trim()||null,p_note:$('#s2Note')?.value?.trim()||null,p_passenger_ids:passengers});showCarForm=false;window.toast?.('العربية اتحفظت ✅');await renderTransport();await renderReadiness()}catch(e){console.error(e);const msg=String(e.message||e);let t='حصلت مشكلة في حفظ العربية';if(msg.includes('CAR_CAPACITY_EXCEEDED'))t='عدد الركاب أكبر من الأماكن';if(msg.includes('PASSENGER_ALREADY_ASSIGNED'))t='حد من المختارين اتوزع على عربية تانية';if(msg.includes('PASSENGER_IS_DRIVER'))t='واحد من المختارين مسجل عربيته';if(msg.includes('DRIVER_ALREADY_PASSENGER'))t='إنت متسجل راكب مع عربية تانية';window.toast?.(t);btn.disabled=false;btn.textContent='💾 حفظ العربية'}
      });
      $('#s2DeleteCar')?.addEventListener('click',async()=>{if(!confirm('تلغي عربيتك وتفك توزيع الركاب؟'))return;try{await rpc('delete_my_trip_car');window.toast?.('العربية اتلغت');showCarForm=false;await renderTransport();await renderReadiness()}catch(e){window.toast?.('حصلت مشكلة')}});
      document.querySelectorAll('.s2-status-btn').forEach(b=>b.addEventListener('click',async()=>{try{await rpc('set_my_trip_car_status',{p_status:b.dataset.status});await renderTransport()}catch(e){window.toast?.('الحالة ما اتحدثتش')}}));
    }catch(e){console.warn('[Sprint2 transport]',e);host.innerHTML='<div class="v38-empty">حصلت مشكلة في تحميل العربيات — جرّب تاني.</div>'}
  }

  function ensureNav(){
    // Transport is reached from the trip hub.
    return;
    const drawer=$('#mobileMenuDrawer .mobile-drawer-links');
    if(drawer&&!drawer.querySelector('a[href="transport.html"]')){
      const ideas=drawer.querySelector('a[href="ideas.html"]');
      const a=document.createElement('a');a.href='transport.html';a.className='s2-nav-link';a.innerHTML='<span class="nav-icon">🚗</span><span class="nav-label">العربيات والتجمع</span>';
      if(ideas)ideas.before(a);else drawer.appendChild(a);
    }
  }

  async function hydrate(){
    injectStyle();ensureNav();
    const path=location.pathname.split('/').pop()||'index.html';
    if(path==='index.html')await renderReadiness();
    if(path==='transport.html')await renderTransport();
    ensureNav();
  }

  async function boot(){
    injectStyle();
    for(let i=0;i<120;i++){
      if(window.TripDB?.getMember?.()){await hydrate();break}
      await new Promise(r=>setTimeout(r,50));
    }
    setInterval(()=>{
      const key=`${location.pathname}|${document.querySelector('#appMain')?.dataset?.s2||''}|${document.querySelector('#appMain')?._s2id||''}`;
      const main=$('#appMain');
      const realKey=`${location.pathname}|${main?String(main.__s2Key||(main.__s2Key=Math.random())):'none'}`;
      if(realKey!==lastKey){lastKey=realKey;hydrate()}
      else ensureNav();
    },700);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')hydrate()});
  }

  window.KenzSprint2={hydrate,renderReadiness,renderTransport};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
