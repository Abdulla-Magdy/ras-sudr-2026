(() => {
  const ua=navigator.userAgent||'';
  const isMobile=/Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(navigator.maxTouchPoints>1&&/Macintosh/i.test(ua));
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const pathname=location.pathname.toLowerCase();
  const file=pathname.split('/').pop()||'';
  const page=(file||'index.html').replace('.html','');
  const onLogin=page==='login';
  const gateLanding=onLogin||pathname.endsWith('/');

  window.BAZ_PWA_GATE={isMobile,isStandalone};

  if(isMobile&&!isStandalone&&!gateLanding){
    const base=location.pathname.replace(/[^/]*$/,'');
    location.replace(base+'login.html?install=1');
    return;
  }

  // db.js assigns window.TripDB later. Wrap subscribe at assignment time so the
  // legacy app's realtime callback no longer forces location.reload() under V36.
  if(!Object.prototype.hasOwnProperty.call(window,'TripDB')){
    let tripDbValue;
    Object.defineProperty(window,'TripDB',{
      configurable:true,
      enumerable:true,
      get(){return tripDbValue;},
      set(v){
        tripDbValue=v;
        if(v&&typeof v.subscribe==='function'&&!v.__v36SubscribeWrapped){
          const original=v.subscribe.bind(v);
          v.subscribe=(table,cb)=>original(table,(...args)=>{
            if(window.BazV36?.refreshCurrent){window.BazV36.refreshCurrent(table);return;}
            return typeof cb==='function'?cb(...args):undefined;
          });
          v.__v36SubscribeWrapped=true;
        }
        Object.defineProperty(window,'TripDB',{value:v,writable:true,configurable:true,enumerable:true});
      }
    });
  }

  const root=document.documentElement;
  root.classList.toggle('mobile-browser-gated',isMobile&&!isStandalone);
  root.classList.toggle('installed-pwa',isStandalone);

  if(!onLogin){
    root.classList.add('baz-cold-start');
    const style=document.createElement('style');
    style.id='baz-cold-start-style';
    style.textContent=`
      html.baz-cold-start{background:#071822!important}
      html.baz-cold-start body{visibility:hidden!important;background:#071822!important}
      html.baz-ui-ready body{visibility:visible!important}
    `;
    document.head.appendChild(style);

    let revealed=false;
    const reveal=()=>{
      if(revealed)return;revealed=true;
      root.classList.remove('baz-cold-start');
      root.classList.add('baz-ui-ready');
      setTimeout(()=>document.getElementById('baz-cold-start-style')?.remove(),120);
    };
    window.BAZ_COLD_START_REVEAL=reveal;
    window.BAZ_UI_BOOT={reveal};
    setTimeout(reveal,4500);
  }
})();