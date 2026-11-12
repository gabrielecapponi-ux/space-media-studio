/** Scroll reveals the illustrated shop; its short film then plays at native speed. */
export function mountStorefrontRider({root, reducedMotion} = {}) {
  const doc = root?.ownerDocument, win = doc?.defaultView;
  const picture = root?.querySelector('picture');
  if (!win || !picture) return {setPaused() {}, dispose() {}};
  const pref = reducedMotion || win.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = win.navigator.connection || win.navigator.mozConnection || win.navigator.webkitConnection;
  const life = new AbortController(), {signal} = life;
  const scene = doc.createElement('div');
  scene.className = 'storefront-scene';
  root.prepend(scene); scene.append(picture);
  const layer = doc.createElement('div');
  layer.className = 'storefront-cartoon'; layer.setAttribute('aria-hidden', 'true');
  const still = doc.createElement('img');
  still.alt = ''; still.width = 1536; still.height = 864; still.decoding = 'async';
  layer.append(still); scene.append(layer);
  const replay = doc.createElement('button');
  replay.type = 'button'; replay.className = 'storefront-replay';
  replay.textContent = '▷ Un giro con Mr Smeet'; replay.hidden = true;
  replay.setAttribute('aria-label', 'Rivedi la partenza del rider Mr Smeet in scooter');
  scene.append(replay); root.classList.add('storefront-rider');
  const url = path => new URL(`./${path}`, doc.baseURI).href;
  let external = true, disposed = false, near = false, visible = false;
  let posterReady = false, finished = false, failed = false, needsGesture = false;
  let video = null, frame = null, decodedFrame = null, request = 0, progress = 0;
  const staticMode = () => Boolean(pref.matches || connection?.saveData);
  const blocked = () => disposed || external || doc.hidden || staticMode() || !!doc.querySelector('dialog[open]');
  const cancelDecodedFrame = () => {
    if (decodedFrame != null) video?.cancelVideoFrameCallback?.(decodedFrame);
    decodedFrame = null;
  };
  function release() {
    request++; cancelDecodedFrame();
    if (video) {video.pause(); video.removeAttribute('src'); video.load(); video.remove(); video = null;}
    layer.classList.remove('is-playing');
    finished = failed = needsGesture = false;
  }
  function revealFrame(token) {
    decodedFrame = null;
    if (token !== request || blocked() || !visible) return;
    layer.classList.add('is-playing');
  }
  function prepare() {
    if (!near || blocked()) return;
    if (!still.hasAttribute('src')) {
      still.srcset = `${url('images/storefront-rider/start-768.webp')} 768w, ${url('images/storefront-rider/start-1536.webp')} 1536w`;
      still.sizes = '(max-width: 760px) 92vw, 1000px';
      still.src = url('images/storefront-rider/start-1536.webp');
    }
    if (video || failed) return;
    const v = doc.createElement('video'); video = v;
    v.muted = v.defaultMuted = v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.disablePictureInPicture = true; v.preload = 'auto';
    const token = ++request;
    v.addEventListener('playing', () => {
      if (token !== request || blocked() || !visible) {v.pause(); return;}
      if (v.requestVideoFrameCallback) decodedFrame = v.requestVideoFrameCallback(() => revealFrame(token));
      else revealFrame(token);
    }, {signal});
    v.addEventListener('ended', () => {
      if (token !== request) return;
      finished = true; replay.textContent = '↻ Rivedi la partenza'; replay.hidden = false;
    }, {signal});
    v.addEventListener('error', () => {
      if (token !== request) return;
      failed = true; layer.classList.remove('is-playing');
      replay.textContent = '▷ Guarda la partenza'; replay.hidden = false;
    }, {signal});
    layer.append(v);
    // The 720p delivery is sharp at mobile size and inexpensive to decode.
    v.src = url(win.innerWidth <= 760 ? 'films/storefront-rider/rider-720.mp4' : 'films/storefront-rider/rider-1080.mp4');
    v.load();
  }
  function start() {
    if (blocked() || !visible || progress < .98 || !posterReady || finished || failed || needsGesture) return;
    prepare();
    if (!video || !video.paused) return;
    const v = video, token = request;
    try {Promise.resolve(v.play()).catch(() => {
      if (token !== request) return;
      needsGesture = true; replay.textContent = '▷ Guarda la partenza'; replay.hidden = false;
    });} catch {needsGesture = true; replay.hidden = false;}
  }
  function update() {
    frame = null;
    if (disposed) return;
    if (staticMode()) {
      release(); progress = 0; layer.style.opacity = '0'; replay.hidden = true;
      return;
    }
    const bounds = scene.getBoundingClientRect(), height = win.innerHeight;
    visible = bounds.bottom > 0 && bounds.top < height;
    near = bounds.bottom > -150 && bounds.top < height + 360;
    // Native scrolling only changes a compositor opacity; never seek the film.
    progress = Math.min(1, Math.max(0, (height * .82 - bounds.top) / (height * .3)));
    layer.style.opacity = posterReady ? String(progress) : '0';
    prepare();
    if (!visible || blocked()) {
      video?.pause();
      if (!near) release();
      return;
    }
    if (progress >= .98) start();
    replay.hidden = !finished && !failed && !needsGesture && doc.activeElement !== replay;
  }
  const queue = () => {if (frame == null && !disposed) frame = win.requestAnimationFrame(update);};
  still.addEventListener('load', () => {posterReady = true; queue();}, {signal});
  still.addEventListener('error', () => {still.hidden = true; posterReady = true; queue();}, {signal});
  replay.addEventListener('click', () => {
    if (failed) release();
    failed = finished = needsGesture = false;
    if (video) {try {video.currentTime = 0;} catch { /* Fresh video starts at zero. */ }}
    progress = 1; layer.style.opacity = '1'; replay.textContent = '↻ Ricomincia'; start();
  }, {signal});
  win.addEventListener('scroll', queue, {passive:true,signal});
  win.addEventListener('resize', queue, {passive:true,signal});
  doc.addEventListener('visibilitychange', queue, {signal});
  pref.addEventListener('change', queue, {signal});
  connection?.addEventListener?.('change', queue, {signal});
  const observer = new win.MutationObserver(queue);
  doc.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog, {attributes:true,attributeFilter:['open']}));
  return {
    setPaused(value) {external = Boolean(value); if (external) video?.pause(); queue();},
    dispose() {
      disposed = true; life.abort(); observer.disconnect();
      if (frame != null) win.cancelAnimationFrame(frame);
      release(); scene.before(picture); scene.remove(); root.classList.remove('storefront-rider');
    },
  };
}
