(() => {
  if (window.__KENZ_GAMES__) return;
  window.__KENZ_GAMES__ = true;

  const VERSION='V48';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let client=null,refreshTimer=null,rendering=false,lastMain=null;

  function page(){return location.pathname.split('/').pop()||'index.html'}
  function toast(t){if(window.toast)window.toast(t);else alert(t)}
  function me(){return window.TripDB?.getMember?.()||null}
  function isAdmin(){return !!window.TripDB?.isAdmin?.()}

  async function getClient(){
    if(client)return client;
    const c=window.SUPABASE_CONFIG||{};
    if(!window.supabase||!c.url||!c.key)return null;
    client=window.supabase.createClient(c.url,c.key);
    try{await client.auth.getSession()}catch(_){}
    return client;
  }
  async function rpc(name,args={}){
    const c=await getClient(); if(!c) throw new Error('DB_NOT_READY');
    const {data,error}=await c.rpc(name,args); if(error) throw error; return data;
  }
  function ago(v){
    if(!v)return '';
    const ms=Date.now()-new Date(v).getTime(),m=Math.max(0,Math.floor(ms/60000));
    if(m<1)return 'دلوقتي'; if(m<60)return `من ${m.toLocaleString('ar-EG')} د`;
    const h=Math.floor(m/60); if(h<24)return `من ${h.toLocaleString('ar-EG')} س`;
    return new Date(v).toLocaleDateString('ar-EG',{day:'numeric',month:'short'});
  }
  function remaining(v){
    const ms=new Date(v).getTime()-Date.now(); if(ms<=0)return 'خلص الوقت';
    const m=Math.ceil(ms/60000); return m>=60?`${Math.floor(m/60)} س ${m%60} د`:`${m} دقيقة`;
  }

  function style(){
    if($('#g48Style'))return;
    const s=document.createElement('style');s.id='g48Style';s.textContent=`
      .g48-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.g48-tab{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:inherit;border-radius:14px;padding:11px;font-weight:900;font-size:10px}.g48-tab.active{background:rgba(103,227,220,.14);border-color:rgba(103,227,220,.35)}
      .g48-grid{display:grid;gap:11px}.g48-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:14px}.g48-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.g48-title{font-size:13px;font-weight:900}.g48-sub{font-size:8.5px;color:var(--muted,#9fb0bb);line-height:1.6;margin-top:4px}.g48-status{font-size:8px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.055);white-space:nowrap}.g48-status.ok{background:rgba(154,243,186,.12);color:#b8f7ce}.g48-status.bad{background:rgba(255,100,124,.12);color:#ff9bab}.g48-status.warn{background:rgba(241,213,143,.12);color:#f1d58f}
      .g48-form{display:grid;gap:9px;margin-top:12px}.g48-form select,.g48-form input,.g48-form textarea{width:100%;box-sizing:border-box}.g48-votes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.g48-vote{border:none;border-radius:13px;padding:10px;font-weight:900;font-size:9px}.g48-yes{background:rgba(154,243,186,.15);color:#c5f9d6}.g48-no{background:rgba(255,135,152,.14);color:#ffb0bd}.g48-vote.mine{outline:2px solid rgba(255,255,255,.35)}
      .g48-progress{height:7px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;margin-top:10px}.g48-progress i{display:block;height:100%;background:linear-gradient(90deg,#67e3dc,#9af3ba)}.g48-counts{display:flex;justify-content:space-between;font-size:8px;color:var(--muted,#9fb0bb);margin-top:6px}
      .g48-wheelbox{text-align:center;padding:15px 8px}.g48-wheel{width:88px;height:88px;margin:4px auto 12px;border-radius:50%;display:grid;place-items:center;font-size:35px;background:conic-gradient(from 20deg,rgba(103,227,220,.34),rgba(241,213,143,.32),rgba(255,100,124,.3),rgba(103,227,220,.34));border:5px solid rgba(255,255,255,.08);box-shadow:0 0 0 3px rgba(255,255,255,.025)}.g48-wheel.spin{animation:g48spin 1.8s cubic-bezier(.16,.8,.24,1)}@keyframes g48spin{to{transform:rotate(1440deg)}}.g48-punishment{padding:12px;border-radius:14px;background:rgba(241,213,143,.09);border:1px solid rgba(241,213,143,.18);font-size:11px;font-weight:900;line-height:1.7}
      .g48-secret{text-align:center;padding:18px;border-radius:18px;background:linear-gradient(135deg,rgba(82,53,140,.22),rgba(103,227,220,.08));border:1px solid rgba(153,126,221,.22)}.g48-target{font-size:11px;color:var(--muted,#9fb0bb)}.g48-word{font-size:28px;font-weight:1000;margin:8px 0}.g48-timer{font-size:9px;color:#f1d58f}.g48-catch{margin-top:13px;width:100%;padding:12px;border:none;border-radius:14px;background:#ff647c;color:white;font-weight:1000}
      .g48-leader{display:grid;gap:7px}.g48-rank{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.025);font-size:9px}.g48-rank strong{font-size:11px}.g48-empty{text-align:center;padding:20px;color:var(--muted,#9fb0bb);font-size:9px}.g48-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.g48-actions .btn{flex:1;min-width:120px}.g48-game-shortcut{display:flex;align-items:center;justify-content:space-between;gap:10px;text-decoration:none;color:inherit;padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(82,53,140,.18),rgba(103,227,220,.06));border:1px solid rgba(255,255,255,.07)}.g48-game-shortcut strong{display:block}.g48-game-shortcut small{display:block;color:var(--muted,#9fb0bb);font-size:8px;margin-top:3px}.g48-game-shortcut .big{font-size:27px}
      @media(max-width:640px){.g48-card{padding:12px}.g48-word{font-size:24px}}
    `;document.head.appendChild(s);
  }

  function ensureNav(){
    const desktop=document.querySelector('.links');
    if(desktop&&!desktop.querySelector('a[href="games.html"]')){
      const a=document.createElement('a');a.href='games.html';a.textContent='🎮 الألعاب';
      const ideas=desktop.querySelector('a[href="ideas.html"]'); if(ideas)ideas.before(a); else desktop.appendChild(a);
    }
    const drawer=$('#mobileMenuDrawer .mobile-drawer-links');
    if(drawer&&!drawer.querySelector('a[href="games.html"]')){
      const a=document.createElement('a');a.href='games.html';a.innerHTML='<span class="nav-icon">🎮</span><span class="nav-label">ألعاب الأشقياء</span>';
      const ideas=drawer.querySelector('a[href="ideas.html"]'); if(ideas)ideas.before(a); else drawer.appendChild(a);
    }
    if(page()==='index.html'&&!$('#g48HomeShortcut')){
      const meal=document.querySelector('.v38-meal-shortcut')?.closest('.section');
      if(meal){const sec=document.createElement('section');sec.className='section';sec.id='g48HomeShortcut';sec.innerHTML='<a class="g48-game-shortcut" href="games.html"><div><strong>🎮 ألعاب الأشقياء</strong><small>محكمة الأشقياء + ممنوع تقول</small></div><span class="big">😈</span></a>';meal.after(sec)}
    }
  }

  function statusName(s){return {voting:'🗳️ تصويت',approved:'✅ يستاهل',rejected:'🕊️ براءة',punishment:'🎡 الحكم',completed:'🏁 اتنفذ'}[s]||s}

  async function renderCourt(){
    const host=$('#gamePane'); if(!host)return;
    const d=await rpc('get_court_overview'); const members=d.members||[],cases=d.cases||[],mine=me();
    const create=`<div class="g48-card"><div class="g48-head"><div><div class="g48-title">⚖️ افتح قضية جديدة</div><div class="g48-sub">حصل موقف مش تمام؟ خلّي المجلس يحكم 😂</div></div></div><div class="g48-form"><select id="g48Accused" class="text-input"><option value="">اختار المتهم</option>${members.filter(m=>m.id!==mine?.id).map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select><textarea id="g48Accusation" class="textarea" rows="2" maxlength="180" placeholder="التهمة… مثال: نام وسابنا نجهز الفطار"></textarea><button id="g48CreateCase" class="btn">⚖️ افتح المحكمة</button></div></div>`;
    const cards=cases.length?cases.map(c=>{
      const threshold=Number(c.threshold||1),yes=Number(c.yes_count||0),no=Number(c.no_count||0),progress=Math.min(100,Math.max(yes,no)*100/threshold);
      let action='';
      if(c.status==='voting'){
        action=mine?.id===c.accused_member_id?'<div class="g48-sub" style="margin-top:10px">إنت المتهم يا نجم 😂 مالكش صوت في قضيتك.</div>':`<div class="g48-votes"><button class="g48-vote g48-yes ${c.my_vote===true?'mine':''}" data-vote="1" data-case="${c.id}">👍 يستاهل</button><button class="g48-vote g48-no ${c.my_vote===false?'mine':''}" data-vote="0" data-case="${c.id}">😇 بريء</button></div><div class="g48-progress"><i style="width:${progress}%"></i></div><div class="g48-counts"><span>يستاهل: ${yes}</span><span>الأغلبية: ${threshold}</span><span>براءة: ${no}</span></div>`;
      }else if(c.status==='approved'){
        action=`<div class="g48-wheelbox"><div class="g48-wheel">🎡</div><button class="btn g48-spin" data-case="${c.id}">لف عجلة العقاب 😈</button></div>`;
      }else if(c.status==='punishment'){
        action=`<div class="g48-punishment" style="margin-top:11px">الحكم: ${esc(c.selected_punishment)}</div>${(mine?.id===c.accused_member_id||isAdmin())?`<button class="btn g48-done" data-case="${c.id}" style="margin-top:9px;width:100%">اتنفذ الحكم ✅</button>`:''}`;
      }else if(c.status==='completed') action=`<div class="g48-punishment" style="margin-top:11px">✅ اتنفذ: ${esc(c.selected_punishment||'الحكم')}</div>`;
      return `<div class="g48-card"><div class="g48-head"><div><div class="g48-title">${esc(c.accused_name)} في المحكمة 😈</div><div class="g48-sub">${esc(c.accusation)}<br>بلاغ: ${esc(c.reporter_name)} • ${ago(c.created_at)}</div></div><span class="g48-status ${c.status==='approved'||c.status==='completed'?'ok':c.status==='rejected'?'warn':c.status==='punishment'?'bad':''}">${statusName(c.status)}</span></div>${action}</div>`;
    }).join(''):'<div class="g48-empty">مفيش قضايا لسه… شكل الناس مؤدبة زيادة عن اللزوم 😏</div>';
    host.innerHTML=`<div class="g48-grid">${create}${cards}</div>`;
    $('#g48CreateCase')?.addEventListener('click',async()=>{const accused=$('#g48Accused')?.value,acc=$('#g48Accusation')?.value?.trim();if(!accused)return toast('اختار المتهم الأول');if(!acc)return toast('اكتب التهمة يا قاضي 😄');const b=$('#g48CreateCase');b.disabled=true;try{await rpc('create_court_case',{p_accused_member_id:accused,p_accusation:acc});toast('المحكمة اتفتحت ⚖️');await renderCourt()}catch(e){console.error(e);toast('ماعرفناش نفتح القضية')}finally{b.disabled=false}});
    document.querySelectorAll('.g48-vote').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await rpc('vote_court_case',{p_case_id:b.dataset.case,p_vote:b.dataset.vote==='1'});await renderCourt()}catch(e){toast(String(e.message||e).includes('ACCUSED')?'المتهم مالوش صوت 😂':'التصويت مقفول أو حصلت مشكلة')}}));
    document.querySelectorAll('.g48-spin').forEach(b=>b.addEventListener('click',async()=>{const wheel=b.parentElement.querySelector('.g48-wheel');wheel?.classList.add('spin');b.disabled=true;b.textContent='العجلة بتلف…';try{const result=await rpc('spin_court_wheel',{p_case_id:b.dataset.case});setTimeout(()=>{toast(`الحكم: ${result}`);renderCourt()},1800)}catch(e){wheel?.classList.remove('spin');b.disabled=false;b.textContent='لف عجلة العقاب 😈';toast('العجلة معلّقتش… جرّب تاني 😅')}}));
    document.querySelectorAll('.g48-done').forEach(b=>b.addEventListener('click',async()=>{try{await rpc('complete_court_punishment',{p_case_id:b.dataset.case});toast('اتنفذ الحكم ✅');await renderCourt()}catch(e){toast('بس المتهم أو الأدمن يقدر يقفل الحكم')}}));
  }

  async function renderForbidden(){
    const host=$('#gamePane'); if(!host)return;
    const d=await rpc('get_forbidden_state');
    let active='';
    if(!d.active){
      active=`<div class="g48-card"><div class="g48-head"><div><div class="g48-title">🤐 ابدأ جولة ممنوع تقول</div><div class="g48-sub">هنختار واحد عشوائي وكلمة سر. هو مش هيعرف إنه الهدف، والباقي يعرفوا السر.</div></div></div><div class="g48-form"><select id="g48Duration" class="text-input"><option value="30">30 دقيقة</option><option value="60" selected>ساعة</option><option value="90">ساعة ونص</option></select><button id="g48StartForbidden" class="btn">🎲 ابدأ الجولة</button></div></div>`;
    }else if(d.is_target){
      active=`<div class="g48-secret"><div class="g48-target">🤐 جولة ممنوع تقول شغالة</div><div class="g48-word">خليك صاحي 😏</div><div class="g48-sub">${esc(d.decoy||'دور على اللي عليه الكلمة وحاول تصطاده.')}</div><div class="g48-timer" style="margin-top:8px">⏳ باقي ${remaining(d.ends_at)}</div>${d.can_cancel?'<button id="g48CancelForbidden" class="btn secondary" style="margin-top:12px">إلغاء الجولة</button>':''}</div>`;
    }else{
      active=`<div class="g48-secret"><div class="g48-target">الهدف: <strong>${esc(d.target_name)}</strong></div><div class="g48-word">«${esc(d.word)}»</div><div class="g48-sub">استناه يقولها… أو حاول تجرّه للكلمة من غير ما يشك 😂</div><div class="g48-timer">⏳ باقي ${remaining(d.ends_at)}</div><button id="g48Caught" class="g48-catch">🚨 اتقفش وقالها!</button>${d.can_cancel?'<button id="g48CancelForbidden" class="btn secondary" style="margin-top:9px;width:100%">إلغاء الجولة</button>':''}</div>`;
    }
    const stats=(d.stats||[]).map((s,i)=>`<div class="g48-rank"><span>${i===0&&Number(s.penalty_points)>0?'👑 ':''}${esc(s.name)}</span><strong>${Number(s.penalty_points||0).toLocaleString('ar-EG')} نقطة عقاب</strong></div>`).join('')||'<div class="g48-empty">لسه محدش اتقفش.</div>';
    const history=(d.history||[]).filter(x=>x.status==='caught').slice(0,6).map(h=>`<div class="g48-rank"><span>${esc(h.target_name)} قال «${esc(h.word)}» 😂</span><small>${h.caught_by_name?`اتقفش بواسطة ${esc(h.caught_by_name)}`:''}</small></div>`).join('')||'<div class="g48-empty">مفيش ضحايا سابقين لسه 😇</div>';
    host.innerHTML=`<div class="g48-grid">${active}<div class="g48-card"><div class="g48-title" style="margin-bottom:9px">🏆 جدول العقاب</div><div class="g48-leader">${stats}</div></div><div class="g48-card"><div class="g48-title" style="margin-bottom:9px">😂 اتقفشوا قبل كده</div><div class="g48-leader">${history}</div></div></div>`;
    $('#g48StartForbidden')?.addEventListener('click',async()=>{const b=$('#g48StartForbidden');b.disabled=true;b.textContent='بنختار الضحية…';try{await rpc('start_forbidden_round',{p_duration_minutes:Number($('#g48Duration')?.value||60)});toast('الجولة بدأت 🤫');await renderForbidden()}catch(e){console.error(e);toast(String(e.message||e).includes('ROUND_ALREADY_ACTIVE')?'فيه جولة شغالة بالفعل':'ماعرفناش نبدأ الجولة')}finally{b.disabled=false}});
    $('#g48Caught')?.addEventListener('click',async()=>{if(!confirm('متأكد إنه قال الكلمة؟ 😂'))return;const b=$('#g48Caught');b.disabled=true;try{await rpc('catch_forbidden_word',{p_round_id:d.round_id});toast('اتقفش رسميًا 😂 +1 نقطة عقاب');await renderForbidden()}catch(e){toast('الجولة خلصت أو حد اتقفشه قبلك')}});
    $('#g48CancelForbidden')?.addEventListener('click',async()=>{if(!confirm('تلغي الجولة؟'))return;try{await rpc('cancel_forbidden_round',{p_round_id:d.round_id});await renderForbidden()}catch(e){toast('مش مسموح بإلغاء الجولة')}});
  }

  async function renderGames(){
    if(page()!=='games.html'||!$('#gamesApp')||rendering)return;
    rendering=true;style();ensureNav();
    try{
      const tab=location.hash==='#forbidden'?'forbidden':'court';
      $('#gamesApp').innerHTML=`<div class="g48-tabs"><button class="g48-tab ${tab==='court'?'active':''}" data-tab="court">⚖️ محكمة الأشقياء</button><button class="g48-tab ${tab==='forbidden'?'active':''}" data-tab="forbidden">🤐 ممنوع تقول</button></div><div id="gamePane"><div class="g48-empty">بنجهز اللعب…</div></div>`;
      document.querySelectorAll('.g48-tab').forEach(b=>b.addEventListener('click',()=>{location.hash=b.dataset.tab==='forbidden'?'forbidden':'court';renderGames()}));
      if(tab==='court')await renderCourt();else await renderForbidden();
    }catch(e){console.error('[V48 games]',e);$('#gamesApp').innerHTML='<div class="g48-empty">حصلت مشكلة في تحميل الألعاب — جرّب تاني.</div>'}finally{rendering=false}
  }

  async function hydrate(){style();ensureNav();if(page()==='games.html')await renderGames()}
  function boot(){
    style();ensureNav();hydrate();
    window.addEventListener('hashchange',()=>{if(page()==='games.html')renderGames()});
    setInterval(()=>{ensureNav();const main=$('#appMain');if(main!==lastMain){lastMain=main;hydrate()}},900);
    refreshTimer=setInterval(()=>{if(page()==='games.html'&&document.visibilityState==='visible')renderGames()},15000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')hydrate()});
  }
  window.KenzGames={hydrate,renderGames};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();