(() => {
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const pathname = location.pathname.toLowerCase();
  const file = pathname.split('/').pop() || '';
  const page = (file || 'index.html').replace('.html','');
  const onLoginPage = page === 'login';
  const gateLanding = onLoginPage || pathname.endsWith('/');

  window.BAZ_PWA_GATE = { isMobile, isStandalone };

  if (isMobile && !isStandalone && !gateLanding) {
    const base = location.pathname.replace(/[^/]*$/, "");
    location.replace(base + "login.html?install=1");
    return;
  }

  const root=document.documentElement;
  root.classList.toggle("mobile-browser-gated", isMobile && !isStandalone);
  root.classList.toggle("installed-pwa", isStandalone);
  if(!onLoginPage) root.classList.add('baz-v35-pre',`baz-page-${page}`);

  // Current visual baseline is available before <body> is parsed, so the browser
  // never paints the old V20 layout and then morphs it half a second later.
  if(!onLoginPage){
    const critical=document.createElement('style');
    critical.id='baz-v35-critical';
    critical.textContent=`
      html.baz-v35-pre{background:#071822;color:#f7fbff}
      html.baz-v35-pre body{font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;background:linear-gradient(180deg,#071722 0%,#0a2633 55%,#08212d 100%);color:#f7fbff;padding-bottom:82px;overflow-x:hidden}
      html.baz-v35-pre .shell{width:min(1040px,calc(100% - 24px))!important}
      html.baz-v35-pre .topbar{background:rgba(4,17,25,.96)!important;border-bottom:1px solid rgba(255,255,255,.075)!important;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
      html.baz-v35-pre .nav{min-height:64px!important;padding:9px 0!important}
      html.baz-v35-pre .brand-logo{width:39px!important;height:39px!important;border-radius:12px!important}
      html.baz-v35-pre .brand span{font-size:13px!important}
      html.baz-v35-pre .hero{padding:22px 0 12px!important}
      html.baz-v35-pre .hero .eyebrow{display:none!important}
      html.baz-v35-pre .hero h1{font-size:clamp(27px,7vw,42px)!important;line-height:1.12!important;margin:0 0 5px!important;text-align:right!important}
      html.baz-v35-pre .hero .subtitle{font-size:12.5px!important;line-height:1.7!important;color:rgba(247,251,255,.62)!important;text-align:right!important}
      html.baz-v35-pre .section{padding:6px 0 12px!important}
      html.baz-v35-pre .card{background:rgba(255,255,255,.042)!important;border:1px solid rgba(255,255,255,.085)!important;border-radius:16px!important;box-shadow:none!important;padding:14px!important}
      html.baz-v35-pre .btn{min-height:42px!important;border-radius:12px!important;box-shadow:none!important}
      html.baz-v35-pre .text-input,html.baz-v35-pre .select-input,html.baz-v35-pre .qty-input,html.baz-v35-pre .amount-input,html.baz-v35-pre .textarea{border-radius:12px!important;background:rgba(0,0,0,.16)!important;border-color:rgba(255,255,255,.105)!important}
      html.baz-v35-pre .links,html.baz-v35-pre #dbState{display:none!important}
      #v35PreBottomNav{position:fixed;z-index:11990;left:12px;right:12px;bottom:max(10px,env(safe-area-inset-bottom));height:66px;display:flex;background:rgba(5,20,29,.965);border:1px solid rgba(255,255,255,.115);border-radius:21px;box-shadow:0 16px 40px rgba(0,0,0,.32);padding:5px}
      #v35PreBottomNav a,#v35PreBottomNav button{flex:1;min-width:0;border:0;background:transparent;color:rgba(247,251,255,.62);text-decoration:none;border-radius:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:800;font-size:9px}
      #v35PreBottomNav .ico{font-size:19px;line-height:1}#v35PreBottomNav .active{background:linear-gradient(135deg,rgba(115,231,225,.13),rgba(146,119,239,.15));color:#fff}
      #v35HomeShell{display:grid;gap:9px;padding-bottom:4px}.v35-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v35-kpi{min-height:72px;padding:9px 10px;border:1px solid rgba(255,255,255,.085);border-radius:15px;background:rgba(255,255,255,.04)}.v35-kpi span{display:block;font-size:17px}.v35-kpi strong{display:block;font-size:16px;margin:4px 0 1px}.v35-kpi small{font-size:8px;color:rgba(247,251,255,.62);line-height:1.4}.v35-panel{padding:12px;border:1px solid rgba(255,255,255,.085);border-radius:16px;background:rgba(255,255,255,.04)}.v35-panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.v35-panel-head strong{font-size:15px}.v35-panel-head span{font-size:10px;color:#73e7e1}.v35-task{height:54px;border-radius:12px;background:rgba(0,0,0,.12);margin-top:7px}.v35-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v35-quick div{padding:10px 7px;border-radius:14px;border:1px solid rgba(255,255,255,.085);background:rgba(255,255,255,.04);text-align:center;font-size:10px;font-weight:800}.v35-quick b{display:block;font-size:18px;margin-bottom:3px}.v35-meal-shortcut{padding:12px 14px;border-radius:15px;border:1px solid rgba(255,255,255,.085);background:rgba(255,255,255,.035);font-size:14px;font-weight:900}
      .v35-personal{padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(103,227,220,.08),rgba(143,107,240,.08));border:1px solid rgba(255,255,255,.075)}.v35-personal-top{display:flex;justify-content:space-between;align-items:center}.v35-personal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.v35-personal-grid div{padding:10px;border-radius:13px;background:rgba(0,0,0,.12);border:1px solid rgba(255,255,255,.055)}.v35-personal-grid span{font-size:8px;color:rgba(247,251,255,.61);display:block}.v35-personal-grid strong{font-size:15px;display:block;margin-top:4px}.v35-money-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.v35-money-actions div{border:1px solid rgba(255,255,255,.075);background:rgba(255,255,255,.034);border-radius:14px;padding:12px}.v35-money-actions strong{display:block;font-size:13px}.v35-money-actions span{display:block;font-size:9px;color:rgba(247,251,255,.61);margin-top:3px}
      html.baz-pre-expenses main.shell>.section:not(#v35ExpenseShell){display:none!important}
      html.baz-pre-bag .bag-add-grid,html.baz-pre-bag .quick-pack,html.baz-pre-bag .bag-add-card>.section-title{display:none!important}
      .v35-bag-toggle{width:100%;display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid rgba(255,255,255,.075);border-radius:14px;background:rgba(255,255,255,.035);color:#fff;font-weight:900}
      html.baz-page-shopping .card:has(#foodBody){background:transparent!important;border:0!important;padding:0!important}html.baz-page-shopping .card:has(#foodBody)>.toolbar{display:none!important}
      @media(min-width:761px){#v35PreBottomNav{display:none}html.baz-v35-pre body{padding-bottom:0}}
    `;
    document.head.appendChild(critical);
  }

  function currentDays(){
    const trip=new Date('2026-10-07T00:00:00+03:00');
    return Math.max(0,Math.ceil((trip-Date.now())/86400000));
  }
  function setText(el,t){if(el&&el.textContent!==t)el.textContent=t;}

  function ensureBottomNav(){
    if(onLoginPage||!document.body||document.getElementById('v35PreBottomNav')||document.getElementById('v26BottomNav'))return;
    const p=page;
    const n=document.createElement('nav');n.id='v35PreBottomNav';
    n.innerHTML=`<a href="index.html" class="${p==='index'?'active':''}"><span class="ico">🏠</span><span>الرئيسية</span></a><a href="shopping.html" class="${p==='shopping'?'active':''}"><span class="ico">🛒</span><span>المشتريات</span></a><a href="expenses.html" class="${p==='expenses'?'active':''}"><span class="ico">💰</span><span>الحسابات</span></a><a href="bag.html" class="${p==='bag'?'active':''}"><span class="ico">🎒</span><span>شنطتي</span></a><button type="button"><span class="ico">•••</span><span>المزيد</span></button>`;
    document.body.appendChild(n);
    n.querySelector('button').onclick=()=>document.getElementById('mobileMenuToggle')?.click();
  }

  function preHome(){
    const hero=document.querySelector('main.shell>.hero');if(!hero)return;
    if(!hero.dataset.v35pre){
      hero.dataset.v35pre='1';
      hero.innerHTML=`<div class="v25-home-hero"><div><div class="hello">أهلاً 👋</div><h1>جاهزين للرحلة؟ 😎</h1><div class="subtitle">الأربعاء 7 أكتوبر</div></div><div class="v25-countdown-pill"><strong>${currentDays()}</strong><span>يوم<br>على السفر</span></div></div>`;
    }
    document.querySelector('.timer')?.closest('.section')?.classList.add('v35-hide');
    const quick=document.querySelector('.section.quick');if(quick)quick.style.display='none';
    document.getElementById('mealSummary')?.closest('.section')?.classList.add('v35-hide');
    document.querySelectorAll('.v35-hide').forEach(x=>x.style.display='none');
    if(!document.getElementById('v35HomeShell')&&!document.getElementById('v25HomeDashboard')){
      const s=document.createElement('section');s.id='v35HomeShell';s.className='section';
      s.innerHTML=`<div class="v35-kpis"><div class="v35-kpi"><span>🛒</span><strong>—</strong><small>حاجة لسه مطلوبة</small></div><div class="v35-kpi"><span>💰</span><strong>—</strong><small>إجمالي مصاريف الرحلة</small></div><div class="v35-kpi"><span>🎒</span><strong>—</strong><small>جاهزين في شنطتك</small></div></div><div class="v35-panel"><div class="v35-panel-head"><strong>عليك إيه دلوقتي؟</strong><span>عرض الكل</span></div><div class="v35-task"></div><div class="v35-task"></div></div><div class="v35-quick"><div><b>➕</b>سجل مصروف</div><div><b>🛒</b>حاجة ناقصة</div><div><b>📍</b>Live Location</div></div><div class="v35-meal-shortcut">🍽️ خطة الأكل</div>`;
      hero.insertAdjacentElement('afterend',s);
    }
    if(document.getElementById('v25HomeDashboard')) document.getElementById('v35HomeShell')?.remove();
  }

  function preShopping(){
    const hero=document.querySelector('main.shell>.hero');if(hero){setText(hero.querySelector('h1'),'المشتريات');setText(hero.querySelector('.subtitle'),'كل اللي ناقص للرحلة في مكان واحد — خد مسؤولية، ضيف حاجة بسرعة، واقفل اللي اتجاب.');}
    document.body?.classList.add('v26-shopping-page','v25-food-page');
  }

  function preExpenses(){
    root.classList.add('baz-pre-expenses');
    const hero=document.querySelector('main.shell>.hero');if(!hero)return;
    setText(hero.querySelector('h1'),'الحسابات 💰');setText(hero.querySelector('.subtitle'),'شوف موقفك الأول، وسجّل دفعتك بسرعة. تفاصيل التسوية موجودة لما تحتاجها.');
    if(!document.getElementById('v35ExpenseShell')&&!document.getElementById('v28PersonalSummary')){
      const s=document.createElement('section');s.id='v35ExpenseShell';s.className='section';
      s.innerHTML=`<div class="v35-personal"><div class="v35-personal-top"><strong>ملخصي أنا</strong><span class="muted">—</span></div><div class="v35-personal-grid"><div><span>أنا دفعت</span><strong>—</strong></div><div><span>نصيبي</span><strong>—</strong></div><div><span>إجمالي الرحلة</span><strong>—</strong></div></div></div><div class="v35-money-actions"><div><strong>🛒 سجل فاتورة مشتريات</strong><span>اختار الحاجات وإجمالي الفاتورة</span></div><div><strong>➕ سجل مصروف عام</strong><span>بنزين، بوابات، شاليه أو غيره</span></div></div>`;
      hero.insertAdjacentElement('afterend',s);
    }
    if(document.getElementById('v28PersonalSummary')){
      document.getElementById('v35ExpenseShell')?.remove();root.classList.remove('baz-pre-expenses');
    }
  }

  function preBag(){
    root.classList.add('baz-pre-bag');
    const hero=document.querySelector('main.shell>.hero');if(hero){setText(hero.querySelector('h1'),'شنطتي 🎒');setText(hero.querySelector('.subtitle'),'Checklist بسيطة: علّم الحاجة أول ما تتحط فعلًا في الشنطة.');}
    const packed=document.querySelector('.bag-kpi.done span');if(packed)setText(packed,'في الشنطة');
    document.querySelectorAll('.bag-kpi span').forEach(x=>{if(x.textContent.trim()==='فاضل')setText(x,'لسه ناقص')});
    const card=document.querySelector('.bag-add-card');if(card&&!card.querySelector('.v35-bag-toggle')&&!card.querySelector('.v27-bag-add-toggle')){const b=document.createElement('button');b.className='v35-bag-toggle';b.type='button';b.innerHTML='<span>＋ إضافة حاجة لشنطتي</span><span>⌄</span>';card.appendChild(b);}
    if(document.getElementById('v27BagTabs')){card?.querySelector('.v35-bag-toggle')?.remove();root.classList.remove('baz-pre-bag');}
  }

  function applyPrepaint(){
    if(onLoginPage)return;
    ensureBottomNav();
    if(page==='index')preHome();
    else if(page==='shopping')preShopping();
    else if(page==='expenses')preExpenses();
    else if(page==='bag')preBag();
    const realNav=document.getElementById('v26BottomNav')||document.getElementById('v25BottomNav');if(realNav)document.getElementById('v35PreBottomNav')?.remove();
  }

  if(!onLoginPage){
    const observer=new MutationObserver(applyPrepaint);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('DOMContentLoaded',()=>{applyPrepaint();setTimeout(applyPrepaint,80);setTimeout(applyPrepaint,300);},{once:true});
    setTimeout(()=>{applyPrepaint();},700);
  }

  // Warm UI layer downloads as early as possible. V35 is structural only; the
  // feature files still own data and interactions.
  if (!onLoginPage) {
    [21,22,23,24,25,26,27,28,29,30,31,32,34,35].forEach(v=>{
      const l=document.createElement('link');l.rel='preload';l.as='script';l.href=`./assets/v${v}.js?v=${v}`;document.head.appendChild(l);
    });
  }

  window.BAZ_UI_BOOT={reveal(){}};
})();
