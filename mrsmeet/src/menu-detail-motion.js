/**
 * Original motion for a native <dialog>. No external component source.
 * The caller fills the content and calls showModal() before open(opener).
 * Native focus, modal semantics and scrollable content remain with the dialog.
 */
export function mountDetailMotion({dialog, reducedMotion} = {}) {
  const empty = {open:() => Promise.resolve(false), close:() => Promise.resolve(false), dispose() {}};
  if (!dialog || typeof dialog.close !== 'function') return empty;
  const doc = dialog.ownerDocument;
  const view = doc?.defaultView;
  const media = reducedMotion && typeof reducedMotion === 'object'
    ? reducedMotion
    : typeof reducedMotion === 'boolean' ? null : view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  const Controller = view?.AbortController || AbortController;
  const controller = new Controller();
  let animation = null, version = 0, phase = 'idle', closeTask = null, disposed = false;
  const hadClass = dialog.classList.contains('detail-motion-enabled');
  dialog.classList.add('detail-motion-enabled');
  const stopped = () => disposed || Boolean(typeof reducedMotion === 'boolean' ? reducedMotion : media?.matches)
    || Boolean(doc?.hidden) || Boolean(doc?.body?.classList.contains('motion-paused'));
  const canAnimate = () => !stopped() && typeof dialog.animate === 'function';
  const reset = () => {
    version++;
    animation?.cancel(); animation = null;
    phase = 'idle'; closeTask = null;
    dialog.classList.remove('detail-is-animating','detail-is-closing');
  };
  const nativeClose = expected => {
    if (disposed || expected !== version || !dialog.open) return false;
    reset();
    dialog.close(); // The existing close listener owns restoration of focus.
    return true;
  };
  const currentFrame = () => {
    const style = view?.getComputedStyle?.(dialog);
    const opacity = Number.parseFloat(style?.opacity);
    return {transform:style?.transform || 'none',opacity:Number.isFinite(opacity) ? opacity : 1};
  };
  const openerOrigin = opener => {
    const target = dialog.getBoundingClientRect();
    const source = opener?.isConnected && typeof opener.getBoundingClientRect === 'function' ? opener.getBoundingClientRect() : null;
    if (!source || !target.width || !target.height) return {origin:'50% 50%',x:0,y:10};
    const x = source.left + source.width / 2 - (target.left + target.width / 2);
    const y = source.top + source.height / 2 - (target.top + target.height / 2);
    const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
    return {
      origin:`${clamp(50 + x / target.width * 100,10,90).toFixed(1)}% ${clamp(50 + y / target.height * 100,10,90).toFixed(1)}%`,
      x:clamp(x*.055,-18,18), y:clamp(y*.045,-16,16),
    };
  };
  function open(opener) {
    if (disposed || !dialog.open) return Promise.resolve(false);
    // Read an in-flight close before cancelling, so reopening continues smoothly.
    const previous = phase !== 'idle' ? currentFrame() : null;
    const source = openerOrigin(opener);
    reset();
    if (!canAnimate()) return Promise.resolve(true);
    const token = version;
    phase = 'opening'; dialog.classList.add('detail-is-animating');
    try {
      animation = dialog.animate([
        {...(previous || {transform:`translate(${source.x.toFixed(2)}px, ${source.y.toFixed(2)}px) scale(.965)`,opacity:.64}),transformOrigin:source.origin},
        {transform:'translate(0, 0) scale(1)',opacity:1,transformOrigin:source.origin},
      ],{duration:200,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
      const ownAnimation = animation;
      return ownAnimation.finished.then(() => {
        if (disposed || token !== version) return false;
        reset();
        return true;
      },() => false);
    } catch {
      reset();
      return Promise.resolve(true); // The visible native dialog remains usable.
    }
  }
  function close() {
    if (disposed || !dialog.open) return Promise.resolve(false);
    if (phase === 'closing' && closeTask) return closeTask;
    const from = currentFrame();
    reset();
    const token = version;
    if (!canAnimate()) return Promise.resolve(nativeClose(token));
    phase = 'closing'; dialog.classList.add('detail-is-animating','detail-is-closing');
    try {
      animation = dialog.animate([
        from,
        {transform:'translateY(7px) scale(.985)',opacity:0},
      ],{duration:140,easing:'cubic-bezier(.25,1,.5,1)',fill:'forwards'});
      const ownAnimation = animation;
      closeTask = ownAnimation.finished.then(() => nativeClose(token),() => false);
      return closeTask;
    } catch {
      return Promise.resolve(nativeClose(token));
    }
  }
  const onCancel = event => {
    if (disposed || event.defaultPrevented || !dialog.open) return;
    event.preventDefault();
    void close();
  };
  const onNativeClose = () => {
    // A queued close event from the previous opening must not cancel a new one.
    if (!dialog.open) reset();
  };
  const syncMotion = () => {
    if (!stopped()) return;
    if (phase === 'closing') nativeClose(version);
    else reset();
  };
  dialog.addEventListener('cancel',onCancel,{signal:controller.signal});
  dialog.addEventListener('close',onNativeClose,{signal:controller.signal});
  doc?.addEventListener('visibilitychange',syncMotion,{signal:controller.signal});
  media?.addEventListener?.('change',syncMotion,{signal:controller.signal});
  const Observer = view?.MutationObserver || globalThis.MutationObserver;
  const pauseObserver = typeof Observer === 'function' && doc?.body
    ? new Observer(syncMotion) : null;
  pauseObserver?.observe(doc.body,{attributes:true,attributeFilter:['class']});
  return {open,close,dispose() {
    if (disposed) return;
    reset(); disposed = true;
    controller.abort(); pauseObserver?.disconnect();
    if (!hadClass) dialog.classList.remove('detail-motion-enabled');
  }};
}
