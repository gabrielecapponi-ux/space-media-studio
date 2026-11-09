import { createEntryShell } from './entry-shell.js';

// The native phone decoder renders the Blender studio inside a true loading
// screen. Only completed construction and a decoded hero frame reach 100%.
export function createMobileStudio({ signal: parentSignal, video: water, base, preference, prepareWater, onComplete }) {
  if (parentSignal?.aborted) return { ready: Promise.resolve({ status: 'disposed' }), dispose() {} };
  const shell = createEntryShell();
  shell.root.classList.add('studio-entry--film');
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const html = document.documentElement;
  const focusBefore = document.activeElement;
  const overflowBefore = html.style.overflow;
  const underlay = [...document.body.children].filter(node => node !== shell.root);
  const previousInert = new Map(underlay.map(node => [node, node.inert]));
  const connection = navigator.connection;
  const video = document.createElement('video');
  video.className = 'entry-studio-film';
  video.autoplay = true;
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.preload = 'auto';
  video.poster = base + 'images/director-studio-mobile.webp';
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let fallbackTime = 0;
  let loadedTime = 0;
  let readyTime = 0;
  let exitTime = 0;
  let playbackRequested = false;
  let constructing = false;
  let constructed = false;
  let fallback = false;
  let fallbackReady = false;
  let fallbackArt = false;
  let fallbackRoom;
  let fallbackObserver;
  let waterPrepared = false;
  let waterUnavailable = false;
  let waterRequested = false;
  let disposed = false;
  let phase = 'loading';
  let progress = 0;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  shell.sceneHost.append(video);
  html.dataset.entryState = 'loading';
  html.classList.add('entry-pending');
  html.style.overflow = 'hidden';
  underlay.forEach(node => { node.inert = true; });
  shell.root.tabIndex = -1;
  shell.root.focus({ preventScroll: true });
  water?.pause();

  const staticPresentation = () => preference?.matches || Boolean(connection?.saveData);
  const request = () => {
    if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(tick);
  };
  function finish(status) {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame); frame = 0;
    lifetime.abort();
    parentSignal?.removeEventListener('abort', dispose);
    fallbackObserver?.disconnect();
    fallbackObserver = undefined;
    fallbackRoom?.dispose();
    fallbackRoom = undefined;
    video.pause();
    video.removeAttribute('src');
    video.load();
    shell.dispose();
    underlay.forEach(node => { if (node.isConnected) node.inert = previousInert.get(node); });
    html.classList.remove('entry-pending');
    if (html.style.overflow === 'hidden') html.style.overflow = overflowBefore;
    html.dataset.entryState = status;
    const destination = focusBefore?.isConnected && focusBefore !== document.body
      ? focusBefore : document.querySelector('#main') || document.querySelector('main');
    destination?.focus({ preventScroll: true });
    const result = { status, degraded: fallbackArt || waterUnavailable || status === 'timeout', videoPrepared: waterPrepared };
    resolveReady(result);
    if (status !== 'disposed') onComplete?.(result);
  }
  function prepare() {
    if (waterRequested || disposed || staticPresentation()) return;
    waterRequested = true;
    prepareWater?.();
    checkWater();
  }
  function checkWater() {
    if (disposed || !waterRequested || waterUnavailable) return;
    if (!water) { waterPrepared = true; return; }
    water.pause();
    if (water.readyState < 1) return;
    if (water.currentTime > .04) { try { water.currentTime = 0; } catch {} return; }
    if (!water.seeking && water.readyState >= 2) {
      waterPrepared = true;
      water.dataset.entryPreparedAt = '0';
    }
  }
  function useFallback() {
    if (disposed || constructed || fallback) return;
    fallback = true;
    video.autoplay = false;
    video.pause();
    video.hidden = true;
    video.removeAttribute('src');
    video.load();
    shell.root.classList.add('studio-entry--webgl');
    shell.root.dataset.studioPlayback = 'webgl-loading';
    shell.sceneHost.dataset.scene = 'loading';
    prepare();
    request();
    // Native video policy must not replace the actual studio with a flat
    // illustration. The same Blender mesh can assemble without media autoplay.
    Promise.all([
      import('./studio-blender-room.js'),
      fetch(base + 'models/studio-space-20261105.glb', { signal }).then(response => {
        if (!response.ok) throw new Error('Studio model unavailable');
        return response.arrayBuffer();
      }),
    ]).then(([{ createStudioRoom }, modelBytes]) => {
      if (disposed || staticPresentation()) return;
      fallbackRoom = createStudioRoom(shell.sceneHost, { modelBytes });
      fallbackRoom.setProgress(0);
      const check = () => {
        if (disposed) return;
        const state = shell.sceneHost.dataset.scene;
        if (state !== 'ready' && state !== 'fallback') return;
        fallbackReady = true;
        fallbackArt = state === 'fallback' || shell.sceneHost.dataset.source !== 'blender-glb';
        shell.root.dataset.studioPlayback = state === 'fallback' ? 'illustration'
          : fallbackArt ? 'procedural-webgl' : 'blender-webgl';
        fallbackObserver?.disconnect();
        fallbackObserver = undefined;
        request();
      };
      fallbackObserver = new MutationObserver(check);
      fallbackObserver.observe(shell.sceneHost, { attributes: true, attributeFilter: ['data-scene'] });
      check();
    }).catch(() => {
      if (disposed || staticPresentation()) return;
      fallbackRoom?.dispose(); fallbackRoom = undefined;
      fallbackObserver?.disconnect(); fallbackObserver = undefined;
      fallbackArt = true;
      fallbackReady = true;
      shell.sceneHost.dataset.scene = 'fallback';
      shell.root.dataset.studioPlayback = 'illustration';
      request();
    });
  }
  function playStudio() {
    if (disposed || document.hidden || fallback || constructed || playbackRequested || video.readyState < 2) return;
    shell.sceneHost.dataset.scene = 'ready';
    loadedTime = elapsed;
    playbackRequested = true;
    try {
      Promise.resolve(video.play()).catch(() => {
        if (!document.hidden) useFallback();
      }).finally(() => { playbackRequested = false; });
    } catch { playbackRequested = false; useFallback(); }
  }
  function tick(time) {
    frame = 0;
    if (disposed || document.hidden) return;
    const delta = lastTime ? Math.min(100, time - lastTime) : 16;
    lastTime = time;
    elapsed += delta;
    if (elapsed >= 12000) return finish('timeout');
    if (phase === 'ready') {
      readyTime += delta;
      if (readyTime >= 420) { phase = 'exiting'; shell.setState('exiting'); }
    } else if (phase === 'exiting') {
      exitTime += delta;
      if (exitTime >= 220) return finish('ready');
    } else {
      // Data waiting is not construction progress. Native autoplay rejection
      // uses the actual Blender scene rather than a blank or locked screen.
      if (!fallback && !constructing && ((video.readyState >= 2 && elapsed - loadedTime > 1800) || elapsed > 6000)) useFallback();
      if (fallback && fallbackReady) {
        fallbackTime += delta;
        constructed = fallbackTime >= 2650;
        fallbackRoom?.setProgress(Math.min(1, fallbackTime / 2650));
      }
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 2.8;
      const construction = fallback ? Math.min(1, fallbackTime / 2650) : Math.min(1, video.currentTime / duration);
      const target = (video.readyState >= 2 || fallback ? 18 : 0) + construction * 72 + (waterPrepared || waterUnavailable ? 9 : 0);
      progress = Math.max(progress, Math.min(99, target));
      const label = constructed ? 'Prepariamo il primo fotogramma' : construction < .25 ? 'Le pareti prendono forma'
        : construction < .55 ? 'Prepariamo le postazioni' : construction < .8 ? 'Accendiamo le connessioni' : 'Benvenuto in Space';
      shell.update(progress, label);
      if (constructed && (waterPrepared || waterUnavailable)) {
        phase = 'ready';
        shell.root.dataset.ready = 'true';
        shell.update(100, 'Il tuo spazio è pronto');
      }
    }
    request();
  }
  function dispose() { finish('disposed'); }
  video.addEventListener('loadeddata', () => { prepare(); playStudio(); }, { signal });
  video.addEventListener('canplay', playStudio, { signal });
  video.addEventListener('playing', () => { constructing = true; prepare(); }, { signal });
  video.addEventListener('ended', () => { constructed = true; prepare(); }, { signal });
  video.addEventListener('error', useFallback, { signal });
  water?.addEventListener('play', () => { if (!disposed) water.pause(); }, { signal });
  for (const event of ['loadstart', 'emptied']) water?.addEventListener(event, () => {
    waterPrepared = false;
    waterUnavailable = false;
  }, { signal });
  for (const event of ['loadedmetadata', 'loadeddata', 'canplay', 'seeked']) water?.addEventListener(event, checkWater, { signal });
  water?.addEventListener('error', () => { waterUnavailable = true; }, { signal });
  shell.skip.addEventListener('click', () => finish('skipped'), { signal });
  shell.root.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); finish('skipped'); }
    else if (event.key === 'Tab') { event.preventDefault(); shell.skip.focus({ preventScroll: true }); }
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      video.pause(); water?.pause();
    } else { playStudio(); request(); }
  }, { signal });
  const policyChanged = () => { if (staticPresentation()) finish('ready'); };
  preference?.addEventListener('change', policyChanged, { signal });
  connection?.addEventListener?.('change', policyChanged, { signal });
  parentSignal?.addEventListener('abort', dispose, { once: true });
  if (staticPresentation()) finish('ready');
  else {
    video.src = base + 'films/director-studio-mobile.mp4';
    request();
  }
  return { ready, dispose };
}
