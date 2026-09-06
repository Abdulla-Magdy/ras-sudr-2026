
const TRIP_DATE=new Date("2026-10-07T00:00:00+03:00"),$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let DBLIVE=false, MEMBERS=[], CATEGORIES=[], CURRENT_MEMBER=null, IS_ADMIN=false;

function countdown(){if(!$("#days"))return;let x=Math.max(0,TRIP_DATE-new Date()),d=Math.floor(x/86400000),h=Math.floor(x%86400000/3600000),m=Math.floor(x%3600000/60000),s=Math.floor(x%60000/1000);$("#days").textContent=String(d).padStart(2,"0");$("#hours").textContent=String(h).padStart(2,"0");$("#minutes").textContent=String(m).padStart(2,"0");$("#seconds").textContent=String(s).padStart(2,"0")}
setInterval(countdown,1000);countdown();

function activateNav(){let p=location.pathname.split("/").pop()||"index.html";$$("[data-page]").forEach(a=>a.classList.toggle("active",a.dataset.page===p))}
function setDbState(){let e=$("#dbState");if(!e)return;e.textContent=DBLIVE?"Shared Live":"Local Demo";e.classList.toggle("live",DBLIVE)}
const memberOptions=()=>MEMBERS.map(x=>`<option value="${x.id}">${x.name}</option>`).join("");

async function loadCore(){
  if(DBLIVE){
    MEMBERS=await TripDB.list("members",{order:"sort_order"});
    CATEGORIES=await TripDB.list("categories",{order:"sort_order"});
  }else{
    MEMBERS=FALLBACK_DATA.crew.map((x,i)=>({id:String(i+1),name:x[0],role:x[1],joke:x[2],confirmed:true}));
    CATEGORIES=FALLBACK_DATA.categories.map((n,i)=>({id:String(i+1),name:n}));
  }
}

async function renderHomeMeals(){
  let b=$("#mealSummary");if(!b)return;
  let meals;
  if(DBLIVE) meals=await TripDB.list("meal_plan",{order:"day_no"});
  else meals=FALLBACK_DATA.meals.map(x=>({day_no:x[0],title:x[1],details:x[2]}));
  b.innerHTML=meals.map(m=>`<p class="muted"><strong>${m.title}:</strong> ${m.details||"لسه بيتحدد"}</p>`).join("");
}

function confirmedMembers(){ return MEMBERS.filter(m=>m.confirmed!==false); }

function renderParticipantCount(){
  const count=confirmedMembers().length;
  if($("#participantCount")) $("#participantCount").textContent=count.toLocaleString("ar-EG");
  if($("#participantCountText")) $("#participantCountText").textContent=`${count} مؤكدين حاليًا`;
}

async function renderCrew(){
  let b=$("#crewGrid");if(!b)return;
  b.innerHTML=MEMBERS.map(c=>`<div class="card crew-card ${c.confirmed===false?"crew-inactive":""}">
    <div class="crew-card-top">
      <div class="crew-name">${c.name}</div>
      <span class="trip-status ${c.confirmed===false?"off":"on"}">${c.confirmed===false?"مش داخل القسمة":"طالع ✓"}</span>
    </div>
    <div class="crew-role">${c.role||""}</div>
    <div class="crew-joke">${c.joke||""}</div>
  </div>`).join("");
  renderParticipantCount();
}

async function renderMeals(){
  let b=$("#mealGrid");if(!b)return;
  let meals=DBLIVE?await TripDB.list("meal_plan",{order:"day_no"}):JSON.parse(localStorage.getItem("localMeals")||"null");
  if(!meals){meals=FALLBACK_DATA.meals.map((x,i)=>({id:String(i+1),day_no:x[0],title:x[1],details:x[2]}))}
  b.innerHTML=meals.map(m=>`<div class="card meal-card">
    <div class="pill">DAY ${m.day_no}</div>
    <input class="text-input meal-title" data-id="${m.id}" value="${m.title||""}" style="margin:10px 0 8px" ${IS_ADMIN?"":"disabled"}>
    <textarea class="textarea meal-details" data-id="${m.id}" ${IS_ADMIN?"":"disabled"}>${m.details||""}</textarea>
    ${IS_ADMIN?`<div class="actions" style="margin-top:8px"><button class="btn save-meal" data-id="${m.id}">حفظ</button></div>`:`<div class="muted" style="margin-top:8px;font-size:10px">التعديل للأدمن فقط</div>`}
  </div>`).join("");
  $$(".save-meal").forEach(btn=>btn.onclick=async()=>{
    let id=btn.dataset.id,title=$(`.meal-title[data-id="${id}"]`).value.trim(),details=$(`.meal-details[data-id="${id}"]`).value.trim();
    if(DBLIVE) await TripDB.update("meal_plan",id,{title,details});
    else{
      let arr=meals.map(x=>x.id===id?{...x,title,details}:x);localStorage.setItem("localMeals",JSON.stringify(arr));
    }
    toast("اتحفظت الخطة ✅"); renderHomeMeals();
  });
}


function foodResponsibleName(id){
  return MEMBERS.find(m=>m.id===id)?.name || "";
}
function foodResponsibilityBadge(item){
  if(!item.responsible_member_id) return `<span class="food-owner-badge open">لسه من غير مسؤول</span>`;
  const mine=item.responsible_member_id===CURRENT_MEMBER.id;
  return `<span class="food-owner-badge ${mine?"mine":"assigned"}">${mine?"أنا مسؤول":"مسؤول: "+foodResponsibleName(item.responsible_member_id)}</span>`;
}
function foodMemberAction(item){
  if(IS_ADMIN) return "";
  if(!item.responsible_member_id){
    return `<button class="btn food-claim" data-id="${item.id}">أنا هجيب ده</button>`;
  }
  if(item.responsible_member_id===CURRENT_MEMBER.id){
    return `<button class="btn secondary food-release" data-id="${item.id}">سيب المسؤولية</button>`;
  }
  return "";
}
function adminFoodOwnerSelect(item){
  if(!IS_ADMIN) return "";
  return `<label class="mini-field"><span>مسؤول الشراء</span>
    <select class="select-input food-owner-select" data-id="${item.id}">
      <option value="">غير محدد</option>
      ${MEMBERS.map(m=>`<option value="${m.id}" ${item.responsible_member_id===m.id?"selected":""}>${m.name}</option>`).join("")}
    </select>
  </label>`;
}

async function renderFood(){
  let b=$("#foodBody");if(!b)return;
  let items;
  if(DBLIVE) items=await TripDB.list("shopping_items",{order:"sort_order"});
  else{
    items=JSON.parse(localStorage.getItem("localFood")||"null");
    if(!items) items=FALLBACK_DATA.food.map((x,i)=>({id:String(i+1),name:x[0],planned_qty:x[1],unit:x[2],actual_qty:"",purchased:false,responsible_member_id:null}));
  }

  b.innerHTML=items.length?items.map(x=>`
    <article class="food-item-card ${x.purchased?"purchased":""}">
      <div class="food-item-head">
        <div>
          <div class="food-item-name">${x.name}</div>
          <div class="food-item-meta">
            <span>المخطط: <strong>${x.planned_qty??"—"} ${x.unit||""}</strong></span>
            ${x.actual_qty!==null && x.actual_qty!==""?`<span>الفعلي: <strong>${x.actual_qty} ${x.unit||""}</strong></span>`:""}
          </div>
        </div>
        <div class="food-head-badges">
          ${foodResponsibilityBadge(x)}
          <span class="status ${x.purchased?"done":"open"}">${x.purchased?"اتجاب ✓":"لسه"}</span>
        </div>
      </div>

      <div class="food-responsibility-action">
        ${foodMemberAction(x)}
        ${adminFoodOwnerSelect(x)}
      </div>

      ${IS_ADMIN?`
      <details class="food-edit-details">
        <summary>تعديل الصنف والكميات</summary>
        <div class="food-edit-grid">
          <label class="mini-field"><span>الصنف</span><input class="text-input item-name" data-id="${x.id}" value="${x.name}"></label>
          <label class="mini-field"><span>المخطط</span><input class="qty-input planned" data-id="${x.id}" value="${x.planned_qty??""}"></label>
          <label class="mini-field"><span>الوحدة</span><input class="text-input unit-in" data-id="${x.id}" value="${x.unit||""}"></label>
          <label class="mini-field"><span>الفعلي</span><input class="qty-input actual" data-id="${x.id}" value="${x.actual_qty??""}"></label>
          <label class="mini-field"><span>الحالة</span>
            <select class="select-input bought" data-id="${x.id}">
              <option value="false">لسه</option>
              <option value="true" ${x.purchased?"selected":""}>اتجاب</option>
            </select>
          </label>
          <button class="btn danger del-item" data-id="${x.id}">حذف الصنف</button>
        </div>
      </details>`:""}
    </article>
  `).join(""):`<div class="empty-finance">لسه مفيش أصناف في قائمة الشراء.</div>`;

  $$(".food-edit-details input,.food-edit-details select").forEach(e=>{
    e.onchange=async()=>saveItem(e.dataset.id,items);
  });
  $$(".del-item").forEach(e=>e.onclick=async()=>{
    if(!confirm("تحذف الصنف؟"))return;
    if(DBLIVE)await TripDB.remove("shopping_items",e.dataset.id);
    else{
      items=items.filter(x=>x.id!==e.dataset.id);
      localStorage.setItem("localFood",JSON.stringify(items));
    }
    renderFood();
    renderFoodResponsibilities();
  });

  $$(".food-owner-select").forEach(s=>s.onchange=async()=>{
    await TripDB.update("shopping_items",s.dataset.id,{responsible_member_id:s.value||null});
    toast("مسؤول الشراء اتحدث ✅");
    renderFood();
    renderFoodResponsibilities();
  });

  $$(".food-claim").forEach(btn=>btn.onclick=async()=>{
    try{
      await TripDB.claimFoodItem(btn.dataset.id);
      toast("بقيت مسؤول عن الصنف ✅");
      renderFood();
      renderFoodResponsibilities();
    }catch(e){
      const msg=String(e.message||e);
      toast(msg.includes("ITEM_ALREADY_ASSIGNED")?"الصنف حد أخده قبلك":"حصلت مشكلة");
      renderFood();
    }
  });

  $$(".food-release").forEach(btn=>btn.onclick=async()=>{
    await TripDB.releaseFoodItem(btn.dataset.id);
    toast("سيبت المسؤولية");
    renderFood();
    renderFoodResponsibilities();
  });
}

async function saveItem(id,items){
  let patch={
    name:$(`.item-name[data-id="${id}"]`)?.value.trim()||"",
    planned_qty:$(`.planned[data-id="${id}"]`)?.value||null,
    unit:$(`.unit-in[data-id="${id}"]`)?.value.trim()||"",
    actual_qty:$(`.actual[data-id="${id}"]`)?.value||null,
    purchased:$(`.bought[data-id="${id}"]`)?.value==="true"
  };
  if(DBLIVE) await TripDB.update("shopping_items",id,patch);
  else{
    items=items.map(x=>x.id===id?{...x,...patch}:x);
    localStorage.setItem("localFood",JSON.stringify(items));
  }
  toast("اتحفظ ✅");
  renderFood();
}

async function foodAddInit(){
  let btn=$("#addFoodItem");if(!btn)return;
  if(!IS_ADMIN){
    const box=$("#foodAddBox");
    if(box) box.style.display="none";
    return;
  }
  btn.onclick=async()=>{
    let name=$("#newFoodName").value.trim(),qty=$("#newFoodQty").value.trim(),unit=$("#newFoodUnit").value.trim();
    if(!name)return;
    if(DBLIVE) await TripDB.insert("shopping_items",{
      category_id:CATEGORIES.find(c=>c.name==="الأكل")?.id||null,
      name,planned_qty:qty||null,unit,sort_order:999
    });
    $("#newFoodName").value=$("#newFoodQty").value=$("#newFoodUnit").value="";
    renderFood();
    renderFoodResponsibilities();
  }
}

async function renderFoodResponsibilities(){
  const b=$("#foodResponsibilityGrid"); if(!b) return;
  const items=DBLIVE?await TripDB.list("shopping_items",{order:"sort_order"}):[];
  if(!items.length){
    b.innerHTML='<div class="empty-finance">أضف أصناف من صفحة الأكل الأول.</div>';
    return;
  }

  const assigned=items.filter(x=>x.responsible_member_id).length;
  if($("#foodResponsibilityProgress")){
    $("#foodResponsibilityProgress").textContent=`${assigned} من ${items.length} أصناف متوزعين`;
  }

  b.innerHTML=items.map(x=>`
    <article class="food-resp-card">
      <div class="food-resp-main">
        <div class="food-resp-icon">${x.purchased?"✅":"🛒"}</div>
        <div>
          <strong>${x.name}</strong>
          <div class="muted">${x.planned_qty??"—"} ${x.unit||""}</div>
        </div>
      </div>
      <div class="food-resp-owner">
        ${foodResponsibilityBadge(x)}
        ${IS_ADMIN?adminFoodOwnerSelect(x):foodMemberAction(x)}
      </div>
    </article>
  `).join("");

  $$("#foodResponsibilityGrid .food-owner-select").forEach(s=>s.onchange=async()=>{
    await TripDB.update("shopping_items",s.dataset.id,{responsible_member_id:s.value||null});
    toast("اتحدثت مسؤولية الصنف ✅");
    renderFoodResponsibilities();
    renderFood();
  });
  $$("#foodResponsibilityGrid .food-claim").forEach(btn=>btn.onclick=async()=>{
    try{
      await TripDB.claimFoodItem(btn.dataset.id);
      toast("بقيت مسؤول عن الصنف ✅");
    }catch(e){
      toast(String(e.message||e).includes("ITEM_ALREADY_ASSIGNED")?"الصنف حد أخده قبلك":"حصلت مشكلة");
    }
    renderFoodResponsibilities();
    renderFood();
  });
  $$("#foodResponsibilityGrid .food-release").forEach(btn=>btn.onclick=async()=>{
    await TripDB.releaseFoodItem(btn.dataset.id);
    toast("سيبت المسؤولية");
    renderFoodResponsibilities();
    renderFood();
  });
}


async function renderResponsibilities(){
  let b=$("#responsibilityGrid");if(!b)return;
  let rs=DBLIVE?await TripDB.responsibilities():JSON.parse(localStorage.getItem("responsibilities")||"{}");
  let map={};
  if(DBLIVE) rs.forEach(x=>map[x.category_id]=x.member_id); else map=rs;
  b.innerHTML=CATEGORIES.map(c=>{
    const current=map[c.id]||"";
    const options=IS_ADMIN?memberOptions():`<option value="${CURRENT_MEMBER.id}">${CURRENT_MEMBER.name}</option>`;
    const canEdit=IS_ADMIN || !current || current===CURRENT_MEMBER.id;
    const displayName=c.name==="الأكل"?"تنسيق الأكل":c.name; return `<div class="card"><div class="section-title"><h3>${displayName}</h3></div><select class="select-input resp" data-cat="${c.id}" ${canEdit?"":"disabled"}><option value="">${current?"سيب المسؤولية":"خد المسؤولية"}</option>${options}</select>${!canEdit?'<div class="muted" style="font-size:10px;margin-top:7px">مسؤول عنها عضو تاني</div>':""}</div>`;
  }).join("");
  $$(".resp").forEach(s=>{s.value=map[s.dataset.cat]||"";s.onchange=async()=>{
    const wanted=s.value||null;
    if(!IS_ADMIN && wanted && wanted!==CURRENT_MEMBER.id){ toast("تقدر تختار نفسك بس"); return; }
    await TripDB.upsertResponsibility(s.dataset.cat,wanted); toast("المسؤولية اتحدثت ✅");
  }});
}

async function expenseInit(){
  if(!$("#expenseCategory"))return;
  $("#expenseCategory").innerHTML=CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  if(IS_ADMIN){ $("#expensePayer").innerHTML=memberOptions(); }
  else{
    $("#expensePayer").innerHTML=`<option value="${CURRENT_MEMBER.id}">${CURRENT_MEMBER.name}</option>`;
    $("#expensePayer").value=CURRENT_MEMBER.id; $("#expensePayer").disabled=true;
  }
  $("#addExpense").onclick=async()=>{
    let row={category_id:$("#expenseCategory").value,payer_member_id:$("#expensePayer").value,amount:Number($("#expenseAmount").value||0),note:$("#expenseNote").value.trim()};
    if(!row.amount)return;
    if(DBLIVE) await TripDB.insert("expenses",row); else{let a=JSON.parse(localStorage.getItem("tripExpenses")||"[]");a.push({...row,id:"l"+Date.now()});localStorage.setItem("tripExpenses",JSON.stringify(a))}
    $("#expenseAmount").value="";$("#expenseNote").value="";renderExpenses();
  };renderExpenses();
}
function money(v){
  const n=Number(v||0);
  return new Intl.NumberFormat("ar-EG",{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2}).format(n)+" ج";
}
function balanceBadge(net){
  const eps=.005;
  if(net>eps) return `<span class="balance-badge credit">له ${money(net)}</span>`;
  if(net<-eps) return `<span class="balance-badge debt">عليه ${money(Math.abs(net))}</span>`;
  return `<span class="balance-badge settled">خالص ✓</span>`;
}
function buildTransfers(people){
  const eps=.005;
  let creditors=people.filter(p=>p.net>eps).map(p=>({...p,remaining:p.net}));
  let debtors=people.filter(p=>p.net<-eps).map(p=>({...p,remaining:Math.abs(p.net)}));
  const transfers=[];
  let c=0,d=0;
  while(c<creditors.length && d<debtors.length){
    const amount=Math.min(creditors[c].remaining,debtors[d].remaining);
    if(amount>eps){
      transfers.push({from:debtors[d],to:creditors[c],amount});
      creditors[c].remaining-=amount;
      debtors[d].remaining-=amount;
    }
    if(creditors[c].remaining<=eps)c++;
    if(debtors[d].remaining<=eps)d++;
  }
  return transfers;
}

async function renderExpenses(){
  let b=$("#expenseList");if(!b)return;
  let arr=DBLIVE?await TripDB.list("expenses",{order:"created_at",asc:false}):JSON.parse(localStorage.getItem("tripExpenses")||"[]");
  let mn=Object.fromEntries(MEMBERS.map(m=>[m.id,m.name]));
  let cn=Object.fromEntries(CATEGORIES.map(c=>[c.id,c.name]));

  // Detailed expense log
  b.innerHTML=arr.length?arr.map(x=>`<article class="expense-log-card">
    <div class="expense-log-head">
      <span class="expense-cat">${cn[x.category_id]||"—"}</span>
      <strong class="expense-amount">${money(Number(x.amount))}</strong>
    </div>
    <div class="expense-log-meta">
      <span>دفعها: <strong>${mn[x.payer_member_id]||"—"}</strong></span>
      <span class="muted">${x.note||"بدون ملاحظة"}</span>
    </div>
    ${(IS_ADMIN||x.payer_member_id===CURRENT_MEMBER.id)?`<button class="btn danger expense-del compact" data-id="${x.id}">حذف</button>`:""}
  </article>`).join(""):`<div class="empty-finance">لسه مفيش مصاريف مسجلة.</div>`;

  $$(".expense-del").forEach(e=>e.onclick=async()=>{
    if(DBLIVE)await TripDB.remove("expenses",e.dataset.id);
    else{
      arr=arr.filter(x=>x.id!==e.dataset.id);
      localStorage.setItem("tripExpenses",JSON.stringify(arr));
    }
    renderExpenses();
  });

  // Core totals
  const total=arr.reduce((s,x)=>s+Number(x.amount||0),0);
  const activeMembers=confirmedMembers();
  const participantCount=activeMembers.length;
  const share=participantCount>0 ? total/participantCount : 0;

  $("#totalExpense").textContent=money(total);
  $("#shareExpense").textContent=money(share);
  if($("#shareCaption")) $("#shareCaption").textContent=participantCount?`الحساب على ${participantCount} مشاركين مؤكدين`:"مفيش مشاركين مؤكدين";
  if($("#participantKpi")) $("#participantKpi").textContent=participantCount.toLocaleString("ar-EG");
  if($("#expenseCountSmall")) $("#expenseCountSmall").textContent=`${arr.length.toLocaleString("ar-EG")} دفعة مسجلة`;

  // Paid totals per member
  let totals={};
  MEMBERS.forEach(m=>totals[m.id]=0);
  arr.forEach(x=>totals[x.payer_member_id]=(totals[x.payer_member_id]||0)+Number(x.amount||0));

  const sortedMembers=[...MEMBERS].sort((a,b)=>(totals[b.id]||0)-(totals[a.id]||0));
  const top=sortedMembers[0];
  if($("#topPayer")){
    $("#topPayer").textContent=total>0&&top?top.name:"—";
    $("#topPayerAmount").textContent=total>0&&top?money(totals[top.id]||0):"0 ج";
  }

  // Dynamic settlement: only confirmed trip members share the cost.
  // If a non-participant already paid something, they remain a creditor with share = 0.
  let people=MEMBERS
    .map(m=>{
      const paid=totals[m.id]||0;
      const included=m.confirmed!==false;
      const memberShare=included?share:0;
      return {
        id:m.id,
        name:m.name,
        paid,
        share:memberShare,
        net:paid-memberShare,
        included
      };
    })
    .filter(p=>p.included || p.paid>0);

  if($("#settlementBody")){
    $("#settlementBody").innerHTML=people.length?people.map(p=>`
      <tr class="${p.included?"":"excluded-row"}">
        <td>
          <strong>${p.name}</strong>
          ${p.included?"":'<small class="row-note">مش داخل قسمة الرحلة حاليًا</small>'}
        </td>
        <td>${money(p.paid)}</td>
        <td>${p.included?money(p.share):'<span class="muted">0 ج</span>'}</td>
        <td class="${p.net>0?"net-credit":p.net<0?"net-debt":"net-zero"}">${p.net>=0?"+":""}${money(p.net)}</td>
        <td>${balanceBadge(p.net)}</td>
      </tr>`).join(""):`<tr><td colspan="5"><div class="empty-finance">مفيش أعضاء داخل القسمة حاليًا.</div></td></tr>`;
  }

  if($("#settlementCards")){
    $("#settlementCards").innerHTML=people.length?people.map(p=>`
      <article class="settlement-person-card ${p.included?"":"excluded-row"}">
        <div class="settlement-person-head">
          <div>
            <strong>${p.name}</strong>
            ${p.included?"":'<small>مش داخل القسمة حاليًا</small>'}
          </div>
          ${balanceBadge(p.net)}
        </div>
        <div class="settlement-person-grid">
          <div><span>دفع</span><strong>${money(p.paid)}</strong></div>
          <div><span>نصيبه</span><strong>${p.included?money(p.share):"0 ج"}</strong></div>
          <div class="settlement-net"><span>الصافي</span><strong class="${p.net>0?"net-credit":p.net<0?"net-debt":"net-zero"}">${p.net>=0?"+":""}${money(p.net)}</strong></div>
        </div>
      </article>`).join(""):'<div class="empty-finance">مفيش أعضاء داخل القسمة حاليًا.</div>';
  }

  const notice=$("#unassignedNotice");
  if(notice){
    if(participantCount===0){
      notice.style.display="block";
      notice.innerHTML="⚠️ مفيش أعضاء متعلمين إنهم طالعين الرحلة، لذلك نصيب الفرد متوقف لحد ما الأدمن يحدد المشاركين.";
    }else{
      const excluded=MEMBERS.filter(m=>m.confirmed===false);
      if(excluded.length){
        notice.style.display="block";
        notice.innerHTML=`الحسبة الحالية على <strong>${participantCount}</strong> مشاركين فقط. خارج القسمة حاليًا: <strong>${excluded.map(m=>m.name).join("، ")}</strong>. أي تغيير من إدارة الأشقياء يعيد الحساب فورًا.`;
      }else{
        notice.style.display="none";
      }
    }
  }

  // Suggested transfers
  const transfers=buildTransfers(people);
  const tp=$("#transferPlan");
  if(tp){
    if(!total){
      tp.innerHTML='<div class="empty-finance">أول ما نسجل مصاريف هتظهر التسوية هنا.</div>';
    }else if(!transfers.length){
      tp.innerHTML='<div class="settled-all">✅ كله خالص ومفيش تحويلات مطلوبة.</div>';
    }else{
      tp.innerHTML=transfers.map((t,i)=>`
        <div class="transfer-row ${t.from.placeholder?"placeholder-transfer":""}">
          <div class="transfer-num">${i+1}</div>
          <div class="transfer-flow">
            <strong>${t.from.name}</strong>
            <span class="transfer-arrow">← يدفع لـ ←</span>
            <strong>${t.to.name}</strong>
          </div>
          <div class="transfer-value">${money(t.amount)}</div>
        </div>`).join("");
    }
  }

  // Category breakdown
  const categoryTotals={};
  CATEGORIES.forEach(c=>categoryTotals[c.id]=0);
  arr.forEach(x=>categoryTotals[x.category_id]=(categoryTotals[x.category_id]||0)+Number(x.amount||0));
  const breakdown=CATEGORIES
    .map(c=>({name:c.name,amount:categoryTotals[c.id]||0}))
    .filter(x=>x.amount>0)
    .sort((a,b)=>b.amount-a.amount);

  const cb=$("#categoryBreakdown");
  if(cb){
    cb.innerHTML=breakdown.length?breakdown.map(x=>{
      const pct=total?x.amount/total*100:0;
      return `<div class="category-cost-row">
        <div class="category-cost-head"><strong>${x.name}</strong><span>${money(x.amount)} • ${pct.toFixed(0)}%</span></div>
        <div class="cost-bar"><i style="width:${Math.max(2,pct)}%"></i></div>
      </div>`;
    }).join(""):'<div class="empty-finance">لسه مفيش توزيع للتكاليف.</div>';
  }
}

async function ideasInit(){
  if(!$("#ideaInput"))return;
  $("#addIdea").onclick=async()=>{let body=$("#ideaInput").value.trim();if(!body)return;if(DBLIVE)await TripDB.insert("ideas",{body,member_id:CURRENT_MEMBER.id});else{let a=JSON.parse(localStorage.getItem("tripIdeas")||"[]");a.push({id:"l"+Date.now(),body});localStorage.setItem("tripIdeas",JSON.stringify(a))}$("#ideaInput").value="";renderIdeas()};
  renderIdeas();
}
async function renderIdeas(){
  let b=$("#ideasList");if(!b)return;
  let a=DBLIVE?await TripDB.list("ideas",{order:"created_at",asc:false}):JSON.parse(localStorage.getItem("tripIdeas")||"[]");
  let mn=Object.fromEntries(MEMBERS.map(m=>[m.id,m.name]));
  b.innerHTML=a.length?a.map(x=>`<div class="card"><div>${x.body}</div><div class="muted" style="font-size:10px;margin-top:7px">— ${mn[x.member_id]||"الأشقياء"}</div>${(IS_ADMIN||x.member_id===CURRENT_MEMBER.id)?`<button class="btn danger idea-del" data-id="${x.id}" style="margin-top:9px">حذف</button>`:""}</div>`).join(""):`<div class="muted">لسه مفيش اقتراحات.</div>`;
  $$(".idea-del").forEach(btn=>btn.onclick=async()=>{ await TripDB.remove("ideas",btn.dataset.id); renderIdeas(); });
}


async function renderAdminPanel(){
  const panel=$("#adminPanel"); if(!panel || !IS_ADMIN) return;
  panel.style.display="block";
  const reqs=await TripDB.adminResetRequests();
  const rb=$("#resetRequests");
  rb.innerHTML=reqs.length?`<h3>طلبات نسيت الـPIN</h3>`+reqs.map(r=>`
    <div class="admin-row"><div><strong>${r.name}</strong><div class="muted" style="font-size:10px">${new Date(r.requested_at).toLocaleString("ar-EG")}</div></div>
    <button class="btn reset-pin" data-id="${r.member_id}">Reset PIN</button></div>`).join(""):`<div class="muted">مفيش طلبات Reset معلقة.</div>`;

  const all=await TripDB.adminMembers();
  $("#adminMembers").innerHTML=all.map(m=>{
    const core=MEMBERS.find(x=>x.id===m.id);
    const confirmed=core?.confirmed!==false;
    return `<div class="admin-row admin-member-row">
      <div>
        <strong>${m.name}</strong> ${m.access_role==="admin"?'<span class="pill">ADMIN</span>':""}
        <div class="muted" style="font-size:10px">${m.pin_set?"PIN متسجل":"لسه معملش PIN"} • ${confirmed?"داخل قسمة الرحلة":"خارج القسمة"}</div>
      </div>
      <div class="admin-actions">
        <button class="btn ${confirmed?"secondary":"trip-on"} toggle-trip" data-id="${m.id}" data-confirmed="${confirmed}">
          ${confirmed?"مش طالع":"رجّعه للرحلة"}
        </button>
        ${m.pin_set?`<button class="btn secondary reset-pin" data-id="${m.id}">Reset PIN</button>`:""}
      </div>
    </div>`;
  }).join("");

  $$(".toggle-trip").forEach(btn=>btn.onclick=async()=>{
    const id=btn.dataset.id;
    const current=btn.dataset.confirmed==="true";
    const target=MEMBERS.find(m=>m.id===id)?.name||"العضو";
    const msg=current?`تخلي ${target} خارج قسمة الرحلة؟ نصيب الفرد هيتحسب فورًا على العدد الجديد.`:`ترجّع ${target} لقسمة الرحلة؟`;
    if(!confirm(msg)) return;
    await TripDB.update("members",id,{confirmed:!current});
    const local=MEMBERS.find(m=>m.id===id); if(local) local.confirmed=!current;
    toast("تم تحديث المشاركين ✅");
    renderCrew();
    if($("#expenseList")) await renderExpenses();
    await renderAdminPanel();
  });

  $$(".reset-pin").forEach(btn=>btn.onclick=async()=>{
    const target=MEMBERS.find(m=>m.id===btn.dataset.id)?.name||"العضو";
    if(!confirm(`تعمل Reset للـPIN بتاع ${target}؟`)) return;
    await TripDB.adminResetPin(btn.dataset.id);
    toast("تم Reset الـPIN ✅");
    await renderAdminPanel();
  });
}

async function renderRecentChanges(){
  let b=$("#recentChanges"); if(!b) return;
  const a=await TripDB.recentChanges(10);
  const tableNames={meal_plan:"خطة الأكل",shopping_items:"قائمة المشتريات",expenses:"المصاريف",ideas:"الاقتراحات",categories:"التصنيفات",members:"الأعضاء"};
  const actions={INSERT:"أضاف",UPDATE:"عدّل",DELETE:"حذف"};
  b.innerHTML=a.length?a.map(x=>{
    const who=x.members?.name||"أحد الأشقياء";
    const what=tableNames[x.table_name]||x.table_name;
    const act=actions[x.action]||x.action;
    const d=new Date(x.changed_at).toLocaleString("ar-EG",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
    return `<div class="activity-row"><strong>${who}</strong> ${act} <span>${what}</span><small>${d}</small></div>`;
  }).join(""):`<div class="muted">لسه مفيش تعديلات.</div>`;
}

function toast(t){let e=$("#toast");if(!e){e=document.createElement("div");e.id="toast";e.style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:10px 15px;background:#071824;border:1px solid rgba(255,255,255,.15);border-radius:999px;z-index:100";document.body.appendChild(e)}e.textContent=t;e.style.display="block";clearTimeout(window._tt);window._tt=setTimeout(()=>e.style.display="none",1800)}

document.addEventListener("DOMContentLoaded",async()=>{
  activateNav();
  let r;
  try{ r=await TripDB.init(); }
  catch(e){ console.error(e); location.href="login.html"; return; }

  if(!r.configured || !r.bound){ location.href="login.html"; return; }

  DBLIVE=true;
  setDbState();
  let m=TripDB.getMember(); CURRENT_MEMBER=m; IS_ADMIN=TripDB.isAdmin();
  let bar=$("#userBar");
  if(bar){
    bar.innerHTML=`<span class="member-chip">👤 ${m.name}${IS_ADMIN?" 👑":""}</span><button id="switchMember" class="btn secondary">تغيير العضو</button>`;
    $("#switchMember").onclick=()=>TripDB.forgetDevice();
  }

  await loadCore();
  renderParticipantCount();
  await Promise.all([renderHomeMeals(),renderCrew(),renderMeals(),renderFood(),renderResponsibilities(),renderFoodResponsibilities()]);
  foodAddInit();expenseInit();ideasInit();
  await renderRecentChanges(); await renderAdminPanel();

  if(DBLIVE){
    ["meal_plan","shopping_items","responsibilities","expenses","ideas"].forEach(t=>TripDB.subscribe(t,()=>location.reload()));
  }
});
