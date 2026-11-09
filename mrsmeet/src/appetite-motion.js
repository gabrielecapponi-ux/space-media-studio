// One product plays; one nearby product may keep its original media buffer warm.
// Photos and links stay in the HTML. No speculative video is ever played.
// A paused decoded frame keeps a visible product continuous when the decoder
// moves to another card. The canvas is bounded and never drives animation.
import {selectFoodVideo, recordFoodTransfer} from './food-media-source.js';

export function holdFoodFrame(video, host, previous = null, className = 'appetite-motion-frame') {
  if (!video || !host || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return previous;
  const canvas = host.ownerDocument.createElement('canvas');
  const width = Math.min(960, video.videoWidth);
  canvas.width = width; canvas.height = Math.max(1, Math.round(width * video.videoHeight / video.videoWidth));
  try {
    const context = canvas.getContext('2d', {alpha:false});
    if (!context) return previous;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.className = className; canvas.setAttribute('aria-hidden', 'true');
    clearFoodFrame(previous);
    host.append(canvas);
    return canvas;
  } catch { return previous; }
}
export function clearFoodFrame(canvas) {
  if (canvas) {canvas.remove(); canvas.width = canvas.height = 0;}
  return null;
}
const PASS_MS = 5000;
const LOAD_TIMEOUT_MS = 3200;
const WARM_DISTANCE = 600;
const WARM_DWELL_MS = 150;
const STATE_ATTRIBUTES = ['data-appetite-motion','data-appetite-playing','data-appetite-holding','data-appetite-poster'];

export function mountAppetiteMotion({root = globalThis.document, entries = {}, reducedMotion, paused = false} = {}) {
  const doc = root?.ownerDocument || root;
  const win = doc?.defaultView;
  if (!win || !root?.querySelectorAll) return {setPaused(){},dispose(){}};
  const reduced = reducedMotion ?? win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const touch = win.matchMedia?.('(hover: none), (pointer: coarse)');
  const connection = win.navigator?.connection || win.navigator?.mozConnection || win.navigator?.webkitConnection;
  const cards = new Map(), ids = new Set(), cleanups = new Set();
  const signature = doc.querySelector('#hero-scene');
  const signatureVideo = doc.querySelector('#hero-film');
  const staticSources = [...doc.querySelectorAll('source[data-food-static]')].map(source => [source,source.media]);
  function syncStillPhotos() {
    for (const [source,media] of staticSources) {
      const selected = connection?.saveData ? 'all' : media;
      if (source.media !== selected) source.media = selected;
    }
  }
  syncStillPhotos();
  let active = null, owner = null, warm = null, pending = null, warming = null, readingCard = null, intent = 0, disposed = false;
  let scrollDirection = 1, previousScroll = win.scrollY;
  let visibilityObserver, distanceObserver, structureObserver, bodyObserver, scrollFrame = null;
  const prefersStatic = () => Boolean(typeof reduced === 'boolean' ? reduced : reduced?.matches) || connection?.saveData;
  const blocked = () => disposed || paused || prefersStatic() || doc.hidden || doc.body?.classList.contains('motion-paused') || Boolean(doc.querySelector('dialog[open]'));
  const hidden = state => !state.link.isConnected || Boolean(state.link.closest('[hidden],[inert]'));
  const visible = state => {
    if (hidden(state)) return false;
    const box = state.link.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0 && box.top < win.innerHeight && box.left < win.innerWidth;
  };
  const nearby = state => {
    if (hidden(state) || state.near === false) return false;
    const box = state.link.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > -WARM_DISTANCE && box.top < win.innerHeight + WARM_DISTANCE;
  };
  function listen(target,event,callback,options) {
    target?.addEventListener?.(event,callback,options);
    const remove = () => {target?.removeEventListener?.(event,callback,options); cleanups.delete(remove);};
    cleanups.add(remove);
    return remove;
  }
  function watchPreference(query,callback) {
    if (query?.addEventListener) listen(query,'change',callback);
    else if (query?.addListener) {
      query.addListener(callback);
      cleanups.add(() => query.removeListener(callback));
    }
  }
  function mediaURL(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value,doc.baseURI);
      return /^https?:$/.test(url.protocol) ? url.href : null;
    } catch {return null;}
  }
  function responsiveSources(value) {
    if (typeof value !== 'string') return '';
    const items = value.split(',').map(candidate => {
      const match = candidate.trim().match(/^(\S+)\s+(\d+)w$/);
      const url = match && mediaURL(match[1]), width = Number(match?.[2]);
      return url && width >= 100 && width <= 4096 ? `${url} ${width}w` : null;
    });
    return items.every(Boolean) ? items.join(', ') : '';
  }
  function cancelDwell() {
    if (pending) win.clearTimeout(pending.timer);
    pending = null;
  }
  function cancelWarmDwell() {
    if (warming) win.clearTimeout(warming.timer);
    warming = null;
  }
  function stopClock(state) {
    state.token++;
    state.awaitingStart = false;
    if (state.frameRequest != null) state.video?.cancelVideoFrameCallback?.(state.frameRequest);
    state.frameRequest = null;
    win.clearTimeout(state.endTimer); win.clearTimeout(state.loadTimer);
    state.endTimer = state.loadTimer = null;
    state.video?.pause();
  }
  function release(state, preserve = false) {
    const keep = preserve && !disposed && !doc.hidden && !prefersStatic() && visible(state);
    const video = state.video;
    if (keep && state.presented) state.frame = holdFoodFrame(video, state.link, state.frame);
    if (!keep) state.frame = clearFoodFrame(state.frame);
    if (!video) return;
    stopClock(state);
    state.link.removeAttribute('data-appetite-playing');
    state.link.removeAttribute('data-appetite-holding');
    if (active === state) active = null;
    if (owner === state) owner = null;
    if (warm === state) warm = null;
    state.presented = false;
    state.video = null;
    state.mediaCleanups.forEach(remove => remove());
    state.mediaCleanups = [];
    video.removeAttribute('src'); video.load(); video.remove();
    if (state.attempted) state.finished = true;
  }
  function hide(state = owner) {
    if (!state?.video) return;
    state.finished = true;
    release(state, true);
  }
  function restartVisit(state) {
    // A replay of the same product can seek its retained element. Keep its
    // last decoded frame above the still until the new first frame arrives.
    if (state.video) {
      if (warm && warm !== state) release(warm, true);
      if (state.presented) state.frame = holdFoodFrame(state.video, state.link, state.frame);
      stopClock(state);
      state.link.removeAttribute('data-appetite-playing');
      state.link.removeAttribute('data-appetite-holding');
      if (active === state) active = null;
      if (owner === state) owner = null;
      warm = state; state.presented = false;
    }
    state.finished = false; state.attempted = false;
    state.warmFailed = false;
  }
  function recordIntent(state) {
    if (state.finished || (state.attempted && active !== state)) restartVisit(state);
    state.intent = ++intent;
  }
  function signatureIsPrimary() {
    if (!signature) return false;
    const box = signature.getBoundingClientRect();
    const exposure = Math.max(0,Math.min(box.bottom,win.innerHeight)-Math.max(box.top,0));
    const heroLeads = win.scrollY < 24 || box.top + box.height*.5 >= win.innerHeight*.25;
    return heroLeads && box.height > 0 && exposure/box.height >= .55;
  }
  function candidate() {
    const available = [...cards.values()].filter(state => state.videoURL && !hidden(state) && (state.ratio > 0 || visible(state)));
    const direct = available.filter(state => (state.focused && (!touch?.matches || !visibilityObserver || state.ratio >= .30))
      || (!touch?.matches && state.hovered));
    if (direct.length) return direct.sort((a,b) => b.intent-a.intent)[0];
    if (!visibilityObserver) return null;
    // At the new compact opening both the hero and first menu row fit on a
    // phone. Give the large Triplo its first pass before auto-playing a card.
    if (signatureIsPrimary()) return null;
    const score = state => {
      const box = state.link.getBoundingClientRect();
      return 2*state.ratio-Math.abs(box.top+box.height*.5-win.innerHeight*.48)/Math.max(1,win.innerHeight);
    };
    const best = available.filter(state => state.ratio >= .55).sort((a,b) => score(b)-score(a))[0];
    if (active && active.ratio >= .30 && !hidden(active) && (!best || score(best)<score(active)+.06)) return active;
    return best || null;
  }
  function finish(state, failed = false) {
    state.finished = true;
    if (!failed && state === active && state.presented && !blocked() && visible(state) && candidate() === state) {
      stopClock(state);
      state.link.setAttribute('data-appetite-holding','true');
    } else hide(state);
    if (!failed) syncWarm();
  }
  function onPlaying(state, video, token) {
    if (state.video === video && state.token !== token) return;
    if (disposed || active !== state || state.video !== video || state.finished || blocked() || !visible(state)) {
      video.pause(); return;
    }
    win.clearTimeout(state.loadTimer); state.loadTimer = null;
    state.presented = true; state.waiting = false;
    state.frame = clearFoodFrame(state.frame);
    state.link.setAttribute('data-appetite-playing','true');
    win.clearTimeout(state.endTimer);
    const remaining = Number.isFinite(video.duration) && video.duration > 0
      ? Math.min(Math.max(0, video.duration-video.currentTime)*1000+250, 12000) : PASS_MS;
    if (remaining <= 0) finish(state);
    else state.endTimer = win.setTimeout(() => finish(state),remaining);
    syncWarm();
  }
  function prepare(state, activation = false) {
    if (blocked() || hidden(state) || !state.videoURL || (state.warmFailed && !activation)) return null;
    if (state.video) return state.video;
    if (warm) release(warm, true);
    const video = doc.createElement('video');
    video.className = 'appetite-motion-video'; video.preload = 'auto';
    video.muted = video.defaultMuted = video.playsInline = true;
    video.loop = video.autoplay = video.controls = false;
    video.disablePictureInPicture = true; video.tabIndex = -1;
    video.setAttribute('aria-hidden','true'); video.setAttribute('playsinline',''); video.setAttribute('muted',''); video.setAttribute('disablepictureinpicture','');
    const image = state.posterFailed ? state.image : state.poster || state.image;
    video.poster = mediaURL(image?.currentSrc || image?.getAttribute('src')) || state.posterURL || state.originalURL;
    state.video = video; state.waiting = state.playStarted = state.awaitingStart = false; warm = state;
    state.mediaCleanups = [
      listen(video,'playing',() => {
        if (active !== state || state.video !== video || !state.playStarted || state.finished || blocked()) {video.pause(); return;}
        const token = state.token;
        if (state.presented || !video.requestVideoFrameCallback) {onPlaying(state,video,token); return;}
        if (state.frameRequest != null) return;
        state.frameRequest = video.requestVideoFrameCallback(() => {
          if (state.video !== video || state.token !== token) return;
          state.frameRequest = null;
          onPlaying(state,video,token);
        });
      }),
      listen(video,'ended',() => {if (active === state && state.video === video) finish(state);}),
      listen(video,'error',() => {
        if (state.video !== video || !video.hasAttribute('src')) return;
        if (active === state) finish(state,true);
        else {
          // A failed speculative request must not consume a visit. The actual
          // activation gets one fresh attempt; scrolling away rearms warming.
          state.warmFailed = true; release(state, true);
        }
      }),
      listen(video,'waiting',() => {
        if (active !== state || state.video !== video || !state.playStarted || state.finished) return;
        state.waiting = true;
        cancelWarmDwell();
        if (warm) release(warm, true);
        win.clearTimeout(state.loadTimer); state.loadTimer = win.setTimeout(() => finish(state,true),LOAD_TIMEOUT_MS);
      }),
      ...['progress','canplaythrough'].map(event => listen(video,event,() => {
        if (state.video !== video) return;
        recordFoodTransfer(video, win, state.loadStartedAt);
        tryStart(state);
        if (active === state) syncWarm();
      })),
      ...['loadedmetadata','loadeddata','canplay','suspend'].map(event => listen(video,event,() => {if (state.video === video) tryStart(state);})),
      listen(video,'timeupdate',() => {if (active === state) syncWarm();}),
    ];
    const selectedURL = mediaURL(selectFoodVideo(state.entry, win, state.link.getBoundingClientRect().width)) || state.videoURL;
    state.link.append(video);
    state.loadStartedAt = win.performance?.now?.() ?? Date.now();
    video.src = selectedURL;
    video.load();
    return video;
  }
  function syncWarm(maturedCandidate = null) {
    if (warm && (!nearby(warm) || blocked())) release(warm, true);
    if (blocked()) {cancelWarmDwell(); return;}
    // The opening owns the available network/decoder budget until it yields.
    // Explicit card intent is prepared by reconcile, without claiming play.
    if (pending) {cancelWarmDwell(); return;}
    if (!visibilityObserver || signatureIsPrimary() || signatureVideo?.hasAttribute('src')) {
      cancelWarmDwell();
      if (warm) release(warm, true);
      return;
    }
    if (owner && !owner.finished) {
      let fullyBuffered = false;
      const video = owner.video;
      try {
        for (let i = 0; i < video.buffered.length; i++) {
          // Estimated canplaythrough and a short lead can still compete with
          // the current request on mobile. Only the downloaded remainder is
          // safe to share bandwidth with a speculative neighbour.
          if (Number.isFinite(video.duration) && video.duration > 0
            && video.buffered.start(i) <= video.currentTime
            && video.buffered.end(i) >= video.duration - .02) {
            fullyBuffered = true; break;
          }
        }
      } catch { /* A released or not-yet-decoded element has no headroom. */ }
      if (!owner.presented || owner.waiting || !fullyBuffered) {
        cancelWarmDwell();
        if (warm) release(warm, true);
        return;
      }
    }
    const reference = owner?.link.getBoundingClientRect();
    const center = reference ? reference.top + reference.height / 2 : win.innerHeight * .48;
    const choices = [...cards.values()].filter(state => state !== owner && !state.warmFailed && nearby(state) && state.videoURL);
    const distance = state => {
      const box = state.link.getBoundingClientRect();
      const offset = box.top + box.height / 2 - center;
      // Cards in the same desktop row follow their reading order.
      return Math.abs(offset) < 1 && owner ? (state.order - owner.order) * .01 : offset;
    };
    const ahead = choices.filter(state => distance(state) * scrollDirection > 0);
    const next = (ahead.length ? ahead : owner ? [] : choices).sort((a,b) => Math.abs(distance(a)) - Math.abs(distance(b)) || a.order - b.order)[0];
    if (warm && warm !== next) release(warm, true);
    if (!next || next === warm) {cancelWarmDwell(); return;}
    if (next === maturedCandidate) {cancelWarmDwell(); prepare(next); return;}
    if (warming?.state === next) return;
    cancelWarmDwell();
    warming = {state:next,timer:win.setTimeout(() => {
      warming = null;
      syncWarm(next);
    },WARM_DWELL_MS)};
  }
  function tryStart(state) {
    const video = state.video;
    if (!state.awaitingStart || !video || active !== state || blocked() || state.finished || !visible(state) || candidate() !== state) return;
    // Chromium can estimate buffered time from bytes on these VBR clips.
    // Leave enough headroom for their large opening frames and require future
    // decoded data. Keep the still visible and always start the clip at zero.
    // Some browsers suspend even preload=auto once they judge playback ready.
    // Honour that decision instead of waiting for bytes they will not request
    // until play(); the regular load deadline still handles genuine failures.
    const suspendedReady = video.networkState === 1 && video.readyState === 4;
    const margin = suspendedReady ? .5 : 1.5;
    const required = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(margin,video.duration) : margin;
    let ready = false;
    try {
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.readyState >= 3 && video.buffered.start(i) <= .02 && video.buffered.end(i) >= required) {ready = true; break;}
      }
    } catch { /* Metadata or buffer ranges may still be unavailable. */ }
    if (!ready) return;
    const token = state.token;
    state.awaitingStart = false; state.playStarted = true;
    doc.dispatchEvent(new win.CustomEvent('smeet:food-claim',{detail:video}));
    // A synchronous claim listener can open a dialog or give playback back.
    if (blocked() || active !== state || state.video !== video || state.token !== token) return;
    let result;
    try {result = video.play();} catch {finish(state,true); return;}
    Promise.resolve(result).then(() => {
      if (state.video === video && state.token !== token) return;
      if (disposed || active !== state || state.video !== video || state.finished) video.pause();
    }, () => {
      if (!disposed && active === state && state.video === video && state.token === token) finish(state,true);
    });
    syncWarm();
  }
  function start(state) {
    if (blocked() || state.finished || candidate() !== state || !visible(state)) return;
    cancelWarmDwell();
    if (owner && owner !== state) release(owner, true);
    const video = prepare(state, true);
    if (!video) return;
    if (warm === state) warm = null;
    // A previously prepared element keeps its URL and buffer. A transient
    // candidate never reaches this point and therefore issues no request.
    try {if (video.currentTime !== 0) video.currentTime = 0;} catch { /* Metadata may still be arriving. */ }
    ++state.token;
    active = owner = state; state.attempted = state.awaitingStart = true; state.playStarted = false;
    state.loadTimer = win.setTimeout(() => finish(state,true),LOAD_TIMEOUT_MS);
    tryStart(state);
  }
  function reconcile() {
    if (disposed) return;
    if (blocked()) {
      cancelDwell(); cancelWarmDwell(); hide(); if (warm) release(warm, true);
      if (prefersStatic() || doc.hidden) cards.forEach(state => release(state));
      return;
    }
    for (const item of cards.values()) if (hidden(item)) release(item);
    const state = candidate();
    // IO can select the new reading card after the scroll rAF has already
    // run. Re-arm here, at the common reconciliation point, rather than
    // retaining the previous visit's stale reading owner until another scroll.
    if (state !== readingCard) {
      if (state?.finished) restartVisit(state);
      readingCard = state;
    }
    if (owner && owner !== state) hide(owner);
    if (!state || state.finished) {cancelDwell(); syncWarm(); return;}
    const dwell = state.focused ? 0 : !touch?.matches && state.hovered ? 40 : 90;
    if (active === state || (pending?.state === state && pending.dwell <= dwell)) {syncWarm(); return;}
    cancelDwell();
    cancelWarmDwell();
    if (warm && warm !== state) release(warm, true);
    pending = {state,dwell,timer:win.setTimeout(() => {
      pending = null;
      if (!blocked() && candidate() === state && !state.finished) start(state);
      else reconcile();
    },dwell)};
  }
  function attachPoster(state, entry, small, article) {
    const poster = doc.createElement('img');
    poster.className = 'appetite-motion-poster'; poster.alt = '';
    poster.setAttribute('aria-hidden','true'); poster.loading = 'lazy'; poster.decoding = 'async';
    const ready = () => {if (!disposed && poster.naturalWidth > 0) state.link.setAttribute('data-appetite-poster','ready');};
    listen(poster,'load',ready);
    listen(poster,'error',() => {
      if (disposed) return;
      state.posterFailed = true; state.link.removeAttribute('data-appetite-poster');
      if (state.video) state.video.poster = state.originalURL;
      poster.remove();
    });
    const sources = responsiveSources(entry.srcset) || (small && small !== state.posterURL ? `${small} 640w, ${state.posterURL} 960w` : '');
    if (sources) {
      poster.sizes = article.closest('[data-menu-group]')?.dataset.menuGroup === 'burger' ? '(max-width:760px) 90vw, 44vw' : '(max-width:760px) 90vw, (max-width:1100px) 44vw, 28vw';
      poster.srcset = sources;
    }
    state.poster = poster; state.link.append(poster); poster.src = small || state.posterURL;
    if (poster.complete) ready();
  }

  for (const link of root.querySelectorAll('.product-photo[data-product-photo]')) {
    const id = link.dataset.productPhoto, article = link.closest('[data-menu-product]');
    if (!article || article.dataset.menuProduct !== id || ids.has(id) || !entries || !Object.hasOwn(entries,id)) continue;
    const entry = entries[id];
    if (!entry || typeof entry !== 'object') continue;
    const small = mediaURL(entry.posterSmall), posterURL = mediaURL(entry.poster) || small, videoURL = mediaURL(entry.video);
    if (!posterURL && !videoURL) continue;
    const image = link.querySelector('img'), originalURL = mediaURL(image?.currentSrc || image?.getAttribute('src')) || '';
    const state = {link,image,entry,originalURL,posterURL,videoURL,poster:null,video:null,frame:null,posterFailed:false,hovered:false,focused:false,
      intent:0,ratio:0,near:null,order:cards.size,warmFailed:false,waiting:false,awaitingStart:false,playStarted:false,viewportArmed:true,rect:null,finished:false,attempted:false,token:0,presented:false,
      endTimer:null,loadTimer:null,mediaCleanups:[],attributes:STATE_ATTRIBUTES.map(name => [name,link.getAttribute(name)])};
    cards.set(link,state); ids.add(id); link.setAttribute('data-appetite-motion','');
    if (posterURL && posterURL !== originalURL && !image?.hasAttribute('data-appetite-still')) attachPoster(state,entry,small,article);
    listen(link,'pointerenter',event => {
      if (event.pointerType === 'touch') return;
      if (!state.hovered) recordIntent(state);
      state.hovered = true; reconcile();
    });
    const leave = () => {state.hovered = false; reconcile();};
    listen(link,'pointerleave',leave); listen(link,'pointercancel',leave);
    listen(link,'focusin',() => {if (!state.focused) recordIntent(state); state.focused = true; reconcile();});
    listen(link,'focusout',event => {if (!link.contains(event.relatedTarget)) {state.focused = false; reconcile();}});
    listen(link,'click',() => {if (pending?.state === state) cancelDwell(); hide(state);});
  }
  if (cards.size && win.IntersectionObserver) {
    visibilityObserver = new win.IntersectionObserver(batch => {
      if (disposed) return;
      for (const entry of batch) {
        const state = cards.get(entry.target);
        if (!state) continue;
        const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        if (ratio < .30) state.viewportArmed = true;
        if (ratio >= .55 && state.viewportArmed) {
          if (state.attempted) restartVisit(state);
          state.viewportArmed = false;
        }
        state.ratio = ratio; state.rect = entry.boundingClientRect || state.link.getBoundingClientRect();
        if (ratio === 0) {
          if (state !== warm || !nearby(state)) release(state);
          else state.frame = clearFoodFrame(state.frame);
        }
      }
      reconcile();
    },{threshold:[0,.30,.55,.8,1]});
    distanceObserver = new win.IntersectionObserver(batch => {
      if (disposed) return;
      for (const entry of batch) {
        const state = cards.get(entry.target);
        if (!state) continue;
        const wasNear = state.near;
        state.near = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (wasNear === false) state.warmFailed = false;
          continue;
        }
        state.ratio = 0; state.viewportArmed = true; state.hovered = false;
        if (pending?.state === state) cancelDwell();
        release(state);
      }
      reconcile();
    },{rootMargin:`${WARM_DISTANCE}px 0px`,threshold:0});
    for (const link of cards.keys()) {visibilityObserver.observe(link); distanceObserver.observe(link);}
  }
  const onPreference = () => {
    syncStillPhotos();
    if (prefersStatic()) {cancelDwell(); cancelWarmDwell(); cards.forEach(state => release(state));}
    reconcile();
  };
  watchPreference(reduced,onPreference); watchPreference(touch,reconcile);
  listen(connection,'change',onPreference);
  const yieldToHero = () => {cancelDwell(); cancelWarmDwell(); hide(owner); if (warm) release(warm, true);};
  listen(doc,'smeet:food-claim',event => {if (event.detail?.id === 'hero-film') yieldToHero();});
  listen(doc,'playing',event => {if (event.target?.id === 'hero-film') yieldToHero();},true);
  listen(doc,'visibilitychange',reconcile);
  listen(win,'pagehide',() => {cancelDwell(); cancelWarmDwell(); cards.forEach(state => release(state));});
  listen(win,'pageshow',reconcile);
  // Several cards can remain fully visible. Scrolling the reading position
  // hands playback to the next card on touch screens and desktops alike.
  listen(win,'scroll',() => {
    const movement = win.scrollY - previousScroll;
    if (Math.abs(movement) > 1) {scrollDirection = Math.sign(movement); previousScroll = win.scrollY;}
    if (!visibilityObserver || scrollFrame !== null) return;
    scrollFrame = win.requestAnimationFrame(() => {
      scrollFrame = null;
      if (blocked()) return;
      reconcile();
    });
  },{passive:true});
  if (cards.size && win.MutationObserver && doc.body) {
    bodyObserver = new win.MutationObserver(reconcile);
    bodyObserver.observe(doc.body,{attributes:true,attributeFilter:['class']});
    structureObserver = new win.MutationObserver(reconcile);
    structureObserver.observe(doc.body,{attributes:true,subtree:true,attributeFilter:['hidden','inert','open']});
  }
  return {
    signatureIsPrimary,
    setPaused(value) {if (!disposed) {paused = Boolean(value); reconcile();}},
    dispose() {
      if (disposed) return;
      disposed = true; cancelDwell(); cancelWarmDwell();
      if (scrollFrame !== null) win.cancelAnimationFrame(scrollFrame);
      visibilityObserver?.disconnect(); distanceObserver?.disconnect(); bodyObserver?.disconnect(); structureObserver?.disconnect();
      for (const state of cards.values()) {
        release(state);
        if (state.poster) {state.poster.removeAttribute('src'); state.poster.remove();}
        for (const [name,value] of state.attributes) {
          if (value === null) state.link.removeAttribute(name);
          else state.link.setAttribute(name,value);
        }
      }
      [...cleanups].forEach(remove => remove());
    },
  };
}
