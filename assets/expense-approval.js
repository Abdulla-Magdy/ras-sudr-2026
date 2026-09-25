(() => {
  if (window.__KENZ_EXPENSE_APPROVAL__) return;
  window.__KENZ_EXPENSE_APPROVAL__ = true;

  const VERSION='V52';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const page=()=>location.pathname.split('/').pop()||'index.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  let client=null, patched=false, toastPatched=false, lastMine=[], busy=false, adminMode='pending';
  const localPendingItemIds=new Set();

  function injectStyle(){
    if($('#ea52Style'))return;
    const s=document.createElement('style');s.id='ea52Style';s.textContent=`
      .ea52-admin-link{position:relative}.ea52-badge{display:inline-flex;min-width:18px;height:18px;padding:0 5px;border-radius:999px;align-items:center;justify-content:center;background:#ff647c;color:#fff;font-size:8px;font-weight:1000;margin-inline-start:5px}
      .ea52-panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:14px}.ea52-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.ea52-head h2{margin:0;font-size:14px}.ea52-head small{color:var(--muted,#9fb0bb);font-size:8px}
      .ea52-list{display:grid;gap:9px}.ea52-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.065);border-radius:15px;padding:12px}.ea52-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ea52-title{font-weight:1000;font-size:11px}.ea52-meta{font-size:8.5px;color:var(--muted,#9fb0bb);line-height:1.7;margin-top:4px}.ea52-amount{font-size:16px;font-weight:1000;white-space:nowrap}.ea52-note{margin-top:8px;padding:8px 9px;border-radius:10px;background:rgba(255,255,255,.035);font-size:8.5px;color:var(--muted,#9fb0bb)}
      .ea52-items{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.ea52-chip{font-size:8px;padding:5px 7px;border-radius:999px;background:rgba(103,227,220,.09);border:1px solid rgba(103,227,220,.15)}.ea52-status{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:8px;font-weight:900}.ea52-status.pending{background:rgba(241,213,143,.12);color:#f1d58f}.ea52-status.approved{background:rgba(154,243,186,.12);color:#b8f7ce}.ea52-status.rejected{background:rgba(255,100,124,.12);color:#ff9bab}
      .ea52-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.ea52-actions .btn{flex:1;min-width:110px}.ea52-review-note{width:100%;box-sizing:border-box;margin-top:9px}.ea52-empty{padding:18px;text-align:center;color:var(--muted,#9fb0bb);font-size:9px}.ea52-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.ea52-tab{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);color:inherit;padding:10px;border-radius:13px;font-weight:900;font-size:9px}.ea52-tab.active{background:rgba(103,227,220,.14);border-color:rgba(103,227,220,.35)}
      .ea52-pending-shopping{opacity:.62}.ea52-pending-shopping::after{content:'قيد مراجعة الأدمن';font-size:8px;color:#f1d58f;margin-inline-start:auto}.ea52-locked .v38-expense-actions{display:none!important}
      @media(max-width:640px){.ea52-card-top{align-items:flex-start}.ea52-amount{font-size:14px}.ea52-panel{padding:12px}}
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

  function statusLabel(s){return s==='approved'?'✅ معتمد':s==='rejected'?'❌ مرفوض':'⏳ تحت المراجعة'}
  function requestType(r){return r.request_type==='purchase'?'🛒 فاتورة مشتريات':'💰 مصروف عام'}
  function ago(v){
    if(!v)return '';
    const m=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000));
    if(m<1)return 'حالًا';if(m<60)return `من ${m.toLocaleString('ar-EG')} د`;
    const h=Math.floor(m/60);if(h<24)return `من ${h.toLocaleString('ar-EG')} س`;
    return new Date(v).toLocaleDateString('ar-EG',{day:'numeric',month:'short'});
  }

  function patchToast(){
    if(toastPatched||typeof window.toast!=='function')return;
    const original=window.toast.bind(window);
    window.toast=(msg,...args)=>{
      if(msg==='الفاتورة اتسجلت والمشتريات اتقفلت ✅')msg='الفاتورة اتبعتت للأدمن للمراجعة ⏳';
      return original(msg,...args);
    };
    toastPatched=true;
  }

  function patchTripDB(){
    if(patched||!window.TripDB?.insert||!window.TripDB?.recordPurchaseBatch)return;
    const originalInsert=window.TripDB.insert.bind(window.TripDB);
    const originalPurchase=window.TripDB.recordPurchaseBatch.bind(window.TripDB);

    window.TripDB.insert=async(table,row)=>{
      if(table!=='expenses')return originalInsert(table,row);
      const id=await rpc('submit_expense_for_approval',{
        p_payer_member_id:row.payer_member_id||window.TripDB.getMember?.()?.id,
        p_category_id:row.category_id,
        p_amount:Number(row.amount),
        p_note:row.note||null
      });
      window.toast?.('المصروف اتبعت للأدمن للمراجعة ⏳');
      setTimeout(()=>hydrate(true),80);
      return {...row,id,pending:true};
    };

    window.TripDB.recordPurchaseBatch=async(payerMemberId,itemIds,amount,note='')=>{
      const id=await originalPurchase(payerMemberId,itemIds,amount,note);
      (itemIds||[]).forEach(x=>localPendingItemIds.add(x));
      setTimeout(()=>hydrate(true),100);
      return id;
    };
    patched=true;
  }

  function ensureAdminLink(){
    if(!window.TripDB?.isAdmin?.())return;
    // Review requests are reached through the admin dashboard.
    $$('.ea52-admin-link').forEach(x=>x.remove());
    return;
    const desktop=$('.links');
    if(desktop&&!desktop.querySelector('a[href="admin-expenses.html"]')){
      const a=document.createElement('a');a.href='admin-expenses.html';a.className='ea52-admin-link';a.innerHTML='🧾 مراجعة المصاريف <span class="ea52-badge" data-ea52-count hidden>0</span>';
      const crew=desktop.querySelector('a[href="crew.html"]');crew?crew.before(a):desktop.appendChild(a);
    }
    const drawer=$('#mobileMenuDrawer .mobile-drawer-links');
    if(drawer&&!drawer.querySelector('a[href="admin-expenses.html"]')){
      const a=document.createElement('a');a.href='admin-expenses.html';a.className='ea52-admin-link';a.innerHTML='<span class="nav-icon">🧾</span><span class="nav-label">مراجعة المصاريف</span><span class="ea52-badge" data-ea52-count hidden>0</span>';
      const crew=drawer.querySelector('a[href="crew.html"]');crew?crew.before(a):drawer.appendChild(a);
    }
  }

  async function refreshAdminCount(){
    if(!window.TripDB?.isAdmin?.())return;
    try{
      const n=Number(await rpc('admin_pending_expense_count'))||0;
      $$('[data-ea52-count]').forEach(x=>{x.textContent=n.toLocaleString('ar-EG');x.hidden=n===0});
    }catch(_){ }
  }

  async function loadMine(){
    try{lastMine=await rpc('my_expense_approval_requests')||[]}catch(e){console.warn('[V52 mine approvals]',e);lastMine=[]}
    localPendingItemIds.clear();
    lastMine.filter(r=>r.status==='pending'&&r.request_type==='purchase').forEach(r=>(r.items||[]).forEach(i=>localPendingItemIds.add(i.id)));
    return lastMine;
  }

  function pendingCard(r,admin=false){
    const items=(r.items||[]).map(i=>`<span class="ea52-chip">${esc(i.name)}${i.qty?` • ${esc(i.qty)} ${esc(i.unit||'')}`:''}</span>`).join('');
    const meta=admin
      ? `${esc(r.submitter_name||'—')} أضافها${r.payer_name&&r.payer_name!==r.submitter_name?` • الدفع باسم ${esc(r.payer_name)}`:''}${r.category_name?` • ${esc(r.category_name)}`:''} • ${ago(r.created_at)}`
      : `${esc(r.payer_name||'—')}${r.category_name?` • ${esc(r.category_name)}`:''} • ${ago(r.created_at)}`;
    return `<article class="ea52-card" data-request="${r.id}"><div class="ea52-card-top"><div><div class="ea52-title">${requestType(r)}</div><div class="ea52-meta">${meta}</div></div><div style="text-align:left"><div class="ea52-amount">${money(r.amount)}</div><span class="ea52-status ${esc(r.status)}">${statusLabel(r.status)}</span></div></div>${items?`<div class="ea52-items">${items}</div>`:''}${r.note?`<div class="ea52-note">📝 ${esc(r.note)}</div>`:''}${r.review_note?`<div class="ea52-note">ملاحظة الأدمن: ${esc(r.review_note)}</div>`:''}${admin&&r.status==='pending'?`<input class="text-input ea52-review-note" data-note-for="${r.id}" placeholder="ملاحظة للمراجع (اختياري)"><div class="ea52-actions"><button class="btn ea52-approve" data-id="${r.id}">✅ اعتماد</button><button class="btn danger ea52-reject" data-id="${r.id}">رفض</button></div>`:''}</article>`;
  }

  function ensureMinePanel(){
    if(page()!=='expenses.html')return null;
    let sec=$('#ea52MineSection');if(sec)return sec;
    const anchor=$('.v38-expense-tabs')?.closest('.section');if(!anchor)return null;
    sec=document.createElement('section');sec.className='section';sec.id='ea52MineSection';
    sec.innerHTML='<div class="ea52-panel"><div class="ea52-head"><h2>⏳ طلباتي تحت المراجعة</h2><small id="ea52MineCount">—</small></div><div id="ea52MineList" class="ea52-list"><div class="ea52-empty">بنحمّل…</div></div></div>';
    anchor.before(sec);return sec;
  }

  async function renderMine(){
    const sec=ensureMinePanel();if(!sec)return;
    const rows=await loadMine();
    const pending=rows.filter(r=>r.status==='pending');
    $('#ea52MineCount').textContent=`${pending.length.toLocaleString('ar-EG')} معلّق`;
    $('#ea52MineList').innerHTML=pending.length?pending.map(r=>pendingCard(r,false)).join(''):'<div class="ea52-empty">مفيش حاجة مستنية مراجعة حاليًا ✅</div>';
    syncPendingShoppingDom();
  }

  function syncPendingShoppingDom(){
    if(page()!=='expenses.html')return;
    $$('.purchase-item-check').forEach(ch=>{
      const pending=localPendingItemIds.has(ch.value);
      ch.disabled=pending;
      ch.checked=pending?false:ch.checked;
      const row=ch.closest('.purchase-queue-item');
      if(row)row.classList.toggle('ea52-pending-shopping',pending);
    });
  }

  async function review(id,approve){
    if(busy)return;busy=true;
    try{
      const note=$(`[data-note-for="${id}"]`)?.value.trim()||null;
      if(!approve&&!confirm('ترفض الطلب ده؟'))return;
      if(approve&&!confirm('تعتمد الطلب ويتسجل فعليًا في الحسابات؟'))return;
      await rpc('admin_review_expense_request',{p_request_id:id,p_approve:!!approve,p_review_note:note});
      window.toast?.(approve?'اتعمد واتسجل في الحسابات ✅':'اترفض الطلب');
      await Promise.all([renderAdmin(),refreshAdminCount()]);
    }catch(e){
      console.error('[V52 review]',e);
      const msg=String(e?.message||e||'');
      window.toast?.(msg.includes('ITEM_ALREADY_PURCHASED')?'في صنف اتسجل كمشتَرى قبل الاعتماد':msg.includes('REQUEST_ALREADY_REVIEWED')?'الطلب اتراجع بالفعل':'حصلت مشكلة في المراجعة');
    }finally{busy=false}
  }

  async function renderAdmin(){
    if(page()!=='admin-expenses.html')return;
    const host=$('#expenseApprovalAdminApp');if(!host)return;
    if(!window.TripDB?.isBound?.()){host.innerHTML='<div class="ea52-empty">سجّل دخول الأول.</div>';return}
    if(!window.TripDB?.isAdmin?.()){host.innerHTML='<div class="ea52-panel"><div class="ea52-empty">الصفحة دي للأدمن فقط 🔒</div></div>';return}
    try{
      const all=await rpc('admin_list_expense_approval_requests',{p_status:null})||[];
      const pending=all.filter(r=>r.status==='pending');
      const rows=adminMode==='pending'?pending:all;
      host.innerHTML=`<div class="ea52-tabs"><button class="ea52-tab ${adminMode==='pending'?'active':''}" data-ea52-mode="pending">⏳ للمراجعة (${pending.length.toLocaleString('ar-EG')})</button><button class="ea52-tab ${adminMode==='all'?'active':''}" data-ea52-mode="all">📚 السجل (${all.length.toLocaleString('ar-EG')})</button></div><div class="ea52-panel"><div class="ea52-head"><h2>${adminMode==='pending'?'الطلبات المنتظرة':'كل طلبات المصاريف'}</h2><small>${VERSION}</small></div><div class="ea52-list">${rows.length?rows.map(r=>pendingCard(r,true)).join(''):'<div class="ea52-empty">مفيش طلبات هنا حاليًا ✅</div>'}</div></div>`;
      host.querySelectorAll('[data-ea52-mode]').forEach(b=>b.onclick=()=>{adminMode=b.dataset.ea52Mode;renderAdmin()});
      host.querySelectorAll('.ea52-approve').forEach(b=>b.onclick=()=>review(b.dataset.id,true));
      host.querySelectorAll('.ea52-reject').forEach(b=>b.onclick=()=>review(b.dataset.id,false));
    }catch(e){console.error(e);host.innerHTML='<div class="ea52-panel"><div class="ea52-empty">مش قادرين نحمّل الطلبات دلوقتي.</div></div>'}
  }

  async function hydrate(force=false){
    injectStyle();patchToast();patchTripDB();ensureAdminLink();
    if(window.TripDB?.isBound?.()&&!window.TripDB?.isAdmin?.())document.body.classList.add('ea52-locked');
    else document.body.classList.remove('ea52-locked');
    if(page()==='expenses.html'&&(force||!lastMine.length))await renderMine();
    else syncPendingShoppingDom();
    if(page()==='admin-expenses.html')await renderAdmin();
    await refreshAdminCount();
  }

  async function waitAndStart(){
    injectStyle();
    for(let i=0;i<120;i++){
      if(window.TripDB?.isBound?.())break;
      await new Promise(r=>setTimeout(r,100));
    }
    await hydrate(true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitAndStart,{once:true});else waitAndStart();
  window.addEventListener('pageshow',()=>hydrate(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')hydrate(true)});
  setInterval(()=>hydrate(false),1200);
  window.KenzExpenseApproval={hydrate,renderAdmin};
})();
