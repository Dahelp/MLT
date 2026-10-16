/** Stabilize the hero and finish an observed native pull-to-refresh bounce. */
export const mobileHomeViewportScript = String.raw`(() => {
  if (!/^\/(en|de|ru|it|pl)\/(?:mobile-site\/|mobile-preview\/)?$/.test(location.pathname) ||
      !matchMedia('(max-width: 800px) and (pointer: coarse)').matches) return;
  const root = document.documentElement;
  let width = window.innerWidth;
  const sizeHero = () => root.style.setProperty('--mlt-mobile-hero-height', window.innerHeight + 'px');
  sizeHero();
  window.addEventListener('resize', () => {
    // Browser toolbars change height without rotating the device. Keep the hero stable.
    if (Math.abs(window.innerWidth - width) < 80) return;
    width = window.innerWidth;
    sizeHero();
  }, { passive: true });

  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type !== 'reload' || location.hash) return;
  let bounced = false;
  let released = false;
  let timer;
  let expiry;
  const clean = () => {
    clearTimeout(timer);
    clearTimeout(expiry);
    window.removeEventListener('scroll', observe);
    window.removeEventListener('touchstart', freshTouch);
    window.removeEventListener('touchend', release);
    window.removeEventListener('touchcancel', release);
    window.removeEventListener('wheel', clean);
    window.removeEventListener('keydown', clean);
    window.removeEventListener('pagehide', clean);
    window.visualViewport?.removeEventListener('scroll', observe);
    window.visualViewport?.removeEventListener('resize', observe);
  };
  const settle = () => {
    // Do not reset deep intentional navigation, zoom or a still stretched page.
    const viewport = window.visualViewport;
    const y = window.scrollY;
    if (bounced && released && y >= 0 && y <= 180 && (!viewport || Math.abs(viewport.scale - 1) < 0.01)) {
      clean();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };
  function observe() {
    if (window.scrollY < -1) bounced = true;
    if (bounced && window.scrollY >= 0) released = true;
    clearTimeout(timer);
    if (bounced && released) timer = setTimeout(settle, 220);
  }
  function freshTouch() { clean(); }
  function release() { released = true; observe(); }
  window.addEventListener('scroll', observe, { passive: true });
  window.addEventListener('touchstart', freshTouch, { passive: true });
  window.addEventListener('touchend', release, { passive: true });
  window.addEventListener('touchcancel', release, { passive: true });
  window.addEventListener('wheel', clean, { passive: true });
  window.addEventListener('keydown', clean);
  window.addEventListener('pagehide', clean);
  window.visualViewport?.addEventListener('scroll', observe, { passive: true });
  window.visualViewport?.addEventListener('resize', observe, { passive: true });
  expiry = setTimeout(clean, 10000);
  observe();
})();`;
