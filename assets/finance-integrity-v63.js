(() => {
  if(window.__KENZ_FINANCE_INTEGRITY_V63__)return;
  window.__KENZ_FINANCE_INTEGRITY_V63__=true;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const page=()=>location.pathname.split('/').pop()||'index.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  let client=null,shoppingItems=[],locks=[];

  function style(){
    if($('#fi63Style'))return;
    const s=document.createElement('style');s.id='fi63Style';s.textContent=`
      .fi63-lock{margin-top:9px;padding:9px 10px;border-radius:11px;border:1px solid rgba(241,213,143,.22);background:rgba(241,213,143,.075);font-size:9px;line-height:1.65;color:#f4dfaa}.fi63-lock strong{display:block;color:#fff;margin-bottom:2px}.fi63-locked-control{opacity:.52!important;pointer-events:none!important}.fi63-pending-panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:14px}.fi63-pending-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.fi63-pending-list{display:grid;gap:8px}.fi63-request{padding:11px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}.fi63-request-top{display:flex;justify-content:space-between;gap:10px}.fi63-request-title{font-size:10px;font-weight:1000}.fi63-request-meta{font-size:8px;color:var(--muted,#9fb0bb);margin-top:3px}.fi63-request-items{font-size:8px;color:var(--muted,#9fb0bb);margin-top:7px}.fi63-request-actions{margin-top:9px}.fi63-request-actions .btn{min-height:36px;font-size:9px}
    `;document.head.appendChild(s);
  }

  async function getClient(){
    if(client)return client;
    const c=window.SUPABASE_CONFIG||{};if(!window.supabase||!c.url||!c.key)return null;
    client=window.supabase.createClient(c.url,c.key);try{await client.auth.getSession()}catch(_){};return client;
  }
  async function rpc(name,args={}){const c=await getClient();if(!c)throw new Error('DB_NOT_READY');const {data,error}=await c.rpc(name,args);if(error)throw error;return data}
  const norm=v=>String(v||'').trim().replace(/\s+/g,' ');

  function lockMap(){return Object.fromEntries((locks||[]).filter(x=>x.lock_state).map(x=>[x.shopping_item_id,x]))}
  function decorateShopping(){
    if(page()!=='shopping.html')return;
    const map=lockMap(),byName=Object.fromEntries(shoppingItems.map(x=>[norm(x.name),x]));
    $$('.food-item-card').forEach(card=>{
      const item=byName[norm(card.querySelector('.food-item-name')?.textContent)];if(!item)return;
      const lock=map[item.id];
      card.querySelector('.fi63-lock')?.remove();
      if(!lock)return;
      const banner=document.createElement('div');banner.className='fi63-lock';banner.innerHTML=`<strong>🔒 الصنف مقفول للحماية</strong>${esc(lock.lock_message||'مرتبط بسجل مالي')}`;
      const head=card.querySelector('.food-item-head');head?.insertAdjacentElement('afterend',banner);
      card.querySelectorAll('.food-edit-details input,.food-edit-details select,.food-edit-details button,.food-owner-select,.food-release').forEach(el=>{
        el.disabled=true;el.classList.add('fi63-locked-control');
      });
      const del=card.querySelector('.del-item');if(del){del.disabled=true;del.textContent='🔒 لا يمكن الحذف';}
      const summary=card.querySelector('.food-edit-details summary');if(summary)summary.textContent='🔒 بيانات الصنف مقفولة بعد دخوله الدورة المالية';
    });
  }
  async function loadShoppingLocks(){
    if(page()!=='shopping.html'||!window.TripDB?.isBound?.())return;
    try{[shoppingItems,locks]=await Promise.all([TripDB.list('shopping_items',{order:'sort_order'}),rpc('shopping_item_lock_states')]);decorateShopping()}catch(e){console.warn('[V63 shopping locks]',e)}
  }

  function pendingHost(){
    if(page()!=='expenses.html')return null;
    let sec=$('#fi63PendingSection');if(sec)return sec;
    const anchor=$('#purchaseEntry')?.closest('.section');if(!anchor)return null;
    sec=document.createElement('section');sec.className='section';sec.id='fi63PendingSection';sec.innerHTML='<div class="fi63-pending-panel"><div class="fi63-pending-head"><strong>⏳ طلباتي المعلقة</strong><small id="fi63PendingCount">—</small></div><div id="fi63PendingList" class="fi63-pending-list"></div></div>';
    anchor.after(sec);return sec;
  }
  async function renderPending(){
    if(page()!=='expenses.html'||!window.TripDB?.isBound?.())return;
    try{
      const rows=(await rpc('my_expense_approval_requests')||[]).filter(x=>x.status==='pending');
      let sec=pendingHost();if(!sec)return;
      if(!rows.length){sec.style.display='none';return}else sec.style.display='block';
      $('#fi63PendingCount').textContent=`${rows.length.toLocaleString('ar-EG')} معلّق`;
      $('#fi63PendingList').innerHTML=rows.map(r=>{
        const items=(r.items||[]).map(x=>x.name).filter(Boolean).join('، ');
        return `<article class="fi63-request"><div class="fi63-request-top"><div><div class="fi63-request-title">${r.request_type==='purchase'?'🛒 فاتورة مشتريات':'💰 مصروف عام'}</div><div class="fi63-request-meta">مستني موافقة الأدمن</div></div><strong>${money(r.amount)}</strong></div>${items?`<div class="fi63-request-items">${esc(items)}</div>`:''}<div class="fi63-request-actions"><button class="btn secondary fi63-cancel-request" data-id="${r.id}" type="button">إلغاء الطلب</button></div></article>`;
      }).join('');
      $$('.fi63-cancel-request').forEach(btn=>btn.onclick=async()=>{
        if(!confirm('تلغي الطلب؟ لو فاتورة مشتريات، الأصناف هترجع متاحة للتسجيل من جديد.'))return;
        btn.disabled=true;
        try{await rpc('cancel_my_expense_request',{p_request_id:btn.dataset.id,p_reason:'ألغاه صاحب الطلب'});window.toast?.('تم إلغاء الطلب ورجع مفتوح للتعديل ✅');await renderPending();try{await window.renderPurchaseQueue?.()}catch(_){}}
        catch(e){const m=String(e?.message||e);window.toast?.(m.includes('REQUEST_ALREADY_REVIEWED')?'الطلب اتراجع بالفعل':'ما قدرناش نلغي الطلب');}
        finally{btn.disabled=false}
      });
    }catch(e){console.warn('[V63 pending requests]',e)}
  }

  async function start(){
    style();for(let i=0;i<120&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,80));
    await Promise.all([loadShoppingLocks(),renderPending()]);
    if(page()==='shopping.html'){
      const body=$('#foodBody');if(body)new MutationObserver(()=>setTimeout(decorateShopping,30)).observe(body,{childList:true,subtree:true});
      setInterval(decorateShopping,1000);setInterval(loadShoppingLocks,10000);
    }
    if(page()==='expenses.html')setInterval(renderPending,12000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',()=>{loadShoppingLocks();renderPending()});
})();