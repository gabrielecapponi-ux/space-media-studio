// One decoder serves the current menu visit. Photos and links stay in the HTML.
const PASS_MS = 5000;
const LOAD_TIMEOUT_MS = 3200;
const FADE_MS = 160;
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
  const staticSources = [...doc.querySelectorAll('source[data-food-static]')].map(source => [source,source.media]);
  function syncStillPhotos() {
    for (const [source,media] of staticSources) {
      const selected = connection?.saveData ? 'all' : media;
      if (source.media !== selected) source.media = selected;
    }
  }
  syncStillPhotos();
  let active = null, owner = null, pending = null, readingCard = null, intent = 0, disposed = false;
  let visibilityObserver, distanceObserver, structureObserver, bodyObserver, scrollFrame = null;
  const now = () => win.performance?.now?.() ?? Date.now();
  const prefersStatic = () => Boolean(typeof reduced === 'boolean' ? reduced : reduced?.matches) || connection?.saveData;
  const blocked = () => disposed || paused || prefersStatic() || doc.hidden || doc.body?.classList.contains('motion-paused') || Boolean(doc.querySelector('dialog[open]'));
  const hidden = state => !state.link.isConnected || Boolean(state.link.closest('[hidden],[inert]'));
  const visible = state => {
    if (hidden(state)) return false;
    const box = state.link.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0 && box.top < win.innerHeight && box.left < win.innerWidth;
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
  function stopClock(state) {
    state.token++;
    if (state.frameRequest != null) state.video?.cancelVideoFrameCallback?.(state.frameRequest);
    state.frameRequest = null;
    win.clearTimeout(state.endTimer); win.clearTimeout(state.loadTimer);
    state.endTimer = state.loadTimer = null;
    if (state.startedAt !== null) state.spent += Math.max(0, now()-state.startedAt);
    state.startedAt = null;
    if (state.spent >= PASS_MS) state.finished = true;
    state.video?.pause();
  }
  function release(state) {
    win.clearTimeout(state.retireTimer);
    state.retireTimer = state.retireAt = null;
    const video = state.video;
    if (!video) return;
    stopClock(state);
    state.link.removeAttribute('data-appetite-playing');
    state.link.removeAttribute('data-appetite-holding');
    if (active === state) active = null;
    if (owner === state) owner = null;
    state.presented = false;
    state.video = null;
    state.mediaCleanups.forEach(remove => remove());
    video.removeAttribute('src'); video.load(); video.remove();
    if (state.attempted) state.finished = true;
  }
  function hide(state = owner, immediate = false) {
    if (!state?.video) return;
    stopClock(state); state.finished = true;
    state.link.removeAttribute('data-appetite-playing');
    state.link.removeAttribute('data-appetite-holding');
    if (active === state) active = null;
    if (immediate || disposed || doc.hidden || prefersStatic() || !state.presented) release(state);
    else if (state.retireTimer === null) {
      state.retireAt = now()+FADE_MS;
      state.retireTimer = win.setTimeout(() => release(state),FADE_MS);
    }
  }
  function restartVisit(state) {
    release(state);
    state.finished = false; state.spent = 0; state.attempted = false;
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
    if (!touch?.matches || !visibilityObserver) return null;
    // At the new compact opening both the hero and first menu row fit on a
    // phone. Give the large Triplo its first pass before auto-playing a card.
    if (signatureIsPrimary()) return null;
    const score = state => {
      const box = state.link.getBoundingClientRect();
      return 2*state.ratio-Math.abs(box.top+box.height*.5-win.innerHeight*.48)/Math.max(1,win.innerHeight);
    };
    const best = available.filter(state => state.ratio >= .55).sort((a,b) => score(b)-score(a))[0];
    if (active && active.ratio >= .30 && !hidden(active) && (!best || score(best)<score(active)+.15)) return active;
    return best || null;
  }
  function finish(state, failed = false) {
    state.finished = true;
    if (!failed && state === active && state.presented && !blocked() && visible(state) && candidate() === state) {
      stopClock(state);
      state.link.setAttribute('data-appetite-holding','true');
    } else hide(state,failed);
  }
  function onPlaying(state, video) {
    if (disposed || active !== state || state.video !== video || state.finished || blocked() || hidden(state)) {
      video.pause(); return;
    }
    win.clearTimeout(state.loadTimer); state.loadTimer = null;
    state.startedAt ??= now(); state.presented = true;
    state.link.setAttribute('data-appetite-playing','true');
    win.clearTimeout(state.endTimer);
    const remaining = PASS_MS-state.spent-Math.max(0,now()-state.startedAt);
    if (remaining <= 0) finish(state);
    else state.endTimer = win.setTimeout(() => finish(state),remaining);
  }
  function start(state) {
    if (blocked() || state.finished || candidate() !== state || !visible(state)) return;
    if (owner) release(owner);
    const video = doc.createElement('video');
    video.className = 'appetite-motion-video'; video.preload = 'none';
    video.muted = video.defaultMuted = video.playsInline = true;
    video.loop = video.autoplay = video.controls = false;
    video.disablePictureInPicture = true; video.tabIndex = -1;
    video.setAttribute('aria-hidden','true'); video.setAttribute('playsinline',''); video.setAttribute('muted',''); video.setAttribute('disablepictureinpicture','');
    const image = state.posterFailed ? state.image : state.poster || state.image;
    video.poster = mediaURL(image?.currentSrc || image?.getAttribute('src')) || state.posterURL || state.originalURL;
    state.mediaCleanups = [
      listen(video,'playing',() => {
        if (state.presented || !video.requestVideoFrameCallback) {onPlaying(state,video); return;}
        if (state.frameRequest != null) return;
        state.frameRequest = video.requestVideoFrameCallback(() => {
          state.frameRequest = null;
          onPlaying(state,video);
        });
      }),
      listen(video,'ended',() => {if (state.video === video) finish(state);}),
      listen(video,'error',() => {if (state.video === video && video.hasAttribute('src')) finish(state,true);}),
      listen(video,'waiting',() => {
        if (active !== state || state.finished) return;
        win.clearTimeout(state.loadTimer); state.loadTimer = win.setTimeout(() => finish(state,true),LOAD_TIMEOUT_MS);
      }),
    ];
    const token = ++state.token;
    doc.dispatchEvent(new win.CustomEvent('smeet:food-claim',{detail:video}));
    active = owner = state; state.video = video; state.attempted = true;
    state.link.append(video); video.src = state.videoURL;
    state.loadTimer = win.setTimeout(() => finish(state,true),LOAD_TIMEOUT_MS);
    let result;
    try {result = video.play();} catch {finish(state,true); return;}
    Promise.resolve(result).then(() => {
      if (disposed || active !== state || state.video !== video || state.finished) video.pause();
    }, () => {
      if (!disposed && active === state && state.video === video && state.token === token) finish(state,true);
    });
  }
  function reconcile() {
    if (disposed) return;
    if (blocked()) {cancelDwell(); hide(); return;}
    const state = candidate();
    if (owner && owner !== state) hide(owner);
    if (!state || state.finished) {cancelDwell(); return;}
    if (active === state || pending?.state === state) return;
    cancelDwell();
    const dwell = touch?.matches && !state.focused ? 320 : 140;
    const wait = Math.max(dwell, owner?.retireAt == null ? 0 : owner.retireAt-now());
    pending = {state,timer:win.setTimeout(() => {
      pending = null;
      if (!blocked() && candidate() === state && !state.finished) start(state);
    },wait)};
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
    const state = {link,image,originalURL,posterURL,videoURL,poster:null,video:null,posterFailed:false,hovered:false,focused:false,
      intent:0,ratio:0,viewportArmed:true,rect:null,spent:0,startedAt:null,finished:false,attempted:false,token:0,presented:false,
      endTimer:null,loadTimer:null,retireTimer:null,retireAt:null,mediaCleanups:[],attributes:STATE_ATTRIBUTES.map(name => [name,link.getAttribute(name)])};
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
        if (touch?.matches) {
          if (ratio < .30) state.viewportArmed = true;
          if (ratio >= .55 && state.viewportArmed) {
            if (state.attempted) restartVisit(state);
            state.viewportArmed = false;
          }
        }
        state.ratio = ratio; state.rect = entry.boundingClientRect || state.link.getBoundingClientRect();
      }
      reconcile();
    },{threshold:[0,.30,.55,.8,1]});
    distanceObserver = new win.IntersectionObserver(batch => {
      if (disposed) return;
      for (const entry of batch) {
        const state = cards.get(entry.target);
        if (!state || entry.isIntersecting) continue;
        state.ratio = 0; state.viewportArmed = true; state.hovered = false;
        if (pending?.state === state) cancelDwell();
        release(state);
      }
    },{rootMargin:'600px 0px',threshold:0});
    for (const link of cards.keys()) {visibilityObserver.observe(link); distanceObserver.observe(link);}
  }
  const onPreference = () => {
    syncStillPhotos();
    if (prefersStatic()) {cancelDwell(); cards.forEach(release);}
    reconcile();
  };
  watchPreference(reduced,onPreference); watchPreference(touch,reconcile);
  listen(connection,'change',onPreference);
  listen(doc,'smeet:food-claim',event => {if (event.detail?.id === 'hero-film') {cancelDwell(); hide(owner,true);}});
  listen(doc,'playing',event => {if (event.target?.id === 'hero-film') {cancelDwell(); hide(owner,true);}},true);
  listen(doc,'visibilitychange',reconcile);
  listen(win,'pagehide',() => {cancelDwell(); cards.forEach(release);});
  listen(win,'pageshow',reconcile);
  // Compact phone rows can all remain 100% visible. Crossing the reading
  // position still hands playback to the next card without an IO threshold.
  listen(win,'scroll',() => {
    if (!touch?.matches || !visibilityObserver || scrollFrame !== null) return;
    scrollFrame = win.requestAnimationFrame(() => {
      scrollFrame = null;
      if (blocked()) return;
      const next = candidate();
      if (next && next !== readingCard && next.finished) restartVisit(next);
      readingCard = next;
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
      disposed = true; cancelDwell();
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
