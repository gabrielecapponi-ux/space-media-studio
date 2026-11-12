/** Cinematic event tour: one player at most, no WebGL or continuous frame loop. */
import {motionViewport, motionExposure} from './motion-viewport.js';
export const TOUR_STOPS = Object.freeze([
  {
    id: 'festival',
    label: 'Festival',
    description:
      'Concept del truck verde e rosa Mr Smeet: il cuoco alla piastra, un sacchetto al banco e clienti al tavolino in piazza.',
  },
  {
    id: 'fiere',
    label: 'Fiere',
    description:
      'Il truck Mr Smeet in un padiglione fieristico: il personale serve un visitatore al banco.',
  },
  {
    id: 'dove-vuoi',
    label: 'Dove vuoi',
    description:
      'Il truck Mr Smeet in un giardino, con il personale al lavoro e un tavolo apparecchiato per gli ospiti.',
  },
]);
export const TOUR_INTERVAL = 14000,
  TOUR_MANUAL_HOLD = 24000;
export function mountTruckTour({ root, reducedMotion } = {}) {
  const doc = root?.ownerDocument,
    win = doc?.defaultView,
    screen = root?.querySelector('[data-tour-screen]');
  let poster = screen?.querySelector('[data-tour-poster]');
  if (!win || !poster) return { setPaused() {}, dispose() {} };
  const buttons = [...root.querySelectorAll('[data-tour-choice]')],
    motion = screen.querySelector('[data-tour-motion]');
  const caption = screen.querySelector('[data-tour-caption]');
  const canObserve = typeof win.IntersectionObserver === 'function';
  const pref =
      reducedMotion || win.matchMedia('(prefers-reduced-motion: reduce)'),
    connection =
      win.navigator.connection ||
      win.navigator.mozConnection ||
      win.navigator.webkitConnection;
  const removers = [],
    listen = (obj, ev, fn) => {
      obj?.addEventListener?.(ev, fn);
      removers.push(() => obj?.removeEventListener?.(ev, fn));
    };
  const url = (kind, id, small = false) =>
    new URL(
      `./${kind === 'img' ? 'images' : 'films'}/truck-tour/${id}${small ? '-768' : ''}.${kind === 'img' ? 'webp' : 'mp4'}`,
      doc.baseURI,
    ).href;
  let active = 0,
    disposed = false,
    external = false,
    local = false,
    visible = false,
    intersects = false,
    pageAway = false,
    attempted = false,
    video = null,
    sequence = 0;
  let timer = null,
    started = 0,
    remaining = TOUR_INTERVAL,
    loadClock = null,
    pending = null;
  let scrollFrame = null;
  const now = () => win.performance.now(),
    staticMode = () => Boolean(pref.matches || connection?.saveData);
  const blocked = () =>
    disposed ||
    !visible ||
    external ||
    local ||
    pageAway ||
    doc.hidden ||
    staticMode() ||
    doc.body.classList.contains('motion-paused') ||
    Boolean(doc.querySelector('dialog[open]'));
  const stopClock = (keep = true) => {
    if (timer !== null) {
      win.clearTimeout(timer);
      if (keep) remaining = Math.max(80, remaining - (now() - started));
      timer = null;
    }
  };
  function clearVideo() {
    sequence++;
    win.clearTimeout(loadClock);
    loadClock = null;
    if (!video) return;
    const old = video;
    video = null;
    old.onplaying = old.onwaiting = old.onerror = null;
    old.pause();
    old.removeAttribute('src');
    old.load();
    old.remove();
  }
  function startVideo() {
    if (blocked() || attempted || pending) return;
    attempted = true;
    const token = ++sequence;
    const v = doc.createElement('video');
    video = v;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.preload = 'none';
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.setAttribute('aria-hidden', 'true');
    v.disablePictureInPicture = true;
    const valid = () => !disposed && video === v && sequence === token;
    const fail = () => {
      if (valid()) {clearVideo(); sync();}
    };
    v.onerror = fail;
    v.onplaying = () => {
      if (!valid()) return;
      if (blocked()) {
        v.pause();
        return;
      }
      win.clearTimeout(loadClock);
      v.dataset.playing = '';
      delete v.dataset.waiting;
      sync();
    };
    v.onwaiting = () => {
      if (!valid()) return;
      v.dataset.waiting = '';
      stopClock();
      win.clearTimeout(loadClock);
      loadClock = win.setTimeout(fail, 15000);
    };
    screen.insertBefore(v, screen.querySelector('figcaption'));
    v.src = url('film', TOUR_STOPS[active].id);
    loadClock = win.setTimeout(fail, 15000);
    try {
      v.play().catch(fail);
    } catch {
      fail();
    }
  }
  function sync() {
    if (disposed) return;
    const exposure = motionExposure(screen.getBoundingClientRect(),motionViewport(doc,win));
    visible = intersects && exposure >= (visible ? .30 : .55);
    const locked =
      !canObserve ||
      staticMode() ||
      external ||
      doc.body.classList.contains('motion-paused');
    if (motion) {
      motion.hidden = locked;
      motion.setAttribute('aria-pressed', String(local));
      motion.setAttribute(
        'aria-label',
        local ? 'Riprendi le scene' : 'Metti in pausa le scene',
      );
      motion.firstElementChild.textContent = local ? '▷' : 'Ⅱ';
    }
    if (blocked()) {
      stopClock();
      if (!visible || pageAway || doc.hidden || staticMode()) {
        clearVideo();
        attempted = false;
      } else if (video) {
        video.pause();
        win.clearTimeout(loadClock);
        loadClock = null;
      }
      return;
    }
    if (pending) return;
    if (video && !video.ended && video.paused) {
      const v = video;
      v.play().catch(() => {
        if (video === v) clearVideo();
      });
    } else startVideo();
    // Give each scene its reading time after playback actually starts;
    // downloading on a slow phone must not consume the presentation interval.
    if (timer === null && (!video || (video.dataset.playing !== undefined && video.dataset.waiting === undefined))) {
      started = now();
      timer = win.setTimeout(() => {
        timer = null;
        select((active + 1) % TOUR_STOPS.length, false);
      }, remaining);
    }
  }
  function select(next, manual) {
    if (disposed) return;
    stopClock(false);
    remaining = manual ? TOUR_MANUAL_HOLD : TOUR_INTERVAL;
    pending?.cancel();
    pending = null;
    if (next === active) {
      clearVideo();
      attempted = false;
      sync();
      return;
    }
    const stop = TOUR_STOPS[next],
      image = new win.Image();
    let timeout = null,
      live = true;
    const cancel = () => {
      live = false;
      win.clearTimeout(timeout);
      image.onload = image.onerror = null;
    };
    pending = { cancel };
    const done = (ok) => {
      if (!live || disposed) return;
      cancel();
      pending = null;
      if (ok) {
        clearVideo();
        attempted = false;
        image.dataset.tourPoster = '';
        image.alt = stop.description;
        image.width = 1168;
        image.height = 880;
        image.decoding = 'async';
        poster.replaceWith(image);
        poster = image;
        active = next;
        root.dataset.tourScene = stop.id;
        caption.textContent = stop.label;
        buttons.forEach((b) =>
          b.setAttribute(
            'aria-pressed',
            String(b.dataset.tourChoice === stop.id),
          ),
        );
      }
      sync();
    };
    image.onload = () => done(true);
    image.onerror = () => done(false);
    timeout = win.setTimeout(() => done(false), 7000);
    image.sizes = '(min-width:840px) 65vw, 100vw';
    image.srcset = `${url('img', stop.id, true)} 768w, ${url('img', stop.id)} 1168w`;
    image.src = url('img', stop.id, true);
  }
  buttons.forEach((button, i) => {
    button.disabled = false;
    listen(button, 'click', () => select(i, true));
  });
  listen(motion, 'click', () => {
    local = !local;
    sync();
  });
  listen(pref, 'change', sync);
  listen(connection, 'change', sync);
  const noteScroll = () => {
    if (scrollFrame !== null) return;
    scrollFrame = win.requestAnimationFrame(() => {scrollFrame = null; sync();});
  };
  listen(win, 'scroll', noteScroll);
  listen(win, 'resize', noteScroll);
  listen(win, 'smeet:header-resize', noteScroll);
  listen(doc, 'visibilitychange', sync);
  listen(win, 'pagehide', () => {
    pageAway = true;
    sync();
  });
  listen(win, 'pageshow', () => {
    pageAway = false;
    sync();
  });
  const observer = canObserve
    ? new win.IntersectionObserver(
        ([entry]) => {
          intersects = entry.isIntersecting;
          sync();
        },
        { threshold: [0, .30, .55, 1] },
      )
    : null;
  observer?.observe(screen);
  const modal = win.MutationObserver ? new win.MutationObserver(sync) : null;
  modal?.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
  doc
    .querySelectorAll('dialog')
    .forEach((d) =>
      modal?.observe(d, { attributes: true, attributeFilter: ['open'] }),
    );
  // Without visibility observation the photographic, manually selectable tour stays available.
  if (!observer) local = true;
  sync();
  return {
    setPaused(value) {
      external = Boolean(value);
      sync();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (scrollFrame !== null) win.cancelAnimationFrame(scrollFrame);
      stopClock(false);
      pending?.cancel();
      pending = null;
      clearVideo();
      observer?.disconnect();
      modal?.disconnect();
      removers.forEach((fn) => fn());
      buttons.forEach((b) => (b.disabled = true));
      if (motion) motion.hidden = true;
    },
  };
}
