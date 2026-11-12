import { chooseFilmSource, limitedFilmBandwidth } from './film-delivery.js';

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
    interrupted: false, blocked: false, buffering: false, restart: false, visit: 0,
    sourcePortrait: undefined, hasPlayed: false, controlState: '',
  }));
  let frame = 0;
  let disposed = false;
  let suspended = false;
  let requestedPlayer;
  let hoveredPlayer;
  let warmPlayer;
  const motionAllowed = () => !reduced.matches && !connection?.saveData;
  const pageAvailable = () => !document.hidden && !suspended && !menu?.open
    && !document.documentElement.classList.contains('cinema-open')
    && !document.documentElement.classList.contains('entry-pending');

  function format(player) {
    const value = portrait.matches ? 'portrait' : 'wide';
    if (player.stage.dataset.mediaFormat !== value) player.stage.dataset.mediaFormat = value;
  }
  function autoplay(player, value) {
    if (player.video.autoplay !== value) player.video.autoplay = value;
  }
  function ready(player, value) {
    const state = String(value);
    if (player.stage.dataset.mediaReady !== state) player.stage.dataset.mediaReady = state;
  }
  function poster(player) {
    // The responsive HTML picture owns the static arrival. Native posters are
    // prepared only near the viewport and stay paired with a loaded film.
    const sourcePortrait = player.video.getAttribute('src') ? player.sourcePortrait ?? portrait.matches : portrait.matches;
    const path = sourcePortrait ? player.video.dataset.posterMobile : player.video.dataset.posterDesktop;
    if (!path) return;
    const url = new URL(path, document.baseURI).href;
    if (player.video.poster !== url) player.video.poster = url;
  }
  function presentation(player) {
    // Keep the picture until decoding is ready; an opaque video surface then
    // covers its whole box, including letterboxing after a device rotation.
    ready(player, player.video.readyState >= 2 && !player.video.error);
  }
  function source(player) {
    const current = player.video.getAttribute('src');
    if (current && (player.hasPlayed || player.sourcePortrait === portrait.matches)) return;
    const path = chooseFilmSource(player.video, portrait.matches);
    if (!path) return;
    const url = new URL(path, document.baseURI).href;
    player.sourcePortrait = portrait.matches;
    // An unseen prewarm may rotate before its first frame is played. Keep its
    // poster paired with the replacement source; a watched film stays intact.
    if (current === url) { poster(player); return; }
    if (current) {
      player.visit++;
      if (player.pending) player.interrupted = true;
    }
    ready(player, false);
    player.video.src = url;
    poster(player);
    player.video.preload = 'auto';
    player.video.load();
  }
  function prepareNearby() {
    if (disposed || !motionAllowed() || !pageAvailable()) return;
    if (!portrait.matches) {
      warmPlayer = undefined;
      if (!limitedFilmBandwidth()) players.forEach(player => { if (player.warm) source(player); });
      return;
    }
    const foreground = foregroundPlayer();
    if (foreground?.video.dataset.startBufferMobile && foreground.sourcePortrait
      && bufferedAhead(foreground) < foreground.video.duration - foreground.video.currentTime - .1) return;
    // One unseen portrait film can prepare ahead of the viewport. Keep that
    // slot until it is visited or leaves the warm range, rather than walking
    // through every neighbour on successive readiness/observer callbacks.
    if (warmPlayer && (!warmPlayer.warm || warmPlayer.visible || warmPlayer.hasPlayed)) warmPlayer = undefined;
    if (!warmPlayer) warmPlayer = players.find(player => player.warm && !player.visible && !player.hasPlayed && !player.userPaused
      && player.stage.getBoundingClientRect().top >= 0);
    if (warmPlayer) source(warmPlayer);
  }
  function control(player) {
    if (!player.button) return;
    const failed = Boolean(player.video.error);
    const playing = !failed && !player.video.paused && !player.video.ended;
    const loading = !failed && (player.buffering || player.pending && player.video.readyState < 2);
    const subject = player.video.dataset.mediaLabel || 'il film 3D';
    const state = `${failed}/${playing}/${loading}/${subject}`;
    if (player.controlState === state) return;
    player.controlState = state;
    if (player.button.hidden) player.button.hidden = false;
    const pressed = String(playing);
    const description = `${failed ? 'Riprova a riprodurre' : loading ? 'Interrompi il caricamento:' : playing ? 'Metti in pausa' : 'Riproduci'} ${subject}`;
    if (player.button.getAttribute('aria-pressed') !== pressed) player.button.setAttribute('aria-pressed', pressed);
    if (player.button.getAttribute('aria-label') !== description) player.button.setAttribute('aria-label', description);
    const symbol = player.button.querySelector('[data-media-symbol]');
    const label = player.button.querySelector('[data-media-label]');
    const icon = failed ? '↻' : playing || loading ? 'Ⅱ' : '▷';
    const text = failed ? 'Riprova' : loading ? 'Caricamento…' : playing ? 'Pausa' : 'Riproduci';
    if (symbol.textContent !== icon) symbol.textContent = icon;
    if (label.textContent !== text) label.textContent = text;
  }
  function foregroundPlayer() {
    const eligible = player => player.visible && !player.userPaused && (motionAllowed() || player.manual);
    if (requestedPlayer && eligible(requestedPlayer)) return requestedPlayer;
    if (hoveredPlayer && eligible(hoveredPlayer)) return hoveredPlayer;
    return players.reduce((winner, player) => eligible(player) && (!winner || player.ratio > winner.ratio) ? player : winner, undefined);
  }
  const mayPlay = player => !disposed && pageAvailable() && player === foregroundPlayer();

  function bufferedAhead(player) {
    const video = player.video;
    for (let i = 0; i < (video.buffered?.length || 0); i++) {
      if (video.buffered.start(i) <= video.currentTime + .05 && video.buffered.end(i) > video.currentTime)
        return video.buffered.end(i) - video.currentTime;
    }
    return 0;
  }
  function startupBuffered(player) {
    const seconds = player.sourcePortrait ? Number(player.video.dataset.startBufferMobile) || 0 : 0;
    return !seconds || player.hasPlayed || bufferedAhead(player) >= Math.min(seconds, player.video.duration || seconds) - .05;
  }

  function rewind(player) {
    if (!player.restart || player.video.readyState < 1) return;
    try {
      if (player.video.currentTime !== 0) player.video.currentTime = 0;
      player.restart = false;
    } catch { /* loadedmetadata will finish a deferred seek. */ }
  }

  function newVisit(player) {
    if (!motionAllowed()) return;
    player.visit++;
    player.restart = true;
    player.userPaused = false;
    player.manual = false;
    player.blocked = false;
    if (player.pending) player.interrupted = true;
    player.video.pause();
    if (player.video.error) player.video.load();
    rewind(player);
  }

  async function sync(player) {
    if (disposed) return;
    if (player.warm || player.visible || player.manual) poster(player);
    const permitted = mayPlay(player);
    // Keep the native inline autoplay hint in step with our foreground policy.
    // This also lets WebKit resume an eligible muted film when decoding starts.
    autoplay(player, permitted && motionAllowed() && !player.blocked && !player.video.error && startupBuffered(player));
    if (!permitted) {
      player.buffering = false;
      if (player.pending) player.interrupted = true;
      player.video.pause(); control(player); return;
    }
    source(player);
    rewind(player);
    player.buffering = !startupBuffered(player);
    if (player.buffering) { autoplay(player, false); player.video.pause(); control(player); return; }
    // Wait for the decoded, visible picture on desktop too. Calling play()
    // during metadata discovery can turn a cold arrival into a policy refusal.
    if (!player.manual && player.video.readyState < 2) { control(player); return; }
    if (player.blocked || player.video.error) { control(player); return; }
    if (player.pending || !player.video.paused) {
      if (player.pending && player.video.paused) player.interrupted = true;
      control(player); return;
    }
    player.pending = true; player.interrupted = false;
    const attempt = player.visit;
    try { await player.video.play(); }
    catch (error) {
      // Do not loop on a real autoplay policy refusal. A later explicit play
      // clears it; AbortError from our own pause/load is recoverable instead.
      if (attempt === player.visit) player.blocked = error?.name === 'NotAllowedError';
      if (player.blocked) autoplay(player, false);
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
    if (active.size && !frame && !disposed && !document.hidden) frame = requestAnimationFrame(paint);
  }
  const observer = new IntersectionObserver(items => {
    items.forEach(item => {
      if (item.isIntersecting) active.add(item.target);
      else active.delete(item.target);
    });
    request();
  }, { rootMargin: '70px 0px' });
  shots.forEach(shot => { if (!shot.matches('.atelier-service-film, .atelier-web-flow, .atelier-project-map')) observer.observe(shot); });
  const warmObserver = new IntersectionObserver(items => {
    items.forEach(item => {
      const player = players.find(value => value.stage === item.target);
      if (player) player.warm = item.isIntersecting;
    });
    syncPlayers();
  }, { rootMargin: '320px 0px' });
  const videoObserver = new IntersectionObserver(items => {
    items.forEach(item => {
      const player = players.find(value => value.stage === item.target);
      if (player) {
        // Different entry/exit thresholds avoid restarting around a single
        // boundary while a visitor makes small scroll adjustments.
        const visible = item.isIntersecting && item.intersectionRatio > (player.visible ? .025 : .14);
        if (visible && !player.visible) newVisit(player);
        player.visible = visible;
        player.ratio = item.intersectionRatio;
        if (!visible) {
          if (requestedPlayer === player) requestedPlayer = undefined;
          if (hoveredPlayer === player) hoveredPlayer = undefined;
        }
      }
    });
    syncPlayers();
  }, { threshold: [0, .025, .14, .35, .5, .75, 1] });
  players.forEach(player => {
    format(player);
    player.video.muted = true; player.video.defaultMuted = true;
    player.video.playsInline = true; autoplay(player, false);
    control(player);
    warmObserver.observe(player.stage); videoObserver.observe(player.stage);
    // A visit belongs to the picture. Entering a transport button must not
    // rewind/seek the film immediately before that button toggles playback.
    const hoverTarget = player.stage.querySelector('.atelier-film-surface') || player.stage;
    hoverTarget.addEventListener('pointerenter', event => {
      if (!['mouse', 'pen'].includes(event.pointerType) || !motionAllowed() || !pageAvailable()) return;
      // A pointer over the picture identifies the intended film even when
      // another chapter occupies more of the viewport.
      player.visible = true;
      hoveredPlayer = player;
      requestedPlayer = undefined;
      newVisit(player);
      syncPlayers();
    }, { signal: life.signal });
    hoverTarget.addEventListener('pointerleave', () => {
      if (hoveredPlayer !== player) return;
      hoveredPlayer = undefined;
      syncPlayers();
    }, { signal: life.signal });
    player.stage.addEventListener('click', event => {
      // Capture also covers the separate cinema control before it reads the
      // inline poster, even if observers have not delivered their first entry.
      if (event.target.closest?.('[data-media-toggle], .atelier-cinema-open')) poster(player);
    }, { capture: true, signal: life.signal });
    player.button?.addEventListener('click', () => {
      // WebKit can leave paused=false after a failed resource and a rejected
      // play promise. The first explicit retry must reload, not toggle pause.
      if (!player.video.error && (!player.video.paused || player.pending || player.buffering)) { player.userPaused = true; player.manual = false; }
      else {
        player.userPaused = false; player.manual = true;
        player.blocked = false;
        requestedPlayer = player;
        // A transient network failure needs a new load, only on explicit retry.
        if (player.video.error) player.video.load();
      }
      syncPlayers();
    }, { signal: life.signal });
    player.video.addEventListener('play', () => {
      if (!mayPlay(player) || !startupBuffered(player)) player.video.pause();
      else rewind(player);
      presentation(player);
      control(player);
    }, { signal: life.signal });
    ['pause', 'ended'].forEach(type => player.video.addEventListener(type, () => control(player), { signal: life.signal }));
    ['emptied', 'error'].forEach(type => player.video.addEventListener(type, () => {
      if (type === 'error') { autoplay(player, false); player.video.pause(); }
      ready(player, false); control(player);
    }, { signal: life.signal }));
    player.video.addEventListener('loadedmetadata', () => rewind(player), { signal: life.signal });
    player.video.addEventListener('progress', () => { sync(player); prepareNearby(); }, { signal: life.signal });
    ['loadeddata', 'canplay', 'playing'].forEach(type => player.video.addEventListener(type, () => {
      if (type === 'playing' && !player.video.paused && mayPlay(player)) player.hasPlayed = true;
      presentation(player); sync(player);
    }, { signal: life.signal }));
  });
  function syncPlayers() { players.forEach(sync); prepareNearby(); }
  function refresh() { syncPlayers(); request(); }
  function recoverFromGesture(event) {
    if (!event.isTrusted || !motionAllowed() || !pageAvailable()) return;
    if (event.target?.closest?.('[data-media-toggle], .atelier-cinema-open, #atelier-film-toggle, #atelier-film-replay')) return;
    const player = foregroundPlayer();
    if (!player?.blocked) return;
    player.blocked = false;
    player.manual = true;
    sync(player);
  }
  document.addEventListener('pointerdown', recoverFromGesture, { signal: life.signal });
  document.addEventListener('keydown', recoverFromGesture, { signal: life.signal });
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
      autoplay(player, false); player.video.pause();
    });
    cancelAnimationFrame(frame); frame = 0;
    if (!event.persisted) dispose();
  }, { signal: life.signal });
  window.addEventListener('pageshow', () => { suspended = false; refresh(); }, { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); frame = 0;
    players.forEach(player => { autoplay(player, false); player.video.pause(); });
    observer.disconnect(); warmObserver.disconnect(); videoObserver.disconnect(); entryObserver.disconnect();
    life.abort(); signal?.removeEventListener('abort', dispose);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) dispose();
  return { refresh, dispose };
}
