/** Decorative feedback only: the cart owns quantities, announcements and focus.
 * capture() returns {trigger, rect, imageRect, imageURL}; rects are plain viewport
 * coordinates saved before a render or dialog close can remove the source.
 * play() accepts an optional replacement trigger, destination and overlay host.
 */
export function createCartFeedback({doc = document, reducedMotion} = {}) {
  const view = doc.defaultView;
  const controller = new (view.AbortController || AbortController)();
  const {signal} = controller;
  const media = reducedMotion && typeof reducedMotion === 'object' ? reducedMotion
    : typeof reducedMotion === 'boolean' ? null : view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const decorated = new Set();
  let active = null, disposed = false;
  const stopped = () => Boolean(typeof reducedMotion === 'boolean' ? reducedMotion : media?.matches)
    || doc.hidden || doc.body.classList.contains('motion-paused');
  const rectOf = node => {
    if (!node?.isConnected || typeof node.getBoundingClientRect !== 'function') return null;
    const {left,top,width,height} = node.getBoundingClientRect();
    return [left,top,width,height].every(Number.isFinite) && width > 0 && height > 0 ? {left,top,width,height} : null;
  };
  const visible = node => {
    const rect = rectOf(node);
    if (!rect || node.closest('[hidden],dialog:not([open])')) return false;
    const style = view.getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
      && rect.left < view.innerWidth && rect.top < view.innerHeight && rect.left + rect.width > 0 && rect.top + rect.height > 0;
  };
  const decorate = button => {
    if (!button?.isConnected || !button.matches('[data-add-to-cart],.dialog-add')) return;
    for (const node of decorated) if (!node.isConnected) decorated.delete(node);
    if (!button.classList.contains('smeet-jelly-button')) {
      button.classList.add('smeet-jelly-button'); decorated.add(button);
    }
  };
  doc.querySelectorAll('[data-add-to-cart],.dialog-add').forEach(decorate);
  function capture(trigger, imageURL) {
    const area = trigger?.closest?.('.product-card,.signature-section,.product-dialog,.smeet-cart-item');
    const image = area?.querySelector('.dialog-product-image,.smeet-cart-item-image,.product-photo img,.signature-photo img');
    return {trigger,rect:rectOf(trigger),imageRect:visible(image) ? rectOf(image) : null,
      imageURL:imageURL || image?.currentSrc || image?.src || ''};
  }
  function cancel() {
    if (!active) return;
    active.timers.forEach(timer => view.clearTimeout(timer));
    active.animations.forEach(animation => animation.cancel());
    active.classes.forEach(([node,name]) => node.classList.remove(name));
    active.layer.remove(); active = null;
  }
  function play(snapshot, {target,host,trigger = snapshot?.trigger} = {}) {
    cancel();
    if (disposed || !snapshot || doc.hidden) return false;
    const modal = doc.querySelector('dialog[open]');
    host ||= modal || doc.body;
    if (!host?.isConnected || (modal && !modal.contains(host))) return false;
    target ||= host.matches?.('dialog') ? host.querySelector('.smeet-cart-header-count')
      : [...doc.querySelectorAll('.mobile-quick-nav .quick-order,.header-bag')].find(visible)
        || [...doc.querySelectorAll('[data-cart-open]')].find(visible);
    if (!visible(target) || (modal && !modal.contains(target))) return false;
    decorate(trigger);
    const layer = doc.createElement('div');
    layer.className = 'smeet-cart-feedback-layer'; layer.setAttribute('aria-hidden','true');
    // Absolute inside a dialog keeps the overlay in its native top layer. The
    // measured scale below also handles the bag's brief opening transform.
    if (host !== doc.body) layer.classList.add('smeet-cart-feedback-layer--modal');
    host.append(layer);
    const run = active = {layer,timers:new Set(),animations:[],classes:[]};
    const later = (callback, delay) => {
      const timer = view.setTimeout(() => {run.timers.delete(timer); if (active === run) callback();},delay);
      run.timers.add(timer);
    };
    const addClass = (node,name) => {
      if (!node?.isConnected) return;
      node.classList.add(name); run.classes.push([node,name]);
    };
    const animate = (node,frames,options) => {
      if (typeof node.animate !== 'function') return false;
      try { const animation = node.animate(frames,options); run.animations.push(animation); return true; }
      catch { return false; }
    };
    const bounds = layer.getBoundingClientRect();
    const scaleX = layer.offsetWidth ? bounds.width / layer.offsetWidth : 1;
    const scaleY = layer.offsetHeight ? bounds.height / layer.offsetHeight : 1;
    const point = rect => ({x:(rect.left + rect.width / 2 - bounds.left) / (scaleX || 1),
      y:(rect.top + rect.height / 2 - bounds.top) / (scaleY || 1)});
    const destination = point(rectOf(target));
    const plus = doc.createElement('span');
    plus.className = 'smeet-cart-plus-one'; plus.textContent = '+1';
    // Keep the receipt inside the visible host, including the desktop header.
    plus.style.left = `${destination.x}px`;
    plus.style.top = `${Math.max(18,destination.y - 28)}px`;
    const receipt = motion => {
      layer.append(plus);
      if (motion) {
        addClass(target,'smeet-cart-target-pulse');
        animate(plus,[{opacity:0,transform:'translate(-50%, -20%) scale(.85)'},
          {opacity:1,transform:'translate(-50%, -50%) scale(1)',offset:.2},
          {opacity:1,transform:'translate(-50%, -65%) scale(1)',offset:.72},
          {opacity:0,transform:'translate(-50%, -95%) scale(.96)'}],{duration:620,easing:'ease-out',fill:'forwards'});
      }
    };
    if (stopped()) { receipt(false); later(cancel,1000); return true; }
    addClass(trigger,'smeet-jelly-active');
    const origin = snapshot.imageRect || snapshot.rect;
    if (origin && snapshot.imageURL) {
      const source = point(origin), flyer = doc.createElement('img');
      flyer.className = 'smeet-cart-flight'; flyer.alt = ''; flyer.draggable = false;
      flyer.src = snapshot.imageURL; flyer.width = flyer.height = 60;
      flyer.style.left = `${source.x - 30}px`; flyer.style.top = `${source.y - 30}px`;
      layer.append(flyer);
      const dx = destination.x - source.x, dy = destination.y - source.y;
      const flew = animate(flyer,[{transform:'translate(0, 0) scale(1)',opacity:1},
        {transform:`translate(${dx * .38}px, ${dy * .38 - Math.min(70,Math.abs(dx) * .16 + 24)}px) scale(.84) rotate(-8deg)`,opacity:1,offset:.42},
        {transform:`translate(${dx}px, ${dy}px) scale(.22) rotate(8deg)`,opacity:0}],
      {duration:480,easing:'cubic-bezier(.25,.65,.35,1)',fill:'forwards'});
      if (flew) later(() => {flyer.remove(); receipt(true);},480);
      else {flyer.remove(); receipt(false);}
    } else receipt(true);
    later(cancel,1120);
    return true;
  }
  const sync = () => {if (stopped()) cancel();};
  media?.addEventListener?.('change',sync,{signal});
  doc.addEventListener('visibilitychange',cancel,{signal});
  view.addEventListener('resize',cancel,{signal,passive:true});
  view.addEventListener('scroll',cancel,{signal,passive:true,capture:true});
  view.visualViewport?.addEventListener('resize',cancel,{signal,passive:true});
  view.visualViewport?.addEventListener('scroll',cancel,{signal,passive:true});
  const Observer = view.MutationObserver;
  const pauseObserver = new Observer(sync), dialogObserver = new Observer(records => {
    if (records.some(record => record.target.matches?.('dialog'))) cancel();
  });
  pauseObserver.observe(doc.body,{attributes:true,attributeFilter:['class']});
  dialogObserver.observe(doc.body,{attributes:true,attributeFilter:['open'],subtree:true});
  return {capture,play,cancel,dispose() {
    if (disposed) return;
    cancel(); disposed = true; controller.abort(); pauseObserver.disconnect(); dialogObserver.disconnect();
    decorated.forEach(node => node.classList.remove('smeet-jelly-button')); decorated.clear();
  }};
}
