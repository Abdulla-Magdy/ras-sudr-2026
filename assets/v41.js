(() => {
  if (window.__BAZ_V41__) return;
  window.__BAZ_V41__ = true;

  const VERSION='V41';
  const UPDATED_AT='24/09/2026 02:25';
  const FILTER_KEY='v38ShoppingFilter';
  const VALID=new Set(['all','unassigned','mine','done']);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  let filter=localStorage.getItem(FILTER_KEY)||'all';
  if(!VALID.has(filter)) filter='all';
  let syncing=false, queued=false, timer=null, observedFoodBody=null, refreshPatched=false;

  const style=document.createElement('style');
  style.id='v41-style';
  style.textContent=`
    .v41-quick-owner{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px}
    .v41-claim{min-height:34px!important;padding:7px 11px!important;border-radius:10px!important;font-size:9px!important;font-weight:900!important;background:rgba(103,227,220,.16)!important;border:1px solid rgba(103,227,220,.3)!important;color:#fff!important}
    .v41-claim:disabled{opacity:.45!important}
    .v41-version{font-size:9px;opacity:.55;text-align:center;padding:7px 8px 92px}
    .v41-version-drawer{font-size:9px;opacity:.5;text-align:center;padding:8px 8px 4px}
    .v38-version,.v38-version-drawer{display:none!important}
    @media(min-width:761px){.v41-version{padding-bottom:18px}}
  `;
  document.head.appendChild(style);

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const route=()=>location.pathname.split('/').pop()||'index.html';
  const me=()=>window.TripDB?.getMember?.()||null;

  function stamp(){
    $$('.v41-version,.v41-version-drawer').forEach(x=>x.remove());
    const footer=$('.v38-footer')||$('.footer');
    if(footer){
      const d=document.createElement('div');
      d.className='v41-version';
      d.innerHTML=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
      footer.insertAdjacentElement('afterend',d);
    }
    const actions=$('#mobileMenuDrawer .mobile-drawer-actions');
    if(actions){
      const d=document.createElement('div');
      d.className='v41-version-drawer';
      d.textContent=`${VERSION} • ${UPDATED_AT}`;
      actions.insertAdjacentElement('afterend',d);
    }
  }

  function schedule(delay=40){
    clearTimeout(timer);
    timer=setTimeout(()=>syncShopping().catch(e=>console.warn('[V41 shopping]',e)),delay);
  }

  function itemMap(rows){return new Map(rows.map(x=>[String(x.id),x]));}

  function setCardData(cards,rows){
    cards.forEach((card,i)=>{
      const x=rows[i]; if(!x)return;
      card.dataset.itemId=x.id;
      card.dataset.purchased=x.purchased?'1':'0';
      card.dataset.owner=x.responsible_member_id||'';
      card.dataset.unassigned=x.responsible_member_id?'0':'1';
    });
  }

  function applyFilter(rows){
    const member=me(); if(!member)return;
    const byId=itemMap(rows);
    const cards=$$('#foodBody .food-item-card');
    cards.forEach((card,i)=>{
      const x=byId.get(String(card.dataset.itemId||''))||rows[i];
      if(!x)return;
      let show=true;
      if(filter==='unassigned') show=!x.purchased&&!x.responsible_member_id;
      else if(filter==='mine') show=!x.purchased&&x.responsible_member_id===member.id;
      else if(filter==='done') show=!!x.purchased;
      card.style.display=show?'':'none';
    });
    $$('.v38-filter[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
  }

  function updateCounts(rows){
    const member=me(); if(!member)return;
    const counts={
      all:rows.length,
      unassigned:rows.filter(x=>!x.purchased&&!x.responsible_member_id).length,
      mine:rows.filter(x=>!x.purchased&&x.responsible_member_id===member.id).length,
      done:rows.filter(x=>x.purchased).length
    };
    $$('.v38-filter[data-filter]').forEach(b=>{
      const q=b.querySelector('b'); if(q)q.textContent=counts[b.dataset.filter]??0;
    });
    const summary=$('#shoppingSummary');
    if(summary) summary.innerHTML=`<strong>${counts.done.toLocaleString('ar-EG')} من ${counts.all.toLocaleString('ar-EG')} اتجابوا</strong><small>${counts.unassigned.toLocaleString('ar-EG')} لسه محتاجين حد ياخدهم</small>`;
  }

  function addQuickClaim(card,x){
    card.querySelector('.v41-quick-owner')?.remove();
    if(x.purchased||x.responsible_member_id)return;
    const wrap=document.createElement('div');
    wrap.className='v41-quick-owner';
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn v41-claim';
    btn.dataset.itemId=x.id;
    btn.textContent='🙋 أنا هجيب ده';
    wrap.appendChild(btn);
    const head=card.querySelector('.food-item-head');
    if(head)head.insertAdjacentElement('afterend',wrap);else card.prepend(wrap);
  }

  function clarifyManagement(card){
    const toggle=card.querySelector('.v38-item-toggle');
    if(toggle&&!card.classList.contains('v38-open'))toggle.textContent='⚙️ إدارة الصنف';
  }

  async function rowsNow(){
    if(!window.TripDB?.list||!me())return[];
    return TripDB.list('shopping_items',{order:'sort_order'});
  }

  async function syncShopping(){
    if(route()!=='shopping.html')return;
    const body=$('#foodBody'); if(!body||!me())return;
    if(syncing){queued=true;return;}
    syncing=true;
    try{
      const rows=await rowsNow();
      const cards=$$('#foodBody .food-item-card');
      setCardData(cards,rows);
      cards.forEach((card,i)=>{const x=rows[i];if(!x)return;addQuickClaim(card,x);clarifyManagement(card);});
      updateCounts(rows);
      applyFilter(rows);
    }finally{
      syncing=false;
      if(queued){queued=false;schedule(25);}
    }
  }

  async function claim(itemId,btn){
    if(!itemId||!window.TripDB?.claimFoodItem)return;
    btn.disabled=true;
    try{
      await TripDB.claimFoodItem(itemId);
      window.toast?.('بقيت مسؤول عن الصنف ✅');
      if(window.BazV38?.refreshCurrent) await window.BazV38.refreshCurrent('shopping_items');
      else if(typeof window.renderFood==='function') await window.renderFood();
      await syncShopping();
    }catch(e){
      const msg=String(e?.message||e||'');
      window.toast?.(msg.includes('ITEM_ALREADY_ASSIGNED')?'الصنف حد أخده قبلك':'حصلت مشكلة');
      await syncShopping();
    }
  }

  function bindFilterCapture(){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.v38-filter[data-filter]');
      if(!b||route()!=='shopping.html')return;
      const next=b.dataset.filter; if(!VALID.has(next))return;
      e.preventDefault();
      e.stopImmediatePropagation();
      filter=next;
      localStorage.setItem(FILTER_KEY,filter);
      $$('.v38-filter[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter===filter));
      syncShopping();
    },true);

    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.v41-claim');
      if(!b)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      claim(b.dataset.itemId,b);
    },true);
  }

  function patchRefresh(){
    if(refreshPatched||!window.BazV38?.refreshCurrent)return;
    const original=window.BazV38.refreshCurrent.bind(window.BazV38);
    window.BazV38.refreshCurrent=async(...args)=>{
      const r=await original(...args);
      if(route()==='shopping.html')await syncShopping();
      stamp();
      return r;
    };
    refreshPatched=true;
  }

  const observer=new MutationObserver(()=>schedule(55));
  function watchFoodBody(){
    const body=route()==='shopping.html'?$('#foodBody'):null;
    if(body===observedFoodBody)return;
    observer.disconnect();
    observedFoodBody=body;
    if(body)observer.observe(body,{childList:true});
    if(body)schedule(60);
  }

  bindFilterCapture();
  stamp();

  const poll=setInterval(()=>{
    patchRefresh();
    watchFoodBody();
    stamp();
  },350);

  window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{patchRefresh();watchFoodBody();schedule(120);stamp();},{once:true});
  else{patchRefresh();watchFoodBody();schedule(120);stamp();}
})();
