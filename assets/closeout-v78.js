(() => {
  const $=s=>document.querySelector(s),page=location.pathname.split('/').pop()||'index.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=c=>new Intl.NumberFormat('ar-EG',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(c||0)/100)+' ج';
  let data=null,busy=false,nettings=[];
  function previewTransfers(people){
    const debt=people.filter(p=>p.net<0).map(p=>({...p,left:-p.net}));
    const credit=people.filter(p=>p.net>0).map(p=>({...p,left:p.net}));
    const result=[];let i=0,j=0;
    while(i<debt.length&&j<credit.length){const amount=Math.min(debt[i].left,credit[j].left);result.push({from_member_id:debt[i].id,to_member_id:credit[j].id,cents:amount,status:'draft'});debt[i].left-=amount;credit[j].left-=amount;if(!debt[i].left)i++;if(!credit[j].left)j++;}
    return result;
  }
  window.KenzCloseout={previewTransfers};
  const messages={NETTING_CHANGED:'الحساب الشخصي اتغير. اضغط تحديث وراجع الصافي قبل التحويل.',PENDING_EXPENSES:'فيه مصاريف معلقة لازم تتراجع الأول.',OPEN_LEFTOVERS:'لسه فيه بواقي مفتوحة للتوزيع. راجعها الأول.',NO_PARTICIPANTS:'لازم يكون فيه مشاركين مؤكدين.',UNCONFIRMED_TRANSFERS:'فيه تحويلات اتعلمت «حوّلت» ولسه المستلم ما أكدهاش. لازم يأكد الاستلام أو يختار «ما وصلنيش» الأول.',REASON_REQUIRED:'اكتب سبب واضح لإعادة الفتح.',TRIP_ACCOUNTS_CLOSED:'الحسابات مقفولة. الأدمن يقدر يعيد فتحها من ختام الرحلة.',INVALID_TRANSFER_ACTION:'حالة التحويل اتغيرت أو الإجراء مش متاح ليك. حدّث الصفحة.',ADMIN_REQUIRED:'الإجراء ده للأدمن فقط.'};
  async function act(name,args,button){if(busy)return;busy=true;if(button)button.disabled=true;try{data=await TripDB.rpc(name,args);nettings=await TripDB.rpc('my_trip_netting');render();window.toast?.('اتحفظ ✅');}catch(e){const text=String(e.message||e);$('#coError').textContent=Object.entries(messages).find(([k])=>text.includes(k))?.[1]||'تعذر الحفظ. راجع الاتصال وحاول تاني.';}finally{busy=false;if(button)button.disabled=false;}}
  function flows(){return data.status==='closed'?data.transfers.filter(t=>t.round_no===data.round&&t.status!=='void').map(t=>({...t,cents:Math.round(Number(t.amount)*100)})):previewTransfers(data.live.people);}
  function render(){
    if(!$('#closeoutApp'))return;
    const me=TripDB.getMember(),admin=TripDB.isAdmin(),closed=data.status==='closed';
    const s=closed?data.snapshot:data.live,people=s.people,names=Object.fromEntries(people.map(p=>[p.id,p.name]));
    const my=people.find(p=>p.id===me.id),transfers=flows(),mine=transfers.filter(t=>t.from_member_id===me.id||t.to_member_id===me.id);
    const outstanding=transfers.filter(t=>t.status!=='confirmed').length;
    $('#coStatus').textContent=closed?(outstanding?'الحسابات معتمدة • متابعة التحويلات':'الحسابات معتمدة • التصفية مكتملة ✅'):'الحساب مبدئي • لسه بنراجع';
    $('#coStatus').className='co-status '+(closed?'closed':'');
    $('#closeoutApp').innerHTML=`
      <div class="co-note">${closed?'🔒 مصاريف الرحلة والبواقي وقسمة المشاركين مقفولة. التحويلات هنا للتسجيل والمتابعة؛ الدفع بيتم بينكم خارج التطبيق.':'راجعوا مصاريفكم والبواقي قبل الاعتماد. اقتراحات التحويل ممكن تتغير لحد ما الأدمن يقفل الحسابات.'}</div>
      <div class="co-grid co-kpis"><div class="co-card"><span>المصاريف المعتمدة</span><strong>${money(s.total)}</strong></div><div class="co-card"><span>بواقي أخدها أفراد</span><strong>${money(s.allocated)}</strong></div><div class="co-card"><span>المبلغ المشترك بعد البواقي</span><strong>${money(s.shared)}</strong></div><div class="co-card"><span>المشاركون في القسمة</span><strong>${s.participants}</strong></div></div>
      ${!closed?`<div class="co-grid"><a class="co-card co-link" href="${admin?'admin-expenses.html':'expenses.html'}"><strong>🧾 ${data.pending} طلب معلّق</strong><span>${admin?'راجع واعتمد المصاريف':'كمّل مصاريفك وراجع طلباتك'}</span></a><a class="co-card co-link" href="leftovers.html"><strong>🧺 ${data.open_leftovers} صنف متبقي مفتوح</strong><span>سجل اللي فاض، وحدد مين أخده</span></a></div>`:''}
      <section class="co-card"><h2>حسابك يا ${esc(me.name)}</h2>${my?`<div class="co-grid"><div><span>دفعت للرحلة</span><strong>${money(my.paid)}</strong></div><div><span>نصيبك المشترك</span><strong>${money(my.share)}</strong></div><div><span>بواقي أخدتها</span><strong>${money(my.leftovers)}</strong></div><div><span>صافي المتبقي حاليًا</span><strong>${netLabel(data.live.people.find(p=>p.id===me.id)?.net||0)}</strong></div></div>`:'<p>إنت مش داخل القسمة.</p>'}<p class="co-muted">فرق القروش في القسمة بيتوزع بالتساوي قدر الإمكان؛ الإجماليات متطابقة لآخر قرش.</p><a href="personal-expenses.html">💸 حساباتك الشخصية بينك وبين أصحابك</a></section>
      <section class="co-card"><h2>${closed?'تحويلاتك':'اقتراح تحويلاتك — مبدئي'}</h2><div class="co-list">${mine.length?mine.map(t=>transferCard(t,names,me.id)).join(''):'<p>مفيش تحويلات مطلوبة منك أو ليك في الجولة الحالية.</p>'}</div></section>
      <details class="co-card"><summary>كشف حساب المجموعة (${people.length})</summary><div class="co-list">${people.map(p=>`<article class="co-person"><strong>${esc(p.name)} ${p.included?'':'• خارج القسمة'}</strong><span>دفع ${money(p.paid)} • نصيبه ${money(p.share)} • بواقي ${money(p.leftovers)}</span><span>${netLabel(data.live.people.find(x=>x.id===p.id)?.net||0)}</span></article>`).join('')}</div></details>
      <details class="co-card"><summary>كل تحويلات الرحلة</summary><div class="co-list">${transfers.map(t=>transferCard(t,names,null)).join('')||'<p>الحسابات متساوية.</p>'}</div></details>
      ${data.transfers.some(t=>t.status==='confirmed')?`<details class="co-card"><summary>سجل التحويلات المستلمة</summary><div class="co-list">${data.transfers.filter(t=>t.status==='confirmed').map(t=>`<div class="co-person"><strong>${esc(names[t.from_member_id])} ← ${esc(names[t.to_member_id])}</strong><span>${money(Math.round(Number(t.amount)*100))} • استلام مؤكد • جولة ${t.round_no}</span></div>`).join('')}</div></details>`:''}
      ${admin?`<section class="co-card co-admin"><h2>👑 اعتماد الحسابات</h2>${closed?`<p>إعادة الفتح هتلغي التحويلات اللي لسه ما اتدفعتش. التحويلات المستلمة بتفضل محفوظة وتدخل في القسمة الجديدة.</p><label>سبب إعادة الفتح<input id="coReason" maxlength="300" placeholder="مثال: مصروف اتنسى"></label><button id="coReopen" class="btn secondary">إعادة فتح الحسابات</button>`:`<label class="co-check"><input type="checkbox" id="coReviewed">راجعت المصاريف مع الشباب وحصرت البواقي، بما فيها الأصناف القديمة غير المسعّرة.</label><p class="co-muted">الأصناف اللي ما اشتريناهاش مش بتدخل القسمة. ممكن نسجلها في «للرحلة الجاية».</p><button id="coClose" class="btn" ${data.pending||data.open_leftovers?'disabled':''}>اعتماد التصفية وقفل الحسابات</button>`}</section>`:''}
      <a class="co-card co-link" href="next-trip.html"><strong>📝 للرحلة الجاية</strong><span>نسينا إيه؟ نغيّر الكمية لإيه؟ ونجيبه من القاهرة ولا رأس سدر؟</span></a>
      <div id="coError" class="co-error" role="alert"></div>`;
    $('#coClose')?.addEventListener('click',e=>{if(!$('#coReviewed').checked){$('#coError').textContent='أكد مراجعة المصاريف والبواقي الأول.';return;}if(confirm('تعتمد الأرقام الحالية وتقفل مصاريف الرحلة والبواقي؟'))act('close_trip_accounts',{p_reviewed:true},e.target);});
    $('#coReopen')?.addEventListener('click',e=>{const reason=$('#coReason').value.trim();if(reason.length<3){$('#coError').textContent='اكتب سبب إعادة الفتح الأول.';return;}if(confirm('تعيد فتح الحسابات للمراجعة؟'))act('reopen_trip_accounts',{p_reason:reason},e.target);});
    document.querySelectorAll('[data-transfer]').forEach(b=>b.onclick=()=>{
      const n=nettings.find(x=>x.transfer_id===b.dataset.transfer),action=b.dataset.action;
      const prompt=action==='submit'?(n.net>0?'تأكد إنك حولت الصافي الموضح بعد المقاصة فعلاً؟':'تبعت طلب المقاصة بالتفاصيل دي للطرف التاني؟'):action==='reverse_sent'?'توافق على المقاصة وتأكد إنك حولت الفرق فعلاً؟':action==='confirm'?(n?.net===0?'توافق على المقاصة وإقفال المبالغ الشخصية الموضحة؟':'تأكد إن الصافي الموضح وصلك فعلاً وتوافق على تفاصيل المقاصة؟'):'ترجع التسوية للمراجعة؟ المبالغ الشخصية هترجع مفتوحة.';
      if(confirm(prompt))action==='submit'?act('submit_trip_netting',{p_id:b.dataset.transfer,p_expected:n},b):act('trip_transfer_action',{p_id:b.dataset.transfer,p_action:action},b);
    });
  }
  function netLabel(n){return n>0?'ليك '+money(n):n<0?'عليك '+money(-n):'خالص ✅';}
  function transferCard(t,names,me){
    const labels={draft:'مبدئي',pending:'في انتظار التحويل',sent:'في انتظار اتفاق الطرفين وتأكيد الاستلام',confirmed:'التسوية مكتملة ✅'};
    const n=me?nettings.find(x=>x.transfer_id===t.id):null;
    const btn=(action,label)=>`<button class="btn ${action==='not_received'?'secondary':''}" data-transfer="${t.id}" data-action="${action}">${label}</button>`;
    let controls='',detail='';
    if(n){
      const cashFrom=n.net>=0?t.from_member_id:t.to_member_id,cashTo=n.net>=0?t.to_member_id:t.from_member_id;
      detail=`<div class="co-netting"><strong>🔒 المقاصة دي بينكم إنتوا الاتنين بس</strong><p>مستحق الرحلة: ${money(n.trip_cents)}<br>− حق ${esc(names[t.from_member_id])} الشخصي: ${money(n.subtract)}<br>+ حق ${esc(names[t.to_member_id])} الشخصي: ${money(n.add)}</p>${n.items.map(i=>`<div>${i.direction==='subtract'?'−':'+'} ${money(i.cents)} — ${esc(i.description)}</div>`).join('')}<p><b>${n.net===0?'الصافي صفر — مقاصة بدون تحويل':`${esc(names[cashFrom])} يحوّل لـ ${esc(names[cashTo])}: ${money(Math.abs(n.net))}`}</b></p><small>المبالغ المتنازع عليها مش داخلة في المقاصة. التفاصيل بتتقفل بعد تأكيد الطرف التاني.</small></div>`;
      if(t.status==='pending'&&me===t.from_member_id)controls=btn('submit',n.net>0?'حوّلت الصافي':n.net===0?'طلب تأكيد المقاصة':'طلب المقاصة وتحويل الفرق');
      if(t.status==='sent'){
        if(n.net>=0&&me===t.to_member_id)controls=btn('confirm',n.net===0?'أوافق على المقاصة':'استلمت الصافي وأوافق')+btn('not_received','فيه مشكلة / ما وصلنيش');
        if(n.net<0&&!n.reverse_sent_at&&me===t.to_member_id)controls=btn('reverse_sent','أوافق وحوّلت الفرق')+btn('not_received','فيه مشكلة');
        if(n.net<0&&n.reverse_sent_at&&me===t.from_member_id)controls=btn('confirm','استلمت الفرق ✅')+btn('not_received','الفرق ما وصلنيش');
      }
    }
    return `<article class="co-transfer"><div><strong>${esc(names[t.from_member_id])} مستحق عليه لـ ${esc(names[t.to_member_id])}</strong><span>${labels[t.status]}</span></div><b>${money(t.cents)}</b>${detail}${controls}</article>`;
  }
  async function load(){if(busy)return;try{[data,nettings]=await Promise.all([TripDB.rpc('trip_closeout_dashboard'),TripDB.rpc('my_trip_netting')]);render();decorate();}catch(e){const error=$('#coError');if(error)error.textContent='تعذر تحميل الحسابات. اتأكد من الإنترنت واضغط تحديث.';}}
  function decorate(){
    if(!data)return;
    const closed=data.status==='closed';
    document.body.classList.toggle('co-finance-closed',closed);
    const host=$('#appMain');
    if(host&&page!=='closeout.html'&&!$('#coGlobalLink')){const a=document.createElement('a');a.id='coGlobalLink';a.className='co-global';a.href='closeout.html';host.prepend(a);}
    if($('#coGlobalLink'))$('#coGlobalLink').textContent=closed?'🔒 الحسابات معتمدة — تابع التحويلات من ختام الرحلة':'🏁 ختام الرحلة — راجع حسابك والبواقي والتصفية';
  }
  async function start(){for(let i=0;i<120&&!window.TripDB?.isBound?.();i++)await new Promise(r=>setTimeout(r,100));if(!window.TripDB?.isBound?.())return;await load();if(page==='closeout.html'){$('#coRefresh')?.addEventListener('click',load);}else setInterval(decorate,2000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&window.TripDB?.isBound?.())load();});
})();
