(() => {
  if(window.__KENZ_IA__)return;
  window.__KENZ_IA__=true;
  const current=()=>location.pathname.split('/').pop()||'index.html';
  const adminPages=new Set(['admin.html','admin-expenses.html','admin-members.html','admin-games.html','admin-announcements.html']);
  const nav=[['index.html','🏠','الرئيسية'],['shopping.html','🛒','المشتريات'],['expenses.html','💰','الحسابات'],['trip.html','🧭','الرحلة'],['account.html','👤','حسابي']];
  const group=file=>({meals:'trip',crew:'trip',transport:'trip',location:'trip',ideas:'trip',games:'trip',bag:'account',settings:'account','my-tasks':'account',responsibilities:'shopping'}[file.replace('.html','')]||file.replace('.html',''));
  function apply(){
    const member=window.TripDB?.getMember?.();if(!member)return;
    const isAdmin=!!window.TripDB?.isAdmin?.(),file=current();
    if(adminPages.has(file)&&!isAdmin){location.replace('index.html');return}
    const links=document.querySelector('.topbar .links');
    if(links){
      const html=nav.map(([href,icon,label])=>`<a href="${href}" class="${group(file)===href.slice(0,-5)?'active':''}">${icon} ${label}</a>`).join('')+(isAdmin?'<a href="admin.html" class="ia-admin-link">👑 لوحة الأدمن</a>':'');
      if(links.innerHTML!==html)links.innerHTML=html;
    }
    const bottom=document.querySelector('#v38BottomNav');
    if(bottom){
      const html=nav.map(([href,icon,label])=>`<a href="${href}" class="${group(file)===href.slice(0,-5)?'active':''}"><span class="ico">${icon}</span><span>${label}</span></a>`).join('');
      if(bottom.innerHTML!==html)bottom.innerHTML=html;
    }
    const drawer=document.querySelector('#mobileMenuDrawer .mobile-drawer-links');
    if(drawer){
      const html=`<div class="v38-drawer-label">الصفحات الرئيسية</div>`+nav.map(([href,icon,label])=>`<a href="${href}"><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></a>`).join('')+(isAdmin?'<div class="v38-drawer-label">الإدارة</div><a href="admin.html"><span class="nav-icon">👑</span><span class="nav-label">لوحة الأدمن</span></a>':'');
      if(drawer.innerHTML!==html)drawer.innerHTML=html;
    }
    document.querySelector('#notificationHome')?.remove();
    // The bell owns the activity history; keep the home focused on trip readiness and tasks.
    document.querySelector('#recentChanges')?.closest('.section')?.remove();
    document.querySelector('#g48HomeShortcut')?.remove();
    document.querySelector('#adminShortcut')?.remove();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  setInterval(apply,1000);
  window.addEventListener('pageshow',apply);
})();
