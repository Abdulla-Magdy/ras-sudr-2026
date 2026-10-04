(() => {
  if(window.__KENZ_SHOPPING_PRICES_V62__)return;
  window.__KENZ_SHOPPING_PRICES_V62__=true;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const money=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0))+' ج';
  let items=[],links=[];
  function style(){if($('#sp62Style'))return;const s=document.createElement('style');s.id='sp62Style';s.textContent=`.sp62-price{margin-top:8px;padding:8px 10px;border-radius:11px;background:rgba(103,227,220,.08);border:1px solid rgba(103,227,220,.18);font-size:9px;line-height:1.6}.sp62-price strong{font-size:11px;color:#fff}.sp62-price.unpriced{background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.08);color:var(--muted,#9fb0bb)}.sp62-price .sum{display:block;margin-top:2px;font-weight:1000;color:#fff}`;document.head.appendChild(s)}
  function norm(v){return String(v||'').trim().replace(/\s+/g,' ')}
  function info(itemId){const rows=links.filter(x=>x.shopping_item_id===itemId);const priced=rows.filter(x=>Number(x.quantity)>0&&Number(x.unit_price)>0&&Number(x.line_total)>0);if(!rows.length||!priced.length)return {priced:false};const qty=priced.reduce((s,x)=>s+Number(x.quantity),0),total=priced.reduce((s,x)=>s+Number(x.line_total),0);return {priced:true,qty,total,avg:qty?total/qty:0,partial:priced.length<rows.length}}
  function decorate(){
    const cards=$$('.food-item-card');if(!cards.length)return;
    const byName=Object.fromEntries(items.map(x=>[norm(x.name),x]));
    cards.forEach(card=>{
      const name=norm(card.querySelector('.food-item-name')?.textContent);const item=byName[name];if(!item||!item.purchased)return;
      card.querySelector('.sp62-price')?.remove();const d=document.createElement('div');const p=info(item.id);const unit=item.unit||'وحدة';
      if(p.priced){d.className='sp62-price';d.innerHTML=`سعر الشراء${p.partial?' <span style="color:#f1d58f">• يوجد جزء قديم غير مفصل</span>':''}<span class="sum">${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(p.qty)} ${unit} × ${money(p.avg)} = ${money(p.total)}</span>`}
      else{d.className='sp62-price unpriced';d.textContent='سعر الشراء: غير متاح — فاتورة قديمة بدون تسعير تفصيلي'}
      const meta=card.querySelector('.food-item-meta');(meta||card.querySelector('.food-item-head'))?.insertAdjacentElement('afterend',d);
    });
  }
  async function load(){if(!window.TripDB?.isBound?.())return;try{[items,links]=await Promise.all([TripDB.list('shopping_items',{order:'sort_order'}),TripDB.list('expense_shopping_items')]);decorate()}catch(e){console.warn('[V62 shopping prices]',e)}}
  async function start(){style();for(let i=0;i<120&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,80));await load();const body=$('#foodBody');if(body){new MutationObserver(()=>setTimeout(decorate,20)).observe(body,{childList:true,subtree:true})}setInterval(()=>{decorate()},700);setInterval(load,10000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();window.addEventListener('pageshow',load);
})();