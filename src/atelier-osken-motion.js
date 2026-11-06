import './atelier-osken-motion.css';

// Adapted for Space from the licensed OSKEN ProjectDeck / Showreel, v1.0.0.
// Source and acquisition receipt: outputs/horizon-osken-20261105/.
// Keep the document and the media controller stable: only the picture moves.
const clamp = value => Math.max(0, Math.min(1, value));

export function installOskenMotion({ signal, menu } = {}) {
  if (signal?.aborted) return;
  const life = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 992px) and (min-height: 560px)');
  const connection = navigator.connection;
  const shots = [...document.querySelectorAll('[data-atelier-media]')].map(video => ({
    video, surface: video.closest('.atelier-film-surface') || video,
    stage: video.closest('.atelier-media-stage'), progress: null,
  }));
  const active = new Set();
  let frame = 0, lastTime = 0, disposed = false, suspended = false;
  const allowed = () => desktop.matches && !reduced.matches && !connection?.saveData;
  const available = () => !document.hidden && !suspended && !menu?.open
    && !document.documentElement.classList.contains('entry-pending')
    && !document.documentElement.classList.contains('cinema-open');

  function reset(shot) {
    shot.surface.style.removeProperty('transform');
    shot.surface.style.removeProperty('border-radius');
    shot.surface.style.removeProperty('will-change');
    shot.stage.classList.remove('osken-motion-frame');
    shot.progress = null;
  }
  function paint(time) {
    frame = 0;
    if (disposed || !available()) { lastTime = 0; return; }
    if (!allowed()) { shots.forEach(reset); lastTime = 0; return; }
    // Read all stable stage bounds before writing transforms to their videos.
    // OSKEN's first depth slot (.85) settles at full size; the reel then holds.
    const measures = [...active].map(shot => ({ shot, rect: shot.stage.getBoundingClientRect() }));
    const delta = lastTime ? Math.min(64, time - lastTime) : 16.67;
    const follow = 1 - Math.exp(-delta / 65);
    lastTime = time;
    let unsettled = false;
    for (const { shot, rect } of measures) {
      const focused = shot.stage.contains(document.activeElement);
      // An editorial half-width film should be flat as soon as its whole frame
      // is on screen. Holding a tiny perspective tilt costs a texture pass on
      // every decoded video frame, even after scrolling has stopped.
      const travel = Math.min(innerHeight * .69, Math.max(1, rect.height));
      const target = focused ? 1 : clamp((innerHeight * .94 - rect.top) / travel);
      if (shot.progress === null || focused) shot.progress = target;
      else shot.progress += (target - shot.progress) * follow;
      if (Math.abs(target - shot.progress) < .0003) shot.progress = target;
      else unsettled = true;
      const grow = shot.progress;
      const depth = 1 - grow;
      shot.stage.classList.toggle('osken-motion-frame', depth > .0001);
      shot.surface.style.transform = depth > .0001 ? `translate3d(0,${(depth * 42).toFixed(2)}px,0) rotateX(${(depth * 7).toFixed(3)}deg) scale(${(.85 + grow * .15).toFixed(5)})` : '';
      shot.surface.style.borderRadius = depth > .0001 ? `${(20 * depth).toFixed(2)}px` : '';
      if (depth > .001 || target !== grow) shot.surface.style.willChange = 'transform';
      else shot.surface.style.removeProperty('will-change');
    }
    if (unsettled) frame = requestAnimationFrame(paint);
    else lastTime = 0;
  }
  function request() {
    if (!allowed()) { shots.forEach(reset); return; }
    if (!frame && !disposed && available()) frame = requestAnimationFrame(paint);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const shot = shots.find(item => item.stage === entry.target);
      if (entry.isIntersecting) active.add(shot);
      else { active.delete(shot); reset(shot); }
    }
    request();
  }, { rootMargin: '100px 0px' });
  shots.forEach(shot => observer.observe(shot.stage));
  for (const type of ['scroll', 'resize']) window.addEventListener(type, request, { passive: true, signal: life.signal });
  for (const type of ['focusin', 'focusout']) document.addEventListener(type, request, { signal: life.signal });
  for (const preference of [reduced, desktop, connection]) preference?.addEventListener?.('change', request, { signal: life.signal });
  menu?.addEventListener('toggle', request, { signal: life.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    else request();
  }, { signal: life.signal });
  const pageState = new MutationObserver(request);
  pageState.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', () => {
    suspended = true; cancelAnimationFrame(frame); frame = 0; lastTime = 0;
  }, { signal: life.signal });
  window.addEventListener('pageshow', () => { suspended = false; request(); }, { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame);
    observer.disconnect(); pageState.disconnect(); life.abort(); shots.forEach(reset);
    signal?.removeEventListener('abort', dispose);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  return { dispose };
}
