/** Read-only, opt-in measurements. No scrolling, layout changes or network calls. */
export const viewportDiagnosticScript = String.raw`(() => {
  if (new URLSearchParams(location.search).get('viewport-debug') !== '1') return;
  const log = window.__MLT_VIEWPORT_LOG__ = [];
  const round = value => value == null ? null : Math.round(value * 100) / 100;
  const record = event => {
    const viewport = window.visualViewport;
    const header = document.querySelector('header');
    const hero = document.querySelector('[class*="videoHero"], .light-video-hero');
    const phone = document.querySelector('[class*="phone"]');
    const sample = {
      event: typeof event === 'string' ? event : event.type,
      time: Math.round(performance.now()),
      navigation: performance.getEntriesByType('navigation')[0]?.type,
      documentY: round(window.scrollY),
      rootY: round(document.scrollingElement?.scrollTop),
      phoneY: round(phone?.scrollTop),
      visualY: round(viewport?.offsetTop),
      visualPageY: round(viewport?.pageTop),
      visualHeight: round(viewport?.height),
      scale: round(viewport?.scale),
      windowHeight: window.innerHeight,
      headerTop: round(header?.getBoundingClientRect().top),
      heroTop: round(hero?.getBoundingClientRect().top),
      heroHeight: round(hero?.getBoundingClientRect().height),
      fonts: document.fonts?.status,
      persisted: !!event.persisted,
      refreshStatus: window.__MLT_REFRESH_STATE__?.status || null,
      refreshAttempts: window.__MLT_REFRESH_STATE__?.attempts || 0,
      nativeTopInset: window.__MLT_REFRESH_STATE__?.nativeInset || 0,
      refreshMode: window.__MLT_REFRESH_STATE__?.mode || 'native',
      preventedMoves: window.__MLT_REFRESH_STATE__?.preventedMoves || 0
    };
    if (sample.event === 'scroll' && log.length && sample.time - log[log.length - 1].time < 100) return;
    log.push(sample);
    // Preserve startup evidence when toolbar animation emits dozens of resize events.
    if (log.length > 240) log.splice(60, 1);
  };
  window.__MLT_RECORD_VIEWPORT__ = record;
  ['load', 'pageshow', 'resize', 'scroll', 'touchstart', 'touchend', 'pagehide'].forEach(type => window.addEventListener(type, record, { passive: true }));
  window.visualViewport?.addEventListener('resize', () => record('visual-resize'), { passive: true });
  window.visualViewport?.addEventListener('scroll', () => record('visual-scroll'), { passive: true });
  document.addEventListener('DOMContentLoaded', () => record('dom-ready'), { once: true });
  document.fonts?.ready.then(() => record('fonts-ready'));
  record('head');
})();`;
