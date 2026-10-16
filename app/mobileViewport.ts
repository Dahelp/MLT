/** Keep mobile navigation in the visible viewport without changing page scroll. */
export const mobileViewportScript = String.raw`(() => {
  const viewport = window.visualViewport;
  const root = document.documentElement;
  const update = () => {
    // Let native pinch zoom work normally instead of making the header follow it.
    const normalScale = !viewport || Math.abs(viewport.scale - 1) < 0.01;
    const top = normalScale && viewport ? Math.max(0, viewport.offsetTop) : 0;
    const height = normalScale && viewport ? viewport.height : window.innerHeight;
    root.style.setProperty('--mlt-visual-viewport-top', top + 'px');
    root.style.setProperty('--mlt-visible-height', height + 'px');
  };
  viewport?.addEventListener('resize', update, { passive: true });
  viewport?.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('pageshow', update);
  update();
})();`;
