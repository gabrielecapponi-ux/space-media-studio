import {selectFoodVideo, recordFoodTransfer} from './food-media-source.js';

/** A finite packing/delivery scene. Scrolling selects playback, never seeks frames. */
export function mountBagRider({root, reducedMotion} = {}) {
  const doc = root?.ownerDocument, win = doc?.defaultView;
  const scene = root?.querySelector('.bag-rider-scene');
  const poster = scene?.querySelector('[data-bag-poster] img');
  if (!win || !scene || !poster) return {setPaused() {}, dispose() {}};
  const pref = reducedMotion || win.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = win.navigator.connection || win.navigator.mozConnection || win.navigator.webkitConnection;
  const life = new win.AbortController(), {signal} = life;
  const control = doc.createElement('button');
  control.type = 'button'; control.className = 'bag-rider-motion';
  scene.append(control);
  const url = name => new URL(`./films/bag-rider/${name}`, doc.baseURI).href;
  let video = null, mediaLife = null, disposed = false, external = true, pageAway = false;
  let near = false, visible = false, eligible = false, wasVisible = false;
  let ended = false, failed = false, needsGesture = false, userPaused = false;
  let requested = false, starting = false, presented = false, reenter = false;
  let revision = 0, playRevision = 0, frame = null, decoded = null, dwell = null, loadTimer = null;
  const staticMode = () => Boolean(pref.matches || connection?.saveData);
  const blocked = () => disposed || external || pageAway || doc.hidden || staticMode() || Boolean(doc.querySelector('dialog[open]'));
  const listen = (target, event, callback, options = {}) => target?.addEventListener?.(event, callback, {...options,signal});

  function render() {
    const staticView = staticMode();
    control.hidden = staticView && doc.activeElement !== control;
    control.disabled = staticView;
    const running = requested && !userPaused && !blocked() && visible;
    control.setAttribute('aria-pressed', String(running));
    control.textContent = staticView ? 'Animazione disattivata' : failed ? '▷ Riprova la scena'
      : needsGesture ? '▷ Guarda la partenza' : ended ? '↻ Rivedi la partenza'
      : running ? 'Ⅱ Pausa' : userPaused || presented ? '▷ Riprendi' : '▷ Guarda la partenza';
    control.setAttribute('aria-label', staticView ? 'Animazione disattivata dalle preferenze'
      : running ? 'Metti in pausa la preparazione del sacchetto'
      : ended ? 'Rivedi la preparazione del sacchetto e la partenza del rider'
      : failed ? 'Riprova il video della preparazione del sacchetto'
      : 'Riproduci la preparazione del sacchetto e la partenza del rider');
  }
  function cancelDecoded() {
    if (decoded != null) video?.cancelVideoFrameCallback?.(decoded);
    decoded = null;
  }
  function clearDwell() {win.clearTimeout(dwell); dwell = null;}
  function pause() {
    playRevision++; requested = starting = false;
    clearDwell(); cancelDecoded();
    win.clearTimeout(loadTimer); loadTimer = null;
    video?.pause();
  }
  function release() {
    pause(); revision++;
    mediaLife?.abort(); mediaLife = null;
    if (video) {const old = video; video = null; old.removeAttribute('src'); old.load(); old.remove();}
    scene.classList.remove('has-bag-video');
    presented = false; ended = failed = needsGesture = false;
  }
  function selectSource() {
    const entry = {video:url('packing-720.mp4'),videoRetina:url('packing-1080.mp4')};
    const width = scene.getBoundingClientRect().width;
    // Wide desktop screens without the Network Information API use native Full HD.
    // Phones and explicit slow connections keep the smaller progressive delivery.
    if (width >= 840 && !connection) return entry.videoRetina;
    return selectFoodVideo(entry, win, width);
  }
  function prepare() {
    if (video || !near || blocked() || failed) return video;
    const v = doc.createElement('video');
    video = v; const token = ++revision;
    mediaLife = new win.AbortController();
    const on = (event, callback) => v.addEventListener(event,callback,{signal:mediaLife.signal});
    v.className = 'bag-rider-video'; v.preload = 'auto';
    v.muted = v.defaultMuted = v.playsInline = true;
    v.loop = v.autoplay = v.controls = false;
    v.disablePictureInPicture = true; v.tabIndex = -1;
    v.setAttribute('muted',''); v.setAttribute('playsinline',''); v.setAttribute('aria-hidden','true');
    v.poster = poster.currentSrc || poster.src;
    const transferAt = win.performance.now();
    const current = () => !disposed && token === revision && video === v;
    on('playing',() => {
      if (!current() || !requested || blocked() || !visible || userPaused) {v.pause(); return;}
      starting = false;
      const attempt = playRevision;
      const reveal = () => {
        decoded = null;
        if (!current() || attempt !== playRevision || !requested || blocked() || !visible) return;
        presented = true; scene.classList.add('has-bag-video');
        win.clearTimeout(loadTimer); loadTimer = null; render();
      };
      cancelDecoded();
      if (v.requestVideoFrameCallback) decoded = v.requestVideoFrameCallback(reveal);
      else reveal();
    });
    on('ended',() => {
      if (!current()) return;
      pause(); ended = true; userPaused = false; render();
    });
    on('error',() => {
      if (!current()) return;
      pause(); failed = true; scene.classList.remove('has-bag-video'); render();
    });
    for (const type of ['progress','canplay','canplaythrough','suspend']) on(type,() => {
      if (!current()) return;
      recordFoodTransfer(v, win, transferAt);
      if (eligible && !requested && !starting) schedule();
    });
    scene.insertBefore(v, control);
    v.src = selectSource(); v.load();
    return v;
  }
  function buffered() {
    if (!video || video.readyState < 3) return false;
    try {
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) > video.currentTime + .1 || video.buffered.end(i) <= video.currentTime) continue;
        const remaining = Number.isFinite(video.duration) ? Math.max(0, video.duration-video.currentTime) : 1.5;
        const target = Math.min(1.5, remaining);
        const available = video.buffered.end(i)-video.currentTime;
        return available + .03 >= target || (video.networkState === 1 && video.readyState === 4 && available >= Math.min(.5,remaining));
      }
    } catch { /* Keep the still until the browser reports a usable range. */ }
    return false;
  }
  function start(manual = false) {
    if (blocked() || !visible || userPaused || ended || failed || (needsGesture && !manual) || requested || starting) return;
    const v = prepare();
    if (!v) {render(); return;}
    if (reenter) {
      try {v.currentTime = 0;} catch { /* A new resource already begins at zero. */ }
      reenter = false; scene.classList.remove('has-bag-video'); presented = false;
    }
    if (!manual && !buffered()) {render(); return;}
    clearDwell(); requested = starting = true;
    const token = revision, attempt = ++playRevision;
    const reject = () => {
      if (disposed || token !== revision || attempt !== playRevision || video !== v) return;
      pause(); needsGesture = true; render();
    };
    // A manual action calls play synchronously, preserving Safari user activation.
    loadTimer = win.setTimeout(reject, 15000);
    try {Promise.resolve(v.play()).then(() => {
      // An older resolved play on the same element must not cancel a newer visit.
      if (token !== revision || video !== v || blocked() || !visible || !requested) v.pause();
    }).catch(reject);} catch {reject();}
    render();
  }
  function schedule() {
    if (blocked() || !eligible || userPaused || ended || failed || needsGesture || requested || starting || dwell != null) return;
    dwell = win.setTimeout(() => {dwell = null; start();}, 100);
  }
  function update() {
    frame = null;
    if (disposed) return;
    const b = scene.getBoundingClientRect(), height = win.innerHeight;
    const exposure = Math.max(0, Math.min(b.bottom,height)-Math.max(b.top,0));
    visible = b.width > 0 && b.height > 0 && exposure > 0;
    eligible = visible && exposure / Math.min(b.height,height) >= .55;
    near = b.bottom > -320 && b.top < height+320;
    if (wasVisible && !visible) {
      reenter = true; ended = false; needsGesture = false;
    }
    wasVisible = visible;
    if (staticMode()) {release(); render(); return;}
    if (blocked()) {pause(); render(); return;}
    if (!near) {release(); render(); return;}
    prepare();
    // Separate start/stop thresholds prevent jitter around the reading boundary.
    if (!visible || exposure / Math.min(b.height,height) < .3) pause();
    else if (eligible) schedule();
    else clearDwell();
    render();
  }
  const queue = () => {if (!disposed && frame == null) frame = win.requestAnimationFrame(update);};
  listen(control,'click',() => {
    if (blocked() || !visible) return;
    if (requested && !userPaused) {userPaused = true; pause(); render(); return;}
    if (failed) release();
    if (ended) reenter = true;
    ended = failed = needsGesture = userPaused = false;
    start(true);
  });
  listen(control,'blur', render);
  listen(win,'scroll',queue,{passive:true}); listen(win,'resize',queue);
  listen(doc,'visibilitychange',queue); listen(pref,'change',queue); listen(connection,'change',queue);
  listen(win,'pagehide',() => {pageAway = true; pause(); render();});
  listen(win,'pageshow',() => {pageAway = false; queue();});
  const observer = new win.MutationObserver(queue);
  doc.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog,{attributes:true,attributeFilter:['open']}));
  render(); queue();
  return {
    setPaused(value) {external = Boolean(value); if (external) pause(); queue();},
    dispose() {
      if (disposed) return;
      disposed = true; life.abort(); observer.disconnect();
      if (frame != null) win.cancelAnimationFrame(frame);
      frame = null; release(); control.remove();
    },
  };
}
