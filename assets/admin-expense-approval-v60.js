(() => {
  if (window.__KENZ_ADMIN_EXPENSE_V60__) return;
  window.__KENZ_ADMIN_EXPENSE_V60__ = true;

  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money = v => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0)) + ' ج';
  let client = null;
  let mode = 'pending';
  let busy = false;
  let lastSignature = '';

  function injectStyle(){
    if ($('#ae60Style')) return;
    const s=document.createElement('style');
    s.id='ae60Style';
    s.textContent=`
      .ae60-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.ae60-tab{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);color:inherit;padding:10px;border-radius:13px;font-weight:900;font-size:9px}.ae60-tab.active{background:rgba(103,227,220,.14);border-color:rgba(103,227,220,.35)}
      .ae60-panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:14px}.ae60-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.ae60-head h2{margin:0;font-size:14px}.ae60-head small{color:var(--muted,#9fb0bb);font-size:8px}.ae60-list{display:grid;gap:9px}.ae60-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.065);border-radius:15px;padding:12px}.ae60-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ae60-title{font-weight:1000;font-size:11px}.ae60-meta{font-size:8.5px;color:var(--muted,#9fb0bb);line-height:1.7;margin-top:4px}.ae60-amount{font-size:16px;font-weight:1000;white-space:nowrap}.ae60-status{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:8px;font-weight:900}.ae60-status.pending{background:rgba(241,213,143,.12);color:#f1d58f}.ae60-status.approved{background:rgba(154,243,186,.12);color:#b8f7ce}.ae60-status.rejected{background:rgba(255,100,124,.12);color:#ff9bab}
      .ae60-items{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.ae60-chip{font-size:8px;padding:5px 7px;border-radius:999px;background:rgba(103,227,220,.09);border:1px solid rgba(103,227,220,.15)}.ae60-price-box{margin-top:9px;padding:9px 10px;border-radius:12px;background:rgba(0,0,0,.12);border:1px solid rgba(103,227,220,.12);display:grid;gap:6px}.ae60-price-title{font-size:8px;color:var(--muted,#9fb0bb);font-weight:900}.ae60-price-row{display:flex;justify-content:space-between;gap:10px;font-size:9px}.ae60-price-row strong{white-space:nowrap}.ae60-note{margin-top:8px;padding:8px 9px;border-radius:10px;background:rgba(255,255,255,.035);font-size:8.5px;color:var(--muted,#9fb0bb)}
      .ae60-review-note{width:100%;box-sizing:border-box;margin-top:9px}.ae60-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.ae60-actions .btn{flex:1;min-width:110px}.ae60-empty{padding:18px;text-align:center;color:var(--muted,#9fb0bb);font-size:9px}.pv58-price-detail,.pl53-price-detail{display:none!important}
      @media(max-width:640px){.ae60-card-top{align-items:flex-start}.ae60-amount{font-size:14px}.ae60-panel{padding:12px}}
    `;
    document.head.appendChild(s);
  }

  async function getClient(){
    if(client) return client;
    const c=window.SUPABASE_CONFIG||{};
    if(!window.supabase||!c.url||!c.key) throw new Error('DB_NOT_READY');
    client=window.supabase.createClient(c.url,c.key);
    return client;
  }

  async function rpc(name,args={}){
    const c=await getClient();
    const {data,error}=await c.rpc(name,args);
    if(error) throw error;
    return data;
  }

  function ago(v){
    if(!v)return '';
    const m=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000));
    if(m<1)return 'حالًا';
    if(m<60)return `من ${m.toLocaleString('ar-EG')} د`;
    const h=Math.floor(m/60);
    if(h<24)return `من ${h.toLocaleString('ar-EG')} س`;
    return new Date(v).toLocaleDateString('ar-EG',{day:'numeric',month:'short'});
  }

  function statusLabel(s){return s==='approved'?'✅ معتمد':s==='rejected'?'❌ مرفوض':'⏳ تحت المراجعة'}
  function requestType(r){return r.request_type==='purchase'?'🛒 فاتورة مشتريات':'💰 مصروف عام'}

  function priceDetails(r){
    if(r.request_type!=='purchase'||!Array.isArray(r.purchase_lines)||!r.purchase_lines.length)return '';
    const names=Object.fromEntries((r.items||[]).map(i=>[i.id,i.name]));
    return `<div class="ae60-price-box"><div class="ae60-price-title">تفاصيل أسعار الأصناف</div>${r.purchase_lines.map(l=>`<div class="ae60-price-row"><span>${esc(names[l.item_id]||'صنف')} — ${esc(l.quantity)} × ${money(l.unit_price)}</span><strong>${money(l.line_total)}</strong></div>`).join('')}</div>`;
  }

  function card(r){
    const items=(r.items||[]).map(i=>`<span class="ae60-chip">${esc(i.name)}${i.qty?` • ${esc(i.qty)} ${esc(i.unit||'')}`:''}</span>`).join('');
    const meta=`${esc(r.submitter_name||'—')} أضافها${r.payer_name&&r.payer_name!==r.submitter_name?` • الدفع باسم ${esc(r.payer_name)}`:''}${r.category_name?` • ${esc(r.category_name)}`:''} • ${ago(r.created_at)}`;
    return `<article class="ae60-card" data-request="${esc(r.id)}"><div class="ae60-card-top"><div><div class="ae60-title">${requestType(r)}</div><div class="ae60-meta">${meta}</div></div><div style="text-align:left"><div class="ae60-amount">${money(r.amount)}</div><span class="ae60-status ${esc(r.status)}">${statusLabel(r.status)}</span></div></div>${items?`<div class="ae60-items">${items}</div>`:''}${priceDetails(r)}${r.note?`<div class="ae60-note">📝 ${esc(r.note)}</div>`:''}${r.review_note?`<div class="ae60-note">ملاحظة الأدمن: ${esc(r.review_note)}</div>`:''}${r.status==='pending'?`<input class="text-input ae60-review-note" data-note-for="${esc(r.id)}" placeholder="ملاحظة للمراجع (اختياري)"><div class="ae60-actions"><button class="btn ae60-approve" data-id="${esc(r.id)}">✅ اعتماد</button><button class="btn danger ae60-reject" data-id="${esc(r.id)}">رفض</button></div>`:''}</article>`;
  }

  function signature(rows){
    return JSON.stringify(rows.map(r=>[r.id,r.status,r.amount,r.review_note,r.purchase_lines]));
  }

  async function render(force=false){
    const host=$('#expenseApprovalAdminApp');
    if(!host)return;
    if(!window.TripDB?.isBound?.()){host.innerHTML='<div class="ae60-empty">سجّل دخول الأول.</div>';return}
    if(!window.TripDB?.isAdmin?.()){host.innerHTML='<div class="ae60-panel"><div class="ae60-empty">الصفحة دي للأدمن فقط 🔒</div></div>';return}
    try{
      const all=await rpc('admin_list_expense_approval_requests',{p_status:null})||[];
      const sig=signature(all);
      if(!force&&sig===lastSignature)return;
      lastSignature=sig;
      const pending=all.filter(r=>r.status==='pending');
      const rows=mode==='pending'?pending:all;
      host.innerHTML=`<div class="ae60-tabs"><button class="ae60-tab ${mode==='pending'?'active':''}" data-mode="pending">⏳ للمراجعة (${pending.length.toLocaleString('ar-EG')})</button><button class="ae60-tab ${mode==='all'?'active':''}" data-mode="all">📚 السجل (${all.length.toLocaleString('ar-EG')})</button></div><div class="ae60-panel"><div class="ae60-head"><h2>${mode==='pending'?'الطلبات المنتظرة':'كل طلبات المصاريف'}</h2><small>V60</small></div><div class="ae60-list">${rows.length?rows.map(card).join(''):'<div class="ae60-empty">مفيش طلبات هنا حاليًا ✅</div>'}</div></div>`;
      host.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;lastSignature='';render(true)});
      host.querySelectorAll('.ae60-approve').forEach(b=>b.onclick=()=>review(b.dataset.id,true));
      host.querySelectorAll('.ae60-reject').forEach(b=>b.onclick=()=>review(b.dataset.id,false));
    }catch(e){
      console.error('[V60 admin approvals]',e);
      host.innerHTML='<div class="ae60-panel"><div class="ae60-empty">مش قادرين نحمّل الطلبات دلوقتي.</div></div>';
    }
  }

  async function review(id,approve){
    if(busy)return;
    const note=$(`[data-note-for="${id}"]`)?.value.trim()||null;
    if(!approve&&!confirm('ترفض الطلب ده؟'))return;
    if(approve&&!confirm('تعتمد الطلب ويتسجل فعليًا في الحسابات؟'))return;
    busy=true;
    try{
      await rpc('admin_review_expense_request',{p_request_id:id,p_approve:!!approve,p_review_note:note});
      window.toast?.(approve?'اتعمد واتسجل في الحسابات ✅':'اترفض الطلب');
      lastSignature='';
      await render(true);
    }catch(e){
      console.error('[V60 review]',e);
      const m=String(e?.message||e||'');
      window.toast?.(m.includes('ITEM_ALREADY_PURCHASED')?'في صنف اتسجل كمشترى قبل الاعتماد':m.includes('REQUEST_ALREADY_REVIEWED')?'الطلب اتراجع بالفعل':'حصلت مشكلة في المراجعة');
    }finally{busy=false}
  }

  async function start(){
    injectStyle();
    for(let i=0;i<120;i++){
      if(window.TripDB?.isBound?.())break;
      await new Promise(r=>setTimeout(r,100));
    }
    await render(true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',()=>render(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')render(true)});
  setInterval(()=>{
    if(document.visibilityState!=='visible')return;
    if(document.querySelector('.ae60-review-note:focus'))return;
    render(false);
  },15000);
})();