
(() => {
  const ua = navigator.userAgent || "";
  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const path = location.pathname.toLowerCase();
  const onLogin = path.endsWith("/login.html") || path.endsWith("/");

  window.BAZ_PWA_GATE = { isMobile, isStandalone };

  // On mobile browser, no app pages are accessible before installation.
  if (isMobile && !isStandalone && !onLogin) {
    const base = location.pathname.replace(/[^/]*$/, "");
    location.replace(base + "login.html?install=1");
    return;
  }

  document.documentElement.classList.toggle("mobile-browser-gated", isMobile && !isStandalone);
  document.documentElement.classList.toggle("installed-pwa", isStandalone);
})();
