(() => {
  if (window.__KENZ_SHOPPING_PRICES_V61__) return;
  window.__KENZ_SHOPPING_PRICES_V61__ = true;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const money = v => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(Number(v||0)) + ' ج';
  let items=[];
  let links=[];
  let decorating=false;

  function style(){
    if($('#sp61Style')) return;
    const s=document.createElement('style');
    s.id='sp61Style';
    s.textContent=`
      .sp61-price{margin-top:9px;padding:9px 10px;border-radius:11px;background:rgba(103,227,220,.075);border:1px solid rgba(103,227,220,.14);display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:9px}
      .sp61-price .label{color:var(--muted,#9fb0bb)}
      .sp61-price strong{font-size:11px;color:#fff}
      .sp61-price.unpriced{background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.08)}
      .sp61-price.unpriced strong{font-size:9px;color:var(--muted,#9fb0bb)}
      .sp61-warning{display:block;margin-top:3px;font-size:8px;color:#f1d58f}
    `;
    document.head.appendChild(s);
  }

  function priceInfo(itemId){
    const rows=links.filter(x=>x.shopping_item_id===itemId);
    if(!rows.length) return {priced:false,hasLink:false};
    const priced=rows.filter(x=>Number(x.quantity)>0 && Number(x.unit_price)>0 && Number(x.line_total)>0);
    if(!priced.length) return {priced:false,hasLink:true};
    const qty=priced.reduce((s,x)=>s+Number(x.quantity||0),0);
    const total=priced.reduce((s,x)=>s+Number(x.line_total||0),0);
    const avg=qty>0?total/qty:0;
    return {priced:true,qty,total,avg,hasUnpriced:priced.length<rows.length};
  }

  function decorate(){
    if(decorating) return;
    const body=$('#foodBody');
    if(!body || !items.length) return;
    decorating=true;
    try{
      const cards=$$('.food-item-card');
      cards.forEach((card,i)=>{
        const item=items[i];
        if(!item) return;
        card.dataset.shoppingItemId=item.id;
        card.querySelector('.sp61-price')?.remove();
        if(!item.purchased) return;
        const info=priceInfo(item.id);
        const d=document.createElement('div');
        if(info.priced){
          d.className='sp61-price';
          const unit=item.unit||'وحدة';
          d.innerHTML=`<div><span class="label">سعر الشراء</span>${info.hasUnpriced?'<span class="sp61-warning">فيه شراء قديم للصنف بدون تسعير تفصيلي</span>':''}</div><strong>${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(info.qty)} ${unit} × ${money(info.avg)} = ${money(info.total)}</strong>`;
        }else{
          d.className='sp61-price unpriced';
          d.innerHTML='<span class="label">سعر الشراء</span><strong>غير متاح — فاتورة قديمة بدون تسعير تفصيلي</strong>';
        }
        const head=card.querySelector('.food-item-head');
        head?.insertAdjacentElement('afterend',d);
      });
    } finally { decorating=false; }
  }

  async function load(){
    if(!window.TripDB?.isBound?.()) return;
    try{
      [items,links]=await Promise.all([
        window.TripDB.list('shopping_items',{order:'sort_order'}),
        window.TripDB.list('expense_shopping_items')
      ]);
      decorate();
    }catch(e){ console.warn('[shopping prices]',e); }
  }

  async function start(){
    style();
    for(let i=0;i<120&&!window.TripDB?.isBound?.();i++) await new Promise(r=>setTimeout(r,80));
    await load();
    const body=$('#foodBody');
    if(body){
      const mo=new MutationObserver(()=>setTimeout(decorate,0));
      mo.observe(body,{childList:true});
    }
    try{window.TripDB?.subscribe?.('expenses',()=>load())}catch(_){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('pageshow',()=>load());
})();
