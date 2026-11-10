import './atelier-osken-motion.css';

// Adapted for Space from the licensed OSKEN ProjectDeck / Showreel, v1.0.0.
// Source and acquisition receipt: outputs/horizon-osken-20261105/.
// The frame stays on its original plane throughout a short exposure entrance.
export function installOskenMotion({ signal, menu } = {}) {
  if (signal?.aborted) return;
  const life = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 992px) and (min-height: 560px)');
  const connection = navigator.connection;
  const shots = [...document.querySelectorAll('[data-atelier-media]')].map(video => ({
    surface: video.closest('.atelier-film-surface') || video,
    stage: video.closest('.atelier-media-stage'), visible: false,
    pendingEntrance: false, animation: null,
  }));
  let disposed = false;
  let suspended = false;
  const allowed = () => desktop.matches && !reduced.matches && !connection?.saveData;
  const available = () => !document.hidden && !suspended && !menu?.open
    && !document.documentElement.classList.contains('entry-pending')
    && !document.documentElement.classList.contains('cinema-open');

  function release(shot) {
    shot.surface.style.removeProperty('will-change');
    shot.stage.classList.remove('osken-motion-frame');
  }
  function stop(shot) {
    const animation = shot.animation;
    shot.animation = null;
    animation?.cancel();
    release(shot);
  }
  function enter(shot) {
    if (disposed || !allowed() || !available() || !shot.visible
      || shot.stage.contains(document.activeElement) || !shot.surface.animate) return;
    stop(shot);
    shot.pendingEntrance = false;
    shot.stage.classList.add('osken-motion-frame');
    // Keep every pixel of the composition against the aperture. Depth belongs
    // to the film; moving its rectangular surface would expose the backing.
    shot.surface.style.willChange = 'opacity';
    const animation = shot.surface.animate([
      { opacity: .88 },
      { opacity: 1 },
    ], { duration: 420, easing: 'cubic-bezier(.2,.72,.18,1)', fill: 'none' });
    shot.animation = animation;
    const finish = () => {
      if (shot.animation !== animation) return;
      shot.animation = null;
      release(shot);
    };
    animation.finished.then(finish, finish);
  }
  function sync() {
    if (disposed) return;
    if (!allowed() || !available()) { shots.forEach(stop); return; }
    shots.forEach(shot => { if (shot.pendingEntrance) enter(shot); });
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const shot = shots.find(item => item.stage === entry.target);
      if (!shot) continue;
      const visible = entry.isIntersecting && entry.intersectionRatio > (shot.visible ? .025 : .14);
      if (visible === shot.visible) continue;
      shot.visible = visible;
      shot.pendingEntrance = visible;
      if (visible) enter(shot);
      else stop(shot);
    }
  }, { threshold: [0, .025, .14] });
  shots.forEach(shot => {
    observer.observe(shot.stage);
    // Hover replay is owned by atelier-cinema; it must not dim or move the
    // surface again while the visitor is already looking at this film.
    shot.stage.addEventListener('focusin', () => {
      shot.pendingEntrance = false;
      stop(shot);
    }, { signal: life.signal });
  });
  for (const preference of [reduced, desktop, connection]) preference?.addEventListener?.('change', sync, { signal: life.signal });
  menu?.addEventListener('toggle', sync, { signal: life.signal });
  document.addEventListener('visibilitychange', sync, { signal: life.signal });
  const pageState = new MutationObserver(sync);
  pageState.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', () => {
    suspended = true;
    shots.forEach(stop);
  }, { signal: life.signal });
  window.addEventListener('pageshow', () => { suspended = false; sync(); }, { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect(); pageState.disconnect(); life.abort(); shots.forEach(stop);
    signal?.removeEventListener('abort', dispose);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  return { dispose };
}
