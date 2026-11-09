/** Native disclosure navigation; the page keeps its normal touch scroll. */
export function installMobileNavigation({ menu, signal } = {}) {
  if (!menu || signal?.aborted) return { dispose() {} };
  const summary = menu.querySelector('summary');
  if (!summary) return { dispose() {} };
  const life = new AbortController();
  const mobile = matchMedia('(max-width: 900px)');
  const label = summary.querySelector('span');
  const closedLabel = label?.textContent || 'Menu';
  const temporaryTargets = new Set();
  let openedAt = menu.open ? window.scrollY : undefined;
  let disposed = false;

  function syncLabel() {
    const text = menu.open ? 'Chiudi' : closedLabel;
    if (label && label.textContent !== text) label.textContent = text;
  }
  function close(returnFocus = false) {
    if (menu.open) menu.open = false;
    openedAt = undefined;
    syncLabel();
    if (returnFocus) summary.focus({ preventScroll: true });
  }
  function syncState() {
    if (!mobile.matches) { close(); return; }
    if (menu.open) openedAt ??= window.scrollY;
    else openedAt = undefined;
    syncLabel();
  }
  function restoreTarget(target) {
    if (!temporaryTargets.delete(target)) return;
    if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex');
  }
  function focusDestination(link) {
    const href = link.getAttribute('href');
    if (!href?.startsWith('#') || href === '#') return;
    let id;
    try { id = decodeURIComponent(href.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target?.focus) return;
    if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      temporaryTargets.add(target);
      target.addEventListener('blur', () => restoreTarget(target), { once: true, signal: life.signal });
    }
    // The anchor retains its native hash/scroll action. Moving keyboard focus
    // without scrolling avoids a second jump after the disclosure closes.
    target.focus({ preventScroll: true });
  }

  summary.addEventListener('click', () => {
    // Capture the opening position before the native default action. A queued
    // scroll event at that same position must not immediately close the menu.
    if (!menu.open) openedAt = window.scrollY;
  }, { signal: life.signal });
  menu.addEventListener('toggle', syncState, { signal: life.signal });
  menu.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    close();
    focusDestination(link);
  }, { signal: life.signal }));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open || event.defaultPrevented) return;
    event.preventDefault();
    close(true);
  }, { signal: life.signal });
  document.addEventListener('pointerdown', event => {
    if (menu.open && !menu.contains(event.target)) close();
  }, { signal: life.signal });
  menu.addEventListener('focusout', event => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget)) close();
  }, { signal: life.signal });
  window.addEventListener('scroll', () => {
    if (menu.open && openedAt !== undefined && Math.abs(window.scrollY - openedAt) > 4) close();
  }, { passive: true, signal: life.signal });
  mobile.addEventListener('change', syncState, { signal: life.signal });
  window.addEventListener('pagehide', () => close(), { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true;
    close();
    life.abort();
    signal?.removeEventListener('abort', dispose);
    [...temporaryTargets].forEach(restoreTarget);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  syncState();
  return { dispose };
}
