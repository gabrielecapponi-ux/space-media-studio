import { createEntryShell } from './entry-shell.js';

const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const phases = [
  [0, 'Diamo spazio alle idee'],
  [18, 'Le pareti prendono forma'],
  [38, 'Prepariamo le postazioni'],
  [62, 'Accendiamo le connessioni'],
  [82, 'La nostra visione, a colori'],
  [96, 'Benvenuto in Space'],
];

/**
 * The original studio assembly, isolated from the historical site's media.
 * ready resolves only after the overlay and GPU resources have been removed.
 * onComplete is not called for disposal/abort; the caller owns video playback.
 */
export function createAtelierEntry({ signal, video, poster, drawScreen, prepareVideo, loadModel, onComplete, startAt = 0 } = {}) {
  if (signal?.aborted) {
    const result = { status: 'disposed', degraded: false, videoPrepared: false, posterLoaded: false, sceneReady: false };
    return { ready: Promise.resolve(result), dispose() {} };
  }

  const shell = createEntryShell();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const life = new AbortController();
  const html = document.documentElement;
  const focusBefore = document.activeElement;
  const overflowBefore = html.style.overflow;
  const underlay = [...document.body.children].filter((node) => node !== shell.root);
  const originalInert = new Map(underlay.map((node) => [node, node.inert]));
  const failures = new Set();
  // Weights represent preparation work, not invented byte percentages. Video
  // progress uses real metadata/buffered ranges and finishes at a decoded seek.
  const records = new Map([
    ['fonts', { weight: 10, value: 0 }],
    ['poster', { weight: 15, value: 0 }],
    ['room', { weight: 25, value: 0 }],
    ['video', { weight: 50, value: 0 }],
  ]);
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });
  let room;
  let posterImage;
  let posterLoaded = false;
  let videoPrepared = false;
  let sceneReady = false;
  let finished = false;
  let disposed = false;
  let settled = false;
  let target = 0;
  let displayed = 0;
  let frame = 0;
  let lastTime = 0;
  let phase = 'loading';
  let phaseTime = 0;
  let assemblyTime = 0;
  let exitTimer = 0;
  let exitStatus;
  let deadlineTimer = 0;
  let deadlineStarted = 0;
  let deadlineRemaining = 12000;
  let cancelVideoWait;
  let pendingRoomObserver;

  const staticPresentation = () => preference.matches || Boolean(connection?.saveData);
  html.classList.add('entry-pending');
  html.dataset.entryState = 'loading';
  html.style.overflow = 'hidden';
  underlay.forEach((node) => { node.inert = true; });
  shell.root.tabIndex = -1;
  shell.root.focus({ preventScroll: true });
  video?.pause();
  video?.addEventListener('play', () => { if (!disposed) video.pause(); }, { signal: life.signal });

  function request() {
    if (!frame && !finished && !disposed && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function updateRecord(key, value) {
    if (finished || disposed) return;
    const record = records.get(key);
    record.value = Math.max(record.value, clamp(value));
    const entries = [...records.values()];
    target = 99 * entries.reduce((sum, item) => sum + item.weight * item.value, 0)
      / entries.reduce((sum, item) => sum + item.weight, 0);
    shell.root.dataset.loaded = target.toFixed(2);
    request();
  }

  async function task(key, work) {
    try { await work((value) => updateRecord(key, value)); }
    catch (error) {
      if (!finished && !disposed && error?.name !== 'AbortError') {
        failures.add(key);
        shell.root.dataset.fallback = String(failures.size);
      }
    } finally { updateRecord(key, 1); }
  }

  function pauseDeadline() {
    if (deadlineTimer) {
      clearTimeout(deadlineTimer);
      deadlineTimer = 0;
      deadlineRemaining = Math.max(0, deadlineRemaining - (performance.now() - deadlineStarted));
    }
  }
  function resumeDeadline() {
    if (deadlineTimer || finished || disposed || document.hidden) return;
    deadlineStarted = performance.now();
    deadlineTimer = setTimeout(() => finish('timeout', true), deadlineRemaining);
  }

  function restorePage() {
    underlay.forEach((node) => { if (node.isConnected) node.inert = originalInert.get(node); });
    html.classList.remove('entry-pending');
    if (html.style.overflow === 'hidden') html.style.overflow = overflowBefore;
    const destination = focusBefore?.isConnected && focusBefore !== document.body
      ? focusBefore : document.querySelector('#main') || document.querySelector('main');
    destination?.focus({ preventScroll: true });
  }

  function complete(status, notify) {
    if (disposed) return;
    disposed = true;
    clearTimeout(exitTimer);
    exitStatus = undefined;
    pauseDeadline();
    life.abort();
    signal?.removeEventListener('abort', dispose);
    pendingRoomObserver?.disconnect();
    room?.dispose();
    room = undefined;
    shell.dispose();
    restorePage();
    underlay.length = 0;
    originalInert.clear();
    posterImage = undefined;
    const result = {
      status,
      degraded: status === 'timeout' || failures.size > 0,
      videoPrepared,
      posterLoaded,
      sceneReady,
      failures: [...failures],
    };
    resolveReady(result);
    if (notify) onComplete?.(result);
  }

  function finish(status, immediate = false) {
    if (disposed) return;
    if (finished) {
      if (immediate) complete(status, true);
      return;
    }
    finished = true;
    cancelAnimationFrame(frame); frame = 0;
    pauseDeadline();
    pendingRoomObserver?.disconnect();
    html.dataset.entryState = status;
    shell.setState('exiting');
    // Skip, Escape, timeout and the static path release controls immediately.
    if (immediate || staticPresentation()) complete(status, true);
    else {
      exitStatus = status;
      exitTimer = setTimeout(() => complete(status, true), 220);
    }
  }

  function tick(time) {
    frame = 0;
    if (finished || disposed || document.hidden) return;
    const delta = lastTime ? Math.min(100, time - lastTime) : 16;
    lastTime = time;
    phaseTime += delta;
    if (phase === 'loading') {
      // The download indicator follows preparation; the architectural move
      // has its own uninterrupted clock once the model is ready. A slow film
      // must not freeze the room halfway through its assembly.
      const constructionReady = sceneReady || records.get('room').value === 1;
      if (constructionReady && !staticPresentation()) assemblyTime = Math.min(2650, assemblyTime + delta);
      const sceneProgress = staticPresentation() ? 1 : assemblyTime / 2650;
      // Preparing and building the studio are one visible progression. Cached
      // assets must not take the counter to 99 before the room is assembled.
      const productionTarget = staticPresentation() ? target : Math.min(target, 18 + sceneProgress * 81);
      displayed = staticPresentation() ? productionTarget : Math.min(productionTarget, displayed + delta * .03);
      const label = phases.reduce((result, [at, value]) => sceneProgress * 100 >= at ? value : result, phases[0][1]);
      shell.update(displayed, label);
      room?.setProgress(sceneProgress);
      // When preparation is actually complete, the cosmetic counter must not
      // add another wait after the room has finished assembling.
      if (settled && (staticPresentation() || sceneProgress === 1)) {
        shell.update(100, 'Il tuo spazio è pronto');
        if (staticPresentation()) return finish('ready', true);
        phase = 'arrival'; phaseTime = 0;
        shell.root.dataset.ready = 'true';
      }
    } else if (phase === 'arrival' && phaseTime >= 420) {
      if (!sceneReady) return finish('ready');
      phase = 'zoom'; phaseTime = 0;
      shell.setState('zoom'); html.dataset.entryState = 'zoom';
    } else if (phase === 'zoom') {
      const zoom = clamp(phaseTime / 1060);
      room?.setZoom(zoom);
      if (zoom === 1) return finish('ready');
    }
    if (phase !== 'loading' || displayed < target || (records.get('room').value === 1 && assemblyTime < 2650)) request();
    else lastTime = 0;
  }

  shell.skip.addEventListener('click', () => finish('skipped', true), { signal: life.signal });
  shell.root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); finish('skipped', true); }
    else if (event.key === 'Tab') { event.preventDefault(); shell.skip.focus({ preventScroll: true }); }
  }, { signal: life.signal });

  function policyChanged() {
    if (staticPresentation()) {
      room?.dispose(); room = undefined; sceneReady = false;
      cancelVideoWait?.();
      video?.pause();
      if (phase !== 'loading') return finish('ready', true);
    }
    request();
  }
  preference.addEventListener('change', policyChanged, { signal: life.signal });
  connection?.addEventListener?.('change', policyChanged, { signal: life.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      pauseDeadline(); video?.pause();
      if (exitTimer) { clearTimeout(exitTimer); exitTimer = 0; }
    } else if (exitStatus) {
      exitTimer = setTimeout(() => complete(exitStatus, true), 220);
    } else { resumeDeadline(); request(); }
  }, { signal: life.signal });
  document.addEventListener('space:entry-timeout', () => finish('timeout', true), { signal: life.signal });

  const fonts = task('fonts', async () => {
    await Promise.all([
      document.fonts?.load('500 32px "Space Grotesk"'),
      document.fonts?.load('400 16px "DM Mono"'),
    ]);
    await document.fonts?.ready;
  });

  const picture = task('poster', async () => {
    const source = poster || video?.poster;
    if (!source) return;
    posterImage = new Image();
    posterImage.decoding = 'async';
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        posterImage.onload = posterImage.onerror = null;
        life.signal.removeEventListener('abort', aborted);
      };
      const aborted = () => { cleanup(); reject(new DOMException('Entry ended', 'AbortError')); };
      posterImage.onload = async () => {
        try { await posterImage.decode(); } catch {}
        if (life.signal.aborted) return;
        cleanup(); posterLoaded = true; resolve();
      };
      posterImage.onerror = () => { cleanup(); reject(new Error('Entry poster unavailable')); };
      life.signal.addEventListener('abort', aborted, { once: true });
      posterImage.src = new URL(source, document.baseURI).href;
    });
  });

  const architecture = task('room', async () => {
    if (staticPresentation()) return;
    const [{ createStudioRoom }, , , modelBytes] = await Promise.all([
      import('./studio-blender-room.js'), fonts, picture, loadModel?.(life.signal),
    ]);
    if (finished || disposed || staticPresentation()) return;
    const screen = typeof drawScreen === 'function' ? drawScreen : drawAtelierScreen;
    room = createStudioRoom(shell.sceneHost, {
      modelBytes,
      drawScreen: (ctx, width, height, aspect) => screen(ctx, width, height, aspect, posterLoaded ? posterImage : undefined),
    });
    room.setProgress(0);
    await new Promise((resolve) => {
      const check = () => {
        if (shell.sceneHost.dataset.scene === 'ready' || shell.sceneHost.dataset.scene === 'fallback') {
          sceneReady = shell.sceneHost.dataset.scene === 'ready';
          if (!sceneReady && !staticPresentation()) failures.add('room');
          pendingRoomObserver?.disconnect(); resolve();
        }
      };
      pendingRoomObserver = new MutationObserver(check);
      pendingRoomObserver.observe(shell.sceneHost, { attributes: true, attributeFilter: ['data-scene'] });
      life.signal.addEventListener('abort', () => { pendingRoomObserver?.disconnect(); resolve(); }, { once: true });
      check();
    });
  });

  const media = task('video', async (report) => {
    if (!video || staticPresentation()) return;
    // Prioritize the room, its poster and fonts on a cold/slow connection.
    // The film can buffer while the assembled scene starts moving.
    await architecture;
    if (finished || disposed || staticPresentation()) return;
    prepareVideo?.();
    await new Promise((resolve, reject) => {
      let seekStarted = false;
      let requestedTime = 0;
      let done = false;
      const events = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked', 'progress', 'durationchange'];
      const cleanup = () => {
        events.forEach((name) => video.removeEventListener(name, check));
        video.removeEventListener('error', failed);
        life.signal.removeEventListener('abort', aborted);
        cancelVideoWait = undefined;
      };
      const settle = (error) => {
        if (done) return;
        done = true; cleanup();
        if (error) reject(error); else resolve();
      };
      const failed = () => settle(new Error('Entry video unavailable'));
      const aborted = () => settle(new DOMException('Entry ended', 'AbortError'));
      const check = () => {
        if (done || finished || disposed) return;
        video.pause();
        if (video.readyState < 1) return;
        report(.1);
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
        if (duration && video.buffered?.length) {
          try { report(.15 + .65 * clamp(video.buffered.end(video.buffered.length - 1) / duration)); } catch {}
        }
        if (!seekStarted) {
          requestedTime = clamp(Number.isFinite(startAt) ? startAt : 0, 0, Math.max(0, duration - .05));
          if (Math.abs(video.currentTime - requestedTime) > .04) {
            try { video.currentTime = requestedTime; seekStarted = true; } catch { return; }
            return;
          }
          seekStarted = true;
        }
        if (video.seeking || video.readyState < 2 || Math.abs(video.currentTime - requestedTime) > .15) return;
        videoPrepared = true;
        video.dataset.entryPreparedAt = String(requestedTime);
        report(1); settle();
      };
      events.forEach((name) => video.addEventListener(name, check));
      video.addEventListener('error', failed, { once: true });
      life.signal.addEventListener('abort', aborted, { once: true });
      cancelVideoWait = () => settle();
      if (video.error) failed();
      else {
        check();
        if (!done && video.networkState === 0 && video.readyState === 0) video.load();
      }
    });
  });

  Promise.all([fonts, picture, architecture, media]).then(() => {
    if (finished || disposed) return;
    settled = true; target = 99; request();
  });

  function dispose() {
    if (disposed) return;
    finished = true;
    cancelAnimationFrame(frame); frame = 0;
    html.dataset.entryState = 'disposed';
    complete('disposed', false);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  resumeDeadline(); request();
  return { ready, dispose };
}

/** Default monitor artwork; a supplied drawScreen callback can match the page exactly. */
export function drawAtelierScreen(ctx, width, height, aspect = 16 / 9, image) {
  const contentWidth = aspect < .8 ? height * aspect : width;
  const left = (width - contentWidth) / 2;
  const gutter = contentWidth * .065;
  ctx.fillStyle = '#090b10'; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.beginPath(); ctx.rect(left, 0, contentWidth, height); ctx.clip();
  if (image?.naturalWidth) {
    const scale = Math.max(contentWidth / image.naturalWidth, height / image.naturalHeight);
    const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
    ctx.drawImage(image, left + (contentWidth - dw) / 2, (height - dh) / 2, dw, dh);
    const shade = ctx.createLinearGradient(left, 0, left + contentWidth, 0);
    shade.addColorStop(0, 'rgba(9,11,16,.8)'); shade.addColorStop(1, 'rgba(9,11,16,.12)');
    ctx.fillStyle = shade; ctx.fillRect(left, 0, contentWidth, height);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f5f5f2';
  ctx.font = `600 ${contentWidth * .045}px "Space Grotesk", Arial, sans-serif`;
  ctx.fillText('space', left + gutter, height * .11);
  const size = Math.min(contentWidth * .125, height * .18);
  ctx.font = `500 ${size}px "Space Grotesk", Arial, sans-serif`;
  ctx.fillText('Brand. Web.', left + gutter, height * .47);
  ctx.fillStyle = '#dfff00'; ctx.fillText('Motion.', left + gutter, height * .47 + size);
  ctx.fillStyle = '#f5f5f2';
  ctx.font = `400 ${Math.min(contentWidth * .026, 37)}px "Space Grotesk", Arial, sans-serif`;
  ctx.fillText('Identità, siti ed esperienze digitali.', left + gutter, height * .47 + size * 1.55);
  ctx.restore();
}
