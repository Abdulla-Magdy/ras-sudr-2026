(() => {
  if (window.__KENZ_MAINTENANCE__) return;
  window.__KENZ_MAINTENANCE__ = true;

  const DEFAULT_MESSAGE = 'التطبيق خارج عن العمل مؤقتًا للصيانة والتحديث. هنرجع شغالين قريب 🚀';
  const page = () => location.pathname.split('/').pop() || 'index.html';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let client = null;
  let checking = false;
  let lastStatus = null;

  const style = document.createElement('style');
  style.textContent = `
    body.kenz-maintenance-locked{overflow:hidden!important}
    #kenzMaintenanceOverlay{position:fixed;inset:0;z-index:2147483600;background:radial-gradient(circle at 50% 20%,#51358b 0,#171225 42%,#080710 100%);display:flex;align-items:center;justify-content:center;padding:22px;color:#fff;text-align:center;font-family:inherit}
    #kenzMaintenanceOverlay .maintenance-card{width:min(520px,100%);padding:30px 22px;border-radius:26px;background:rgba(17,14,29,.86);border:1px solid rgba(255,255,255,.13);box-shadow:0 24px 70px rgba(0,0,0,.42);backdrop-filter:blur(18px)}
    #kenzMaintenanceOverlay .maintenance-icon{width:92px;height:92px;border-radius:24px;object-fit:cover;margin-bottom:16px;box-shadow:0 12px 35px rgba(0,0,0,.3)}
    #kenzMaintenanceOverlay .maintenance-kicker{display:inline-block;padding:6px 11px;border-radius:999px;background:rgba(255,190,61,.14);border:1px solid rgba(255,190,61,.28);font-size:11px;font-weight:800;margin-bottom:12px}
    #kenzMaintenanceOverlay h1{font-size:28px;margin:0 0 10px;line-height:1.35}
    #kenzMaintenanceOverlay p{font-size:15px;line-height:1.9;margin:0;color:rgba(255,255,255,.84)}
    #kenzMaintenanceOverlay .maintenance-time{margin-top:16px;padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.07);font-size:13px;font-weight:700}
    #kenzMaintenanceOverlay .maintenance-foot{margin-top:16px;font-size:11px;color:rgba(255,255,255,.55)}
    #kenzMaintenanceOverlay .maintenance-close{margin-top:18px;min-width:160px}
    #kenzMaintenanceAdminBanner{position:sticky;top:0;z-index:9999;padding:9px 14px;text-align:center;background:#8a5a00;color:#fff;font-size:12px;font-weight:800;box-shadow:0 3px 14px rgba(0,0,0,.2)}
    #kenzMaintenancePanel{margin-top:18px}
    #kenzMaintenancePanel .maintenance-admin-card{padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.035)}
    #kenzMaintenancePanel .maintenance-status{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px}
    #kenzMaintenancePanel .maintenance-status strong{font-size:15px}
    #kenzMaintenancePanel .maintenance-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    #kenzMaintenancePanel .maintenance-fields .full{grid-column:1/-1}
    #kenzMaintenancePanel label span{display:block;font-size:11px;opacity:.72;margin-bottom:6px}
    #kenzMaintenancePanel textarea{resize:vertical;min-height:88px}
    #kenzMaintenancePanel .maintenance-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
    #kenzMaintenancePanel .maintenance-note{font-size:10px;opacity:.68;margin-top:10px;line-height:1.7}
    @media(max-width:650px){#kenzMaintenancePanel .maintenance-fields{grid-template-columns:1fr}#kenzMaintenancePanel .maintenance-fields .full{grid-column:auto}}
  `;
  document.head.appendChild(style);

  async function getClient(){
    if(client) return client;
    const c = window.SUPABASE_CONFIG || {};
    if(!window.supabase || !c.url || !c.key) return null;
    client = window.supabase.createClient(c.url,c.key);
    return client;
  }

  async function getStatus(){
    const c = await getClient();
    if(!c) return null;
    const {data:{session}} = await c.auth.getSession();
    if(!session) return null;
    const slug = window.SUPABASE_CONFIG?.tripSlug;
    if(!slug) return null;
    const {data,error} = await c.rpc('get_trip_maintenance_status',{p_trip_slug:slug});
    if(error) throw error;
    return Array.isArray(data) ? (data[0] || null) : data;
  }

  function isAdmin(){ return !!window.TripDB?.isAdmin?.(); }
  function isBound(){ return !!window.TripDB?.getMember?.(); }

  function expectedText(value){
    if(!value) return '';
    try{
      return new Intl.DateTimeFormat('ar-EG',{weekday:'long',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(new Date(value));
    }catch(_){ return ''; }
  }

  function toLocalInput(value){
    if(!value) return '';
    const d=new Date(value); if(Number.isNaN(d.getTime())) return '';
    const pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function removeOverlay(){
    document.getElementById('kenzMaintenanceOverlay')?.remove();
    document.body?.classList.remove('kenz-maintenance-locked');
  }

  function showOverlay(status, preview=false){
    removeOverlay();
    const overlay=document.createElement('div');
    overlay.id='kenzMaintenanceOverlay';
    const back=expectedText(status?.expected_back_at);
    overlay.innerHTML=`<div class="maintenance-card">
      <img class="maintenance-icon" src="assets/icons/app-icon-large.png?v=51" alt="البز في الرحلة">
      <div class="maintenance-kicker">${preview?'معاينة الأدمن':'تحديث جاري 🔧'}</div>
      <h1>التطبيق تحت الصيانة</h1>
      <p>${esc(status?.message || DEFAULT_MESSAGE)}</p>
      ${back?`<div class="maintenance-time">⏰ الوقت المتوقع للعودة: ${esc(back)}</div>`:''}
      <div class="maintenance-foot">هنفتح التطبيق تاني أول ما نخلص التحديث.</div>
      ${preview?'<button id="kenzMaintenancePreviewClose" class="btn maintenance-close">إغلاق المعاينة</button>':''}
    </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('kenz-maintenance-locked');
    if(preview){
      document.getElementById('kenzMaintenancePreviewClose').onclick=()=>{
        removeOverlay();
        if(lastStatus?.enabled && !isAdmin()) showOverlay(lastStatus,false);
      };
    }
  }

  function renderAdminBanner(status){
    const old=document.getElementById('kenzMaintenanceAdminBanner');
    if(!status?.enabled){ old?.remove(); return; }
    if(old) return;
    const b=document.createElement('div');
    b.id='kenzMaintenanceAdminBanner';
    b.textContent='🛠 وضع الصيانة مفعّل للأعضاء — أنت داخل كأدمن وتقدر تختبر التطبيق طبيعي';
    document.body.prepend(b);
  }

  function fillAdmin(status){
    const box=document.getElementById('kenzMaintenancePanel');
    if(!box) return;
    const enabled=!!status?.enabled;
    const state=document.getElementById('kenzMaintenanceState');
    if(state){ state.textContent=enabled?'🔧 وضع الصيانة مفعّل':'✅ التطبيق شغال طبيعي'; state.style.opacity='1'; }
    const msg=document.getElementById('kenzMaintenanceMessage');
    if(msg && document.activeElement!==msg) msg.value=status?.message || DEFAULT_MESSAGE;
    const until=document.getElementById('kenzMaintenanceUntil');
    if(until && document.activeElement!==until) until.value=toLocalInput(status?.expected_back_at);
    const toggle=document.getElementById('kenzMaintenanceToggle');
    if(toggle){ toggle.textContent=enabled?'✅ إنهاء الصيانة وفتح التطبيق':'🔧 تفعيل وضع الصيانة'; toggle.dataset.enabled=enabled?'1':'0'; }
  }

  async function saveMaintenance(nextEnabled){
    const msg=(document.getElementById('kenzMaintenanceMessage')?.value || DEFAULT_MESSAGE).trim();
    const rawUntil=document.getElementById('kenzMaintenanceUntil')?.value || '';
    let expected=null;
    if(rawUntil){
      const d=new Date(rawUntil);
      if(Number.isNaN(d.getTime())) return window.toast?.('وقت العودة غير صحيح');
      expected=d.toISOString();
    }
    if(nextEnabled && !confirm('هيتم تفعيل وضع الصيانة ومنع الأعضاء من استخدام التطبيق، وكمان هيتبعت Push Notification للكل. تأكيد؟')) return;
    const btn=document.getElementById('kenzMaintenanceToggle');
    if(btn){btn.disabled=true;btn.textContent='جاري الحفظ…'}
    try{
      const c=await getClient(); if(!c) throw new Error('DB_NOT_READY');
      const {data,error}=await c.rpc('admin_set_maintenance_mode',{
        p_enabled:!!nextEnabled,
        p_message:msg,
        p_expected_back_at:expected
      });
      if(error) throw error;
      lastStatus=data || {enabled:nextEnabled,message:msg,expected_back_at:expected};
      renderAdminBanner(lastStatus);
      fillAdmin(lastStatus);
      window.toast?.(nextEnabled?'وضع الصيانة اتفعل والإشعار اتبعت للكل ✅':'الصيانة انتهت والتطبيق اتفتح ✅');
    }catch(e){
      console.error('[maintenance save]',e);
      window.toast?.('حصلت مشكلة في تحديث وضع الصيانة');
    }finally{
      if(btn) btn.disabled=false;
      fillAdmin(lastStatus);
    }
  }

  function mountAdmin(status){
    if(page()!=='admin.html' || !isAdmin()) return;
    if(!document.getElementById('kenzMaintenancePanel')){
      const main=document.getElementById('appMain') || document.querySelector('main');
      if(!main) return;
      const section=document.createElement('section');
      section.id='kenzMaintenancePanel';
      section.className='section';
      section.innerHTML=`<div class="maintenance-admin-card">
        <div class="section-title"><div><h3>🛠 وضع الصيانة</h3><small>اقفل التطبيق مؤقتًا للأعضاء أثناء التحديث، والأدمن يفضل داخل طبيعي.</small></div></div>
        <div class="maintenance-status"><strong id="kenzMaintenanceState">بنقرأ الحالة…</strong></div>
        <div class="maintenance-fields">
          <label class="full"><span>رسالة الصيانة</span><textarea id="kenzMaintenanceMessage" class="text-input" maxlength="240" placeholder="${esc(DEFAULT_MESSAGE)}"></textarea></label>
          <label><span>وقت متوقع للعودة — اختياري</span><input id="kenzMaintenanceUntil" type="datetime-local" class="text-input"></label>
        </div>
        <div class="maintenance-actions">
          <button id="kenzMaintenancePreview" class="btn secondary" type="button">👁 معاينة صفحة الصيانة</button>
          <button id="kenzMaintenanceToggle" class="btn" type="button">🔧 تفعيل وضع الصيانة</button>
        </div>
        <div class="maintenance-note">عند التفعيل: كل الأعضاء يشوفوا صفحة الصيانة، ويتبعت لهم Push Notification مرة واحدة عند الانتقال من OFF إلى ON. الأدمن مستثنى عشان يقدر يختبر التحديث.</div>
      </div>`;
      main.appendChild(section);
      document.getElementById('kenzMaintenancePreview').onclick=()=>{
        const raw=document.getElementById('kenzMaintenanceUntil')?.value || '';
        showOverlay({message:(document.getElementById('kenzMaintenanceMessage')?.value||DEFAULT_MESSAGE).trim(),expected_back_at:raw?new Date(raw).toISOString():null},true);
      };
      document.getElementById('kenzMaintenanceToggle').onclick=()=>saveMaintenance(document.getElementById('kenzMaintenanceToggle').dataset.enabled!=='1');
    }
    fillAdmin(status);
  }

  async function tick(){
    if(checking || page()==='login.html') return;
    if(!window.TripDB?.getMember) return;
    if(!isBound()) return;
    checking=true;
    try{
      const status=await getStatus();
      if(!status) return;
      lastStatus=status;
      if(isAdmin()){
        removeOverlay();
        renderAdminBanner(status);
        mountAdmin(status);
      }else{
        document.getElementById('kenzMaintenanceAdminBanner')?.remove();
        if(status.enabled){
          if(!document.getElementById('kenzMaintenanceOverlay')) showOverlay(status,false);
          else {
            const current=document.querySelector('#kenzMaintenanceOverlay p')?.textContent || '';
            if(current !== (status.message || DEFAULT_MESSAGE)) showOverlay(status,false);
          }
        }else removeOverlay();
      }
    }catch(e){
      console.warn('[maintenance status]',e);
    }finally{checking=false}
  }

  const run=()=>setTimeout(tick,450);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  window.addEventListener('pageshow',run);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')run()});
  setInterval(tick,12000);
  window.KenzMaintenance={refresh:tick,preview:()=>showOverlay(lastStatus||{message:DEFAULT_MESSAGE},true)};
})();