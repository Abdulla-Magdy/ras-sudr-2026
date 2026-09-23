(() => {
  if (window.__BAZ_V28_LOADED__) return;
  window.__BAZ_V28_LOADED__ = true;

  const VERSION='V28';
  const UPDATED_AT='23/09/2026 19:52';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let summarySyncing=false;

  const style=document.createElement('style');
  style.id='v28-style';
  style.textContent=`
    body.v28-ui{--v28-line:rgba(255,255,255,.075);--v28-card:rgba(255,255,255,.034);--v28-muted:rgba(247,251,255,.61);--v28-aqua:#67e3dc;--v28-green:#91e6a0;--v28-amber:#ffc86b;--v28-red:#ff8b7d}
    .v28-expense-page .hero{padding:20px 0 10px}.v28-expense-page .hero .eyebrow{display:none}.v28-expense-page .hero h1{text-align:right;font-size:30px;margin:0 0 5px}.v28-expense-page .hero .subtitle{text-align:right;font-size:11px;line-height:1.6}
    .v28-account-summary{display:grid;gap:9px}.v28-my-balance{padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(103,227,220,.08),rgba(143,107,240,.08));border:1px solid var(--v28-line)}.v28-my-balance-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.v28-my-balance-head h2{margin:0;font-size:18px}.v28-balance-badge{font-size:10px;padding:6px 9px;border-radius:999px;font-weight:900}.v28-balance-badge.credit{color:#bdf4c5;background:rgba(145,230,160,.12);border:1px solid rgba(145,230,160,.2)}.v28-balance-badge.debt{color:#ffd1cb;background:rgba(255,139,125,.12);border:1px solid rgba(255,139,125,.2)}.v28-balance-badge.settled{color:#dfe9ef;background:rgba(255,255,255,.06);border:1px solid var(--v28-line)}
    .v28-my-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v28-my-stat{padding:10px;border-radius:13px;background:rgba(0,0,0,.12);border:1px solid rgba(255,255,255,.055)}.v28-my-stat span{display:block;color:var(--v28-muted);font-size:8px}.v28-my-stat strong{display:block;font-size:15px;margin-top:4px}.v28-my-caption{font-size:9px;color:var(--v28-muted);margin-top:9px;line-height:1.5}
    .v28-money-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v28-money-action{border:1px solid var(--v28-line);background:var(--v28-card);color:#fff;border-radius:14px;padding:12px;text-align:right;cursor:pointer}.v28-money-action strong{display:block;font-size:13px}.v28-money-action span{display:block;color:var(--v28-muted);font-size:9px;margin-top:3px}.v28-money-action .ico{font-size:20px;float:left;margin-inline-start:8px}
    .v28-entry-section{display:none!important}.v28-entry-section.v28-open{display:block!important}.v28-entry-section .card{padding:13px!important;border-radius:15px!important}.v28-entry-section .section-title{margin-bottom:8px!important}.v28-entry-section .section-title h2{font-size:17px!important}.v28-entry-section .notice{font-size:9px!important;line-height:1.55!important;padding:10px!important}.v28-entry-close{display:flex;justify-content:flex-end;margin-bottom:7px}.v28-entry-close button{border:0;background:transparent;color:var(--v28-muted);font-size:10px;cursor:pointer}
    .v28-expense-page .purchase-queue-item{padding:9px!important;border-radius:11px!important}.v28-expense-page .purchase-queue-item strong{font-size:11px}.v28-expense-page .purchase-queue-item small{font-size:8px}.v28-expense-page .purchase-batch-footer,.v28-expense-page .expense-form-grid{gap:8px!important}.v28-expense-page .purchase-selection-status{font-size:9px!important}
    .v28-log-section>.card{padding:13px!important}.v28-log-section .section-title{margin-bottom:9px}.v28-log-section .section-title h2{font-size:18px}.v28-log-section .v24-expense-tabs{margin-bottom:9px!important;padding:4px!important;border-radius:13px!important}.v28-log-section .v24-expense-tab{padding:9px 10px!important;font-size:10px}.v28-log-section .v24-expense-filter-note{font-size:9px!important;margin-bottom:9px!important}.v28-expense-page .expense-log-card{padding:11px!important;border-radius:13px!important;margin-bottom:7px!important}.v28-expense-page .expense-log-card strong{font-size:12px}.v28-expense-page .v23-expense-actions,.v28-expense-page .v22-expense-actions{gap:6px!important}.v28-expense-page .v23-expense-actions .btn,.v28-expense-page .v22-expense-actions .btn{min-height:34px!important;padding:6px 9px!important;font-size:9px!important}
    .v28-advanced{border:1px solid var(--v28-line);background:rgba(255,255,255,.025);border-radius:16px;overflow:hidden;margin:7px 0 14px}.v28-advanced>summary{list-style:none;cursor:pointer;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px;font-weight:900}.v28-advanced>summary::-webkit-details-marker{display:none}.v28-advanced>summary small{font-size:9px;color:var(--v28-muted);font-weight:500}.v28-advanced>summary:after{content:'⌄';color:var(--v28-aqua);font-size:18px}.v28-advanced[open]>summary:after{content:'⌃'}.v28-advanced-body{padding:0 10px 10px}.v28-advanced-body>.section{padding:6px 0!important}.v28-advanced .finance-kpis{grid-template-columns:repeat(2,1fr)!important;gap:7px!important}.v28-advanced .finance-kpi{padding:10px!important;border-radius:13px!important}.v28-advanced .finance-kpi strong{font-size:15px!important}.v28-advanced .finance-report-card{padding:12px!important}.v28-advanced .settlement-table-wrap{overflow-x:auto}.v28-advanced .finance-two-col{grid-template-columns:1fr!important;gap:8px!important}
    .v28-version{font-size:9px;opacity:.55;text-align:center;padding:10px 8px 16px}.v28-version-drawer{font-size:9px;opacity:.55;text-align:center;padding:8px}
    @media(max-width:760px){.v28-my-grid{gap:6px}.v28-my-stat{padding:9px 8px}.v28-money-actions{grid-template-columns:1fr 1fr}.v28-advanced .finance-kpis{grid-template-columns:1fr 1fr!important}.v28-expense-page .expense-form-grid{grid-template-columns:1fr!important}.v28-expense-page .purchase-batch-footer{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  function path(){return location.pathname.split('/').pop()||'index.html';}
  function me(){return window.TripDB?.getMember?.();}
  function money(v){const n=Number(v||0);return new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(n)+' ج';}
  async function waitForApp(){for(let i=0;i<100;i++){if(me())return true;await sleep(100);}return false;}

  function updateVersion(){
    document.querySelectorAll('.v21-version,.v22-version,.v23-version,.v24-version,.v25-version,.v26-version,.v27-version,.v28-version,.v23-version-drawer,.v24-version-drawer,.v25-version-drawer,.v26-version-drawer,.v27-version-drawer,.v28-version-drawer').forEach(x=>x.remove());
    const el=document.createElement('div');el.className='v28-version';el.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;const footer=document.querySelector('.footer');if(footer)footer.insertAdjacentElement('afterend',el);else document.body.appendChild(el);
    const da=document.querySelector('#mobileMenuDrawer .mobile-drawer-actions');if(da){const d=document.createElement('div');d.className='v28-version-drawer';d.textContent=`${VERSION} • ${UPDATED_AT}`;da.insertAdjacentElement('afterend',d);}
  }

  async function syncPersonalSummary(){
    if(path()!=='expenses.html'||summarySyncing)return;
    const box=document.getElementById('v28PersonalSummary');if(!box)return;
    summarySyncing=true;
    try{
      const member=me();
      const [expenses,members]=await Promise.all([
        TripDB.list('expenses',{order:'created_at',asc:false}),
        TripDB.list('members',{order:'sort_order'})
      ]);
      const confirmed=members.filter(x=>x.confirmed!==false);
      const total=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
      const myPaid=expenses.filter(x=>x.payer_member_id===member.id).reduce((s,x)=>s+Number(x.amount||0),0);
      const included=confirmed.some(x=>x.id===member.id);
      const share=included&&confirmed.length?total/confirmed.length:0;
      const net=myPaid-share;
      let label='خالص ✓',cls='settled';
      if(net>0.005){label=`ليك ${money(net)}`;cls='credit';}
      else if(net<-0.005){label=`عليك ${money(Math.abs(net))}`;cls='debt';}
      box.innerHTML=`<div class="v28-my-balance-head"><h2>ملخصي أنا</h2><span class="v28-balance-badge ${cls}">${label}</span></div><div class="v28-my-grid"><div class="v28-my-stat"><span>أنا دفعت</span><strong>${money(myPaid)}</strong></div><div class="v28-my-stat"><span>نصيبي</span><strong>${money(share)}</strong></div><div class="v28-my-stat"><span>إجمالي الرحلة</span><strong>${money(total)}</strong></div></div><div class="v28-my-caption">القسمة الحالية على ${confirmed.length.toLocaleString('ar-EG')} أشخاص${included?'':' • إنت خارج القسمة حاليًا'}.</div>`;
    }catch(e){console.warn('V28 personal summary failed',e);}
    finally{summarySyncing=false;}
  }

  function toggleEntry(kind){
    const purchase=document.querySelector('.purchase-batch-card')?.closest('.section');
    const generic=document.querySelector('.expense-entry-card')?.closest('.section');
    const target=kind==='purchase'?purchase:generic;const other=kind==='purchase'?generic:purchase;
    if(!target)return;
    const opening=!target.classList.contains('v28-open');
    other?.classList.remove('v28-open');
    target.classList.toggle('v28-open',opening);
    if(opening)setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),50);
  }

  function prepareEntry(section){
    if(!section)return;section.classList.add('v28-entry-section');
    const card=section.querySelector('.card');if(card&&!card.querySelector('.v28-entry-close')){const c=document.createElement('div');c.className='v28-entry-close';c.innerHTML='<button type="button">إخفاء ✕</button>';card.prepend(c);c.querySelector('button').onclick=()=>section.classList.remove('v28-open');}
  }

  function buildLayout(){
    if(path()!=='expenses.html'||document.getElementById('v28PersonalSummary'))return;
    document.body.classList.add('v28-ui','v28-expense-page');
    const main=document.querySelector('main.shell');const hero=main?.querySelector('.hero');if(!main||!hero)return;
    hero.querySelector('h1').textContent='الحسابات 💰';const sub=hero.querySelector('.subtitle');if(sub)sub.textContent='شوف موقفك الأول، وسجّل دفعتك بسرعة. تفاصيل التسوية موجودة لما تحتاجها.';

    const personal=document.createElement('section');personal.className='section v28-account-summary';personal.innerHTML='<div id="v28PersonalSummary" class="v28-my-balance"><div class="v28-my-balance-head"><h2>ملخصي أنا</h2></div><div class="v28-my-caption">بنحسب موقفك...</div></div><div class="v28-money-actions"><button type="button" class="v28-money-action" data-kind="purchase"><span class="ico">🛒</span><strong>سجل فاتورة مشتريات</strong><span>اختار الحاجات وإجمالي الفاتورة</span></button><button type="button" class="v28-money-action" data-kind="generic"><span class="ico">➕</span><strong>سجل مصروف عام</strong><span>بنزين، بوابات، شاليه أو غيره</span></button></div>';
    hero.insertAdjacentElement('afterend',personal);personal.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>toggleEntry(b.dataset.kind));

    const purchase=document.querySelector('.purchase-batch-card')?.closest('.section');const generic=document.querySelector('.expense-entry-card')?.closest('.section');prepareEntry(purchase);prepareEntry(generic);
    if(purchase)personal.insertAdjacentElement('afterend',purchase);
    if(generic)purchase?.insertAdjacentElement('afterend',generic);

    const expenseList=document.getElementById('expenseList');const logSection=expenseList?.closest('.section');if(logSection){logSection.classList.add('v28-log-section');generic?.insertAdjacentElement('afterend',logSection);}

    const advancedSections=[];
    const kpi=document.querySelector('.finance-kpis')?.closest('.section');if(kpi)advancedSections.push(kpi);
    const report=document.querySelector('.finance-report-card')?.closest('.section');if(report)advancedSections.push(report);
    const two=document.querySelector('.finance-two-col')?.closest('.section');if(two)advancedSections.push(two);
    if(advancedSections.length){
      const details=document.createElement('details');details.className='v28-advanced';details.id='v28Advanced';details.innerHTML='<summary><span>تفاصيل الحساب والتسوية</span><small>التقرير الكامل • مين يحوّل لمين • التصنيفات</small></summary><div class="v28-advanced-body"></div>';
      const body=details.querySelector('.v28-advanced-body');advancedSections.forEach(s=>body.appendChild(s));logSection?.insertAdjacentElement('afterend',details);
      const saved=localStorage.getItem('v28AdvancedOpen')==='1';details.open=saved;details.addEventListener('toggle',()=>localStorage.setItem('v28AdvancedOpen',details.open?'1':'0'));
    }

    const logTitle=logSection?.querySelector('.section-title h2');if(logTitle)logTitle.textContent='سجل المصاريف';
    const logSmall=logSection?.querySelector('.section-title small');if(logSmall)logSmall.textContent='مصاريفي أو كل مصاريف الرحلة';
    syncPersonalSummary();
  }

  function watchExpenses(){
    const list=document.getElementById('expenseList');if(!list)return;
    const obs=new MutationObserver(()=>setTimeout(syncPersonalSummary,100));obs.observe(list,{childList:true,subtree:false});
  }

  async function main(){
    if(!(await waitForApp()))return;
    document.body.classList.add('v28-ui');
    buildLayout();watchExpenses();updateVersion();
    [900,1800,3200].forEach(ms=>setTimeout(()=>{buildLayout();syncPersonalSummary();updateVersion();},ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(main,120));else setTimeout(main,120);
})();
