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

  if (window.__MLT_MANAGED_REFRESH__) return;
  if (new URLSearchParams(location.search || '').get('viewport-debug') === '1' &&
      new URLSearchParams(location.search || '').get('refresh-mode') === 'raw') return;
  const navigation = performance.getEntriesByType('navigation')[0];
  let active = navigation?.type === 'reload' && !location.hash;
  const state = window.__MLT_REFRESH_STATE__ = { status: active ? 'watching' : 'idle', attempts: 0, nativeInset: 0 };
  const report = status => {
    if (state.status === status) return;
    state.status = status;
    window.__MLT_RECORD_VIEWPORT__?.('refresh-' + status);
  };
  let loaded = document.readyState === 'complete';
  let fingerDown = false;
  let pulled = false;
  let timer;
  let expiry;
  let attemptsThisPull = 0;
  let reachedRequestedTop = false;
  const clearInset = () => {
    root.classList.remove('mlt-native-scroll-inset');
    root.style.removeProperty('--mlt-native-scroll-inset');
    state.nativeInset = 0;
  };
  const compensateInset = offset => {
    // Some host webviews reapply the same inset one frame after scrollTo(0).
    // Move document content as a whole; fixed controls stay tied to the viewport.
    root.classList.add('mlt-native-scroll-inset');
    root.style.setProperty('--mlt-native-scroll-inset', offset + 'px');
    state.nativeInset = offset;
    clearTimeout(timer);
    clearTimeout(expiry);
    expiry = undefined;
    active = false;
    report('compensated');
  };
  // Cancel a correction, not the passive detection of the next native pull.
  const suspend = reason => {
    clearTimeout(timer);
    clearTimeout(expiry);
    expiry = undefined;
    active = false;
    attemptsThisPull = 0;
    reachedRequestedTop = false;
    report(reason);
  };
  const expire = () => {
    clearTimeout(expiry);
    expiry = setTimeout(() => suspend('idle'), 10000);
  };
  const settle = () => {
    const viewport = window.visualViewport;
    const y = window.scrollY;
    if (!loaded || fingerDown || y < 0) return;
    if (state.nativeInset && y <= 1 && (!viewport || Math.abs(viewport.offsetTop || 0) <= 1)) {
      clearInset();
      active = false;
      report('at-top');
      return;
    }
    if (!active) return;
    if (y > 180) { suspend('deep-scroll'); return; }
    if (viewport && Math.abs(viewport.scale - 1) >= 0.01) { suspend('zoom'); return; }
    if (viewport && Math.abs(viewport.offsetTop || 0) > 1) return;
    if (y <= 1) { report('at-top'); return; }
    if (state.nativeInset || reachedRequestedTop || attemptsThisPull >= 3) {
      compensateInset(y);
      return;
    }
    state.attempts += 1;
    attemptsThisPull += 1;
    report('correcting');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    reachedRequestedTop = window.scrollY <= 1;
    clearTimeout(timer);
    timer = setTimeout(settle, 450);
  };
  function observe() {
    // A fresh downward overscroll can happen long after load without a new document.
    if (fingerDown && window.scrollY < -1 && !pulled) {
      pulled = true;
      active = true;
      report('pulling');
    }
    if (!active && !(state.nativeInset && window.scrollY >= 0 && window.scrollY <= 1)) return;
    clearTimeout(timer);
    if (window.scrollY > 180) { suspend('deep-scroll'); return; }
    if (loaded && !fingerDown) timer = setTimeout(settle, 450);
  }
  function startTouch() {
    fingerDown = true;
    pulled = false;
    suspend('user-input');
    observe();
  }
  function endTouch() {
    fingerDown = false;
    if (pulled && active) {
      report('settling');
      expire();
    }
    observe();
  }
  function otherInput() { pulled = false; suspend('user-input'); }
  function ready() {
    loaded = true;
    if (active && !expiry) expire();
    observe();
  }
  function leave(event) {
    suspend('pagehide');
    if (event?.persisted) { fingerDown = false; pulled = false; return; }
    window.removeEventListener('scroll', observe);
    window.removeEventListener('resize', observe);
    window.removeEventListener('load', ready);
    window.removeEventListener('pageshow', ready);
    window.removeEventListener('touchstart', startTouch);
    window.removeEventListener('touchmove', observe);
    window.removeEventListener('touchend', endTouch);
    window.removeEventListener('touchcancel', endTouch);
    window.removeEventListener('wheel', otherInput);
    window.removeEventListener('keydown', otherInput);
    window.removeEventListener('pagehide', leave);
    window.visualViewport?.removeEventListener('scroll', observe);
    window.visualViewport?.removeEventListener('resize', observe);
  }
  window.addEventListener('scroll', observe, { passive: true });
  window.addEventListener('resize', observe, { passive: true });
  window.addEventListener('load', ready, { passive: true });
  window.addEventListener('pageshow', ready, { passive: true });
  window.addEventListener('touchstart', startTouch, { passive: true });
  window.addEventListener('touchmove', observe, { passive: true });
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });
  window.addEventListener('wheel', otherInput, { passive: true });
  window.addEventListener('keydown', otherInput);
  window.addEventListener('pagehide', leave);
  window.visualViewport?.addEventListener('scroll', observe, { passive: true });
  window.visualViewport?.addEventListener('resize', observe, { passive: true });
  window.__MLT_RECORD_VIEWPORT__?.('refresh-' + state.status);
  if (loaded) ready();
})();`;
