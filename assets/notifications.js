(() => {
  if (window.__KENZ_NOTIFICATIONS__) return;
  window.__KENZ_NOTIFICATIONS__ = true;

  const VERSION='V47';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let client=null,pollTimer=null,lastMain=null,hydrating=false;

  function page(){return location.pathname.split('/').pop()||'index.html'}
  function supported(){return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window}

  function injectStyle(){
    if($('#n47Style'))return;
    const s=document.createElement('style');s.id='n47Style';s.textContent=`
      .n47-bell{position:relative;display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;text-decoration:none;color:inherit;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075);font-size:17px;flex:0 0 auto}
      .n47-badge{position:absolute;top:-5px;left:-5px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#ff647c;color:white;border:2px solid #071822;font-size:8px;font-weight:900;display:flex;align-items:center;justify-content:center}
      .n47-push{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}
      .n47-push-main{display:flex;align-items:flex-start;gap:9px;min-width:0}.n47-push-main .ico{font-size:20px}.n47-push-main strong{display:block;font-size:10px;margin-bottom:3px}.n47-push-main small{display:block;color:var(--muted,#9fb0bb);font-size:8px;line-height:1.55}
      .n47-push-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.n47-push-actions .btn{padding:8px 10px;font-size:8px;white-space:nowrap}
      .n47-feed{display:grid;gap:8px}.n47-event{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.065);color:inherit;text-decoration:none}.n47-event:hover{background:rgba(255,255,255,.045)}
      .n47-event-ico{font-size:18px;line-height:1.2;flex:0 0 auto}.n47-event-body{min-width:0;flex:1}.n47-event-title{font-weight:900;font-size:10px}.n47-event-text{margin-top:3px;font-size:8.5px;color:var(--muted,#9fb0bb);line-height:1.6}.n47-event-time{font-size:7.5px;color:var(--muted,#9fb0bb);white-space:nowrap;margin-top:2px}
      .n47-home-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.n47-home-head h2{margin:0}.n47-home-head a{font-size:8.5px;color:var(--accent,#67e3dc);font-weight:900;text-decoration:none}
      .n47-status-ok{color:#9af3ba}.n47-status-warn{color:#f1d58f}.n47-status-bad{color:#ff8798}
      .n47-empty{padding:16px;text-align:center;color:var(--muted,#9fb0bb);font-size:9px}
      @media(max-width:640px){.n47-push{align-items:flex-start;flex-direction:column}.n47-push-actions{width:100%}.n47-push-actions .btn{flex:1}.n47-bell{width:36px;height:36px}}
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

  function b64ToBytes(base64String){
    const pad='='.repeat((4-base64String.length%4)%4);
    const base64=(base64String+pad).replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(base64);return Uint8Array.from([...raw].map(ch=>ch.charCodeAt(0)));
  }

  async function getRegistration(){
    if(!supported())return null;
    let reg=await navigator.serviceWorker.getRegistration();
    if(!reg&&window.BazAutoUpdate?.init){try{await window.BazAutoUpdate.init()}catch(_){}}
    reg=reg||await navigator.serviceWorker.ready.catch(()=>null);
    return reg||null;
  }

  async function getSubscription(){
    const reg=await getRegistration();if(!reg)return null;
    return reg.pushManager.getSubscription();
  }

  async function persistSubscription(sub){
    if(!sub)return false;
    const j=sub.toJSON();
    if(!j.endpoint||!j.keys?.p256dh||!j.keys?.auth)return false;
    await rpc('save_push_subscription',{
      p_endpoint:j.endpoint,
      p_p256dh:j.keys.p256dh,
      p_auth:j.keys.auth,
      p_user_agent:navigator.userAgent||null
    });
    return true;
  }

  async function enablePush(){
    if(!supported())throw new Error('PUSH_NOT_SUPPORTED');
    let permission=Notification.permission;
    if(permission!=='granted')permission=await Notification.requestPermission();
    if(permission!=='granted')throw new Error(permission==='denied'?'PUSH_DENIED':'PUSH_NOT_GRANTED');
    const reg=await getRegistration();if(!reg)throw new Error('SERVICE_WORKER_NOT_READY');
    let sub=await reg.pushManager.getSubscription();
    if(!sub){
      const publicKey=await rpc('get_push_public_key');
      sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(publicKey)});
    }
    await persistSubscription(sub);
    return sub;
  }

  async function disablePush(){
    const sub=await getSubscription();
    if(sub){
      try{await rpc('disable_push_subscription',{p_endpoint:sub.endpoint})}catch(e){console.warn('[V47 disable subscription]',e)}
      await sub.unsubscribe().catch(()=>false);
    }
    return true;
  }

  async function pushState(){
    if(!supported())return {supported:false,permission:'unsupported',active:false};
    const permission=Notification.permission;
    let active=false;
    if(permission==='granted'){
      const sub=await getSubscription().catch(()=>null);active=!!sub;
      if(sub)persistSubscription(sub).catch(()=>{});
    }
    return {supported:true,permission,active};
  }

  function relativeTime(value){
    const t=new Date(value).getTime(),diff=Math.max(0,Date.now()-t),m=Math.floor(diff/60000);
    if(m<1)return 'حالًا';if(m<60)return `من ${m.toLocaleString('ar-EG')} د`;
    const h=Math.floor(m/60);if(h<24)return `من ${h.toLocaleString('ar-EG')} س`;
    const d=Math.floor(h/24);if(d<7)return `من ${d.toLocaleString('ar-EG')} يوم`;
    return new Date(value).toLocaleDateString('ar-EG',{day:'numeric',month:'short'});
  }

  function iconFor(e){
    const t=e.event_type||'';
    if(t.startsWith('shopping'))return t==='shopping_claimed'?'🙋':t==='shopping_purchased'?'✅':'🛒';
    if(t.startsWith('expense'))return '💰';
    if(t.startsWith('car'))return '🚗';
    return '🔔';
  }

  function eventHtml(e){
    const tag=e.target_url?'a':'div';const href=e.target_url?` href="${esc(e.target_url)}"`:'';
    return `<${tag} class="n47-event"${href}><span class="n47-event-ico">${iconFor(e)}</span><div class="n47-event-body"><div class="n47-event-title">${esc(e.title)}</div><div class="n47-event-text">${esc(e.body)}</div></div><span class="n47-event-time">${relativeTime(e.created_at)}</span></${tag}>`;
  }

  async function renderPushBox(host,compact=false){
    if(!host)return;
    const st=await pushState().catch(()=>({supported:false,permission:'unsupported',active:false}));
    let klass='n47-status-warn',title='فعّل Push Notifications',sub='أي تنبيه من التطبيق هيوصلك كإشعار حقيقي حتى لو التطبيق مقفول.',actions='<button class="btn" data-enable-push>🔔 تفعيل</button>';
    if(!st.supported){klass='n47-status-bad';title='Push Notifications مش مدعومة هنا';sub='جرّب من التطبيق المثبت على الموبايل أو متصفح بيدعم Web Push.';actions='';}
    else if(st.permission==='denied'){klass='n47-status-bad';title='التنبيهات مقفولة من إعدادات الجهاز';sub='فعّل Notifications للتطبيق من إعدادات الموبايل وبعدها ارجع هنا.';actions='';}
    else if(st.active){klass='n47-status-ok';title='Push Notifications مفعلة ✅';sub='التنبيهات المهمة هتوصلك حتى لو التطبيق مقفول.';actions='<button class="btn secondary" data-disable-push>إيقاف</button>';}
    host.innerHTML=`<div class="n47-push"><div class="n47-push-main"><span class="ico">🔔</span><div><strong class="${klass}">${title}</strong><small>${sub}</small></div></div><div class="n47-push-actions">${actions}</div></div>`;
    host.querySelector('[data-enable-push]')?.addEventListener('click',async e=>{
      const b=e.currentTarget;b.disabled=true;b.textContent='بنفعّل…';
      try{await enablePush();window.toast?.('Push Notifications اتفعلت ✅');await hydrate()}catch(err){console.error(err);const m=String(err?.message||err);window.toast?.(m.includes('DENIED')?'اسمح بالتنبيهات من إعدادات الجهاز':'حصلت مشكلة في تفعيل التنبيهات');b.disabled=false;b.textContent='🔔 تفعيل'}
    });
    host.querySelector('[data-disable-push]')?.addEventListener('click',async e=>{
      const b=e.currentTarget;b.disabled=true;b.textContent='بنوقف…';
      await disablePush();window.toast?.('التنبيهات اتوقفت');await hydrate();
    });
  }

  async function unreadCount(){
    try{return Number(await rpc('get_unread_activity_count')||0)}catch(_){return 0}
  }

  async function ensureBell(){
    const nav=$('.topbar .nav');if(!nav)return;
    let bell=nav.querySelector('.n47-bell');
    if(!bell){
      bell=document.createElement('a');bell.className='n47-bell';bell.href='activity.html';bell.setAttribute('aria-label','التنبيهات وآخر النشاط');bell.innerHTML='<span>🔔</span><b class="n47-badge" hidden>0</b>';
      const install=$('#installAppBtn');if(install)nav.insertBefore(bell,install);else nav.appendChild(bell);
    }
    const count=await unreadCount();const badge=bell.querySelector('.n47-badge');
    if(badge){badge.hidden=count<1;badge.textContent=count>99?'99+':count.toLocaleString('ar-EG')}
  }

  async function getFeed(limit=40){
    const data=await rpc('get_activity_feed',{p_limit:limit});return Array.isArray(data)?data:[];
  }

  async function renderHome(){
    if(page()!=='index.html')return;
    const main=$('#appMain');if(!main)return;
    let section=$('#notificationHome');
    if(!section){
      section=document.createElement('section');section.id='notificationHome';section.className='section';
      const readiness=$('#tripReadiness')?.closest('.section');if(readiness)readiness.before(section);else main.prepend(section);
    }
    section.innerHTML=`<div class="v38-panel"><div class="n47-home-head"><h2>🔔 التنبيهات وآخر النشاط</h2><a href="activity.html">عرض الكل</a></div><div id="n47HomePush"></div><div id="n47HomeFeed" class="n47-feed" style="margin-top:10px"><div class="n47-empty">بنجيب آخر النشاط…</div></div></div>`;
    await renderPushBox($('#n47HomePush'),true);
    try{
      const feed=await getFeed(3);const host=$('#n47HomeFeed');if(host)host.innerHTML=feed.length?feed.map(eventHtml).join(''):'<div class="n47-empty">أول نشاط جديد هيظهر هنا.</div>';
    }catch(e){console.warn('[V47 home feed]',e)}
  }

  async function renderActivity(){
    if(page()!=='activity.html')return;
    const host=$('#activityApp');if(!host)return;
    host.innerHTML='<div class="v38-empty">بنحمّل آخر النشاط…</div>';
    try{
      const feed=await getFeed(80);
      host.innerHTML=`<section class="section"><div class="v38-panel"><div class="v38-panel-head"><h2>Push Notifications</h2></div><div id="n47ActivityPush"></div></div></section><section class="section"><div class="v38-panel"><div class="v38-panel-head"><h2>آخر النشاط</h2><small>${feed.length.toLocaleString('ar-EG')}</small></div><div class="n47-feed">${feed.length?feed.map(eventHtml).join(''):'<div class="n47-empty">لسه مفيش نشاط جديد.</div>'}</div></div></section>`;
      await renderPushBox($('#n47ActivityPush'));
      await rpc('mark_activity_seen').catch(()=>{});
      await ensureBell();
    }catch(e){console.error('[V47 activity]',e);host.innerHTML='<div class="v38-empty">حصلت مشكلة في تحميل النشاط — جرّب تاني.</div>'}
  }

  async function hydrate(){
    if(hydrating)return;hydrating=true;
    try{injectStyle();await ensureBell();await renderHome();await renderActivity()}finally{hydrating=false}
  }

  async function boot(){
    injectStyle();
    for(let i=0;i<120;i++){
      if(window.TripDB?.getMember?.()){await hydrate();break}
      await new Promise(r=>setTimeout(r,50));
    }
    lastMain=$('#appMain');
    pollTimer=setInterval(()=>{
      const m=$('#appMain');if(m!==lastMain){lastMain=m;hydrate();return}
      ensureBell();
    },3000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')hydrate()});
    window.addEventListener('pagehide',()=>{if(pollTimer)clearInterval(pollTimer)},{once:true});
  }

  window.KenzNotifications={hydrate,enablePush,disablePush,renderActivity,renderHome};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
