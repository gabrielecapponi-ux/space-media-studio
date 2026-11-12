import { createEntryShell } from './entry-shell.js';

const profiles = new Set(['desktop', 'hd', 'portrait']);
const constructionDuration = 4800;

// The historical export name is retained; this controller now serves every
// viewport. A decoded studio film or the real Blender rig completes the entry.
export function createMobileStudio({ signal: parentSignal, video: water, base, preference, profile = 'desktop', drawScreen, prepareWater, onComplete }) {
  if (parentSignal?.aborted) return { ready: Promise.resolve({ status: 'disposed' }), dispose() {} };
  const selectedProfile = profiles.has(profile) ? profile : 'desktop';
  const posterProfile = selectedProfile === 'portrait' ? 'portrait' : 'desktop';
  const shell = createEntryShell();
  shell.root.classList.add('studio-entry--film');
  shell.root.dataset.studioProfile = selectedProfile;
  shell.root.dataset.studioPlayback = 'film-loading';
  shell.root.dataset.studioFrame = 'false';
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const html = document.documentElement;
  const focusBefore = document.activeElement;
  const overflowBefore = html.style.overflow;
  const underlay = [...document.body.children].filter(node => node !== shell.root);
  const previousInert = new Map(underlay.map(node => [node, node.inert]));
  const connection = navigator.connection;
  const poster = document.createElement('img');
  poster.className = 'entry-studio-poster';
  poster.alt = '';
  poster.setAttribute('aria-hidden', 'true');
  poster.decoding = 'async';
  poster.fetchPriority = 'high';
  const video = document.createElement('video');
  video.className = 'entry-studio-film';
  video.dataset.profile = selectedProfile;
  video.autoplay = true;
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.preload = 'auto';
  let frame = 0;
  let videoFrame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let fallbackTime = 0;
  let fallbackFinalPose = false;
  let decodedTime;
  let lastMediaTime = 0;
  let stalledTime = 0;
  let readyTime = 0;
  let exitTime = 0;
  let playbackRequested = false;
  let constructing = false;
  let filmPresented = false;
  let constructed = false;
  let fallback = false;
  let fallbackReady = false;
  let fallbackArt = false;
  let fallbackRoom;
  let finalFrame;
  let fallbackObserver;
  let waterPrepared = false;
  let waterUnavailable = false;
  let waterRequested = false;
  let disposed = false;
  let phase = 'loading';
  let progress = 0;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  shell.sceneHost.append(poster, video);
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
  function cancelVideoFrame() {
    if (videoFrame) video.cancelVideoFrameCallback?.(videoFrame);
    videoFrame = 0;
  }
  function finish(status) {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame); frame = 0;
    cancelVideoFrame();
    lifetime.abort();
    parentSignal?.removeEventListener('abort', dispose);
    fallbackObserver?.disconnect();
    fallbackObserver = undefined;
    fallbackRoom?.dispose();
    fallbackRoom = undefined;
    if (finalFrame) { finalFrame.width = 0; finalFrame.height = 0; finalFrame.remove(); finalFrame = undefined; }
    video.pause();
    video.removeAttribute('src');
    video.load();
    poster.removeAttribute('src');
    shell.dispose();
    underlay.forEach(node => { if (node.isConnected) node.inert = previousInert.get(node); });
    html.classList.remove('entry-pending');
    if (html.style.overflow === 'hidden') html.style.overflow = overflowBefore;
    html.dataset.entryState = status;
    const destination = focusBefore?.isConnected && focusBefore !== document.body
      ? focusBefore : document.querySelector('#main') || document.querySelector('main');
    destination?.focus({ preventScroll: true });
    const result = { status, degraded: fallbackArt || waterUnavailable || status === 'timeout' || status === 'unavailable', videoPrepared: waterPrepared };
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
  function showFilmFrame() {
    videoFrame = 0;
    if (disposed || fallback || document.hidden || video.readyState < 2) return;
    filmPresented = true;
    poster.hidden = true;
    shell.root.dataset.studioFrame = 'true';
    shell.root.dataset.studioPlayback = 'film';
    shell.sceneHost.dataset.scene = 'ready';
  }
  function watchFirstFrame() {
    if (disposed || fallback || filmPresented || videoFrame || document.hidden) return;
    if (video.requestVideoFrameCallback) videoFrame = video.requestVideoFrameCallback(showFilmFrame);
    else if (constructing && video.readyState >= 2) showFilmFrame();
  }
  function unavailable() {
    if (disposed) return;
    fallbackArt = true;
    shell.root.dataset.studioPlayback = 'unavailable';
    // A still poster is useful while waiting, but cannot claim completed 3D
    // construction. If both media paths fail, release the accessible page.
    finish('unavailable');
  }
  function useFallback() {
    if (disposed || constructed || fallback) return;
    fallback = true;
    constructing = false;
    cancelVideoFrame();
    video.autoplay = false;
    video.pause();
    video.hidden = true;
    video.removeAttribute('src');
    video.load();
    poster.hidden = false;
    shell.root.dataset.studioFrame = 'false';
    shell.root.classList.add('studio-entry--webgl');
    shell.root.dataset.studioPlayback = 'webgl-loading';
    shell.sceneHost.dataset.scene = 'loading';
    prepare();
    request();
    Promise.all([
      import('./studio-blender-room.js'),
      fetch(base + 'models/studio-blackbox-20261112.glb', { signal }).then(response => {
        if (!response.ok) throw new Error('Studio model unavailable');
        return response.arrayBuffer();
      }),
    ]).then(([{ createStudioRoom }, modelBytes]) => {
      if (disposed || staticPresentation()) return;
      fallbackRoom = createStudioRoom(shell.sceneHost, { modelBytes, drawScreen });
      fallbackRoom.setProgress(0);
      const check = () => {
        if (disposed) return;
        const state = shell.sceneHost.dataset.scene;
        if (shell.sceneHost.dataset.source !== 'blender-glb') return unavailable();
        if (state !== 'ready' && state !== 'fallback') return;
        if (state !== 'ready') return unavailable();
        fallbackReady = true;
        shell.root.dataset.studioPlayback = 'blender-webgl';
        shell.root.dataset.studioFrame = 'true';
        poster.hidden = true;
        request();
      };
      fallbackObserver = new MutationObserver(check);
      fallbackObserver.observe(shell.sceneHost, { attributes: true, attributeFilter: ['data-scene', 'data-source'] });
      check();
    }).catch(() => {
      if (!disposed && !staticPresentation()) unavailable();
    });
  }
  function playStudio() {
    if (disposed || document.hidden || fallback || constructed || playbackRequested || video.readyState < 2 || !video.paused) return;
    decodedTime ??= elapsed;
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
      if (!fallback && !constructed) {
        playStudio();
        if (video.currentTime > lastMediaTime + .001) { lastMediaTime = video.currentTime; stalledTime = 0; }
        else if (constructing) stalledTime += delta;
        const noPresentedFrame = !filmPresented && decodedTime !== undefined && elapsed - decodedTime > 1800;
        if (noPresentedFrame || stalledTime > 2000 || (!constructing && elapsed > 6000)) useFallback();
      }
      if (fallback && fallbackReady) {
        fallbackTime += delta;
        const complete = fallbackTime >= constructionDuration;
        fallbackRoom?.setProgress(Math.min(1, fallbackTime / constructionDuration));
        // Give the renderer one animation frame to paint the final pose before
        // the percentage announces completion; no separate zoom is performed.
        constructed = complete && fallbackFinalPose;
        fallbackFinalPose = complete;
      }
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : constructionDuration / 1000;
      const construction = fallback ? Math.min(1, fallbackTime / constructionDuration) : Math.min(1, video.currentTime / duration);
      const target = (video.readyState >= 2 || fallbackReady ? 18 : 0) + construction * 72 + (waterPrepared ? 9 : 0);
      progress = Math.max(progress, Math.min(99, target));
      const label = constructed ? 'Prepariamo il primo fotogramma' : construction < .25 ? 'La luce prende forma'
        : construction < .55 ? 'Costruiamo lo spazio' : construction < .8 ? 'Accendiamo lo studio' : 'Benvenuto in Space';
      shell.update(progress, label);
      if (constructed && waterUnavailable) return finish('unavailable');
      if (constructed && waterPrepared) {
        phase = 'ready';
        shell.root.dataset.ready = 'true';
        shell.update(100, 'Il tuo spazio è pronto');
      }
    }
    request();
  }
  function dispose() { finish('disposed'); }
  video.addEventListener('loadeddata', () => { decodedTime ??= elapsed; prepare(); playStudio(); }, { signal });
  video.addEventListener('canplay', playStudio, { signal });
  video.addEventListener('playing', () => { constructing = true; watchFirstFrame(); prepare(); }, { signal });
  video.addEventListener('ended', () => {
    if (disposed || fallback) return;
    if (!filmPresented) return useFallback();
    // Retain the actual last decoded frame during the 100% hold. Safari can
    // otherwise draw native replay controls over an ended, controls-free video.
    try {
      const still = document.createElement('canvas');
      still.width = video.videoWidth; still.height = video.videoHeight;
      const context = still.getContext('2d', { alpha: false });
      if (context && still.width && still.height) {
        context.drawImage(video, 0, 0);
        still.className = 'entry-studio-hold';
        still.setAttribute('aria-hidden', 'true');
        shell.sceneHost.append(still);
        finalFrame = still;
        video.hidden = true;
      }
    } catch { /* Keep the decoded video if a canvas is unavailable. */ }
    constructed = true;
    prepare();
  }, { signal });
  video.addEventListener('error', useFallback, { signal });
  poster.addEventListener('load', () => { shell.root.dataset.studioPoster = 'ready'; }, { signal });
  poster.addEventListener('error', () => { shell.root.dataset.studioPoster = 'error'; }, { signal });
  water?.addEventListener('play', () => { if (!disposed) water.pause(); }, { signal });
  for (const event of ['loadstart', 'emptied']) water?.addEventListener(event, () => {
    waterPrepared = false;
    waterUnavailable = false;
  }, { signal });
  for (const event of ['loadedmetadata', 'loadeddata', 'canplay', 'seeked']) water?.addEventListener(event, checkWater, { signal });
  water?.addEventListener('error', () => { waterUnavailable = true; request(); }, { signal });
  shell.skip.addEventListener('click', () => finish('skipped'), { signal });
  shell.root.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); finish('skipped'); }
    else if (event.key === 'Tab') { event.preventDefault(); shell.skip.focus({ preventScroll: true }); }
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      cancelVideoFrame();
      video.pause(); water?.pause();
    } else { playStudio(); watchFirstFrame(); request(); }
  }, { signal });
  const policyChanged = () => { if (staticPresentation()) finish('ready'); };
  preference?.addEventListener('change', policyChanged, { signal });
  connection?.addEventListener?.('change', policyChanged, { signal });
  parentSignal?.addEventListener('abort', dispose, { once: true });
  if (staticPresentation()) finish('ready');
  else {
    // Frozen for this visit: orientation changes cannot reload the construction
    // movie or replace its matching poster while the loader is still visible.
    const posterURL = base + `images/studio-cinema-20261112-${posterProfile}.webp`;
    poster.src = posterURL;
    video.poster = posterURL;
    video.src = base + `films/studio-cinema-20261112-${selectedProfile}.mp4`;
    request();
  }
  return { ready, dispose };
}
