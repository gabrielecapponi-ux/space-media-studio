/** Captions follow the Blender film; playback is owned by atelier-cinema. */
export function installFundingFilm({ signal } = {}) {
  const root = document.querySelector('[data-funding-journey]');
  const video = root?.querySelector('video');
  if (!video) return;
  const heading = root.querySelector('[data-journey-heading]');
  const step = root.querySelector('[data-journey-step]');
  const rail = [...root.querySelectorAll('[data-journey-phase]')];
  const phases = [
    ['Ogni progetto comincia così.', '01 / L’idea'],
    ['La scriviamo. Insieme.', '02 / La progettazione'],
    ['Le diamo una direzione.', '03 / La candidatura'],
    ['Per farla diventare reale.', '04 / Il progetto'],
  ];
  let frame = 0;
  let lastIndex = -1;
  let disposed = false;
  const paint = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : 8;
    const time = video.currentTime || 0;
    const index = video.readyState ? Math.min(3, Math.floor(time / (duration / 4))) : 4;
    if (index !== lastIndex) {
      heading.textContent = index === 4 ? 'Dall’idea alla realtà.' : phases[index][0];
      step.textContent = index === 4 ? 'SPACE / Progettazione condivisa' : phases[index][1];
      root.dataset.journeyPhaseIndex = String(index);
      lastIndex = index;
    }
    rail.forEach((item, i) => {
      const state = index === 4 || i < index ? 'done' : i === index ? 'active' : 'waiting';
      if (item.dataset.state !== state) item.dataset.state = state;
      item.style.setProperty('--journey-progress', index === 4 ? 1 : Math.max(0, Math.min(1, time / (duration / 4) - i)));
    });
  };
  function tick() {
    frame = 0;
    if (disposed || document.hidden || video.paused || video.ended) return;
    paint(); frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    paint();
    if (!disposed && !document.hidden && !video.paused && !video.ended) frame = requestAnimationFrame(tick);
  }
  // timeupdate is deliberately sparse in browsers. Paint the tiny progress
  // rule on the display clock while playing, and stop with the video.
  ['play', 'playing', 'pause', 'ended'].forEach(type => video.addEventListener(type, sync, { signal }));
  document.addEventListener('visibilitychange', sync, { signal });
  signal?.addEventListener('abort', () => { disposed = true; cancelAnimationFrame(frame); frame = 0; }, { once: true });
  ['timeupdate', 'loadeddata', 'seeked', 'emptied'].forEach(type => video.addEventListener(type, paint, { signal }));
  paint();
}
