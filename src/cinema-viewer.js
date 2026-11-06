import './cinema-viewer.css';

/** A deliberate close-up. The page and its decoder stop behind the dialog. */
export function installCinemaViewer({ signal } = {}) {
  if (signal?.aborted || typeof HTMLDialogElement === 'undefined') return;
  const videos = [...document.querySelectorAll('[data-atelier-media]')];
  if (!videos.length) return;
  const life = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.createElement('dialog');
  dialog.className = 'atelier-cinema-viewer';
  dialog.setAttribute('aria-labelledby', 'cinema-viewer-title');
  dialog.innerHTML = `
    <header class="cinema-viewer-header">
      <div><p>SPACE / IN PRIMO PIANO</p><h2 id="cinema-viewer-title"></h2></div>
      <button type="button" class="cinema-viewer-close" autofocus aria-label="Chiudi il primo piano"><span>Chiudi</span><span aria-hidden="true">×</span></button>
    </header>
    <video class="cinema-viewer-film" controls playsinline muted preload="none"></video>
    <p class="cinema-viewer-status" role="status" aria-live="polite"></p>`;
  const title = dialog.querySelector('h2');
  const film = dialog.querySelector('video');
  const close = dialog.querySelector('button');
  const status = dialog.querySelector('[role="status"]');
  const buttons = [];
  let sourceVideo;
  let trigger;
  let disposed = false;
  let pendingTime = null;
  let generation = 0;
  let opening;
  let resumeOnVisible = false;
  film.muted = true;
  document.body.append(dialog);

  function currentPoster(video) {
    if (video.readyState < 2 || !video.videoWidth) return video.poster;
    // Hold the frame the visitor actually opened while the second decoder
    // seeks. The first-frame poster would visibly jump backward during FLIP.
    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1280 / video.videoWidth, 900 / video.videoHeight);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) return video.poster;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', .9);
    } catch { return video.poster; }
  }

  function release() {
    resumeOnVisible = false;
    if (!sourceVideo && !trigger) return;
    opening?.cancel(); opening = undefined;
    generation++;
    if (sourceVideo && Number.isFinite(film.currentTime) && film.readyState >= 1) {
      try { sourceVideo.currentTime = film.currentTime; } catch { /* Poster remains useful. */ }
    }
    film.pause();
    film.removeAttribute('src');
    film.removeAttribute('poster');
    film.load();
    pendingTime = null;
    sourceVideo = undefined;
    document.documentElement.classList.remove('cinema-open');
    if (!disposed && trigger?.isConnected) trigger.focus({ preventScroll: true });
    trigger = undefined;
  }

  function closeViewer() {
    if (dialog.open) dialog.close();
    // Native close events may wait for a rendering opportunity. Stop decoding
    // and restore the page immediately, including when Escape interrupts FLIP.
    release();
  }

  film.addEventListener('loadedmetadata', () => {
    if (film.videoWidth && film.videoHeight) {
      film.style.aspectRatio = `${film.videoWidth} / ${film.videoHeight}`;
      film.style.setProperty('--cinema-film-ratio', film.videoWidth / film.videoHeight);
    }
    if (!dialog.open || pendingTime === null) return;
    const duration = Number.isFinite(film.duration) ? film.duration : Infinity;
    try { film.currentTime = Math.min(pendingTime, Math.max(0, duration - .05)); } catch { /* Native seeking stays available. */ }
    pendingTime = null;
  }, { signal: life.signal });
  film.addEventListener('error', () => {
    if (dialog.open && film.hasAttribute('src')) status.textContent = 'Il film non è disponibile. Chiudi il primo piano e riprova dal sito.';
  }, { signal: life.signal });
  film.addEventListener('play', () => {
    if (document.hidden || !dialog.open) film.pause();
  }, { signal: life.signal });
  close.addEventListener('click', closeViewer, { signal: life.signal });
  reduced.addEventListener('change', () => { opening?.cancel(); opening = undefined; }, { signal: life.signal });
  window.addEventListener('resize', () => { opening?.cancel(); opening = undefined; }, { signal: life.signal });
  dialog.addEventListener('close', () => { if (!dialog.open) release(); }, { signal: life.signal });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); }, { signal: life.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnVisible = dialog.open && !film.paused;
      film.pause(); opening?.cancel(); opening = undefined;
    } else if (resumeOnVisible && dialog.open) {
      resumeOnVisible = false;
      const attempt = generation;
      film.play().catch(() => {
        if (generation === attempt && dialog.open) status.textContent = 'Premi Riproduci nei controlli del film.';
      });
    }
  }, { signal: life.signal });
  // Native Escape, focus containment and focus restoration remain immediate.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeViewer();
  }, { signal: life.signal });

  videos.forEach(video => {
    const stage = video.closest('.atelier-media-stage');
    if (!stage) return;
    const chapter = video.closest('article, section');
    const heading = chapter?.querySelector('h3, h2');
    const name = heading?.innerText.replace(/\s+/gu, ' ').trim() || 'Il film dello studio';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'atelier-cinema-open';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', `Guarda in primo piano: ${name}`);
    button.innerHTML = '<span aria-hidden="true">⤢</span><span>In primo piano</span>';
    stage.append(button);
    buttons.push(button);
    button.addEventListener('click', () => {
      if (disposed || dialog.open) return;
      const path = video.currentSrc || video.getAttribute('src') || (
        matchMedia('(max-width: 760px) and (orientation: portrait)').matches
          ? video.dataset.srcMobile : video.dataset.srcDesktop);
      if (!path) return;
      const origin = video.getBoundingClientRect();
      sourceVideo = video;
      trigger = button;
      pendingTime = video.currentTime || 0;
      title.textContent = name;
      film.setAttribute('aria-label', video.getAttribute('aria-label') || name);
      film.poster = currentPoster(video);
      film.style.aspectRatio = video.videoWidth && video.videoHeight
        ? `${video.videoWidth} / ${video.videoHeight}`
        : stage.dataset.mediaFormat === 'portrait' ? '4 / 5' : '16 / 9';
      film.style.setProperty('--cinema-film-ratio', video.videoWidth && video.videoHeight
        ? video.videoWidth / video.videoHeight : stage.dataset.mediaFormat === 'portrait' ? .8 : 16 / 9);
      film.loop = video.loop;
      film.src = new URL(path, document.baseURI).href;
      status.textContent = '';
      document.documentElement.classList.add('cinema-open');
      document.querySelectorAll('video').forEach(item => { if (item !== film) item.pause(); });
      dialog.showModal();
      // OSKEN's expanding reel, adapted to an explicit close-up: native dialog
      // focus/Escape are immediate and the picture grows from its actual place.
      if (!reduced.matches && !navigator.connection?.saveData && film.animate) {
        const destination = film.getBoundingClientRect();
        if (destination.width && destination.height && origin.width && origin.height) {
          const animation = film.animate([
            { transform: `translate(${origin.left - destination.left}px,${origin.top - destination.top}px) scale(${origin.width / destination.width},${origin.height / destination.height})`, borderRadius: '12px' },
            { transform: 'none', borderRadius: '4px' },
          ], { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
          opening = animation;
          animation.addEventListener('finish', () => { if (opening === animation) opening = undefined; }, { once: true });
        }
      }
      const attempt = ++generation;
      film.play().catch(() => {
        if (generation === attempt && dialog.open && film.hasAttribute('src')) status.textContent = 'Premi Riproduci nei controlli del film.';
      });
    }, { signal: life.signal });
  });
  window.addEventListener('pagehide', closeViewer, { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true;
    closeViewer();
    life.abort();
    signal?.removeEventListener('abort', dispose);
    buttons.forEach(button => button.remove());
    dialog.remove();
  }
  signal?.addEventListener('abort', dispose, { once: true });
  return { dispose };
}
