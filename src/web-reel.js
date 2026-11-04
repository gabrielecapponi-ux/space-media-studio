import { WEB_REEL, webReelFrame } from './web-reel-motion.js';

/** Keep native demo links useful; video time only provides a quiet visual index. */
export function installWebReel({ signal } = {}) {
  const video = document.querySelector('#atelier-web-video');
  const links = [...document.querySelectorAll('[data-reel-scene]')];
  const status = document.querySelector('[data-reel-label]');
  if (!video || !links.length) return;
  const lifetime = new AbortController();
  let current = -1;
  function update() {
    const index = webReelFrame(video.currentTime * WEB_REEL.fps).primary;
    if (index === current) return;
    current = index;
    const selected = WEB_REEL.scenes[index];
    links.forEach(link => {
      if (link.dataset.reelScene === selected) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    const link = links.find(link => link.dataset.reelScene === selected);
    if (status && link) status.textContent = link.dataset.reelTitle || link.textContent.trim().replace(/\s+/g, ' ');
  }
  function dispose() { lifetime.abort(); signal?.removeEventListener('abort', dispose); }
  ['timeupdate', 'loadedmetadata', 'seeked', 'emptied'].forEach(type => video.addEventListener(type, update, { signal: lifetime.signal }));
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) dispose();
  else update();
  return { dispose };
}
