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
    visible: false, ratio: 0, warm: false, userPaused: false, manual: false, pending: false,
    interrupted: false, blocked: false,
  }));
  let frame = 0;
  let disposed = false;
  let suspended = false;
  let requestedPlayer;
  const motionAllowed = () => !reduced.matches && !connection?.saveData;
  const pageAvailable = () => !document.hidden && !suspended && !menu?.open
    && !document.documentElement.classList.contains('cinema-open')
    && !document.documentElement.classList.contains('entry-pending');

  function format(player) {
    player.stage.dataset.mediaFormat = portrait.matches ? 'portrait' : 'wide';
  }
  function poster(player) {
    // The responsive HTML picture owns the static arrival. Native posters are
    // prepared only near the viewport and stay paired with a loaded film.
    if (player.video.getAttribute('src') && player.video.poster) return;
    const path = portrait.matches ? player.video.dataset.posterMobile : player.video.dataset.posterDesktop;
    if (!path) return;
    const url = new URL(path, document.baseURI).href;
    if (player.video.poster !== url) player.video.poster = url;
  }
  function presentation(player) {
    // Keep the picture until decoding is ready; an opaque video surface then
    // covers its whole box, including letterboxing after a device rotation.
    player.stage.dataset.mediaReady = String(player.video.readyState >= 2 && !player.video.error);
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
    const subject = player.video.dataset.mediaLabel || 'il film 3D';
    player.button.setAttribute('aria-label', `${playing ? 'Metti in pausa' : 'Riproduci'} ${subject}`);
    player.button.querySelector('[data-media-symbol]').textContent = playing ? 'Ⅱ' : '▷';
    player.button.querySelector('[data-media-label]').textContent = playing ? 'Pausa' : 'Riproduci';
  }
  function foregroundPlayer() {
    const eligible = player => player.visible && !player.userPaused && (motionAllowed() || player.manual);
    if (requestedPlayer && eligible(requestedPlayer)) return requestedPlayer;
    return players.reduce((winner, player) => eligible(player) && (!winner || player.ratio > winner.ratio) ? player : winner, undefined);
  }
  const mayPlay = player => !disposed && pageAvailable() && player === foregroundPlayer();
  async function sync(player) {
    if (disposed) return;
    if (player.warm || player.visible || player.manual) poster(player);
    const permitted = mayPlay(player);
    // Keep the native inline autoplay hint in step with our foreground policy.
    // This also lets WebKit resume an eligible muted film when decoding starts.
    player.video.autoplay = permitted && motionAllowed() && !player.blocked;
    if (player.warm && motionAllowed() && pageAvailable()) source(player);
    if (!permitted) {
      if (player.pending) player.interrupted = true;
      player.video.pause(); control(player); return;
    }
    source(player);
    if (player.blocked || player.video.error) { control(player); return; }
    if (player.pending || !player.video.paused) {
      if (player.pending && player.video.paused) player.interrupted = true;
      control(player); return;
    }
    player.pending = true; player.interrupted = false;
    try { await player.video.play(); }
    catch (error) {
      // Do not loop on a real autoplay policy refusal. A later explicit play
      // clears it; AbortError from our own pause/load is recoverable instead.
      player.blocked = error?.name === 'NotAllowedError';
      if (player.blocked) player.video.autoplay = false;
    }
    finally {
      player.pending = false;
      const resume = player.interrupted && mayPlay(player) && player.video.paused
        && !player.blocked && !player.video.error;
      player.interrupted = false;
      if (!mayPlay(player)) player.video.pause();
      if (!disposed) control(player);
      // A menu/visibility cycle may restore permission before the interrupted
      // play promise settles. Reconcile once, after the old request releases.
      if (resume) sync(player);
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
      const image = shot.matches('.atelier-service-film, .atelier-web-flow, .atelier-project-map') ? null : shot.querySelector('img');
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
      if (player) {
        player.visible = item.isIntersecting && item.intersectionRatio > .14;
        player.ratio = item.intersectionRatio;
      }
    });
    players.forEach(sync);
  }, { threshold: [0, .14, .5, .75, 1] });
  players.forEach(player => {
    format(player);
    player.video.muted = true; player.video.defaultMuted = true;
    player.video.playsInline = true; player.video.autoplay = false;
    control(player);
    warmObserver.observe(player.stage); videoObserver.observe(player.stage);
    player.stage.addEventListener('click', event => {
      // Capture also covers the separate cinema control before it reads the
      // inline poster, even if observers have not delivered their first entry.
      if (event.target.closest?.('[data-media-toggle], .atelier-cinema-open')) poster(player);
    }, { capture: true, signal: life.signal });
    player.button?.addEventListener('click', () => {
      if (!player.video.paused || player.pending) { player.userPaused = true; player.manual = false; }
      else {
        player.userPaused = false; player.manual = true;
        player.blocked = false;
        requestedPlayer = player;
        // A transient network failure needs a new load, only on explicit retry.
        if (player.video.error) player.video.load();
      }
      players.forEach(sync);
    }, { signal: life.signal });
    player.video.addEventListener('play', () => {
      if (!mayPlay(player)) player.video.pause();
      presentation(player);
      control(player);
    }, { signal: life.signal });
    ['pause', 'ended'].forEach(type => player.video.addEventListener(type, () => control(player), { signal: life.signal }));
    ['emptied', 'error'].forEach(type => player.video.addEventListener(type, () => {
      player.stage.dataset.mediaReady = 'false'; control(player);
    }, { signal: life.signal }));
    ['loadeddata', 'canplay', 'playing'].forEach(type => player.video.addEventListener(type, () => {
      presentation(player); sync(player);
    }, { signal: life.signal }));
  });
  function refresh() { players.forEach(sync); request(); }
  function policyChanged() {
    requestedPlayer = undefined;
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
  portrait.addEventListener('change', () => {
    players.forEach(format);
    refresh();
  }, { signal: life.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    refresh();
  }, { signal: life.signal });
  const entryObserver = new MutationObserver(refresh);
  entryObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', event => {
    suspended = true;
    players.forEach(player => {
      if (player.pending) player.interrupted = true;
      player.video.autoplay = false; player.video.pause();
    });
    cancelAnimationFrame(frame); frame = 0;
    if (!event.persisted) dispose();
  }, { signal: life.signal });
  window.addEventListener('pageshow', () => { suspended = false; refresh(); }, { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); frame = 0;
    players.forEach(player => { player.video.autoplay = false; player.video.pause(); });
    observer.disconnect(); warmObserver.disconnect(); videoObserver.disconnect(); entryObserver.disconnect();
    life.abort(); signal?.removeEventListener('abort', dispose);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) dispose();
  return { refresh, dispose };
}
