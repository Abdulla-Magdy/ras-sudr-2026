(() => {
  if (window.__KENZ_ADMIN_NOTIFY__) return;
  window.__KENZ_ADMIN_NOTIFY__ = true;

  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let client=null, mounting=false;

  if(!document.querySelector('link[data-admin-notify-css]')){
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='./assets/admin-notify.css?v=55';l.dataset.adminNotifyCss='1';
    document.head.appendChild(l);
  }

  function page(){return location.pathname.split('/').pop()||'index.html'}

  async function db(){
    if(client)return client;
    const c=window.SUPABASE_CONFIG||{};
    if(!window.supabase||!c.url||!c.key)return null;
    client=window.supabase.createClient(c.url,c.key);
    try{await client.auth.getSession()}catch(_){}
    return client;
  }

  async function send(){
    const title=$('#adminPushTitle')?.value.trim();
    const body=$('#adminPushBody')?.value.trim();
    const target=$('#adminPushTarget')?.value||'';
    const url=$('#adminPushUrl')?.value.trim()||'activity.html';
    if(!title)return window.toast?.('اكتب عنوان الإشعار');
    if(!body)return window.toast?.('اكتب نص الإشعار');
    const btn=$('#adminPushSend');
    if(btn){btn.disabled=true;btn.textContent='بنبعت…'}
    try{
      const c=await db();if(!c)throw new Error('DB_NOT_READY');
      const {data,error}=await c.rpc('admin_send_push_notification',{
        p_title:title,
        p_body:body,
        p_target_member_id:target||null,
        p_target_url:url
      });
      if(error)throw error;
      window.toast?.('الإشعار اتبعت ✅');
      const status=$('#adminPushStatus');
      if(status)status.textContent=target?'اترسل للشخص المحدد ✅':'اترسل لكل الأشقياء ✅';
      const bodyEl=$('#adminPushBody');if(bodyEl)bodyEl.value='';
      return data;
    }catch(e){
      console.error('[V51 admin push]',e);
      window.toast?.('حصلت مشكلة في إرسال الإشعار');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='🔔 ابعت الإشعار'}
    }
  }

  async function loadPushStatus(){
    const host=$('#adminPushMembers');if(!host)return;
    try{
      const c=await db();if(!c)throw new Error('DB_NOT_READY');
      const {data,error}=await c.rpc('admin_push_status');if(error)throw error;
      if(!document.body.contains(host))return;
      const rows=Array.isArray(data)?data:[];
      const active=rows.filter(x=>Number(x.active_devices)>0 && x.confirmed);
      const confirmed=rows.filter(x=>x.confirmed);
      host.innerHTML=`<p class="muted">${active.length} من ${confirmed.length} أعضاء مفعّلين الإشعارات على جهاز واحد على الأقل. دي حالة الاشتراكات المسجلة، مش تأكيد وصول كل رسالة.</p><div class="admin-push-list">${rows.map(x=>`<div class="admin-push-member"><span>${esc(x.name)}${x.confirmed?'':' <small>(غير مشارك)</small>'}</span><strong class="${Number(x.active_devices)>0?'push-on':'push-off'}">${Number(x.active_devices)>0?`✅ مفعّل (${Number(x.active_devices)} جهاز)`:'⏳ لسه ما فعّلش'}</strong></div>`).join('')}</div>`;
    }catch(e){console.warn('[V55 push status]',e);if(document.body.contains(host))host.innerHTML='<p class="muted">مش قادرين نعرض حالة الإشعارات دلوقتي. جرّب تحديث الصفحة.</p>'}
  }

  async function mount(){
    if(page()==='admin.html' && window.TripDB?.isAdmin?.()){
      const grid=$('.ia-grid');
      if(grid && !$('#adminPushStatusShortcut')){
        const link=document.createElement('a');link.id='adminPushStatusShortcut';link.className='ia-card';link.href='admin-announcements.html#adminPushMembers';
        link.innerHTML='<strong>🔔 حالة الإشعارات</strong><small>مين فعّل ومين لسه</small><span aria-hidden="true">‹</span>';
        grid.appendChild(link);
      }
    }
    if(mounting||page()!=='admin-announcements.html')return;
    if(!window.TripDB?.getMember?.())return;
    if(!window.TripDB?.isAdmin?.())return;
    const panel=$('#adminPanel');
    if(!panel||$('#adminPushBox'))return;
    mounting=true;
    try{
      let members=[];
      try{members=await window.TripDB.list('members',{order:'sort_order'})}catch(e){console.warn('[V51 admin members]',e)}
      if(page()!=='admin-announcements.html'||!document.body.contains(panel)||$('#adminPushBox'))return;
      const wrap=document.createElement('div');
      wrap.id='adminPushBox';
      wrap.style.cssText='margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08)';
      wrap.innerHTML=`
        <div class="section-title"><h3>🔔 إرسال إشعار</h3><small>Push Notification حقيقي حتى لو التطبيق مقفول</small></div>
        <div class="admin-add-member-grid" style="align-items:end">
          <label class="mini-field"><span>المستلم</span><select id="adminPushTarget" class="text-input"><option value="">كل الأشقياء</option>${members.filter(x=>x.confirmed!==false).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
          <label class="mini-field"><span>العنوان</span><input id="adminPushTitle" class="text-input" maxlength="80" placeholder="مثال: يا رجالة 🔔"></label>
          <label class="mini-field" style="grid-column:1/-1"><span>الرسالة</span><textarea id="adminPushBody" class="text-input" maxlength="240" rows="3" placeholder="اكتب الإشعار هنا"></textarea></label>
          <label class="mini-field"><span>يفتح صفحة</span><select id="adminPushUrl" class="text-input"><option value="activity.html">آخر النشاط</option><option value="index.html">الرئيسية</option><option value="shopping.html">المشتريات</option><option value="expenses.html">الحسابات</option><option value="transport.html">العربيات</option><option value="games.html">الألعاب</option><option value="bag.html">الشنطة</option></select></label>
          <button id="adminPushSend" class="btn">🔔 ابعت الإشعار</button>
        </div>
        <div id="adminPushStatus" class="muted" style="font-size:9px;margin-top:8px"></div>
        <div class="admin-push-overview"><div class="section-title"><h3>مين فعّل الإشعارات؟</h3><button id="adminPushRefresh" class="btn secondary" type="button">تحديث الحالة</button></div><div id="adminPushMembers">بنحمّل الحالة…</div></div>`;
      panel.appendChild(wrap);
      $('#adminPushSend').onclick=send;
      $('#adminPushRefresh').onclick=loadPushStatus;
      await loadPushStatus();
    }finally{mounting=false}
  }

  const run=()=>mount().catch(e=>console.warn('[V51 admin notify mount]',e));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,350),{once:true});else setTimeout(run,350);
  window.addEventListener('pageshow',run);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')run()});
  setInterval(run,900);
  window.KenzAdminNotify={mount:run};
})();
