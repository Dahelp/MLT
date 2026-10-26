/** Stabilize the hero and finish an observed native pull-to-refresh bounce. */
export const mobileHomeViewportScript = String.raw`(() => {
  if (!matchMedia('(max-width: 800px) and (pointer: coarse)').matches) return;
  const home = /^\/(en|de|ru|it|pl)\/(?:mobile-site\/|mobile-preview\/)?$/.test(location.pathname);
  const publicPage = home || /^\/(en|de|ru|it|pl)\/(?:collections\/[^/]+(?:\/(?:mobile-site|mobile-preview))?|plan|proposal|investments|acquisitions(?:\/[^/]+)?|contact|about|smart-map|vouchers|legal\/[^/]+)\/?$/.test(location.pathname);
  if (!publicPage) return;
  const root = document.documentElement;
  let width = window.innerWidth;
  const sizeHero = () => root.style.setProperty('--mlt-mobile-hero-height', window.innerHeight + 'px');
  if (home) sizeHero();
  if (home) window.addEventListener('resize', () => {
    // Browser toolbars change height without rotating the device. Keep the hero stable.
    if (Math.abs(window.innerWidth - width) < 80) return;
    width = window.innerWidth;
    sizeHero();
  }, { passive: true });

  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type !== 'reload' || location.hash) return;

  // A native refresh can restore +60px without exposing its negative bounce.
  // During reload, normalize the top 180px after the browser toolbars settle.
  // Keep observing briefly: WebKit can reapply its offset after scrollTo returns.
  const state = window.__MLT_REFRESH_STATE__ = { status: 'watching', attempts: 0 };
  const report = status => {
    state.status = status;
    window.__MLT_RECORD_VIEWPORT__?.('refresh-' + status);
  };
  let loaded = document.readyState === 'complete';
  let timer;
  let expiry;
  const clean = reason => {
    clearTimeout(timer);
    clearTimeout(expiry);
    window.removeEventListener('scroll', observe);
    window.removeEventListener('resize', observe);
    window.removeEventListener('load', ready);
    window.removeEventListener('pageshow', ready);
    window.removeEventListener('touchstart', freshTouch);
    window.removeEventListener('wheel', freshTouch);
    window.removeEventListener('keydown', freshTouch);
    window.removeEventListener('pagehide', leave);
    window.visualViewport?.removeEventListener('scroll', observe);
    window.visualViewport?.removeEventListener('resize', observe);
    report(reason);
  };
  const settle = () => {
    const viewport = window.visualViewport;
    const y = window.scrollY;
    if (!loaded || y < 0) return;
    if (y > 180) { clean('deep-scroll'); return; }
    if (viewport && Math.abs(viewport.scale - 1) >= 0.01) { clean('zoom'); return; }
    if (viewport && Math.abs(viewport.offsetTop || 0) > 1) return;
    if (y <= 1) { report('at-top'); return; }
    state.attempts += 1;
    report('correcting');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Verify the actual position instead of assuming the browser accepted the call.
    clearTimeout(timer);
    timer = setTimeout(settle, 450);
  };
  function observe() {
    clearTimeout(timer);
    if (window.scrollY > 180) { clean('deep-scroll'); return; }
    if (loaded) timer = setTimeout(settle, 450);
  }
  function freshTouch() { clean('user-input'); }
  function leave() { clean('pagehide'); }
  function ready() {
    loaded = true;
    if (!expiry) expiry = setTimeout(() => clean('expired'), 10000);
    observe();
  }
  window.addEventListener('scroll', observe, { passive: true });
  window.addEventListener('resize', observe, { passive: true });
  window.addEventListener('load', ready, { passive: true });
  window.addEventListener('pageshow', ready, { passive: true });
  window.addEventListener('touchstart', freshTouch, { passive: true });
  window.addEventListener('wheel', freshTouch, { passive: true });
  window.addEventListener('keydown', freshTouch);
  window.addEventListener('pagehide', leave);
  window.visualViewport?.addEventListener('scroll', observe, { passive: true });
  window.visualViewport?.addEventListener('resize', observe, { passive: true });
  report('watching');
  if (loaded) ready();
})();`;
