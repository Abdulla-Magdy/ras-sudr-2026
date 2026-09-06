
window.BazTutorial = (() => {
  const VERSION = "v2";
  let state = { index: 0, memberId: null, memberName: "", isAdmin: false };

  const steps = [
    {
      icon: "👋",
      title: "أهلاً بيك في البز في الرحلة V2",
      body: (s)=>`إنت داخل باسم <strong>${s.memberName || "عضو من الأشقياء"}</strong>. اسمك هيفضل ظاهر فوق، ومن زر القائمة ☰ تقدر توصل لكل حاجة.`
    },
    {
      icon: "🍔",
      title: "الأكل والمشتريات",
      body: ()=>`صفحة <strong>الأكل</strong> فيها المنيو النهائي وقائمة المشتريات. كل صنف له كمية ومسؤول شراء، والداتا دي هي المصدر الأساسي اللي باقي الصفحات بتقرأ منه.`
    },
    {
      icon: "📋",
      title: "مين عليه إيه؟",
      body: ()=>`لو أخدت مسؤولية صنف، هيظهر فورًا في <strong>مين عليه إيه؟</strong> وتحت "المطلوب مني". مفيش قوائم مسؤوليات منفصلة تتكرر أو تتلخبط.`
    },
    {
      icon: "🧾",
      title: "اشتريت كذا حاجة في فاتورة واحدة؟",
      body: ()=>`ادخل <strong>المصاريف ← مشتريات جاهزة للحساب</strong>، علّم على كل الحاجات اللي اشتريتها واكتب <strong>إجمالي الفاتورة مرة واحدة</strong>. مش لازم تدخل سعر كل صنف.`
    },
    {
      icon: "✅",
      title: "المشتريات بتتقفل لوحدها",
      body: ()=>`لما تسجل الفاتورة، الأصناف المختارة تتحول تلقائيًا لـ <strong>تم الشراء</strong>، وتتسجل الدفعة في حسابات الشخص اللي دفع.`
    },
    {
      icon: "⛽",
      title: "المصاريف العامة",
      body: ()=>`البنزين، الشاليه، البوابات أو أي مصروف مش مربوط بصنف يتسجل من <strong>دفعة عامة</strong>. عادي جدًا أكتر من شخص يدفع في نفس التصنيف.`
    },
    {
      icon: "🎒",
      title: "شنطتي",
      body: ()=>`دي قائمة شخصية خاصة بيك لتجهيز شنطتك. علّم على اللي جهزته، وضيف أي حاجة ناقصة. كل عضو يشوف شنطته هو بس.`
    },
    {
      icon: "🔄",
      title: "التطبيق بيتحدّث لوحده",
      body: ()=>`أي Update جديد هننزله هيوصل للتطبيق تلقائيًا أول ما تفتحه وعندك إنترنت. <strong>مش محتاج تمسحه أو تنزله من جديد.</strong>`
    }
  ];

  function key(){
    return `bazTutorialSeen:${VERSION}:${state.memberId || "unknown"}`;
  }

  function seen(){
    try { return localStorage.getItem(key()) === "1"; }
    catch { return false; }
  }

  function markSeen(){
    try { localStorage.setItem(key(),"1"); } catch {}
  }

  function escapeHTML(s=""){
    return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function ensureUI(){
    if(document.getElementById("bazTutorial")) return;

    const wrap=document.createElement("div");
    wrap.id="bazTutorial";
    wrap.className="tutorial-overlay";
    wrap.innerHTML=`
      <div class="tutorial-dialog" role="dialog" aria-modal="true" aria-label="شرح استخدام التطبيق">
        <div class="tutorial-topline">
          <span class="tutorial-step-label"></span>
          <button class="tutorial-close" aria-label="إغلاق">×</button>
        </div>
        <div class="tutorial-icon"></div>
        <h2 class="tutorial-title"></h2>
        <div class="tutorial-body"></div>
        <div class="tutorial-progress"></div>
        <div class="tutorial-actions">
          <button class="btn secondary tutorial-prev">السابق</button>
          <button class="btn tutorial-next">التالي</button>
        </div>
        <button class="tutorial-skip">تخطي الشرح</button>
      </div>
    `;
    document.body.appendChild(wrap);

    wrap.querySelector(".tutorial-close").onclick=()=>close(true);
    wrap.querySelector(".tutorial-skip").onclick=()=>close(true);
    wrap.querySelector(".tutorial-prev").onclick=()=>{
      if(state.index>0){ state.index--; render(); }
    };
    wrap.querySelector(".tutorial-next").onclick=()=>{
      if(state.index < steps.length-1){
        state.index++; render();
      }else{
        close(true);
        if(window.toast) toast("تمام.. كده إنت جاهز 😎");
      }
    };
    wrap.onclick=e=>{ if(e.target===wrap) close(false); };
  }

  function render(){
    ensureUI();
    const wrap=document.getElementById("bazTutorial");
    const step=steps[state.index];

    wrap.querySelector(".tutorial-step-label").textContent=`${state.index+1} / ${steps.length}`;
    wrap.querySelector(".tutorial-icon").textContent=step.icon;
    wrap.querySelector(".tutorial-title").textContent=step.title;
    wrap.querySelector(".tutorial-body").innerHTML=
      typeof step.body==="function" ? step.body({...state,memberName:escapeHTML(state.memberName)}) : step.body;

    wrap.querySelector(".tutorial-prev").style.visibility=state.index===0?"hidden":"visible";
    wrap.querySelector(".tutorial-next").textContent=state.index===steps.length-1?"تمام.. فهمت ✅":"التالي";

    wrap.querySelector(".tutorial-progress").innerHTML=steps.map((_,i)=>
      `<span class="${i===state.index?"active":i<state.index?"done":""}"></span>`
    ).join("");

    wrap.classList.add("open");
    document.body.classList.add("tutorial-open");
  }

  function open(fromStart=true){
    if(fromStart) state.index=0;
    render();
  }

  function close(mark=false){
    const wrap=document.getElementById("bazTutorial");
    if(wrap) wrap.classList.remove("open");
    document.body.classList.remove("tutorial-open");
    if(mark) markSeen();
  }

  function addHelpButtons(){
    if(!document.getElementById("tutorialHelpFab")){
      const fab=document.createElement("button");
      fab.id="tutorialHelpFab";
      fab.className="tutorial-help-fab";
      fab.setAttribute("aria-label","شرح استخدام التطبيق");
      fab.title="شرح استخدام التطبيق";
      fab.textContent="?";
      fab.onclick=()=>open(true);
      document.body.appendChild(fab);
    }

    const drawer=document.getElementById("mobileMenuDrawer");
    const actions=drawer?.querySelector(".mobile-drawer-actions");
    if(actions && !drawer.querySelector("#drawerTutorialHelp")){
      const btn=document.createElement("button");
      btn.id="drawerTutorialHelp";
      btn.className="btn secondary";
      btn.textContent="❓ شرح استخدام التطبيق";
      btn.onclick=()=>{
        drawer.classList.remove("open");
        document.getElementById("mobileMenuBackdrop")?.classList.remove("open");
        document.body.classList.remove("menu-open");
        setTimeout(()=>open(true),120);
      };
      actions.prepend(btn);
    }
  }

  function init({memberId,memberName,isAdmin}={}){
    state.memberId=memberId||"";
    state.memberName=memberName||"";
    state.isAdmin=!!isAdmin;
    addHelpButtons();

    if(!seen()){
      setTimeout(()=>open(true),550);
    }
  }

  return {init,open,close};
})();
