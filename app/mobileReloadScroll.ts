/** Run in the document head, before hydration can race native scroll restoration. */
export const mobileReloadScrollScript = String.raw`(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  const mobile = matchMedia('(max-width: 1180px) and (pointer: coarse)').matches;
  if (!mobile || navigation?.type !== 'reload' || location.hash) return;

  history.scrollRestoration = 'manual';
  let cancelled = false;
  const inputs = ['touchstart', 'pointerdown', 'wheel', 'keydown'];
  const cancel = () => { cancelled = true; };
  const top = () => {
    if (!cancelled) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };
  const cleanup = () => {
    cancelled = true;
    inputs.forEach(type => window.removeEventListener(type, cancel, true));
    document.removeEventListener('DOMContentLoaded', top);
  };
  inputs.forEach(type => window.addEventListener(type, cancel, { capture: true, passive: true }));
  document.addEventListener('DOMContentLoaded', top, { once: true });
  window.addEventListener('pageshow', event => {
    // A cached history return must retain the position where the visitor left it.
    if (event.persisted) { cleanup(); return; }
    top();
    requestAnimationFrame(() => {
      top();
      requestAnimationFrame(() => { top(); cleanup(); });
    });
  }, { once: true });
  top();
})();`;
