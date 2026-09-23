(() => {
  if (window.__BAZ_V31_LOADED__) return;
  window.__BAZ_V31_LOADED__ = true;

  const VERSION='V31';
  const UPDATED_AT='23/09/2026 22:35';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  const style=document.createElement('style');
  style.id='v31-style';
  style.textContent=`
    body.v31-ui .hero{padding-block:26px 16px}
    body.v31-ui .hero .eyebrow{display:none}
    body.v31-ui .hero h1{font-size:clamp(28px,7vw,44px);margin-bottom:5px}
    body.v31-ui .hero .subtitle{font-size:13px;line-height:1.7;max-width:650px}

    .v31-crew-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:8px 0 18px}
    .v31-crew-stat{padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.035)}
    .v31-crew-stat span{display:block;color:var(--muted);font-size:10px}
    .v31-crew-stat strong{display:block;font-size:20px;margin-top:4px}
    .v31-crew-list{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
    .v31-crew-row{display:flex;align-items:center;gap:12px;padding:13px 14px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.035)}
    .v31-avatar{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(102,230,223,.09);font-size:20px;flex:0 0 auto}
    .v31-crew-main{min-width:0;flex:1}.v31-crew-name{font-weight:900;font-size:15px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.v31-crew-role{font-size:11px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v31-crew-joke{font-size:10px;color:var(--muted);opacity:.78;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .v31-status{padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap;background:rgba(102,230,223,.10);color:#9af3ee;border:1px solid rgba(102,230,223,.16)}
    .v31-status.off{background:rgba(255,255,255,.04);color:var(--muted);border-color:rgba(255,255,255,.08)}
    .v31-you{font-size:9px;padding:3px 6px;border-radius:999px;background:rgba(129,98,255,.16);color:#d8ceff}
    .v31-admin-crown{font-size:12px}

    .v31-admin-launch{width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 15px;border-radius:17px;border:1px solid rgba(255,209,124,.18);background:rgba(255,209,124,.055);color:#fff;text-decoration:none;font-weight:900;margin-top:4px}
    .v31-admin-launch small{display:block;color:var(--muted);font-size:10px;font-weight:500;margin-top:3px}
    #adminShortcut{display:none!important}
    #adminPanel.v31-admin-section{display:block!important;margin-top:8px}
    .v31-admin-details{border:1px solid rgba(255,209,124,.17);border-radius:18px;background:rgba(255,255,255,.025);overflow:hidden}
    .v31-admin-details>summary{list-style:none;cursor:pointer;padding:15px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:900}
    .v31-admin-details>summary::-webkit-details-marker{display:none}.v31-admin-details>summary:after{content:'⌄';color:#ffd17c}.v31-admin-details[open]>summary:after{content:'⌃'}
    .v31-admin-body{padding:0 10px 12px}.v31-admin-body>.card{margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important;padding:8px!important}
    .v31-admin-body .notice{font-size:10px;padding:10px 12px}.v31-admin-body .admin-add-member{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;background:rgba(255,255,255,.025)}
    #adminMembers>*{border-bottom:1px solid rgba(255,255,255,.07)!important;padding-block:10px!important}#adminMembers>*:last-child{border-bottom:0!important}

    .v31-drawer-section-label{font-size:9px;letter-spacing:.12em;color:var(--muted);opacity:.72;padding:11px 12px 5px;text-transform:uppercase}
    #mobileMenuDrawer .mobile-drawer-links{display:grid!important;gap:3px!important}
    #mobileMenuDrawer .mobile-drawer-links a{min-height:44px!important;padding:10px 12px!important;border-radius:12px!important}
    #mobileMenuDrawer .mobile-drawer-links a.active{background:rgba(102,230,223,.09)!important}
    #mobileMenuDrawer .mobile-drawer-links .v31-admin-menu{color:#ffe2aa;border:1px solid rgba(255,209,124,.12)}
    .v31-version{font-size:10px;opacity:.6;text-align:center;padding:12px 8px 90px}
    .v31-version-drawer{font-size:9px;opacity:.55;text-align:center;padding:8px 8px 4px}

    @media(max-width:700px){
      .v31-crew-summary{grid-template-columns:repeat(3,1fr)}
      .v31-crew-stat{padding:10px 8px}.v31-crew-stat strong{font-size:18px}
      .v31-crew-row{padding:11px 12px}.v31-avatar{width:38px;height:38px;border-radius:12px}
    }
  `;
  document.head.appendChild(style);

  function me(){return window.TripDB?.getMember?.();}
  function trip(){return window.TripDB?.getTrip?.();}
  function isAdmin(){return !!window.TripDB?.isAdmin?.();}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));}
  async function waitForApp(){for(let i=0;i<80;i++){if(me()&&trip())return true;await sleep(100)}return false;}

  const navItems=[
    ['index.html','🏠','الرئيسية','main'],
    ['shopping.html','🛒','المشتريات','main'],
    ['meals.html','🍽️','خطة الأكل','main'],
    ['my-tasks.html','✅','عليّا إيه؟','main'],
    ['expenses.html','💰','الحسابات','main'],
    ['bag.html','🎒','شنطتي','main'],
    ['crew.html','😎','الأشقياء','group'],
    ['responsibilities.html','📋','مين عليه إيه؟','group'],
    ['location.html','📍','Live Location','group'],
    ['ideas.html','💡','الاقتراحات','group']
  ];

  function currentPage(){return location.pathname.split('/').pop()||'index.html';}
  function rebuildDrawer(){
    const drawer=document.querySelector('#mobileMenuDrawer .mobile-drawer-links');
    if(!drawer)return;
    const page=currentPage();
    let html='<div class="v31-drawer-section-label">الرحلة</div>';
    navItems.filter(x=>x[3]==='main').forEach(([href,icon,label])=>html+=`<a href="${href}" data-page="${href}" class="${page===href?'active':''}"><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></a>`);
    html+='<div class="v31-drawer-section-label">المجموعة</div>';
    navItems.filter(x=>x[3]==='group').forEach(([href,icon,label])=>html+=`<a href="${href}" data-page="${href}" class="${page===href?'active':''}"><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></a>`);
    if(isAdmin()) html+=`<div class="v31-drawer-section-label">الإدارة</div><a class="v31-admin-menu" href="crew.html#adminPanel"><span class="nav-icon">👑</span><span class="nav-label">إدارة الرحلة</span></a>`;
    drawer.innerHTML=html;
  }

  function rebuildDesktopNav(){
    const links=document.querySelector('.links');if(!links)return;
    const page=currentPage();
    const desktop=[
      ['index.html','🏠','الرئيسية'],['shopping.html','🛒','المشتريات'],['meals.html','🍽️','خطة الأكل'],['responsibilities.html','📋','عليه إيه؟'],['expenses.html','💰','الحسابات'],['crew.html','😎','الأشقياء'],['bag.html','🎒','شنطتي'],['ideas.html','💡','اقتراحات'],['location.html','📍','Live']
    ];
    links.innerHTML=desktop.map(([href,icon,label])=>`<a href="${href}" data-page="${href}" class="${page===href?'active':''}"><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></a>`).join('');
  }

  async function redesignCrew(){
    const grid=document.getElementById('crewGrid');if(!grid)return;
    document.body.classList.add('v31-ui');
    const members=await window.TripDB.list('members',{order:'sort_order'});
    const all=members||[],confirmed=all.filter(x=>x.confirmed!==false),out=all.length-confirmed.length;
    const adminCount=all.filter(x=>x.access_role==='admin').length;
    const hero=document.querySelector('.hero');
    if(hero){
      hero.querySelector('h1').textContent='الأشقياء 😎';
      hero.querySelector('.subtitle').textContent='كل اللي داخلين الرحلة، وحالة مشاركة كل واحد.';
      if(!document.getElementById('v31CrewSummary')){
        const s=document.createElement('div');s.id='v31CrewSummary';s.className='v31-crew-summary';
        s.innerHTML=`<div class="v31-crew-stat"><span>مؤكدين</span><strong>${confirmed.length.toLocaleString('ar-EG')}</strong></div><div class="v31-crew-stat"><span>مش طالعين</span><strong>${out.toLocaleString('ar-EG')}</strong></div><div class="v31-crew-stat"><span>الإجمالي</span><strong>${all.length.toLocaleString('ar-EG')}</strong></div>`;
        hero.insertAdjacentElement('afterend',s);
      }
    }
    grid.className='v31-crew-list';
    grid.innerHTML=all.map((m,i)=>{
      const mine=m.id===me().id,active=m.confirmed!==false,admin=m.access_role==='admin';
      const avatar=admin?'👑':active?'😎':'💤';
      return `<div class="v31-crew-row ${active?'':'is-off'}">
        <div class="v31-avatar">${avatar}</div>
        <div class="v31-crew-main">
          <div class="v31-crew-name">${esc(m.name)} ${mine?'<span class="v31-you">إنت</span>':''} ${admin?'<span class="v31-admin-crown">👑</span>':''}</div>
          ${m.role?`<div class="v31-crew-role">${esc(m.role)}</div>`:''}
          ${m.joke?`<div class="v31-crew-joke">${esc(m.joke)}</div>`:''}
        </div>
        <span class="v31-status ${active?'':'off'}">${active?'طالع ✓':'مش طالع'}</span>
      </div>`;
    }).join('');

    const shortcut=document.getElementById('adminShortcut'); if(shortcut)shortcut.style.display='none';
    const panel=document.getElementById('adminPanel');
    if(!isAdmin()){
      if(panel)panel.remove();
      return;
    }
    if(panel){
      panel.classList.add('v31-admin-section');
      let details=document.getElementById('v31AdminDetails');
      if(!details){
        const card=panel.querySelector(':scope > .card');
        details=document.createElement('details');details.id='v31AdminDetails';details.className='v31-admin-details';
        details.innerHTML='<summary><span>👑 إدارة الرحلة</span><small class="muted">الأعضاء والـ PIN</small></summary><div class="v31-admin-body"></div>';
        if(card)details.querySelector('.v31-admin-body').appendChild(card);
        panel.appendChild(details);
      }
      if(location.hash==='#adminPanel')details.open=true;
      if(!document.getElementById('v31AdminLaunch')){
        const launch=document.createElement('a');launch.id='v31AdminLaunch';launch.href='#adminPanel';launch.className='v31-admin-launch';
        launch.innerHTML='<div><strong>👑 إدارة الرحلة</strong><small>إضافة عضو • حالة المشاركة • Reset PIN</small></div><span>↓</span>';
        document.getElementById('v31CrewSummary')?.insertAdjacentElement('afterend',launch);
        launch.onclick=()=>{details.open=true;setTimeout(()=>details.scrollIntoView({behavior:'smooth',block:'start'}),50)};
      }
    }
  }

  function tidyAdmin(){
    if(!isAdmin())return;
    const panel=document.getElementById('adminPanel');if(!panel)return;
    const add=panel.querySelector('.admin-add-member');
    if(add&&!add.closest('.v31-subdetails')){
      const det=document.createElement('details');det.className='v31-collapsible v31-subdetails';det.innerHTML='<summary><span>➕ إضافة عضو جديد</span><small class="muted">اختياري</small></summary><div class="v30-collapsible-body"></div>';
      add.parentNode.insertBefore(det,add);det.querySelector('.v30-collapsible-body').appendChild(add);
    }
  }

  function version(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v27-version,.v28-version,.v29-version,.v30-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer,.v27-version-drawer,.v28-version-drawer,.v29-version-drawer,.v30-version-drawer,.v31-version,.v31-version-drawer').forEach(x=>x.remove());
    const footer=document.querySelector('.footer');
    if(footer){const d=document.createElement('div');d.className='v31-version';d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;footer.insertAdjacentElement('afterend',d)}
    const actions=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){const d=document.createElement('div');d.className='v31-version-drawer';d.innerHTML=`${VERSION} • ${UPDATED_AT}`;actions.insertAdjacentElement('afterend',d)}
  }

  async function main(){
    if(!(await waitForApp()))return;
    rebuildDesktopNav();
    rebuildDrawer();
    await redesignCrew();
    tidyAdmin();
    version();
    [700,1500,2600].forEach(ms=>setTimeout(()=>{rebuildDrawer();tidyAdmin();version()},ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(main,180));else setTimeout(main,180);
})();