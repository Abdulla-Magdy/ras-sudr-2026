
window.AshqeyaInstall = (() => {
  let deferredPrompt = null;

  function isStandalone(){
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
  }
  function isIOS(){
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
  function getBtn(){ return document.getElementById("installAppBtn"); }
  function updateBtn(){
    const btn=getBtn();
    if(!btn) return;
    if(isStandalone()) {
      btn.style.display="none";
      const card=document.getElementById("firstInstallCard"); if(card) card.style.display="none";
      const gate=document.getElementById("installRequiredGate"); if(gate) gate.style.display="none";
      const loginSection=document.getElementById("loginAccessSection"); if(loginSection) loginSection.style.display="block";
      return;
    }
    btn.style.display="inline-flex";
  }
  function showIOSHelp(){
    const old=document.getElementById("iosInstallModal");
    if(old) old.remove();
    const wrap=document.createElement("div");
    wrap.id="iosInstallModal";
    wrap.className="install-modal";
    wrap.innerHTML=`
      <div class="install-dialog">
        <button class="install-close" aria-label="إغلاق">×</button>
        <div class="install-icon">📲</div>
        <h3>نزّل «البز في الرحلة V2»</h3>
        <p>على iPhone افتح الموقع في Safari، وبعدها:</p>
        <div class="install-steps">
          <div><b>1</b> اضغط زر المشاركة <span>⎋</span></div>
          <div><b>2</b> اختار <strong>Add to Home Screen</strong></div>
          <div><b>3</b> اضغط <strong>Add</strong></div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector(".install-close").onclick=()=>wrap.remove();
    wrap.onclick=e=>{ if(e.target===wrap) wrap.remove(); };
  }
  async function install(){
    if(isStandalone()) return;
    if(deferredPrompt){
      deferredPrompt.prompt();
      const choice=await deferredPrompt.userChoice;
      deferredPrompt=null;
      updateBtn();
      return choice;
    }
    if(isIOS()) {
      showIOSHelp();
      return;
    }
    alert("من قائمة المتصفح اختار Install app أو Add to Home screen علشان تضيف «البز في الرحلة V2» على الموبايل.");
  }
  function init(){
    updateBtn();
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredPrompt=e;
      updateBtn();
    });
    window.addEventListener("appinstalled", () => {
      deferredPrompt=null;
      updateBtn();
    });
    const btn=getBtn();
    if(btn) btn.onclick=install;
    const requiredBtn=document.getElementById("installRequiredBtn");
    if(requiredBtn) requiredBtn.onclick=install;
  }
  return {init,install};
})();
document.addEventListener("DOMContentLoaded", ()=>AshqeyaInstall.init());
