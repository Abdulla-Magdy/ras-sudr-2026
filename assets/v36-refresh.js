(() => {
  let timer=null, running=false, queued=false;
  const call=async name=>{const fn=window[name];if(typeof fn==='function'){try{return await fn()}catch(e){console.warn(`[V36 refresh] ${name}`,e)}}};
  async function run(){
    if(running){queued=true;return;}
    running=true;
    try{
      const init=[];
      if(document.getElementById('foodBody'))init.push('foodAddInit');
      if(document.getElementById('expenseList'))init.push('expenseInit');
      if(document.getElementById('ideasList'))init.push('ideasInit');
      if(document.getElementById('bagList'))init.push('privateBagInit');
      for(const n of init)await call(n);
      await Promise.allSettled([
        'renderHomeMeals','renderCrew','renderMeals','renderFood','renderResponsibilities',
        'renderFoodResponsibilities','renderExpenses','renderRecentChanges','renderAdminPanel','renderParticipantCount'
      ].map(call));
    }finally{
      running=false;
      if(queued){queued=false;setTimeout(run,40);}
    }
  }
  function refreshCurrent(){clearTimeout(timer);timer=setTimeout(run,80);}
  window.BazV36=Object.assign(window.BazV36||{},{refreshCurrent});
})();