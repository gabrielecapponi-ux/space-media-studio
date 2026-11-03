/** Owns motion below the approved opening; every scene keeps a static HTML path. */
export function installAtelierCinema({ signal, menu } = {}) {
  const life = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const portrait = matchMedia('(max-width: 760px) and (orientation: portrait)');
  const shots = [...document.querySelectorAll('.atelier-case-chapter .atelier-concept-visual, .atelier-detail-visual, .atelier-web-flow, .atelier-project-map')];
  const active = new Set();
  const players = [...document.querySelectorAll('[data-atelier-media]')].map(video => ({
    video, stage: video.closest('.atelier-media-stage'),
    button: document.querySelector(`[data-media-toggle][aria-controls="${video.id}"]`),
    visible: false, warm: false, userPaused: false, manual: false, pending: false,
  }));
  let frame = 0;
  let disposed = false;
  let suspended = false;
  const motionAllowed = () => !reduced.matches && !connection?.saveData;
  const pageAvailable = () => !document.hidden && !suspended && !menu?.open
    && !document.documentElement.classList.contains('entry-pending');

  function poster(player) {
    const path = portrait.matches ? player.video.dataset.posterMobile : player.video.dataset.posterDesktop;
    if (path) player.video.poster = new URL(path, document.baseURI).href;
    player.stage.dataset.mediaFormat = portrait.matches ? 'portrait' : 'wide';
  }
  function source(player) {
    if (player.video.getAttribute('src')) return;
    const path = portrait.matches ? player.video.dataset.srcMobile : player.video.dataset.srcDesktop;
    if (!path) return;
    player.video.src = new URL(path, document.baseURI).href;
    player.video.preload = 'auto';
    player.video.load();
  }
  function control(player) {
    if (!player.button) return;
    const playing = !player.video.paused && !player.video.ended;
    player.button.hidden = false;
    player.button.setAttribute('aria-pressed', String(playing));
    player.button.setAttribute('aria-label', playing ? 'Metti in pausa il film tipografico SPAZIO' : 'Riproduci il film tipografico SPAZIO');
    player.button.querySelector('[data-media-symbol]').textContent = playing ? 'Ⅱ' : '▷';
    player.button.querySelector('[data-media-label]').textContent = playing ? 'Pausa' : 'Riproduci';
  }
  const mayPlay = player => !disposed && pageAvailable() && player.visible && !player.userPaused
    && (motionAllowed() || player.manual);
  async function sync(player) {
    if (disposed) return;
    if (player.warm && motionAllowed() && pageAvailable()) source(player);
    if (!mayPlay(player)) { player.video.pause(); control(player); return; }
    source(player);
    if (player.pending || !player.video.paused) { control(player); return; }
    player.pending = true;
    try { await player.video.play(); }
    catch { /* Poster and manual play remain useful if the browser refuses. */ }
    finally {
      player.pending = false;
      if (!mayPlay(player)) player.video.pause();
      if (!disposed) control(player);
    }
  }
  function paint() {
    frame = 0;
    if (disposed) return;
    const moving = motionAllowed() && pageAvailable();
    const narrow = innerWidth <= 700;
    active.forEach(shot => {
      const rect = shot.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
      const image = shot.matches('.atelier-web-flow, .atelier-project-map') ? null : shot.querySelector('img');
      if (image) {
        image.style.transform = moving ? `translate3d(0,${((.5 - progress) * (narrow ? 16 : 40)).toFixed(2)}px,0) scale(1.055)` : '';
      }
      shot.style.setProperty('--scene-progress', moving ? progress.toFixed(4) : '.5');
    });
  }
  function request() {
    if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(paint);
  }
  const observer = new IntersectionObserver(items => {
    items.forEach(item => {
      if (item.isIntersecting) active.add(item.target);
      else active.delete(item.target);
    });
    request();
  }, { rootMargin: '70px 0px' });
  shots.forEach(shot => observer.observe(shot));
  const warmObserver = new IntersectionObserver(items => {
    items.forEach(item => {
      const player = players.find(value => value.stage === item.target);
      if (player) { player.warm = item.isIntersecting; sync(player); }
    });
  }, { rootMargin: '320px 0px' });
  const videoObserver = new IntersectionObserver(items => {
    items.forEach(item => {
      const player = players.find(value => value.stage === item.target);
      if (player) { player.visible = item.isIntersecting && item.intersectionRatio > .14; sync(player); }
    });
  }, { threshold: [0, .14, .5] });
  players.forEach(player => {
    poster(player); player.video.muted = true; control(player);
    warmObserver.observe(player.stage); videoObserver.observe(player.stage);
    player.button?.addEventListener('click', () => {
      if (!player.video.paused || player.pending) { player.userPaused = true; player.manual = false; }
      else { player.userPaused = false; player.manual = true; }
      sync(player);
    }, { signal: life.signal });
    ['play', 'pause', 'ended', 'error'].forEach(type => player.video.addEventListener(type, () => control(player), { signal: life.signal }));
  });
  function refresh() { players.forEach(sync); request(); }
  function policyChanged() {
    players.forEach(player => { player.manual = false; });
    if (!motionAllowed()) shots.forEach(shot => {
      const image = shot.querySelector('img'); if (image) image.style.transform = '';
      shot.style.setProperty('--scene-progress', '.5');
    });
    refresh();
  }
  window.addEventListener('scroll', request, { passive: true, signal: life.signal });
  window.addEventListener('resize', request, { passive: true, signal: life.signal });
  menu?.addEventListener('toggle', refresh, { signal: life.signal });
  reduced.addEventListener('change', policyChanged, { signal: life.signal });
  connection?.addEventListener?.('change', policyChanged, { signal: life.signal });
  portrait.addEventListener('change', () => players.forEach(player => { if (!player.video.getAttribute('src')) poster(player); }), { signal: life.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    refresh();
  }, { signal: life.signal });
  const entryObserver = new MutationObserver(refresh);
  entryObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', event => {
    suspended = true; players.forEach(player => player.video.pause());
    cancelAnimationFrame(frame); frame = 0;
    if (!event.persisted) dispose();
  }, { signal: life.signal });
  window.addEventListener('pageshow', () => { suspended = false; refresh(); }, { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); frame = 0;
    players.forEach(player => player.video.pause());
    observer.disconnect(); warmObserver.disconnect(); videoObserver.disconnect(); entryObserver.disconnect();
    life.abort(); signal?.removeEventListener('abort', dispose);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) dispose();
  return { refresh, dispose };
}
