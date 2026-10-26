/** Keep native GSA rubber-banding out of the document while preserving pull-to-refresh. */
export const managedPullRefreshScript = String.raw`(() => {
  if (!/iPhone|iPod/.test(navigator.userAgent) || !/\bGSA\//.test(navigator.userAgent) ||
      !matchMedia('(pointer: coarse)').matches) return;
  const options = new URLSearchParams(location.search);
  if (options.get('viewport-debug') === '1' && options.get('refresh-mode') === 'raw') return;
  if (!/^\/(en|de|ru|it|pl)\/(?!account(?:\/|$))/.test(location.pathname)) return;
  if (window.__MLT_MANAGED_REFRESH__) return;
  window.__MLT_MANAGED_REFRESH__ = true;
  document.documentElement.classList.add('mlt-managed-refresh');
  const state = window.__MLT_REFRESH_STATE__ = { status: 'managed-ready', mode: 'managed', attempts: 0, nativeInset: 0, preventedMoves: 0 };
  const report = status => {
    if (state.status === status) return;
    state.status = status;
    window.__MLT_RECORD_VIEWPORT__?.('refresh-' + status);
  };
  const locale = location.pathname.split('/')[1];
  const labels = {
    en: ['Pull to refresh', 'Release to refresh', 'Refreshing…'],
    de: ['Zum Aktualisieren ziehen', 'Zum Aktualisieren loslassen', 'Wird aktualisiert…'],
    ru: ['Потяните для обновления', 'Отпустите для обновления', 'Обновление…'],
    it: ['Trascina per aggiornare', 'Rilascia per aggiornare', 'Aggiornamento…'],
    pl: ['Pociągnij, aby odświeżyć', 'Puść, aby odświeżyć', 'Odświeżanie…']
  }[locale] || ['Pull to refresh', 'Release to refresh', 'Refreshing…'];
  let start;
  let distance = 0;
  let captured = false;
  let indicator;
  const hide = () => { indicator?.remove(); indicator = undefined; };
  const reset = () => { start = undefined; distance = 0; captured = false; hide(); };
  const eligible = target => {
    if (target?.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"],[data-no-pull-refresh]')) return false;
    for (let el = target; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(window.getComputedStyle(el).overflowY)) return false;
    }
    return window.getSelection?.()?.type !== 'Range';
  };
  const begin = event => {
    reset();
    if (event.touches.length !== 1 || window.scrollY > 1 ||
        Math.abs((window.visualViewport?.scale || 1) - 1) > .01 || !eligible(event.target)) return;
    const touch = event.touches[0];
    start = { x: touch.clientX, y: touch.clientY };
  };
  const move = event => {
    if (!start) return;
    if (event.touches.length !== 1) { reset(); return; }
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (!captured && (dy < -4 || Math.abs(dx) > Math.abs(dy) + 4 || window.scrollY > 1)) { reset(); return; }
    if (!captured && dy <= 4) return;
    if (!event.cancelable) { reset(); report('managed-uncancelable'); return; }
    event.preventDefault();
    if (!event.defaultPrevented) { reset(); report('managed-uncanceled'); return; }
    state.preventedMoves += 1;
    captured = true;
    distance = Math.max(0, dy);
    if (!indicator && document.body) {
      indicator = document.createElement('div');
      indicator.className = 'mlt-refresh-indicator';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      document.body.appendChild(indicator);
    }
    const label = labels[distance >= 80 ? 1 : 0];
    if (indicator && indicator.textContent !== label) indicator.textContent = label;
    report(distance >= 80 ? 'managed-armed' : 'managed-pulling');
  };
  const finish = () => {
    if (!captured || distance < 80) { reset(); report('managed-ready'); return; }
    start = undefined;
    captured = false;
    if (indicator) indicator.textContent = labels[2];
    state.attempts += 1;
    report('managed-reload');
    window.location.reload();
  };
  const cancel = () => { reset(); report('managed-ready'); };
  window.addEventListener('touchstart', begin, { passive: true, capture: true });
  window.addEventListener('touchmove', move, { passive: false, capture: true });
  window.addEventListener('touchend', finish, { passive: true, capture: true });
  window.addEventListener('touchcancel', cancel, { passive: true, capture: true });
  window.addEventListener('pagehide', cancel, { passive: true });
  window.__MLT_RECORD_VIEWPORT__?.('refresh-managed-ready');
})();`;
