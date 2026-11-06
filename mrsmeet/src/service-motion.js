/**
 * Finite motion for product photos and service renders. These are raster images
 * on the web, not live 3D geometry. Text and controls never wait for image motion.
 *
 * [data-service-motion][data-service-type="bag"|"truck"]
 *   [data-service-object]  — image/figure; module owns its transform while moving
 *   [data-service-replay]  — optional dedicated button; primary actions untouched
 * includeMenuImages adds the existing .simple-menu .product-photo > img without
 * changing HTML attributes, product actions, dimensions, or initial visibility.
 */
export function mountServiceMotion({root = document, reducedMotion, includeMenuImages = false} = {}) {
  const doc = root?.ownerDocument || root;
  const view = doc?.defaultView;
  if (!root?.querySelectorAll || !view) return {dispose() {},setPaused() {}};
  const media = reducedMotion && typeof reducedMotion === 'object' ? reducedMotion
    : typeof reducedMotion === 'boolean' ? null : view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const finePointer = view.matchMedia?.('(hover: hover) and (pointer: fine)');
  const removers = [];
  const classes = ['service-motion-mounted','service-motion-animating','service-motion-tilting','service-motion-resetting','service-motion-stopped','service-motion-menu'];
  let disposed = false, paused = false;
  const hosts = [...root.querySelectorAll('[data-service-motion]')];
  if (root.matches?.('[data-service-motion]')) hosts.unshift(root);
  const menuHosts = includeMenuImages ? new Set(root.querySelectorAll('.simple-menu .product-photo')) : new Set();
  for (const host of menuHosts) if (!hosts.includes(host)) hosts.push(host);
  const records = hosts.map(host => {
    const menu = menuHosts.has(host);
    const object = host.querySelector(menu ? 'img' : '[data-service-object]');
    if (!object) return null;
    const image = object.matches?.('img') ? object : object.querySelector?.('img');
    return {
      host,object,image,menu,type:menu ? 'food' : host.dataset.serviceType || 'default',
      entered:false,visible:false,animation:null,version:0,pointer:null,frame:0,resetTimer:0,
      visibleSince:0,entryTimer:0,imageVersion:0,imageState:image ? 'pending' : 'ready',
      transform:object.style.transform,
      originalClasses:new Set(host.classList),
      originalState:host.getAttribute('data-service-state'),
    };
  }).filter(Boolean);
  const byHost = new Map(records.map(record => [record.host,record]));
  const listen = (target,type,callback,options) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type,callback,options);
    removers.push(() => target.removeEventListener(type,callback,options));
  };
  const reduced = () => typeof reducedMotion === 'boolean' ? reducedMotion : Boolean(media?.matches);
  const globallyStopped = () => disposed || paused || reduced() || Boolean(doc.hidden) || doc.body?.classList.contains('motion-paused');
  const canMove = record => !globallyStopped() && record.visible;
  const now = () => view.performance.now();
  const identity = 'translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)';

  function clearEntry(record) {
    view.clearTimeout(record.entryTimer); record.entryTimer = 0;
  }

  function clearPointer(record, immediate = true) {
    view.cancelAnimationFrame(record.frame); view.clearTimeout(record.resetTimer);
    record.frame = 0; record.resetTimer = 0; record.pointer = null;
    record.host.classList.remove('service-motion-tilting','service-motion-resetting');
    // A short CSS return is only useful while the object remains visible.
    if (!immediate && canMove(record) && !record.animation) {
      record.host.classList.add('service-motion-resetting');
      record.resetTimer = view.setTimeout(() => {
        record.resetTimer = 0;
        record.host.classList.remove('service-motion-resetting');
      },180);
    }
    record.object.style.transform = record.transform;
    if (!record.animation) record.host.dataset.serviceState = 'settled';
  }
  function settle(record) {
    clearEntry(record);
    record.version++;
    const animation = record.animation;
    record.animation = null;
    animation?.cancel();
    clearPointer(record);
    record.host.classList.remove('service-motion-animating');
    record.host.dataset.serviceState = 'settled';
  }
  function animate(record, frames, duration, state) {
    if (!canMove(record) || typeof record.object.animate !== 'function') { settle(record); return false; }
    // Repeated clicks coalesce; they never stack or restart a running flourish.
    if (record.animation) return false;
    clearPointer(record);
    const token = ++record.version;
    record.host.classList.add('service-motion-animating');
    record.host.dataset.serviceState = state;
    try {
      const animation = record.object.animate(frames,{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
      record.animation = animation;
      Promise.resolve(animation.finished).then(() => {
        if (disposed || token !== record.version || record.animation !== animation) return;
        settle(record);
      },() => {
        if (!disposed && token === record.version && record.animation === animation) settle(record);
      });
      return true;
    } catch { settle(record); return false; }
  }
  function enter(record) {
    if (record.entered || !record.visible) return;
    clearEntry(record);
    const elapsed = now()-record.visibleSince;
    // HTML is always visible. A brief dwell ignores fly-by scrolling; a late
    // image stays static instead of unexpectedly starting a delayed entrance.
    if (globallyStopped() || record.imageState === 'error' || elapsed > 600) {
      record.entered = true; settle(record); return;
    }
    if (record.imageState !== 'ready' || elapsed < 80) {
      record.entryTimer = view.setTimeout(() => {
        record.entryTimer = 0;
        if (record.imageState !== 'ready') { record.entered = true; return; }
        enter(record);
      },record.imageState === 'ready' ? 80-elapsed : Math.max(0,600-elapsed));
      return;
    }
    record.entered = true;
    const rect = record.host.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= view.innerHeight
      || rect.right <= 0 || rect.left >= view.innerWidth || record.host.closest('[hidden]')) return;
    let from = 'translate3d(0,12px,0) scale(.985)';
    if (record.type === 'food') from = 'translate3d(0,8px,0) scale(.985)';
    if (record.type === 'bag') from = 'translate3d(0,14px,0) rotateX(1deg) rotateZ(-1deg) scale(.985)';
    if (record.type === 'truck') from = 'translate3d(18px,8px,0) rotateZ(-.5deg) scale(.99)';
    const base = view.getComputedStyle(record.object).transform || 'none';
    animate(record,[{transform:base === 'none' ? from : `${base} ${from}`},{transform:base}],record.menu ? 420 : 520,'entering');
  }
  function replay(record) {
    record.visibilityCheck?.();
    if (!record.visible || record.imageState !== 'ready' || globallyStopped()) return false;
    let middle = 'translate3d(0,-5px,0) rotateY(-8deg) rotateZ(-2deg) scale(1.01)';
    let returning = 'translate3d(0,-2px,0) rotateY(5deg) rotateZ(1deg) scale(1)';
    if (record.type === 'bag') middle = 'translate3d(0,-5px,0) rotateX(2deg) rotateY(-8deg) rotateZ(-2deg) scale(1.01)';
    if (record.type === 'truck') {
      middle = 'translate3d(-8px,-3px,0) rotateY(-7deg) rotateZ(-1deg) scale(1.01)';
      returning = 'translate3d(3px,0,0) rotateY(4deg) rotateZ(0deg) scale(1)';
    }
    return animate(record,[{transform:identity},{transform:middle,offset:.38},{transform:returning,offset:.72},{transform:identity}],600,'replaying');
  }
  function movePointer(record,event) {
    if (record.menu || record.type === 'food' || record.imageState !== 'ready') return;
    if (event.pointerType && event.pointerType !== 'mouse') { clearPointer(record); return; }
    if (!canMove(record) || !finePointer?.matches || record.animation) return;
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    record.pointer = {x:event.clientX,y:event.clientY};
    if (record.frame) return;
    record.frame = view.requestAnimationFrame(() => {
      record.frame = 0;
      if (!record.pointer || !canMove(record) || !finePointer?.matches || record.animation) return;
      const rect = record.host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const clamp = value => Math.max(-1,Math.min(1,value));
      const x = clamp((record.pointer.x - rect.left) / rect.width * 2 - 1);
      const y = clamp((record.pointer.y - rect.top) / rect.height * 2 - 1);
      view.clearTimeout(record.resetTimer); record.resetTimer = 0;
      record.host.classList.remove('service-motion-resetting');
      record.host.classList.add('service-motion-tilting');
      record.host.dataset.serviceState = 'tilting';
      record.object.style.transform = `rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
  }
  for (const record of records) {
    record.host.classList.add('service-motion-mounted');
    if (record.menu) record.host.classList.add('service-motion-menu');
    record.host.dataset.serviceState = 'settled';
    listen(record.host,'pointermove',event => movePointer(record,event),{passive:true});
    listen(record.host,'pointerleave',() => {
      clearPointer(record,false);
      if (!record.animation) record.host.dataset.serviceState = 'settled';
    });
    listen(record.host,'pointercancel',() => {
      clearPointer(record);
      if (!record.animation) record.host.dataset.serviceState = 'settled';
    });
    record.host.querySelectorAll('[data-service-replay]').forEach(button => {
      // No preventDefault / stopPropagation: unrelated CTA behavior stays intact.
      listen(button,'click',() => replay(record));
    });
    if (record.image) {
      const loaded = () => {
        const token = ++record.imageVersion;
        const source = record.image.currentSrc || record.image.src;
        const done = success => {
          if (disposed || token !== record.imageVersion || source !== (record.image.currentSrc || record.image.src)) return;
          record.imageState = success ? 'ready' : 'error'; enter(record);
        };
        if (!record.image.naturalWidth) { done(false); return; }
        if (typeof record.image.decode !== 'function') { done(true); return; }
        try { Promise.resolve(record.image.decode()).then(() => done(true),() => done(false)); }
        catch { done(false); }
      };
      listen(record.image,'load',loaded);
      listen(record.image,'error',() => {record.imageVersion++;record.imageState='error';enter(record);});
      if (record.image.complete) loaded();
    }
  }
  const observer = typeof view.IntersectionObserver === 'function' ? new view.IntersectionObserver(entries => {
    if (disposed) return;
    for (const entry of entries) {
      const record = byHost.get(entry.target);
      if (!record) continue;
      const visible = Boolean(entry.isIntersecting) && (entry.intersectionRatio ?? 1) >= .12;
      if (visible && !record.visible) record.visibleSince = now();
      if (!visible && record.visible) record.entered = true;
      record.visible = visible;
      if (visible) enter(record); else settle(record);
    }
  },{threshold:.12}) : null;
  if (observer) records.forEach(record => observer.observe(record.host));
  else {
    // No visibility observer: retain static HTML, with deliberate replay only
    // when its host actually intersects the viewport at the time of the click.
    records.forEach(record => {
      record.entered = true;
      const visibleNow = () => {
        const rect = record.host.getBoundingClientRect();
        record.visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
          && rect.top < view.innerHeight && rect.left < view.innerWidth;
      };
      record.visibilityCheck = visibleNow;
      visibleNow();
      listen(record.host,'pointerenter',visibleNow,{passive:true});
      record.host.querySelectorAll('[data-service-replay]').forEach(button => listen(button,'pointerdown',visibleNow,{passive:true}));
      listen(record.host,'focusin',visibleNow);
    });
  }
  function syncMotion() {
    const stop = globallyStopped();
    records.forEach(record => {
      record.host.classList.toggle('service-motion-stopped',Boolean(stop));
      if (stop) { if (record.visible) record.entered = true; settle(record); }
    });
  }
  listen(media,'change',syncMotion);
  listen(doc,'visibilitychange',syncMotion);
  listen(finePointer,'change',() => records.forEach(record => clearPointer(record)));
  listen(view,'resize',() => records.forEach(record => { record.visibilityCheck?.(); clearPointer(record); }),{passive:true});
  if (!observer) listen(view,'scroll',() => records.forEach(record => {
    record.visibilityCheck?.();
    if (!record.visible) settle(record);
  }),{passive:true,capture:true});
  const pauseObserver = typeof view.MutationObserver === 'function' && doc.body
    ? new view.MutationObserver(syncMotion) : null;
  pauseObserver?.observe(doc.body,{attributes:true,attributeFilter:['class']});
  syncMotion();
  return {
    setPaused(value) { if (!disposed) { paused = Boolean(value); syncMotion(); } },
    dispose() {
      if (disposed) return;
      disposed = true; observer?.disconnect(); pauseObserver?.disconnect();
      removers.forEach(remove => remove());
      records.forEach(record => {
        settle(record);
        classes.forEach(className => record.host.classList.toggle(className,record.originalClasses.has(className)));
        if (record.originalState === null) record.host.removeAttribute('data-service-state');
        else record.host.setAttribute('data-service-state',record.originalState);
      });
    },
  };
}
