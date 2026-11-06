// The phone's native decoder shows the Blender assembly inside the water
// aperture. Text, navigation and scroll belong to the real page throughout.
export function createMobileStudio({ stage, controls, base, preference, portrait, prepareWater, onComplete }) {
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const video = document.createElement('video');
  video.className = 'director-studio-film';
  video.autoplay = true;
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');
  video.preload = 'auto';
  video.poster = base + 'images/director-studio-mobile.webp';
  video.src = base + 'films/director-studio-mobile.mp4';
  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'flagship-transport director-entry-skip';
  skip.textContent = 'Entra subito ↗';
  controls.prepend(skip);
  stage.append(video);
  const state = document.documentElement.dataset;
  state.entryState = 'inline';
  const visibility = new IntersectionObserver(([item]) => {
    if (!item.isIntersecting) finish('skipped');
  });
  let timer = setTimeout(() => finish('timeout'), 2300);

  function finish(reason) {
    if (signal.aborted) return;
    lifetime.abort();
    clearTimeout(timer);
    visibility.disconnect();
    const hadFocus = document.activeElement === skip;
    skip.remove();
    video.pause();
    video.remove();
    video.removeAttribute('src');
    video.load();
    state.entryState = reason;
    if (reason !== 'disposed') {
      onComplete();
      if (hadFocus) controls.querySelector('#atelier-film-toggle')?.focus({ preventScroll: true });
    }
  }

  visibility.observe(stage);
  video.addEventListener('playing', () => {
    clearTimeout(timer);
    timer = setTimeout(() => finish('timeout'), 4100);
    prepareWater();
  }, { once: true, signal });
  video.addEventListener('ended', () => finish('ready'), { signal });
  video.addEventListener('error', () => finish('unavailable'), { signal });
  skip.addEventListener('click', () => finish('skipped'), { signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') finish('skipped');
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finish('skipped');
  }, { signal });
  document.querySelector('.atelier-mobile-menu').addEventListener('toggle', event => {
    if (event.currentTarget.open) finish('skipped');
  }, { signal });
  window.addEventListener('pagehide', () => finish('skipped'), { signal });
  window.addEventListener('hashchange', () => finish('skipped'), { signal });
  portrait.addEventListener('change', () => finish('skipped'), { signal });
  preference.addEventListener('change', () => finish('skipped'), { signal });
  navigator.connection?.addEventListener?.('change', () => {
    if (navigator.connection.saveData) finish('skipped');
  }, { signal });
  // Let inline autoplay select the first decoded frame. An imperative play()
  // before the frame exists can be rejected on a cold WebKit navigation.
  return { dispose: () => finish('disposed') };
}
