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

  // Safari may finish the negative part of the gesture before the new document runs.
  // Remember only a downward refresh gesture that started at the top of this page.
  const refreshKey = 'mlt-pull-refresh';
  let previousPull = false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(refreshKey) || 'null');
    previousPull = saved?.path === location.pathname && Date.now() - saved.time < 15000;
    sessionStorage.removeItem(refreshKey);
  } catch {}
  let touchOrigin;
  window.addEventListener('touchstart', event => {
    touchOrigin = window.scrollY <= 1 ? event.touches?.[0]?.clientY : undefined;
    try { sessionStorage.removeItem(refreshKey); } catch {}
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    const y = event.touches?.[0]?.clientY;
    if (touchOrigin === undefined || y === undefined || y - touchOrigin < 60 || window.scrollY > 1) return;
    try { sessionStorage.setItem(refreshKey, JSON.stringify({ path: location.pathname, time: Date.now() })); } catch {}
  }, { passive: true });

  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type !== 'reload' || location.hash) return;
  let bounced = previousPull;
  let released = previousPull;
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
