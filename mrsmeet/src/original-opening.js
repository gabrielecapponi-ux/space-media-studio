/** Enter immediately. Load the original film and its styles on request. */
export function mountOriginalOpening({reducedMotion, onComplete} = {}) {
  const doc = document;
  const view = doc.defaultView;
  const lifecycle = new view.AbortController();
  const control = doc.getElementById('replay-intro');
  let disposed = false, lastCycle = 0, loader = null, pending = null;

  function endRequest() {
    pending = null;
    control?.removeAttribute('aria-busy');
  }

  function replay() {
    if (disposed || pending) return false;
    control?.focus({preventScroll:true});
    if (loader) return loader.replay();
    const request = import('./opening-film.js');
    pending = request;
    control?.setAttribute('aria-busy','true');
    request.then(({mountLoader}) => {
      if (request !== pending) return;
      if (control && doc.activeElement !== control) {
        endRequest();
        onComplete?.({reason:'replay-cancelled'});
        return;
      }
      loader = mountLoader({reducedMotion,autoStart:false});
      loader.replay();
      endRequest();
    }).catch(() => {
      if (request !== pending) return;
      endRequest();
      onComplete?.({reason:'replay-unavailable'});
    });
    return true;
  }

  function finish() {
    if (pending) {
      endRequest();
      onComplete?.({reason:'manual'});
      return true;
    }
    return !disposed && !!loader?.finish({immediate:true,reason:'manual'});
  }

  doc.addEventListener('smeet:entered', ({detail}) => {
    if (disposed || !loader || detail?.owner !== loader.id || detail.cycle <= lastCycle) return;
    lastCycle = detail.cycle;
    onComplete?.(detail);
  },{signal:lifecycle.signal});
  view.addEventListener('pagehide',() => {if (pending) finish();},{signal:lifecycle.signal});
  doc.body.classList.add('smeet-has-entered');
  onComplete?.({reason:doc.getElementById(doc.location.hash.slice(1)) ? 'direct-route' : 'menu'});
  return {replay,finish,dispose() {
    if (disposed) return;
    disposed = true;
    endRequest();
    lifecycle.abort();
    loader?.dispose();
  }};
}
