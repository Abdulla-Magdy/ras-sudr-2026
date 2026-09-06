
const TRIP_DATE=new Date("2026-10-07T00:00:00+03:00"),$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let DBLIVE=false, MEMBERS=[], CATEGORIES=[];

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

async function renderCrew(){
  let b=$("#crewGrid");if(!b)return;
  b.innerHTML=MEMBERS.map(c=>`<div class="card crew-card"><div class="crew-name">${c.name}</div><div class="crew-role">${c.role||""}</div><div class="crew-joke">${c.joke||""}</div></div>`).join("");
}

async function renderMeals(){
  let b=$("#mealGrid");if(!b)return;
  let meals=DBLIVE?await TripDB.list("meal_plan",{order:"day_no"}):JSON.parse(localStorage.getItem("localMeals")||"null");
  if(!meals){meals=FALLBACK_DATA.meals.map((x,i)=>({id:String(i+1),day_no:x[0],title:x[1],details:x[2]}))}
  b.innerHTML=meals.map(m=>`<div class="card meal-card">
    <div class="pill">DAY ${m.day_no}</div>
    <input class="text-input meal-title" data-id="${m.id}" value="${m.title||""}" style="margin:10px 0 8px">
    <textarea class="textarea meal-details" data-id="${m.id}">${m.details||""}</textarea>
    <div class="actions" style="margin-top:8px"><button class="btn save-meal" data-id="${m.id}">حفظ</button></div>
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

async function renderFood(){
  let b=$("#foodBody");if(!b)return;
  let items;
  if(DBLIVE) items=await TripDB.list("shopping_items",{order:"sort_order"});
  else{
    items=JSON.parse(localStorage.getItem("localFood")||"null");
    if(!items) items=FALLBACK_DATA.food.map((x,i)=>({id:String(i+1),name:x[0],planned_qty:x[1],unit:x[2],actual_qty:"",purchased:false}));
  }
  b.innerHTML=items.map(x=>`<div class="edit-row">
    <input class="text-input item-name" data-id="${x.id}" value="${x.name}">
    <input class="qty-input planned" data-id="${x.id}" value="${x.planned_qty??""}" placeholder="المخطط">
    <input class="text-input unit-in" data-id="${x.id}" value="${x.unit||""}" placeholder="الوحدة">
    <input class="qty-input actual" data-id="${x.id}" value="${x.actual_qty??""}" placeholder="الفعلي">
    <select class="select-input bought" data-id="${x.id}"><option value="false">لسه</option><option value="true" ${x.purchased?"selected":""}>اتجاب</option></select>
    <button class="btn danger del-item" data-id="${x.id}">حذف</button>
  </div>`).join("");
  $$(".edit-row input,.edit-row select").forEach(e=>e.onchange=async()=>saveItem(e.dataset.id,items));
  $$(".del-item").forEach(e=>e.onclick=async()=>{if(!confirm("تحذف الصنف؟"))return;if(DBLIVE)await TripDB.remove("shopping_items",e.dataset.id);else{items=items.filter(x=>x.id!==e.dataset.id);localStorage.setItem("localFood",JSON.stringify(items))}renderFood()});
}
async function saveItem(id,items){
  let patch={name:$(`.item-name[data-id="${id}"]`).value.trim(),planned_qty:$(`.planned[data-id="${id}"]`).value||null,unit:$(`.unit-in[data-id="${id}"]`).value.trim(),actual_qty:$(`.actual[data-id="${id}"]`).value||null,purchased:$(`.bought[data-id="${id}"]`).value==="true"};
  if(DBLIVE) await TripDB.update("shopping_items",id,patch);
  else{items=items.map(x=>x.id===id?{...x,...patch}:x);localStorage.setItem("localFood",JSON.stringify(items))}
  toast("اتحفظ ✅");
}
async function foodAddInit(){
  let btn=$("#addFoodItem");if(!btn)return;
  btn.onclick=async()=>{
    let name=$("#newFoodName").value.trim(),qty=$("#newFoodQty").value.trim(),unit=$("#newFoodUnit").value.trim();
    if(!name)return;
    if(DBLIVE) await TripDB.insert("shopping_items",{category_id:CATEGORIES.find(c=>c.name==="الأكل")?.id||null,name,planned_qty:qty||null,unit,sort_order:999});
    else{
      let arr=JSON.parse(localStorage.getItem("localFood")||"null")||FALLBACK_DATA.food.map((x,i)=>({id:String(i+1),name:x[0],planned_qty:x[1],unit:x[2],actual_qty:"",purchased:false}));
      arr.push({id:"l"+Date.now(),name,planned_qty:qty,unit,actual_qty:"",purchased:false});localStorage.setItem("localFood",JSON.stringify(arr));
    }
    $("#newFoodName").value=$("#newFoodQty").value=$("#newFoodUnit").value="";renderFood();
  }
}

async function renderResponsibilities(){
  let b=$("#responsibilityGrid");if(!b)return;
  let rs=DBLIVE?await TripDB.responsibilities():JSON.parse(localStorage.getItem("responsibilities")||"{}");
  let map={};
  if(DBLIVE) rs.forEach(x=>map[x.category_id]=x.member_id); else map=rs;
  b.innerHTML=CATEGORIES.map(c=>`<div class="card"><div class="section-title"><h3>${c.name}</h3></div><select class="select-input resp" data-cat="${c.id}"><option value="">مين هيمسكها؟</option>${memberOptions()}</select></div>`).join("");
  $$(".resp").forEach(s=>{s.value=map[s.dataset.cat]||"";s.onchange=async()=>{if(DBLIVE)await TripDB.upsertResponsibility(s.dataset.cat,s.value||null);else{let o=JSON.parse(localStorage.getItem("responsibilities")||"{}");s.value?o[s.dataset.cat]=s.value:delete o[s.dataset.cat];localStorage.setItem("responsibilities",JSON.stringify(o))}toast("المسؤولية اتحدثت ✅")}});
}

async function expenseInit(){
  if(!$("#expenseCategory"))return;
  $("#expenseCategory").innerHTML=CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  $("#expensePayer").innerHTML=memberOptions();
  $("#addExpense").onclick=async()=>{
    let row={category_id:$("#expenseCategory").value,payer_member_id:$("#expensePayer").value,amount:Number($("#expenseAmount").value||0),note:$("#expenseNote").value.trim()};
    if(!row.amount)return;
    if(DBLIVE) await TripDB.insert("expenses",row); else{let a=JSON.parse(localStorage.getItem("tripExpenses")||"[]");a.push({...row,id:"l"+Date.now()});localStorage.setItem("tripExpenses",JSON.stringify(a))}
    $("#expenseAmount").value="";$("#expenseNote").value="";renderExpenses();
  };renderExpenses();
}
async function renderExpenses(){
  let b=$("#expenseList");if(!b)return;
  let arr=DBLIVE?await TripDB.list("expenses",{order:"created_at",asc:false}):JSON.parse(localStorage.getItem("tripExpenses")||"[]");
  let mn=Object.fromEntries(MEMBERS.map(m=>[m.id,m.name])),cn=Object.fromEntries(CATEGORIES.map(c=>[c.id,c.name]));
  b.innerHTML=arr.length?arr.map(x=>`<div class="expense-row"><div>${cn[x.category_id]||"—"}</div><div>${mn[x.payer_member_id]||"—"}</div><div>${Number(x.amount).toLocaleString()} ج</div><div class="wide muted">${x.note||"—"}</div><button class="btn danger expense-del" data-id="${x.id}">حذف</button></div>`).join(""):`<div class="muted">لسه مفيش مصاريف.</div>`;
  $$(".expense-del").forEach(e=>e.onclick=async()=>{if(DBLIVE)await TripDB.remove("expenses",e.dataset.id);else{arr=arr.filter(x=>x.id!==e.dataset.id);localStorage.setItem("tripExpenses",JSON.stringify(arr))}renderExpenses()});
  let total=arr.reduce((s,x)=>s+Number(x.amount||0),0),target=8;$("#totalExpense").textContent=total.toLocaleString()+" ج";$("#shareExpense").textContent=(total/target).toLocaleString(undefined,{maximumFractionDigits:0})+" ج";
  let totals={};MEMBERS.forEach(m=>totals[m.id]=0);arr.forEach(x=>totals[x.payer_member_id]=(totals[x.payer_member_id]||0)+Number(x.amount||0));
  $("#payerTotals").innerHTML=MEMBERS.map(m=>`<tr><td>${m.name}</td><td>${(totals[m.id]||0).toLocaleString()} ج</td></tr>`).join("");
}

async function ideasInit(){
  if(!$("#ideaInput"))return;
  $("#addIdea").onclick=async()=>{let body=$("#ideaInput").value.trim();if(!body)return;if(DBLIVE)await TripDB.insert("ideas",{body});else{let a=JSON.parse(localStorage.getItem("tripIdeas")||"[]");a.push({id:"l"+Date.now(),body});localStorage.setItem("tripIdeas",JSON.stringify(a))}$("#ideaInput").value="";renderIdeas()};
  renderIdeas();
}
async function renderIdeas(){
  let b=$("#ideasList");if(!b)return;
  let a=DBLIVE?await TripDB.list("ideas",{order:"created_at",asc:false}):JSON.parse(localStorage.getItem("tripIdeas")||"[]");
  b.innerHTML=a.length?a.map(x=>`<div class="card">${x.body}</div>`).join(""):`<div class="muted">لسه مفيش اقتراحات.</div>`;
}
function toast(t){let e=$("#toast");if(!e){e=document.createElement("div");e.id="toast";e.style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:10px 15px;background:#071824;border:1px solid rgba(255,255,255,.15);border-radius:999px;z-index:100";document.body.appendChild(e)}e.textContent=t;e.style.display="block";clearTimeout(window._tt);window._tt=setTimeout(()=>e.style.display="none",1800)}

document.addEventListener("DOMContentLoaded",async()=>{
  activateNav();
  let r=await TripDB.init();

  if(!r.configured){
    location.href="login.html";
    return;
  }
  if(!r.authenticated){
    location.href="login.html";
    return;
  }

  DBLIVE=true;
  setDbState();
  let user=TripDB.getUser();
  let bar=$("#userBar");
  if(bar){
    bar.innerHTML=`<span class="muted">${user.email||""}</span> <button id="logoutBtn" class="btn secondary">خروج</button>`;
    $("#logoutBtn").onclick=()=>TripDB.signOut();
  }

  await loadCore();
  await Promise.all([renderHomeMeals(),renderCrew(),renderMeals(),renderFood(),renderResponsibilities()]);
  foodAddInit();expenseInit();ideasInit();

  if(DBLIVE){
    ["meal_plan","shopping_items","responsibilities","expenses","ideas"].forEach(t=>TripDB.subscribe(t,()=>location.reload()));
  }
});
