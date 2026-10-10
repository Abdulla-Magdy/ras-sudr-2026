window.__KENZ_PERSONAL_EXPENSES_V69__=true;

(()=>{
  const $=s=>document.querySelector(s);
  let me=null,trip=null,members=[],sharedExpenses=[],personalExpenses=[],comments=[],closeout=null,nettings=[],offsetStates=[];

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const money=v=>new Intl.NumberFormat("ar-EG",{minimumFractionDigits:Number.isInteger(Number(v||0))?0:2,maximumFractionDigits:2}).format(Number(v||0))+" ج";
  const memberName=id=>members.find(m=>m.id===id)?.name||"—";
  const say=t=>window.toast?window.toast(t):alert(t);
  const dateLabel=v=>new Date(v).toLocaleString("ar-EG",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});

  async function waitForCore(){
    for(let i=0;i<80;i++){
      if(window.TripDB?.getMember?.() && window.TripDB?.getTrip?.()) return;
      await sleep(50);
    }
    const r=await window.TripDB.init();
    if(!r?.bound) throw new Error("MEMBER_LOGIN_REQUIRED");
  }

  async function loadData(){
    await waitForCore();
    me=TripDB.getMember();
    trip=TripDB.getTrip();
    const result=await Promise.all([
      TripDB.list("members",{order:"sort_order"}),
      TripDB.list("expenses",{order:"created_at",asc:false}),
      TripDB.list("personal_expenses",{order:"created_at",asc:false}),
      TripDB.list("personal_expense_comments",{order:"created_at",asc:true})
    ]);
    [members,sharedExpenses,personalExpenses,comments]=result;
    [closeout,nettings,offsetStates]=await Promise.all([TripDB.rpc('trip_closeout_dashboard'),TripDB.rpc('my_trip_netting'),TripDB.rpc('my_personal_offset_states')]);
  }

  function buildTransfers(people){
    const eps=.005;
    const creditors=people.filter(p=>p.net>eps).map(p=>({...p,remaining:p.net}));
    const debtors=people.filter(p=>p.net<-eps).map(p=>({...p,remaining:Math.abs(p.net)}));
    const out=[];
    let c=0,d=0;
    while(c<creditors.length&&d<debtors.length){
      const amount=Math.min(creditors[c].remaining,debtors[d].remaining);
      if(amount>eps){
        out.push({from:debtors[d],to:creditors[c],amount});
        creditors[c].remaining-=amount;
        debtors[d].remaining-=amount;
      }
      if(creditors[c].remaining<=eps)c++;
      if(debtors[d].remaining<=eps)d++;
    }
    return out;
  }

  function sharedSettlement(){
    let transfers;
    if(closeout.status==='closed'){
      transfers=closeout.transfers.filter(t=>t.round_no===closeout.round&&t.status!=='confirmed').map(t=>{
        const n=nettings.find(x=>x.transfer_id===t.id);const amount=n?Number(n.net)/100:Number(t.amount);
        return {from:{id:amount>=0?t.from_member_id:t.to_member_id},to:{id:amount>=0?t.to_member_id:t.from_member_id},amount:Math.abs(amount),label:n?.items.length?'الرحلة بعد المقاصة الشخصية — التفاصيل في ختام الرحلة':'مصاريف الرحلة'};
      });
    }else transfers=buildTransfers(closeout.live.people.map(p=>({...p,net:p.net/100})));
    return {
      pay:transfers.filter(x=>x.from.id===me.id&&x.amount>0).map(x=>({counterpartId:x.to.id,counterpartName:memberName(x.to.id),amount:x.amount,label:x.label||'مصاريف الرحلة — مبدئي',kind:'trip'})),
      receive:transfers.filter(x=>x.to.id===me.id&&x.amount>0).map(x=>({counterpartId:x.from.id,counterpartName:memberName(x.from.id),amount:x.amount,label:x.label||'مصاريف الرحلة — مبدئي',kind:'trip'}))
    };
  }

  function personalSettlement(){
    const covered=new Set(offsetStates.map(s=>s.expense_id));
    if(closeout.status==='closed')nettings.forEach(n=>n.items.forEach(i=>covered.add(i.id)));
    const active=personalExpenses.filter(x=>x.status==="active"&&!covered.has(x.id));
    return {
      pay:active.filter(x=>x.beneficiary_member_id===me.id).map(x=>({counterpartId:x.payer_member_id,counterpartName:memberName(x.payer_member_id),amount:Number(x.amount||0),label:x.description,kind:"personal",expenseId:x.id})),
      receive:active.filter(x=>x.payer_member_id===me.id).map(x=>({counterpartId:x.beneficiary_member_id,counterpartName:memberName(x.beneficiary_member_id),amount:Number(x.amount||0),label:x.description,kind:"personal",expenseId:x.id}))
    };
  }

  function groupFlows(...sets){
    const map=new Map();
    sets.flat().forEach(x=>{
      const key=x.counterpartId;
      if(!map.has(key)) map.set(key,{counterpartId:key,counterpartName:x.counterpartName,total:0,items:[]});
      const g=map.get(key);
      g.total+=Number(x.amount||0);
      g.items.push(x);
    });
    return [...map.values()].sort((a,b)=>b.total-a.total);
  }

  function renderFlowList(target,groups,direction){
    const box=$(target);if(!box)return;
    if(!groups.length){
      box.innerHTML=`<div class="pe-empty">${direction==="pay"?"مفيش تحويلات مطلوبة منك حاليًا ✅":"مفيش مبالغ مستحقة ليك حاليًا."}</div>`;
      return;
    }
    box.innerHTML=groups.map(g=>`
      <article class="pe-flow">
        <div class="pe-flow-head">
          <strong>${direction==="pay"?"هتحول لـ":"هتستلم من"} ${esc(g.counterpartName)}</strong>
          <span class="pe-flow-total">${money(g.total)}</span>
        </div>
        <div class="pe-breakdown">
          ${g.items.map(i=>`<div class="pe-breakdown-row">
            <div class="pe-breakdown-label"><span class="pe-kind ${i.kind}">${i.kind==="trip"?"رحلة":"شخصي"}</span><span>${esc(i.label)}</span></div>
            <strong>${money(i.amount)}</strong>
          </div>`).join("")}
        </div>
      </article>`).join("");
  }

  function renderSettlement(){
    const shared=sharedSettlement();
    const personal=personalSettlement();
    const allPay=groupFlows(shared.pay,personal.pay),allReceive=groupFlows(shared.receive,personal.receive);
    const ids=new Set([...allPay,...allReceive].map(x=>x.counterpartId));const payGroups=[],receiveGroups=[];
    ids.forEach(id=>{const p=allPay.find(x=>x.counterpartId===id),r=allReceive.find(x=>x.counterpartId===id),net=Math.round(((p?.total||0)-(r?.total||0))*100)/100;
      if(net===0)return;const group={counterpartId:id,counterpartName:memberName(id),total:Math.abs(net),items:net>0?[...(p?.items||[]),...(r?.items||[]).map(i=>({...i,amount:-i.amount,label:'خصم: '+i.label}))]:[...(r?.items||[]),...(p?.items||[]).map(i=>({...i,amount:-i.amount,label:'خصم: '+i.label}))]};(net>0?payGroups:receiveGroups).push(group);
    });
    const tripPay=shared.pay.reduce((s,x)=>s+x.amount,0);
    const personalPay=personal.pay.reduce((s,x)=>s+x.amount,0);
    const totalPay=payGroups.reduce((s,x)=>s+x.total,0);
    const totalReceive=receiveGroups.reduce((s,x)=>s+x.total,0);
    if($("#peTripDue")) $("#peTripDue").textContent=money(tripPay);
    if($("#pePersonalDue")) $("#pePersonalDue").textContent=money(personalPay);
    if($("#peTotalDue")) $("#peTotalDue").textContent=money(totalPay);
    if($("#peReceive")) $("#peReceive").textContent=money(totalReceive);
    renderFlowList("#pePayList",payGroups,"pay");
    renderFlowList("#peReceiveList",receiveGroups,"receive");
    const disputed=personalExpenses.filter(x=>x.status==="disputed");
    const banner=$("#peDisputedBanner");
    if(banner){
      banner.classList.toggle("show",disputed.length>0);
      banner.innerHTML=disputed.length?`⚠️ عندك <strong>${disputed.length}</strong> ${disputed.length===1?"معاملة عليها مشكلة":"معاملات عليها مشكلة"}. المبالغ دي موقوفة من التسوية لحد ما تتصحح.`:"";
    }
  }

  function txComments(expenseId){return comments.filter(c=>c.expense_id===expenseId)}

  function transactionCard(x){
    const offset=offsetStates.find(o=>o.expense_id===x.id);
    if(offset)return `<article class="pe-transaction"><div class="pe-tx-head"><strong>${esc(x.description)}</strong><strong>${money(x.amount)}</strong></div><p>${offset.status==='settled'?'✅ اتسوّت بالمقاصة ومش مطلوبة تاني':'⏳ داخلة في مقاصة منتظرة تأكيد الطرف التاني'}</p><a href="closeout.html">راجع التفاصيل في ختام الرحلة</a></article>`;
    const mine=x.payer_member_id===me.id;
    const otherId=mine?x.beneficiary_member_id:x.payer_member_id;
    const other=memberName(otherId);
    const thread=txComments(x.id);
    const disputed=x.status==="disputed";
    const focus=new URLSearchParams(location.search).get("expense")===x.id;
    return `<article id="pe-${x.id}" class="pe-transaction ${disputed?"disputed":""} ${focus?"highlight":""}" data-id="${x.id}">
      <div class="pe-tx-head">
        <div class="pe-tx-title">
          <span class="pe-status ${disputed?"disputed":""}">${disputed?"⚠️ عليها مشكلة":"✓ شغالة في الحساب"}</span>
          <strong>${esc(x.description)}</strong>
          <small>${mine?`إنت دفعت لـ ${esc(other)}`:`${esc(other)} دفع لك`}</small>
        </div>
        <div class="pe-tx-amount">${money(x.amount)}</div>
      </div>
      <div class="pe-tx-meta"><span>${dateLabel(x.created_at)}</span><span>🔒 بينك وبين ${esc(other)} بس</span></div>
      ${disputed?'<div class="pe-note-stop">المبلغ ده متوقف من التسوية الشخصية لحد ما المشكلة تتحل.</div>':""}
      <div class="pe-tx-actions">
        ${mine?`<button class="btn secondary" data-action="toggle-edit" data-id="${x.id}">✏️ تعديل</button>${disputed?`<button class="btn" data-action="resolve" data-id="${x.id}">✓ حل المشكلة</button>`:""}<button class="btn danger" data-action="delete" data-id="${x.id}">حذف</button>`:(!disputed?`<button class="btn secondary" data-action="toggle-dispute" data-id="${x.id}">⚠️ فيه مشكلة</button>`:"")}
      </div>
      ${mine?`<div id="edit-${x.id}" class="pe-inline-box"><div class="pe-inline-grid"><label class="mini-field"><span>الحاجة</span><input class="text-input" data-edit-desc="${x.id}" value="${esc(x.description)}"></label><label class="mini-field"><span>المبلغ</span><input class="amount-input" type="number" inputmode="decimal" min="0.01" step="0.01" data-edit-amount="${x.id}" value="${Number(x.amount)}"></label><button class="btn" data-action="save-edit" data-id="${x.id}">حفظ التعديل</button></div></div>`:""}
      ${!mine?`<div id="dispute-${x.id}" class="pe-inline-box"><label class="mini-field"><span>إيه المشكلة؟</span><textarea class="textarea" data-dispute-text="${x.id}" placeholder="مثال: المبلغ المفروض 200 مش 2000"></textarea></label><button class="btn" style="margin-top:8px" data-action="submit-dispute" data-id="${x.id}">إرسال الملاحظة</button></div>`:""}
      <details class="pe-thread" ${thread.some(c=>c.is_dispute)?"open":""}>
        <summary>💬 التعليقات (${thread.length})</summary>
        <div class="pe-comments">
          ${thread.length?thread.map(c=>`<div class="pe-comment ${c.author_member_id===me.id?"mine":""} ${c.is_dispute?"dispute":""}"><div class="pe-comment-head"><span>${esc(memberName(c.author_member_id))}${c.is_dispute?" • اعتراض":""}</span><span>${dateLabel(c.created_at)}</span></div><div>${esc(c.body)}</div></div>`).join(""):'<div class="pe-empty">مفيش تعليقات لسه.</div>'}
        </div>
        <div class="pe-comment-form"><input class="text-input" data-comment-input="${x.id}" maxlength="500" placeholder="اكتب تعليق بينك وبينه..."><button class="btn secondary" data-action="comment" data-id="${x.id}">إرسال</button></div>
      </details>
    </article>`;
  }

  function renderTransactions(){
    const box=$("#peTransactions");if(!box)return;
    box.innerHTML=personalExpenses.length?personalExpenses.map(transactionCard).join(""):'<div class="pe-empty">لسه مفيش مصاريف شخصية بينك وبين حد.</div>';
    const focusId=new URLSearchParams(location.search).get("expense");
    if(focusId) setTimeout(()=>document.getElementById(`pe-${focusId}`)?.scrollIntoView({behavior:"smooth",block:"center"}),120);
  }

  function renderMemberOptions(){
    const select=$("#peBeneficiary");if(!select)return;
    const choices=members.filter(m=>m.id!==me.id&&m.confirmed!==false);
    select.innerHTML=choices.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("");
    $("#peAdd")?.toggleAttribute("disabled",choices.length===0);
  }

  async function refresh(){
    await loadData();
    renderMemberOptions();
    renderSettlement();
    renderTransactions();
    if($("#peOwnerLabel")) $("#peOwnerLabel").textContent=`حساب ${me.name} الشخصي`;
  }

  async function addExpense(){
    const beneficiary=$("#peBeneficiary")?.value;
    const description=$("#peDescription")?.value.trim();
    const amount=Number($("#peAmount")?.value||0);
    if(!beneficiary){say("اختار دفعت لمين");return}
    if(!description){say("اكتب الحاجة اللي دفعت فيها");return}
    if(!(amount>0)){say("راجع المبلغ");return}
    const btn=$("#peAdd");btn.disabled=true;
    try{
      await TripDB.insert("personal_expenses",{trip_id:trip.id,payer_member_id:me.id,beneficiary_member_id:beneficiary,description,amount,status:"active"});
      $("#peDescription").value="";$("#peAmount").value="";
      say("اتسجلت بينكم بس ✅");
      await refresh();
    }catch(e){console.error(e);say("حصلت مشكلة في التسجيل")}
    finally{btn.disabled=false}
  }

  async function addComment(expenseId,body,isDispute=false){
    const text=String(body||"").trim();
    if(!text){say(isDispute?"اكتب المشكلة الأول":"اكتب تعليق الأول");return false}
    await TripDB.insert("personal_expense_comments",{expense_id:expenseId,author_member_id:me.id,body:text,is_dispute:!!isDispute});
    return true;
  }

  function bindActions(){
    $("#peAdd").onclick=addExpense;
    $("#peTransactions").addEventListener("click",async ev=>{
      const btn=ev.target.closest("button[data-action]");if(!btn)return;
      const id=btn.dataset.id,action=btn.dataset.action;
      const x=personalExpenses.find(p=>p.id===id);if(!x)return;
      try{
        if(action==="toggle-edit"){document.getElementById(`edit-${id}`)?.classList.toggle("show");return}
        if(action==="toggle-dispute"){document.getElementById(`dispute-${id}`)?.classList.toggle("show");return}
        if(action==="save-edit"){
          const description=document.querySelector(`[data-edit-desc="${id}"]`)?.value.trim();
          const amount=Number(document.querySelector(`[data-edit-amount="${id}"]`)?.value||0);
          if(!description||!(amount>0)){say("راجع الوصف والمبلغ");return}
          btn.disabled=true;
          await TripDB.update("personal_expenses",id,{description,amount,status:"active"});
          say("اتعدل واتحدّث الحساب ✅");
          await refresh();
        }else if(action==="resolve"){
          btn.disabled=true;
          await TripDB.update("personal_expenses",id,{status:"active"});
          say("اتقفلت الملاحظة ورجع المبلغ للتسوية ✅");
          await refresh();
        }else if(action==="delete"){
          if(!confirm(`تحذف ${x.description} — ${money(x.amount)}؟`))return;
          btn.disabled=true;
          await TripDB.remove("personal_expenses",id);
          say("اتحذفت");
          await refresh();
        }else if(action==="submit-dispute"){
          const input=document.querySelector(`[data-dispute-text="${id}"]`);
          btn.disabled=true;
          const sent=await addComment(id,input?.value,true);
          if(!sent){btn.disabled=false;return}
          say("الملاحظة اتبعتت له ⚠️");
          await refresh();
        }else if(action==="comment"){
          const input=document.querySelector(`[data-comment-input="${id}"]`);
          btn.disabled=true;
          const sent=await addComment(id,input?.value,false);
          if(!sent){btn.disabled=false;return}
          say("التعليق اتبعت 💬");
          await refresh();
        }
      }catch(e){
        console.error(e);
        const msg=String(e?.message||e||"");
        if(msg.includes("PERSONAL_EXPENSE_IN_SETTLEMENT")) say("المبلغ داخل تسوية. راجع ختام الرحلة الأول");
        else if(msg.includes("BENEFICIARY_CANNOT_EDIT_AMOUNT")) say("التعديل متاح للي دفع بس");
        else say("حصلت مشكلة — جرّب تاني");
        btn.disabled=false;
      }
    });
  }

  async function init(){
    const root=$("#peApp");if(!root)return;
    root.classList.add("pe-loading");
    try{
      await refresh();
      bindActions();
      root.classList.remove("pe-loading");
    }catch(e){
      console.error("Personal expenses init failed",e);
      root.innerHTML='<div class="card pe-empty">حصلت مشكلة في تحميل الحساب الشخصي. حدّث التطبيق وجرب تاني.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded",init);
})();