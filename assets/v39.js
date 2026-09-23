(() => {
  if(window.__BAZ_V39__)return;
  window.__BAZ_V39__=true;
  const VERSION='V40', UPDATED_AT='24/09/2026 01:22';

  // app.js defines loadCore before DOMContentLoaded. Replace only that helper so
  // members + categories are fetched together instead of one network round-trip
  // after the other. All existing rendering/business logic stays untouched.
  if(typeof window.loadCore==='function'){
    window.loadCore=async function(){
      if(DBLIVE){
        const [members,categories]=await Promise.all([
          TripDB.list('members',{order:'sort_order'}),
          TripDB.list('categories',{order:'sort_order'})
        ]);
        MEMBERS=members;
        CATEGORIES=categories;
      }else{
        MEMBERS=FALLBACK_DATA.crew.map((x,i)=>({id:String(i+1),name:x[0],role:x[1],joke:x[2],confirmed:true}));
        CATEGORIES=FALLBACK_DATA.categories.map((n,i)=>({id:String(i+1),name:n}));
      }
    };
  }

  function stamp(){
    document.querySelectorAll('.v38-version').forEach(el=>{
      const next=`<strong>${VERSION}</strong> • آخر تحديث ${UPDATED_AT}`;
      if(el.innerHTML!==next)el.innerHTML=next;
    });
    document.querySelectorAll('.v38-version-drawer').forEach(el=>{
      const next=`${VERSION} • ${UPDATED_AT}`;
      if(el.textContent!==next)el.textContent=next;
    });
  }

  function observe(){
    stamp();
    const targets=[...document.querySelectorAll('.v38-version,.v38-version-drawer')];
    targets.forEach(el=>new MutationObserver(stamp).observe(el,{childList:true,subtree:true,characterData:true}));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});
  else observe();

  window.addEventListener('load',()=>{
    try{console.info(`[V40] first load ${Math.round(performance.now())}ms`)}catch(_){}
  },{once:true});
})();