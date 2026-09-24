(() => {
  if (window.__BAZ_V42__) return;
  window.__BAZ_V42__ = true;

  const VERSION='V42';
  const UPDATED_AT='24/09/2026 02:38';
  let tabBusy=false;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const route=()=>location.pathname.split('/').pop()||'index.html';

  const style=document.createElement('style');
  style.id='v42-style';
  style.textContent=`
    .v41-version,.v41-version-drawer{display:none!important}
    .v42-version{font-size:9px;opacity:.55;text-align:center;padding:7px 8px 92px}
    .v42-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}
    .v38-ui .crew-card .trip-status{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;justify-self:end!important;min-height:28px!important;min-width:62px!important;padding:6px 10px!important;border-radius:999px!important;font-size:10px!important;font-weight:900!important;line-height:1.15!important;text-align:center!important;white-space:nowrap!important}
    @media(min-width:761px){.v42-version{padding-bottom:18px}}
  `;
  document.head.appendChild(style);

  function stamp(){
    const footer=$('.v38-footer')||$('.footer');
    if(footer){
      let d=$('.v42-version');
      if(!d){d=document.createElement('div');d.className='v42-version';footer.insertAdjacentElement('afterend',d)}
      d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
    }
    const actions=$('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){
      let d=$('.v42-version-drawer');
      if(!d){d=document.createElement('div');d.className='v42-version-drawer';actions.insertAdjacentElement('afterend',d)}
      d.textContent=`${VERSION} • ${UPDATED_AT}`;
    }
  }

  function patchPurchaseQueue(){
    if(typeof window.renderPurchaseQueue!=='function'||window.renderPurchaseQueue.__v42)return;
    window.renderPurchaseQueue=async function(){
      const box=$('#purchaseQueue'); if(!box) return;
      const items=DBLIVE?await TripDB.list('shopping_items',{order:'sort_order'}):[];
      const payerId=IS_ADMIN?($('#purchaseQueuePayer')?.value||CURRENT_MEMBER.id):CURRENT_MEMBER.id;
      const eligible=items.filter(x=>!x.purchased&&x.responsible_member_id===payerId);
      if($('#purchaseQueueCount')) $('#purchaseQueueCount').textContent=`${eligible.length} جاهزين للتسجيل`;
      box.innerHTML=eligible.length?eligible.map(x=>`
        <label class="purchase-queue-item">
          <input type="checkbox" class="purchase-item-check" value="${x.id}">
          <div><strong>${x.name}</strong><small>${x.planned_qty??'—'} ${x.unit||''}</small></div>
          <span>${foodResponsibleName(x.responsible_member_id)}</span>
        </label>`).join(''):`<div class="empty-finance">مفيش مشتريات معلّقة على الشخص ده حاليًا ✅</div>`;
      $$('.purchase-item-check').forEach(ch=>ch.onchange=updatePurchaseBatchButtonState);
      updatePurchaseBatchButtonState();
    };
    window.renderPurchaseQueue.__v42=true;
    if(route()==='expenses.html') window.renderPurchaseQueue().catch(console.warn);
  }

  function patchExpenseTabs(){
    if(route()!=='expenses.html')return;
    $$('.v38-expense-tab').forEach(btn=>{
      const current=btn.onclick;
      if(typeof current!=='function'||current.__v42)return;
      const original=current;
      const wrapped=async function(ev){
        if(tabBusy)return;
        tabBusy=true;
        $$('.v38-expense-tab').forEach(x=>x.disabled=true);
        try{await original.call(this,ev)}
        finally{
          tabBusy=false;
          $$('.v38-expense-tab').forEach(x=>x.disabled=false);
          patchExpenseTabs();
        }
      };
      wrapped.__v42=true;
      btn.onclick=wrapped;
    });
  }

  function patchCrew(){
    if(route()!=='crew.html')return;
    $$('#crewGrid .trip-status').forEach(x=>x.setAttribute('aria-label',x.textContent.trim()));
  }

  function run(){patchPurchaseQueue();patchExpenseTabs();patchCrew();stamp()}

  const observer=new MutationObserver(()=>setTimeout(run,0));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  const poll=setInterval(run,600);
  window.addEventListener('pagehide',()=>{clearInterval(poll);observer.disconnect()},{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
